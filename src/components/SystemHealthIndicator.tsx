import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { 
  CheckCircle, 
  Error, 
  Warning, 
  Info 
} from '@mui/icons-material';

interface SystemHealthIndicatorProps {
  connectedCount: number;
  totalServices: number;
  errorCount: number;
  warningCount: number;
}

export const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({
  connectedCount,
  totalServices,
  errorCount,
  warningCount
}) => {
  const getHealthStatus = () => {
    const percentage = (connectedCount / totalServices) * 100;
    
    if (percentage === 100) return { status: 'excellent', color: 'success', icon: <CheckCircle /> };
    if (percentage >= 75) return { status: 'good', color: 'info', icon: <Info /> };
    if (percentage >= 50) return { status: 'warning', color: 'warning', icon: <Warning /> };
    return { status: 'critical', color: 'error', icon: <Error /> };
  };

  const health = getHealthStatus();
  const percentage = Math.round((connectedCount / totalServices) * 100);

  const getStatusText = () => {
    if (health.status === 'excellent') return 'All Systems Online';
    if (health.status === 'good') return 'Systems Mostly Online';
    if (health.status === 'warning') return 'Some Issues Detected';
    return 'Multiple Issues';
  };

  const getTooltipText = () => {
    const issues = [];
    if (errorCount > 0) issues.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
    if (warningCount > 0) issues.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
    
    return `${connectedCount}/${totalServices} services connected (${percentage}%)${
      issues.length > 0 ? ` - ${issues.join(', ')}` : ''
    }`;
  };

  return (
    <Tooltip title={getTooltipText()}>
      <Chip
        icon={health.icon}
        label={getStatusText()}
        color={health.color as any}
        variant="filled"
        size="small"
        sx={{
          fontWeight: 600,
          '& .MuiChip-icon': {
            fontSize: '1rem'
          }
        }}
      />
    </Tooltip>
  );
};

export default SystemHealthIndicator;