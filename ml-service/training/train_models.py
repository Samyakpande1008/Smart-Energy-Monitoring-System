import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest, RandomForestRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

os.makedirs(os.path.join(os.path.dirname(__file__), '../models'), exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), '../data'), exist_ok=True)

print("--- Generating Simulated Electrical Dataset for ML Training ---")
np.random.seed(42)

def generate_samples(appliance, n_samples, power_range, current_range, var_range, voltage_range=(225, 235)):
    samples = []
    for _ in range(n_samples):
        v = np.random.uniform(*voltage_range)
        mean_p = np.random.uniform(*power_range)
        p_std = np.random.uniform(*var_range)
        peak_p = mean_p + p_std * np.random.uniform(1.2, 2.5)
        min_p = max(0, mean_p - p_std * np.random.uniform(0.8, 1.8))
        curr = mean_p / v + np.random.normal(0, 0.02)
        curr = max(0.01, curr)
        curr_var = (p_std / v) ** 2
        energy_rate = mean_p / 1000.0
        samples.append({
            'voltage': round(v, 2),
            'current': round(curr, 3),
            'avg_power': round(mean_p, 2),
            'peak_power': round(peak_p, 2),
            'min_power': round(min_p, 2),
            'power_variance': round(p_std ** 2, 3),
            'power_std': round(p_std, 3),
            'current_variance': round(curr_var, 5),
            'energy_rate': round(energy_rate, 4),
            'appliance': appliance
        })
    return samples

data = []
# 1. Bulb (5 - 25 W, very low variance)
data.extend(generate_samples('Bulb', 400, (8, 22), (0.03, 0.10), (0.2, 1.5)))

# 2. Fan (60 - 110 W, moderate inductive motor ripple)
data.extend(generate_samples('Fan', 400, (65, 108), (0.32, 0.52), (3.0, 7.5)))

# 3. Laptop (35 - 85 W, SMPS switching & battery charge steps)
data.extend(generate_samples('Laptop', 400, (40, 80), (0.18, 0.38), (5.0, 14.0)))

# 4. TV (70 - 160 W, display panel & backlight)
data.extend(generate_samples('TV', 400, (75, 155), (0.35, 0.72), (7.0, 18.0)))

# 5. Iron (800 - 1400 W, high resistive heater element)
data.extend(generate_samples('Iron', 400, (850, 1350), (3.8, 6.1), (25.0, 70.0)))

# 6. Unknown / Standby
data.extend(generate_samples('Unknown', 250, (0.5, 7.0), (0.005, 0.035), (0.05, 0.8)))

df = pd.DataFrame(data)
csv_path = os.path.join(os.path.dirname(__file__), '../data/appliance_training_data.csv')
df.to_csv(csv_path, index=False)
print(f"Saved dataset ({len(df)} records) to {csv_path}")

feature_cols = [
    'voltage', 'current', 'avg_power', 'peak_power', 'min_power',
    'power_variance', 'power_std', 'current_variance', 'energy_rate'
]

X = df[feature_cols]
y = df['appliance']

encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)

print("\n--- Training Random Forest Appliance Classifier ---")
clf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"Validation Accuracy: {acc * 100:.2f}%")
print(classification_report(y_test, y_pred, target_names=encoder.classes_))

# Save appliance classifier artifacts
models_dir = os.path.join(os.path.dirname(__file__), '../models')
joblib.dump(clf, os.path.join(models_dir, 'appliance_rf.joblib'))
joblib.dump(scaler, os.path.join(models_dir, 'appliance_scaler.joblib'))
joblib.dump(encoder, os.path.join(models_dir, 'appliance_encoder.joblib'))
joblib.dump(feature_cols, os.path.join(models_dir, 'feature_cols.joblib'))
print("Saved appliance classification artifacts.")

# -------------------------------------------------------------
# Train Isolation Forest for Anomaly Detection
# -------------------------------------------------------------
print("\n--- Training Isolation Forest Anomaly Detector ---")
normal_records = df[df['appliance'].isin(['Fan', 'Laptop', 'TV', 'Bulb'])][['voltage', 'current', 'avg_power', 'power_std']]
anomaly_scaler = StandardScaler()
X_norm_scaled = anomaly_scaler.fit_transform(normal_records)

iso_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
iso_forest.fit(X_norm_scaled)

joblib.dump(iso_forest, os.path.join(models_dir, 'anomaly_model.joblib'))
joblib.dump(anomaly_scaler, os.path.join(models_dir, 'anomaly_scaler.joblib'))
print("Saved anomaly detection artifacts.")

# -------------------------------------------------------------
# Train Energy Consumption Predictor
# -------------------------------------------------------------
print("\n--- Training Energy Consumption Forecasting Model ---")
# Features: [hour_of_day, day_of_week, rolling_1h_power, rolling_3h_power, active_sockets]
# Target: next_hour_kwh
energy_samples = []
for day in range(14):
    day_of_week = day % 7
    for hour in range(24):
        # Realistic diurnal pattern
        is_day = 8 <= hour <= 22
        is_evening_peak = 18 <= hour <= 21
        
        base_power = 60 + (80 if is_day else 15) + (50 if is_evening_peak else 0)
        power_noise = np.random.normal(0, 12)
        power_1h = max(10, base_power + power_noise)
        power_3h = max(10, base_power * 0.95 + np.random.normal(0, 8))
        active_sockets = 2 if is_day else (1 if hour > 22 or hour < 2 else 0)
        
        next_hour_kwh = (power_1h * 0.6 + power_3h * 0.4) / 1000.0 + np.random.normal(0, 0.01)
        next_hour_kwh = max(0.005, next_hour_kwh)
        
        energy_samples.append({
            'hour_of_day': hour,
            'day_of_week': day_of_week,
            'rolling_1h_power': power_1h,
            'rolling_3h_power': power_3h,
            'active_sockets': active_sockets,
            'next_hour_kwh': round(next_hour_kwh, 4)
        })

energy_df = pd.DataFrame(energy_samples)
energy_features = ['hour_of_day', 'day_of_week', 'rolling_1h_power', 'rolling_3h_power', 'active_sockets']
X_energy = energy_df[energy_features]
y_energy = energy_df['next_hour_kwh']

energy_model = RandomForestRegressor(n_estimators=80, max_depth=8, random_state=42)
energy_model.fit(X_energy, y_energy)

joblib.dump(energy_model, os.path.join(models_dir, 'energy_model.joblib'))
joblib.dump(energy_features, os.path.join(models_dir, 'energy_features.joblib'))
print("Saved energy forecasting model.")
print("\n[SUCCESS] All ML models trained and artifacts persisted successfully!")
