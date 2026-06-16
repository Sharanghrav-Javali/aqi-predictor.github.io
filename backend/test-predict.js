const axios = require("axios");

(async () => {
  try {
    const payload = {
      pm25: 12,
      pm10: 20,
      co: 0.3,
      no2: 15,
      so2: 4,
      o3: 30,
      temp: 20,
      humidity: 50,
      wind_speed: 3.5,
    };
    const res = await axios.post("http://localhost:8000/predict", payload, {
      timeout: 5000,
    });
    console.log("ML response:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("Response error:", err.response.status, err.response.data);
    } else {
      console.error("Request error:", err.message);
    }
  }
})();
