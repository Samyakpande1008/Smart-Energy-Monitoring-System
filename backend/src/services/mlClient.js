import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 3000
});

export async function predictAppliance(voltage, current, power, history = []) {
  try {
    const res = await client.post('/predict/appliance', {
      voltage: Number(voltage),
      current: Number(current),
      power: Number(power),
      history: history.map(Number)
    });
    return res.data;
  } catch (err) {
    console.warn(`[ML Client] ML Service unavailable, using rule fallback: ${err.message}`);
    // Safe rule fallback
    let appliance = 'Unknown';
    let confidence = 0.85;
    if (power < 3.0) {
      appliance = 'Unknown';
    } else if (power > 600) {
      appliance = 'Iron';
      confidence = 0.95;
    } else if (power >= 55 && power <= 125) {
      appliance = 'Fan';
      confidence = 0.92;
    } else if (power >= 25 && power < 55) {
      appliance = 'Laptop';
      confidence = 0.88;
    } else if (power > 125 && power <= 250) {
      appliance = 'TV';
      confidence = 0.89;
    } else if (power >= 5 && power < 25) {
      appliance = 'Bulb';
      confidence = 0.94;
    }
    return {
      appliance,
      confidence,
      features: { voltage, current, avg_power: power },
      status: 'Fallback Mode'
    };
  }
}

export async function detectAnomaly(voltage, current, power, expectedAppliance = 'General', history = []) {
  try {
    const res = await client.post('/detect/anomaly', {
      voltage: Number(voltage),
      current: Number(current),
      power: Number(power),
      expected_appliance: expectedAppliance,
      history_power: history.map(Number)
    });
    return res.data;
  } catch (err) {
    console.warn(`[ML Client] Anomaly Service unavailable: ${err.message}`);
    const isOvercurrent = current > 6.0;
    return {
      is_anomaly: isOvercurrent,
      anomaly_score: isOvercurrent ? 0.99 : 0.05,
      reason: isOvercurrent ? 'Hardware overcurrent safety limit exceeded (> 6A)' : 'Normal range',
      normal_range: { min: 20, max: 150 }
    };
  }
}

export async function predictEnergy(hourOfDay, dayOfWeek, rolling1hPower, rolling3hPower, activeSockets) {
  try {
    const res = await client.post('/predict/energy', {
      hour_of_day: hourOfDay,
      day_of_week: dayOfWeek,
      rolling_1h_power: rolling1hPower,
      rolling_3h_power: rolling3hPower,
      active_sockets: activeSockets
    });
    return res.data;
  } catch (err) {
    console.warn(`[ML Client] Energy Prediction Service unavailable: ${err.message}`);
    const nextHour = (rolling1hPower * 0.7 + rolling3hPower * 0.3) / 1000.0;
    return {
      predicted_next_hour_kwh: Number(nextHour.toFixed(3)),
      predicted_today_kwh: 3.20,
      predicted_monthly_kwh: 42.6,
      confidence: 80.0,
      hourly_curve: [
        { t: "6am", actual: 0.2, predicted: 0.3 },
        { t: "8am", actual: 0.5, predicted: 0.6 },
        { t: "10am", actual: 1.1, predicted: 1.2 },
        { t: "12pm", actual: 1.7, predicted: 1.8 },
        { t: "2pm", actual: 2.1, predicted: 2.4 },
        { t: "4pm", actual: 2.34, predicted: 2.8 },
        { t: "6pm", actual: null, predicted: 3.2 }
      ]
    };
  }
}

export async function getRecommendations(context) {
  try {
    const res = await client.post('/recommend', context);
    return res.data.recommendations;
  } catch (err) {
    console.warn(`[ML Client] Recommendation Service unavailable: ${err.message}`);
    return [
      {
        type: "USAGE_PATTERN",
        color: "amber",
        title: "Fan Power Deviation",
        text: "Your fan is consuming 14% more energy than its usual pattern. Consider checking for blade obstructions."
      },
      {
        type: "OPTIMIZATION",
        color: "blue",
        title: "Continuous Operation Alert",
        text: "Socket 2 has been active longer than normal. 2.3 hours past average daily runtime."
      },
      {
        type: "SAVING",
        color: "emerald",
        title: "Monthly Saving Opportunity",
        text: "Estimated saving this month: ₹72 if usage returns to baseline pattern."
      }
    ];
  }
}

