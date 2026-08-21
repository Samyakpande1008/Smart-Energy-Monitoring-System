export type SocketStatus = "on" | "off";

export interface SocketData {
  id: 1 | 2;
  name: string;
  status: SocketStatus;
  appliance: string;
  confidence: number;
  current: number;
  power: number;
  energyToday: number;
  anomaly: boolean;
  anomalyScore: number;
  normalRangeMin: number;
  normalRangeMax: number;
}

export interface SensorData {
  voltage: number;
  totalPower: number;
  energyToday: number;
  monthlyBill: number;
  socket1: SocketData;
  socket2: SocketData;
}

export interface AIData {
  socket1: {
    appliance: string;
    confidence: number;
    anomaly: boolean;
    anomalyScore: number;
    predictedEnergy: number;
    recommendation: string;
  };
  socket2: {
    appliance: string;
    confidence: number;
    anomaly: boolean;
    anomalyScore: number;
    predictedEnergy: number;
    recommendation: string;
  };
}

function rand(min: number, max: number, dec = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}

export function generateSensorData(overrides?: Partial<{ s1Status: SocketStatus; s2Status: SocketStatus }>): SensorData {
  const s1On = (overrides?.s1Status ?? "on") === "on";
  const s2On = (overrides?.s2Status ?? "on") === "on";
  const s1Power = s1On ? rand(95, 115) : 0;
  const s2Power = s2On ? rand(60, 75) : 0;
  return {
    voltage: rand(228, 234),
    totalPower: s1Power + s2Power,
    energyToday: rand(2.1, 2.6, 2),
    monthlyBill: rand(460, 510, 0),
    socket1: {
      id: 1, name: "Socket 1", status: overrides?.s1Status ?? "on",
      appliance: "Fan", confidence: 94,
      current: s1On ? rand(0.42, 0.5, 2) : 0,
      power: s1Power,
      energyToday: rand(1.3, 1.55, 2),
      anomaly: false, anomalyScore: 0.12,
      normalRangeMin: 60, normalRangeMax: 110,
    },
    socket2: {
      id: 2, name: "Socket 2", status: overrides?.s2Status ?? "on",
      appliance: "Laptop", confidence: 91,
      current: s2On ? rand(0.26, 0.32, 2) : 0,
      power: s2Power,
      energyToday: rand(0.85, 0.98, 2),
      anomaly: false, anomalyScore: 0.08,
      normalRangeMin: 40, normalRangeMax: 80,
    },
  };
}

export function generateHourlyData(hours = 24) {
  return Array.from({ length: hours }, (_, i) => {
    const h = i;
    const base = h >= 6 && h <= 22 ? rand(80, 200) : rand(20, 60);
    return {
      time: `${String(h).padStart(2, "0")}:00`,
      s1: h >= 6 ? rand(base * 0.5, base * 0.7) : 0,
      s2: h >= 8 ? rand(base * 0.3, base * 0.5) : 0,
      total: base,
    };
  });
}

export function generateDailyData(days = 7) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.slice(0, days).map((d) => ({
    day: d,
    energy: rand(2.1, 4.5, 2),
    cost: rand(28, 62, 0),
  }));
}

export const historyItems = [
  { id: 1, type: "ai", title: "AI detected Fan on Socket 1", time: "Today 10:42 AM", icon: "brain" },
  { id: 2, type: "socket", title: "Socket 1 turned ON", time: "Today 10:40 AM", icon: "plug" },
  { id: 3, type: "alert", title: "Anomaly detected on Socket 2", time: "Today 10:38 AM", icon: "alert" },
  { id: 4, type: "autooff", title: "Socket 2 auto-OFF triggered", time: "Today 09:55 AM", icon: "zap" },
  { id: 5, type: "socket", title: "Socket 2 turned ON", time: "Today 09:12 AM", icon: "plug" },
  { id: 6, type: "ai", title: "AI detected Laptop on Socket 2", time: "Today 09:10 AM", icon: "brain" },
  { id: 7, type: "autooff", title: "Socket 1 auto-OFF — extended inactivity", time: "Yesterday 11:30 PM", icon: "zap" },
  { id: 8, type: "alert", title: "High current alert: Socket 1 (5.8 A)", time: "Yesterday 08:14 PM", icon: "alert" },
  { id: 9, type: "ai", title: "Appliance pattern updated: Fan", time: "Yesterday 06:22 PM", icon: "brain" },
  { id: 10, type: "socket", title: "Socket 1 turned OFF manually", time: "Yesterday 03:45 PM", icon: "plug" },
];
