# Test Cases Summary - Air Quality Monitoring System

## Quick Overview

**Total Test Categories:** 10  
**Total Test Suites:** 50+  
**Total Test Cases:** 200+  
**Document Size:** 1,500+ lines with code examples

---

## Test Categories & Coverage

### 1. **Unit Tests** (60+ test cases)
   - Analytics module calculations (AQI, UAQS, CRI, etc.)
   - Time utilities (IST formatting, delta conversion)
   - Edge cases for all numeric values
   - Status: ✅ Partially implemented (analytics module done)

### 2. **Service Tests** (40+ test cases)
   - SensorDataService: processing, saving, querying
   - AlertsService: alert creation, triggering, publishing
   - Data flows and error scenarios
   - Status: 🔴 Not yet implemented

### 3. **API/Controller Tests** (50+ test cases)
   - SensorDataController: 4 endpoints with validation
   - AlertsController: 3 endpoints with filtering
   - SystemController: 2 health check endpoints
   - Request/response validation
   - Status: 🔴 Not yet implemented

### 4. **Integration Tests** (30+ test cases)
   - End-to-end data pipelines
   - Service interactions
   - Database operations
   - Status: 🔴 Not yet implemented

### 5. **MQTT Tests** (20+ test cases)
   - Connection/disconnection
   - Message processing
   - Alert publishing
   - Queue management
   - Status: 🔴 Not yet implemented

### 6. **Socket.IO Tests** (15+ test cases)
   - Real-time sensor data broadcast
   - Alert event emissions
   - System status updates
   - Status: 🔴 Not yet implemented

### 7. **Database Tests** (20+ test cases)
   - CRUD operations
   - Index validation
   - Data validation
   - TTL expiration
   - Status: 🔴 Not yet implemented

### 8. **Error Handling Tests** (15+ test cases)
   - Invalid inputs
   - Service failures
   - Recovery scenarios
   - Status: 🔴 Not yet implemented

### 9. **Edge Cases & Boundary Tests** (25+ test cases)
   - Numeric boundaries (PM2.5, temp, humidity, time)
   - Large datasets
   - High-frequency updates
   - Status: 🔴 Not yet implemented

### 10. **Performance & Load Tests** (15+ test cases)
   - Query performance
   - Concurrent operations
   - Memory stability
   - Status: 🔴 Not yet implemented

---

## Key Test Scenarios by Module

### **Analytics Module** ✅
```
✓ calculateAQI with standard breakpoints
✓ applyHumidityCorrection with factor formula
✓ computeACI discrete band mapping
✓ computeUAQS weighted average (60% AQI + 40% ACI)
✓ updateExposure accumulation
✓ computeRollingAverage window filtering
✓ computeCRI cumulative risk
✓ determineAlertLevel thresholds
✓ AirQualityAnalyticsProcessor state tracking
```

### **SensorDataController** 🔴
```
[ ] GET /api/data → returns latest with IST timestamp
[ ] GET /api/history → pagination with limit (max 500)
[ ] GET /api/statistics → aggregations (24-720 hours)
[ ] GET /api/data/range → date-filtered queries
[ ] Validation for all parameters
[ ] Error handling (404, 400, 500)
```

### **AlertsController** 🔴
```
[ ] GET /api/alerts → history with filters
[ ] GET /api/alerts?unacknowledged=true → unacknowledged only
[ ] POST /api/alerts/:id/acknowledge → mark as read
[ ] GET /api/alerts/stats → statistics by level/type
[ ] Alert cooldown enforcement
[ ] MQTT publishing on alert trigger
```

### **SystemController** 🔴
```
[ ] GET /api/status → uptime, MQTT, memory
[ ] GET /api/health → 200 (healthy) or 503 (degraded)
[ ] Health check based on MQTT connection
```

### **MQTT Operations** 🔴
```
[ ] Connection establishment
[ ] Message subscription to air-quality/data
[ ] Incoming message parsing and validation
[ ] Sensor data service integration
[ ] Alert triggering on dangerous levels
[ ] Alert publishing to air-quality/alerts
[ ] Disconnection and reconnection
[ ] Queue management on failures
```

### **Database (MongoDB)** 🔴
```
SensorData:
[ ] Create with all required fields
[ ] Validate numeric ranges (pm25, aqi, humidity, etc.)
[ ] Query by timestamp (indexed)
[ ] Query by date range (recordedAt indexed)
[ ] TTL auto-cleanup
[ ] Virtual field 'ageSeconds'

Alert:
[ ] Create with trigger values
[ ] Acknowledge method
[ ] Query by level/type
[ ] TTL expiration (7 days)
[ ] Cooldown logic
```

### **Error Scenarios** 🔴
```
[ ] Null/undefined payloads
[ ] Malformed JSON (MQTT)
[ ] Missing required fields
[ ] Database connection failures
[ ] MQTT broker disconnection
[ ] Concurrent request handling
[ ] Recovery and state consistency
```

---

## Test Priorities

### **CRITICAL (Phase 1)**
Must implement for production readiness:
1. ✅ Analytics calculations (DONE)
2. 🔴 SensorDataService (processSensorData, saveSensorData)
3. 🔴 AlertsService (triggerAlerts, publishAlertToMQTT)
4. 🔴 All API controller tests (happy path)
5. 🔴 MQTT message processing
6. 🔴 Database CRUD operations
7. 🔴 Error handling (null, invalid types)

**Estimated effort:** 3-4 days

### **IMPORTANT (Phase 2)**
Enhance test coverage and validation:
1. 🔴 API validation tests (query params, body validation)
2. 🔴 Cooldown and queue logic
3. 🔴 Pagination and filtering
4. 🔴 Socket.IO emissions
5. 🔴 Data edge cases (zero, max values)
6. 🔴 Time boundary cases

**Estimated effort:** 2-3 days

### **NICE TO HAVE (Phase 3)**
Performance and advanced scenarios:
1. 🔴 Performance benchmarks
2. 🔴 Load testing (100+ RPS)
3. 🔴 Memory leak detection
4. 🔴 Concurrency stress tests
5. 🔴 E2E integration tests

**Estimated effort:** 2-3 days

---

## Test Setup Required

### Install Additional Dependencies
```bash
npm install --save-dev jest @types/jest
npm install --save-dev supertest                  # HTTP testing
npm install --save-dev jest-mock-extended        # Advanced mocking
npm install --save-dev mongodb-memory-server     # In-memory MongoDB
npm install --save-dev jest-coverage             # Coverage reporting
```

### Create Jest Configuration
```bash
npx jest --init
```

### Test Database Setup
- Use `mongodb-memory-server` for unit/integration tests
- Seed fixtures for consistent test data
- Clean up between test suites

---

## How to Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/services/sensorDataService.test.js

# Run with coverage report
npm test -- --coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Run by pattern
npm test -- --testNamePattern="SensorDataController"

# Verbose output
npm test -- --verbose

# Fail on coverage drops
npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'
```

---

## Coverage Goals

| Layer | Target | Current |
|-------|--------|---------|
| Unit Tests | 90%+ | ~10% |
| Integration Tests | 85%+ | 0% |
| API Controllers | 95%+ | 0% |
| Services | 90%+ | 5% |
| Utils | 95%+ | ~5% |
| **Overall** | **90%+** | **~5%** |

---

## Test Execution Timeline

**Total Estimated Tests:** 200+

| Phase | Duration | Tests | Coverage |
|-------|----------|-------|----------|
| Phase 1 (Critical) | 3-4 days | ~80 | 60% |
| Phase 2 (Important) | 2-3 days | ~70 | 85% |
| Phase 3 (Nice-to-Have) | 2-3 days | ~50 | 95%+ |

---

## Key Testing Best Practices Covered

✅ **Unit Testing**
- Test one concern per test
- Use descriptive test names
- Test happy path AND edge cases
- Mock external dependencies

✅ **Integration Testing**
- Test interactions between modules
- Use real or in-memory database
- Verify data flows end-to-end
- Test error propagation

✅ **Controller/API Testing**
- Test all CRUD operations
- Validate request parameters
- Check response structure
- Test error codes (400, 404, 500)

✅ **Error Handling**
- Test with null/undefined
- Test with invalid types
- Test service failures
- Test recovery scenarios

✅ **Performance**
- Measure query times
- Test concurrent operations
- Monitor memory usage
- Check for memory leaks

---

## Documentation & Examples

The complete `TEST_CASES.md` file includes:
- **200+** specific test cases
- **Code snippets** for each test
- **Jest syntax** examples
- **Mock implementations**
- **Expected assertions**
- **Error scenarios**

---

## Next Steps

1. **Review TEST_CASES.md** - Understand all proposed tests
2. **Prioritize Phase 1** - Start with critical tests
3. **Set up Jest** - Configure test environment
4. **Implement incrementally** - Add 10-15 tests per day
5. **Maintain coverage** - Keep tests up as code evolves

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Jest Testing Library](https://testing-library.com/)
- [Supertest HTTP Testing](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

---

**Document Location:** `/home/kali/Desktop/air-backend/TEST_CASES.md`  
**Last Updated:** April 2, 2026  
**Total Lines:** 1,529 (code examples + documentation)
