-- Create the devices table
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  gpio INTEGER,
  state BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the device_history table for historical data
CREATE TABLE IF NOT EXISTS device_history (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  state BOOLEAN NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0,
  cost_inr DECIMAL(10,2) DEFAULT 0.00,
  FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

-- Create an index for faster queries on device_history
CREATE INDEX IF NOT EXISTS idx_device_history_device_id ON device_history(device_id);
CREATE INDEX IF NOT EXISTS idx_device_history_timestamp ON device_history(timestamp);

-- Insert some sample devices for testing
INSERT INTO devices (device_id, name, gpio, state) VALUES 
  ('68e9d693ba649e246c0af03d', 'Smart Light', 2, false),
  ('esp32_device_001', 'Kitchen Fan', 4, false),
  ('esp32_device_002', 'Living Room AC', 5, false)
ON CONFLICT (device_id) DO NOTHING;

-- Create custom_devices table for user-defined devices
CREATE TABLE IF NOT EXISTS custom_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  gpio_pin INTEGER NOT NULL,
  device_type VARCHAR(50) DEFAULT 'other',
  power_rating INTEGER DEFAULT 50, -- watts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_devices_device_id ON custom_devices(device_id);

-- Insert some sample custom devices
INSERT INTO custom_devices (device_id, name, description, gpio_pin, device_type, power_rating) VALUES 
  ('68e9d693ba649e246c0af03d', 'Living Room Light', '15V LED Light connected to relay 1', 2, 'light', 15),
  ('bedroom_fan_001', 'Bedroom Ceiling Fan', 'High-speed ceiling fan with 3 speed control', 4, 'fan', 75),
  ('kitchen_exhaust', 'Kitchen Exhaust Fan', 'Exhaust fan for kitchen ventilation', 5, 'fan', 45),
  ('ac_living_room', 'Living Room AC', '1.5 Ton split AC unit', 18, 'ac', 1500)
ON CONFLICT (device_id) DO NOTHING;