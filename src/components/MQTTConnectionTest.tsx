import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Chip
} from '@mui/material';
import mqtt from 'mqtt';
import { config } from '../config';

export const MQTTConnectionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    details?: any;
  }>>([]);
  
  const [testing, setTesting] = useState(false);
  const [useSSL, setUseSSL] = useState(true);

  const addResult = (test: string, status: 'pending' | 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => [...prev, { test, status, message, details }]);
  };

  const runConnectionTests = async () => {
    setTesting(true);
    setTestResults([]);

    // Test 1: Basic connectivity
    addResult('DNS Resolution', 'pending', 'Checking if broker domain resolves...');
    
    try {
      // Test different connection methods
      const testConfigs = [
        {
          name: 'WSS (SSL) Connection',
          url: `wss://${config.mqtt.broker}:${config.mqtt.port}/mqtt`,
          options: {
            username: config.mqtt.username,
            password: config.mqtt.password,
            clientId: 'test_' + Math.random().toString(16).substr(2, 8),
            connectTimeout: 10000,
            rejectUnauthorized: false
          }
        },
        {
          name: 'WS (Non-SSL) Connection', 
          url: `ws://${config.mqtt.broker}:1883/mqtt`,
          options: {
            username: config.mqtt.username,
            password: config.mqtt.password,
            clientId: 'test_' + Math.random().toString(16).substr(2, 8),
            connectTimeout: 10000
          }
        }
      ];

      for (const testConfig of testConfigs) {
        addResult(testConfig.name, 'pending', 'Attempting connection...');
        
        try {
          const testClient = mqtt.connect(testConfig.url, testConfig.options);
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              testClient.end(true);
              reject(new Error('Connection timeout (10s)'));
            }, 10000);

            testClient.on('connect', () => {
              clearTimeout(timeout);
              addResult(testConfig.name, 'success', 'Connected successfully!', {
                broker: config.mqtt.broker,
                port: config.mqtt.port,
                username: config.mqtt.username
              });
              testClient.end();
              resolve();
            });

            testClient.on('error', (error) => {
              clearTimeout(timeout);
              addResult(testConfig.name, 'error', `Connection failed: ${error.message}`, {
                error: error.message,
                code: (error as any).code,
                errno: (error as any).errno
              });
              reject(error);
            });

            testClient.on('offline', () => {
              addResult(testConfig.name, 'error', 'Client went offline immediately');
            });

            testClient.on('close', () => {
              addResult(testConfig.name, 'error', 'Connection closed by server');
            });
          });
          
          break; // If one works, stop testing
        } catch (error: any) {
          console.error(`${testConfig.name} failed:`, error);
          // Continue to next test
        }
      }
    } catch (error: any) {
      addResult('Connection Test', 'error', `Failed: ${error.message}`);
    }

    setTesting(false);
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          MQTT Connection Diagnostics
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Current Configuration:</strong><br/>
          Broker: {config.mqtt.broker}<br/>
          Port: {config.mqtt.port}<br/>
          Username: {config.mqtt.username}<br/>
          Password: {config.mqtt.password ? '***' : 'Not set'}
        </Alert>

        <Box display="flex" gap={2} alignItems="center" mb={2}>
          <Button 
            variant="contained" 
            onClick={runConnectionTests} 
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test MQTT Connection'}
          </Button>
          
          <FormControlLabel
            control={
              <Switch
                checked={useSSL}
                onChange={(e) => setUseSSL(e.target.checked)}
              />
            }
            label="Try SSL/TLS"
          />
        </Box>

        {testResults.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Test Results:
            </Typography>
            {testResults.map((result, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Box display="flex" gap={1} alignItems="center">
                  <Chip 
                    label={result.status} 
                    color={
                      result.status === 'success' ? 'success' :
                      result.status === 'error' ? 'error' : 'default'
                    }
                    size="small"
                  />
                  <Typography variant="body2">
                    <strong>{result.test}:</strong> {result.message}
                  </Typography>
                </Box>
                {result.details && (
                  <Box sx={{ ml: 3, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {JSON.stringify(result.details, null, 2)}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Common Issues:</strong><br/>
          • Wrong username/password<br/>
          • SSL certificate problems<br/>
          • Firewall blocking WebSocket connections<br/>
          • MQTT broker not configured for WebSocket<br/>
          • Browser blocking insecure connections
        </Alert>

        <Alert severity="info" sx={{ mt: 1 }}>
          <strong>Solutions to try:</strong><br/>
          1. Update MQTT credentials in Settings<br/>
          2. Try different port (1883 for non-SSL, 8883 for SSL)<br/>
          3. Check if your MQTT broker supports WebSockets<br/>
          4. Contact your MQTT provider for WebSocket endpoint
        </Alert>
      </CardContent>
    </Card>
  );
};

export default MQTTConnectionTest;