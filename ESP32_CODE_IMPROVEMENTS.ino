// ESP32 Code Improvements for Better Dashboard Integration

// Add this function to your ESP32 code for better device discovery:

void handleDeviceDiscovery() {
  StaticJsonDocument<1024> doc;
  doc["success"] = true;
  doc["esp32_info"] = true;
  doc["firmware_version"] = "1.0.0";
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["free_heap"] = ESP.getFreeHeap();
  doc["uptime"] = millis();
  
  JsonArray devices = doc.createNestedArray("devices");
  for (int i = 0; i < NUM_DEVICES; i++) {
    JsonObject device = devices.createNestedObject();
    device["deviceId"] = devices[i].deviceId;
    device["name"] = getDeviceFriendlyName(devices[i].deviceId); // New function below
    device["gpio"] = devices[i].relayPin;
    device["state"] = devices[i].state ? "ON" : "OFF";
    device["type"] = getDeviceType(devices[i].deviceId); // New function below
    device["powerRating"] = getDevicePowerRating(devices[i].deviceId); // New function below
  }
  
  String response;
  serializeJson(doc, response);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", response);
}

// Add friendly names for your devices
String getDeviceFriendlyName(String deviceId) {
  if (deviceId == SWITCH_ID_1) return "Living Room Light";
  if (deviceId == SWITCH_ID_2) return "Bedroom Fan";
  return "Unknown Device";
}

// Add device types
String getDeviceType(String deviceId) {
  if (deviceId == SWITCH_ID_1) return "light";
  if (deviceId == SWITCH_ID_2) return "fan";
  return "other";
}

// Add power ratings (watts)
int getDevicePowerRating(String deviceId) {
  if (deviceId == SWITCH_ID_1) return 15;  // 15W LED light
  if (deviceId == SWITCH_ID_2) return 75;  // 75W fan
  return 50; // default
}

// Add this route to your setup() function:
void setup() {
  // ... existing setup code ...
  
  // Add new routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/status/one", HTTP_GET, handleStatusOne);
  server.on("/control", HTTP_POST, handleControl);
  server.on("/control", HTTP_OPTIONS, handleControl);
  server.on("/info", HTTP_GET, handleInfo);
  server.on("/discover", HTTP_GET, handleDeviceDiscovery); // NEW ROUTE
  
  // ... rest of setup
}

// Improved MQTT status publishing with more details
void publishMqttStatus(String deviceId, bool state) {
  if (!mqttClient.connected()) return;
  
  String statusTopic = "sinric/" + deviceId + "/status";
  StaticJsonDocument<300> doc;
  doc["deviceId"] = deviceId;
  doc["name"] = getDeviceFriendlyName(deviceId);
  doc["state"] = state ? "ON" : "OFF";
  doc["timestamp"] = millis();
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["type"] = getDeviceType(deviceId);
  doc["powerRating"] = getDevicePowerRating(deviceId);
  
  String msg;
  serializeJson(doc, msg);
  mqttClient.publish(statusTopic.c_str(), msg.c_str());
  Serial.printf("📤 MQTT Status -> %s: %s\n", statusTopic.c_str(), state ? "ON" : "OFF");
}

// Optional: Add device configuration endpoint
void handleDeviceConfig() {
  StaticJsonDocument<512> doc;
  doc["success"] = true;
  JsonArray configs = doc.createNestedArray("configurations");
  
  for (int i = 0; i < NUM_DEVICES; i++) {
    JsonObject config = configs.createNestedObject();
    config["deviceId"] = devices[i].deviceId;
    config["name"] = getDeviceFriendlyName(devices[i].deviceId);
    config["description"] = getDeviceDescription(devices[i].deviceId);
    config["gpio"] = devices[i].relayPin;
    config["type"] = getDeviceType(devices[i].deviceId);
    config["powerRating"] = getDevicePowerRating(devices[i].deviceId);
  }
  
  String response;
  serializeJson(doc, response);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", response);
}

String getDeviceDescription(String deviceId) {
  if (deviceId == SWITCH_ID_1) return "15V LED Light connected to relay 1";
  if (deviceId == SWITCH_ID_2) return "Ceiling fan with 3-speed control";
  return "Generic IoT device";
}

// Add this route in setup():
// server.on("/config", HTTP_GET, handleDeviceConfig);