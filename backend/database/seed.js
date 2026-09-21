import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'samyak@2006',
    database: process.env.DB_NAME || 'smart_energy_guardian',
    multipleStatements: true
  });

  try {
    console.log('Seeding Smart Energy Guardian database...');

    // Hash development passwords
    const passwordHash = await bcrypt.hash('demo1234', 10);

    // 1. Insert or update users
    const [userRes] = await connection.query(`
      INSERT INTO users (id, name, email, password_hash, tariff_rate)
      VALUES 
        (1, 'Vishwajeet', 'vishwajeet@example.com', ?, 8.50),
        (2, 'Demo User', 'demo@smartenergy.local', ?, 8.50)
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        password_hash = VALUES(password_hash),
        tariff_rate = VALUES(tariff_rate);
    `, [passwordHash, passwordHash]);

    // 2. Insert or update Device
    await connection.query(`
      INSERT INTO devices (id, device_code, device_name, user_id, status, wifi_status, wifi_ssid, rssi, firmware_version, hardware_type)
      VALUES (1, 'SG-001', 'Smart Energy Guardian #001', 1, 'ONLINE', 'Connected', 'HomeNetwork_5G', -52, 'v1.0.0', 'ESP32')
      ON DUPLICATE KEY UPDATE
        device_name = VALUES(device_name),
        status = VALUES(status),
        wifi_status = VALUES(wifi_status),
        rssi = VALUES(rssi);
    `);

    // 3. Insert or update Sockets
    await connection.query(`
      INSERT INTO sockets (id, device_id, socket_number, name, relay_state, current_appliance, confidence, current_voltage, current_amp, current_power, energy_today_kwh, is_anomaly, anomaly_score, normal_range_min, normal_range_max)
      VALUES 
        (1, 1, 1, 'Socket 1', 'ON', 'Fan', 94.00, 230.4, 0.45, 103.5, 1.42, FALSE, 0.12, 60.0, 110.0),
        (2, 1, 2, 'Socket 2', 'ON', 'Laptop', 91.00, 230.4, 0.29, 66.8, 0.92, FALSE, 0.08, 40.0, 80.0)
      ON DUPLICATE KEY UPDATE
        relay_state = VALUES(relay_state),
        current_appliance = VALUES(current_appliance),
        confidence = VALUES(confidence),
        current_voltage = VALUES(current_voltage),
        current_amp = VALUES(current_amp),
        current_power = VALUES(current_power),
        energy_today_kwh = VALUES(energy_today_kwh);
    `);

    // 4. Insert or update Device Settings
    await connection.query(`
      INSERT INTO device_settings (
        device_id, master_auto_off, socket1_auto_off, socket2_auto_off,
        rule_power_threshold_enabled, power_threshold_w,
        rule_inactivity_enabled, inactive_duration_min,
        rule_ml_anomaly_enabled, anomaly_confidence_threshold,
        max_safety_current_a, push_notifications, anomaly_alerts, auto_off_alerts,
        ai_recommendations_enabled, pattern_learning_enabled
      ) VALUES (
        1, TRUE, TRUE, FALSE,
        TRUE, 150.00,
        TRUE, 30,
        FALSE, 85.00,
        6.00, TRUE, TRUE, FALSE,
        TRUE, TRUE
      ) ON DUPLICATE KEY UPDATE
        master_auto_off = VALUES(master_auto_off),
        socket1_auto_off = VALUES(socket1_auto_off),
        power_threshold_w = VALUES(power_threshold_w);
    `);

    // 5. Seed historical readings for the past 48 hours (hourly aggregated)
    console.log('Generating 48 hours of realistic historical sensor readings...');
    // Delete existing readings for clean seed if needed
    await connection.query('DELETE FROM sensor_readings WHERE device_id = 1');

    const readings = [];
    const now = new Date();

    for (let hoursAgo = 48; hoursAgo >= 0; hoursAgo--) {
      const timestamp = new Date(now.getTime() - hoursAgo * 3600 * 1000);
      const hourOfDay = timestamp.getHours();

      // Realistic diurnal variation:
      // Socket 1 (Fan): active heavily daytime and night, ~80-110W
      // Socket 2 (Laptop): active workday (9am - 8pm), ~50-75W
      const s1Active = (hourOfDay >= 0 && hourOfDay <= 6) || (hourOfDay >= 11 && hourOfDay <= 23);
      const s2Active = hourOfDay >= 9 && hourOfDay <= 20;

      const s1BasePower = s1Active ? (85 + Math.sin(hourOfDay) * 15 + (Math.random() * 8 - 4)) : 0;
      const s2BasePower = s2Active ? (60 + Math.cos(hourOfDay) * 10 + (Math.random() * 6 - 3)) : 0;

      const voltage = +(228 + Math.random() * 5).toFixed(1);
      const s1Current = s1Active ? +(s1BasePower / voltage).toFixed(3) : 0;
      const s2Current = s2Active ? +(s2BasePower / voltage).toFixed(3) : 0;

      // Hourly energy in kWh = Power(W) * 1h / 1000
      const s1Energy = +(s1BasePower / 1000).toFixed(4);
      const s2Energy = +(s2BasePower / 1000).toFixed(4);

      readings.push([1, 1, voltage, s1Current, +s1BasePower.toFixed(2), s1Energy, timestamp]);
      readings.push([1, 2, voltage, s2Current, +s2BasePower.toFixed(2), s2Energy, timestamp]);
    }

    // Batch insert readings
    const insertReadingsQuery = `
      INSERT INTO sensor_readings (device_id, socket_id, voltage, current, power, energy_kwh, timestamp)
      VALUES ?
    `;
    await connection.query(insertReadingsQuery, [readings]);
    console.log(`Inserted ${readings.length} sensor readings.`);

    // 6. Seed AI Recommendations
    await connection.query('DELETE FROM ai_recommendations WHERE device_id = 1');
    await connection.query(`
      INSERT INTO ai_recommendations (device_id, socket_id, type, title, recommendation_text, estimated_savings, timestamp)
      VALUES
        (1, 1, 'USAGE_PATTERN', 'Fan Power Deviation', 'Your fan is consuming 14% more energy than its baseline profile. Consider checking for blade dust or bearing resistance.', 72.00, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
        (1, 2, 'OPTIMIZATION', 'Extended Runtime Alert', 'Socket 2 (Laptop) has been drawing power continuously for 7.2 hours. Unplugging fully charged laptops saves standby drain.', 35.00, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
        (1, NULL, 'SAVING', 'Peak Hour Optimization', 'Estimated monthly saving: ₹120 by shifting non-essential appliance loads outside 6:00 PM – 9:00 PM peak tariff window.', 120.00, DATE_SUB(NOW(), INTERVAL 1 DAY))
    `);

    // 7. Seed Anomaly Events
    await connection.query('DELETE FROM anomaly_events WHERE device_id = 1');
    await connection.query(`
      INSERT INTO anomaly_events (device_id, socket_id, is_anomaly, anomaly_score, reason, power_reading, resolved, timestamp)
      VALUES
        (1, 2, TRUE, 0.87, 'Power consumption (126 W) significantly above learned laptop profile (40–80 W)', 126.00, FALSE, DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
        (1, 1, TRUE, 0.82, 'High initial surge current (5.8 A) detected upon relay connection', 1334.00, TRUE, DATE_SUB(NOW(), INTERVAL 18 HOUR))
    `);

    // 8. Seed Auto-OFF Events
    await connection.query('DELETE FROM auto_off_events WHERE device_id = 1');
    await connection.query(`
      INSERT INTO auto_off_events (device_id, socket_id, reason, rule_type, triggered_at)
      VALUES
        (1, 2, 'Unusual power consumption exceeding 120W threshold', 'UNUSUAL_POWER', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
        (1, 1, 'Extended inactivity (0W drawn for 45 minutes)', 'INACTIVITY', DATE_SUB(NOW(), INTERVAL 14 HOUR))
    `);

    console.log('✅ Database seeded successfully with demo accounts and rich telemetry!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await connection.end();
  }
}

seedDatabase();

