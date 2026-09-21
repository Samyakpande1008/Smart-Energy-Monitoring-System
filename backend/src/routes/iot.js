import express from 'express';
import { query } from '../db.js';
import { predictAppliance, detectAnomaly } from '../services/mlClient.js';
import { evaluateAutoOffRules } from '../services/decisionEngine.js';

const router = express.Router();

// Helper to look up device by code or id
async function getDevice(deviceIdentifier) {
  const isNumeric = !isNaN(deviceIdentifier);
  const rows = await query(
    isNumeric 
      ? 'SELECT * FROM devices WHERE id = ? OR device_code = ? LIMIT 1'
      : 'SELECT * FROM devices WHERE device_code = ? LIMIT 1',
    isNumeric ? [deviceIdentifier, deviceIdentifier] : [deviceIdentifier]
  );
  return rows.length > 0 ? rows[0] : null;
}

// POST /api/iot/readings - Telemetry Ingestion (ESP32 & Simulator)
router.post('/readings', async (req, res) => {
  try {
    const { device_id, voltage = 230.0, socket1, socket2, timestamp } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const device = await getDevice(device_id);
    if (!device) {
      return res.status(404).json({ error: `Device ${device_id} not registered` });
    }

    // Fetch sockets for this device
    const sockets = await query('SELECT * FROM sockets WHERE device_id = ? ORDER BY socket_number ASC', [device.id]);
    const sock1 = sockets.find(s => s.socket_number === 1);
    const sock2 = sockets.find(s => s.socket_number === 2);

    const v = Number(parseFloat(voltage).toFixed(2));
    const now = timestamp ? new Date(timestamp) : new Date();

    // Ingest Socket 1
    if (socket1 && sock1) {
      const s1Curr = Number(parseFloat(socket1.current || 0).toFixed(3));
      const s1Pow = Number(parseFloat(socket1.power || 0).toFixed(2));
      // delta energy for ~3s interval: Power * 3s / (3600 * 1000) kWh
      const deltaEnergy = Number((s1Pow * 3.0 / 3600000.0).toFixed(6));
      const newEnergyToday = Number((parseFloat(sock1.energy_today_kwh || 0) + deltaEnergy).toFixed(4));

      // Record reading in sensor_readings
      await query(`
        INSERT INTO sensor_readings (device_id, socket_id, voltage, current, power, energy_kwh, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [device.id, sock1.id, v, s1Curr, s1Pow, deltaEnergy, now]);

      // ML Inference: Appliance & Anomaly
      const appResult = await predictAppliance(v, s1Curr, s1Pow);
      const anomResult = await detectAnomaly(v, s1Curr, s1Pow, sock1.current_appliance);

      // Decision Engine: Evaluate Smart Auto-OFF
      const autoOffRes = await evaluateAutoOffRules(device.id, sock1.id, 1, { current: s1Curr, power: s1Pow }, anomResult);

      // Update socket record
      await query(`
        UPDATE sockets 
        SET current_voltage = ?,
            current_amp = ?,
            current_power = ?,
            energy_today_kwh = ?,
            current_appliance = ?,
            confidence = ?,
            is_anomaly = ?,
            anomaly_score = ?
        WHERE id = ?
      `, [
        v, s1Curr, s1Pow, newEnergyToday,
        appResult.appliance, Math.round(appResult.confidence * 100),
        anomResult.is_anomaly ? 1 : 0, Number((anomResult.anomaly_score).toFixed(2)),
        sock1.id
      ]);

      // Save anomaly event if newly flagged
      if (anomResult.is_anomaly && anomResult.anomaly_score > 0.75) {
        await query(`
          INSERT INTO anomaly_events (device_id, socket_id, is_anomaly, anomaly_score, reason, power_reading, resolved, timestamp)
          VALUES (?, ?, TRUE, ?, ?, ?, FALSE, NOW())
        `, [device.id, sock1.id, anomResult.anomaly_score, anomResult.reason, s1Pow]);
      }
    }

    // Ingest Socket 2
    if (socket2 && sock2) {
      const s2Curr = Number(parseFloat(socket2.current || 0).toFixed(3));
      const s2Pow = Number(parseFloat(socket2.power || 0).toFixed(2));
      const deltaEnergy = Number((s2Pow * 3.0 / 3600000.0).toFixed(6));
      const newEnergyToday = Number((parseFloat(sock2.energy_today_kwh || 0) + deltaEnergy).toFixed(4));

      await query(`
        INSERT INTO sensor_readings (device_id, socket_id, voltage, current, power, energy_kwh, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [device.id, sock2.id, v, s2Curr, s2Pow, deltaEnergy, now]);

      const appResult = await predictAppliance(v, s2Curr, s2Pow);
      const anomResult = await detectAnomaly(v, s2Curr, s2Pow, sock2.current_appliance);

      const autoOffRes = await evaluateAutoOffRules(device.id, sock2.id, 2, { current: s2Curr, power: s2Pow }, anomResult);

      await query(`
        UPDATE sockets 
        SET current_voltage = ?,
            current_amp = ?,
            current_power = ?,
            energy_today_kwh = ?,
            current_appliance = ?,
            confidence = ?,
            is_anomaly = ?,
            anomaly_score = ?
        WHERE id = ?
      `, [
        v, s2Curr, s2Pow, newEnergyToday,
        appResult.appliance, Math.round(appResult.confidence * 100),
        anomResult.is_anomaly ? 1 : 0, Number((anomResult.anomaly_score).toFixed(2)),
        sock2.id
      ]);

      if (anomResult.is_anomaly && anomResult.anomaly_score > 0.75) {
        await query(`
          INSERT INTO anomaly_events (device_id, socket_id, is_anomaly, anomaly_score, reason, power_reading, resolved, timestamp)
          VALUES (?, ?, TRUE, ?, ?, ?, FALSE, NOW())
        `, [device.id, sock2.id, anomResult.anomaly_score, anomResult.reason, s2Pow]);
      }
    }

    // Check for pending relay commands
    const pendingCmds = await query(`
      SELECT c.id, c.socket_id, s.socket_number, c.command 
      FROM device_commands c
      JOIN sockets s ON s.id = c.socket_id
      WHERE c.device_id = ? AND c.status = 'PENDING'
    `, [device.id]);

    res.json({
      success: true,
      pending_commands: pendingCmds
    });
  } catch (err) {
    console.error('IoT Ingestion error:', err);
    res.status(500).json({ error: 'Failed to process sensor telemetry' });
  }
});

// POST /api/iot/heartbeat - Device Online status & Wi-Fi stats
router.post('/heartbeat', async (req, res) => {
  try {
    const { device_id, wifi_ssid, rssi, firmware_version, socket1_relay, socket2_relay } = req.body;
    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const device = await getDevice(device_id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    await query(`
      UPDATE devices 
      SET status = 'ONLINE',
          wifi_status = 'Connected',
          wifi_ssid = COALESCE(?, wifi_ssid),
          rssi = COALESCE(?, rssi),
          firmware_version = COALESCE(?, firmware_version),
          last_heartbeat = NOW()
      WHERE id = ?
    `, [wifi_ssid, rssi, firmware_version, device.id]);

    // Check pending commands
    const pendingCmds = await query(`
      SELECT c.id, c.socket_id, s.socket_number, c.command 
      FROM device_commands c
      JOIN sockets s ON s.id = c.socket_id
      WHERE c.device_id = ? AND c.status = 'PENDING'
    `, [device.id]);

    res.json({
      status: 'ONLINE',
      pending_commands: pendingCmds
    });
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ error: 'Failed to record heartbeat' });
  }
});

// GET /api/iot/devices/:device_id/commands - Poll pending commands
router.get('/devices/:device_id/commands', async (req, res) => {
  try {
    const device = await getDevice(req.params.device_id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const pendingCmds = await query(`
      SELECT c.id, c.socket_id, s.socket_number, c.command 
      FROM device_commands c
      JOIN sockets s ON s.id = c.socket_id
      WHERE c.device_id = ? AND c.status = 'PENDING'
    `, [device.id]);

    res.json({ commands: pendingCmds });
  } catch (err) {
    console.error('Fetch commands error:', err);
    res.status(500).json({ error: 'Failed to fetch commands' });
  }
});

// POST /api/iot/devices/:device_id/commands/:command_id/ack - Acknowledge command execution
router.post('/devices/:device_id/commands/:command_id/ack', async (req, res) => {
  try {
    const { device_id, command_id } = req.params;
    await query(`
      UPDATE device_commands 
      SET status = 'EXECUTED', executed_at = NOW() 
      WHERE id = ?
    `, [command_id]);

    res.json({ success: true, message: 'Command acknowledged' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge command' });
  }
});

export default router;

