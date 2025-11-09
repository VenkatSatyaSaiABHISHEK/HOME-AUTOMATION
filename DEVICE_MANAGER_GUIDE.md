# Device Manager Setup Guide

## 🎯 What This Adds

The Device Manager allows you to:

1. **Add Custom Devices** - Name them whatever you want (e.g., "Living Room Light", "Kitchen Fan")
2. **Set Device Types** - Light, Fan, AC, TV, etc. with appropriate power ratings
3. **Specify GPIO Pins** - Map devices to specific ESP32 pins
4. **Add Descriptions** - Remember what each device controls
5. **Manage Power Ratings** - Track electricity consumption accurately

## 🛠 Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Create custom_devices table
CREATE TABLE IF NOT EXISTS custom_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  gpio_pin INTEGER NOT NULL,
  device_type VARCHAR(50) DEFAULT 'other',
  power_rating INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_custom_devices_device_id ON custom_devices(device_id);

-- Sample devices (optional)
INSERT INTO custom_devices (device_id, name, description, gpio_pin, device_type, power_rating) VALUES 
  ('68e9d693ba649e246c0af03d', 'Living Room Light', '15V LED Light connected to relay 1', 2, 'light', 15),
  ('bedroom_fan_001', 'Bedroom Ceiling Fan', 'High-speed ceiling fan with 3 speed control', 4, 'fan', 75),
  ('kitchen_exhaust', 'Kitchen Exhaust Fan', 'Exhaust fan for kitchen ventilation', 5, 'fan', 45)
ON CONFLICT (device_id) DO NOTHING;
```

## 🚀 How to Use

1. **Open Device Manager** - Click the "+" button in the dashboard header
2. **Add New Device** - Click "Add Device" and fill in the details:
   - **Device Name**: Friendly name like "Living Room Light"
   - **Device Type**: Select from Light, Fan, AC, etc.
   - **Description**: Optional details like "15V LED connected to relay 1"
   - **GPIO Pin**: ESP32 pin number (usually 2, 4, 5, etc.)
   - **Power Rating**: Watts consumed by the device
   - **Device ID**: Auto-generated or custom ID for MQTT

3. **Your ESP32 Code** should publish to: `sinric/[DEVICE_ID]/status`

## 📋 Device Types Available

- **Light/Bulb** - LED lights, CFL, incandescent (default: 15W)
- **Fan** - Ceiling fans, exhaust fans, table fans (default: 75W)
- **Air Conditioner** - Split AC, window AC (default: 1500W)
- **Kitchen Appliance** - Microwave, mixer, etc. (default: 800W)
- **TV/Entertainment** - Television, sound system (default: 150W)
- **Network Device** - Router, modem (default: 12W)
- **Other Device** - Custom devices (default: 50W)

## 💡 Examples

### Relay Board Setup
If you have a 2-relay board:
- **Relay 1 (GPIO 2)**: "Living Room Light" - 15V LED Bulb
- **Relay 2 (GPIO 4)**: "Bedroom Fan" - Ceiling Fan

### ESP32 MQTT Messages
Your ESP32 should send:
```
Topic: sinric/living_room_light/status
Message: ON  (or OFF)
```

The dashboard will automatically discover and display your custom devices with their proper names and power calculations!