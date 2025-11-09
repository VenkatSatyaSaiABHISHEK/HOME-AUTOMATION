import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

export const SupabaseDiagnostic: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testTables = async () => {
    setLoading(true);
    setResults([]);
    setError(null);

    const tests = [
      {
        name: 'Test devices table',
        query: () => supabase.from('devices').select('*').limit(5)
      },
      {
        name: 'Test device_history table',
        query: () => supabase.from('device_history').select('*').limit(5)
      },
      {
        name: 'Check devices table columns',
        query: () => supabase.from('devices').select().limit(1)
      },
      {
        name: 'Check device_history table columns',
        query: () => supabase.from('device_history').select().limit(1)
      }
    ];

    const testResults = [];

    for (const test of tests) {
      try {
        console.log(`Running: ${test.name}`);
        const { data, error, count } = await test.query();
        
        testResults.push({
          name: test.name,
          success: !error,
          data: data,
          error: error?.message,
          count: count,
          columns: data && data.length > 0 ? Object.keys(data[0]) : []
        });
      } catch (err: any) {
        testResults.push({
          name: test.name,
          success: false,
          error: err.message,
          data: null,
          count: 0,
          columns: []
        });
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Supabase Database Diagnostic
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          This will test your Supabase tables and show you the actual structure
        </Alert>

        <Button 
          variant="contained" 
          onClick={testTables} 
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={20} /> : 'Test Database Tables'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {results.map((result, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant="subtitle1" color={result.success ? 'success.main' : 'error.main'}>
              {result.name}: {result.success ? 'SUCCESS' : 'FAILED'}
            </Typography>
            
            {result.error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <strong>Error:</strong> {result.error}
              </Alert>
            )}
            
            {result.columns.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Columns found:</strong> {result.columns.join(', ')}
                </Typography>
              </Box>
            )}
            
            {result.data && result.data.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Sample data:</strong>
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                  <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </Box>
              </Box>
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

export default SupabaseDiagnostic;