from dotenv import load_dotenv
import os
from typing import Dict
from fastapi import FastAPI
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="ML Service (mock)")


class PredictPayload(BaseModel):
    pm25: float
    pm10: float
    co: float
    no2: float
    so2: float
    o3: float
    temp: float
    humidity: float
    wind_speed: float


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(payload: PredictPayload) -> Dict:
    # Simple deterministic heuristic predictor (placeholder for real model)
    features = [
        payload.pm25, payload.pm10, payload.co, payload.no2,
        payload.so2, payload.o3, payload.temp, payload.humidity, payload.wind_speed
    ]

    # weighted sum to create three horizon predictions (24h,48h,72h)
    base = sum(features[:6]) * 0.6 + payload.temp * 0.2 + payload.humidity * 0.1
    pred24 = max(0, base / 6.0)
    pred48 = max(0, pred24 * 1.05)
    pred72 = max(0, pred48 * 1.08)

    # confidence heuristic (higher when pollutant levels low)
    mean_pollutant = sum(features[:6]) / 6.0
    confidence = float(max(0.2, 1.0 - (mean_pollutant / 200.0)))

    return {
        "predictions": [round(pred24, 2), round(pred48, 2), round(pred72, 2)],
        "confidence": round(confidence, 2)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))