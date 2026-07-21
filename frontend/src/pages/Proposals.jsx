import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Chip,
  Card,
  CardContent,
  Skeleton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import api from '../api';
import SearchBar from '../components/SearchBar';
import useSearch from '../hooks/useSearch';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EventIcon from '@mui/icons-material/Event';
import { useApp } from '../context/AppContext';

const Proposals = () => {
  const navigate = useNavigate();
  const { showSnackbar, user } = useApp();
  const isAdmin = user?.role === 'ADMIN';

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  
  // Tab states: PENDING, APPROVED, REJECTED
  const [statusTab, setStatusTab] = useState('PENDING');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    budget: 0
  });

  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    type: 'Technical',
    institutionId: '',
    proposedDate: '',
    estimatedBudget: ''
  });

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/proposals');
      setProposals(res.data.data || res.data || []);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError(err.response?.data?.message || 'Failed to load proposals');
      setSnackbar('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await api.get('/institutions');
      setInstitutions(res.data.data || res.data || []);
    } catch (err) {
      console.error('Error fetching institutions:', err);
    }
  };

  useEffect(() => {
    fetchProposals();
    fetchInstitutions();
  }, []);

  // Filter proposals by selected tab
  const tabFilteredProposals = useMemo(() => {
    return proposals.filter(p => p.status === statusTab);
  }, [proposals, statusTab]);

  const { filteredItems, handleSearch, handleCancel } = useSearch(
    tabFilteredProposals,
    ['title', 'description', 'status']
  );

  const handleEdit = (proposal) => {
    setSelectedProposal(proposal);
    setFormData({
      title: proposal.event?.title || proposal.title || '',
      description: proposal.event?.description || proposal.description || '',
      status: proposal.status,
      budget: proposal.event?.budget?.[0]?.allocated || proposal.budget || 0
    });
    setIsEditModalOpen(true);
  };

  const handleCreateProposal = async () => {
    if (!createFormData.title || !createFormData.description || !createFormData.institutionId || !createFormData.proposedDate) {
      setSnackbar('Please fill all required fields!');
      return;
    }

    try {
      setLoading(true);
      await api.post('/proposals', {
        title: createFormData.title,
        description: createFormData.description,
        type: createFormData.type,
        institutionId: createFormData.institutionId,
        startDate: createFormData.proposedDate,
        budget: createFormData.estimatedBudget
      });
      setSnackbar('Proposal submitted successfully!');
      setIsCreateModalOpen(false);
      setCreateFormData({
        title: '',
        description: '',
        type: 'Technical',
        institutionId: '',
        proposedDate: '',
        estimatedBudget: ''
      });
      fetchProposals();
    } catch (e) {
      console.error('Create error:', e);
      setSnackbar(e.response?.data?.message || 'Submission failed!');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/proposals/${selectedProposal.id}`, formData);
      setSnackbar('Proposal updated successfully!');
      setIsEditModalOpen(false);
      fetchProposals();
    } catch (e) {
      console.error('Update error:', e);
      setSnackbar(e.response?.data?.message || 'Update failed!');
    }
  };

  // Direct Admin Status updates (Approve / Reject)
  const handleUpdateStatus = async (proposalId, newStatus) => {
    try {
      setLoading(true);
      await api.put(`/proposals/${proposalId}`, { status: newStatus });
      setSnackbar(`Proposal ${newStatus.toLowerCase()} successfully!`);
      fetchProposals();
    } catch (e) {
      console.error('Status update error:', e);
      setSnackbar(e.response?.data?.message || 'Failed to update proposal status');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/proposals/${deleteTarget.id}`);
      setSnackbar('Proposal deleted successfully!');
      fetchProposals();
      setDeleteTarget(null);
    } catch (e) {
      console.error('Delete error:', e);
      setSnackbar(e.response?.data?.message || 'Delete failed!');
    }
  };

  const getStatusChip = (status) => {
    const styles = {
      APPROVED: { bg: '#d1fae5', color: '#10b981' },
      REJECTED: { bg: '#fee2e2', color: '#ef4444' },
      PENDING: { bg: '#fef3c7', color: '#f59e0b' }
    };
    const s = styles[status] || { bg: '#f3f4f6', color: 'text.secondary' };
    return <Chip label={status} size="small" sx={{ backgroundColor: s.bg, color: s.color, fontWeight: 700, borderRadius: '6px' }} />;
  };

  const getStatusIcon = (status) => {
    const iconStyles = { fontSize: 20 };
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon sx={{ color: '#10b981', ...iconStyles }} />;
      case 'REJECTED':
        return <CancelIcon sx={{ color: '#ef4444', ...iconStyles }} />;
      case 'PENDING':
        return <PendingActionsIcon sx={{ color: '#f59e0b', ...iconStyles }} />;
      default:
        return <EventIcon sx={{ color: 'text.secondary', ...iconStyles }} />;
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Title Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">Event Proposals</Typography>
          <Chip label={filteredItems.length} sx={{ ml: 2, fontWeight: 700 }} />
        </Box>
        <Button 
          variant="contained" 
          onClick={() => setIsCreateModalOpen(true)} 
          sx={{ backgroundColor: '#3b82f6', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          + New Proposal
        </Button>
      </Box>

      {/* Tabs Layout */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={statusTab} onChange={(_, val) => { setStatusTab(val); }} textColor="primary" indicatorColor="primary">
          <Tab value="PENDING" label="Pending Proposals" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab value="APPROVED" label="Approved Events" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab value="REJECTED" label="Rejected Proposals" sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <SearchBar
          onSearch={handleSearch}
          onCancel={handleCancel}
          placeholder={`Search ${statusTab.toLowerCase()} proposals...`}
        />
      </Box>

      {/* Proposals Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : filteredItems.length > 0 ? (
        <Grid container spacing={3}>
          {filteredItems.map(proposal => {
            const displayTitle = proposal.event?.title || proposal.title || 'Untitled Proposal';
            const displayDesc = proposal.event?.description || proposal.description || 'No description provided';
            const displayBudget = proposal.event?.budget?.[0]?.allocated || proposal.budget || 0;
            const displayInst = proposal.event?.institution?.name || 'General';

            return (
              <Grid item xs={12} md={6} lg={4} key={proposal.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  boxShadow: 'none',
                  backgroundColor: 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-4px)'
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: 'text.primary', fontSize: '1rem', lineHeight: 1.3 }}>
                          {displayTitle}
                        </Typography>
                        {getStatusChip(proposal.status)}
                      </Box>
                      {getStatusIcon(proposal.status)}
                    </Box>

                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, fontSize: '0.85rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {displayDesc}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, backgroundColor: 'action.hover', borderRadius: 1.5, display: 'flex' }}>
                          <AccountBalanceIcon sx={{ color: '#3b82f6', fontSize: 16 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>Host College</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>{displayInst}</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, backgroundColor: 'action.hover', borderRadius: 1.5, display: 'flex' }}>
                          <EventIcon sx={{ color: '#8b5cf6', fontSize: 16 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>Estimated Budget</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>₹{displayBudget.toLocaleString('en-IN')}</Typography>
                        </Box>
                      </Box>
                    </Box>

                    {proposal.status === 'PENDING' && (
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Approval Progress</Typography>
                          <Typography variant="caption" fontWeight="bold">50%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={50} sx={{ height: 6, borderRadius: 3 }} />
                      </Box>
                    )}
                  </CardContent>

                  {/* Actions Footer */}
                  <Box sx={{ display: 'flex', gap: 1, p: 2, borderTop: '1px solid', borderColor: 'divider', mt: 'auto' }}>
                    {isAdmin && proposal.status === 'PENDING' ? (
                      <>
                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleUpdateStatus(proposal.id, 'APPROVED')}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                        >
                          Approve
                        </Button>
                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleUpdateStatus(proposal.id, 'REJECTED')}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          fullWidth
                          size="small"
                          startIcon={<EditIcon />}
                          variant="outlined"
                          onClick={() => handleEdit(proposal)}
                          disabled={proposal.status !== 'PENDING'}
                          sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
                        >
                          Edit
                        </Button>
                        <Button
                          fullWidth
                          size="small"
                          startIcon={<DeleteIcon />}
                          variant="contained"
                          color="error"
                          onClick={() => setDeleteTarget(proposal)}
                          disabled={proposal.status !== 'PENDING'}
                          sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center', backgroundColor: 'background.paper' }}>
          <EventIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>No {statusTab.toLowerCase()} proposals found</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {proposals.length === 0 ? 'No event proposals created yet.' : 'Try adjusting your search criteria'}
          </Typography>
          {statusTab === 'PENDING' && (
            <Button 
              variant="contained" 
              onClick={() => setIsCreateModalOpen(true)} 
              sx={{ backgroundColor: '#3b82f6', textTransform: 'none', fontWeight: 700 }}
            >
              Submit First Proposal
            </Button>
          )}
        </Paper>
      )}

      {/* Submit Proposal Modal */}
      <Dialog open={isCreateModalOpen} onClose={() => !loading && setIsCreateModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1, pt: 3 }}>Submit Event Proposal</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Propose a new event for review and approval.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              required
              label="Title"
              placeholder="Enter event title"
              value={createFormData.title}
              onChange={e => setCreateFormData({ ...createFormData, title: e.target.value })}
            />
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="Description"
              placeholder="Describe the event goals and activities"
              value={createFormData.description}
              onChange={e => setCreateFormData({ ...createFormData, description: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, ml: 0.5, fontWeight: 600 }}>Event Type</Typography>
                  <Select
                    value={createFormData.type}
                    onChange={e => setCreateFormData({ ...createFormData, type: e.target.value })}
                    size="small"
                  >
                    <MenuItem value="Technical">Technical</MenuItem>
                    <MenuItem value="Cultural">Cultural</MenuItem>
                    <MenuItem value="Sports">Sports</MenuItem>
                    <MenuItem value="Workshop">Workshop</MenuItem>
                    <MenuItem value="Seminar">Seminar</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, ml: 0.5, fontWeight: 600 }}>Institution</Typography>
                  <Select
                    value={createFormData.institutionId}
                    onChange={e => setCreateFormData({ ...createFormData, institutionId: e.target.value })}
                    size="small"
                    displayEmpty
                  >
                    <MenuItem value="" disabled>Select Institution</MenuItem>
                    {institutions.map(inst => (
                      <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  label="Proposed Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={createFormData.proposedDate}
                  onChange={e => setCreateFormData({ ...createFormData, proposedDate: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Estimated Budget (₹)"
                  type="number"
                  placeholder="0"
                  value={createFormData.estimatedBudget}
                  onChange={e => setCreateFormData({ ...createFormData, estimatedBudget: e.target.value })}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 1, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            onClick={() => setIsCreateModalOpen(false)} 
            disabled={loading}
            sx={{ color: 'text.secondary', textTransform: 'none', px: 3, fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateProposal}
            disabled={loading}
            sx={{ backgroundColor: '#3b82f6', textTransform: 'none', px: 4, py: 1, borderRadius: 2, fontWeight: 700 }}
          >
            {loading ? 'Submitting...' : 'Submit Proposal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Proposal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            <TextField
              fullWidth
              label="Proposal Title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              fullWidth
              label="Budget"
              type="number"
              value={formData.budget}
              onChange={e => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsEditModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} sx={{ backgroundColor: '#3b82f6', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight="bold">Delete Proposal?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.includes('failed') || snackbar.includes('Error') ? 'error' : 'success'} sx={{ borderRadius: 2 }}>
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Proposals;