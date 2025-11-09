import { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { config } from '../config';
import { supabase } from '../config/supabase';

export type SimpleDevice = { 
  deviceId: string; 
  gpio: number; 
  state: 'ON' | 'OFF';
  name?: string;
  lastSeen?: string;
};

export const useDevices = (pollMs = 10000) => {
  const [devices, setDevices] = useState<SimpleDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevicesFromSupabase = async (): Promise<SimpleDevice[]> => {
    try {
      // First, try to get custom devices from the custom_devices table
      const { data: customDevices, error: customError } = await supabase
        .from('custom_devices')
        .select('device_id, name, description, gpio_pin, device_type, power_rating')
        .limit(50);

      if (!customError && customDevices && customDevices.length > 0) {
        return customDevices.map((device: any) => ({
          deviceId: device.device_id,
          gpio: device.gpio_pin,
          state: 'OFF' as const, // Default state, will be updated by MQTT
          name: device.name,
          lastSeen: new Date().toISOString()
        }));
      }

      // Fallback to events table for backward compatibility
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('device_id, state, created_at')
        .limit(50);

      if (!error && eventsData && eventsData.length > 0) {
        // Get unique devices from events table
        const uniqueDevices = new Map();
        eventsData.forEach((event: any) => {
          if (!uniqueDevices.has(event.device_id)) {
            uniqueDevices.set(event.device_id, {
              deviceId: event.device_id,
              gpio: 0, // Default GPIO
              state: event.state || 'OFF',
              name: `Device ${event.device_id.slice(-4)}`, // Generate name from ID
              lastSeen: event.created_at
            });
          }
        });
        return Array.from(uniqueDevices.values());
      }
    } catch (err) {
      console.log('Supabase device fetch failed:', err);
    }
    return [];
  };

  const fetchDevicesFromESP32 = async (): Promise<SimpleDevice[]> => {
    try {
      // If ESP32 base URL is configured and not default
      if (config.esp32.baseUrl && !config.esp32.baseUrl.includes('[YOUR_ESP32_IP]')) {
        const res = await fetch(`${config.esp32.baseUrl}/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout
          signal: AbortSignal.timeout(5000)
        });
        
        if (res.ok) {
          const body = await res.json();
          return body.devices || [];
        }
      }
    } catch (err) {
      console.log('ESP32 device fetch failed:', err);
    }
    return [];
  };

  const fetchDevicesFromHistory = async (): Promise<SimpleDevice[]> => {
    try {
      // Get unique devices from events table
      const { data, error: historyError } = await supabase
        .from('events')
        .select('device_id')
        .limit(100);

      if (!historyError && data && data.length > 0) {
        // Get unique device IDs
        const uniqueDeviceIds = Array.from(new Set(data.map((d: any) => d.device_id)));
        
        return uniqueDeviceIds.map((deviceId: string) => ({
          deviceId,
          gpio: 0,
          state: 'OFF' as const,
          name: getDefaultDeviceName(deviceId)
        }));
      }
    } catch (err) {
      console.log('History-based device discovery failed:', err);
    }
    return [];
  };

  const getDefaultDeviceName = (deviceId: string): string => {
    // Generate friendly names based on device ID patterns
    const deviceNames: {[key: string]: string} = {
      '68e9d693ba649e246c0af03d': 'Living Room Light',
      '98a1b234cdef567890123456': 'Kitchen Light', 
      'b12c3d4e5f67890123456789': 'Porch Light',
      'c123d456e789f0123456789a': 'Bedroom Lamp',
      'd234e567f8901234567890ab': 'Garden Light',
      'e345f678901234567890abcd': 'Garage Light'
    };
    
    if (deviceNames[deviceId]) {
      return deviceNames[deviceId];
    }
    
    // Generate name based on device ID
    const lastFour = deviceId.slice(-4);
    const deviceTypes = ['Light', 'Switch', 'Outlet', 'Fan', 'Sensor'];
    const locations = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Office'];
    
    const typeIndex = parseInt(lastFour, 16) % deviceTypes.length;
    const locationIndex = parseInt(lastFour.slice(-2), 16) % locations.length;
    
    return `${locations[locationIndex]} ${deviceTypes[typeIndex]}`;
  };

  const startMQTTDiscovery = () => {
    // Connect to MQTT with enhanced configuration
    const mqttOptions = {
      username: config.mqtt.username,
      password: config.mqtt.password,
      clientId: config.mqtt.clientId + '_discovery',
      keepalive: 60,
      reconnectPeriod: 10000, // Try reconnect every 10 seconds
      clean: true,
      rejectUnauthorized: false, // Allow self-signed certificates
    };

    const protocol = config.mqtt.protocol || 'ws';
    const brokerUrl = `${protocol}://${config.mqtt.broker}:${config.mqtt.port}/mqtt`;
    
    console.log('🔗 Attempting MQTT connection to:', brokerUrl);
    console.log('📋 Using credentials:', { 
      username: config.mqtt.username, 
      clientId: mqttOptions.clientId,
      broker: config.mqtt.broker,
      port: config.mqtt.port,
      protocol: protocol
    });
    
    const client = mqtt.connect(brokerUrl, mqttOptions);

    client.on('connect', () => {
      console.log('🔗 MQTT Discovery connected successfully!');
      // Subscribe to all SinricPro status topics
      client.subscribe('sinric/+/status');
      console.log('📡 Listening for device announcements on sinric/+/status');
    });

    client.on('error', (error: any) => {
      console.error('❌ MQTT Discovery Error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        code: (error as any).code || 'Unknown',
        errno: (error as any).errno || 'Unknown'
      });
    });

    client.on('close', () => {
      console.log('📴 MQTT Discovery connection closed');
    });

    client.on('offline', () => {
      console.log('📵 MQTT Discovery client offline');
    });

    client.on('reconnect', () => {
      console.log('🔄 MQTT Discovery attempting to reconnect...');
    });

    client.on('message', (topic: string, message: Buffer) => {
      const messageStr = message.toString().trim();
      console.log(`📥 Discovery - Topic: ${topic}, Message: "${messageStr}"`);
      
      // Extract device ID from topic: sinric/{deviceId}/status
      const match = topic.match(/^sinric\/([^\/]+)\/status$/);
      if (match) {
        const deviceId = match[1];
        const state = messageStr === 'ON' ? 'ON' : 'OFF';
        
        // Update or add device
        setDevices(prev => {
          const existingIndex = prev.findIndex(d => d.deviceId === deviceId);
          const updatedDevice: SimpleDevice = {
            deviceId,
            gpio: 0,
            state,
            name: getDefaultDeviceName(deviceId),
            lastSeen: new Date().toISOString()
          };
          
          if (existingIndex >= 0) {
            // Update existing device
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...updatedDevice };
            console.log(`🔄 Updated device: ${deviceId} -> ${state}`);
            return updated;
          } else {
            // Add new device
            console.log(`➕ Discovered new device: ${deviceId} -> ${state}`);
            return [...prev, updatedDevice];
          }
        });
      }
    });

    return client;
  };

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try multiple discovery methods
      let discoveredDevices: SimpleDevice[] = [];
      
      // 1. Try Supabase devices table first
      const supabaseDevices = await fetchDevicesFromSupabase();
      if (supabaseDevices.length > 0) {
        discoveredDevices = supabaseDevices;
      }
      
      // 2. Try ESP32 endpoint if no Supabase devices
      if (discoveredDevices.length === 0) {
        const esp32Devices = await fetchDevicesFromESP32();
        if (esp32Devices.length > 0) {
          discoveredDevices = esp32Devices.map(d => ({
            ...d,
            name: d.name || getDefaultDeviceName(d.deviceId)
          }));
        }
      }
      
      // 3. Fall back to devices from history table
      if (discoveredDevices.length === 0) {
        const historyDevices = await fetchDevicesFromHistory();
        discoveredDevices = historyDevices;
      }
      
      setDevices(discoveredDevices);
      
      if (discoveredDevices.length === 0) {
        setError('No devices found. Check your SinricPro setup or ESP32 connections.');
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to discover devices';
      setError(errorMessage);
      console.error('Device discovery error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Start with initial fetch
    fetchDevices();
    
    // Start MQTT discovery for real-time updates
    const mqttClient = startMQTTDiscovery();
    
    // Periodic refresh (less frequent since we have real-time updates)
    const refreshInterval = setInterval(fetchDevices, pollMs * 3); // 3x slower refresh
    
    return () => {
      clearInterval(refreshInterval);
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, [pollMs]);

  const connectedCount = devices.filter(d => d.state === 'ON').length;

  return { 
    devices, 
    loading, 
    error, 
    connectedCount, 
    refresh: fetchDevices,
    totalDevices: devices.length 
  };
};

export default useDevices;
