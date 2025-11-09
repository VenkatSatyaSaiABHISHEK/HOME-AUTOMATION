export interface Device {
    deviceId: string;
    gpio: number;
    state: 'ON' | 'OFF';
    lastUpdate?: string;
    name?: string;
    location?: string;
    powerRating?: number; // Watts
    isOnline?: boolean;
    currentSessionStart?: string; // When device was last turned ON
}

export type DeviceResponse = {
    success: boolean;
    deviceId: string;
    gpio: number;
    state: 'ON' | 'OFF';
};

export interface DeviceStats {
    deviceId: string;
    dailyHours: number;
    weeklyHours: number;
    monthlyHours: number;
    powerConsumption: number;
    lastStateChange: string;
    totalOnTime: number;
    averageDailyUsage: number;
    peakUsageHour: string;
    costPerDay: number;
    co2Saved?: number; // Environmental impact
}

export interface HistoricalData {
    id?: number;
    device_id: string;        // Matching your Supabase table
    state: 'ON' | 'OFF';
    ts?: number;              // Unix timestamp from your table
    created_at?: string;      // ISO timestamp from Supabase
    action?: string;          // Optional action field
    gpio?: number;            // Optional GPIO field
    duration?: number;        // in minutes (calculated or default)
    powerConsumption?: number;
    temperature?: number;
    humidity?: number;
}

export interface UsageAnalytics {
    hourlyUsage: Array<{
        hour: number;
        duration: number;
        count: number;
    }>;
    dailyUsage: Array<{
        date: string;
        duration: number;
        cost: number;
    }>;
    weeklyUsage: Array<{
        week: string;
        duration: number;
        devices: number;
    }>;
    monthlyUsage: Array<{
        month: string;
        duration: number;
        cost: number;
    }>;
}

export interface CardProps {
    title: string;
    value: number | string;
}

export interface TimerSession {
    deviceId: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    isActive: boolean;
}

export interface DevicePreferences {
    autoShutoff?: number; // minutes
    notifications: boolean;
    costPerKWh: number;
    currency: string;
}