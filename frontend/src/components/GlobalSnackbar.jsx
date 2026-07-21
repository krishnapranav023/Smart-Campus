import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useApp } from '../context/AppContext';

const GlobalSnackbar = () => {
  const { snackbar, hideSnackbar } = useApp();

  return (
    <Snackbar 
      open={snackbar.open} 
      autoHideDuration={4000} 
      onClose={hideSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={hideSnackbar} 
        severity={snackbar.severity || 'success'} 
        variant="filled" 
        sx={{ 
          width: '100%', 
          borderRadius: 2,
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;
