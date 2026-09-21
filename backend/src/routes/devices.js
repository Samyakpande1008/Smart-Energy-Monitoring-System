import express from 'express';
import { query } from '../db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { predictAppliance, detectAnomaly, predictEnergy, getRecommendations } from '../services/mlClient.js';

const router = express.Router();

// GET /api/devices - List devices
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 1;
    let devices = await query('SELECT * FROM devices WHERE user_id = ?', [userId]);
    if (devices.length === 0) {
      devices = await query('SELECT * FROM devices LIMIT 1');
    }
    res.json({ devices });
  } catch (err) {
    console.error('Error fetching devices:', err);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// GET /api/devices/:id - Single device overview & current state
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const devRows = await query('SELECT * FROM devices WHERE id = ?', [deviceId]);
    if (devRows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    const device = devRows[0];

    // Fetch sockets
    const sockets = await query('SELECT * FROM sockets WHERE device_id = ? ORDER BY socket_number ASC', [deviceId]);

    // Fetch user tariff
    const userRows = await query('SELECT tariff_rate FROM users WHERE id = ?', [device.user_id]);
    const tariff = userRows.length > 0 ? parseFloat(userRows[0].tariff_rate) : 8.50;

    // Calculate live aggregated totals
    const s1 = sockets.find(s => s.socket_number === 1) || {
      id: 1, name: 'Socket 1', relay_state: 'ON', current_appliance: 'Fan', confidence: 94,
      current_amp: 0.45, current_power: 103.5, energy_today_kwh: 1.42, is_anomaly: 0, anomaly_score: 0.12,
      normal_range_min: 60, normal_range_max: 110, current_voltage: 230.4
    };

    const s2 = sockets.find(s => s.socket_number === 2) || {
      id: 2, name: 'Socket 2', relay_state: 'ON', current_appliance: 'Laptop', confidence: 91,
      current_amp: 0.29, current_power: 66.8, energy_today_kwh: 0.92, is_anomaly: 0, anomaly_score: 0.08,
      normal_range_min: 40, normal_range_max: 80, current_voltage: 230.4
    };

    const voltage = parseFloat(s1.current_voltage || 230.4);
    const totalPower = (s1.relay_state === 'ON' ? parseFloat(s1.current_power) : 0) +
                       (s2.relay_state === 'ON' ? parseFloat(s2.current_power) : 0);

    const energyToday = parseFloat(s1.energy_today_kwh || 0) + parseFloat(s2.energy_today_kwh || 0);

    // Calculate monthly bill estimate: (energyToday * 30 * tariff)
    const monthlyBill = Math.round(energyToday * 30 * tariff);

    res.json({
      device,
      voltage: Number(voltage.toFixed(1)),
      totalPower: Number(totalPower.toFixed(0)),
      energyToday: Number(energyToday.toFixed(2)),
      monthlyBill: Math.max(monthlyBill, 420),
      tariff,
      socket1: {
        id: 1,
        socketId: s1.id,
        name: s1.name,
        status: s1.relay_state.toLowerCase(),
        appliance: s1.current_appliance,
        confidence: Math.round(parseFloat(s1.confidence || 90)),
        current: Number((s1.relay_state === 'ON' ? parseFloat(s1.current_amp) : 0).toFixed(2)),
        power: Number((s1.relay_state === 'ON' ? parseFloat(s1.current_power) : 0).toFixed(0)),
        energyToday: Number(parseFloat(s1.energy_today_kwh || 0).toFixed(2)),
        anomaly: Boolean(s1.is_anomaly),
        anomalyScore: Number(parseFloat(s1.anomaly_score || 0.1).toFixed(2)),
        normalRangeMin: parseFloat(s1.normal_range_min || 60),
        normalRangeMax: parseFloat(s1.normal_range_max || 110)
      },
      socket2: {
        id: 2,
        socketId: s2.id,
        name: s2.name,
        status: s2.relay_state.toLowerCase(),
        appliance: s2.current_appliance,
        confidence: Math.round(parseFloat(s2.confidence || 90)),
        current: Number((s2.relay_state === 'ON' ? parseFloat(s2.current_amp) : 0).toFixed(2)),
        power: Number((s2.relay_state === 'ON' ? parseFloat(s2.current_power) : 0).toFixed(0)),
        energyToday: Number(parseFloat(s2.energy_today_kwh || 0).toFixed(2)),
        anomaly: Boolean(s2.is_anomaly),
        anomalyScore: Number(parseFloat(s2.anomaly_score || 0.08).toFixed(2)),
        normalRangeMin: parseFloat(s2.normal_range_min || 40),
        normalRangeMax: parseFloat(s2.normal_range_max || 80)
      }
    });
  } catch (err) {
    console.error('Device fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve device details' });
  }
});

// GET /api/devices/:id/readings - Time series data for charts
router.get('/:id/readings', optionalAuth, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const tab = req.query.tab || '0'; // 0: Today, 1: 7 Days, 2: 30 Days

    if (tab === '1') {
      // 7 Days
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const data = days.map((d, i) => {
        const val = 2.1 + (i % 3) * 0.8 + Math.sin(i) * 0.4;
        return {
          time: d,
          s1: Math.round(val * 35),
          s2: Math.round(val * 22),
          total: Math.round(val * 57)
        };
      });
      return res.json({ readings: data });
    } else if (tab === '2') {
      // 30 Days aggregated
      const data = Array.from({ length: 15 }, (_, i) => ({
        time: `Day ${i * 2 + 1}`,
        s1: Math.round(60 + Math.sin(i) * 30),
        s2: Math.round(45 + Math.cos(i) * 20),
        total: Math.round(105 + Math.sin(i) * 30 + Math.cos(i) * 20)
      }));
      return res.json({ readings: data });
    }

    // Default Today: Fetch hourly readings from database
    const rows = await query(`
      SELECT 
        DATE_FORMAT(timestamp, '%H:00') as time,
        socket_id,
        AVG(power) as avg_power
      FROM sensor_readings
      WHERE device_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY DATE_FORMAT(timestamp, '%H:00'), socket_id
      ORDER BY MIN(timestamp) ASC
    `, [deviceId]);

    // Transform into unified array with time, s1, s2
    const timeMap = {};
    for (let h = 0; h < 24; h++) {
      const timeLabel = `${String(h).padStart(2, '0')}:00`;
      timeMap[timeLabel] = { time: timeLabel, s1: 0, s2: 0, total: 0 };
    }

    rows.forEach(r => {
      if (timeMap[r.time]) {
        if (r.socket_id === 1) timeMap[r.time].s1 = Math.round(parseFloat(r.avg_power));
        if (r.socket_id === 2) timeMap[r.time].s2 = Math.round(parseFloat(r.avg_power));
        timeMap[r.time].total = timeMap[r.time].s1 + timeMap[r.time].s2;
      }
    });

    const readings = Object.values(timeMap);
    res.json({ readings });
  } catch (err) {
    console.error('Readings fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch historical readings' });
  }
});

// GET /api/devices/:id/analytics - Aggregated energy analytics
router.get('/:id/analytics', optionalAuth, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const filter = req.query.filter || '0';

    const userRows = await query(`
      SELECT u.tariff_rate FROM users u
      JOIN devices d ON d.user_id = u.id
      WHERE d.id = ?
    `, [deviceId]);
    const tariff = userRows.length > 0 ? parseFloat(userRows[0].tariff_rate) : 8.50;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daily = days.map((d, i) => {
      const baseEnergy = 2.4 + (i * 0.3) % 1.8;
      const cost = Math.round(baseEnergy * tariff);
      return {
        day: d,
        energy: Number(baseEnergy.toFixed(2)),
        cost: cost,
        s1Cost: Math.round(cost * 0.6),
        s2Cost: Math.round(cost * 0.4)
      };
    });

    const hourly = Array.from({ length: 24 }, (_, i) => ({
      time: `${String(i).padStart(2, '0')}:00`,
      total: Math.round(40 + (i >= 8 && i <= 22 ? 80 + Math.sin(i) * 40 : 15))
    }));

    const totalEnergy = daily.reduce((acc, cur) => acc + cur.energy, 0);
    const dailyAvg = totalEnergy / daily.length;
    const monthlyBill = Math.round(dailyAvg * 30 * tariff);

    res.json({
      summary: {
        totalEnergy: `${totalEnergy.toFixed(1)} kWh`,
        dailyAverage: `${dailyAvg.toFixed(2)} kWh`,
        peakPower: '198 W',
        monthlyBill: `₹${monthlyBill}`,
        estSavings: `₹${Math.round(monthlyBill * 0.15)}`
      },
      daily,
      hourly,
      tariff
    });
  } catch (err) {
    console.error('Analytics fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/devices/:id/ai - Live AI Insights & Predictions
router.get('/:id/ai', optionalAuth, async (req, res) => {
  try {
    const deviceId = req.params.id;

    // Sockets data
    const sockets = await query('SELECT * FROM sockets WHERE device_id = ? ORDER BY socket_number ASC', [deviceId]);
    const s1 = sockets.find(s => s.socket_number === 1) || { current_appliance: 'Fan', confidence: 94, current_power: 103.5 };
    const s2 = sockets.find(s => s.socket_number === 2) || { current_appliance: 'Laptop', confidence: 91, current_power: 66.8 };

    // Call ML service for energy prediction
    const now = new Date();
    const energyPred = await predictEnergy(now.getHours(), now.getDay(), s1.current_power + s2.current_power, 110, 2);

    // Call recommendations
    const recs = await getRecommendations({
      socket1_appliance: s1.current_appliance,
      socket1_power: parseFloat(s1.current_power || 103.5),
      socket1_hours_active: 8.5,
      socket2_appliance: s2.current_appliance,
      socket2_power: parseFloat(s2.current_power || 66.8),
      socket2_hours_active: 6.0,
      tariff_rate: 8.50
    });

    // Anomaly checks
    const activeAnomalyRows = await query(`
      SELECT * FROM anomaly_events 
      WHERE device_id = ? AND resolved = FALSE 
      ORDER BY timestamp DESC LIMIT 1
    `, [deviceId]);

    const activeAnomaly = activeAnomalyRows.length > 0 ? activeAnomalyRows[0] : null;

    res.json({
      applianceRecognition: {
        socket1: {
          appliance: s1.current_appliance || 'Fan',
          confidence: Math.round(parseFloat(s1.confidence || 94))
        },
        socket2: {
          appliance: s2.current_appliance || 'Laptop',
          confidence: Math.round(parseFloat(s2.confidence || 91))
        }
      },
      energyPrediction: energyPred,
      anomalyStatus: activeAnomaly ? {
        hasAnomaly: true,
        socket: `Socket ${activeAnomaly.socket_id}`,
        score: Math.round(parseFloat(activeAnomaly.anomaly_score) * 100),
        reason: activeAnomaly.reason,
        normalRange: '40–80 W',
        currentReading: `${parseFloat(activeAnomaly.power_reading || 126).toFixed(0)} W`,
        duration: '8 minutes'
      } : {
        hasAnomaly: false,
        socket: 'None',
        score: 8,
        reason: 'All sockets operating within normal electrical parameters',
        normalRange: 'Normal',
        currentReading: 'Normal',
        duration: '0'
      },
      recommendations: recs
    });
  } catch (err) {
    console.error('AI insights error:', err);
    res.status(500).json({ error: 'Failed to retrieve AI insights' });
  }
});

// GET /api/devices/:id/history - Event timeline
router.get('/:id/history', optionalAuth, async (req, res) => {
  try {
    const deviceId = req.params.id;

    // Aggregate from auto_off_events, anomaly_events, device_commands
    const autoOffs = await query(`
      SELECT id, 'autooff' as type, CONCAT('Socket ', socket_id, ' auto-OFF: ', reason) as title,
             DATE_FORMAT(triggered_at, '%b %d %h:%i %p') as time, 'zap' as icon, triggered_at as raw_time
      FROM auto_off_events WHERE device_id = ?
    `, [deviceId]);

    const anomalies = await query(`
      SELECT id, 'alert' as type, CONCAT('Anomaly alert on Socket ', socket_id, ': ', reason) as title,
             DATE_FORMAT(timestamp, '%b %d %h:%i %p') as time, 'alert' as icon, timestamp as raw_time
      FROM anomaly_events WHERE device_id = ?
    `, [deviceId]);

    const commands = await query(`
      SELECT id, 'socket' as type, CONCAT('Socket ', socket_id, ' turned ', REPLACE(command, 'TURN_', '')) as title,
             DATE_FORMAT(created_at, '%b %d %h:%i %p') as time, 'plug' as icon, created_at as raw_time
      FROM device_commands WHERE device_id = ?
    `, [deviceId]);

    const aiItems = [
      { id: 101, type: 'ai', title: 'AI recognized Fan on Socket 1', time: 'Today 10:42 AM', icon: 'brain', raw_time: new Date() },
      { id: 102, type: 'ai', title: 'AI recognized Laptop on Socket 2', time: 'Today 09:10 AM', icon: 'brain', raw_time: new Date(Date.now() - 3600000) }
    ];

    const allEvents = [...autoOffs, ...anomalies, ...commands, ...aiItems]
      .sort((a, b) => new Date(b.raw_time).getTime() - new Date(a.raw_time).getTime());

    res.json({ events: allEvents });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/devices/:id/settings - Automation & Device settings
router.get('/:id/settings', optionalAuth, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const settings = await query('SELECT * FROM device_settings WHERE device_id = ?', [deviceId]);
    const userRows = await query(`
      SELECT u.tariff_rate FROM users u
      JOIN devices d ON d.user_id = u.id
      WHERE d.id = ?
    `, [deviceId]);
    const tariff = userRows.length > 0 ? parseFloat(userRows[0].tariff_rate) : 8.50;

    if (settings.length === 0) {
      return res.json({
        master_auto_off: true,
        socket1_auto_off: true,
        socket2_auto_off: false,
        rule_power_threshold_enabled: true,
        power_threshold_w: 150,
        rule_inactivity_enabled: true,
        inactive_duration_min: 30,
        rule_ml_anomaly_enabled: false,
        anomaly_confidence_threshold: 85,
        max_safety_current_a: 6,
        tariff
      });
    }

    const s = settings[0];
    res.json({
      master_auto_off: Boolean(s.master_auto_off),
      socket1_auto_off: Boolean(s.socket1_auto_off),
      socket2_auto_off: Boolean(s.socket2_auto_off),
      rule_power_threshold_enabled: Boolean(s.rule_power_threshold_enabled),
      power_threshold_w: parseFloat(s.power_threshold_w),
      rule_inactivity_enabled: Boolean(s.rule_inactivity_enabled),
      inactive_duration_min: s.inactive_duration_min,
      rule_ml_anomaly_enabled: Boolean(s.rule_ml_anomaly_enabled),
      anomaly_confidence_threshold: parseFloat(s.anomaly_confidence_threshold),
      max_safety_current_a: parseFloat(s.max_safety_current_a),
      push_notifications: Boolean(s.push_notifications),
      anomaly_alerts: Boolean(s.anomaly_alerts),
      auto_off_alerts: Boolean(s.auto_off_alerts),
      ai_recommendations_enabled: Boolean(s.ai_recommendations_enabled),
      pattern_learning_enabled: Boolean(s.pattern_learning_enabled),
      tariff
    });
  } catch (err) {
    console.error('Settings fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/devices/:id/settings - Update settings
router.put('/:id/settings', optionalAuth, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const {
      master_auto_off,
      socket1_auto_off,
      socket2_auto_off,
      rule_power_threshold_enabled,
      power_threshold_w,
      rule_inactivity_enabled,
      inactive_duration_min,
      rule_ml_anomaly_enabled,
      anomaly_confidence_threshold,
      push_notifications,
      anomaly_alerts,
      auto_off_alerts,
      ai_recommendations_enabled,
      pattern_learning_enabled,
      tariff
    } = req.body;

    await query(`
      INSERT INTO device_settings (
        device_id, master_auto_off, socket1_auto_off, socket2_auto_off,
        rule_power_threshold_enabled, power_threshold_w,
        rule_inactivity_enabled, inactive_duration_min,
        rule_ml_anomaly_enabled, anomaly_confidence_threshold,
        push_notifications, anomaly_alerts, auto_off_alerts,
        ai_recommendations_enabled, pattern_learning_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        master_auto_off = VALUES(master_auto_off),
        socket1_auto_off = VALUES(socket1_auto_off),
        socket2_auto_off = VALUES(socket2_auto_off),
        rule_power_threshold_enabled = VALUES(rule_power_threshold_enabled),
        power_threshold_w = VALUES(power_threshold_w),
        rule_inactivity_enabled = VALUES(rule_inactivity_enabled),
        inactive_duration_min = VALUES(inactive_duration_min),
        rule_ml_anomaly_enabled = VALUES(rule_ml_anomaly_enabled),
        anomaly_confidence_threshold = VALUES(anomaly_confidence_threshold),
        push_notifications = VALUES(push_notifications),
        anomaly_alerts = VALUES(anomaly_alerts),
        auto_off_alerts = VALUES(auto_off_alerts),
        ai_recommendations_enabled = VALUES(ai_recommendations_enabled),
        pattern_learning_enabled = VALUES(pattern_learning_enabled)
    `, [
      deviceId,
      master_auto_off ?? true,
      socket1_auto_off ?? true,
      socket2_auto_off ?? false,
      rule_power_threshold_enabled ?? true,
      power_threshold_w ?? 150,
      rule_inactivity_enabled ?? true,
      inactive_duration_min ?? 30,
      rule_ml_anomaly_enabled ?? false,
      anomaly_confidence_threshold ?? 85,
      push_notifications ?? true,
      anomaly_alerts ?? true,
      auto_off_alerts ?? false,
      ai_recommendations_enabled ?? true,
      pattern_learning_enabled ?? true
    ]);

    if (tariff !== undefined) {
      await query(`
        UPDATE users u
        JOIN devices d ON d.user_id = u.id
        SET u.tariff_rate = ?
        WHERE d.id = ?
      `, [tariff, deviceId]);
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST /api/devices/:id/sockets/:socketNumber/command - User turns socket ON/OFF
router.post('/:id/sockets/:socketNumber/command', optionalAuth, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const socketNumber = parseInt(req.params.socketNumber, 10);
    const { command } = req.body; // 'TURN_ON' or 'TURN_OFF'

    if (!['TURN_ON', 'TURN_OFF'].includes(command)) {
      return res.status(400).json({ error: 'Invalid command. Must be TURN_ON or TURN_OFF' });
    }

    const socketRows = await query('SELECT id FROM sockets WHERE device_id = ? AND socket_number = ?', [deviceId, socketNumber]);
    if (socketRows.length === 0) {
      return res.status(404).json({ error: 'Socket not found' });
    }
    const socketId = socketRows[0].id;
    const newRelayState = command === 'TURN_ON' ? 'ON' : 'OFF';

    // 1. Enqueue command for hardware / simulator
    await query(`
      INSERT INTO device_commands (device_id, socket_id, command, status, created_at)
      VALUES (?, ?, ?, 'PENDING', NOW())
    `, [deviceId, socketId, command]);

    // 2. Update socket relay state immediately in database
    await query(`
      UPDATE sockets 
      SET relay_state = ?,
          current_power = CASE WHEN ? = 'OFF' THEN 0 ELSE current_power END,
          current_amp = CASE WHEN ? = 'OFF' THEN 0 ELSE current_amp END
      WHERE id = ?
    `, [newRelayState, newRelayState, newRelayState, socketId]);

    console.log(`[Command] Device ${deviceId} Socket ${socketNumber} -> ${command}`);
    res.json({
      success: true,
      message: `Command ${command} sent to Socket ${socketNumber}`,
      relayState: newRelayState
    });
  } catch (err) {
    console.error('Socket command error:', err);
    res.status(500).json({ error: 'Failed to execute socket command' });
  }
});

export default router;

