import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, Chip, IconButton, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Tooltip, CircularProgress 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import api from '../api'; // Using the new central API config
import useAsync from '../hooks/useAsync';

const Venues = () => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [selectedVenue, setSelectedVenue] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', location: '', capacity: '' });
  const [errors, setErrors] = useState({});

  const fetchVenuesReq = React.useCallback(() => api.get('/venues'), []);
  const { execute: fetchVenues, data: venues = [], loading } = useAsync(fetchVenuesReq);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenModal = (mode, venue = null) => {
    setModalMode(mode);
    setErrors({});
    if (venue) {
      setSelectedVenue(venue);
      setFormData({ name: venue.name, location: venue.location, capacity: venue.capacity });
    } else {
      setSelectedVenue(null);
      setFormData({ name: '', location: '', capacity: '' });
    }
    setModalOpen(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Venue name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.capacity || formData.capacity <= 0) newErrors.capacity = 'Capacity must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (modalMode === 'view') {
      setModalOpen(false);
      return;
    }

    if (!validate()) return;

    try {
      if (modalMode === 'add') {
        await api.post('/venues', formData);
        showSnackbar('Venue added successfully!');
      } else {
        await api.put(`/venues/${selectedVenue.id}`, formData);
        showSnackbar('Venue updated successfully!');
      }
      setModalOpen(false);
      fetchVenues();
    } catch (e) {
      showSnackbar(e.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/venues/${deleteTarget.id}`);
      fetchVenues();
      showSnackbar('Venue deleted successfully!');
    } catch (e) {
      showSnackbar('Delete failed!', 'error');
    }
    setDeleteTarget(null);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary' }}>Venues</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Manage physical spaces for your events</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenModal('add')}
          sx={{ backgroundColor: '#3b82f6', textTransform: 'none', borderRadius: '8px', boxShadow: 'none' }}
        >
          Add Venue
        </Button>
      </Box>

      <Grid container spacing={3}>
        {(venues || []).map((v) => (
          <Grid item xs={12} sm={6} md={4} key={v.id}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '1rem' }}>{v.name}</Typography>
                  <Chip label={`${v.capacity} Pax`} size="small" sx={{ backgroundColor: '#eff6ff', color: '#3b82f6', fontWeight: 600, fontSize: '0.75rem' }} />
                </Box>
                
                <Box sx={{ mb: 2, flexGrow: 1 }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 16 }}/> {v.location}
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid #f3f4f6', pt: 2 }}>
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => handleOpenModal('view', v)} sx={{ color: 'text.secondary' }}><VisibilityIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpenModal('edit', v)} sx={{ color: '#3b82f6' }}><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => setDeleteTarget(v)} sx={{ color: '#ef4444' }}><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
             </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit/View Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {modalMode === 'add' ? 'New Venue' : modalMode === 'edit' ? 'Edit Venue' : 'Venue Details'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="Venue Name"
              placeholder="e.g. Grand Auditorium"
              fullWidth
              disabled={modalMode === 'view'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              autoFocus
            />
            <TextField
              label="Location"
              placeholder="e.g. Main Campus, Building A"
              fullWidth
              disabled={modalMode === 'view'}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              error={!!errors.location}
              helperText={errors.location}
            />
            <TextField
              label="Capacity"
              type="number"
              placeholder="Number of people"
              fullWidth
              disabled={modalMode === 'view'}
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              error={!!errors.capacity}
              helperText={errors.capacity}
              InputProps={{
                startAdornment: <PeopleOutlineIcon sx={{ color: '#9ca3af', mr: 1, fontSize: 20 }} />
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            {modalMode === 'view' ? 'Close' : 'Save Venue'}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog 
        open={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        onConfirm={confirmDelete} 
        itemName={deleteTarget?.name || ''} 
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: '8px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Venues;
