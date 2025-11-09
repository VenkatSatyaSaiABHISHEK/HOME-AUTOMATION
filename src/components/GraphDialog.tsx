import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Box, 
  Typography, 
  Toolbar,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  useTheme,
  Button,
  ButtonGroup,
  Chip
} from '@mui/material';
import { 
  Close,
  Timeline,
  BarChart as BarChartIcon,
  Schedule,
  ElectricBolt,
  TrendingUp,
  AccessTime
} from '@mui/icons-material';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { HistoricalData } from '../types';
import { generateUsageAnalytics, formatDuration, calculateCost } from '../utils/calculations';
import { format, parseISO } from 'date-fns';

interface GraphDialogProps {
  open: boolean;
  onClose: () => void;
  deviceName: string;
  history: HistoricalData[];
}

export const GraphDialog: React.FC<GraphDialogProps> = ({ open, onClose, deviceName, history }) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');

  // Generate comprehensive analytics
  const analytics = generateUsageAnalytics(history || []);
  
  // Filter data based on time range
  const getFilteredData = (data: any[], range: string) => {
    const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    return data.slice(-days);
  };

  // Prepare different chart data sets
  const usageTimeline = (history || [])
    .slice(-50) // Last 50 events
    .reverse()
    .map(h => ({
      time: format(parseISO(h.timestamp), 'MMM dd HH:mm'),
      duration: h.duration,
      state: h.state,
      cost: calculateCost((h.duration / 60) * 60, 0.15) // Assuming 60W device
    }));

  const hourlyPattern = analytics.hourlyUsage.map(h => ({
    hour: `${h.hour}:00`,
    usage: h.duration / 60, // Convert to hours
    sessions: h.count
  }));

  const dailyTrends = getFilteredData(analytics.dailyUsage, timeRange);

  const pieData = [
    { name: 'Active Time', value: history.filter(h => h.state === 'ON').length, color: theme.palette.success.main },
    { name: 'Idle Time', value: history.filter(h => h.state === 'OFF').length, color: theme.palette.error.main }
  ];

  // Calculate summary stats
  const totalUsageMinutes = (history || []).reduce((acc, h) => acc + (h.state === 'ON' ? h.duration : 0), 0);
  const averageSessionLength = totalUsageMinutes / (history?.filter(h => h.state === 'ON').length || 1);
  const totalCost = calculateCost((totalUsageMinutes / 60) * 60, 0.15);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog 
      fullScreen 
      open={open} 
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 50%, #16213E 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }
      }}
    >
      <Toolbar 
        sx={{ 
          background: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box display="flex" alignItems="center" gap={2} flex={1}>
          <BarChartIcon sx={{ color: theme.palette.primary.main }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {deviceName} Analytics
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Comprehensive usage insights and patterns
            </Typography>
          </Box>
        </Box>
        
        <ButtonGroup size="small" sx={{ mr: 2 }}>
          {['24h', '7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'contained' : 'outlined'}
              onClick={() => setTimeRange(range)}
              size="small"
            >
              {range}
            </Button>
          ))}
        </ButtonGroup>
        
        <IconButton edge="end" color="inherit" onClick={onClose}>
          <Close />
        </IconButton>
      </Toolbar>

      <DialogContent sx={{ p: 0 }}>
        {(!history || history.length === 0) ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Schedule sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
            <Typography variant="h6" gutterBottom>No usage data available</Typography>
            <Typography variant="body2" color="text.secondary">
              Device hasn't recorded any activity yet. Check your MQTT connection and database setup.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <Card elevation={0} sx={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${theme.palette.divider}` }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <AccessTime sx={{ fontSize: 32, color: theme.palette.primary.main, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {formatDuration(totalUsageMinutes)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Usage Time
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Card elevation={0} sx={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${theme.palette.divider}` }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Schedule sx={{ fontSize: 32, color: theme.palette.success.main, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {formatDuration(averageSessionLength)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg Session Length
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Card elevation={0} sx={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${theme.palette.divider}` }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <ElectricBolt sx={{ fontSize: 32, color: theme.palette.warning.main, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        ${totalCost.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Cost
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Card elevation={0} sx={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${theme.palette.divider}` }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <TrendingUp sx={{ fontSize: 32, color: theme.palette.info.main, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {history.filter(h => h.state === 'ON').length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Sessions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Tabs for different views */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} centered>
                <Tab 
                  icon={<Timeline />} 
                  label="Usage Timeline" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<BarChartIcon />} 
                  label="Daily Patterns" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<Schedule />} 
                  label="Hourly Analysis" 
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ p: 3, height: 'calc(100vh - 280px)' }}>
              {tabValue === 0 && (
                <Box sx={{ height: '100%' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Usage Timeline</Typography>
                    <Chip 
                      label={`${usageTimeline.length} recent sessions`} 
                      size="small" 
                      color="primary" 
                    />
                  </Box>
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={usageTimeline}>
                      <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis 
                        stroke={theme.palette.text.secondary}
                        label={{ value: 'Duration (min)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8
                        }}
                        labelFormatter={(label) => `Time: ${label}`}
                        formatter={(value: any, name: string) => [
                          name === 'duration' ? `${value} min` : 
                          name === 'cost' ? `$${value.toFixed(3)}` : value,
                          name === 'duration' ? 'Duration' : 
                          name === 'cost' ? 'Cost' : name
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="duration" 
                        stroke={theme.palette.primary.main}
                        fillOpacity={1}
                        fill="url(#colorUsage)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              )}

              {tabValue === 1 && (
                <Box sx={{ height: '100%' }}>
                  <Typography variant="h6" mb={2}>Daily Usage Trends</Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="date" 
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis 
                        stroke={theme.palette.text.secondary}
                        label={{ value: 'Duration (min)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8
                        }}
                        formatter={(value: any, name: string) => [
                          name === 'duration' ? `${value} min` : `$${value.toFixed(2)}`,
                          name === 'duration' ? 'Usage Time' : 'Cost'
                        ]}
                      />
                      <Bar 
                        dataKey="duration" 
                        fill={theme.palette.primary.main}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}

              {tabValue === 2 && (
                <Grid container spacing={3} sx={{ height: '100%' }}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" mb={2}>Hourly Usage Pattern</Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={hourlyPattern}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis 
                          dataKey="hour" 
                          stroke={theme.palette.text.secondary}
                        />
                        <YAxis 
                          stroke={theme.palette.text.secondary}
                          label={{ value: 'Usage (hours)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            background: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8
                          }}
                        />
                        <Bar 
                          dataKey="usage" 
                          fill={theme.palette.success.main}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="h6" mb={2}>Usage Distribution</Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="value"
                          label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>
                </Grid>
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GraphDialog;
