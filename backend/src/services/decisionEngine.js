import { query } from '../db.js';

/**
 * Intelligent Smart Auto-OFF & Safety Decision Engine
 * 
 * Flow:
 * Sensor Telemetry -> ML Assessment -> Safety Checks & Rule Evaluation -> Auto-OFF Decision -> Relay Command
 */
export async function evaluateAutoOffRules(deviceId, socketId, socketNumber, reading, anomalyResult) {
  try {
    // 1. Retrieve current device and automation settings
    const settingsRows = await query(
      'SELECT * FROM device_settings WHERE device_id = ?',
      [deviceId]
    );

    if (!settingsRows || settingsRows.length === 0) {
      return null;
    }

    const settings = settingsRows[0];
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
      max_safety_current_a
    } = settings;

    // Check socket-specific switch
    const socketEnabled = socketNumber === 1 ? socket1_auto_off : socket2_auto_off;

    let shouldTurnOff = false;
    let autoOffReason = null;
    let ruleType = null;

    // PRIORITY 1: Absolute Hardware Safety Check (Overcurrent > safety limit)
    // Always evaluated regardless of whether master_auto_off is enabled.
    const safetyLimit = max_safety_current_a || 6.0;
    if (reading.current >= safetyLimit) {
      shouldTurnOff = true;
      ruleType = 'OVERCURRENT';
      autoOffReason = `CRITICAL OVERCURRENT: Current draw (${reading.current.toFixed(2)} A) exceeded hardware safety threshold (${safetyLimit.toFixed(1)} A)`;
    }

    // PRIORITY 2: Intelligent Automation Rules (requires master_auto_off and socketEnabled)
    if (!shouldTurnOff && master_auto_off && socketEnabled) {
      // Rule A: Configurable Power Threshold exceeded
      if (rule_power_threshold_enabled && reading.power > power_threshold_w) {
        shouldTurnOff = true;
        ruleType = 'UNUSUAL_POWER';
        autoOffReason = `Power threshold exceeded: Drawing ${reading.power.toFixed(1)} W (configured limit: ${power_threshold_w.toFixed(0)} W)`;
      }

      // Rule B: ML Anomaly Detection trigger
      if (!shouldTurnOff && rule_ml_anomaly_enabled && anomalyResult && anomalyResult.is_anomaly) {
        const scorePercent = anomalyResult.anomaly_score * 100;
        if (scorePercent >= anomaly_confidence_threshold) {
          shouldTurnOff = true;
          ruleType = 'ML_ANOMALY';
          autoOffReason = `AI Anomaly detected: ${anomalyResult.reason} (Confidence: ${scorePercent.toFixed(0)}%)`;
        }
      }
    }

    // If decision engine triggered a shutdown:
    if (shouldTurnOff) {
      console.log(`[Decision Engine] AUTO-OFF TRIGGERED for Device ${deviceId}, Socket ${socketNumber}: ${autoOffReason}`);

      // 1. Record the Auto-OFF event in audit log
      await query(
        `INSERT INTO auto_off_events (device_id, socket_id, reason, rule_type, triggered_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [deviceId, socketId, autoOffReason, ruleType]
      );

      // 2. Queue command for ESP32 / Simulator
      await query(
        `INSERT INTO device_commands (device_id, socket_id, command, status, created_at)
         VALUES (?, ?, 'TURN_OFF', 'PENDING', NOW())`,
        [deviceId, socketId]
      );

      // 3. Update the socket state in database
      await query(
        `UPDATE sockets 
         SET relay_state = 'OFF', current_power = 0.00, current_amp = 0.00
         WHERE id = ?`,
        [socketId]
      );

      return {
        triggered: true,
        rule_type: ruleType,
        reason: autoOffReason
      };
    }

    return { triggered: false };
  } catch (err) {
    console.error('[Decision Engine Error]:', err);
    return null;
  }
}

