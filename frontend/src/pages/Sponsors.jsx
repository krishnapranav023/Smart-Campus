import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import api from '../api';
import useAsync from '../hooks/useAsync';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const Sponsors = () => {
  const [snackbar, setSnackbar] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', contribution: 0 });
  
  const fetchSponsorsReq = React.useCallback(() => api.get('/sponsors'), []);
  const { execute: fetchSponsors, data: sponsorsList = [], loading } = useAsync(fetchSponsorsReq);

  useEffect(() => { fetchSponsors(); }, [fetchSponsors]);

  const handleEditClick = (s) => {
    setSelectedSponsor(s);
    setEditFormData({
      name: s.name,
      contribution: s.contribution || 0
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/sponsors/${selectedSponsor.id}`, {
        name: editFormData.name,
        contribution: parseFloat(editFormData.contribution)
      });
      setSnackbar('Sponsor updated successfully!');
      setIsEditModalOpen(false);
      fetchSponsors();
    } catch (e) {
      console.error(e);
      setSnackbar('Failed to update sponsor');
    }
  };

  const handleDelete = (s) => {
    setDeleteTarget(s);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
        await api.delete(`/sponsors/${deleteTarget.id}`);
        fetchSponsors();
        setSnackbar('Sponsor deleted successfully!');
    } catch (e) {
        setSnackbar('Failed to delete sponsor');
    }
    setDeleteTarget(null);
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'Platinum': return { bgcolor: '#e0f2fe', color: '#0ea5e9' };
      case 'Gold': return { bgcolor: '#fef3c7', color: '#f59e0b' };
      case 'Silver': return { bgcolor: '#f3f4f6', color: '#9ca3af' };
      case 'Bronze': return { bgcolor: '#ffedd5', color: '#d97706' };
      case 'Title': return { bgcolor: '#e0e7ff', color: '#4f46e5' };
      default: return { bgcolor: '#f3f4f6', color: '#9ca3af' };
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary' }}>Sponsors</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{sponsorsList.length} sponsors</Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '1px solid', borderColor: 'divider', color: '#9ca3af', fontSize: '0.85rem', pt: 2, pb: 2 } }}>
                <TableCell>Sponsor</TableCell>
                <TableCell>Event</TableCell>
                <TableCell align="center">Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sponsorsList.map((s) => {
                const ts = getTypeStyle(s.type || (s.contribution > 300000 ? 'Platinum' : s.contribution > 200000 ? 'Gold' : 'Silver'));
                return (
                  <TableRow key={s.id} sx={{ '& td': { borderBottom: '1px solid', borderColor: 'divider', py: 1.5 } }}>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', color: 'text.primary', fontWeight: 500 }}>{s.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{s.email || `${s.name.toLowerCase().replace(/ /g, '')}@sponsor.com`}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{s.event?.title || 'General Sponsorship'}</TableCell>
                    <TableCell align="center">
                      <Box component="span" sx={{ px: 1.5, py: 0.5, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 500, backgroundColor: ts.bgcolor, color: ts.color }}>
                        {s.type || (s.contribution > 300000 ? 'Platinum' : s.contribution > 200000 ? 'Gold' : 'Silver')}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                        ₹{s.contribution?.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      <Box component="span" sx={{ px: 1.5, py: 0.5, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 500, backgroundColor: '#d1fae5', color: '#10b981' }}>
                        {s.status || 'Active'}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEditClick(s)} sx={{ color: '#3b82f6', '&:hover': { backgroundColor: '#eff6ff' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(s)} sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fef2f2' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight="bold" color="text.primary">Edit Sponsor</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            <TextField
              fullWidth
              label="Sponsor Name"
              value={editFormData.name}
              onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Contribution Amount (₹)"
              type="number"
              value={editFormData.contribution}
              onChange={e => setEditFormData({ ...editFormData, contribution: parseFloat(e.target.value) || 0 })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setIsEditModalOpen(false)} sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveEdit} sx={{ backgroundColor: '#3b82f6', textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} itemName={deleteTarget?.name || ''} />

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar('')} severity="success" sx={{ width: '100%', borderRadius: 2 }}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Sponsors;
