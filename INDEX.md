# 📚 Air Quality Monitoring System - Complete Documentation Index

## Quick Navigation

### 🚀 Getting Started
1. **[QUICKSTART.md](./QUICKSTART.md)** - Get running in 5 minutes
   - Prerequisites check
   - Step-by-step setup
   - Testing the system
   - Common issues

### 📖 Main Documentation
2. **[README.md](./README.md)** - Complete project guide
   - Features and tech stack
   - Installation and configuration
   - API endpoint overview
   - MQTT integration details
   - Metrics calculations
   - Database models
   - Performance considerations

3. **[API.md](./API.md)** - Detailed API reference
   - Base URL and response format
   - All endpoints with examples
   - Query parameters and request bodies
   - Example clients (Python, JavaScript, cURL)

4. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Developer guide
   - Development workflow
   - Running tests
   - Debugging techniques
   - Performance optimization
   - Common development tasks

### 📋 Project Info
5. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Project completion overview
   - Feature checklist
   - Project structure
   - Integration points
   - Maintenance guide
   - Troubleshooting

### 🔧 Configuration
6. **[.env](./.env)** - Environment variables
   - Server configuration
   - Database settings
   - MQTT settings
   - Alert thresholds
   - Logging configuration

---

## File Structure

### 📁 Source Code (`src/`)

#### Entry Point
- **[index.js](./src/index.js)** - Application entry point
  - Server initialization
  - Service setup
  - Graceful shutdown
  - Periodic tasks

#### Application Setup
- **[app.js](./src/app.js)** - Express application factory
  - Middleware setup
  - Route registration
  - Error handling

- **[socketIO.js](./src/socketIO.js)** - Real-time communication
  - Socket.IO configuration
  - Event emitters
  - Broadcast functions

#### Configuration (`config/`)
- **[database.js](./src/config/database.js)** - MongoDB connection
  - Connection setup
  - Error handling
  - Connection pooling

- **[mqtt.js](./src/config/mqtt.js)** - MQTT configuration
  - Broker settings
  - Topic definitions
  - Connection options

#### Controllers (`controllers/`)
- **[SensorDataController.js](./src/controllers/SensorDataController.js)**
  - GET /api/data
  - GET /api/history
  - GET /api/statistics
  - GET /api/data/range

- **[AlertsController.js](./src/controllers/AlertsController.js)**
  - GET /api/alerts
  - POST /api/alerts/:id/acknowledge
  - GET /api/alerts/stats

- **[SystemController.js](./src/controllers/SystemController.js)**
  - GET /api/status
  - GET /api/health

#### Services (`services/`)
- **[SensorDataService.js](./src/services/SensorDataService.js)**
  - Data processing
  - Database operations
  - Statistics calculation
  - Data cleanup

- **[AlertsService.js](./src/services/AlertsService.js)**
  - Alert triggering logic
  - Alert generation
  - Cooldown management
  - Socket.IO emission

#### Models (`models/`)
- **[SensorData.js](./src/models/SensorData.js)**
  - Sensor reading schema
  - Indexes
  - Virtual properties

- **[Alert.js](./src/models/Alert.js)**
  - Alert schema
  - Acknowledgment tracking
  - Methods

#### MQTT (`mqtt/`)
- **[mqttClient.js](./src/mqtt/mqttClient.js)**
  - MQTT connection
  - Message handling
  - Queue processing
  - Auto-reconnect logic

#### Routes (`routes/`)
- **[sensorDataRoutes.js](./src/routes/sensorDataRoutes.js)**
  - Data endpoints

- **[alertsRoutes.js](./src/routes/alertsRoutes.js)**
  - Alert endpoints

- **[systemRoutes.js](./src/routes/systemRoutes.js)**
  - System endpoints

#### Middleware (`middleware/`)
- **[errorHandler.js](./src/middleware/errorHandler.js)**
  - Centralized error handling

- **[validators.js](./src/middleware/validators.js)**
  - Request validation

#### Utilities (`utils/`)
- **[logger.js](./src/utils/logger.js)**
  - Structured logging
  - Log levels

- **[aqiCalculator.js](./src/utils/aqiCalculator.js)**
  - AQI calculation
  - CRI calculation
  - Risk level determination

- **[dataQueue.js](./src/utils/dataQueue.js)**
  - Offline buffer management
  - FIFO queue operations

- **[exposureWindow.js](./src/utils/exposureWindow.js)**
  - Rolling window tracking
  - Statistics calculation

### 📁 Examples (`examples/`)
- **[client.js](./examples/client.js)** - Node.js client example
  - REST API usage
  - Real-time updates
  - Example queries

- **[client.py](./examples/client.py)** - Python client example
  - API calls with requests
  - Data handling
  - Error management

### 📦 Configuration Files

- **[package.json](./package.json)** - NPM dependencies and scripts
  - Production dependencies
  - Development dependencies
  - npm scripts

- **[Dockerfile](./Dockerfile)** - Docker image
  - Image setup
  - Dependencies
  - Health check

- **[docker-compose.yml](./docker-compose.yml)** - Multi-container setup
  - MongoDB service
  - MQTT service
  - Application service
  - Mongo Express (optional)

### 📄 Documentation Files

- **[README.md](./README.md)** - Main project documentation
- **[API.md](./API.md)** - API reference
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Project summary

### 🔨 Utility Scripts

- **[mqtt-test-publisher.sh](./mqtt-test-publisher.sh)** - Test data publisher
  - Sends varying PM2.5 levels
  - Configurable interval
  - MQTT connectivity test

- **[setup.sh](./setup.sh)** - Quick setup script
  - Prerequisites check
  - Dependency installation
  - Service startup instructions

---

## Getting Started by Role

### 👨‍💻 I Want to Get Running Quickly
1. Read: [QUICKSTART.md](./QUICKSTART.md) (5 min read)
2. Run: Follow 5-minute setup
3. Test: Use provided examples

### 🔍 I Want to Understand the API
1. Read: [API.md](./API.md) (10 min read)
2. Review: [API.md](./API.md) examples section
3. Try: cURL or Python examples

### 👨‍🔬 I Want to Understand the Code
1. Read: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) (10 min read)
2. Read: [README.md](./README.md) - Architecture section
3. Explore: Source files in `src/` directory

### 🛠️ I Want to Contribute/Develop
1. Read: [DEVELOPMENT.md](./DEVELOPMENT.md) (15 min read)
2. Read: Code comments in relevant source files
3. Follow: Development workflow section

### 📊 I Want to Deploy to Production
1. Read: [README.md](./README.md) - Deployment section
2. Read: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Production Checklist
3. Review: [docker-compose.yml](./docker-compose.yml) for container setup

---

## Key Features to Understand

### 1. MQTT Integration
- **File**: [src/mqtt/mqttClient.js](./src/mqtt/mqttClient.js)
- **Config**: [src/config/mqtt.js](./src/config/mqtt.js)
- **Reference**: [README.md - MQTT Integration](./README.md#mqtt-integration)

### 2. Alert System
- **File**: [src/services/AlertsService.js](./src/services/AlertsService.js)
- **Controller**: [src/controllers/AlertsController.js](./src/controllers/AlertsController.js)
- **Reference**: [README.md - Alerts Engine](./README.md#alerts-engine)

### 3. Real-time Updates
- **File**: [src/socketIO.js](./src/socketIO.js)
- **Reference**: [README.md - Socket.IO](./README.md#socketio-real-time-events)

### 4. Data Processing
- **Service**: [src/services/SensorDataService.js](./src/services/SensorDataService.js)
- **Utilities**: [src/utils/aqiCalculator.js](./src/utils/aqiCalculator.js)
- **Reference**: [README.md - Metrics Calculations](./README.md#metrics-calculations)

### 5. Offline Buffering
- **Queue**: [src/utils/dataQueue.js](./src/utils/dataQueue.js)
- **MQTT Handling**: [src/mqtt/mqttClient.js](./src/mqtt/mqttClient.js) - processQueue()
- **Reference**: [README.md - Offline Data Buffering](./README.md#offline-data-buffering)

---

## Common Tasks

### Running the Application
```bash
npm run dev           # Development mode
npm start            # Production mode
```
See: [QUICKSTART.md](./QUICKSTART.md) - Step 4

### Testing the API
```bash
curl http://localhost:3000/api/data
```
See: [API.md](./API.md) - Examples section

### Sending Test Data
```bash
bash mqtt-test-publisher.sh
```
See: [DEVELOPMENT.md](./DEVELOPMENT.md) - Testing the API

### Checking System Status
```bash
curl http://localhost:3000/api/status
```
See: [API.md](./API.md) - GET /status

### Debugging Issues
See: [DEVELOPMENT.md](./DEVELOPMENT.md) - Debugging section
Or: [QUICKSTART.md](./QUICKSTART.md) - Common Issues

### Deploying with Docker
```bash
docker-compose up -d
```
See: [README.md](./README.md) - Docker Support

---

## Important Concepts

### AQI (Air Quality Index)
- **Calculation**: [src/utils/aqiCalculator.js](./src/utils/aqiCalculator.js) - calculateAQI()
- **Formula**: EPA standard breakpoints
- **Reference**: [README.md - Air Quality Index](./README.md#air-quality-index-aqi)

### CRI (Cognitive Risk Index)
- **Calculation**: [src/utils/aqiCalculator.js](./src/utils/aqiCalculator.js) - calculateCRI()
- **Formula**: PM2.5 × ExposureTime × HumidityFactor
- **Reference**: [README.md - Cognitive Risk Index](./README.md#cognitive-risk-index-cri)

### Alert Levels
- **Determination**: [src/services/AlertsService.js](./src/services/AlertsService.js)
- **Thresholds**: [.env](./.env) - ALERT_PM25_THRESHOLD, ALERT_CRI_THRESHOLD
- **Reference**: [README.md - Alerts Engine](./README.md#alerts-engine)

### Rolling Windows
- **Implementation**: [src/utils/exposureWindow.js](./src/utils/exposureWindow.js)
- **Used in**: [src/services/SensorDataService.js](./src/services/SensorDataService.js)
- **Reference**: [README.md - Data Processing](./README.md#data-processing)

---

## Support & Troubleshooting

### Quick Fix Guides
- **Can't connect to API**: [QUICKSTART.md](./QUICKSTART.md) - Common Issues
- **MQTT not receiving**: [DEVELOPMENT.md](./DEVELOPMENT.md) - Troubleshooting
- **Database errors**: [DEVELOPMENT.md](./DEVELOPMENT.md) - Troubleshooting
- **Memory issues**: [DEVELOPMENT.md](./DEVELOPMENT.md) - Troubleshooting

### Reference Documentation
- **Complete Setup**: [README.md](./README.md)
- **Code Comments**: All source files have inline documentation
- **Examples**: [examples/](./examples/) directory

---

## Version & Status

- **Status**: ✅ Production Ready
- **Version**: 1.0.0
- **Last Updated**: 2024
- **Node.js**: v14+ required
- **Dependencies**: 475 packages installed

---

## Next Steps

1. **Start Here**: [QUICKSTART.md](./QUICKSTART.md)
2. **Understand API**: [API.md](./API.md)
3. **Explore Code**: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
4. **Develop**: [DEVELOPMENT.md](./DEVELOPMENT.md)
5. **Deploy**: [README.md](./README.md) - Deployment section

---

**Happy monitoring!** 🚀📊

For any questions, refer to the appropriate documentation file above.
