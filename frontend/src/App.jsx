import { useState, useEffect } from "react";

function App() {
  const [aqiData, setAqiData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/aqi")
      .then((res) => {
        if (!res.ok) throw new Error("Could not connect to backend");
        return res.json();
      })
      .then((data) => setAqiData(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error)
    return <div style={{ color: "red", padding: "2rem" }}>Error: {error}</div>;
  if (!aqiData)
    return <div style={{ padding: "2rem" }}>Loading AI Forecast...</div>;

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        maxWidth: "600px",
        margin: "auto",
      }}
    >
      <h1>🌍 Air Quality AI Predictor</h1>

      <div
        style={{
          background: "#f4f4f4",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}
      >
        <h2>Current Conditions</h2>
        <p>
          <strong>PM2.5 Level:</strong> {aqiData.current_data.pm25} µg/m³
        </p>
        <p>
          <strong>Temperature:</strong> {aqiData.current_data.temp}°C
        </p>
        <p>
          <strong>Humidity:</strong> {aqiData.current_data.humidity}%
        </p>
      </div>

      <div
        style={{
          background: "#e3f2fd",
          padding: "1.5rem",
          borderRadius: "8px",
        }}
      >
        <h2>🤖 AI Forecast</h2>
        <p>
          <strong>Next 24 Hours:</strong> {aqiData.forecast["24h"]} AQI
        </p>
        <p>
          <strong>Next 48 Hours:</strong> {aqiData.forecast["48h"]} AQI
        </p>
        <p>
          <strong>Next 72 Hours:</strong> {aqiData.forecast["72h"]} AQI
        </p>
      </div>
    </div>
  );
}

export default App;
