# MQTT & Database Connection Troubleshooting Guide

## 🔧 MQTT Connection Issues

### Problem: "Failed to connect with any MQTT configuration"

**Root Causes & Solutions:**

1. **Incorrect MQTT Broker Settings**
   ```bash
   # Check your ESP32 code for these settings:
   const char* mqtt_server = "e2a792bf.ala.eu-central-1.emqxsl.com";
   const int mqtt_port = 8883;  // or 1883
   const char* mqtt_user = "esp32_1";
   const char* mqtt_password = "321654987";
   ```

2. **Browser Security Restrictions**
   - Browsers block insecure WebSocket connections (ws://) on HTTPS sites
   - Try accessing dashboard via `http://localhost:3001` (not HTTPS)
   - Use secure WebSocket (wss://) for production

3. **MQTT Broker Account Issues**
   - **Check EMQX Cloud Console**: https://cloud.emqx.com/
   - Verify credentials are correct
   - Check if account is active/expired
   - Verify connection limits not exceeded

### EMQX Cloud Configuration Steps:

1. **Login to EMQX Cloud**: https://cloud.emqx.com/
2. **Go to Deployments** → Select your deployment
3. **Authentication** → Check username/password
4. **TLS/SSL** → Verify port settings:
   - Port 1883: Non-SSL MQTT
   - Port 8883: SSL MQTT
   - Port 8083: WebSocket
   - Port 8084: Secure WebSocket
5. **Access Control** → Allow your client IDs

## 📊 Supabase Connection Issues

### Problem: "Database connected but no data visible"

**Troubleshooting Steps:**

1. **Check Table Structure**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM information_schema.tables 
   WHERE table_name IN ('events', 'custom_devices');
   
   -- Check events table structure
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'events';
   ```

2. **Test Data Insertion**
   ```sql
   -- Insert test record
   INSERT INTO events (deviceid, action, state, gpio, timestamp)
   VALUES ('test_device', 'TEST_ACTION', 'ON', 23, NOW());
   
   -- Query recent data
   SELECT * FROM events ORDER BY created_at DESC LIMIT 10;
   ```

3. **ESP32 Logging Issues**
   - Check if ESP32 is actually sending data to Supabase
   - Look for HTTP POST requests in serial monitor
   - Verify Supabase URL and API key in ESP32 code

## 🔍 Step-by-Step Diagnosis

### 1. Check ESP32 Serial Monitor
Look for these messages:
```
WiFi connected! IP: 192.168.x.x  ← Note this IP
MQTT connecting...
MQTT connected ← Should see this
SinricPro connected ← Should see this
Supabase POST: 200 ← Should see this when device changes state
```

### 2. Test MQTT Connection Manually
Use MQTT client (like MQTT Explorer):
```
Host: e2a792bf.ala.eu-central-1.emqxsl.com
Port: 8883 (SSL) or 1883 (Plain)
Username: esp32_1
Password: 321654987
Subscribe to: sinric/+/+
```

### 3. Test Supabase Connection
```javascript
// Test in browser console on dashboard
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

// Test query
supabase.from('events').select('*').limit(5).then(console.log);
```

## 🛠️ Configuration Files to Check

### ESP32 Code (`ESP32_INTEGRATION.ino`):
```cpp
// WiFi credentials
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT settings (must match dashboard)
const char* mqtt_server = "e2a792bf.ala.eu-central-1.emqxsl.com";
const int mqtt_port = 8883;
const char* mqtt_user = "esp32_1";
const char* mqtt_password = "321654987";

// Supabase settings
const char* supabase_url = "YOUR_SUPABASE_URL";
const char* supabase_anon_key = "YOUR_SUPABASE_ANON_KEY";
```

### Dashboard Config (`src/config/index.ts`):
```typescript
export const config = {
  mqtt: {
    broker: 'e2a792bf.ala.eu-central-1.emqxsl.com',
    port: 1883, // Try 1883 first, then 8883
    username: 'esp32_1',
    password: '321654987',
    protocol: 'mqtt' // Try 'mqtt' first
  },
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  }
}
```

## 🔄 Testing Process

### 1. Test Dashboard MQTT Connection:
1. Open browser console (F12)
2. Look for MQTT connection attempts
3. Check for successful connection messages
4. If failed, try different ports/protocols

### 2. Test ESP32 → MQTT → Dashboard:
1. Use Alexa to control device: "Turn on [device name]"
2. Check ESP32 serial monitor for MQTT publish
3. Check dashboard for real-time update

### 3. Test Dashboard → ESP32:
1. Click device toggle in dashboard
2. Check if ESP32 receives command
3. Verify physical device responds

### 4. Test Supabase Integration:
1. Click on "Supabase Database" card in dashboard
2. Data viewer dialog should open
3. Click "Test Connection" button
4. Click "Insert Test Data" to verify write access

## 🚨 Common Issues & Quick Fixes

### Issue 1: MQTT "Connection Refused"
**Fix**: Check EMQX Cloud account status and credentials

### Issue 2: WebSocket Connection Failed
**Fix**: Try non-secure connection (ws:// instead of wss://)

### Issue 3: ESP32 IP Changes
**Solution**: Use the new auto-discovery feature - ESP32 now publishes its IP to MQTT

### Issue 4: No Supabase Data
**Fix**: Check RLS (Row Level Security) policies in Supabase

### Issue 5: Alexa Works but Dashboard Doesn't
**Fix**: MQTT connection issue - ESP32 connected but dashboard isn't

## 📞 Support Checklist

Before asking for help, check:
- [ ] ESP32 serial monitor shows successful connections
- [ ] EMQX Cloud account is active
- [ ] Supabase project is active
- [ ] Browser console shows detailed error messages
- [ ] All credentials match between ESP32 and dashboard
- [ ] Network allows WebSocket connections

## 🔧 Updated Features

### New Auto-Discovery:
- ESP32 now publishes its IP address to MQTT automatically
- Dashboard detects IP changes and prompts for update
- No more manual IP configuration needed!

### Enhanced Data Viewer:
- Click "Supabase Database" card to view data
- Test database connection
- Insert test data
- View events and custom devices

### Improved MQTT:
- Multiple connection protocols tried automatically
- Better error messages and logging
- Real-time connection status monitoring

---
**Last Updated**: ${new Date().toLocaleString()}