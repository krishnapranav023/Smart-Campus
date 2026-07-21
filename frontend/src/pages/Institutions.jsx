import React, { useEffect, useState, useMemo, useCallback } from 'react';
import useUrlSearchQuery from '../hooks/useUrlSearchQuery';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Paper, TextField, Button, 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  FormControl, Select, MenuItem, IconButton, Tooltip, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SortIcon from '@mui/icons-material/Sort';

import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import SearchBar from '../components/SearchBar';
import { institutionService } from '../services/institutionService';
import CardSkeleton from '../components/CardSkeleton';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const Institutions = () => {
  const navigate = useNavigate();
  const { showSnackbar, user, themeMode } = useApp();
  
  const isLight = themeMode === 'light';

  // State
  const [searchTerm, setSearchTerm] = useUrlSearchQuery();
  const [typeFilter, setTypeFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', location: '', type: 'Deemed University' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Sync services
  const { execute: fetchInstitutions, data: institutions = [], loading } = useAsync(institutionService.getAll);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  const isAdmin = user?.role === 'ADMIN';

  const getInstitutionBadge = (name) => {
    if (name.includes('IIT')) return { label: 'IIT', color: isLight ? '#e0e7ff' : 'rgba(99, 102, 241, 0.15)', textColor: isLight ? '#4338ca' : '#818cf8' };
    if (name.includes('NIT')) return { label: 'NIT', color: isLight ? '#e0f2fe' : 'rgba(59, 130, 246, 0.15)', textColor: isLight ? '#0369a1' : '#60a5fa' };
    if (name.includes('University')) return { label: 'University', color: isLight ? '#f3e8ff' : 'rgba(168, 85, 247, 0.15)', textColor: isLight ? '#7e22ce' : '#c084fc' };
    if (name.includes('College')) return { label: 'College', color: isLight ? '#fce7f3' : 'rgba(236, 72, 153, 0.15)', textColor: isLight ? '#be185d' : '#f472b6' };
    return { label: 'Institute', color: 'action.hover', textColor: 'text.secondary' };
  };

  const handleEdit = (inst) => {
    setEditingInst(inst.id);
    setFormData({
      name: inst.name,
      code: inst.code || '',
      location: inst.location || '',
      type: getInstitutionBadge(inst.name).label
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await institutionService.delete(deleteTarget.id);
      showSnackbar('Institution deleted successfully');
      fetchInstitutions();
    } catch (e) {
      showSnackbar('Delete failed! Institution may have active events.', 'error');
    }
    setDeleteTarget(null);
  };

  const handleSave = async () => {
    try {
      if (editingInst) {
        await institutionService.update(editingInst, formData);
        showSnackbar('Institution updated successfully');
      } else {
        await institutionService.create(formData);
        showSnackbar('Institution added successfully');
      }
      setIsModalOpen(false);
      setEditingInst(null);
      fetchInstitutions();
    } catch (e) {
      showSnackbar(e.response?.data?.message || 'Save failed', 'error');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = (institutions || []).filter(i => {
      const name = i.name || '';
      const code = i.code || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === '' || getInstitutionBadge(name).label === typeFilter;
      return matchesSearch && matchesType;
    });

    result.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      if (sortOrder === 'asc') return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });

    return result;
  }, [institutions, searchTerm, typeFilter, sortOrder]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Academic Partners</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Collaboration network of over {institutions.length} elite institutions
          </Typography>
        </Box>
        {isAdmin && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => { setEditingInst(null); setFormData({ name: '', code: '', location: '', type: 'Deemed University' }); setIsModalOpen(true); }}
            sx={{ backgroundColor: '#3b82f6', textTransform: 'none', borderRadius: '12px', px: 3, fontWeight: 700, boxShadow: 'none' }}
          >
            Add Institution
          </Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <SearchBar 
            onSearch={setSearchTerm} 
            placeholder="Search by name or code..." 
          />
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <FormControl size="small" sx={{ width: 180 }}>
              <Select 
                displayEmpty value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                sx={{ backgroundColor: 'action.hover', borderRadius: '10px' }}
              >
                <MenuItem value="">All Category</MenuItem>
                {['IIT', 'NIT', 'University', 'College', 'Institute'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <Button 
                startIcon={<SortIcon />} 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                variant="outlined"
                sx={{ textTransform: 'none', borderRadius: '10px', color: 'text.secondary', borderColor: 'divider', minWidth: 130 }}
            >
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {loading ? (
            [...Array(6)].map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}><CardSkeleton /></Grid>
            ))
        ) : (
            filteredAndSorted.map(inst => {
            const badge = getInstitutionBadge(inst.name);
            return (
                <Grid item xs={12} sm={6} md={4} key={inst.id}>
                <Paper 
                    elevation={0} 
                    sx={{ 
                    p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', 
                    backgroundColor: 'background.paper',
                    display: 'flex', flexDirection: 'column', transition: 'all 0.3s', 
                    '&:hover': { boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)', transform: 'translateY(-4px)' } 
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.1rem', pr: 1 }}>
                        {inst.name}
                    </Typography>
                    <Chip 
                        label={badge.label} size="small" 
                        sx={{ bgcolor: badge.color, color: badge.textColor, fontWeight: 800, fontSize: '0.65rem', borderRadius: '6px' }} 
                    />
                    </Box>
                    
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 500, mb: 3 }}>
                    {inst.location} • <Box component="span" sx={{ color: '#3b82f6', fontWeight: 700 }}>{inst.code}</Box>
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5, px: 1, backgroundColor: 'action.hover', borderRadius: 3, mb: 3 }}>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography sx={{ fontWeight: 900, color: 'text.primary', fontSize: '1.2rem' }}>{inst.eventsCount || 0}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', mt: 0.5 }}>Events</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1, borderLeft: '1px solid', borderRight: '1px solid', borderColor: 'divider' }}>
                        <Typography sx={{ fontWeight: 900, color: 'text.primary', fontSize: '1.2rem' }}>{inst.participantsCount || 0}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', mt: 0.5 }}>Members</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography sx={{ fontWeight: 900, color: '#f59e0b', fontSize: '1.2rem' }}>{inst.winsCount || 0}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', mt: 0.5 }}>Wins</Typography>
                    </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Button 
                        variant="contained" size="small" startIcon={<VisibilityIcon sx={{ fontSize: '16px !important' }} />} 
                        onClick={() => navigate(`/institutions/${inst.id}`)}
                        sx={{ 
                            textTransform: 'none', borderRadius: '10px', fontSize: '0.75rem', 
                            fontWeight: 700, backgroundColor: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)', color: '#3b82f6',
                            boxShadow: 'none', '&:hover': { backgroundColor: isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.25)' }
                        }}
                    >
                        View Details
                    </Button>
                    <Stack direction="row" spacing={0.5}>
                        {isAdmin && (
                            <>
                            <Tooltip title="Edit Profile">
                                <IconButton size="small" onClick={() => handleEdit(inst)} sx={{ color: 'text.secondary', '&:hover': { color: '#3b82f6' } }}><EditIcon fontSize="small" /></IconButton>
                            </Tooltip>
                            <Tooltip title="Decommission">
                                <IconButton size="small" onClick={() => setDeleteTarget(inst)} sx={{ color: 'text.secondary', '&:hover': { color: '#ef4444' } }}><DeleteIcon fontSize="small" /></IconButton>
                            </Tooltip>
                            </>
                        )}
                    </Stack>
                    </Box>
                </Paper>
                </Grid>
            );
            })
        )}
      </Grid>

      {/* Institution Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1, backgroundColor: 'background.paper' } }}>
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.4rem' }}>{editingInst ? 'Refine Institution Profile' : 'Register New Institution'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField fullWidth label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            <Stack direction="row" spacing={2}>
              <TextField fullWidth label="Reference Code" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g., IIT-B" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              <TextField fullWidth label="Main Campus Location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Stack>
            <FormControl fullWidth>
              <Select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} sx={{ borderRadius: '12px' }}>
                {['IIT', 'NIT', 'IISc', 'University', 'College', 'Institute'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setIsModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#3b82f6', borderRadius: '12px', px: 4, fontWeight: 700, boxShadow: 'none' }}>
            {editingInst ? 'Save Changes' : 'Confirm Registration'}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} itemName={deleteTarget?.name} />
    </Box>
  );
};

export default Institutions;
