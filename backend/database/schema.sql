-- ==========================================================
-- SMART ENERGY GUARDIAN - MySQL Database Schema
-- ==========================================================

CREATE DATABASE IF NOT EXISTS smart_energy_guardian
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_energy_guardian;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  tariff_rate DECIMAL(6, 2) NOT NULL DEFAULT 8.50,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Devices table
CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_code VARCHAR(50) NOT NULL UNIQUE,
  device_name VARCHAR(100) NOT NULL DEFAULT 'Smart Energy Guardian #001',
  user_id INT NOT NULL,
  status ENUM('ONLINE', 'OFFLINE') NOT NULL DEFAULT 'ONLINE',
  wifi_status VARCHAR(50) NOT NULL DEFAULT 'Connected',
  wifi_ssid VARCHAR(100) DEFAULT 'HomeNetwork_5G',
  rssi INT DEFAULT -52,
  firmware_version VARCHAR(20) NOT NULL DEFAULT 'v1.0.0',
  hardware_type VARCHAR(50) NOT NULL DEFAULT 'ESP32',
  last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Sockets table (2 sockets per device)
CREATE TABLE IF NOT EXISTS sockets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  socket_number TINYINT NOT NULL,
  name VARCHAR(50) NOT NULL,
  relay_state ENUM('ON', 'OFF') NOT NULL DEFAULT 'ON',
  current_appliance VARCHAR(50) DEFAULT 'Unknown',
  confidence DECIMAL(5, 2) DEFAULT 0.00,
  current_voltage DECIMAL(6, 2) DEFAULT 230.00,
  current_amp DECIMAL(6, 2) DEFAULT 0.00,
  current_power DECIMAL(8, 2) DEFAULT 0.00,
  energy_today_kwh DECIMAL(10, 4) DEFAULT 0.0000,
  is_anomaly BOOLEAN DEFAULT FALSE,
  anomaly_score DECIMAL(5, 2) DEFAULT 0.00,
  normal_range_min DECIMAL(8, 2) DEFAULT 40.00,
  normal_range_max DECIMAL(8, 2) DEFAULT 120.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_device_socket (device_id, socket_number),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Time-series Sensor Readings
CREATE TABLE IF NOT EXISTS sensor_readings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  socket_id INT NOT NULL,
  voltage DECIMAL(6, 2) NOT NULL,
  current DECIMAL(6, 3) NOT NULL,
  power DECIMAL(8, 2) NOT NULL,
  energy_kwh DECIMAL(12, 6) NOT NULL DEFAULT 0.000000,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_socket_time (device_id, socket_id, timestamp),
  INDEX idx_timestamp (timestamp),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (socket_id) REFERENCES sockets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Device Commands (Relay switching queue for ESP32 and Simulator)
CREATE TABLE IF NOT EXISTS device_commands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  socket_id INT NOT NULL,
  command ENUM('TURN_ON', 'TURN_OFF') NOT NULL,
  status ENUM('PENDING', 'SENT', 'EXECUTED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  executed_at DATETIME NULL,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (socket_id) REFERENCES sockets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Appliance Recognition Predictions
CREATE TABLE IF NOT EXISTS appliance_predictions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  socket_id INT NOT NULL,
  appliance VARCHAR(50) NOT NULL,
  confidence DECIMAL(5, 2) NOT NULL,
  raw_features_json JSON NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_appliance_time (device_id, socket_id, timestamp),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (socket_id) REFERENCES sockets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Anomaly Events
CREATE TABLE IF NOT EXISTS anomaly_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  socket_id INT NOT NULL,
  is_anomaly BOOLEAN NOT NULL DEFAULT TRUE,
  anomaly_score DECIMAL(5, 2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  power_reading DECIMAL(8, 2) NULL,
  resolved BOOLEAN DEFAULT FALSE,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_anomaly_time (device_id, timestamp),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (socket_id) REFERENCES sockets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Energy Predictions
CREATE TABLE IF NOT EXISTS energy_predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  prediction_period VARCHAR(50) NOT NULL DEFAULT 'TODAY',
  predicted_energy_kwh DECIMAL(8, 3) NOT NULL,
  actual_energy_kwh DECIMAL(8, 3) NULL,
  confidence DECIMAL(5, 2) NOT NULL DEFAULT 85.00,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  socket_id INT NULL,
  type ENUM('SAVING', 'ANOMALY', 'USAGE_PATTERN', 'OPTIMIZATION') NOT NULL,
  title VARCHAR(150) NOT NULL,
  recommendation_text TEXT NOT NULL,
  estimated_savings DECIMAL(8, 2) DEFAULT 0.00,
  dismissed BOOLEAN DEFAULT FALSE,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (socket_id) REFERENCES sockets(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 10. Auto-OFF Events
CREATE TABLE IF NOT EXISTS auto_off_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  socket_id INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  rule_type ENUM('OVERCURRENT', 'UNUSUAL_POWER', 'INACTIVITY', 'ML_ANOMALY', 'MANUAL') NOT NULL,
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (socket_id) REFERENCES sockets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Device & Automation Settings
CREATE TABLE IF NOT EXISTS device_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL UNIQUE,
  master_auto_off BOOLEAN NOT NULL DEFAULT TRUE,
  socket1_auto_off BOOLEAN NOT NULL DEFAULT TRUE,
  socket2_auto_off BOOLEAN NOT NULL DEFAULT FALSE,
  rule_power_threshold_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  power_threshold_w DECIMAL(8, 2) NOT NULL DEFAULT 150.00,
  rule_inactivity_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  inactive_duration_min INT NOT NULL DEFAULT 30,
  rule_ml_anomaly_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  anomaly_confidence_threshold DECIMAL(5, 2) NOT NULL DEFAULT 85.00,
  max_safety_current_a DECIMAL(5, 2) NOT NULL DEFAULT 6.00,
  push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  anomaly_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  auto_off_alerts BOOLEAN NOT NULL DEFAULT FALSE,
  ai_recommendations_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  pattern_learning_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

