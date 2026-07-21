import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, Stack 
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

import api from '../api';
import { useApp } from '../context/AppContext';

const QrScannerConsole = () => {
  const { showSnackbar } = useApp();

  const [qrTokenInput, setQrTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleQrCheckIn = async (e) => {
    e.preventDefault();
    if (!qrTokenInput.trim()) {
      showSnackbar('Please enter a QR pass token', 'warning');
      return;
    }
    const match = qrTokenInput.match(/^REG-(\d+)-(\d+)-(\d+)$/);
    if (!match) {
      showSnackbar('Invalid QR Pass Token format (Expected format: REG-id-eventId-userId)', 'error');
      return;
    }

    const regId = match[1];
    setVerifying(true);
    try {
      await api.put(`/events/0/registrations/${regId}`, { status: 'ATTENDED' });
      showSnackbar('🎯 Attendance marked successfully! Student checked in.');
      setQrTokenInput('');
    } catch (err) {
      showSnackbar('Check-in failed. Registration record not found.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <QrCodeScannerIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">QR Attendance Check-In</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Verify digital student entry passes to update global registration attendance in real-time.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5 }}>Webcam Pass Token Simulator</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Students receive entry passes containing unique tokens once their registration is approved. Type or paste the token code to check them in.
            </Typography>
            <form onSubmit={handleQrCheckIn}>
              <Stack spacing={2.5}>
                <TextField 
                  label="Enter QR Pass Token" 
                  placeholder="e.g. REG-12-100-340" 
                  fullWidth variant="outlined" size="small"
                  value={qrTokenInput} onChange={(e) => setQrTokenInput(e.target.value)}
                />
                <Button 
                  type="submit" variant="contained" disabled={verifying} startIcon={<QrCodeScannerIcon />}
                  sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', boxShadow: 'none', py: 1 }}
                >
                  {verifying ? 'Verifying...' : 'Verify Pass & Mark Attended'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', height: '100%' }}>
            <QrCodeScannerIcon sx={{ fontSize: 72, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold">Scanner Ready</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, px: 4 }}>
              Active and listening for incoming student QR tokens. Verification instantly updates participant attendance status across the platform.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QrScannerConsole;
