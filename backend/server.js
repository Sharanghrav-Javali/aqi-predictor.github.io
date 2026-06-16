const express = require("express");
const axios = require("axios");
const cors = require("cors");
const NodeCache = require("node-cache");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Cache predictions for 1 hour to save API calls
const cache = new NodeCache({ stdTTL: 3600 });

const OWM_API_KEY = process.env.OWM_API_KEY;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

console.log("ML_SERVICE_URL =", ML_SERVICE_URL);

app.get(["/api/aqi", "/api/predict-aqi"], async (req, res) => {
  const lat = req.query.lat || "40.7128";
  const lon = req.query.lon || "-74.0060";
  const forceRefresh = req.query.refresh === "true";
  console.log("Received /api/aqi request with query:", req.query);
  const cacheKey = `${lat},${lon}`;

  if (cache.has(cacheKey) && !forceRefresh) {
    return res.json(cache.get(cacheKey));
  }

  try {
    let weather, pollution, currentAqi;
    if (!OWM_API_KEY) {
      console.warn(
        "OWM_API_KEY not set — using mocked weather/pollution data for local testing",
      );
      // mocked responses (typical structure from OWM)
      weather = { main: { temp: 20.0, humidity: 50 }, wind: { speed: 3.5 } };
      pollution = {
        pm2_5: 12.0,
        pm10: 20.0,
        co: 0.3,
        no2: 15.0,
        so2: 4.0,
        o3: 30.0,
      };
      currentAqi = 2; // OWM 1-5 scale
    } else {
      // 1. Fetch current weather & pollution
      const [weatherRes, pollutionRes] = await Promise.all([
        axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric`,
        ),
        axios.get(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}`,
        ),
      ]);

      weather = weatherRes.data;
      pollution = pollutionRes.data.list[0].components;
      currentAqi = pollutionRes.data.list[0].main.aqi;
    }

    // 2. Prepare payload for ML service
    const mlPayload = {
      pm25: pollution.pm2_5,
      pm10: pollution.pm10,
      co: pollution.co,
      no2: pollution.no2,
      so2: pollution.so2,
      o3: pollution.o3,
      temp: weather.main.temp,
      humidity: weather.main.humidity,
      wind_speed: weather.wind.speed,
    };

    // 3. Get Prediction
    console.log(
      "Posting payload to ML service at",
      ML_SERVICE_URL + "/predict",
    );
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      mlPayload,
      { timeout: 5000 },
    );

    const responseData = {
      current_data: {
        pm25: pollution.pm2_5 || pollution.pm25 || 0,
        temp: weather.main.temp,
        humidity: weather.main.humidity,
      },
      forecast: {
        "24h": mlResponse.data.predictions[0],
        "48h": mlResponse.data.predictions[1],
        "72h": mlResponse.data.predictions[2],
      },
      current_aqi: currentAqi,
      current_pollutants: pollution,
      confidence: mlResponse.data.confidence,
    };

    cache.set(cacheKey, responseData);
    res.json(responseData);
  } catch (error) {
    console.error("Error fetching AQI data:", error && error.message);
    try {
      console.error(
        "Full error:",
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
    } catch (e) {
      console.error(error);
    }
    if (error && error.response) {
      console.error("Upstream response status:", error.response.status);
      console.error(
        "Upstream response data:",
        JSON.stringify(error.response.data),
      );
    }
    res.status(500).json({ error: "Failed to fetch or predict AQI" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
