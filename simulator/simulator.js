import axios from 'axios';
import readline from 'readline';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
const DEVICE_CODE = process.env.DEVICE_CODE || 'SG-001';
const TICK_INTERVAL_MS = 2500; // 2.5 seconds per telemetry packet

console.log(`========================================================`);
console.log(` SMART ENERGY GUARDIAN - IoT Hardware Simulator`);
console.log(` Emulating: ESP32 + 2x ACS712 (20A) + 1x ZMPT101B + 2-Relay`);
console.log(` Target Backend: ${BACKEND_URL}`);
console.log(` Virtual Device Code: ${DEVICE_CODE}`);
console.log(`========================================================`);
console.log(` INTERACTIVE CONTROLS (Press key in this terminal):`);
console.log(`   [A] Trigger / Clear Power Anomaly (185W on Socket 2)`);
console.log(`   [O] Trigger Overcurrent Spike (6.5A - Tests Safety Trip)`);
console.log(`   [1] Cycle Socket 1 Appliance (Fan -> Iron -> Bulb)`);
console.log(`   [2] Cycle Socket 2 Appliance (Laptop -> TV -> Bulb)`);
console.log(`   [R] Reset to Default (Fan 95W + Laptop 65W)`);
console.log(`   [H] Show this Help Menu`);
console.log(`========================================================\n`);

// Virtual Relay & Hardware State
const APPLIANCES_S1 = ['Fan', 'Iron', 'Bulb'];
const APPLIANCES_S2 = ['Laptop', 'TV', 'Bulb'];

const state = {
  socket1Relay: true,
  socket2Relay: true,
  s1ApplianceIndex: 0, // 0: Fan, 1: Iron, 2: Bulb
  s2ApplianceIndex: 0, // 0: Laptop, 1: TV, 2: Bulb
  tickCount: 0,
  injectAnomaly: false,
  injectOvercurrent: false
};

// Realistic electrical generation based on appliance profiles
function generateReading() {
  state.tickCount++;

  // AC line voltage fluctuation (227V - 233V)
  const baseV = 230.0 + Math.sin(state.tickCount * 0.1) * 2.5 + (Math.random() * 0.8 - 0.4);
  const voltage = Number(baseV.toFixed(1));

  // Socket 1 Calculation
  let s1Power = 0.0;
  let s1Current = 0.0;
  if (state.socket1Relay) {
    const app1 = APPLIANCES_S1[state.s1ApplianceIndex];
    if (app1 === 'Fan') {
      const jitter = Math.sin(state.tickCount * 0.3) * 6.0 + (Math.random() * 4.0 - 2.0);
      s1Power = Number((95.0 + jitter).toFixed(1));
      s1Current = Number((s1Power / voltage + 0.03).toFixed(3));
    } else if (app1 === 'Iron') {
      const jitter = (Math.random() * 40.0 - 20.0);
      s1Power = Number((1150.0 + jitter).toFixed(1));
      s1Current = Number((s1Power / voltage).toFixed(3));
    } else if (app1 === 'Bulb') {
      const jitter = (Math.random() * 1.5 - 0.75);
      s1Power = Number((12.0 + jitter).toFixed(1));
      s1Current = Number((s1Power / voltage).toFixed(3));
    }
  }

  // Socket 2 Calculation
  let s2Power = 0.0;
  let s2Current = 0.0;
  if (state.socket2Relay) {
    if (state.injectOvercurrent) {
      // Overcurrent spike > 6A
      s2Current = Number((6.5 + Math.random() * 0.5).toFixed(2));
      s2Power = Number((s2Current * voltage).toFixed(1));
    } else if (state.injectAnomaly) {
      // Abnormal power draw on socket 2: 185W (normal laptop is 40-80W)
      s2Power = Number((185.0 + Math.random() * 15.0).toFixed(1));
      s2Current = Number((s2Power / voltage).toFixed(3));
    } else {
      const app2 = APPLIANCES_S2[state.s2ApplianceIndex];
      if (app2 === 'Laptop') {
        const jitter = Math.cos(state.tickCount * 0.25) * 5.0 + (Math.random() * 3.0 - 1.5);
        s2Power = Number((65.0 + jitter).toFixed(1));
        s2Current = Number((s2Power / voltage + 0.02).toFixed(3));
      } else if (app2 === 'TV') {
        const jitter = (Math.random() * 12.0 - 6.0);
        s2Power = Number((115.0 + jitter).toFixed(1));
        s2Current = Number((s2Power / voltage).toFixed(3));
      } else if (app2 === 'Bulb') {
        const jitter = (Math.random() * 1.5 - 0.75);
        s2Power = Number((15.0 + jitter).toFixed(1));
        s2Current = Number((s2Power / voltage).toFixed(3));
      }
    }
  }

  return {
    device_id: DEVICE_CODE,
    voltage,
    socket1: {
      current: s1Current,
      power: s1Power
    },
    socket2: {
      current: s2Current,
      power: s2Power
    },
    timestamp: new Date().toISOString()
  };
}

// Process pending relay commands from backend
async function executeCommands(commands) {
  if (!commands || commands.length === 0) return;

  for (const cmd of commands) {
    console.log(`\n[Simulator Hardware] Received Relay Command: ${cmd.command} for Socket ${cmd.socket_number}`);
    if (cmd.socket_number === 1) {
      state.socket1Relay = (cmd.command === 'TURN_ON');
    } else if (cmd.socket_number === 2) {
      state.socket2Relay = (cmd.command === 'TURN_ON');
      // If Auto-OFF turned off socket 2, reset anomaly triggers
      if (cmd.command === 'TURN_OFF') {
        state.injectAnomaly = false;
        state.injectOvercurrent = false;
      }
    }

    try {
      await axios.post(`${BACKEND_URL}/api/iot/devices/${DEVICE_CODE}/commands/${cmd.id}/ack`);
      console.log(`[Simulator Hardware] Command acknowledged. Relays: S1=${state.socket1Relay ? 'ON' : 'OFF'}, S2=${state.socket2Relay ? 'ON' : 'OFF'}`);
    } catch (err) {
      // Non-blocking
    }
  }
}

// Telemetry loop
async function sendTelemetry() {
  try {
    const payload = generateReading();
    const res = await axios.post(`${BACKEND_URL}/api/iot/readings`, payload, { timeout: 3000 });
    
    const s1Name = APPLIANCES_S1[state.s1ApplianceIndex];
    const s2Name = state.injectAnomaly ? 'ANOMALY' : (state.injectOvercurrent ? 'OVERCURRENT' : APPLIANCES_S2[state.s2ApplianceIndex]);

    process.stdout.write(
      `\r[Telemetry] V=${payload.voltage}V | S1[${s1Name}](${state.socket1Relay ? 'ON' : 'OFF'}): ${payload.socket1.power}W | ` +
      `S2[${s2Name}](${state.socket2Relay ? 'ON' : 'OFF'}): ${payload.socket2.power}W (${payload.socket2.current}A)   `
    );

    if (res.data && res.data.pending_commands) {
      await executeCommands(res.data.pending_commands);
    }
  } catch (err) {
    // Non-blocking telemetry retry
  }
}

// Heartbeat loop (every 10s)
async function sendHeartbeat() {
  try {
    const res = await axios.post(`${BACKEND_URL}/api/iot/heartbeat`, {
      device_id: DEVICE_CODE,
      wifi_ssid: 'HomeNetwork_5G',
      rssi: -50 - Math.floor(Math.random() * 5),
      firmware_version: 'v1.0.0',
      socket1_relay: state.socket1Relay ? 'ON' : 'OFF',
      socket2_relay: state.socket2Relay ? 'ON' : 'OFF'
    }, { timeout: 3000 });

    if (res.data && res.data.pending_commands) {
      await executeCommands(res.data.pending_commands);
    }
  } catch (err) {
    // Non-blocking
  }
}

// Setup Keyboard interaction in terminal
if (process.stdin.isTTY) {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      process.exit();
    }

    const k = (key.name || str || '').toLowerCase();
    if (k === 'a') {
      state.injectAnomaly = !state.injectAnomaly;
      state.injectOvercurrent = false;
      console.log(`\n>>> [SIMULATOR] Anomaly Injection toggled: ${state.injectAnomaly ? 'ACTIVE (185W on Socket 2)' : 'OFF'}`);
    } else if (k === 'o') {
      state.injectOvercurrent = !state.injectOvercurrent;
      state.injectAnomaly = false;
      console.log(`\n>>> [SIMULATOR] Overcurrent Spike toggled: ${state.injectOvercurrent ? 'ACTIVE (>6.5A on Socket 2)' : 'OFF'}`);
    } else if (k === '1') {
      state.s1ApplianceIndex = (state.s1ApplianceIndex + 1) % APPLIANCES_S1.length;
      console.log(`\n>>> [SIMULATOR] Socket 1 Appliance changed to: ${APPLIANCES_S1[state.s1ApplianceIndex]}`);
    } else if (k === '2') {
      state.s2ApplianceIndex = (state.s2ApplianceIndex + 1) % APPLIANCES_S2.length;
      state.injectAnomaly = false;
      state.injectOvercurrent = false;
      console.log(`\n>>> [SIMULATOR] Socket 2 Appliance changed to: ${APPLIANCES_S2[state.s2ApplianceIndex]}`);
    } else if (k === 'r') {
      state.s1ApplianceIndex = 0;
      state.s2ApplianceIndex = 0;
      state.injectAnomaly = false;
      state.injectOvercurrent = false;
      state.socket1Relay = true;
      state.socket2Relay = true;
      console.log(`\n>>> [SIMULATOR] Reset to default: Socket 1=Fan, Socket 2=Laptop, Both Relays ON`);
    } else if (k === 'h') {
      console.log(`\n--- Interactive Controls: [A]=Anomaly, [O]=Overcurrent, [1]=Cycle S1, [2]=Cycle S2, [R]=Reset ---`);
    }
  });
}

// Start loops
setInterval(sendTelemetry, TICK_INTERVAL_MS);
setInterval(sendHeartbeat, 10000);

sendTelemetry();
sendHeartbeat();
