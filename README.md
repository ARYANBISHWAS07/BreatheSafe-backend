# Air Quality Monitoring System - Backend

A production-ready IoT backend for real-time air quality monitoring with MQTT integration, real-time alerts, and comprehensive data analytics.

## Features

✨ **Core Capabilities:**
- **MQTT Integration**: Subscribe to real-time air quality sensor data
- **Real-time Alerts**: Socket.IO WebSocket support for instant notifications
- **Advanced Metrics**: AQI calculation and Cognitive Risk Index (CRI)
- **Rolling Windows**: 1-hour and 3-hour exposure tracking
- **Offline Buffer**: Queue management with automatic retry when database recovers
- **REST API**: Comprehensive endpoints for data querying and management
- **MongoDB Persistence**: Scalable data storage with indexes for performance

## Technology Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Real-time Communication**: Socket.IO
- **MQTT Protocol**: mqtt.js
- **Security**: Helmet, CORS
- **Logging**: Winston-style structured logging
- **Environment**: dotenv configuration

## Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection setup
│   └── mqtt.js          # MQTT broker configuration
├── controllers/         # HTTP request handlers
│   ├── SensorDataController.js
│   ├── AlertsController.js
│   └── SystemController.js
├── services/           # Business logic
│   ├── SensorDataService.js
│   └── AlertsService.js
├── models/            # Database schemas
│   ├── SensorData.js
│   └── Alert.js
├── mqtt/              # MQTT client and handlers
│   └── mqttClient.js
├── routes/            # API route definitions
│   ├── sensorDataRoutes.js
│   ├── alertsRoutes.js
│   └── systemRoutes.js
├── middleware/        # Express middleware
│   ├── errorHandler.js
│   └── validators.js
├── utils/            # Utility functions
│   ├── logger.js
│   ├── aqiCalculator.js
│   ├── dataQueue.js
│   └── exposureWindow.js
├── app.js            # Express app factory
├── socketIO.js       # Socket.IO setup and helpers
└── index.js          # Application entry point
```

## Setup and Installation

### Prerequisites

- Node.js v14+ and npm
- MongoDB v4.4+ (local or Atlas)
- MQTT Broker (Mosquitto, HiveMQ, etc.)

### Installation Steps

1. **Clone and install dependencies:**
   ```bash
   cd air-backend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   # Edit .env file with your settings
   nano .env
   ```

3. **Start MongoDB:**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas connection string in .env
   ```

4. **Start MQTT Broker:**
   ```bash
   # Mosquitto (if installed)
   mosquitto
   
   # Or configure .env for remote broker
   ```

5. **Run the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

## Configuration

### .env Variables

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# MongoDB
MONGODB_URI=mongodb://localhost:27017/air-quality-system
MONGODB_TIMEOUT=10000

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_TOPIC=air-quality/data
MQTT_KEEP_ALIVE=60
MQTT_RECONNECT_PERIOD=5000

# Socket.IO
SOCKET_IO_CORS=http://localhost:3000

# Alert Thresholds
ALERT_PM25_THRESHOLD=75
ALERT_CRI_THRESHOLD=150

# Rolling Windows (milliseconds)
EXPOSURE_WINDOW_1H=3600000
EXPOSURE_WINDOW_3H=10800000

# Default Humidity Factor (for CRI calculation)
DEFAULT_HUMIDITY_FACTOR=1.0

# Data Queue
MAX_QUEUE_SIZE=1000
QUEUE_FLUSH_INTERVAL=30000

# Logging
LOG_LEVEL=debug
```

## API Endpoints

### Sensor Data Endpoints

#### GET /api/data
Returns the latest sensor reading.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "pm25": 45.2,
    "co": 0.5,
    "nox": 25.0,
    "aqi": 115,
    "aqiCategory": "Moderate",
    "cri": 45.2,
    "exposure1h": { "avgPM25": 42.1, "maxPM25": 48.5, "readingCount": 60 },
    "exposure3h": { "avgPM25": 41.5, "maxPM25": 55.0, "readingCount": 180 },
    "recordedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/history
Get paginated sensor data history.

**Query Parameters:**
- `limit` (default: 100, max: 500) - Number of records
- `skip` (default: 0) - Pagination offset

**Example:** `/api/history?limit=50&skip=100`

#### GET /api/statistics
Get sensor data statistics for a time period.

**Query Parameters:**
- `hours` (default: 24, max: 720) - Time period in hours

**Response:**
```json
{
  "success": true,
  "data": {
    "avgPM25": 42.3,
    "maxPM25": 85.5,
    "minPM25": 15.2,
    "avgCO": 0.45,
    "avgNOx": 22.1,
    "avgAQI": 98,
    "avgCRI": 42.3,
    "count": 1440
  },
  "period": "24h"
}
```

#### GET /api/data/range
Get sensor data within a specific date range.

**Query Parameters:**
- `startDate` (required) - ISO format date
- `endDate` (required) - ISO format date

**Example:** `/api/data/range?startDate=2024-01-15T00:00:00Z&endDate=2024-01-15T23:59:59Z`

### Alert Endpoints

#### GET /api/alerts
Get alert history.

**Query Parameters:**
- `limit` (default: 50, max: 500) - Number of records
- `unacknowledged` (default: false) - Only unacknowledged alerts

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "level": "HIGH",
      "type": "PM25_EXCEEDED",
      "message": "Air quality hazardous — PM2.5 level at 120 µg/m³. Avoid outdoor activities immediately.",
      "triggeredAt": "2024-01-15T10:30:00Z",
      "isAcknowledged": false
    }
  ],
  "filter": { "limit": 50, "unacknowledgedOnly": false }
}
```

#### POST /api/alerts/:id/acknowledge
Acknowledge an alert.

**Body:**
```json
{
  "acknowledgedBy": "admin@example.com"
}
```

#### GET /api/alerts/stats
Get alert statistics.

**Query Parameters:**
- `hours` (default: 24) - Time period in hours

**Response:**
```json
{
  "success": true,
  "data": {
    "LOW": 5,
    "MODERATE": 3,
    "HIGH": 1,
    "total": 9
  },
  "period": "24h"
}
```

### System Endpoints

#### GET /api/status
Get detailed system status and metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "uptime": 3600,
    "timestamp": "2024-01-15T10:30:00Z",
    "environment": "production",
    "mqtt": {
      "isConnected": true,
      "queueSize": 0,
      "reconnectAttempts": 0,
      "exposure1h": { "count": 60, "average": 42.1 },
      "exposure3h": { "count": 180, "average": 41.5 }
    },
    "memory": { "rss": 123456789, "heapUsed": 87654321 }
  }
}
```

#### GET /api/health
Health check endpoint (for load balancers/monitoring).

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "mqtt": "connected"
}
```

## MQTT Integration

### Incoming Message Format

Subscribe to the configured topic (default: `air-quality/data`) and send JSON with:

```json
{
  "pm25": 45.2,
  "co": 0.5,
  "nox": 25.0,
  "timestamp": 1705317000000
}
```

**Field Descriptions:**
- `pm25` (number): Particulate matter 2.5 micrometers concentration (µg/m³)
- `co` (number): Carbon monoxide concentration (ppm)
- `nox` (number): Nitrogen oxides concentration (ppb)
- `timestamp` (number): Unix timestamp in milliseconds

### Test MQTT Publishing

Using mosquitto_pub:
```bash
mosquitto_pub -h localhost -t air-quality/data -m '{"pm25":45.2,"co":0.5,"nox":25.0,"timestamp":'$(date +%s000)'}'
```

## Socket.IO Real-time Events

### Client → Server Events

```javascript
// Subscribe to sensor updates
socket.emit('subscribe-sensor-updates');

// Subscribe to alerts
socket.emit('subscribe-alerts');

// Unsubscribe from updates
socket.emit('unsubscribe', 'sensor-updates');
```

### Server → Client Events

```javascript
// Sensor data update (emitted on new reading)
socket.on('sensor-update', (data) => {
  console.log('New sensor reading:', data.data);
});

// Alert triggered
socket.on('alert-triggered', (alert) => {
  console.log('Alert:', alert.level, alert.message);
});

// System status broadcast (every minute)
socket.on('system-status', (status) => {
  console.log('System uptime:', status.status.uptime);
});
```

### Example Client Implementation (JavaScript)

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connection-confirmation', (data) => {
  console.log(data.message);
  
  // Subscribe to updates
  socket.emit('subscribe-sensor-updates');
  socket.emit('subscribe-alerts');
});

socket.on('sensor-update', (data) => {
  console.log('Sensor data:', data.data.pm25, 'µg/m³');
});

socket.on('alert-triggered', (alert) => {
  console.log(`ALERT [${alert.level}]: ${alert.message}`);
});
```

## Metrics Calculations

### Air Quality Index (AQI)

Calculated from PM2.5 concentration using EPA breakpoints:

| AQI Range | Category | PM2.5 Range |
|-----------|----------|-------------|
| 0-50 | Good | 0-12 |
| 51-100 | Moderate | 12.1-35.4 |
| 101-150 | Unhealthy for Sensitive Groups | 35.5-55.4 |
| 151-200 | Unhealthy | 55.5-150.4 |
| 201-300 | Very Unhealthy | 150.5-250.4 |
| 301+ | Hazardous | 250.5+ |

### Cognitive Risk Index (CRI)

$$CRI = PM_{2.5} \times ExposureTime \times HumidityFactor$$

**Alert Thresholds:**
- CRI > 150: Alert triggered
- PM2.5 > 75 µg/m³: Alert triggered

**Risk Levels:**
- CRI < 50: LOW
- CRI 50-150: MODERATE
- CRI > 150: HIGH

## Database Models

### SensorData Collection

```javascript
{
  _id: ObjectId,
  pm25: Number,              // PM2.5 concentration (µg/m³)
  co: Number,                // Carbon monoxide (ppm)
  nox: Number,               // Nitrogen oxides (ppb)
  aqi: Number,               // Calculated Air Quality Index
  aqiCategory: String,       // AQI category
  cri: Number,               // Cognitive Risk Index
  criLevel: String,          // CRI level (LOW/MODERATE/HIGH)
  exposure1h: {
    avgPM25: Number,         // Average PM2.5 in 1h window
    maxPM25: Number,         // Max PM2.5 in 1h window
    readingCount: Number     // Number of readings
  },
  exposure3h: {
    avgPM25: Number,         // Average PM2.5 in 3h window
    maxPM25: Number,         // Max PM2.5 in 3h window
    readingCount: Number     // Number of readings
  },
  sensorTimestamp: Date,     // When sensor reading was taken
  recordedAt: Date,          // When data was received
  createdAt: Date,
  updatedAt: Date
}
```

### Alert Collection

```javascript
{
  _id: ObjectId,
  level: String,             // Alert level (LOW/MODERATE/HIGH)
  type: String,              // Alert type (PM25_EXCEEDED/CRI_EXCEEDED/COMBINED)
  message: String,           // Human-readable alert message
  description: String,       // Detailed description
  triggerValues: {
    pm25: Number,            // PM2.5 value that triggered alert
    cri: Number,             // CRI value that triggered alert
    aqiCategory: String      // AQI category at time of alert
  },
  isAcknowledged: Boolean,   // Acknowledgment status
  acknowledgedAt: Date,      // When alert was acknowledged
  acknowledgedBy: String,    // Who acknowledged the alert
  sensorDataId: ObjectId,    // Reference to sensor reading
  triggeredAt: Date,         // When alert was triggered
  createdAt: Date,
  updatedAt: Date
}
```

## Offline Data Buffering

When the database becomes unavailable:

1. **Queuing**: Incoming sensor data is queued in memory (max 1000 items by default)
2. **Persistence**: Queue is retained in memory until database reconnects
3. **Auto-recovery**: Queue is automatically flushed every 30 seconds or when connection is restored
4. **FIFO Processing**: Data is processed in the order received

## Error Handling

The system implements comprehensive error handling:

- **MQTT Connection Failures**: Auto-reconnect with exponential backoff
- **Database Disconnections**: Data queuing and automatic retry
- **Invalid Data**: Validation and error responses
- **Graceful Shutdown**: Proper cleanup of connections on termination

## Logging

Structured logging with levels:

- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages
- **WARN**: Warning conditions
- **ERROR**: Error conditions requiring attention

Configure via `LOG_LEVEL` environment variable.

## Performance Considerations

- **Database Indexes**: Created on frequently queried fields (pm25, aqi, recordedAt)
- **Memory Efficiency**: Rolling windows prevent unbounded memory growth
- **Data Cleanup**: Automatic deletion of records older than 30 days
- **Connection Pooling**: MongoDB connection pool (2-10 connections)
- **Pagination**: Large result sets are paginated to prevent memory issues

## Deployment

### Docker Support (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 3000

CMD ["node", "src/index.js"]
```

Build and run:
```bash
docker build -t air-backend .
docker run -p 3000:3000 --env-file .env air-backend
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Disable debug logging: `LOG_LEVEL=info`
- [ ] Use strong MQTT credentials
- [ ] Configure MongoDB Atlas or secure MongoDB instance
- [ ] Set appropriate alert thresholds
- [ ] Enable CORS for production domains
- [ ] Use HTTPS for production
- [ ] Set up monitoring and alerting
- [ ] Configure database backups
- [ ] Use PM2 or systemd for process management

## Troubleshooting

### MQTT Not Connecting

```bash
# Check broker is running
mosquitto -v

# Test connection
mosquitto_sub -h localhost -t '#' -v
```

### MongoDB Connection Issues

```bash
# Test MongoDB connection
mongo mongodb://localhost:27017/air-quality-system
```

### No Sensor Data Being Received

1. Verify MQTT broker is running
2. Check topic subscription in logs
3. Test MQTT publish with mosquitto_pub
4. Verify payload format matches expected JSON

### High Memory Usage

- Check for connection leaks
- Verify data cleanup job is running
- Monitor queue size via `/api/status`

## License

ISC

## Support

For issues and questions, refer to the documentation or check system logs.

---

**Version**: 1.0.0  
**Last Updated**: 2024
