import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
import pickle

# 1. Data Loading (Mocked for execution, replace with real historical CSV)
# Features: PM2.5, PM10, CO, NO2, SO2, O3, Temp, Humidity, WindSpeed
np.random.seed(42)
num_samples = 5000
X = np.random.rand(num_samples, 9) * 100 
# Targets: AQI in 24h, 48h, 72h
y = X[:, 0:1] * 1.5 + np.random.rand(num_samples, 3) * 20

# 2. Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Model Training
rf = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
model = MultiOutputRegressor(rf)
model.fit(X_train, y_train)

# 4. Evaluation
predictions = model.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, predictions))
mae = mean_absolute_error(y_test, predictions)

print(f"Model Trained! Metrics:")
print(f"RMSE: {rmse:.2f} | MAE: {mae:.2f}")

# 5. Save Model
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)
print("Model saved as model.pkl")