import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  ElectricBolt,
  Lightbulb,
  AcUnit,
  Kitchen,
  Tv,
  Router,
  PowerSettingsNew
} from '@mui/icons-material';
import { supabase } from '../config/supabase';

interface DeviceManagerProps {
  open: boolean;
  onClose: () => void;
  onDeviceAdded: () => void;
}

interface CustomDevice {
  id?: string;
  device_id: string;
  name: string;
  description: string;
  gpio_pin: number;
  device_type: string;
  power_rating: number; // in watts
  created_at?: string;
}

const deviceTypes = [
  { value: 'light', label: 'Light/Bulb', icon: <Lightbulb />, defaultPower: 15 },
  { value: 'fan', label: 'Fan', icon: <AcUnit />, defaultPower: 75 },
  { value: 'ac', label: 'Air Conditioner', icon: <AcUnit />, defaultPower: 1500 },
  { value: 'appliance', label: 'Kitchen Appliance', icon: <Kitchen />, defaultPower: 800 },
  { value: 'tv', label: 'TV/Entertainment', icon: <Tv />, defaultPower: 150 },
  { value: 'router', label: 'Network Device', icon: <Router />, defaultPower: 12 },
  { value: 'other', label: 'Other Device', icon: <ElectricBolt />, defaultPower: 50 }
];

export const DeviceManager: React.FC<DeviceManagerProps> = ({ open, onClose, onDeviceAdded }) => {
  const [devices, setDevices] = useState<CustomDevice[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newDevice, setNewDevice] = useState<Partial<CustomDevice>>({
    device_id: '',
    name: '',
    description: '',
    gpio_pin: 2,
    device_type: 'light',
    power_rating: 15
  });

  useEffect(() => {
    if (open) {
      fetchDevices();
    }
  }, [open]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    }
    setLoading(false);
  };

  const handleAddDevice = async () => {
    if (!newDevice.device_id || !newDevice.name || !newDevice.gpio_pin) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('custom_devices')
        .insert([{
          device_id: newDevice.device_id,
          name: newDevice.name,
          description: newDevice.description || '',
          gpio_pin: newDevice.gpio_pin,
          device_type: newDevice.device_type,
          power_rating: newDevice.power_rating
        }]);

      if (error) throw error;

      await fetchDevices();
      setIsAddingNew(false);
      setNewDevice({
        device_id: '',
        name: '',
        description: '',
        gpio_pin: 2,
        device_type: 'light',
        power_rating: 15
      });
      onDeviceAdded();
      setError(null);
    } catch (err) {
      console.error('Error adding device:', err);
      setError(err instanceof Error ? err.message : 'Failed to add device');
    }
    setLoading(false);
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('custom_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;
      await fetchDevices();
      onDeviceAdded();
    } catch (err) {
      console.error('Error deleting device:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete device');
    }
    setLoading(false);
  };

  const handleDeviceTypeChange = (type: string) => {
    const deviceType = deviceTypes.find(dt => dt.value === type);
    setNewDevice(prev => ({
      ...prev,
      device_type: type,
      power_rating: deviceType?.defaultPower || 50
    }));
  };

  const generateDeviceId = () => {
    const randomId = Math.random().toString(36).substr(2, 16);
    setNewDevice(prev => ({ ...prev, device_id: randomId }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PowerSettingsNew color="primary" />
          Device Manager
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Add New Device Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Add New Device</Typography>
              {!isAddingNew && (
                <Button
                  startIcon={<Add />}
                  variant="contained"
                  onClick={() => setIsAddingNew(true)}
                >
                  Add Device
                </Button>
              )}
            </Box>

            {isAddingNew && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Device Name *"
                    fullWidth
                    value={newDevice.name}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Living Room Light, Kitchen Fan"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Device Type *</InputLabel>
                    <Select
                      value={newDevice.device_type}
                      onChange={(e) => handleDeviceTypeChange(e.target.value)}
                      label="Device Type *"
                    >
                      {deviceTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {type.icon}
                            {type.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={2}
                    value={newDevice.description}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., 15V LED Light connected to relay 1, Controls bedroom ceiling fan"
                  />
                </Grid>

                <Grid item xs={6} sm={4}>
                  <TextField
                    label="GPIO Pin *"
                    type="number"
                    fullWidth
                    value={newDevice.gpio_pin}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, gpio_pin: parseInt(e.target.value) }))}
                    inputProps={{ min: 1, max: 40 }}
                  />
                </Grid>

                <Grid item xs={6} sm={4}>
                  <TextField
                    label="Power Rating (Watts)"
                    type="number"
                    fullWidth
                    value={newDevice.power_rating}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, power_rating: parseInt(e.target.value) }))}
                    inputProps={{ min: 1, max: 5000 }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box display="flex" gap={1}>
                    <TextField
                      label="Device ID *"
                      fullWidth
                      value={newDevice.device_id}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, device_id: e.target.value }))}
                      placeholder="Enter custom ID or generate"
                    />
                    <Button onClick={generateDeviceId} variant="outlined" size="small">
                      Generate
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" gap={1} justifyContent="flex-end">
                    <Button
                      startIcon={<Cancel />}
                      onClick={() => {
                        setIsAddingNew(false);
                        setError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      startIcon={<Save />}
                      variant="contained"
                      onClick={handleAddDevice}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add Device'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Existing Devices List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Registered Devices ({devices.length})
            </Typography>

            {devices.length === 0 ? (
              <Alert severity="info">
                No custom devices registered yet. Add your first device above!
              </Alert>
            ) : (
              <List>
                {devices.map((device, index) => (
                  <React.Fragment key={device.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {deviceTypes.find(dt => dt.value === device.device_type)?.icon}
                            <strong>{device.name}</strong>
                            <Chip label={device.device_type} size="small" variant="outlined" />
                            <Chip label={`${device.power_rating}W`} size="small" color="primary" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              ID: {device.device_id} | GPIO Pin: {device.gpio_pin}
                            </Typography>
                            {device.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {device.description}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteDevice(device.id!)}
                          disabled={loading}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < devices.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceManager;