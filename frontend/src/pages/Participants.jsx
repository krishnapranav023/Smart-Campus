import React, { useEffect, useState, useMemo, useCallback } from 'react';
import useUrlSearchQuery from '../hooks/useUrlSearchQuery';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Avatar, IconButton, Button, FormControl, 
  Select, MenuItem, TablePagination, Stack, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SortIcon from '@mui/icons-material/Sort';

import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import SearchBar from '../components/SearchBar';
import { participantService } from '../services/participantService';
import TableSkeleton from '../components/TableSkeleton';
import ParticipantProfileModal from '../components/ParticipantProfileModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const Participants = () => {
  const { showSnackbar, user, institutions, fetchInstitutions: fetchInstData } = useApp();
  
  // State
  const [searchTerm, setSearchTerm] = useUrlSearchQuery();
  const [instFilter, setInstFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Sync services
  const { execute: fetchParticipants, data: participants = [], loading } = useAsync(participantService.getAll);
  const { execute: fetchDetails } = useAsync(participantService.getById);

  useEffect(() => {
    fetchParticipants();
    fetchInstData();
  }, [fetchParticipants, fetchInstData]);

  const isAdmin = user?.role === 'ADMIN';
  const isAdminOrOrganizer = user?.role === 'ADMIN' || user?.role === 'ORGANIZER';

  const handleView = async (p) => {
    try {
      const res = await fetchDetails(p.id);
      setSelectedParticipant(res.data.data || res.data);
      setModalMode('view');
      setIsModalOpen(true);
    } catch (e) {
      showSnackbar('Failed to load details', 'error');
    }
  };

  const handleEdit = async (p) => {
    try {
      const res = await fetchDetails(p.id);
      setSelectedParticipant(res.data.data || res.data);
      setModalMode('edit');
      setIsModalOpen(true);
    } catch (e) {
      showSnackbar('Failed to load profile for editing', 'error');
    }
  };

  const handleSave = async (id, formData) => {
    try {
      await participantService.update(id, formData);
      showSnackbar('Participant profile updated successfully');
      setIsModalOpen(false);
      fetchParticipants();
    } catch (e) {
      showSnackbar(e.response?.data?.message || 'Update failed', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await participantService.delete(deleteTarget.id);
      showSnackbar('Participant removed from platform');
      fetchParticipants();
    } catch (e) {
      showSnackbar('Delete failed', 'error');
    }
    setDeleteTarget(null);
  };

  const filteredAndSorted = useMemo(() => {
    let result = (participants || []).filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesInst = instFilter === '' || p.institution?.name === instFilter;
      return matchesSearch && matchesInst;
    });

    result.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      if (sortOrder === 'asc') return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });

    return result;
  }, [participants, searchTerm, instFilter, sortOrder]);

  const paginated = filteredAndSorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Students Directory</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Registered participants across institutional partners
          </Typography>
        </Box>
        <Button 
          startIcon={<SortIcon />} 
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          variant="outlined"
          sx={{ textTransform: 'none', borderRadius: '10px', color: 'text.secondary', borderColor: 'divider' }}
        >
          Sort: {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
        </Button>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <SearchBar 
            onSearch={setSearchTerm} 
            placeholder="Search by student name or email..." 
          />
          <FormControl size="small" sx={{ width: 220 }}>
            <Select 
              displayEmpty value={instFilter} onChange={e => { setInstFilter(e.target.value); setPage(0); }}
              sx={{ backgroundColor: 'action.hover', borderRadius: '10px' }}
            >
              <MenuItem value="">All Institutions</MenuItem>
              {institutions.map(inst => <MenuItem key={inst.id} value={inst.name}>{inst.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden', backgroundColor: 'background.paper' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', py: 2 }}>STUDENT IDENTITY</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>AFFILIATION</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>CONTACT</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={rowsPerPage} cols={4} />
              ) : (
                paginated.map((p) => (
                  <TableRow key={p.id} hover sx={{ '& td': { py: 1.5 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {p.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.9rem' }}>{p.name}</Typography>
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>ID: #STU-{p.id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>{p.institution?.name}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{p.institution?.code}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', color: 'text.primary' }}>{p.email}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{p.phone || 'No phone'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleView(p)} sx={{ color: 'text.secondary', '&:hover': { color: '#3b82f6', bgcolor: 'action.hover' } }}><VisibilityIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      {isAdminOrOrganizer && (
                        <Tooltip title="Edit Profile">
                          <IconButton size="small" onClick={() => handleEdit(p)} sx={{ color: 'text.secondary', '&:hover': { color: '#3b82f6', bgcolor: 'action.hover' } }}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
                      {isAdmin && (
                        <Tooltip title="Decommission">
                          <IconButton size="small" onClick={() => setDeleteTarget(p)} sx={{ color: 'text.secondary', '&:hover': { color: '#ef4444', bgcolor: 'action.hover' } }}><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                    <Typography color="textSecondary">No participants found</Typography>
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

      {/* Profile Details/Edit Modal */}
      {selectedParticipant && (
        <ParticipantProfileModal
          open={isModalOpen}
          mode={modalMode}
          participant={selectedParticipant}
          institutions={institutions}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      <DeleteConfirmDialog 
        open={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        onConfirm={confirmDelete} 
        itemName={deleteTarget?.name} 
      />
    </Box>
  );
};

export default Participants;
