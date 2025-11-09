import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  Grid,
  Box,
  Button,
  Alert,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Wifi,
  Router,
  Refresh,
  Settings,
  NetworkCheck,
  Cable,
  Memory,
  Speed
} from '@mui/icons-material';

interface ESP32Device {
  deviceId: string;
  gpio: number;
  state: 'ON' | 'OFF';
}

interface ESP32Info {
  success: boolean;
  ip: string;
  mac: string;
  ssid: string;
  devices: ESP32Device[];
}

interface ESP32ControllerProps {
  esp32IP?: string;
}

export const ESP32Controller: React.FC<ESP32ControllerProps> = ({ esp32IP }) => {
  const [devices, setDevices] = useState<ESP32Device[]>([]);
  const [esp32Info, setESP32Info] = useState<ESP32Info | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [customIP, setCustomIP] = useState(esp32IP || 'http://192.168.1.100');

  const currentIP = customIP || esp32IP || 'http://192.168.1.100';

  useEffect(() => {
    if (currentIP) {
      fetchESP32Info();
      const interval = setInterval(fetchESP32Info, 5000); // Auto-refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [currentIP]);

  const fetchESP32Info = async () => {
    if (!currentIP) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${currentIP}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ESP32Info = await response.json();
      
      if (data.success && data.devices) {
        setESP32Info(data);
        setDevices(data.devices);
        setConnected(true);
        setError(null);
      } else {
        throw new Error('Invalid response from ESP32');
      }
    } catch (err: any) {
      console.error('ESP32 connection error:', err);
      let errorMessage = 'Cannot connect to ESP32';
      
      if (err.name === 'AbortError' || err.message.includes('timeout')) {
        errorMessage = 'Connection timeout - ESP32 not responding';
      } else if (err.message.includes('fetch')) {
        errorMessage = 'Network error - Check if ESP32 IP is correct';
      } else if (err.message.includes('404')) {
        errorMessage = 'ESP32 found but /info endpoint not available';
      }
      
      setError(`${errorMessage}: ${currentIP}`);
      setConnected(false);
      setDevices([]);
      setESP32Info(null);
    } finally {
      setLoading(false);
    }
  };

  const controlDevice = async (deviceId: string, newState: 'ON' | 'OFF') => {
    try {
      const response = await fetch(`${currentIP}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId,
          state: newState
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Control failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state immediately
        setDevices(prev => 
          prev.map(device => 
            device.deviceId === deviceId 
              ? { ...device, state: newState }
              : device
          )
        );
      } else {
        throw new Error(result.message || 'Control command failed');
      }
    } catch (err: any) {
      console.error('Device control error:', err);
      setError(`Failed to control device: ${err.message}`);
    }
  };

  const handleDeviceToggle = (deviceId: string, currentState: 'ON' | 'OFF') => {
    const newState = currentState === 'ON' ? 'OFF' : 'ON';
    controlDevice(deviceId, newState);
  };

  const getDeviceName = (deviceId: string): string => {
    // Map your actual device IDs to friendly names
    const deviceNames: { [key: string]: string } = {
      '68e9d693ba649e246c0af03d': 'Living Room Light',
      'YOUR_SECOND_DEVICE_ID': 'Bedroom Fan',
      // Add more as needed
    };
    
    return deviceNames[deviceId] || `Device ${deviceId.slice(-4)}`;
  };

  const getGPIOName = (gpio: number): string => {
    const gpioMap: { [key: number]: string } = {
      23: 'Relay 1',
      22: 'Relay 2',
      21: 'Relay 3',
      19: 'Relay 4',
      2: 'Built-in LED',
      // Add more based on your setup
    };
    
    return gpioMap[gpio] || `GPIO ${gpio}`;
  };

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Router color="primary" />
              <Typography variant="h6">
                ESP32 Controller
              </Typography>
              <Chip 
                icon={connected ? <Wifi /> : <NetworkCheck />}
                label={connected ? 'Connected' : 'Disconnected'}
                color={connected ? 'success' : 'error'}
                size="small"
              />
            </Box>
            
            <Box display="flex" gap={1}>
              <IconButton 
                onClick={() => setConfigOpen(true)}
                size="small"
                title="Configure IP"
              >
                <Settings />
              </IconButton>
              <IconButton 
                onClick={fetchESP32Info}
                disabled={loading}
                size="small"
                title="Refresh"
              >
                {loading ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>Connection Error:</strong> {error}
              <br />
              <small>Make sure ESP32 is connected to WiFi and accessible at: {currentIP}</small>
            </Alert>
          )}

          {esp32Info && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>ESP32 Info:</strong><br />
              IP: {esp32Info.ip} | MAC: {esp32Info.mac} | WiFi: {esp32Info.ssid}
            </Alert>
          )}

          {connected && devices.length > 0 ? (
            <Grid container spacing={2}>
              {devices.map((device) => (
                <Grid item xs={12} sm={6} md={4} key={device.deviceId}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {getDeviceName(device.deviceId)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getGPIOName(device.gpio)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {device.deviceId.slice(-8)}...
                          </Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <Switch
                            checked={device.state === 'ON'}
                            onChange={() => handleDeviceToggle(device.deviceId, device.state)}
                            color="primary"
                          />
                          <Chip 
                            label={device.state}
                            size="small"
                            color={device.state === 'ON' ? 'success' : 'default'}
                            sx={{ mt: 1, minWidth: 50 }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : connected ? (
            <Alert severity="warning">
              ESP32 connected but no devices found. Check your ESP32 configuration.
            </Alert>
          ) : (
            <Alert severity="info">
              <strong>ESP32 Not Connected</strong><br />
              1. Make sure your ESP32 is powered on and connected to WiFi<br />
              2. Check that the IP address is correct: {currentIP}<br />
              3. Ensure your ESP32 and computer are on the same network<br />
              4. Try the configuration button above to set a different IP
            </Alert>
          )}

          {connected && (
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date().toLocaleTimeString()} | 
                Auto-refreshing every 5 seconds
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* IP Configuration Dialog */}
      <Dialog open={configOpen} onClose={() => setConfigOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ESP32 Configuration</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="ESP32 IP Address"
            fullWidth
            variant="outlined"
            value={customIP}
            onChange={(e) => setCustomIP(e.target.value)}
            placeholder="http://192.168.1.100"
            helperText="Enter the IP address shown on your ESP32 serial monitor"
          />

          <Box mt={2} mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Common ESP32 IP Addresses (try these):
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {[
                'http://192.168.1.100',
                'http://192.168.1.101', 
                'http://192.168.1.102',
                'http://192.168.0.100',
                'http://192.168.4.1'
              ].map((ip) => (
                <Button
                  key={ip}
                  size="small"
                  variant={customIP === ip ? 'contained' : 'outlined'}
                  onClick={() => setCustomIP(ip)}
                  sx={{ mb: 1 }}
                >
                  {ip.replace('http://', '')}
                </Button>
              ))}
            </Box>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Your ESP32 is working!</strong><br />
            ✅ SinricPro commands working<br />
            ✅ MQTT publishing working<br />
            ✅ Supabase events saving<br />
            <br />
            <strong>To connect dashboard:</strong><br />
            1. Check Arduino Serial Monitor startup<br />
            2. Look for "IP: 192.168.x.x" message<br />
            3. Try the common IPs above or enter the exact IP
          </Alert>

          <Alert severity="warning" sx={{ mt: 1 }}>
            <strong>From your ESP32 logs:</strong><br />
            Device: 68e9d693ba649e246c0af03d (GPIO 23)<br />
            MQTT: Publishing to sinric/.../status<br />
            State: Responding to Alexa commands ✅
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              setConfigOpen(false);
              fetchESP32Info();
            }} 
            variant="contained"
          >
            Connect
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ESP32Controller;