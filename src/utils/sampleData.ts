// Sample data generator for ESP32 Dashboard
// Run this to add sample data to your Supabase database

import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

export const addSampleDataToDatabase = async () => {
  try {
    console.log('🔄 Adding sample data to Supabase...');
    
    const sampleDevices = [
      'ESP32_Living_Room_Light',
      'ESP32_Kitchen_Fan', 
      'ESP32_Bedroom_Heater',
      'ESP32_Office_Lamp'
    ];
    
    const sampleEvents = [];
    const now = new Date();
    
    // Generate 100 events for each device over the last 7 days
    for (const device of sampleDevices) {
      for (let i = 0; i < 100; i++) {
        // Random time within last 7 days
        const randomTime = new Date(
          now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)
        );
        
        // Random ON/OFF state
        const isOn = Math.random() > 0.4; // 60% chance of being ON
        
        sampleEvents.push({
          device_id: device,
          event_type: 'switch',
          value: isOn ? 'ON' : 'OFF',
          created_at: randomTime.toISOString(),
          ts: randomTime.toISOString()
        });
      }
    }
    
    // Insert sample data in chunks to avoid timeout
    const chunkSize = 50;
    for (let i = 0; i < sampleEvents.length; i += chunkSize) {
      const chunk = sampleEvents.slice(i, i + chunkSize);
      
      const { data, error } = await supabase
        .from('events')
        .insert(chunk);
        
      if (error) {
        console.error('❌ Error inserting chunk:', error);
        throw error;
      }
      
      console.log(`✅ Inserted chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(sampleEvents.length/chunkSize)}`);
    }
    
    console.log('🎉 Sample data added successfully!');
    console.log(`📊 Added ${sampleEvents.length} events for ${sampleDevices.length} devices`);
    
    return {
      success: true,
      eventsAdded: sampleEvents.length,
      devicesAdded: sampleDevices.length
    };
    
  } catch (error) {
    console.error('❌ Failed to add sample data:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test function - you can call this from browser console
declare global {
  interface Window {
    addSampleData: typeof addSampleDataToDatabase;
  }
}

if (typeof window !== 'undefined') {
  window.addSampleData = addSampleDataToDatabase;
}