import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Box,
  Typography,
  Divider,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { config } from '../config';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const [tabValue, setTabValue] = React.useState(0);
  
  // MQTT Settings
  const [mqttBroker, setMqttBroker] = React.useState(config.mqtt.broker);
  const [mqttPort, setMqttPort] = React.useState(config.mqtt.port.toString());
  const [mqttUsername, setMqttUsername] = React.useState(config.mqtt.username);
  const [mqttPassword, setMqttPassword] = React.useState(config.mqtt.password);
  
  // Supabase Settings
  const [supabaseUrl, setSupabaseUrl] = React.useState(config.supabase.url);
  const [anonKey, setAnonKey] = React.useState(config.supabase.anonKey);
  
  // ESP32 Settings
  const [esp32Url, setEsp32Url] = React.useState(config.esp32.baseUrl);

  const save = () => {
    const overrides = {
      mqtt: {
        broker: mqttBroker,
        port: parseInt(mqttPort),
        username: mqttUsername,
        password: mqttPassword
      },
      supabase: { url: supabaseUrl, anonKey },
      esp32: { baseUrl: esp32Url }
    };
    localStorage.setItem('config_overrides', JSON.stringify(overrides));
    // reload to apply overrides (simple approach)
    window.location.reload();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Dashboard Settings</DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label="MQTT Settings" />
          <Tab label="Supabase" />
          <Tab label="ESP32" />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>MQTT Connection Issues?</strong><br/>
              Update your MQTT broker credentials here. Your ESP32 should use the same settings.
            </Alert>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField 
                label="MQTT Broker" 
                value={mqttBroker} 
                onChange={e => setMqttBroker(e.target.value)} 
                fullWidth
                helperText="e.g. your-mqtt-broker.com"
              />
              <TextField 
                label="MQTT Port" 
                value={mqttPort} 
                onChange={e => setMqttPort(e.target.value)} 
                fullWidth
                type="number"
                helperText="Usually 8883 for SSL or 1883 for non-SSL"
              />
              <TextField 
                label="MQTT Username" 
                value={mqttUsername} 
                onChange={e => setMqttUsername(e.target.value)} 
                fullWidth
                helperText="Your MQTT username"
              />
              <TextField 
                label="MQTT Password" 
                value={mqttPassword} 
                onChange={e => setMqttPassword(e.target.value)} 
                fullWidth
                type="password"
                helperText="Your MQTT password"
              />
            </Box>
          </Box>
        )}

        {tabValue === 1 && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Supabase Database</strong><br/>
              Configure your Supabase connection for historical data storage.
            </Alert>
            <TextField 
              label="Supabase URL" 
              value={supabaseUrl} 
              onChange={e => setSupabaseUrl(e.target.value)} 
              fullWidth 
              helperText="https://your-project.supabase.co"
            />
            <TextField 
              label="Supabase ANON Key" 
              value={anonKey} 
              onChange={e => setAnonKey(e.target.value)} 
              fullWidth
              multiline
              rows={3}
              helperText="Your Supabase anon/public key"
            />
          </Box>
        )}

        {tabValue === 2 && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>ESP32 Direct Control</strong><br/>
              Optional: Direct HTTP connection to your ESP32 for device control.
            </Alert>
            <TextField 
              label="ESP32 Base URL" 
              value={esp32Url} 
              onChange={e => setEsp32Url(e.target.value)} 
              fullWidth
              helperText="http://192.168.1.100 (your ESP32 IP)"
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} color="primary">
          Save & Reload Dashboard
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
