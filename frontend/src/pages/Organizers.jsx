import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useUrlSearchQuery from '../hooks/useUrlSearchQuery';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, MenuItem, Select, FormControl, IconButton, 
  TablePagination, Chip, Tooltip, Button, Avatar, CircularProgress, Stack
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchBar from '../components/SearchBar';

import api from '../api';
import useAsync from '../hooks/useAsync';

const Organizers = () => {
  const [searchTerm, setSearchTerm] = useUrlSearchQuery();
  const [instFilter, setInstFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Stable API fetch functions
  const fetchOrganizersReq = useCallback(() => api.get('/organizers'), []);
  const fetchInstitutionsReq = useCallback(() => api.get('/institutions'), []);

  const { execute: fetchOrganizers, data: organizers = [], loading } = useAsync(fetchOrganizersReq);
  const { execute: fetchInstitutions, data: institutions = [] } = useAsync(fetchInstitutionsReq);

  useEffect(() => { 
    fetchOrganizers(); 
    fetchInstitutions();
  }, [fetchOrganizers, fetchInstitutions]);

  const filteredAndSorted = useMemo(() => {
    let result = (organizers || []).filter(o => {
      const matchesSearch = o.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           o.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesInst = instFilter === '' || o.institutionId === parseInt(instFilter);
      return matchesSearch && matchesInst;
    });

    result.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      if (sortOrder === 'asc') return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });

    return result;
  }, [organizers, searchTerm, instFilter, sortOrder]);

  const paginated = filteredAndSorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Event Organizers</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Faculty members coordinating inter-institutional collaborations
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
            placeholder="Search organizers..." 
          />
          <FormControl size="small" sx={{ width: 220 }}>
            <Select 
              displayEmpty value={instFilter} 
              onChange={e => { setInstFilter(e.target.value); setPage(0); }}
              sx={{ backgroundColor: 'action.hover', borderRadius: '10px' }}
              startAdornment={<FilterListIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />}
            >
              <MenuItem value="">All Institutions</MenuItem>
              {institutions.map((i) => (
                <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
              ))}
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
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>AFFILIATION</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && organizers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((o) => (
                  <TableRow key={o.id} hover sx={{ '& td': { py: 1.5 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px' }}>
                          {o.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.9rem' }}>{o.name}</Typography>
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{o.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={o.institution?.name || 'External'} 
                        size="small" 
                        sx={{ bgcolor: 'action.hover', color: 'text.primary', fontWeight: 600, fontSize: '0.75rem' }} 
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 500 }}>
                      {o._count?.events || 0} Active Events
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Profile">
                        <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: '#3b82f6', bgcolor: 'action.hover' } }}><VisibilityIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                    <Typography color="textSecondary">No organizers found</Typography>
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
    </Box>
  );
};

export default Organizers;
