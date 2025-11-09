import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Alert
} from '@mui/material';
import mqtt from 'mqtt';
import { config } from '../config';

interface MQTTDebuggerProps {
  deviceId?: string;
}

export const MQTTDebugger: React.FC<MQTTDebuggerProps> = ({ deviceId }) => {
  const [messages, setMessages] = useState<Array<{
    timestamp: string;
    topic: string;
    message: string;
    type: 'received' | 'sent' | 'status';
  }>>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const addMessage = (type: 'received' | 'sent' | 'status', topic: string, message: string) => {
    const newMessage = {
      timestamp: new Date().toLocaleTimeString(),
      topic,
      message,
      type
    };
    setMessages(prev => [newMessage, ...prev].slice(0, 50)); // Keep last 50 messages
  };

  useEffect(() => {
    setConnectionStatus('connecting');
    addMessage('status', 'system', `Connecting to MQTT: ${config.mqtt.broker}:${config.mqtt.port}`);

    const client = mqtt.connect(`wss://${config.mqtt.broker}:${config.mqtt.port}/mqtt`, {
      username: config.mqtt.username,
      password: config.mqtt.password,
      clientId: config.mqtt.clientId + '_debug',
    });

    client.on('connect', () => {
      setConnectionStatus('connected');
      addMessage('status', 'system', '✅ Connected to MQTT broker');
      
      // Subscribe to all SinricPro topics
      client.subscribe('sinric/+/status');
      addMessage('status', 'system', '📡 Subscribed to: sinric/+/status');
      
      if (deviceId) {
        client.subscribe(`sinric/${deviceId}/status`);
        addMessage('status', 'system', `📡 Subscribed to specific device: sinric/${deviceId}/status`);
      }
    });

    client.on('message', (topic, message) => {
      const messageStr = message.toString();
      addMessage('received', topic, messageStr);
    });

    client.on('error', (error) => {
      setConnectionStatus('error');
      addMessage('status', 'error', `❌ MQTT Error: ${error.message}`);
    });

    client.on('offline', () => {
      setConnectionStatus('disconnected');
      addMessage('status', 'system', '📴 MQTT Client offline');
    });

    client.on('reconnect', () => {
      setConnectionStatus('connecting');
      addMessage('status', 'system', '🔄 MQTT Reconnecting...');
    });

    return () => {
      client.end();
    };
  }, [deviceId]);

  const clearMessages = () => {
    setMessages([]);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">MQTT Debug Console</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Chip 
            label={connectionStatus.toUpperCase()} 
            color={getStatusColor()}
            size="small"
          />
          <Button size="small" onClick={clearMessages}>
            Clear
          </Button>
        </Box>
      </Box>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Your ESP32 is sending:</strong><br/>
        Topic: sinric/68e9d693ba649e246c0af03d/status<br/>
        Message: "ON" or "OFF"<br/>
        <strong>Check below if messages are being received...</strong>
      </Alert>

      <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: '#1e1e1e', borderRadius: 1 }}>
        {messages.length === 0 ? (
          <ListItem>
            <ListItemText 
              primary="No messages yet..." 
              secondary="Turn your ESP32 device ON/OFF to see MQTT messages here"
              primaryTypographyProps={{ color: '#888' }}
              secondaryTypographyProps={{ color: '#666' }}
            />
          </ListItem>
        ) : (
          messages.map((msg, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemText
                primary={
                  <Box display="flex" gap={1} alignItems="center">
                    <Typography 
                      component="span" 
                      sx={{ 
                        color: msg.type === 'received' ? '#4caf50' : 
                               msg.type === 'sent' ? '#2196f3' : '#ff9800',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem'
                      }}
                    >
                      [{msg.timestamp}]
                    </Typography>
                    <Chip 
                      label={msg.type} 
                      size="small" 
                      color={msg.type === 'received' ? 'success' : 
                             msg.type === 'sent' ? 'primary' : 'warning'}
                    />
                    <Typography 
                      component="span" 
                      sx={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#fff' }}
                    >
                      {msg.topic}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography 
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.85rem', 
                      color: '#ccc',
                      mt: 0.5
                    }}
                  >
                    "{msg.message}"
                  </Typography>
                }
              />
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
};

export default MQTTDebugger;