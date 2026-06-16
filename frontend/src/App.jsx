import { useState, useEffect, useCallback } from "react";

function App() {
  const [aqiData, setAqiData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [locationStatus, setLocationStatus] = useState("Acquiring GPS location...");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(30);

  // Helper to get AQI label, styles, and description
  const getAqiDetails = (aqiValue) => {
    const score = Math.round(aqiValue);
    if (score <= 1) {
      return {
        label: "Good",
        classAqi: "aqi-good",
        classBg: "bg-good",
        desc: "Air quality is satisfactory, and air pollution poses little or no risk.",
      };
    }
    if (score <= 2) {
      return {
        label: "Moderate",
        classAqi: "aqi-moderate",
        classBg: "bg-moderate",
        desc: "Air quality is acceptable. However, there may be a risk for some sensitive individuals.",
      };
    }
    if (score <= 3) {
      return {
        label: "Poor",
        classAqi: "aqi-moderate",
        classBg: "bg-moderate",
        desc: "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
      };
    }
    if (score <= 4) {
      return {
        label: "Unhealthy",
        classAqi: "aqi-unhealthy",
        classBg: "bg-unhealthy",
        desc: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.",
      };
    }
    return {
      label: "Very Poor",
      classAqi: "aqi-unhealthy",
      classBg: "bg-unhealthy",
      desc: "Health warning of emergency conditions. The entire population is more likely to be affected.",
    };
  };

  // Fetch AQI function
  const fetchAqiData = useCallback(async (lat, lon, force = false) => {
    if (lat === null || lon === null) return;
    if (force) setIsRefreshing(true);
    
    try {
      const url = `http://localhost:5000/api/aqi?lat=${lat}&lon=${lon}${force ? "&refresh=true" : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not connect to backend server");
      
      const data = await response.json();
      setAqiData(data);
      setLastUpdated(new Date().toLocaleTimeString());
      setCountdown(30);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Request browser geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("🗽 Default Location (New York, NY) — Geolocation unsupported");
      setCoords({ lat: 40.7128, lon: -74.0060 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("📍 Live GPS Location");
        setCoords({
          lat: position.coords.latitude.toFixed(4),
          lon: position.coords.longitude.toFixed(4),
        });
      },
      (error) => {
        console.warn("Geolocation permission denied/failed. Defaulting to NY.", error);
        setLocationStatus("🗽 Default Location (New York, NY) — Geolocation denied");
        setCoords({ lat: 40.7128, lon: -74.0060 });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Fetch when coordinates are resolved
  useEffect(() => {
    if (coords.lat !== null && coords.lon !== null) {
      fetchAqiData(coords.lat, coords.lon, false);
    }
  }, [coords, fetchAqiData]);

  // Real-time ticking countdown and auto-refresh
  useEffect(() => {
    if (coords.lat === null || coords.lon === null) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchAqiData(coords.lat, coords.lon, false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [coords, fetchAqiData]);

  const handleManualRefresh = () => {
    fetchAqiData(coords.lat, coords.lon, true);
  };

  const aqiInfo = aqiData ? getAqiDetails(aqiData.current_aqi) : null;

  return (
    <div className="dashboard">
      <div className="header">
        <div className="title-group">
          <h1>🌍 Air Quality AI Predictor</h1>
          <div className="live-badge">
            <span className="live-dot"></span>
            <span>LIVE UPDATING</span>
          </div>
        </div>
        
        <button 
          className="refresh-button" 
          onClick={handleManualRefresh} 
          disabled={loading || isRefreshing}
          title="Force refresh (bypasses cache)"
        >
          <svg 
            className={`refresh-icon ${isRefreshing ? "spinning" : ""}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
        </button>
      </div>

      <div className="location-info">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>
          {locationStatus} ({coords.lat ? `${coords.lat}°N, ${coords.lon}°E` : "Locating..."})
        </span>
      </div>

      {error && (
        <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
          <strong>Error:</strong> {error}. Please ensure Express backend (Port 5000) and ML Service (Port 8000) are running.
        </div>
      )}

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
          <div className="spinning" style={{ display: "inline-block", width: "40px", height: "40px", border: "4px solid rgba(255,255,255,0.1)", borderTopColor: "var(--color-primary)", borderRadius: "50%", marginBottom: "1rem" }}></div>
          <div>Loading real-time forecasts...</div>
        </div>
      ) : (
        aqiData && (
          <>
            <div className="grid-2">
              {/* Current AQI Panel */}
              <div className="card">
                <h3 className="card-title">
                  <span style={{ fontSize: "1.2rem" }}>📊</span> Current AQI Index
                </h3>
                <div className="aqi-hero">
                  <div className={`aqi-score ${aqiInfo.classAqi}`}>
                    {aqiData.current_aqi}
                  </div>
                  <div className="aqi-label-wrapper">
                    <span className={`aqi-badge ${aqiInfo.classBg}`}>
                      {aqiInfo.label}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  {aqiInfo.desc}
                </p>
                <div className="weather-stats" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "1rem", marginTop: "1rem" }}>
                  <div className="weather-item">
                    <div className="weather-val">{aqiData.current_data.temp}°C</div>
                    <div className="weather-label">Temp</div>
                  </div>
                  <div className="weather-item">
                    <div className="weather-val">{aqiData.current_data.humidity}%</div>
                    <div className="weather-label">Humidity</div>
                  </div>
                </div>
              </div>

              {/* Pollutants Breakdown */}
              <div className="card">
                <h3 className="card-title">
                  <span style={{ fontSize: "1.2rem" }}>🧪</span> Pollutant Breakdown
                </h3>
                <div className="pollutants-list">
                  <div className="pollutant-badge">
                    <div className="pollutant-name">PM2.5</div>
                    <div className="pollutant-val">{aqiData.current_data.pm25.toFixed(1)}</div>
                  </div>
                  <div className="pollutant-badge">
                    <div className="pollutant-name">PM10</div>
                    <div className="pollutant-val">{aqiData.current_pollutants.pm10.toFixed(1)}</div>
                  </div>
                  <div className="pollutant-badge">
                    <div className="pollutant-name">CO</div>
                    <div className="pollutant-val">{aqiData.current_pollutants.co.toFixed(2)}</div>
                  </div>
                  <div className="pollutant-badge">
                    <div className="pollutant-name">NO₂</div>
                    <div className="pollutant-val">{aqiData.current_pollutants.no2.toFixed(1)}</div>
                  </div>
                  <div className="pollutant-badge">
                    <div className="pollutant-name">SO₂</div>
                    <div className="pollutant-val">{aqiData.current_pollutants.so2.toFixed(1)}</div>
                  </div>
                  <div className="pollutant-badge">
                    <div className="pollutant-name">O₃</div>
                    <div className="pollutant-val">{aqiData.current_pollutants.o3.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Predictions */}
            <div className="card" style={{ marginBottom: "2rem" }}>
              <h3 className="card-title">
                <span style={{ fontSize: "1.2rem" }}>🤖</span> Machine Learning Forecast (Heuristic RandomForest)
              </h3>
              <div className="forecast-grid">
                <div className="forecast-card">
                  <div className="forecast-time">24h Forecast</div>
                  <div className="forecast-val">{aqiData.forecast["24h"].toFixed(1)}</div>
                </div>
                <div className="forecast-card">
                  <div className="forecast-time">48h Forecast</div>
                  <div className="forecast-val">{aqiData.forecast["48h"].toFixed(1)}</div>
                </div>
                <div className="forecast-card">
                  <div className="forecast-time">72h Forecast</div>
                  <div className="forecast-val">{aqiData.forecast["72h"].toFixed(1)}</div>
                </div>
              </div>
              <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>Forecast confidence: <strong>{Math.round(aqiData.confidence * 100)}%</strong></span>
                <span>Algorithm: scikit-learn MultiOutput Random Forest</span>
              </div>
            </div>
          </>
        )
      )}

      <div className="status-bar">
        <span>Last updated: {lastUpdated || "Never"}</span>
        <span className="countdown">Next refresh in {countdown}s</span>
      </div>
    </div>
  );
}

export default App;
