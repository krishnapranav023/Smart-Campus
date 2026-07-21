import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, 
  CircularProgress, Stack, Tooltip 
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import HandshakeIcon from '@mui/icons-material/Handshake';

import api from '../api';
import { useApp } from '../context/AppContext';

const VolunteerManagement = () => {
  const { showSnackbar, themeMode } = useApp();
  const isLight = themeMode === 'light';

  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/organizers/volunteers');
      setVolunteers(res.data.data || []);
    } catch (e) {
      showSnackbar('Error loading volunteer roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, []);

  const handleStatusUpdate = async (volId, status, responsibilityText) => {
    try {
      await api.put(`/organizers/volunteers/${volId}`, {
        status,
        responsibility: responsibilityText
      });
      showSnackbar(`Volunteer application marked as ${status.toLowerCase()}`);
      loadVolunteers();
    } catch (e) {
      showSnackbar('Action failed', 'error');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <HandshakeIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">Volunteer Staffing Roster</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Review student applications for volunteer roles across your coordinated events.
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>STUDENT APPLICANT</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>TARGET EVENT</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>REQUESTED RESPONSIBILITY</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {volunteers.length > 0 ? (
                volunteers.map((vol) => (
                  <TableRow key={vol.id} hover sx={{ '& td': { py: 1.8 } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{vol.user?.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{vol.user?.email}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{vol.event?.title}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{vol.responsibility}</TableCell>
                    <TableCell>
                      <Chip 
                        label={vol.status} size="small"
                        sx={{ 
                          fontWeight: 800, fontSize: '0.65rem', borderRadius: '6px',
                          bgcolor: vol.status === 'APPROVED' ? '#dcfce7' : vol.status === 'PENDING' ? '#fffbeb' : '#fef2f2',
                          color: vol.status === 'APPROVED' ? '#15803d' : vol.status === 'PENDING' ? '#b45309' : '#b91c1c'
                        }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      {vol.status === 'PENDING' ? (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Approve Application">
                            <IconButton 
                              size="small" onClick={() => handleStatusUpdate(vol.id, 'APPROVED', vol.responsibility)}
                              sx={{ color: '#16a34a', bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.1)', '&:hover': { bgcolor: '#16a34a', color: '#fff' } }}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Request">
                            <IconButton 
                              size="small" onClick={() => handleStatusUpdate(vol.id, 'REJECTED', vol.responsibility)}
                              sx={{ color: '#dc2626', bgcolor: isLight ? '#fef2f2' : 'rgba(220, 38, 38, 0.1)', '&:hover': { bgcolor: '#dc2626', color: '#fff' } }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Reviewed</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="textSecondary" variant="body2">No volunteer applications recorded</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default VolunteerManagement;
