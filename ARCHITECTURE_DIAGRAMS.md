# System Architecture & Data Flow Diagrams

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ESP32 Hardware                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Sensors: DHT11, MQ135, PM2.5                             │ │
│  │  Process: Read → Calculate → Publish MQTT                │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │ (MQTT Publish)
                               │ Topic: air-quality/data
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    MQTT Broker (hivemq.com)                      │
│                   Port: 1883 (Unencrypted)                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ (MQTT Subscribe)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Backend Server Node.js                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   MQTTClient (Listener)                    │ │
│  └─────────────────────────┬──────────────────────────────────┘ │
│                            │                                     │
│                ┌───────────┴───────────┐                         │
│                ▼                       ▼                         │
│  ┌─────────────────────┐   ┌─────────────────────┐              │
│  │ SensorDataService   │   │  DataQueue/Buffer   │              │
│  │ • Process reading   │   │  (Offline support)  │              │
│  │ • Calculate metrics │   └─────────────────────┘              │
│  │ • Save to MongoDB   │                                         │
│  └────────┬────────────┘                                         │
│           │                                                       │
│           ▼                                                       │
│  ┌─────────────────────────────────────────────────┐             │
│  │  HealthAlertService                            │             │
│  │  ┌──────────────────────────────────────────┐  │             │
│  │  │ For each classification:                 │  │             │
│  │  │ • Check thresholds                       │  │             │
│  │  │ • Generate health implications           │  │             │
│  │  │ • Create alert with recommendations      │  │             │
│  │  │ • Apply cooldown (5 minutes)             │  │             │
│  │  └──────────────────────────────────────────┘  │             │
│  └──────┬────────────────────────────────────────┘              │
│         │                                                         │
│    ┌────┴─────────────────┬──────────────┐                      │
│    ▼                      ▼              ▼                      │
│ ┌──────────┐        ┌──────────┐   ┌──────────┐                │
│ │ MongoDB  │        │Socket.IO │   │  REST    │                │
│ │ Storage  │        │ Broadcast│   │  Endpoints       │                │
│ └──────────┘        └──────────┘   └──────────┘                │
└──────────────────────────────────────────────────────────────────┘
          │                    │              │
          │                    │              │
   ┌──────┴──────┐    ┌────────┴────────┐  ┌─┴───────────────┐
   ▼             ▼    ▼                 ▼  ▼                 ▼
┌────────┐ ┌──────────────────────────────────────┐  ┌──────────┐
│MongoDB │ │         Frontend Dashboard           │  │REST Cl   │
│Alerts  │ │                                      │  │Clients   │
└────────┘ │  • Real-time Alert Display          │  └──────────┘
           │  • User Classification Management    │
           │  • Alert History & Statistics        │
           │  • Threshold Visualization           │
           └──────────────────────────────────────┘
```

---

## 2. Alert Generation Pipeline

```
                        ┌─────────────────────┐
                        │   Sensor Reading    │
                        │   (PM2.5, AQI, etc) │
                        └──────────┬──────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ Analytics Processing         │
                    │ • Calculate AQI              │
                    │ • Compute UAQS               │
                    │ • Update exposure            │
                    │ • Calculate CRI              │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ Save to MongoDB              │
                    │ • Store all metrics          │
                    │ • Timestamp recording        │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ HealthAlertService.check()   │
                    └──────────────┬───────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
        ┌─────────────┐    ┌─────────────┐   ┌─────────────┐
        │Asthma       │    │Children     │   │Elderly      │
        │Patient      │    │             │   │             │
        │Classification   │Classification   │Classification   │
        └──────┬──────┘    └──────┬──────┘   └──────┬──────┘
               │                  │                  │
        ┌──────▼──────────────────▼──────────────────▼──────┐
        │ Compare All 7 Metrics Against Thresholds          │
        │ • PM2.5, AQI, MQ135_PPM, UAQS, CRI               │
        │ • Temperature, Humidity                           │
        └──────┬───────────────────────────────────────────┘
               │
        ┌──────▼─────────────────────────┐
        │ Any Thresholds Breached?        │
        └──────┬────────────────┬─────────┘
               │ NO             │ YES
               │                ▼
               │        ┌──────────────────────┐
               │        │ Determine Severity   │
               │        │ MODERATE or HIGH?    │
               │        └──────┬───────────────┘
               │               │
               │        ┌──────▼──────────────────┐
               │        │ Check Cooldown (5 min)  │
               │        └──────┬────────┬─────────┘
               │               │        │
               │         ┌─────▼──┐ ┌──▼──────┐
               │         │Not Cool│ │Cool Down│
               │         │Generate │ │Skip     │
               │         │Alert  │ │         │
               │         └─────┬──┘ └──────────┘
               │               │
               ▼               ▼
        ┌─────────────────────────────────────┐
        │ Generate Health-Specific Alert      │
        │ • Get Health Implications           │
        │ • Get Recommendations               │
        │ • List Health Effects               │
        │ • Include Breached Metrics          │
        └──────────────┬──────────────────────┘
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
        ┌────────┐ ┌──────┐ ┌──────────┐
        │MongoDB │ │Socket│ │REST      │
        │Save    │ │.IO   │ │Broadcast │
        │Alert   │ │Emit  │ │          │
        └────────┘ └──────┘ └──────────┘
```

---

## 3. Classification Threshold Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                 Sensor Value Range                          │
│                      (0 to 200)                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐      ┌──────────┐   ┌──────────┐
    │Asthma    │      │Children  │   │Elderly   │
    │Patient   │      │          │   │          │
    └────┬─────┘      └────┬─────┘   └────┬─────┘
         │                 │              │
         ▼                 ▼              ▼
    ┌─────────────┐  ┌──────────┐   ┌──────────┐
    │ MOST        │  │ MODERATE │   │ MOST     │
    │ SENSITIVE   │  │ SENSITIVE│   │ SENSITIVE│
    │             │  │          │   │          │
    │ Thresholds: │  │Thresholds:   │Thresholds:
    │ PM2.5 ≤12  │  │PM2.5 ≤15 │   │PM2.5 ≤10 │
    │ AQI ≤50    │  │AQI ≤60   │   │AQI ≤40   │
    │ UAQS ≤40   │  │UAQS ≤50  │   │UAQS ≤35  │
    └─────────────┘  └──────────┘   └──────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │  ADULTS      │
                   │ (Standard)   │
                   │              │
                   │ PM2.5 ≤20    │
                   │ AQI ≤75      │
                   │ UAQS ≤60     │
                   └──────────────┘

Legend:
■ Most Strict    ■ Strict        ■ Moderate   ■ Standard
```

---

## 4. Real-Time Alert Broadcasting Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Generated Alert                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ • Level: HIGH                                           │ │
│  │ • Classification: asthma_patient                        │ │
│  │ • Message: "Dangerous PM2.5 levels..."                 │ │
│  │ • Effects: [severe distress, asthma attacks]           │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
                ┌────────────────────┐
                │ HealthAlertService │
                │ .emitAlertToClients│
                └────────┬───────────┘
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    ┌─────────────────────────────────────────┐
    │   Socket.IO Server (io instance)        │
    │                                         │
    │  .to('classification_asthma_patient')   │
    │  .emit('health-alert', payload)        │
    └─────────────────────────────────────────┘
           │
           ├─────────────────────────────────┐
           │   Broadcast to Room             │
           │   "classification_asthma_patient"
           │                                 │
    ┌──────▼────────────────────────────────▼──────┐
    │   Connected Client Sockets in Room           │
    │                                              │
    │   Socket 1 ─────────┐                        │
    │   Socket 2 ──────┐  │                        │
    │   Socket 3 ──┐   │  │                        │
    │   Socket 4 ─┼─┐ │  │                        │
    │             │ │ │  │                        │
    └─────────────┼─┼─┼──┼───────────────────────┘
                  │ │ │  │
            ┌─────▼─▼─▼──▼──────┐
            │   Each Client     │
            │   .on('health-alert') handler
            │   Display Alert   │
            │   → Browser Notif │
            │   → UI Update     │
            │   → Sound Alert   │
            └───────────────────┘
```

---

## 5. Database Schema Relationships

```
┌────────────────────────────────────────────────────────────────┐
│                          DATABASE                              │
│                      (MongoDB/Atlas)                           │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Collection: users                                        │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ _id: ObjectId                                           │ │
│  │ name: String                                            │ │
│  │ email: String (unique)                                  │ │
│  │ classification: String ─────────────┐                   │ │
│  │ • asthma_patient                     │                   │ │
│  │ • children                           │                   │ │
│  │ • elderly                            │                   │ │
│  │ • adults                             │                   │ │
│  │ alertPreferences: Object             │                   │ │
│  │ isActive: Boolean                    │                   │ │
│  │ createdAt: Date                      │                   │ │
│  └──────────────────────────────────────┼──────────────────┘ │
│                                         │                     │
│                           ┌─────────────┘                     │
│                           │                                   │
│  ┌────────────────────────▼─────────────────────────────────┐ │
│  │ Collection: alerts                                       │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ _id: ObjectId                                          │ │
│  │ type: 'HEALTH_ALERT' | 'AIR_QUALITY_ALERT'            │ │
│  │ classification: String                                 │ │
│  │ level: 'LOW' | 'MODERATE' | 'HIGH'                    │ │
│  │ title: String                                          │ │
│  │ message: String (health implication)                  │ │
│  │ recommendations: String                                │ │
│  │ potentialHealthEffects: [String]                      │ │
│  │ breachedMetrics: [{metric, value, severity}]         │ │
│  │ triggerValues: {pm25, aqi, temp, humidity...}        │ │
│  │ isAcknowledged: Boolean                               │ │
│  │ createdAt: Date                                        │ │
│  │ expiresAt: Date (TTL cleanup)                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Collection: sensordata                                     │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ _id: ObjectId                                             │ │
│  │ pm25: Number                                              │ │
│  │ aqi: Number                                               │ │
│  │ mq135_ppm: Number                                         │ │
│  │ correctedPPM: Number                                      │ │
│  │ uaqs: Number                                              │ │
│  │ cri: Number                                               │ │
│  │ temperature: Number                                       │ │
│  │ humidity: Number                                          │ │
│  │ timestamp: Number                                         │ │
│  │ recordedAt: Date                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Request/Response Flow Diagram

```
                        FRONTEND CLIENT
                        ┌──────────────┐
                        │  Dashboard   │
                        │  Browser/App │
                        └──────┬───────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
            (1)HTTP        (2)HTTP       (3)WebSocket
            Request         Request       Subscribe
                │              │              │
    ┌───────────┴──────┐       │              │
    ▼                  ▼       ▼              ▼
┌──────────┐      ┌──────────────────┐   ┌─────────────────┐
│ CREATE   │      │ GET ALERTS       │   │ SUBSCRIBE       │
│ USER     │      │ /health-alerts   │   │ subscribe-      │
│ POST     │      │                  │   │ health-alerts   │
│ /users   │      │ Query:           │   │                 │
└────┬─────┘      │ classification   │   │ Emit Event      │
     │            │ limit            │   │ with class      │
     │            └──────┬───────────┘   └────────┬────────┘
     │                   │                         │
     └─────────┬─────────┴──────────┬──────────────┘
               │                    │
               ▼                    ▼
        ┌────────────────────────────────────┐
        │      Express.js Routes             │
        │  ┌──────────────────────────────┐ │
        │  │ POST/GET/PUT/DELETE /users   │ │
        │  │ GET /health-alerts           │ │
        │  │ POST acknowledge             │ │
        │  └──────────────────────────────┘ │
        └────────────────────────────────────┘
               │              │
               ▼              ▼
        ┌────────────────────────────────────┐
        │      Service Layer                 │
        │  ┌──────────────────────────────┐ │
        │  │ UserController               │ │
        │  │ HealthAlertsController       │ │
        │  └──────────────────────────────┘ │
        └────────────────────────────────────┘
               │              │
               ▼              ▼
        ┌────────────────────────────────────┐
        │      MongoDB Queries               │
        │  ┌──────────────────────────────┐ │
        │  │ db.users.find()              │ │
        │  │ db.alerts.find()             │ │
        │  │ db.alerts.aggregate()        │ │
        │  └──────────────────────────────┘ │
        └────────────────────────────────────┘
               │
               ▼
        ┌────────────────────────────────────┐
        │      MongoDB Database              │
        │  Returns: Users, Alerts, Stats     │
        └────────────────────────────────────┘
               │
               ▼
        ┌────────────────────────────────────┐
        │      Response Processing           │
        │  {success: true, data: [...]}      │
        └────────────────────────────────────┘
               │
               ▼
        ┌────────────────────────────────────┐
        │      Send HTTP Response            │
        │      200 OK                        │
        └────────────────────────────────────┘
               │
               ▼
        ┌────────────────────────────────────┐
        │      Frontend Receives Data        │
        │  Update UI / Display Alerts        │
        └────────────────────────────────────┘
```

---

## 7. Alert Severity Escalation

```
                    Safe (No Alert)
                          │
                          ▼
               ┌──────────────────────┐
               │  All Metrics Within  │
               │  Safe Thresholds     │
               └──────────┬───────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │  Any Metric Enters   │
               │  CAUTION Range       │
               └──────────┬───────────┘
                          │
                          ▼
                    LOW Alert Severity
                  (Not alerted in system)
                          │
                          ▼
               ┌──────────────────────┐
               │  Any Metric Enters   │
               │  WARNING Range       │
               └──────────┬───────────┘
                          │
                          ▼
                  ⚠️  MODERATE Alert
            (User receives warning alert)
            (Recommendations: monitoring)
                          │
                          ▼
               ┌──────────────────────┐
               │  Any Metric Enters   │
               │  DANGER Range        │
               └──────────┬───────────┘
                          │
                          ▼
                  🚨  HIGH Alert
             (User receives urgent alert)
           (Recommendations: immediate action)
                          │
                          ▼
               ┌──────────────────────┐
               │  Multiple Danger     │
               │  Level Breaches      │
               └──────────┬───────────┘
                          │
                          ▼
            🚨🚨 CRITICAL SITUATION
    (Emergency protocols recommended)
```

---

## 8. Data Processing Timeline

```
Time (milliseconds)

0ms     └─ MQTT Message Received
        └─ MQTTClient handler triggered
           
5ms     └─ SensorDataService.processSensorData()
        └─ Analytics calculations begin
        └─ PM2.5 → AQI conversion
        └─ UAQS calculation
        └─ CRI computation
           
15ms    └─ saveSensorData() to MongoDB
        └─ Sensor data persisted
           
20ms    └─ HealthAlertService.checkAndGenerateAlerts()
        └─ Loop through 4 classifications:
        └─   - asthma_patient
        └─   - children
        └─   - elderly
        └─   - adults
           
60ms    └─ Threshold comparisons complete
        └─ Alerts generated (if any)
           
65ms    └─ Alert.save() to MongoDB
        └─ Alert persisted for history
           
70ms    └─ emitAlertToClients()
        └─ Socket.IO broadcast
           
75ms    └─ Frontend receives real-time alert
        └─ UI updates immediately

Total: ~75ms from sensor reading to user notification
```

---

## 9. Classification Decision Tree

```
                    ┌─────────────────┐
                    │  New User/Query  │
                    └────────┬─────────┘
                             │
                    ┌────────▼────────┐
                    │  Which Group?   │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
           NO               YES              ?
            │                │                │
            ▼                ▼                ▼
      ┌──────────┐    ┌──────────┐    ┌───────────┐
      │ Hospital │    │ Severe   │    │ General   │
      │ Patient? │    │Asthmatics│   │  Health?  │
      └──────┬───┘    └──────┬───┘    └─────┬─────┘
             │               │              │
             └───────┬───┬───┘              │
                    NO  YES                │
                     │   │                 │
         ┌───────────┘   ▼                 ▼
         │    ┌──────────────────────────────┐
         │    │ asthma_patient               │
         │    │ Classification               │
         │    │ (Strictest Thresholds)       │
         │    └──────────────────────────────┘
         │
         ▼
      ┌──────────┐
      │ Parent   │
      │ with     │
      │ Children?│
      └──────┬───┘
             │
             ├─ YES ───▶ ┌──────────────────────────────────┐
             │           │ children Classification          │
             │           │ (Very Strict Thresholds)         │
             │           └──────────────────────────────────┘
             │
             ├─ NO ────▶ ┌──────────────────────────────────┐
             │           │ Caregiver for Elderly?           │
             │           └──────────┬───────────────────────┘
             │                      │
             │              ┌───────┴────────┐
             │              │ YES        NO  │
             │              │                │
             │              ▼                ▼
             │         ┌──────────┐    ┌─────────┐
             │         │ elderly  │    │ adults  │
             │         │Class.    │    │Class.   │
             │         │(Strict)  │    │(Standard│
             │         └──────────┘    └─────────┘
             │
             └─────────────▶ Assign Classification
                            ↓
                    Set Up Thresholds
                    Configure Alerts
                    Create Alert Preferences
```

---

**Diagrams Created**: 9
**Flow Coverage**: Complete system architecture, data flow, classifications, broadcasting, and decision trees
**Last Updated**: April 12, 2026
