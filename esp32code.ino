#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// ================= WIFI =================
const char* ssid = "12345678";
const char* password = "12345678";

// ================= MQTT =================
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* topic = "air-quality/data";

WiFiClient espClient;
PubSubClient client(espClient);

// ================= SENSORS =================
#define MQ135_PIN 34
#define DHT_PIN 27
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);
HardwareSerial pmSerial(2);

// ================= FILTER =================
#define WINDOW 5
float pmBuf[WINDOW] = {0};
float mqBuf[WINDOW] = {0};
int bufIndex = 0;

// ================= TIMING =================
unsigned long lastSend = 0;
const int interval = 5000;

// ================= EXPOSURE =================
float exposure = 0;
unsigned long lastTime = 0;

// ================= PM CACHE =================
float lastPM = 0;

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  dht.begin();
  pmSerial.begin(9600, SERIAL_8N1, 16, 17);

  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);

  lastTime = millis();
}

// ================= LOOP =================
void loop() {
  if (!client.connected()) reconnectMQTT();
  client.loop();

  unsigned long now = millis();

  if (now - lastSend > interval) {
    lastSend = now;

    float pm25 = readPM25();
    float mq135ppm = readMQ135PPM();

    float temp = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temp) || isnan(humidity)) {
      Serial.println("DHT ERROR");
      return;
    }

    // ================= FILTER =================
    pm25 = movingAverage(pmBuf, pm25);
    mq135ppm = movingAverage(mqBuf, mq135ppm);
    bufIndex = (bufIndex + 1) % WINDOW;

    // ================= HUMIDITY =================
    float hFactor = humidityFactor(humidity);
    float correctedPPM = mq135ppm * hFactor;

    // ================= CALCULATIONS =================
    float aqi = computeAQI(pm25);
    float aci = computeACI(correctedPPM);
    float uaqs = computeUAQS(aqi, aci);

    float deltaTime = (now - lastTime) / 3600000.0;
    lastTime = now;

    // Exposure with decay (stable)
    exposure = 0.9 * exposure + (uaqs * deltaTime);

    // ✅ FIXED CRI
    float cri = computeCRI(exposure, hFactor);

    // ================= JSON =================
    String payload = "{";
    payload += "\"pm25\":" + String(pm25, 2) + ",";
    payload += "\"aqi\":" + String(aqi, 2) + ",";
    payload += "\"mq135_ppm\":" + String(correctedPPM, 2) + ",";
    payload += "\"aci\":" + String(aci, 2) + ",";
    payload += "\"uaqs\":" + String(uaqs, 2) + ",";
    payload += "\"cri\":" + String(cri, 2) + ",";
    payload += "\"temp\":" + String(temp, 2) + ",";
    payload += "\"humidity\":" + String(humidity, 2) + ",";
    payload += "\"exposure\":" + String(exposure, 2) + ",";
    payload += "\"timestamp\":" + String(millis());
    payload += "}";

    Serial.println("---- MQTT DEBUG ----");
    Serial.println(payload);

    client.publish(topic, payload.c_str());
  }
}

// ================= WIFI =================
void setupWiFi() {
  Serial.println("Connecting WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected");
}

// ================= MQTT =================
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting MQTT...");

    String clientId = "ESP32-" + String(random(10000));

    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.println("retry...");
      delay(3000);
    }
  }
}

// ================= PM2.5 =================
float readPM25() {
  if (pmSerial.available() >= 32) {
    uint8_t buffer[32];
    pmSerial.readBytes(buffer, 32);

    if (buffer[0] == 0x42 && buffer[1] == 0x4D) {
      int pm25 = (buffer[12] << 8) | buffer[13];
      lastPM = pm25;
      return pm25;
    }
  }
  return lastPM; // fallback
}

// ================= MQ135 =================
float readMQ135PPM() {
  int raw = analogRead(MQ135_PIN);
  float voltage = raw * (3.3 / 4095.0);

  if (voltage <= 0.1) return 0;

  float RL = 10.0;
  float Rs = ((3.3 - voltage) / voltage) * RL;

  float R0 = 10.0; // TODO: calibrate properly

  float ratio = Rs / R0;

  float ppm = 116.6020682 * pow(ratio, -2.769034857);

  return ppm;
}

// ================= FILTER =================
float movingAverage(float *buffer, float value) {
  buffer[bufIndex] = value;

  float sum = 0;
  for (int i = 0; i < WINDOW; i++) sum += buffer[i];

  return sum / WINDOW;
}

// ================= HUMIDITY =================
float humidityFactor(float h) {
  float f = 1 + (h - 65.0) * 0.01;
  return constrain(f, 0.8, 1.2);
}

// ================= AQI =================
float computeAQI(float pm25) {
  if (pm25 <= 12) return (50.0 / 12.0) * pm25;
  else if (pm25 <= 35.4) return 50 + (pm25 - 12) * (50 / (35.4 - 12));
  else return 100 + (pm25 - 35.4) * (100 / (150.4 - 35.4));
}

// ================= ACI =================
float computeACI(float ppm) {
  if (ppm < 50) return 50;
  else if (ppm < 100) return 100;
  else if (ppm < 200) return 150;
  else return 200;
}

// ================= UAQS =================
float computeUAQS(float aqi, float aci) {
  return (0.6 * aqi) + (0.4 * aci);
}

// ================= CRI =================
float computeCRI(float exposure, float hFactor) {
  return exposure * hFactor;
}