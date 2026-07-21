import React from 'react';
import { Dialog, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

const DeleteConfirmDialog = ({ open, onClose, onConfirm, itemName }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '14px', p: 1, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', backgroundColor: 'background.paper' } }}>
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: 'rgba(239,68,68,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mx: 'auto', mb: 2
        }}>
          <WarningAmberRoundedIcon sx={{ fontSize: 28, color: '#ef4444' }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary', mb: 1 }}>
          Delete Confirmation
        </Typography>
        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.5 }}>
          Are you sure you want to delete{' '}
          <Box component="strong" sx={{ color: 'text.primary' }}>"{itemName}"</Box>?
          {' '}This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            px: 3, py: 1, borderRadius: '8px', textTransform: 'none', fontWeight: 600,
            color: 'text.secondary', borderColor: 'divider',
            '&:hover': { borderColor: 'text.secondary', backgroundColor: 'action.hover' }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            px: 3, py: 1, borderRadius: '8px', textTransform: 'none', fontWeight: 600,
            backgroundColor: '#ef4444',
            '&:hover': { backgroundColor: '#dc2626' },
            boxShadow: '0 2px 8px rgba(239,68,68,0.3)'
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
