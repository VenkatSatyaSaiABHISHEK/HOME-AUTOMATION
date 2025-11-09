// Add this to your ESP32 code to automatically share IP address via MQTT

void setup() {
  // ... your existing setup code ...
  
  // After WiFi connects successfully
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected! IP: ");
    Serial.println(WiFi.localIP());
    
    // Share IP address via MQTT for dashboard auto-discovery
    String ipTopic = "sinric/" + String(DEVICE_ID) + "/ip";
    String ipMessage = WiFi.localIP().toString();
    
    // Publish IP address to MQTT
    mqttClient.publish(ipTopic.c_str(), ipMessage.c_str(), true); // retained message
    
    Serial.println("IP address published to MQTT: " + ipTopic + " = " + ipMessage);
  }
}

// Also publish IP when MQTT reconnects
void onMqttConnect(bool sessionPresent) {
  Serial.println("MQTT Connected");
  
  // Publish current IP address
  String ipTopic = "sinric/" + String(DEVICE_ID) + "/ip";
  String ipMessage = WiFi.localIP().toString();
  mqttClient.publish(ipTopic.c_str(), ipMessage.c_str(), true);
  
  Serial.println("IP republished: " + ipMessage);
  
  // ... rest of your MQTT connect code ...
}