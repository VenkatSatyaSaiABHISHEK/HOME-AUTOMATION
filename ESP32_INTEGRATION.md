# ESP32 Integration Guide

## 🎯 What Your ESP32 Code Already Has

Your ESP32 code is excellent! It includes:
- ✅ **SinricPro Integration** (Alexa/Google Assistant)
- ✅ **MQTT with TLS** (Secure EMQX Cloud connection)
- ✅ **HTTP API** (Direct control from dashboard)
- ✅ **Supabase Integration** (Event logging)
- ✅ **Multi-device Support** (2+ relays)
- ✅ **WiFi Auto-connect**
- ✅ **Time Sync for TLS**

## 🔗 Dashboard Integration

### 1. ESP32 Controller Component
Your dashboard now has a direct ESP32 controller that:
- **Auto-discovers** your ESP32 on the network
- **Real-time control** of all devices via HTTP API
- **Live status updates** every 5 seconds
- **IP configuration** dialog for easy setup
- **Error handling** with helpful troubleshooting

### 2. MQTT Integration
Your MQTT setup publishes to: `sinric/[DEVICE_ID]/status`
The dashboard subscribes to: `sinric/+/status` (wildcard for all devices)

## 🛠 Setup Instructions

### Step 1: Update Your ESP32 Code (Optional Improvements)

Replace the device array section with your actual device IDs:

```cpp
// Update these with your actual second device ID
#define SWITCH_ID_2 "bedroom_fan_001"  // Use a real device ID

Device devices[] = {
  {SWITCH_ID_1, RELAY_PIN_1, false},
  {SWITCH_ID_2, RELAY_PIN_2, false}
};
```

### Step 2: Find Your ESP32 IP Address

1. **Upload your code** to ESP32
2. **Open Serial Monitor** (115200 baud)
3. **Reset ESP32** and look for:
   ```
   WiFi -> abhi4g
   .......
   IP: 192.168.1.xxx
   ```
4. **Note this IP address**

### Step 3: Configure Dashboard

1. **Open your dashboard** at `http://localhost:3001`
2. **Click the gear icon** in the ESP32 Controller section
3. **Enter your ESP32 IP**: `http://192.168.1.xxx` (replace xxx with your IP)
4. **Click Connect**

## 📡 Device Mapping

Your ESP32 devices will appear in the dashboard as:

| Device ID | Name | GPIO Pin | Description |
|-----------|------|----------|-------------|
| `68e9d693ba649e246c0af03d` | Living Room Light | GPIO 23 | Relay 1 |
| `YOUR_SECOND_DEVICE_ID` | Bedroom Fan | GPIO 22 | Relay 2 |

## 🎮 Control Methods

Your devices can be controlled via:

### 1. **Voice Commands** (Alexa/Google)
- "Alexa, turn on living room light"
- "Hey Google, turn off bedroom fan"

### 2. **Dashboard Direct Control**
- ESP32 Controller section (HTTP API)
- Device cards with MQTT integration

### 3. **HTTP API** (Direct)
```bash
# Get status
curl http://192.168.1.xxx/status

# Control device
curl -X POST http://192.168.1.xxx/control \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"68e9d693ba649e246c0af03d","state":"ON"}'
```

### 4. **MQTT Commands**
```bash
# Publish to control topic
Topic: sinric/68e9d693ba649e246c0af03d/control
Message: {"state":"ON"}

# ESP32 publishes status to:
Topic: sinric/68e9d693ba649e246c0af03d/status
Message: {"deviceId":"68e9d693ba649e246c0af03d","state":"ON","timestamp":12345}
```

## 🔧 Troubleshooting

### ESP32 Not Found
1. **Check WiFi**: Ensure ESP32 and computer are on same network
2. **Check IP**: Use Serial Monitor to get correct IP
3. **Check Firewall**: Disable temporarily if needed
4. **Check Power**: Ensure ESP32 has stable power supply

### MQTT Connection Issues
1. **Check Internet**: MQTT requires internet connection
2. **Check Credentials**: Verify MQTT username/password
3. **Check Time**: ESP32 needs correct time for TLS

### Device Not Responding
1. **Check Wiring**: Ensure relays are connected properly
2. **Check Power**: Relays need adequate power supply
3. **Check GPIO**: Verify GPIO pins are correct

## 🚀 Advanced Features

### Add More Devices
1. **Add new device IDs** in ESP32 code
2. **Add GPIO pins** for new relays
3. **Update device array** with new entries
4. **Add to Device Manager** in dashboard

### Custom Device Names
Use the Device Manager to add friendly names:
- Device ID: `bedroom_fan_001`
- Name: "Bedroom Ceiling Fan"
- Description: "3-speed ceiling fan with remote"
- GPIO: 22
- Type: Fan
- Power: 75W

## 📊 Data Flow

```
Voice Command (Alexa) 
    ↓
SinricPro Cloud
    ↓
ESP32 (onPowerState)
    ↓
Relay Control + MQTT Publish + Supabase Log
    ↓
Dashboard (Real-time Update)
```

Your ESP32 setup is production-ready with multiple control methods and full integration! 🎉