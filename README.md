# 🚗 RoadScan 🛣️

RoadScan is a smart road-monitoring web application that detects potential potholes using smartphone motion sensors and GPS location data.

Detected road hazards are stored in Firebase and displayed on an interactive map, allowing users to identify and receive warnings about nearby potholes.

## ✨ Features

* 📱 Motion-based pothole detection
* 📊 Minor, Moderate & Severe severity classification
* 🚧 False-positive filtering for speed breakers and walking motion
* 📍 GPS-based pothole location
* 🗺️ Interactive hazard map with user direction
* ⚠️ Nearby pothole warnings
* 🔄 Duplicate report merging and report counting
* 🧪 Detection simulation for demonstration

## 🧠 How It Works

📱 Smartphone Motion Sensor
↓
💥 Impact Detection
↓
🚧 False-Positive Filtering
↓
📊 Severity Classification
↓
📍 GPS Location
↓
🔥 Firebase
↓
🗺️ Interactive Map
↓
⚠️ Nearby Hazard Warning

RoadScan analyzes smartphone motion data to identify sudden road impacts. The system filters patterns that may correspond to walking or speed breakers before classifying an impact as a potential pothole.

Each detected pothole is associated with the user's GPS location and stored in Firebase. Nearby reports are merged to reduce duplicates, while the interactive map displays reported hazards and warns users when they approach them.

## 🛠️ Tech Stack

* ⚛️ Frontend: React, Vite, JavaScript
* 🔥 Database: Firebase
* 🗺️ Maps: Leaflet, React Leaflet, OpenStreetMap
* 📱 Device APIs: Geolocation, Device Motion, Device Orientation
