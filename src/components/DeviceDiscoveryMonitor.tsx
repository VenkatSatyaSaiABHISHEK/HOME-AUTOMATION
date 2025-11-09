import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  Badge
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Search,
  RadioButtonUnchecked,
  DevicesOther,
  Topic,
  Visibility,
  NetworkCheck
} from '@mui/icons-material';

interface DeviceDiscoveryMonitorProps {
  open: boolean;
  onClose: () => void;
}

interface ProcessStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
  details?: string;
}

interface DiscoveredDevice {
  id: string;
  name: string;
  type: 'esp32' | 'custom' | 'mqtt' | 'unknown';
  source: 'network' | 'mqtt' | 'database';
  lastActivity: Date;
  status: 'active' | 'inactive' | 'error';
  metadata?: {
    ip?: string;
    firmware?: string;
    topics?: string[];
    lastMessage?: string;
  };
}

interface MonitoringStats {
  totalDevices: number;
  activeDevices: number;
  mqttTopics: number;
  networkDevices: number;
  databaseEntries: number;
}

export const DeviceDiscoveryMonitor: React.FC<DeviceDiscoveryMonitorProps> = ({ open, onClose }) => {
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [stats, setStats] = useState<MonitoringStats>({
    totalDevices: 0,
    activeDevices: 0,
    mqttTopics: 0,
    networkDevices: 0,
    databaseEntries: 0
  });
  const [activeTopics, setActiveTopics] = useState<string[]>([]);

  const initializeSteps = () => {
    const initialSteps: ProcessStep[] = [
      {
        id: 'mqtt-topics',
        name: 'MQTT Topic Discovery',
        status: 'pending',
        message: 'Scanning for active MQTT topics...',
        timestamp: new Date()
      },
      {
        id: 'network-scan',
        name: 'Network Device Scan',
        status: 'pending',
        message: 'Probing network for IoT devices...',
        timestamp: new Date()
      },
      {
        id: 'database-query',
        name: 'Database Device Query',
        status: 'pending',
        message: 'Querying device registry...',
        timestamp: new Date()
      },
      {
        id: 'device-correlation',
        name: 'Device Correlation',
        status: 'pending',
        message: 'Correlating device information...',
        timestamp: new Date()
      },
      {
        id: 'activity-monitoring',
        name: 'Activity Monitoring',
        status: 'pending',
        message: 'Monitoring device activity...',
        timestamp: new Date()
      }
    ];
    setSteps(initialSteps);
  };

  useEffect(() => {
    if (open) {
      initializeSteps();
      runDeviceDiscovery();
    }
  }, [open]);

  const updateStep = (stepId: string, status: ProcessStep['status'], message: string, details?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message, details, timestamp: new Date() }
        : step
    ));
  };

  const runDeviceDiscovery = async () => {
    try {
      const devices: DiscoveredDevice[] = [];
      const topics: string[] = [];

      // Step 1: MQTT Topic Discovery
      updateStep('mqtt-topics', 'running', 'Scanning MQTT broker for active topics...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock MQTT topic discovery
      const mockTopics = [
        'sensors/temperature/esp32_001',
        'sensors/humidity/esp32_001', 
        'sensors/temperature/esp32_002',
        'sensors/pressure/esp32_003',
        'devices/status/+',
        'home/livingroom/sensor',
        'iot/garage/door'
      ];
      
      topics.push(...mockTopics);
      setActiveTopics(topics);
      
      // Add MQTT-discovered devices
      const mqttDevices = ['esp32_001', 'esp32_002', 'esp32_003'];
      mqttDevices.forEach((deviceId, index) => {
        devices.push({
          id: deviceId,
          name: `ESP32 Device ${index + 1}`,
          type: 'esp32',
          source: 'mqtt',
          lastActivity: new Date(Date.now() - Math.random() * 300000), // Within last 5 mins
          status: Math.random() > 0.2 ? 'active' : 'inactive',
          metadata: {
            topics: topics.filter(t => t.includes(deviceId)),
            lastMessage: `{"temperature": ${(20 + Math.random() * 15).toFixed(1)}, "humidity": ${(40 + Math.random() * 30).toFixed(1)}}`
          }
        });
      });

      updateStep('mqtt-topics', 'success', `Found ${topics.length} active topics`);

      // Step 2: Network Device Scan
      updateStep('network-scan', 'running', 'Scanning network for IoT devices...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock network device discovery
      const networkDevices = [
        { ip: '192.168.1.100', type: 'esp32' },
        { ip: '192.168.1.101', type: 'esp32' },
        { ip: '192.168.1.150', type: 'custom' },
        { ip: '192.168.1.200', type: 'unknown' }
      ];
      
      networkDevices.forEach((netDevice, index) => {
        const existingDevice = devices.find(d => d.name.includes(`${index + 1}`));
        if (existingDevice) {
          // Update existing device with network info
          existingDevice.metadata = {
            ...existingDevice.metadata,
            ip: netDevice.ip,
            firmware: `v${(Math.random() * 3 + 1).toFixed(1)}`
          };
        } else {
          // Add new network-only device
          devices.push({
            id: `net_device_${index}`,
            name: `Network Device ${netDevice.ip}`,
            type: netDevice.type as any,
            source: 'network',
            lastActivity: new Date(Date.now() - Math.random() * 600000), // Within last 10 mins
            status: Math.random() > 0.3 ? 'active' : 'inactive',
            metadata: {
              ip: netDevice.ip,
              firmware: `v${(Math.random() * 3 + 1).toFixed(1)}`
            }
          });
        }
      });

      updateStep('network-scan', 'success', `Scanned network - ${networkDevices.length} devices found`);

      // Step 3: Database Device Query
      updateStep('database-query', 'running', 'Querying device registry database...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock database devices
      const dbDevices = [
        { id: 'custom_001', name: 'Living Room Sensor', type: 'custom' },
        { id: 'custom_002', name: 'Garage Monitor', type: 'custom' },
        { id: 'esp32_001', name: 'Temperature Sensor A', type: 'esp32' } // Overlap with MQTT
      ];
      
      dbDevices.forEach(dbDevice => {
        const existingDevice = devices.find(d => d.id === dbDevice.id);
        if (existingDevice) {
          // Update existing device with DB info
          existingDevice.name = dbDevice.name;
          existingDevice.source = 'mqtt'; // Keep MQTT as primary source
        } else {
          // Add new DB-only device
          devices.push({
            id: dbDevice.id,
            name: dbDevice.name,
            type: dbDevice.type as any,
            source: 'database',
            lastActivity: new Date(Date.now() - Math.random() * 1800000), // Within last 30 mins
            status: Math.random() > 0.4 ? 'active' : 'inactive'
          });
        }
      });

      updateStep('database-query', 'success', `Retrieved ${dbDevices.length} registered devices`);

      // Step 4: Device Correlation
      updateStep('device-correlation', 'running', 'Correlating device information across sources...');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setDiscoveredDevices(devices);
      updateStep('device-correlation', 'success', `Correlated ${devices.length} unique devices`);

      // Step 5: Activity Monitoring
      updateStep('activity-monitoring', 'running', 'Starting real-time activity monitoring...');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const currentStats: MonitoringStats = {
        totalDevices: devices.length,
        activeDevices: devices.filter(d => d.status === 'active').length,
        mqttTopics: topics.length,
        networkDevices: devices.filter(d => d.metadata?.ip).length,
        databaseEntries: devices.filter(d => d.source === 'database' || d.source === 'mqtt').length
      };
      
      setStats(currentStats);
      updateStep('activity-monitoring', 'success', `Monitoring ${currentStats.activeDevices} active devices`);

    } catch (error: any) {
      console.error('Device discovery error:', error);
      updateStep('mqtt-topics', 'error', `Discovery failed: ${error.message}`);
    }
  };

  const retryDiscovery = async () => {
    setIsRetrying(true);
    setDiscoveredDevices([]);
    setActiveTopics([]);
    setStats({
      totalDevices: 0,
      activeDevices: 0,
      mqttTopics: 0,
      networkDevices: 0,
      databaseEntries: 0
    });
    initializeSteps();
    await runDeviceDiscovery();
    setIsRetrying(false);
  };

  const getStatusIcon = (status: ProcessStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'running':
        return <LinearProgress sx={{ width: 20, height: 20, borderRadius: 10 }} />;
      case 'pending':
      default:
        return <RadioButtonUnchecked color="disabled" />;
    }
  };

  const getStatusColor = (status: ProcessStep['status']) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'running': return 'warning';
      case 'pending': return 'default';
    }
  };

  const getDeviceTypeIcon = (type: DiscoveredDevice['type']) => {
    switch (type) {
      case 'esp32':
        return '🔬';
      case 'custom':
        return '⚙️';
      case 'mqtt':
        return '📡';
      default:
        return '❓';
    }
  };

  const overallStatus = steps.every(s => s.status === 'success') ? 'success' :
                       steps.some(s => s.status === 'error') ? 'error' :
                       steps.some(s => s.status === 'running') ? 'running' : 'pending';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Search />
          <Typography variant="h6">Device Discovery & Monitoring Process</Typography>
          <Chip 
            label={overallStatus.toUpperCase()} 
            color={overallStatus === 'success' ? 'success' : overallStatus === 'error' ? 'error' : 'warning'}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert 
          severity={overallStatus === 'success' ? 'success' : overallStatus === 'error' ? 'error' : 'info'}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            {overallStatus === 'success' 
              ? `✅ Discovery complete - Found ${stats.totalDevices} devices (${stats.activeDevices} active)`
              : overallStatus === 'error'
              ? '❌ Device discovery issues detected - Check network and MQTT connectivity'
              : '🔄 Discovering devices across all sources...'
            }
          </Typography>
        </Alert>

        {/* Statistics Cards */}
        {overallStatus === 'success' && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" color="primary">{stats.totalDevices}</Typography>
                <Typography variant="caption">Total Devices</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" color="success.main">{stats.activeDevices}</Typography>
                <Typography variant="caption">Active Now</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" color="info.main">{stats.mqttTopics}</Typography>
                <Typography variant="caption">MQTT Topics</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" color="secondary.main">{stats.networkDevices}</Typography>
                <Typography variant="caption">Network Devices</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" color="warning.main">{stats.databaseEntries}</Typography>
                <Typography variant="caption">DB Entries</Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        <Box display="flex" gap={3}>
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>Discovery Steps:</Typography>
            
            <List>
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getStatusIcon(step.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">{step.name}</Typography>
                          <Chip 
                            label={step.status.toUpperCase()} 
                            size="small" 
                            color={getStatusColor(step.status) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">{step.message}</Typography>
                          {step.details && (
                            <Typography variant="caption" color="text.secondary">
                              {step.details}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            {step.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < steps.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Box>

          <Box flex={1.5}>
            {discoveredDevices.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>Discovered Devices:</Typography>
                <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 1 }}>
                  <Grid container spacing={1}>
                    {discoveredDevices.map((device, index) => (
                      <Grid item xs={12} key={index}>
                        <Card 
                          sx={{ 
                            borderLeft: `4px solid ${
                              device.status === 'active' ? '#4caf50' : 
                              device.status === 'inactive' ? '#ff9800' : '#f44336'
                            }`,
                            mb: 1
                          }}
                        >
                          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Box flex={1}>
                                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <span>{getDeviceTypeIcon(device.type)}</span>
                                  {device.name}
                                  <Badge 
                                    badgeContent={device.source[0].toUpperCase()} 
                                    color={device.source === 'mqtt' ? 'primary' : device.source === 'network' ? 'secondary' : 'default'}
                                  />
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  ID: {device.id} • Type: {device.type}
                                </Typography>
                                {device.metadata?.ip && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    IP: {device.metadata.ip} • FW: {device.metadata.firmware}
                                  </Typography>
                                )}
                                {device.metadata?.topics && device.metadata.topics.length > 0 && (
                                  <Box sx={{ mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">Topics: </Typography>
                                    {device.metadata.topics.slice(0, 2).map((topic, i) => (
                                      <Chip key={i} label={topic} size="small" variant="outlined" sx={{ mr: 0.5, height: 16 }} />
                                    ))}
                                    {device.metadata.topics.length > 2 && (
                                      <Typography variant="caption" color="text.secondary">
                                        +{device.metadata.topics.length - 2} more
                                      </Typography>
                                    )}
                                  </Box>
                                )}
                              </Box>
                              <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                                <Chip 
                                  label={device.status.toUpperCase()} 
                                  size="small" 
                                  color={
                                    device.status === 'active' ? 'success' : 
                                    device.status === 'inactive' ? 'warning' : 'error'
                                  }
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(device.lastActivity).toLocaleTimeString()}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Box>
            )}

            {discoveredDevices.length === 0 && overallStatus !== 'pending' && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DevicesOther sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  No devices discovered yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Make sure MQTT broker is running and devices are connected
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={retryDiscovery}
          disabled={isRetrying}
          startIcon={<Refresh />}
        >
          {isRetrying ? 'Discovering Devices...' : 'Retry Discovery'}
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};