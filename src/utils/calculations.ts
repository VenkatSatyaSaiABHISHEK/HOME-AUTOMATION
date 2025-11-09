// Enhanced utility functions for IoT dashboard calculations
import { HistoricalData, DeviceStats, UsageAnalytics } from '../types';
import { differenceInMinutes, startOfDay, startOfWeek, startOfMonth, format, parseISO } from 'date-fns';

export const calculateTotalHours = (hoursOn: number[], hoursOff: number[]): number => {
    const totalOn = hoursOn.reduce((acc, hours) => acc + hours, 0);
    const totalOff = hoursOff.reduce((acc, hours) => acc + hours, 0);
    return totalOn + totalOff;
};

export const calculateAverage = (data: number[]): number => {
    const total = data.reduce((acc, value) => acc + value, 0);
    return data.length > 0 ? total / data.length : 0;
};

export const calculateFutureTotals = (currentTotal: number, dailyIncrease: number, days: number): number => {
    return currentTotal + (dailyIncrease * days);
};

// Calculate current session duration in real-time
export const calculateCurrentSessionDuration = (startTime: string): number => {
    if (!startTime) return 0;
    const start = new Date(startTime);
    const now = new Date();
    return differenceInMinutes(now, start);
};

// Format duration in a human-readable way
export const formatDuration = (minutes: number): string => {
    if (minutes < 1) return '< 1m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours < 24) {
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
};

// Calculate power consumption based on device rating and usage time
export const calculatePowerConsumption = (powerRating: number, durationMinutes: number): number => {
    return (powerRating * durationMinutes) / 60; // Convert to watt-hours
};

// Calculate electricity cost
export const calculateCost = (powerConsumption: number, costPerKWh: number): number => {
    return (powerConsumption / 1000) * costPerKWh;
};

// Generate usage analytics from historical data
export const generateUsageAnalytics = (history: HistoricalData[], costPerKWh: number = 0.15): UsageAnalytics => {
    const now = new Date();
    
    // Hourly usage pattern
    const hourlyUsage = Array.from({ length: 24 }, (_, hour) => {
        const hourData = history.filter(h => {
            const hourOfDay = parseISO(h.timestamp).getHours();
            return hourOfDay === hour && h.state === 'ON';
        });
        
        return {
            hour,
            duration: hourData.reduce((acc, h) => acc + h.duration, 0),
            count: hourData.length
        };
    });

    // Daily usage for last 30 days
    const dailyUsage = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const dayData = history.filter(h => 
            h.timestamp.startsWith(dateStr) && h.state === 'ON'
        );
        
        const duration = dayData.reduce((acc, h) => acc + h.duration, 0);
        const powerConsumption = calculatePowerConsumption(60, duration); // Assume 60W device
        
        return {
            date: format(date, 'MMM dd'),
            duration,
            cost: calculateCost(powerConsumption, costPerKWh)
        };
    }).reverse();

    // Weekly usage for last 12 weeks
    const weeklyUsage = Array.from({ length: 12 }, (_, i) => {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekStartStr = format(startOfWeek(weekStart), 'yyyy-MM-dd');
        
        const weekData = history.filter(h => {
            const dataDate = parseISO(h.timestamp);
            const weekStartDate = startOfWeek(weekStart);
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 7);
            
            return dataDate >= weekStartDate && dataDate < weekEndDate && h.state === 'ON';
        });
        
        const uniqueDevices = new Set(weekData.map(h => h.deviceId)).size;
        
        return {
            week: format(startOfWeek(weekStart), 'MMM dd'),
            duration: weekData.reduce((acc, h) => acc + h.duration, 0),
            devices: uniqueDevices
        };
    }).reverse();

    // Monthly usage for last 12 months
    const monthlyUsage = Array.from({ length: 12 }, (_, i) => {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = format(monthStart, 'yyyy-MM');
        
        const monthData = history.filter(h => 
            h.timestamp.startsWith(monthStr) && h.state === 'ON'
        );
        
        const duration = monthData.reduce((acc, h) => acc + h.duration, 0);
        const powerConsumption = calculatePowerConsumption(60, duration);
        
        return {
            month: format(monthStart, 'MMM yyyy'),
            duration,
            cost: calculateCost(powerConsumption, costPerKWh)
        };
    }).reverse();

    return {
        hourlyUsage,
        dailyUsage,
        weeklyUsage,
        monthlyUsage
    };
};

// Calculate environmental impact (CO2 savings)
export const calculateCO2Impact = (powerSavedKWh: number): number => {
    // Average CO2 emission factor: 0.4 kg CO2 per kWh (varies by region)
    return powerSavedKWh * 0.4;
};

// Predict future usage based on historical patterns
export const predictUsage = (history: HistoricalData[], days: number = 30): number => {
    if (history.length < 7) return 0;
    
    const recentWeek = history.slice(0, 7);
    const averageDailyUsage = recentWeek.reduce((acc, h) => acc + (h.state === 'ON' ? h.duration : 0), 0) / 7;
    
    return averageDailyUsage * days;
};

// Get peak usage time
export const getPeakUsageHour = (history: HistoricalData[]): string => {
    const hourlyTotals = new Array(24).fill(0);
    
    history.forEach(h => {
        if (h.state === 'ON') {
            const hour = parseISO(h.timestamp).getHours();
            hourlyTotals[hour] += h.duration;
        }
    });
    
    const peakHour = hourlyTotals.indexOf(Math.max(...hourlyTotals));
    return `${peakHour}:00 - ${(peakHour + 1) % 24}:00`;
};

// Utility function to check if device should auto-shutdown
export const shouldAutoShutdown = (startTime: string, autoShutoffMinutes: number): boolean => {
    if (!startTime || !autoShutoffMinutes) return false;
    
    const sessionDuration = calculateCurrentSessionDuration(startTime);
    return sessionDuration >= autoShutoffMinutes;
};