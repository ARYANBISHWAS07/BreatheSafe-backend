#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <math.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ================= WIFI =================
const char* ssid = "12345678";
const char* password = "12345678";

// ================= MQTT =================
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* topic = "air-quality/data";

WiFiClient espClient;
PubSubClient client(espClient);

// ================= LCD =================
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ================= SENSORS =================
#define MQ135_PIN 34
#define DHT_PIN 27
#define DHT_TYPE DHT11

#define DUST_LED_PIN 25
#define DUST_SENSOR_PIN 35

DHT dht(DHT_PIN, DHT_TYPE);

// ================= FILTER =================
#define WINDOW 6
float pmBuf[WINDOW] = {0};
float mqBuf[WINDOW] = {0};
int bufIndex = 0;

// ================= TIMING =================
unsigned long lastSend = 0;
const int interval = 5000;

int screenIndex = 0;
unsigned long lastScreenChange = 0;

// ================= EXPOSURE =================
float exposure = 0;
unsigned long lastTime = 0;

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  dht.begin();
  pinMode(DUST_LED_PIN, OUTPUT);

  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Air Monitor");
  lcd.setCursor(0, 1);
  lcd.print("Calibrated");
  delay(1500);
  lcd.clear();

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
    float mqRaw = analogRead(MQ135_PIN);

    float temp = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temp) || isnan(humidity)) return;

    // ================= FILTER =================
    pm25 = movingAverage(pmBuf, pm25);
    mqRaw = movingAverage(mqBuf, mqRaw);
    bufIndex = (bufIndex + 1) % WINDOW;

    // ================= MQ (FIXED SCALING) =================
    float mqScore = (mqRaw / 600.0) * 100.0;
    mqScore = constrain(mqScore, 0, 150);

    // ================= AQI =================
    float aqi = computeAQI(pm25);
    String category = getAQICategory(aqi);

    float uaqs = 0.9 * aqi + 0.1 * mqScore;

    // ================= EXPOSURE =================
    float deltaTime = (now - lastTime) / 3600000.0;
    lastTime = now;

    float decay = exp(-deltaTime);
    exposure = exposure * decay + (uaqs * deltaTime);

    float cri = constrain(exposure * 10.0, 0, 100);

    // ================= MQTT =================
    String payload = "{";
    payload += "\"pm25\":" + String(pm25, 2) + ",";
    payload += "\"aqi\":" + String(aqi, 2) + ",";
    payload += "\"mq_score\":" + String(mqScore, 2) + ",";
    payload += "\"uaqs\":" + String(uaqs, 2) + ",";
    payload += "\"cri\":" + String(cri, 2) + ",";
    payload += "\"temp\":" + String(temp, 2) + ",";
    payload += "\"humidity\":" + String(humidity, 2) + ",";
    payload += "\"exposure\":" + String(exposure, 4) + ",";
    payload += "\"timestamp\":" + String(millis());
    payload += "}";

    Serial.println(payload);
    client.publish(topic, payload.c_str());

    // ================= LCD =================
    if (millis() - lastScreenChange > 3000) {
      lastScreenChange = millis();
      screenIndex = (screenIndex + 1) % 3;
      lcd.clear();
    }

    if (screenIndex == 0) {
      lcd.setCursor(0, 0);
      lcd.print("AQI:");
      lcd.print((int)aqi);
      lcd.print(" ");
      lcd.print(category.substring(0, 6));

      lcd.setCursor(0, 1);
      lcd.print("PM:");
      lcd.print((int)pm25);
      lcd.print(" ug");
    } 
    else if (screenIndex == 1) {
      lcd.setCursor(0, 0);
      lcd.print("Temp:");
      lcd.print(temp, 1);
      lcd.print("C");

      lcd.setCursor(0, 1);
      lcd.print("Hum:");
      lcd.print((int)humidity);
      lcd.print("%");
    } 
    else {
      lcd.setCursor(0, 0);
      lcd.print("Gas:");
      lcd.print((int)mqScore);

      lcd.setCursor(0, 1);
      lcd.print("CRI:");
      lcd.print((int)cri);
    }
  }
}

// ================= PM2.5 =================
float readPM25() {
  float sum = 0;

  for (int i = 0; i < 10; i++) {
    digitalWrite(DUST_LED_PIN, LOW);
    delayMicroseconds(300);

    int raw = analogRead(DUST_SENSOR_PIN);
    sum += raw;

    digitalWrite(DUST_LED_PIN, HIGH);
    delayMicroseconds(10000);
  }

  float avgRaw = sum / 10.0;
  float voltage = avgRaw * (3.3 / 4095.0);

  // 🔥 FINAL CALIBRATED OFFSET (based on your real readings)
  float dustDensity = (voltage - 0.10) * 1000.0;

  if (dustDensity < 0) dustDensity = 0;

  return dustDensity;
}

// ================= CORRECT AQI =================
float computeAQI(float pm) {
  float Ihi, Ilo, BPhi, BPlo;

  if (pm <= 12) { BPlo=0; BPhi=12; Ilo=0; Ihi=50; }
  else if (pm <= 35.4) { BPlo=12.1; BPhi=35.4; Ilo=51; Ihi=100; }
  else if (pm <= 55.4) { BPlo=35.5; BPhi=55.4; Ilo=101; Ihi=150; }
  else if (pm <= 150.4) { BPlo=55.5; BPhi=150.4; Ilo=151; Ihi=200; }
  else { BPlo=150.5; BPhi=250.4; Ilo=201; Ihi=300; }

  return ((Ihi - Ilo)/(BPhi - BPlo)) * (pm - BPlo) + Ilo;
}

// ================= CATEGORY =================
String getAQICategory(float aqi) {
  if (aqi <= 50) return "Good";
  else if (aqi <= 100) return "Moderate";
  else if (aqi <= 150) return "Unhealthy";
  else return "Bad";
}

// ================= FILTER =================
float movingAverage(float *buffer, float value) {
  buffer[bufIndex] = value;
  float sum = 0;
  for (int i = 0; i < WINDOW; i++) sum += buffer[i];
  return sum / WINDOW;
}

// ================= WIFI =================
void setupWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

// ================= MQTT =================
void reconnectMQTT() {
  while (!client.connected()) {
    String clientId = "ESP32-" + String(random(10000));
    if (!client.connect(clientId.c_str())) delay(3000);
  }
}