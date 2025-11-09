import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Alert,
  useTheme
} from '@mui/material';
import {
  Settings,
  DeviceHub,
  Cloud,
  Router,
  CheckCircle
} from '@mui/icons-material';

interface DeviceSetupGuideProps {
  open: boolean;
  onClose: () => void;
}

export const DeviceSetupGuide: React.FC<DeviceSetupGuideProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = React.useState(0);

  const steps = [
    {
      label: 'Configure SinricPro Account',
      icon: <Cloud />,
      content: (
        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Set up your SinricPro account and get your API credentials:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <li>Visit <strong>sinric.pro</strong> and create an account</li>
            <li>Create devices in your SinricPro dashboard</li>
            <li>Note down your <Chip label="App Key" size="small" /> and <Chip label="App Secret" size="small" /></li>
            <li>Copy device IDs from your SinricPro devices</li>
          </Box>
        </Box>
      )
    },
    {
      label: 'Set Up ESP32 Device',
      icon: <Router />,
      content: (
        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Program your ESP32 with the SinricPro library:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <li>Install <strong>SinricPro library</strong> in Arduino IDE</li>
            <li>Use your WiFi credentials and SinricPro API keys</li>
            <li>Upload the code to your ESP32</li>
            <li>Ensure your ESP32 is connected to the same network</li>
          </Box>
        </Box>
      )
    },
    {
      label: 'Configure Dashboard',
      icon: <Settings />,
      content: (
        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Update your dashboard configuration:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <li>Set your ESP32 IP address in settings</li>
            <li>Configure MQTT broker settings</li>
            <li>Set up Supabase database (optional)</li>
            <li>Test the connection</li>
          </Box>
        </Box>
      )
    },
    {
      label: 'Verify Connection',
      icon: <CheckCircle />,
      content: (
        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Test your device connection:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <li>Refresh the dashboard to discover devices</li>
            <li>Check device status indicators</li>
            <li>Test ON/OFF controls</li>
            <li>Monitor real-time updates</li>
          </Box>
          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>Success!</strong> Your devices should now appear on the dashboard with real-time control.
          </Alert>
        </Box>
      )
    }
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(45deg, rgba(0,229,255,0.1), rgba(255,64,129,0.1))'
          : 'linear-gradient(45deg, rgba(33,150,243,0.1), rgba(156,39,176,0.1))'
      }}>
        <DeviceHub sx={{ color: theme.palette.primary.main }} />
        Device Setup Guide
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Follow these steps to connect your IoT devices to the dashboard:
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel 
                icon={step.icon}
                sx={{
                  '& .MuiStepIcon-root': {
                    color: theme.palette.primary.main,
                    '&.Mui-active': {
                      color: theme.palette.secondary.main,
                    },
                    '&.Mui-completed': {
                      color: theme.palette.success.main,
                    }
                  }
                }}
              >
                <Typography variant="h6">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ pb: 2 }}>
                  {step.content}
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={index === steps.length - 1}
                  >
                    {index === steps.length - 1 ? 'Complete' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Setup Complete!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your devices should now be discoverable. Close this guide and refresh the dashboard to see your connected devices.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close Guide
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceSetupGuide;