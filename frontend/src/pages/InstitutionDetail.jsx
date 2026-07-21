import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Button, IconButton, Chip, Divider,
  Skeleton, Snackbar, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tabs, Tab, Stack, Avatar
} from '@mui/material';
import api from '../api';
import { getComputedStatus, getStatusStyle } from '../utils/eventStatus';
import { useApp } from '../context/AppContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CodeIcon from '@mui/icons-material/Code';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const InstitutionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { themeMode } = useApp();
  const isLight = themeMode === 'light';

  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', location: '' });
  const [activeTab, setActiveTab] = useState(0);

  const fetchInstitution = async () => {
    try {
      const res = await api.get(`/institutions/${id}`);
      const data = res.data.data || res.data;
      setInstitution(data);
      setFormData({
        name: data.name,
        code: data.code,
        location: data.location || ''
      });
      setLoading(false);
    } catch (error) {
      console.error(error);
      setSnackbar('Failed to load institution details');
      setLoading(false);
    }
  };

  useEffect(() => { fetchInstitution(); }, [id]);

  const handleSaveEdit = async () => {
    try {
      await api.put(`/institutions/${id}`, formData);
      setSnackbar('Institution updated successfully!');
      setIsEditModalOpen(false);
      fetchInstitution();
    } catch (e) {
      setSnackbar('Update failed!');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/institutions/${id}`);
      navigate('/institutions');
    } catch (e) {
      setSnackbar('Delete failed! Institution may have associated data.');
    }
    setDeleteTarget(null);
  };

  // Role badge with dark-mode safe colors
  const getRoleBadge = (role) => {
    const styles = {
      ADMIN:       { bg: isLight ? '#fee2e2' : 'rgba(239,68,68,0.18)',    color: isLight ? '#dc2626' : '#f87171' },
      ORGANIZER:   { bg: isLight ? '#e0e7ff' : 'rgba(99,102,241,0.18)',   color: isLight ? '#4f46e5' : '#818cf8' },
      PARTICIPANT: { bg: isLight ? '#d1fae5' : 'rgba(16,185,129,0.18)',   color: isLight ? '#059669' : '#34d399' },
    };
    const s = styles[role] || { bg: 'action.hover', color: 'text.secondary' };
    return (
      <Chip
        label={role}
        size="small"
        sx={{ backgroundColor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.7rem', borderRadius: '6px' }}
      />
    );
  };

  // Event status chip using computed logic
  const getStatusChip = (evt) => {
    const computed = getComputedStatus(evt);
    const s = getStatusStyle(computed, isLight);
    return (
      <Chip
        label={s.label}
        size="small"
        sx={{ backgroundColor: s.bg, color: s.text, fontWeight: 700, fontSize: '0.7rem', borderRadius: '6px' }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }
  if (!institution) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="text.primary">Institution not found.</Typography>
      </Box>
    );
  }

  const members = institution.user || [];
  const events  = institution.event || [];
  const participants = members.filter(m => m.role === 'PARTICIPANT');
  const organizers   = members.filter(m => m.role === 'ORGANIZER');

  // Icon background tints — subtle in both modes
  const iconBg = {
    blue:   isLight ? '#eff6ff' : 'rgba(59,130,246,0.12)',
    purple: isLight ? '#f5f3ff' : 'rgba(139,92,246,0.12)',
    green:  isLight ? '#ecfdf5' : 'rgba(16,185,129,0.12)',
    amber:  isLight ? '#fff7ed' : 'rgba(245,158,11,0.12)',
  };

  const quickStats = [
    { label: 'Events Hosted', value: institution.eventsCount    || 0, icon: <EventOutlinedIcon sx={{ color: '#3b82f6' }} />, bg: iconBg.blue  },
    { label: 'Total Members', value: institution.participantsCount || 0, icon: <PeopleOutlineIcon  sx={{ color: '#10b981' }} />, bg: iconBg.green },
    { label: 'Total Wins',    value: institution.winsCount       || 0, icon: <EmojiEventsIcon      sx={{ color: '#f59e0b' }} />, bg: iconBg.amber },
  ];

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <IconButton
          onClick={() => navigate('/institutions')}
          sx={{
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Institution Details
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* ── Main Info Card ── */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 4, borderRadius: 4,
              border: '1px solid', borderColor: 'divider',
              backgroundColor: 'background.paper'
            }}
          >
            {/* Name + actions row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: iconBg.blue, width: 52, height: 52 }}>
                  <CorporateFareIcon sx={{ color: '#3b82f6' }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="text.primary" sx={{ mb: 0.5 }}>
                    {institution.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={institution.code}
                      size="small"
                      sx={{
                        backgroundColor: isLight ? '#e0e7ff' : 'rgba(99,102,241,0.18)',
                        color: isLight ? '#4338ca' : '#818cf8',
                        fontWeight: 700, borderRadius: '6px'
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ID: #INST-{institution.id}
                    </Typography>
                  </Stack>
                </Box>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<EditIcon />}
                  variant="outlined"
                  onClick={() => setIsEditModalOpen(true)}
                  sx={{
                    borderRadius: '8px', textTransform: 'none',
                    borderColor: 'divider', color: 'text.primary',
                    '&:hover': { borderColor: 'text.secondary', backgroundColor: 'action.hover' }
                  }}
                >
                  Edit
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  variant="contained"
                  onClick={() => setDeleteTarget(institution)}
                  sx={{
                    borderRadius: '8px', textTransform: 'none',
                    backgroundColor: '#ef4444',
                    '&:hover': { backgroundColor: '#dc2626' }
                  }}
                >
                  Delete
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'divider' }} />

            {/* Detail fields */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {/* Location */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ p: 1, backgroundColor: iconBg.blue, borderRadius: 2 }}>
                    <LocationOnIcon sx={{ color: '#3b82f6' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>
                      LOCATION
                    </Typography>
                    <Typography variant="body1" fontWeight="600" color="text.primary">
                      {institution.location || 'Not specified'}
                    </Typography>
                  </Box>
                </Box>

                {/* Institution Code */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, backgroundColor: iconBg.purple, borderRadius: 2 }}>
                    <CodeIcon sx={{ color: '#8b5cf6' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>
                      INSTITUTION CODE
                    </Typography>
                    <Typography variant="body1" fontWeight="600" color="text.primary">
                      {institution.code}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                {/* Total Members */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ p: 1, backgroundColor: iconBg.green, borderRadius: 2 }}>
                    <PeopleOutlineIcon sx={{ color: '#10b981' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>
                      TOTAL MEMBERS
                    </Typography>
                    <Typography variant="body1" fontWeight="600" color="text.primary">
                      {institution.participantsCount || 0}{' '}
                      <Typography component="span" variant="body2" color="text.secondary">
                        ({organizers.length} organizers, {participants.length} participants)
                      </Typography>
                    </Typography>
                  </Box>
                </Box>

                {/* Total Wins */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, backgroundColor: iconBg.amber, borderRadius: 2 }}>
                    <EmojiEventsIcon sx={{ color: '#f59e0b' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>
                      TOTAL WINS
                    </Typography>
                    <Typography variant="body1" fontWeight="700" sx={{ color: '#f59e0b' }}>
                      {institution.winsCount || 0} wins
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Registered Since */}
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>
                REGISTERED SINCE
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ mt: 0.3 }}>
                {new Date(institution.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* ── Quick Stats Card ── */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3, borderRadius: 4,
              border: '1px solid', borderColor: 'divider',
              backgroundColor: 'background.paper', mb: 3
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mb: 2 }}>
              Quick Stats
            </Typography>
            {quickStats.map((stat, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', py: 1.5,
                  borderBottom: i < quickStats.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ p: 0.8, backgroundColor: stat.bg, borderRadius: 1.5 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="text.primary">
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Members & Events Tabs ── */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none', fontWeight: 600,
                fontSize: '0.9rem', color: 'text.secondary'
              },
              '& .Mui-selected': { color: '#3b82f6' },
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
            }}
          >
            <Tab label={`Members (${members.length})`} />
            <Tab label={`Events (${events.length})`} />
          </Tabs>
        </Box>

        {/* Members Table */}
        {activeTab === 0 && (
          <Paper
            elevation={0}
            sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', backgroundColor: 'background.paper' }}
          >
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    {['Name', 'Email', 'Role', 'Joined'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                        {h.toUpperCase()}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No members found
                      </TableCell>
                    </TableRow>
                  ) : members.slice(0, 25).map(member => (
                    <TableRow key={member.id} hover sx={{ '& td': { py: 1.5 } }}>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {member.name}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                        {member.email}
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {new Date(member.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {members.length > 25 && (
              <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Showing 25 of {members.length} members
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* Events Table */}
        {activeTab === 1 && (
          <Paper
            elevation={0}
            sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', backgroundColor: 'background.paper' }}
          >
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    {['Event', 'Date', 'Status', 'Participants'].map((h, idx) => (
                      <TableCell
                        key={h}
                        align={idx === 3 ? 'right' : 'left'}
                        sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.8rem', letterSpacing: '0.05em' }}
                      >
                        {h.toUpperCase()}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No events found
                      </TableCell>
                    </TableRow>
                  ) : events.slice(0, 20).map(evt => (
                    <TableRow
                      key={evt.id}
                      hover
                      onClick={() => navigate(`/events/${evt.id}`)}
                      sx={{ cursor: 'pointer', '& td': { py: 1.5 } }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: '#3b82f6' }}>
                        {evt.title}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                        {new Date(evt.startDate).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>{getStatusChip(evt)}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>
                        {evt._count?.registration || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      {/* ── Edit Modal ── */}
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold" color="text.primary">Edit Institution</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            <TextField
              fullWidth label="Institution Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth label="Code"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
            />
            <TextField
              fullWidth label="Location"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setIsEditModalOpen(false)}
            sx={{ color: 'text.secondary', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            sx={{ backgroundColor: '#3b82f6', textTransform: 'none', borderRadius: '8px', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={institution?.name || ''}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.toLowerCase().includes('fail') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InstitutionDetail;
