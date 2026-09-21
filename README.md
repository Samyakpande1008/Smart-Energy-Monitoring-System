# SMART ENERGY GUARDIAN

> **AI-Powered Smart Energy Monitoring & Intelligent Appliance Control System**
> An end-to-end IoT, Cloud, and Machine Learning application designed for real-time electrical telemetry, non-intrusive appliance recognition (NILM), anomaly detection, energy forecasting, and automated Smart Auto-OFF relay control.

---

## 🏗️ System Architecture

```
[ ESP32 Hardware / IoT Simulator ]
       │  POST /api/iot/readings (telemetry: voltage, current, power)
       │  POST /api/iot/heartbeat (Wi-Fi, RSSI, firmware, relay status)
       │  GET  /api/iot/devices/:id/commands (relay state sync)
       ▼
[ Node.js + Express Backend API ] (Port: 5000)
       ├── JWT Authentication & User Management
       ├── Device & Dual-Socket State Management
       ├── Decision Engine (Safety checks + Smart Auto-OFF logic)
       ├── Historical Aggregation & Analytics Engine
       │
       ├── MySQL Database (Port: 3306) (Database: smart_energy_guardian)
       │     (users, devices, sockets, sensor_readings, device_commands,
       │      appliance_predictions, anomaly_events, ai_recommendations,
       │      auto_off_events, device_settings)
       │
       └── Python ML Microservice (Port: 8000)
             ├── Random Forest Appliance Classifier (Fan, Laptop, TV, Bulb, Iron)
             ├── Isolation Forest Anomaly Detection
             ├── Energy Forecasting (Hourly trend & Regressor)
             └── AI Recommendation Engine
       ▲
       │ REST API / WebSocket
[ React 19 + Tailwind CSS Frontend ] (Port: 4173)
       (Dashboard, Appliances, Auto-OFF, AI Insights, Analytics, Device, History, Settings, Login)
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v20+ (Tested on v26.5.0)
- **MySQL**: 8.0+ running on `localhost:3306` with user `root` and password `samyak@2006`
- **Python**: 3.10+ (Tested on 3.14.3) with `fastapi`, `uvicorn`, `scikit-learn`, `pandas`, `numpy`, `joblib`

### 2. Database Migration & Seeding
From the root directory, run:
```bash
# Apply schema migrations
npm run db:migrate

# Seed demo users, device, sockets, and 48 hours of historical telemetry
npm run db:seed
```

### 3. Start the Python ML Service
```bash
# In a separate terminal
npm run ml
# ML Service will be active at http://127.0.0.1:8000
```

### 4. Start the Backend API
```bash
# In a separate terminal
npm run backend
# Backend API will be active at http://127.0.0.1:5000
```

### 5. Start the IoT Hardware Simulator
```bash
# In a separate terminal
npm run simulator
# Emulates ESP32 with realistic electrical dynamics for Socket 1 (Fan) & Socket 2 (Laptop)
```

### 6. Start the Frontend Dashboard
```bash
npm run dev
# Dashboard opens on http://localhost:4173
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Primary Demo User | `demo@smartenergy.local` | `demo1234` |
| Secondary Account | `vishwajeet@example.com` | `demo1234` |

---

## 🧠 Machine Learning Capabilities

### 1. Appliance Recognition (NILM)
- **Model**: `RandomForestClassifier` (100 estimators, max depth 12).
- **Features Analyzed**:
  - RMS Voltage ($V$)
  - RMS Current ($I$)
  - Average Active Power ($W$)
  - Peak Power & Minimum Power
  - Power Variance & Standard Deviation ($\sigma^2, \sigma$)
  - Current Variance
  - Energy Consumption Rate
- **Classes**: `Fan`, `Laptop`, `TV`, `Bulb`, `Iron`, `Unknown`.
- **Validation Accuracy**: 95.33%.

### 2. Anomaly Detection
- **Model**: `IsolationForest` (contamination 0.05).
- Detects abnormal electrical loads, power surges, and signatures diverging from baseline appliance consumption profiles.

### 3. Energy Forecasting
- Predicts next-hour kWh, expected today kWh, and estimated monthly electricity consumption using diurnal cyclic regression.

---

## 🛡️ Smart Auto-OFF & Decision Engine

The system enforces electrical safety through a dedicated decision engine:
1. **Critical Overcurrent (> 6.0 A)**: Enforces immediate shutdown regardless of software settings.
2. **Configurable Power Threshold**: Auto-OFF triggered if an appliance exceeds its configured threshold (e.g. 150 W).
3. **Inactivity Rule**: Auto-OFF triggered if 0 W drawn for an extended duration.
4. **AI-Detected Anomaly**: Auto-OFF triggered if an Isolation Forest anomaly score exceeds the user-configured confidence limit.

---

## 🔌 Future ESP32 Hardware Integration

The system is built so that physical hardware can replace the simulator with **ZERO changes to the frontend**:

### Hardware Specifications:
- **MCU**: ESP32 DevKit V1
- **Current Sensors**: 2 × ACS712 (20A Module) connected to ADC pins (e.g., GPIO 34, 35)
- **Voltage Sensor**: 1 × ZMPT101B AC Voltage Transformer Module connected to ADC pin (e.g., GPIO 32)
- **Relay**: 2-Channel 5V Optocoupler Relay Module connected to GPIO 18, 19
- **Load Sockets**: 2 × 230V AC Sockets

For the complete firmware schematic, JSON schema, and wiring instructions, refer to [IOT_HARDWARE_INTEGRATION.md](IOT_HARDWARE_INTEGRATION.md).

