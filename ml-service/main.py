import os
import joblib
import numpy as np
import pandas as pd
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Smart Energy Guardian ML Microservice",
    version="1.0.0",
    description="Machine Learning Service for Appliance Recognition, Anomaly Detection, Energy Forecasting, and Recommendations"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# Lazy-loaded model containers
appliance_clf = None
appliance_scaler = None
appliance_encoder = None
feature_cols = None

anomaly_model = None
anomaly_scaler = None

energy_model = None
energy_features = None

def load_models():
    global appliance_clf, appliance_scaler, appliance_encoder, feature_cols
    global anomaly_model, anomaly_scaler, energy_model, energy_features
    try:
        if appliance_clf is None and os.path.exists(os.path.join(MODELS_DIR, "appliance_rf.joblib")):
            appliance_clf = joblib.load(os.path.join(MODELS_DIR, "appliance_rf.joblib"))
            appliance_scaler = joblib.load(os.path.join(MODELS_DIR, "appliance_scaler.joblib"))
            appliance_encoder = joblib.load(os.path.join(MODELS_DIR, "appliance_encoder.joblib"))
            feature_cols = joblib.load(os.path.join(MODELS_DIR, "feature_cols.joblib"))
            print("Appliance models loaded successfully.")
    except Exception as e:
        print(f"Warning loading appliance model: {e}")

    try:
        if anomaly_model is None and os.path.exists(os.path.join(MODELS_DIR, "anomaly_model.joblib")):
            anomaly_model = joblib.load(os.path.join(MODELS_DIR, "anomaly_model.joblib"))
            anomaly_scaler = joblib.load(os.path.join(MODELS_DIR, "anomaly_scaler.joblib"))
            print("Anomaly model loaded successfully.")
    except Exception as e:
        print(f"Warning loading anomaly model: {e}")

    try:
        if energy_model is None and os.path.exists(os.path.join(MODELS_DIR, "energy_model.joblib")):
            energy_model = joblib.load(os.path.join(MODELS_DIR, "energy_model.joblib"))
            energy_features = joblib.load(os.path.join(MODELS_DIR, "energy_features.joblib"))
            print("Energy model loaded successfully.")
    except Exception as e:
        print(f"Warning loading energy model: {e}")

@app.on_event("startup")
def startup_event():
    load_models()

# ----------------- Data Models -----------------

class SensorWindow(BaseModel):
    voltage: float = Field(..., example=230.2)
    current: float = Field(..., example=0.46)
    power: float = Field(..., example=105.8)
    history: Optional[List[float]] = Field(default=None, description="Recent power readings for variance analysis")

class AppliancePredictionResponse(BaseModel):
    appliance: str
    confidence: float
    features: Dict[str, float]
    status: str

class AnomalyDetectionRequest(BaseModel):
    voltage: float = Field(..., example=231.0)
    current: float = Field(..., example=0.92)
    power: float = Field(..., example=210.0)
    expected_appliance: Optional[str] = Field(default="Laptop")
    history_power: Optional[List[float]] = None

class AnomalyDetectionResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    reason: str
    normal_range: Dict[str, float]

class EnergyPredictionRequest(BaseModel):
    hour_of_day: int = Field(default=12, ge=0, le=23)
    day_of_week: int = Field(default=2, ge=0, le=6)
    rolling_1h_power: float = Field(default=115.0)
    rolling_3h_power: float = Field(default=110.0)
    active_sockets: int = Field(default=2)

class EnergyPredictionResponse(BaseModel):
    predicted_next_hour_kwh: float
    predicted_today_kwh: float
    predicted_monthly_kwh: float
    confidence: float
    hourly_curve: List[Dict[str, Any]]

class RecommendationRequest(BaseModel):
    socket1_appliance: str = "Fan"
    socket1_power: float = 105.0
    socket1_hours_active: float = 8.5
    socket2_appliance: str = "Laptop"
    socket2_power: float = 67.0
    socket2_hours_active: float = 6.0
    tariff_rate: float = 8.50

class RecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]

# ----------------- Endpoints -----------------

@app.get("/health")
def health_check():
    load_models()
    return {
        "status": "healthy",
        "appliance_model_loaded": appliance_clf is not None,
        "anomaly_model_loaded": anomaly_model is not None,
        "energy_model_loaded": energy_model is not None,
        "version": "1.0.0"
    }

@app.post("/predict/appliance", response_model=AppliancePredictionResponse)
def predict_appliance(data: SensorWindow):
    load_models()
    v = data.voltage
    curr = data.current
    p = data.power

    # If power is near zero, immediately recognize as idle / Off
    if p < 2.0 or curr < 0.01:
        return {
            "appliance": "Unknown",
            "confidence": 0.99,
            "features": {"voltage": v, "current": curr, "avg_power": p},
            "status": "OFF / Standby"
        }

    # Compute rolling window statistics if history provided
    if data.history and len(data.history) > 1:
        hist = np.array(data.history)
        avg_p = float(np.mean(hist))
        peak_p = float(np.max(hist))
        min_p = float(np.min(hist))
        p_std = float(np.std(hist))
    else:
        avg_p = p
        peak_p = p * 1.05
        min_p = p * 0.95
        p_std = p * 0.05

    p_var = p_std ** 2
    curr_var = (p_std / max(v, 1.0)) ** 2
    energy_rate = avg_p / 1000.0

    features_dict = {
        'voltage': round(v, 2),
        'current': round(curr, 3),
        'avg_power': round(avg_p, 2),
        'peak_power': round(peak_p, 2),
        'min_power': round(min_p, 2),
        'power_variance': round(p_var, 3),
        'power_std': round(p_std, 3),
        'current_variance': round(curr_var, 5),
        'energy_rate': round(energy_rate, 4)
    }

    if appliance_clf is not None and appliance_scaler is not None and appliance_encoder is not None:
        try:
            X_input = pd.DataFrame([features_dict])[feature_cols]
            X_scaled = appliance_scaler.transform(X_input)
            probs = appliance_clf.predict_proba(X_scaled)[0]
            pred_idx = np.argmax(probs)
            pred_label = appliance_encoder.inverse_transform([pred_idx])[0]
            confidence = float(probs[pred_idx])

            return {
                "appliance": pred_label,
                "confidence": round(confidence, 2),
                "features": features_dict,
                "status": "Recognized by Random Forest"
            }
        except Exception as e:
            print(f"Inference error: {e}")

    # Heuristic fallback if model not yet trained
    if avg_p > 600:
        label = "Iron"
        conf = 0.95
    elif 55 <= avg_p <= 125:
        label = "Fan"
        conf = 0.92
    elif 30 <= avg_p < 55 or (55 < avg_p <= 80 and p_std > 4):
        label = "Laptop"
        conf = 0.89
    elif 80 < avg_p <= 200:
        label = "TV"
        conf = 0.88
    elif 5 <= avg_p < 30:
        label = "Bulb"
        conf = 0.94
    else:
        label = "Unknown"
        conf = 0.70

    return {
        "appliance": label,
        "confidence": conf,
        "features": features_dict,
        "status": "Fallback Rule-Based"
    }

@app.post("/detect/anomaly", response_model=AnomalyDetectionResponse)
def detect_anomaly(req: AnomalyDetectionRequest):
    load_models()
    v = req.voltage
    curr = req.current
    p = req.power
    appliance = req.expected_appliance or "General"

    # Define normal bounds for recognized appliances
    BOUNDS = {
        "Fan": {"min_w": 40.0, "max_w": 130.0, "max_a": 0.75},
        "Laptop": {"min_w": 20.0, "max_w": 95.0, "max_a": 0.55},
        "TV": {"min_w": 50.0, "max_w": 180.0, "max_a": 0.95},
        "Bulb": {"min_w": 3.0, "max_w": 30.0, "max_a": 0.20},
        "Iron": {"min_w": 650.0, "max_w": 1500.0, "max_a": 7.0},
        "General": {"min_w": 0.0, "max_w": 500.0, "max_a": 6.0}
    }

    bounds = BOUNDS.get(appliance, BOUNDS["General"])
    is_anomaly = False
    anomaly_score = 0.08
    reason = "All readings are within expected electrical parameters."

    # Critical electrical overcurrent check
    if curr > 6.0:
        return {
            "is_anomaly": True,
            "anomaly_score": 0.99,
            "reason": f"Critical overcurrent detected ({curr:.2f} A exceeds 6.0 A hardware safety limit)",
            "normal_range": {"min": bounds["min_w"], "max": bounds["max_w"]}
        }

    # Model evaluation if power > 5W
    if p > 5.0 and anomaly_model is not None and anomaly_scaler is not None:
        try:
            p_std = float(np.std(req.history_power)) if req.history_power else (p * 0.05)
            sample_df = pd.DataFrame([{
                'voltage': v,
                'current': curr,
                'avg_power': p,
                'power_std': p_std
            }])
            scaled = anomaly_scaler.transform(sample_df)
            decision = anomaly_model.decision_function(scaled)[0]
            # Isolation forest decision: negative is anomalous
            if decision < 0:
                is_anomaly = True
                anomaly_score = round(min(0.95, 0.5 + abs(decision) * 2), 2)
                reason = f"Consumption pattern deviates significantly from trained baseline (Isolation Forest score: {anomaly_score})"
        except Exception as e:
            print(f"Anomaly model scoring error: {e}")

    # Boundary rule check
    if p > bounds["max_w"]:
        is_anomaly = True
        anomaly_score = max(anomaly_score, round(min(0.98, 0.70 + (p - bounds["max_w"]) / bounds["max_w"] * 0.3), 2))
        reason = f"Power consumption ({p:.1f} W) exceeds expected normal range ({bounds['min_w']:.0f}–{bounds['max_w']:.0f} W) for {appliance}"
    elif p > 5.0 and p < bounds["min_w"] and appliance not in ["General", "Unknown"]:
        is_anomaly = True
        anomaly_score = max(anomaly_score, 0.65)
        reason = f"Power consumption ({p:.1f} W) is unusually low for {appliance} (normal min: {bounds['min_w']:.0f} W)"

    return {
        "is_anomaly": is_anomaly,
        "anomaly_score": anomaly_score,
        "reason": reason,
        "normal_range": {"min": bounds["min_w"], "max": bounds["max_w"]}
    }

@app.post("/predict/energy", response_model=EnergyPredictionResponse)
def predict_energy(req: EnergyPredictionRequest):
    load_models()
    hour = req.hour_of_day
    day = req.day_of_week
    p1 = req.rolling_1h_power
    p3 = req.rolling_3h_power
    socks = req.active_sockets

    if energy_model is not None:
        try:
            input_df = pd.DataFrame([{
                'hour_of_day': hour,
                'day_of_week': day,
                'rolling_1h_power': p1,
                'rolling_3h_power': p3,
                'active_sockets': socks
            }])
            next_hour_kwh = float(energy_model.predict(input_df)[0])
        except Exception as e:
            print(f"Energy prediction error: {e}")
            next_hour_kwh = (p1 * 0.7 + p3 * 0.3) / 1000.0
    else:
        next_hour_kwh = (p1 * 0.7 + p3 * 0.3) / 1000.0

    # Build 24h curve (simulating typical day)
    hourly_curve = []
    accumulated_today = 0.0
    for h in [6, 8, 10, 12, 14, 16, 18, 20, 22]:
        is_past = h <= hour
        # Simulated curve
        base_h = 0.25 + (0.35 if 9 <= h <= 21 else 0.05)
        curve_kwh = round(base_h + np.sin(h / 3.8) * 0.12, 2)
        accumulated_today += curve_kwh
        hourly_curve.append({
            "t": f"{h % 12 or 12}{'am' if h < 12 else 'pm'}",
            "actual": curve_kwh if is_past else None,
            "predicted": round(curve_kwh * 1.08, 2)
        })

    today_est = round(max(2.1, accumulated_today * 1.2), 2)
    monthly_est = round(today_est * 30 * 0.92, 1)

    return {
        "predicted_next_hour_kwh": round(next_hour_kwh, 3),
        "predicted_today_kwh": today_est,
        "predicted_monthly_kwh": monthly_est,
        "confidence": 88.0,
        "hourly_curve": hourly_curve
    }

@app.post("/recommend", response_model=RecommendationResponse)
def get_recommendations(req: RecommendationRequest):
    recs = []

    # 1. Fan check
    if req.socket1_appliance.lower() == "fan":
        if req.socket1_power > 100.0:
            est_saving = round((req.socket1_power - 80.0) * req.socket1_hours_active * 30 / 1000.0 * req.tariff_rate, 0)
            recs.append({
                "type": "USAGE_PATTERN",
                "color": "amber",
                "title": "Fan Power Deviation",
                "text": f"Your fan is drawing {req.socket1_power:.0f}W (15% above optimal 80W). Cleaning blades and servicing bearings can save ~₹{est_saving:.0f}/month."
            })
        elif req.socket1_hours_active > 10.0:
            recs.append({
                "type": "USAGE_PATTERN",
                "color": "blue",
                "title": "Continuous Fan Operation",
                "text": f"Fan on Socket 1 has been active for {req.socket1_hours_active:.1f} hours today. Consider setting an Auto-OFF timer."
            })

    # 2. Laptop check
    if req.socket2_appliance.lower() == "laptop":
        if req.socket2_hours_active > 5.0 and req.socket2_power < 40.0:
            recs.append({
                "type": "OPTIMIZATION",
                "color": "emerald",
                "title": "Laptop Fully Charged",
                "text": f"Socket 2 has been in trickle/idle state ({req.socket2_power:.0f}W) for {req.socket2_hours_active:.1f}h. Disconnecting reduces battery wear and standby power."
            })

    # 3. Peak tariff reminder
    tariff_saving = round(0.4 * 3.0 * 30 * req.tariff_rate * 0.15, 0)
    recs.append({
        "type": "SAVING",
        "color": "purple",
        "title": "Peak Tariff Optimization",
        "text": f"Running high-drain appliances outside peak hours (6 PM – 9 PM) can save up to ₹{tariff_saving:.0f} on your monthly bill."
    })

    return {"recommendations": recs}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

