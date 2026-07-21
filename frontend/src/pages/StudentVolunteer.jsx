import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Button, Stack, TextField,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Alert, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

import api from '../api';
import { useApp } from '../context/AppContext';

const statusStyle = {
  PENDING:  { color: '#b45309', bg: '#fffbeb', icon: <HourglassEmptyIcon fontSize="inherit" /> },
  APPROVED: { color: '#15803d', bg: '#dcfce7', icon: <CheckCircleOutlineIcon fontSize="inherit" /> },
  REJECTED: { color: '#b91c1c', bg: '#fee2e2', icon: <CancelOutlinedIcon fontSize="inherit" /> },
};

const StudentVolunteer = () => {
  const { showSnackbar } = useApp();

  const [myApplications, setMyApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({ eventId: '', responsibility: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [appRes, evRes] = await Promise.all([
        api.get('/participants/my-volunteering'),
        api.get('/events?limit=100')
      ]);
      setMyApplications(appRes.data.data || []);
      // Filter out completed, cancelled or proposed events from volunteer dropdown
      const activeOrUpcomingEvents = (evRes.data.data?.data || evRes.data.data || []).filter(e => 
        e.status !== 'COMPLETED' && e.status !== 'CANCELLED' && e.status !== 'PROPOSED'
      );
      setEvents(activeOrUpcomingEvents);
    } catch {
      showSnackbar('Failed to load volunteer data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApply = async () => {
    if (!form.eventId || !form.responsibility.trim()) {
      return showSnackbar('Please select an event and describe your role', 'warning');
    }
    setApplying(true);
    try {
      await api.post('/participants/apply-volunteer', {
        eventId: parseInt(form.eventId),
        responsibility: form.responsibility
      });
      showSnackbar('Volunteer application submitted!');
      setApplyOpen(false);
      setForm({ eventId: '', responsibility: '' });
      load();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to submit application', 'error');
    } finally {
      setApplying(false);
    }
  };

  const stats = {
    total: myApplications.length,
    approved: myApplications.filter(a => a.status === 'APPROVED').length,
    pending: myApplications.filter(a => a.status === 'PENDING').length,
    rejected: myApplications.filter(a => a.status === 'REJECTED').length,
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HandshakeIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">Volunteer Applications</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.3 }}>
              Apply to volunteer at events and track your application status.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setApplyOpen(true)}
          sx={{ textTransform: 'none', borderRadius: '10px', bgcolor: '#4f46e5', boxShadow: 'none', px: 3 }}
        >
          Apply to Volunteer
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Total Applied', value: stats.total, color: '#4f46e5', bg: '#eff6ff' },
          { label: 'Approved', value: stats.approved, color: '#15803d', bg: '#dcfce7' },
          { label: 'Pending', value: stats.pending, color: '#b45309', bg: '#fffbeb' },
          { label: 'Rejected', value: stats.rejected, color: '#b91c1c', bg: '#fee2e2' },
        ].map(s => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Applications Table */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>My Applications</Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : myApplications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <HandshakeIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>No applications yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Click "Apply to Volunteer" to help out at an event and earn recognition.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>EVENT</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>REQUESTED ROLE</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>APPLIED ON</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myApplications.map(app => {
                  const s = statusStyle[app.status] || statusStyle.PENDING;
                  return (
                    <TableRow key={app.id} hover sx={{ '& td': { py: 1.8 } }}>
                      <TableCell>
                        <Typography fontWeight={700} fontSize="0.9rem">{app.event?.title || '—'}</Typography>
                        <Typography fontSize="0.75rem" color="text.secondary">{app.event?.institution?.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{app.responsibility}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB') : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={app.status}
                          size="small"
                          icon={s.icon}
                          sx={{ fontWeight: 800, fontSize: '0.7rem', bgcolor: s.bg, color: s.color, '& .MuiChip-icon': { color: s.color } }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HandshakeIcon sx={{ color: '#4f46e5' }} />
            Apply to Volunteer
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2.5, mt: 1 }}>
            Select an event you'd like to volunteer at and describe what role you want to take on. The organizer will review your application.
          </Alert>
          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Event</InputLabel>
              <Select
                value={form.eventId}
                label="Select Event"
                onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
              >
                {events.map(ev => (
                  <MenuItem key={ev.id} value={ev.id}>{ev.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Your Requested Role / Responsibility"
              placeholder="e.g. Stage management, Registration desk, Technical support..."
              fullWidth multiline rows={3} size="small"
              value={form.responsibility}
              onChange={e => setForm(f => ({ ...f, responsibility: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setApplyOpen(false)} sx={{ textTransform: 'none', borderRadius: '8px' }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleApply} disabled={applying}
            sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#4f46e5', boxShadow: 'none', px: 3 }}
          >
            {applying ? 'Submitting...' : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentVolunteer;
