Create a complete, modern, production-quality responsive web application UI for an IoT product called:

"Smart Energy Guardian"

Tagline:
"An AI-powered smart extension board that learns appliance energy patterns, predicts consumption, detects abnormal usage, and intelligently controls appliances."

IMPORTANT TECHNOLOGY REQUIREMENT:
Build the application as:
- React
- Vite
- Tailwind CSS
- JavaScript/TypeScript as appropriate
- Component-based architecture
- Responsive design for desktop, tablet and mobile

Do NOT create a static mockup only. Create a functional frontend prototype with realistic simulated data and working navigation/interactions so that Firebase and a Python ML API can be connected later.

The actual hardware will eventually be:
- ESP32
- 2 × ACS712 20A current sensors
- 1 × ZMPT101B AC voltage sensor
- 1 × 2-channel 5V relay module
- 2 AC sockets

For now, DO NOT require physical hardware. Use realistic simulated sensor data.

==================================================
PRODUCT PURPOSE
==================================================

The system monitors electricity consumption from two independently controlled sockets.

It must display:
- AC voltage
- Current for each socket
- Power for each socket
- Energy consumption in kWh
- Estimated electricity bill
- Appliance recognition using ML
- ML confidence
- Energy consumption prediction
- Anomaly detection
- AI energy-saving recommendations
- Smart Auto-OFF
- Relay/socket status
- Historical energy analytics

The MAIN SELLING POINT is the ML/AI capability.

The interface should therefore make the AI functionality highly visible and important rather than treating it as a minor feature.

==================================================
DESIGN STYLE
==================================================

Create a premium IoT + AI SaaS dashboard.

Visual style:
- Modern
- Clean
- Professional
- Minimal but visually impressive
- Suitable for a real commercial product
- Not like a basic college project
- Strong visual hierarchy
- Rounded cards
- Subtle shadows
- Clean typography
- Plenty of whitespace
- Clear status indicators
- Professional charts
- Subtle AI visual elements

Use a dark navy/charcoal primary interface with clean white cards or dark cards where appropriate.

Use:
- Green for normal/ON
- Red for OFF/danger
- Amber/orange for warnings
- Blue/cyan for energy/data
- Purple/indigo for AI features

Do not overuse gradients.

Use Lucide icons or another clean icon library.

Typography should be modern and readable.

==================================================
GLOBAL LAYOUT
==================================================

Create a responsive application layout with:

LEFT SIDEBAR:
- Smart Energy Guardian logo
- Dashboard
- Energy Analytics
- AI Insights
- Appliances
- Smart Auto-OFF
- History
- Device
- Settings

BOTTOM/PROFILE AREA:
- User profile
- Connection status
- Logout

TOP BAR:
- Page title
- Device connection status
- Current device name
- Notifications
- User avatar

On mobile, convert the sidebar into a hamburger/mobile navigation.

==================================================
SCREEN 1: LOGIN
==================================================

Create a professional login screen.

Logo:
Smart Energy Guardian

Subtitle:
"Intelligent energy monitoring for smarter homes."

Fields:
- Email
- Password

Buttons:
- Sign In
- Create Account

Include:
- Remember me
- Forgot password

Keep it simple and premium.

==================================================
SCREEN 2: MAIN DASHBOARD
==================================================

This is the primary screen.

Header:

"Good Morning, Vishwajeet"

Subtitle:
"Here's your energy overview."

Show device status:
"Smart Extension • Online"

TOP SUMMARY CARDS:

1. Current Voltage
230.4 V

2. Current Power
172 W

3. Today's Energy
2.34 kWh

4. Estimated Monthly Bill
₹486

Each card should include a small icon and comparison such as:
"+8% vs yesterday"

--------------------------------------------------
SOCKET CONTROL SECTION
--------------------------------------------------

Create two large cards:

SOCKET 1

Status:
● ON

Appliance:
"Fan"

AI confidence:
94%

Current:
0.46 A

Power:
105 W

Energy today:
1.42 kWh

Button:
"Turn OFF"

--------------------------------------------------

SOCKET 2

Status:
● ON

Appliance:
"Laptop"

AI confidence:
91%

Current:
0.29 A

Power:
67 W

Energy today:
0.92 kWh

Button:
"Turn OFF"

Buttons must visually change between ON and OFF.

--------------------------------------------------
AI INSIGHT FEATURE
--------------------------------------------------

Create a prominent section titled:

"AI Energy Intelligence"

Display:

🧠 Appliance Recognition
"Fan detected on Socket 1"
"Confidence: 94%"

📈 Consumption Prediction
"Expected today's consumption: 3.2 kWh"

⚠️ Anomaly Detection
"No abnormal consumption detected"

💡 Smart Recommendation
"Socket 1 has been running 18% longer than its usual pattern."

Add:
"View AI Insights →"

Make this section visually prominent.

--------------------------------------------------
ENERGY GRAPH
--------------------------------------------------

Create an interactive-looking line/area chart:

"Today's Power Consumption"

X axis:
Time

Y axis:
Watts

Show realistic fluctuations throughout the day.

Controls:
- Today
- 7 Days
- 30 Days

Also show:
Peak Power
Average Power
Total Energy

==================================================
SCREEN 3: AI INSIGHTS
==================================================

This is one of the MOST IMPORTANT screens.

Title:

"AI Energy Intelligence"

Subtitle:

"Your energy usage, understood by AI."

Create four major AI cards.

--------------------------------------------------
1. APPLIANCE RECOGNITION
--------------------------------------------------

Title:
"Appliance Recognition"

Show:

Socket 1
Detected Appliance: FAN
Confidence: 94%

Socket 2
Detected Appliance: LAPTOP
Confidence: 91%

Show a confidence progress bar.

Add:
"How AI identifies appliances"

Explain visually that the system learns electrical signatures from:
- Voltage
- Current
- Power
- Power variation
- Usage duration

Do not claim that the model can identify every appliance perfectly.

--------------------------------------------------
2. ENERGY PREDICTION
--------------------------------------------------

Title:
"Energy Consumption Prediction"

Show:

Today's predicted usage:
3.20 kWh

Actual:
2.34 kWh

Predicted monthly usage:
42.6 kWh

Estimated monthly bill:
₹486

Create a prediction graph with:
- Actual usage
- Predicted usage

Add a small confidence indicator.

--------------------------------------------------
3. ANOMALY DETECTION
--------------------------------------------------

Title:
"Anomaly Detection"

Example:

"⚠ Unusual consumption detected"

Socket 2

Normal range:
40–80 W

Current:
126 W

Anomaly score:
87%

Duration:
8 minutes

Button:
"Investigate"

Do not automatically turn off the appliance from this screen without confirmation unless Smart Auto-OFF is enabled.

--------------------------------------------------
4. AI RECOMMENDATIONS
--------------------------------------------------

Title:
"Smart Recommendations"

Examples:

"Your fan is consuming 14% more energy than its usual pattern."

"Socket 2 has been active longer than normal."

"Estimated saving this month: ₹72."

Buttons:
- Enable Smart Auto-OFF
- View Details

==================================================
SCREEN 4: ENERGY ANALYTICS
==================================================

Title:
"Energy Analytics"

Provide filters:
- Today
- Week
- Month
- Custom

Charts:

1. Daily energy consumption
2. Power consumption over time
3. Socket 1 vs Socket 2
4. Estimated electricity cost

Show statistics:

Total Energy
Average Daily Energy
Peak Power
Estimated Monthly Bill
Estimated Savings

Create visually polished charts.

==================================================
SCREEN 5: APPLIANCES
==================================================

Title:
"Recognized Appliances"

Create a table/grid containing:

Appliance
Socket
Current Power
Today's Energy
AI Confidence
Status

Example:

Fan
Socket 1
105 W
1.42 kWh
94%
ON

Laptop
Socket 2
67 W
0.92 kWh
91%
ON

Add an appliance detail view.

For each appliance show:
- Power pattern
- Typical usage time
- Average power
- Energy consumed
- AI confidence
- Usage history

==================================================
SCREEN 6: SMART AUTO-OFF
==================================================

This is another major feature.

Title:
"Smart Auto-OFF"

Subtitle:
"Let AI help reduce unnecessary energy consumption."

Create a large master toggle:

Smart Auto-OFF
ON

Then separate controls:

Socket 1
Smart Auto-OFF: ON

Socket 2
Smart Auto-OFF: OFF

--------------------------------------------------

Create configurable rules:

1. Unusual power consumption
Toggle ON/OFF

Threshold:
[slider]

2. Appliance inactive for extended period
Toggle ON/OFF

Duration:
30 minutes

3. AI-detected abnormal usage
Toggle ON/OFF

Minimum confidence:
85%

4. Maximum current safety limit
6 A

--------------------------------------------------

Create a "Safety First" section explaining:

"Critical electrical safety limits are handled locally by the ESP32 and do not depend on internet connectivity."

This is important because the final hardware will control 230V appliances.

--------------------------------------------------

AUTO-OFF HISTORY

Show:

10:42 AM
Socket 2 automatically turned OFF
Reason:
Unusual power consumption

Yesterday
Socket 1 automatically turned OFF
Reason:
Extended inactivity

==================================================
SCREEN 7: DEVICE
==================================================

Title:
"Smart Extension"

Show:

Device name:
Smart Energy Guardian #001

Status:
ONLINE

Wi-Fi:
Connected

Signal:
Strong

Firmware:
v1.0.0

Hardware:
ESP32

Sensors:
ACS712 × 2
ZMPT101B × 1

Relay:
2-channel

Socket 1:
Connected

Socket 2:
Connected

Add buttons:
- Rename Device
- Wi-Fi Settings
- Restart Device
- Update Firmware

==================================================
SCREEN 8: HISTORY
==================================================

Create an activity/history timeline.

Examples:

AI detected Fan
Today 10:42 AM

Socket 2 turned OFF
Today 10:40 AM

Anomaly detected
Today 10:38 AM

Socket 1 turned ON
Today 9:12 AM

Show filters:
- All
- AI
- Socket
- Auto-OFF
- Alerts

==================================================
SCREEN 9: SETTINGS
==================================================

Include:

Profile
Notifications
Energy tariff
Currency
Device settings
AI settings
Auto-OFF settings
Data privacy
Logout

Allow user to enter electricity tariff:

₹ / kWh

Use this value for bill estimation.

==================================================
FIREBASE-READY DATA ARCHITECTURE
==================================================

Design the frontend so it can later connect to Firebase.

Use a clean data abstraction layer instead of hardcoding sensor values directly into UI components.

Expected future data structure:

users/
  customer_001/
    devices/
      device_001/
        sensors/
          voltage
          socket1_current
          socket2_current
          socket1_power
          socket2_power

        sockets/
          socket1_status
          socket2_status

        energy/
          today
          week
          month
          total

        ai/
          socket1/
            appliance
            confidence
            anomaly
            anomaly_score
            prediction

          socket2/
            appliance
            confidence
            anomaly
            anomaly_score
            prediction

        settings/
          auto_off
          tariff

The current prototype should use realistic mock data, but structure the code so Firebase can replace the mock data later.

==================================================
ML API READY
==================================================

Design the frontend so it can later receive ML results from a Python backend/API.

Expected API-style data:

{
  "appliance": "Fan",
  "confidence": 0.94,
  "anomaly": false,
  "anomaly_score": 0.12,
  "predicted_energy": 3.2,
  "recommendation": "Reduce fan usage by 30 minutes"
}

Do NOT implement fake AI claims as if they are real trained models.

Clearly treat current values as simulated/demo predictions.

==================================================
SIMULATED DATA
==================================================

Create realistic simulated data for:

Voltage:
225–240 V

Fan:
60–110 W

Laptop:
40–100 W

TV:
60–150 W

Bulb:
5–20 W

Iron:
800–1200 W

Include realistic fluctuations instead of constant values.

Allow the dashboard to update simulated readings periodically.

Include a "Demo Mode" indicator so the user knows that current readings are simulated until ESP32 hardware is connected.

==================================================
IMPORTANT PRODUCT LOGIC
==================================================

Socket controls must behave like a real application.

When the user clicks:
"Turn OFF"

change:
- Socket status
- Relay state
- Current
- Power
- Energy behavior

For now simulate this behavior locally.

Later this action will become:

Web UI → Firebase/API → ESP32 → Relay

Do not directly connect the frontend to physical hardware.

==================================================
RESPONSIVE DESIGN
==================================================

Desktop:
Optimized for 1440px width.

Tablet:
Responsive grid.

Mobile:
Cards stack vertically.

The dashboard must remain usable on a phone because the eventual product may be controlled from a mobile browser.

==================================================
CODE QUALITY
==================================================

Use reusable React components.

Suggested structure:

components/
  Sidebar
  Topbar
  StatCard
  SocketCard
  AIInsightCard
  EnergyChart
  ApplianceCard
  StatusBadge
  AutoOffRule

pages/
  Dashboard
  Analytics
  AIInsights
  Appliances
  AutoOff
  History
  Device
  Settings

services/
  mockData
  firebase
  api

Do not put all UI code into one component.

Keep Firebase and ML API integrations separated from UI components.

==================================================
FINAL GOAL
==================================================

The result should look like a real commercial AI-powered IoT energy product, not a generic admin dashboard.

The most important visual hierarchy should be:

1. Energy monitoring
2. Appliance recognition
3. AI anomaly detection
4. Energy prediction
5. Smart Auto-OFF
6. Remote relay control

The final interface should clearly communicate:

"THIS PRODUCT DOES NOT JUST MEASURE ELECTRICITY.
IT LEARNS ENERGY USAGE AND MAKES INTELLIGENT DECISIONS."

Use realistic sample data and interactions throughout.

Do not add unnecessary features that are unrelated to smart energy monitoring.