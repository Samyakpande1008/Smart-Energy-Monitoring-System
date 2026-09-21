# ESP32 Physical Hardware Integration Guide

This guide describes how to connect physical hardware to replace the software simulator without modifying the frontend or backend architecture.

---

## 1. Hardware Bill of Materials (BOM)

| Component | Part | Purpose | Pin Connection (ESP32) |
|---|---|---|---|
| **Microcontroller** | ESP32 DevKit V1 (30-pin / 38-pin) | Processing, Wi-Fi telemetry & control | Micro-USB / 5V Regulated Power |
| **Current Sensor 1** | ACS712 20A Current Sensor Module | Measures current on AC Socket 1 | `VCC` -> 5V, `GND` -> GND, `OUT` -> `GPIO 34` (ADC1) |
| **Current Sensor 2** | ACS712 20A Current Sensor Module | Measures current on AC Socket 2 | `VCC` -> 5V, `GND` -> GND, `OUT` -> `GPIO 35` (ADC1) |
| **Voltage Sensor** | ZMPT101B Active AC Voltage Transformer | Measures AC mains RMS voltage | `VCC` -> 5V, `GND` -> GND, `OUT` -> `GPIO 32` (ADC1) |
| **Relay Module** | 2-Channel 5V Relay with Optocoupler | Switches AC Line for Sockets 1 & 2 | `IN1` -> `GPIO 18`, `IN2` -> `GPIO 19`, `VCC` -> 5V |
| **Power Supply** | Hi-Link HLK-PM01 (5V 600mA AC-DC) | Steps down 230V AC to 5V DC onboard | AC Mains -> 5V DC -> ESP32 VIN & Modules |
| **Sockets** | 2 × 3-Pin AC Mains Sockets | Plug receptacles for monitored appliances | Switched via Relay Normally Open (NO) |

---

## 2. Electrical Wiring & Safety Precautions

> [!CAUTION]
> **HIGH VOLTAGE WARNING (230V AC)**:
> - Never assemble or touch 230V AC wiring on a breadboard or with loose jumper wires.
> - Always house the relay and AC connections inside a non-conductive, flame-retardant electrical enclosure.
> - Use proper screw terminals and insulated heat-shrink tubing on all 230V AC lines.
> - Keep low-voltage DC signals (ESP32, sensor outputs) physically separated by at least 15mm from high-voltage AC traces.

### AC Mains Routing:
1. **Live Wire (Phase)**:
   - Connect AC Live from mains cord through a 10A fast-blow fuse.
   - Route Live through ZMPT101B input terminals.
   - Branch Live to Common (COM) terminal of Relay 1 and Relay 2.
   - From Relay 1 Normally Open (NO) -> ACS712 #1 terminal 1 -> ACS712 #1 terminal 2 -> Socket 1 Live pin.
   - From Relay 2 Normally Open (NO) -> ACS712 #2 terminal 1 -> ACS712 #2 terminal 2 -> Socket 2 Live pin.
2. **Neutral Wire**:
   - Common Neutral connected to ZMPT101B Neutral, Socket 1 Neutral, Socket 2 Neutral, and HLK-PM01 AC-N.
3. **Earth Ground Wire**:
   - Connected directly to the ground pins of Socket 1 and Socket 2.

---

## 3. Communication API Contract

The ESP32 communicates with the backend via standard HTTP REST requests.

### A. Telemetry Telemetry Stream: `POST /api/iot/readings`
The ESP32 sends sampled RMS telemetry every 2.5 seconds:
```json
POST /api/iot/readings
Content-Type: application/json

{
  "device_id": "SG-001",
  "voltage": 230.4,
  "socket1": {
    "current": 0.45,
    "power": 103.5
  },
  "socket2": {
    "current": 0.28,
    "power": 65.0
  },
  "timestamp": "2026-09-21T08:20:00Z"
}
```

**Backend Response**:
```json
{
  "success": true,
  "pending_commands": [
    {
      "id": 42,
      "socket_number": 1,
      "command": "TURN_OFF"
    }
  ]
}
```
If `pending_commands` contains commands, the ESP32 switches the relay immediately and acknowledges.

### B. Command Acknowledgment: `POST /api/iot/devices/:device_id/commands/:command_id/ack`
```json
POST /api/iot/devices/SG-001/commands/42/ack
Content-Type: application/json

{}
```

### C. Heartbeat: `POST /api/iot/heartbeat`
Sent every 10 seconds:
```json
POST /api/iot/heartbeat
Content-Type: application/json

{
  "device_id": "SG-001",
  "wifi_ssid": "HomeNetwork_5G",
  "rssi": -52,
  "firmware_version": "v1.0.0",
  "socket1_relay": "ON",
  "socket2_relay": "ON"
}
```

---

## 4. ESP32 Arduino C++ Firmware Skeleton

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "Your_WiFi_SSID";
const char* WIFI_PASS = "Your_WiFi_Password";
const char* BACKEND_URL = "http://192.168.1.100:5000"; // IP of backend server
const char* DEVICE_ID = "SG-001";

const int PIN_RELAY_1 = 18;
const int PIN_RELAY_2 = 19;
const int PIN_ACS712_1 = 34;
const int PIN_ACS712_2 = 35;
const int PIN_ZMPT101B = 32;

bool relay1State = true;
bool relay2State = true;

// Sampling parameters for RMS calculation
const int SAMPLES = 300;

float readRMSVoltage() {
  long sumSquares = 0;
  for (int i = 0; i < SAMPLES; i++) {
    int raw = analogRead(PIN_ZMPT101B) - 2048; // Center at 1.65V
    sumSquares += (raw * raw);
    delayMicroseconds(66); // ~60Hz/50Hz cycle sampling
  }
  float rmsRaw = sqrt(sumSquares / (float)SAMPLES);
  return rmsRaw * 0.45; // Calibration factor for 230V
}

float readRMSCurrent(int pin) {
  long sumSquares = 0;
  for (int i = 0; i < SAMPLES; i++) {
    int raw = analogRead(pin) - 2048;
    sumSquares += (raw * raw);
    delayMicroseconds(66);
  }
  float rmsRaw = sqrt(sumSquares / (float)SAMPLES);
  // ACS712 20A has 100mV/A sensitivity
  float current = rmsRaw * 0.008; // Calibration factor
  return (current < 0.05) ? 0.0 : current;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY_1, OUTPUT);
  pinMode(PIN_RELAY_2, OUTPUT);
  
  // Set relays ON by default
  digitalWrite(PIN_RELAY_1, LOW); // Active LOW relay
  digitalWrite(PIN_RELAY_2, LOW);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    float voltage = readRMSVoltage();
    float current1 = relay1State ? readRMSCurrent(PIN_ACS712_1) : 0.0;
    float current2 = relay2State ? readRMSCurrent(PIN_ACS712_2) : 0.0;
    float power1 = voltage * current1;
    float power2 = voltage * current2;

    // LOCAL SAFETY CHECK (Protects hardware even without internet!)
    if (current1 > 6.0) {
      digitalWrite(PIN_RELAY_1, HIGH); // Turn OFF immediately
      relay1State = false;
      Serial.println("EMERGENCY OVERCURRENT TRIP: SOCKET 1");
    }
    if (current2 > 6.0) {
      digitalWrite(PIN_RELAY_2, HIGH); // Turn OFF immediately
      relay2State = false;
      Serial.println("EMERGENCY OVERCURRENT TRIP: SOCKET 2");
    }

    // Prepare JSON payload
    StaticJsonDocument<512> doc;
    doc["device_id"] = DEVICE_ID;
    doc["voltage"] = voltage;
    doc["socket1"]["current"] = current1;
    doc["socket1"]["power"] = power1;
    doc["socket2"]["current"] = current2;
    doc["socket2"]["power"] = power2;

    String jsonString;
    serializeJson(doc, jsonString);

    HTTPClient http;
    http.begin(String(BACKEND_URL) + "/api/iot/readings");
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(jsonString);
    if (httpCode == 200) {
      String response = http.getString();
      StaticJsonDocument<512> respDoc;
      deserializeJson(respDoc, response);

      // Execute any relay commands from backend
      JsonArray commands = respDoc["pending_commands"];
      for (JsonObject cmd : commands) {
        int cmdId = cmd["id"];
        int sockNum = cmd["socket_number"];
        const char* commandStr = cmd["command"];

        if (sockNum == 1) {
          relay1State = (strcmp(commandStr, "TURN_ON") == 0);
          digitalWrite(PIN_RELAY_1, relay1State ? LOW : HIGH);
        } else if (sockNum == 2) {
          relay2State = (strcmp(commandStr, "TURN_ON") == 0);
          digitalWrite(PIN_RELAY_2, relay2State ? LOW : HIGH);
        }

        // Acknowledge command execution
        HTTPClient ackHttp;
        ackHttp.begin(String(BACKEND_URL) + "/api/iot/devices/" + DEVICE_ID + "/commands/" + String(cmdId) + "/ack");
        ackHttp.POST("{}");
        ackHttp.end();
      }
    }
    http.end();
  }
  delay(2500);
}
```

