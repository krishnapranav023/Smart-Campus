import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useUrlSearchQuery from '../hooks/useUrlSearchQuery';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, MenuItem, Select, FormControl, IconButton, 
  TablePagination, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Button, Avatar, Stack, TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SortIcon from '@mui/icons-material/Sort';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchBar from '../components/SearchBar';

import api from '../api';
import useAsync from '../hooks/useAsync';
import { useApp } from '../context/AppContext';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const Users = () => {
  const { showSnackbar, themeMode } = useApp();
  const isLight = themeMode === 'light';

  const [searchTerm, setSearchTerm] = useUrlSearchQuery();
  const [roleFilter, setRoleFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'PARTICIPANT', institutionId: '' });
  const [errors, setErrors] = useState({});

  // Stable API fetch functions
  const fetchUsersReq = useCallback(() => api.get('/users'), []);
  const fetchInstitutionsReq = useCallback(() => api.get('/institutions'), []);

  const { execute: fetchUsers, data: users = [], loading } = useAsync(fetchUsersReq);
  const { execute: fetchInstitutions, data: institutions = [] } = useAsync(fetchInstitutionsReq);

  useEffect(() => { 
    fetchUsers(); 
    fetchInstitutions();
  }, [fetchUsers, fetchInstitutions]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.role) newErrors.role = 'Role is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenModal = (mode, user = null) => {
    setModalMode(mode);
    setErrors({});
    if (user) {
      setSelectedUser(user);
      setFormData({ 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        institutionId: user.institutionId || '' 
      });
    } else {
      setSelectedUser(null);
      setFormData({ name: '', email: '', role: 'PARTICIPANT', institutionId: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (modalMode === 'view') {
      setModalOpen(false);
      return;
    }

    if (!validate()) return;

    try {
      if (modalMode === 'add') {
        await api.post('/users', formData);
        showSnackbar('User created successfully');
      } else {
        await api.put(`/users/${selectedUser.id}`, formData);
        showSnackbar('User updated successfully');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (e) {
      showSnackbar(e.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const getRoleStyle = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return { bgcolor: isLight ? '#f3e8ff' : 'rgba(168, 85, 247, 0.15)', color: isLight ? '#9333ea' : '#c084fc', label: 'Admin' };
      case 'ORGANIZER': return { bgcolor: isLight ? '#e0e7ff' : 'rgba(99, 102, 241, 0.15)', color: isLight ? '#4f46e5' : '#818cf8', label: 'Organizer' };
      case 'PARTICIPANT': return { bgcolor: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)', color: isLight ? '#15803d' : '#34d399', label: 'Participant' };
      default: return { bgcolor: 'action.hover', color: 'text.secondary', label: role };
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = (users || []).filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === '' || u.role?.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });

    result.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      if (sortOrder === 'asc') return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });

    return result;
  }, [users, searchTerm, roleFilter, sortOrder]);

  const paginated = filteredAndSorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      fetchUsers();
      showSnackbar('User deleted successfully');
    } catch (e) {
      showSnackbar('Failed to delete user', 'error');
    }
    setDeleteTarget(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">System Users</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage platform members and their application roles
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button 
            startIcon={<SortIcon />} 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            variant="outlined"
            sx={{ textTransform: 'none', borderRadius: '10px', color: 'text.secondary', borderColor: 'divider' }}
          >
            Sort: {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenModal('add')}
            sx={{ backgroundColor: '#3b82f6', textTransform: 'none', borderRadius: '12px', px: 3, fontWeight: 700, boxShadow: 'none' }}
          >
            New User
          </Button>
        </Stack>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <SearchBar 
            onSearch={setSearchTerm} 
            placeholder="Search by name or email..." 
          />
          <FormControl size="small" sx={{ width: 180 }}>
            <Select 
              displayEmpty value={roleFilter} 
              onChange={e => { setRoleFilter(e.target.value); setPage(0); }}
              sx={{ backgroundColor: 'action.hover', borderRadius: '10px' }}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="ORGANIZER">Organizer</MenuItem>
              <MenuItem value="PARTICIPANT">Participant</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden', backgroundColor: 'background.paper' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', py: 2 }}>NAME & EMAIL</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>ROLE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>AFFILIATION</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>ACCOUNT SINCE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((u) => {
                  const rs = getRoleStyle(u.role);
                  return (
                    <TableRow key={u.id} hover sx={{ '& td': { py: 1.5 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px' }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.9rem' }}>{u.name}</Typography>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{u.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={rs.label} size="small" 
                          sx={{ bgcolor: rs.bgcolor, color: rs.color, fontWeight: 700, fontSize: '0.65rem' }} 
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', fontWeight: 600 }}>{u.institution?.name || 'N/A'}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleOpenModal('view', u)} sx={{ color: 'text.secondary', '&:hover': { color: '#3b82f6', bgcolor: 'action.hover' } }}><VisibilityIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenModal('edit', u)} sx={{ color: 'text.secondary', '&:hover': { color: '#3b82f6', bgcolor: 'action.hover' } }}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => setDeleteTarget(u)} sx={{ color: 'text.secondary', '&:hover': { color: '#ef4444', bgcolor: 'action.hover' } }}><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {!loading && paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography color="textSecondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredAndSorted.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
        />
      </Paper>

      {/* Add/Edit/View Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1, backgroundColor: 'background.paper' } }}>
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.4rem' }}>
          {modalMode === 'add' ? 'Register New User' : modalMode === 'edit' ? 'Refine User Account' : 'Account Details'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              disabled={modalMode === 'view'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <TextField
              label="Email Address"
              fullWidth
              disabled={modalMode === 'view'}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <FormControl fullWidth error={!!errors.role} disabled={modalMode === 'view'}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, ml: 1 }}>Role</Typography>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="ORGANIZER">Organizer</MenuItem>
                <MenuItem value="PARTICIPANT">Participant</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={modalMode === 'view'}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, ml: 1 }}>Institution</Typography>
              <Select
                value={formData.institutionId}
                onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                sx={{ borderRadius: '12px' }}
                displayEmpty
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {institutions.map((i) => (
                  <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            sx={{ backgroundColor: '#3b82f6', borderRadius: '12px', px: 4, fontWeight: 700, boxShadow: 'none' }}
          >
            {modalMode === 'view' ? 'Close' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog 
        open={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        onConfirm={confirmDelete} 
        itemName={deleteTarget?.name} 
      />
    </Box>
  );
};

export default Users;
