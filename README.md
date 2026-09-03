# 🚗 RoadScan

### Smart Road Monitoring & Pothole Detection

RoadScan is a smart road-monitoring web application that detects potential potholes using smartphone motion sensors and GPS location data.

🔗 **[🌐 Live Demo](https://roadscan.onrender.com/)**

---

## ✨ Features

* 📱 **Motion-Based Pothole Detection**
  Detects sudden road impacts using smartphone motion sensors.

* 📊 **Severity Classification**
  Classifies detected impacts as **Minor, Moderate, or Severe**.

* 🚧 **False-Positive Filtering**
  Filters patterns associated with **speed breakers and walking motion** to reduce incorrect detections.

* 📍 **GPS Location Tracking**
  Associates detected road hazards with their geographical location.

* 🗺️ **Interactive Hazard Map**
  Displays reported potholes along with the user's location and direction.

* ⚠️ **Nearby Pothole Warnings**
  Alerts users when they approach a previously reported road hazard.

* 🔄 **Duplicate Report Merging**
  Combines reports detected near the same location to reduce duplicate entries.

* 👥 **Report Counting**
  Tracks multiple detections of the same road hazard.

* 🧪 **Detection Simulation**
  Allows the detection workflow to be demonstrated without requiring an actual road impact.

---

## 🧠 How It Works

```text
        📱 Smartphone Motion Sensor
                    ↓
            Impact Detection
                    ↓
          False-Positive Filtering
                    ↓
          Severity Classification
                    ↓
               📍 GPS Location
                    ↓
              🔥 Firebase
                    ↓
            🗺️ Interactive Map
                    ↓
          ⚠️ Nearby Hazard Warning
```

RoadScan analyzes smartphone motion data to identify sudden road impacts. Potential false positives, such as walking motion and speed breakers, are filtered before an impact is classified by severity.

Each detected road hazard is associated with its GPS location and stored in Firebase. Reports from nearby locations are merged to reduce duplicates, while the interactive map displays reported hazards and provides warnings when users approach them.

---

## 🛠️ Tech Stack

| Category        | Technologies                                   |
| --------------- | ---------------------------------------------- |
| **Frontend**    | React, JavaScript                              |
| **Build Tool**  | Vite                                           |
| **Database**    | Firebase                                       |
| **Mapping**     | Leaflet, React Leaflet, OpenStreetMap          |
| **Device APIs** | Geolocation, Device Motion, Device Orientation |
