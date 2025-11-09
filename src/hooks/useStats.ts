import { useState, useEffect } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { Device, DeviceStats, HistoricalData } from '../types';
import { calculateCurrentSessionDuration, formatDuration } from '../utils/calculations';

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

export const useStats = (deviceId: string) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [history, setHistory] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize device object first
    setDevice({
      deviceId,
      gpio: 0,
      state: 'OFF',
      lastUpdate: new Date().toISOString()
    });

    // Connect to MQTT with enhanced configuration
    const mqttOptions = {
      username: config.mqtt.username,
      password: config.mqtt.password,
      clientId: config.mqtt.clientId,
      keepalive: 60,
      reconnectPeriod: 10000,
      clean: true,
      rejectUnauthorized: false, // Allow self-signed certificates
    };

    const protocol = config.mqtt.protocol || 'ws';
    const brokerUrl = `${protocol}://${config.mqtt.broker}:${config.mqtt.port}/mqtt`;
    
    console.log(`🔗 Device ${deviceId} connecting to MQTT...`);
    console.log(`🔗 Using URL: ${brokerUrl}`);
    const client = mqtt.connect(brokerUrl, mqttOptions);

    client.on('connect', () => {
      console.log('🔗 Connected to MQTT broker');
      // Subscribe to the exact topic your ESP32 uses
      client.subscribe(`sinric/${deviceId}/status`);
      console.log(`📡 Subscribed to: sinric/${deviceId}/status`);
    });

    client.on('message', (topic: string, message: Buffer) => {
      const messageStr = message.toString().trim();
      console.log(`📥 MQTT Message - Topic: ${topic}, Message: "${messageStr}"`);
      
      // Your ESP32 sends just "ON" or "OFF", not JSON
      if (topic === `sinric/${deviceId}/status`) {
        const newState = messageStr === 'ON' ? 'ON' : 'OFF';
        
        setDevice((prev: Device | null) => ({
          deviceId: deviceId,
          gpio: prev?.gpio || 0,
          state: newState,
          lastUpdate: new Date().toISOString()
        }));
        
        console.log(`🔄 Device ${deviceId} state updated to: ${newState}`);
      }
    });

    client.on('error', (error: any) => {
      console.error('❌ MQTT Connection Error:', error);
      setError(`MQTT Error: ${error.message}`);
    });

    client.on('offline', () => {
      console.log('📴 MQTT Client offline');
    });

    client.on('reconnect', () => {
      console.log('🔄 MQTT Reconnecting...');
    });

    // Fetch initial device state
    fetch(`${config.esp32.baseUrl}/status/one?deviceId=${deviceId}`)
      .then(res => res.json())
      .then(data => {
        setDevice(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

    // Fetch historical data from Supabase (using actual table structure)
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('device_id', deviceId)  // Use device_id column
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        setError(error.message);
      } else {
        setHistory(data);
        calculateStats(data);
      }
    };

    fetchHistory();

    // Cleanup
    return () => {
      client.end();
    };
  }, [deviceId]);

  const calculateStats = (history: HistoricalData[]) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Calculate usage durations (using created_at instead of timestamp)
    const dailyMinutes = history
      .filter(h => h.created_at?.startsWith(today) && h.state === 'ON')
      .reduce((acc, curr) => acc + (curr.duration || 5), 0);  // Default 5 min if no duration

    const weeklyMinutes = history
      .filter(h => (h.created_at || '') >= weekAgo && h.state === 'ON')
      .reduce((acc, curr) => acc + (curr.duration || 5), 0);

    const monthlyMinutes = history
      .filter(h => (h.created_at || '') >= monthAgo && h.state === 'ON')
      .reduce((acc, curr) => acc + (curr.duration || 5), 0);

    const dailyHours = dailyMinutes / 60;
    const weeklyHours = weeklyMinutes / 60;
    const monthlyHours = monthlyMinutes / 60;

    // Calculate power consumption (assuming 60W device)
    const powerRating = 60; // watts
    const powerConsumption = (dailyMinutes / 60) * powerRating;

    // Calculate average daily usage over the past month
    const averageDailyUsage = monthlyHours / 30;

    // Find peak usage hour
    const hourlyTotals = new Array(24).fill(0);
    history.forEach(h => {
      if (h.state === 'ON' && h.created_at) {
        const hour = new Date(h.created_at).getHours();
        hourlyTotals[hour] += (h.duration || 5);
      }
    });
    const peakHour = hourlyTotals.indexOf(Math.max(...hourlyTotals));
    const peakUsageHour = `${peakHour}:00-${(peakHour + 1) % 24}:00`;

    // Calculate estimated cost (assuming $0.15 per kWh)
    const costPerKWh = 0.15;
    const costPerDay = ((dailyMinutes / 60) * powerRating / 1000) * costPerKWh;

    // Find most recent state change for current session tracking
    const lastStateChange = history
      .filter(h => h.device_id === deviceId)
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())[0]?.created_at || '';

    setStats({
      deviceId,
      dailyHours,
      weeklyHours,
      monthlyHours,
      powerConsumption,
      lastStateChange,
      totalOnTime: history.reduce((acc, curr) => acc + (curr.state === 'ON' ? (curr.duration || 5) : 0), 0),
      averageDailyUsage,
      peakUsageHour,
      costPerDay
    });
  };

  const toggleDevice = async (newState: 'ON' | 'OFF') => {
    try {
      console.log(`🎛️ Attempting to toggle device ${deviceId} to ${newState}`);
      
      // Try ESP32 endpoint first
      if (config.esp32.baseUrl && !config.esp32.baseUrl.includes('[YOUR_ESP32_IP]')) {
        try {
          const response = await fetch(`${config.esp32.baseUrl}/control`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              deviceId,
              state: newState
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ESP32 control successful:`, data);
            // Don't update state here - wait for MQTT message
            return;
          }
        } catch (esp32Error) {
          console.log('ESP32 endpoint failed, trying alternative methods...');
        }
      }

      // Alternative: Direct MQTT publish (if your setup supports it)
      // You can add SinricPro API calls here as backup

      // For now, optimistically update the UI
      setDevice((prev: Device | null) => ({
        deviceId: deviceId,
        gpio: prev?.gpio || 0,
        state: newState,
        lastUpdate: new Date().toISOString()
      }));
      
      console.log(`🔄 Optimistically updated device ${deviceId} to ${newState}`);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to control device';
      console.error('❌ Device control error:', errorMessage);
      setError(errorMessage);
    }
  };

  return {
    device,
    stats,
    history,
    loading,
    error,
    toggleDevice
  };
};