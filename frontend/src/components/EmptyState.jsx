import React from 'react';
import { Box, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const EmptyState = ({ title = "No Data Found", message = "There is nothing to display right now.", icon: Icon = InfoOutlinedIcon }) => {
  return (
    <Box 
      sx={{ 
        py: 10, 
        textAlign: 'center', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2,
        opacity: 0.6
      }}
    >
      <Icon sx={{ fontSize: 64, color: '#94a3b8' }} />
      <Box>
        <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          {message}
        </Typography>
      </Box>
    </Box>
  );
};

export default EmptyState;
