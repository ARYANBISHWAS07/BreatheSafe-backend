# Visual Setup Guide: Mock PM2.5 Sensor

## Architecture Without Real Sensor

```
┌─────────────────────────────────────────────────────────────┐
│                     WITHOUT REAL SENSOR                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Mock PM2.5          │  ← Simulates realistic sensor data
│  Simulator           │    every 10 seconds
│  (mock-pm25-         │
│   simulator.js)      │
└──────┬───────────────┘
       │
       │ Publishes realistic data
       │ (PM2.5, Temp, Humidity, etc)
       │
       ▼
┌──────────────────────┐
│  MQTT Broker         │  ← Message queue
│  (localhost:1883)    │    (eclipse-mosquitto)
└──────┬───────────────┘
       │
       │ Subscribes to messages
       │
       ▼
┌──────────────────────┐
│  Backend Server      │  ← Processes data
│  (npm run dev)       │    Stores in DB
│  Express + Node.js   │    Emits via Socket.IO
└──────┬───────────────┘
       │
       │ Real-time updates
       │
       ▼
┌──────────────────────┐
│  Frontend App        │  ← Shows data
│  (http://3001)       │    Dashboard
│  React/Vue/etc       │    Charts & alerts
└──────────────────────┘
```

---

## Step-by-Step Setup

### Step 1️⃣: Start MQTT Broker
```bash
docker run -p 1883:1883 eclipse-mosquitto
```

```
┌─────────────────────────────┐
│  🟢 MQTT Ready              │
│  Listening on 1883          │
└─────────────────────────────┘
```

### Step 2️⃣: Start Mock Simulator
```bash
node mock-pm25-simulator.js
```

```
┌─────────────────────────────┐
│  🟢 MQTT Ready              │
│  Listening on 1883          │
└──────────┬──────────────────┘
           ▲
           │ Connected
           │
┌──────────┴──────────────────┐
│  🟢 Simulator Running        │
│  Publishing every 10s       │
│  - PM2.5: 28.5 µg/m³        │
│  - Temp: 22.3°C             │
│  - Humidity: 65%            │
└─────────────────────────────┘
```

### Step 3️⃣: Start Backend
```bash
npm run dev
```

```
┌─────────────────────────────┐
│  🟢 MQTT Ready              │
│  Listening on 1883          │
└──────────┬──────────────────┘
           ▲
           │ Connected
           │
┌──────────┴──────────────────┐
│  🟢 Simulator Running        │
│  Publishing every 10s       │
└──────────┬──────────────────┘
           ▲
           │ Subscribed
           │
┌──────────┴──────────────────┐
│  🟢 Backend Running          │
│  Port 3000 (API)            │
│  Port 3000 (Socket.IO)      │
│  ✓ Processing data          │
│  ✓ Storing in MongoDB       │
└─────────────────────────────┘
```

### Step 4️⃣: Open Frontend
```bash
open http://localhost:3001
```

```
┌─────────────────────────────┐
│  🟢 MQTT Ready              │
│  Listening on 1883          │
└──────────┬──────────────────┘
           ▲
           │
┌──────────┴──────────────────┐
│  🟢 Simulator Running        │
│  Publishing every 10s       │
└──────────┬──────────────────┘
           ▲
┌──────────┴──────────────────┐
│  🟢 Backend Running          │
│  - Processed: 143 readings   │
│  - Avg PM2.5: 32.1 µg/m³    │
│  - Uptime: 5 min 32 sec      │
└──────────┬──────────────────┘
           │ Socket.IO
           │ Real-time updates
           ▼
┌─────────────────────────────┐
│  🟢 Frontend (Browser)       │
│  http://localhost:3001      │
│                             │
│  📊 Dashboard               │
│  ├─ PM2.5: 28.5 µg/m³       │
│  ├─ AQI: 75 (Moderate)      │
│  ├─ Temp: 22.3°C            │
│  ├─ Humidity: 65%           │
│  ├─ Exposure: 2.34 hrs      │
│  └─ Status: ✅ Good         │
└─────────────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Mock Sensor Generates Data                                  │
│                                                              │
│  08:00 AM: PM2.5=28, Temp=22°C, Humidity=65%               │
│  08:10 AM: PM2.5=30, Temp=22°C, Humidity=64%               │
│  08:20 AM: PM2.5=32, Temp=22°C, Humidity=65%               │
│  (Every 10 seconds)                                          │
└────────────┬─────────────────────────────────────────────────┘
             │
             │ JSON Payload via MQTT
             │
    {"pm25": 28.5,
     "mq135Voltage": 0.45,
     "temperature": 22.3,
     "humidity": 65,
     "recordedAt": 1711814400000}
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  MQTT Broker Queues Message                                 │
│  Topic: air-quality/sensor                                  │
└────────────┬─────────────────────────────────────────────────┘
             │
             │ Backend subscribes
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Backend Processes Data                                     │
│                                                              │
│  1. Validates: pm25, temp, humidity ranges ✓               │
│  2. Calculates: AQI, UAQS, Exposure ✓                      │
│  3. Stores: Saves to MongoDB ✓                             │
│  4. Broadcasts: Emits via Socket.IO ✓                      │
└────────────┬─────────────────────────────────────────────────┘
             │
             │ Socket.IO Real-time Event
             │
    {
     "pm25": 28.5,
     "aqi": 75,
     "aqiCategory": "Moderate",
     "temperature": 22.3,
     "humidity": 65,
     "humidityFactor": 0.98,
     "uaqs": 45,
     "uaqsCategory": "Moderate",
     "ucri": 156.4,
     "ucriLevel": "MODERATE",
     "exposure": 2.34,
     "exposure1h": 45.2,
     "exposure3h": 42.8
    }
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Frontend Displays Data                                      │
│                                                              │
│  ☀️  PM2.5: 28.5 µg/m³                                       │
│  📊 AQI: 75 (Moderate)                                       │
│  🌡️  Temp: 22.3°C                                            │
│  💧 Humidity: 65%                                            │
│  ⏱️  Exposure: 2h 20min                                       │
│  ✅ Status: Moderate Air Quality                             │
└──────────────────────────────────────────────────────────────┘
```

---

## Terminal Layout

Best setup uses 4 terminals side-by-side:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Terminal 1  │  Terminal 2  │  Terminal 3  │  Terminal 4  │
├──────────────┼──────────────┼──────────────┼──────────────┤
│              │              │              │              │
│ MQTT Broker  │ Simulator    │ Backend      │ Monitor MQTT │
│              │              │              │              │
│ $ docker run │ $ node mock- │ $ npm run    │ $ mosquitto_ │
│   -p 1883    │   pm25-      │   dev        │   sub -t     │
│   eclipse-   │   simulator  │              │   air-       │
│   mosquitto  │   .js        │              │   quality/   │
│              │              │              │   sensor     │
│ 🟢 Ready     │ 🟢 Running   │ 🟢 Ready     │ 🟢 Listening │
│              │              │              │              │
│ Publish:     │ Publish:     │ Process:     │ Monitor:     │
│ messages to  │ every 10s    │ Save to DB   │ See all msg  │
│ air-quality/ │              │ Emit Socket  │ in real-time │
│ sensor       │              │              │              │
│              │              │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## What You'll See

### Simulator Console
```
✅ [8:00 AM] Sensor Reading
   PM2.5: 28.5 µg/m³
   Temperature: 22.3°C
   Humidity: 65%
   MQ135 Voltage: 0.45V
   MQ135 PPM: 45
   ✓ Published to MQTT
```

### Backend Console
```
[INFO] ✓ Connected to MQTT broker
[INFO] Using pre-processed MQTT data
[INFO] ✓ Sensor data processed and saved
[DEBUG] Sensor update broadcast to 1 clients
```

### MQTT Monitor
```
air-quality/sensor {"pm25":28.5,"temperature":22.3,...}
air-quality/sensor {"pm25":29.1,"temperature":22.5,...}
air-quality/sensor {"pm25":30.2,"temperature":22.4,...}
```

### Frontend Display
```
🌍 Air Quality Dashboard

📊 Current Reading
   PM2.5: 28.5 µg/m³
   AQI: 75 (Moderate) 🟡
   Temperature: 22.3°C
   Humidity: 65%
   Exposure: 2h 20min

📈 Trends
   1h Average: 45 UAQS
   3h Average: 42 UAQS
   Last Update: 2 seconds ago
```

---

## Troubleshooting Visual

```
Is MQTT running?
├─ NO  → docker run -p 1883:1883 eclipse-mosquitto
│        then go to next step
│
└─ YES → Is simulator running?
         ├─ NO  → node mock-pm25-simulator.js
         │        then go to next step
         │
         └─ YES → Is backend running?
                  ├─ NO  → npm run dev
                  │        then go to next step
                  │
                  └─ YES → Is frontend showing data?
                           ├─ NO  → Check console for errors
                           │        Check MQTT topic matches
                           │
                           └─ YES → 🎉 All working!
```

---

## Success Indicators

✅ All these should be green:

- [ ] MQTT broker shows "Connected" or "Listening"
- [ ] Simulator shows "Published to MQTT" messages
- [ ] Backend shows "Sensor data processed and saved"
- [ ] Frontend shows real-time sensor readings
- [ ] Values change every 10 seconds (not static)
- [ ] PM2.5 is realistic (8-95 µg/m³, not 0)
- [ ] Temperature varies (20-28°C range)
- [ ] Exposure increases over time

When all are ✅, you're ready to test with the real sensor! 🚀
