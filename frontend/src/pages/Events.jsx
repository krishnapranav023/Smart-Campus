import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getComputedStatus, getStatusStyle } from '../utils/eventStatus';
import useUrlSearchQuery from '../hooks/useUrlSearchQuery';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Tabs, Tab, 
  MenuItem, Select, FormControl, Dialog, DialogTitle, DialogContent, 
  DialogActions, TablePagination, Chip, Tooltip, Stack, TextField, Rating, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SortIcon from '@mui/icons-material/Sort';
import EventIcon from '@mui/icons-material/Event';

import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import SearchBar from '../components/SearchBar';
import { eventService } from '../services/eventService';
import api from '../api';
import TableSkeleton from '../components/TableSkeleton';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';


// Computed status options shown in the filter dropdown.
// value = what is sent to the backend API
// label = human-readable display text
const COMPUTED_ACTIVE_STATUSES = [
  { value: 'REGISTRATION_OPEN', label: 'Reg Open (≤30 days)' },
  { value: 'UPCOMING',          label: 'Upcoming (>30 days)' },
];
const COMPUTED_PAST_STATUSES = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];
const EVENT_TYPES = ["Technical", "Cultural", "Sports", "Management", "Literary", "ESports", "Robotics", "Innovation", "Design", "Finance", "Social Service", "Academic", "Arts"];


const buildDefaultDateTimes = () => {
  const start = new Date();
  start.setDate(start.getDate() + 7);
  start.setHours(9, 0, 0, 0);

  const end = new Date(start);
  end.setHours(17, 0, 0, 0);

  const toLocalInput = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return { startDate: toLocalInput(start), endDate: toLocalInput(end) };
};

const getApiErrorMessage = (error, fallback = 'Action failed') => {
  const data = error?.response?.data;
  if (data?.errors?.length) {
    return data.errors.map((entry) => `${entry.field}: ${entry.message}`).join(', ');
  }
  return data?.message || fallback;
};

const Events = () => {
  const navigate = useNavigate();
  const { showSnackbar, institutions, fetchInstitutions: fetchInstData, themeMode } = useApp();
  
  // Get logged in user role
  let currentUser = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) currentUser = JSON.parse(userStr);
  } catch (err) {
    console.error('Events user parse error:', err);
  }

  const isLight = themeMode === 'light';
  const isStudent = currentUser?.role === 'PARTICIPANT';
  const canManage = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'ORGANIZER');

  // State (Loaded from sessionStorage if returning from details page to preserve filters, tabs, page, and scroll position)
  const [searchTerm, setSearchTerm] = useUrlSearchQuery();
  const [statusFilter, setStatusFilter] = useState(() => sessionStorage.getItem('ev_statusFilter') || '');
  const [typeFilter, setTypeFilter] = useState(() => sessionStorage.getItem('ev_typeFilter') || '');
  const [yearFilter, setYearFilter] = useState(() => sessionStorage.getItem('ev_yearFilter') || '');
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('ev_activeTab');
    return saved !== null ? parseInt(saved, 10) : 0;
  }); 
  const [page, setPage] = useState(() => {
    const saved = sessionStorage.getItem('ev_page');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = sessionStorage.getItem('ev_rowsPerPage');
    return saved !== null ? parseInt(saved, 10) : 10;
  });
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', type: 'Technical', institutionId: '', 
    startDate: '', endDate: '', maxParticipants: 100, 
    description: '', venueId: '' 
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [venues, setVenues] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Sync services
  const { execute: fetchEvents, data: eventData = { data: [], pagination: {} }, loading } = useAsync(eventService.getAll);

  const loadEvents = useCallback(() => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      type: typeFilter || undefined
    };

    if (activeTab === 0) {
      params.status = statusFilter || 'UPCOMING,REGISTRATION_OPEN';
    } else {
      params.status = statusFilter || 'COMPLETED,CANCELLED';
      if (yearFilter) {
        params.year = yearFilter;
      }
    }

    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    fetchEvents(params);
  }, [page, rowsPerPage, searchTerm, statusFilter, typeFilter, yearFilter, activeTab, fetchEvents]);

  // Synchronize state filters to sessionStorage to enable detail-to-list return preservation
  useEffect(() => {
    sessionStorage.setItem('ev_statusFilter', statusFilter);
    sessionStorage.setItem('ev_typeFilter', typeFilter);
    sessionStorage.setItem('ev_yearFilter', yearFilter);
    sessionStorage.setItem('ev_activeTab', activeTab.toString());
    sessionStorage.setItem('ev_page', page.toString());
    sessionStorage.setItem('ev_rowsPerPage', rowsPerPage.toString());
  }, [statusFilter, typeFilter, yearFilter, activeTab, page, rowsPerPage]);

  useEffect(() => {
    loadEvents();
  }, [searchTerm, statusFilter, typeFilter, yearFilter, activeTab, page, rowsPerPage, loadEvents]);

  // Restore scroll position after events list loads successfully
  useEffect(() => {
    if (!loading && eventData.data?.length > 0) {
      const savedScroll = sessionStorage.getItem('ev_scrollPosition');
      if (savedScroll !== null) {
        window.scrollTo({
          top: parseInt(savedScroll, 10),
          behavior: 'instant'
        });
        // Clear saved scroll after restoring
        sessionStorage.removeItem('ev_scrollPosition');
      }
    }
  }, [loading, eventData]);

  useEffect(() => {
    fetchInstData();
  }, [fetchInstData]);

  useEffect(() => {
    if (!canManage) return;

    const loadVenues = async () => {
      try {
        const res = await api.get('/venues');
        setVenues(res.data?.data || res.data || []);
      } catch (err) {
        console.error('Failed to load venues:', err);
      }
    };

    loadVenues();
  }, [canManage]);

  const handleTabChange = (_, newTab) => {
    setActiveTab(newTab);
    setPage(0);
    setStatusFilter('');
    setYearFilter('');
    setSearchTerm('');
  };

  const getStatusChip = (evt) => {
    const computed = getComputedStatus(evt);
    const s = getStatusStyle(computed, isLight);
    return (
      <Chip 
        label={s.label} 
        size="small" 
        sx={{ 
          fontWeight: 800, fontSize: '0.65rem', borderRadius: '6px',
          backgroundColor: s.bg, color: s.text, border: 'none'
        }} 
      />
    );
  };

  const handleEditClick = (evt) => {
    setEditingEvent(evt.id);
    setFormErrors({});
    setFormData({
      title: evt.title || '',
      type: evt.type || 'Technical',
      institutionId: evt.institutionId || '',
      startDate: evt.startDate ? new Date(evt.startDate).toISOString().slice(0, 16) : '',
      endDate: evt.endDate ? new Date(evt.endDate).toISOString().slice(0, 16) : '',
      maxParticipants: evt.maxParticipants || 100,
      description: evt.description || '',
      venueId: evt.venueId || ''
    });
    setIsModalOpen(true);
  };

  const validateEventForm = () => {
    const errors = {};

    if (!formData.title?.trim() || formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }
    if (!formData.institutionId) {
      errors.institutionId = 'Select a host institution';
    }
    if (!formData.startDate) {
      errors.startDate = 'Opening ceremony date and time are required';
    }
    if (!formData.endDate) {
      errors.endDate = 'Closing ceremony date and time are required';
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.endDate = 'Closing ceremony must be after opening ceremony';
    }
    if (!formData.description?.trim() || formData.description.trim().length < 10) {
      errors.description = 'Briefing must be at least 10 characters';
    }
    if (!formData.maxParticipants || Number(formData.maxParticipants) <= 0) {
      errors.maxParticipants = 'Cap limit must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildEventPayload = () => ({
    title: formData.title.trim(),
    type: formData.type,
    description: formData.description.trim(),
    startDate: formData.startDate,
    endDate: formData.endDate,
    institutionId: Number(formData.institutionId),
    maxParticipants: Number(formData.maxParticipants),
    ...(formData.venueId ? { venueId: Number(formData.venueId) } : {}),
  });

  const handleSaveEvent = async () => {
    if (!validateEventForm()) {
      showSnackbar('Please fix the highlighted fields before deploying', 'error');
      return;
    }

    const payload = buildEventPayload();

    try {
      setSaving(true);
      if (editingEvent) {
        await eventService.update(editingEvent, payload);
        showSnackbar('Event updated successfully');
      } else {
        await eventService.create(payload);
        showSnackbar('Event created successfully');
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      setFormErrors({});
      loadEvents();
    } catch (e) {
      showSnackbar(getApiErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await eventService.delete(deleteTarget.id);
      showSnackbar('Event deleted successfully');
      loadEvents();
    } catch (e) {
      showSnackbar('Delete failed', 'error');
    }
    setDeleteTarget(null);
  };

  const handleRowClick = (eventId) => {
    // Save scroll position before navigating
    sessionStorage.setItem('ev_scrollPosition', window.scrollY.toString());
    navigate(`/events/${eventId}`);
  };

  const years = Array.from({ length: 11 }, (_, i) => 2016 + i);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary' }}>Events Catalog</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Browse hackathons, technical symposiums, and cultural events across partner institutions.
          </Typography>
        </Box>
        {canManage && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => { 
              setEditingEvent(null); 
              setFormErrors({});
              setFormData({ title: '', type: 'Technical', institutionId: '', ...buildDefaultDateTimes(), maxParticipants: 100, description: '', venueId: '' }); 
              setIsModalOpen(true); 
            }}
            sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700, backgroundColor: '#3b82f6', boxShadow: 'none', px: 3, '&:hover': { backgroundColor: '#2563eb', boxShadow: 'none' } }}
          >
            Deploy Event
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          indicatorColor="primary" 
          textColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Active & Ongoing" sx={{ textTransform: 'none', fontWeight: 700, py: 2 }} />
          <Tab label="Past Events" sx={{ textTransform: 'none', fontWeight: 700, py: 2 }} />
        </Tabs>

        {/* Filters */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 3 }} alignItems="center">
          <Box sx={{ width: { xs: '100%', md: '40%' } }}>
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search events by title..." />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: '60%' } }} justifyContent="flex-end" useFlexGap flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
              <Select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                displayEmpty
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {EVENT_TYPES.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {activeTab === 1 && (
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                <Select
                  value={yearFilter}
                  onChange={(e) => { setYearFilter(e.target.value); setPage(0); }}
                  displayEmpty
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="">All Years</MenuItem>
                  {years.map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                displayEmpty
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {(activeTab === 0 ? COMPUTED_ACTIVE_STATUSES : COMPUTED_PAST_STATUSES).map(s => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden', backgroundColor: 'background.paper' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', py: 2 }}>EVENT IDENTITY</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>HOST INSTITUTION</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>SCHEDULE & VENUE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>PARTICIPANTS</TableCell>
                {canManage && <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>ACTIONS</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={rowsPerPage} cols={canManage ? 6 : 5} />
              ) : (
                eventData.data?.length > 0 ? eventData.data.map((evt) => (
                  <TableRow 
                    key={evt.id} 
                    hover 
                    sx={{ cursor: 'pointer', '& td': { py: 2 } }}
                  >
                    <TableCell onClick={() => handleRowClick(evt.id)}>
                      <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem' }}>{evt.title}</Typography>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6' }}>{evt.type}</Typography>
                        {evt.feedback?.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Rating value={evt.feedback.reduce((acc, curr) => acc + curr.rating, 0) / evt.feedback.length} readOnly precision={0.1} size="small" sx={{ fontSize: '0.85rem' }} />
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: 'text.secondary' }}>
                              ({(evt.feedback.reduce((acc, curr) => acc + curr.rating, 0) / evt.feedback.length).toFixed(1)})
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(evt.id)}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary' }}>{evt.institution?.name}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{evt.institution?.code}</Typography>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(evt.id)}>
                      <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <CalendarMonthIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>
                            {new Date(evt.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.secondary' }}>{evt.venue?.name || 'Grand Arena'}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(evt.id)}>
                      {getStatusChip(evt)}
                    </TableCell>
                    <TableCell align="right" onClick={() => handleRowClick(evt.id)}>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                        <PeopleOutlineIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary' }}>
                          {evt._count?.registration || 0}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          / {evt.maxParticipants}
                        </Typography>
                      </Stack>
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit Event Details">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditClick(evt); }} sx={{ color: '#3b82f6' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Terminate Event">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteTarget(evt); }} sx={{ color: '#ef4444' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5} align="center" sx={{ py: 8 }}>
                      <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5, opacity: 0.4 }} />
                      <Typography variant="subtitle1" fontWeight={700} color="text.secondary">No events match filters</Typography>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {eventData.pagination?.total > 0 && (
          <TablePagination
            component="div"
            count={eventData.pagination.total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        )}
      </Paper>

      {/* Deploy Dialog */}
      {canManage && (
        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1, backgroundColor: 'background.paper' } }}>
          <DialogTitle sx={{ fontWeight: 900, fontSize: '1.4rem' }}>{editingEvent ? 'Modify Event Blueprint' : 'Deploy Event Blueprint'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <TextField fullWidth label="Event Title" error={!!formErrors.title} helperText={formErrors.title} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <Select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} sx={{ borderRadius: '12px' }}>
                      {EVENT_TYPES.map(t => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small" error={!!formErrors.institutionId}>
                    <Select displayEmpty value={formData.institutionId} onChange={e => setFormData({ ...formData, institutionId: e.target.value })} sx={{ borderRadius: '12px' }}>
                      <MenuItem value="">Select Host Institution</MenuItem>
                      {institutions.map(inst => (
                        <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <TextField fullWidth label="Opening Ceremony Date & Time" error={!!formErrors.startDate} helperText={formErrors.startDate} type="datetime-local" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              <TextField fullWidth label="Closing Ceremony Date & Time" error={!!formErrors.endDate} helperText={formErrors.endDate} type="datetime-local" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label="Max Participant Cap Limit" error={!!formErrors.maxParticipants} helperText={formErrors.maxParticipants} type="number" value={formData.maxParticipants} onChange={e => setFormData({ ...formData, maxParticipants: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <Select displayEmpty value={formData.venueId} onChange={e => setFormData({ ...formData, venueId: e.target.value })} sx={{ borderRadius: '12px' }}>
                      <MenuItem value="">Select Venue Location</MenuItem>
                      {venues.map(v => (
                        <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField fullWidth label="Briefing / Details" error={!!formErrors.description} helperText={formErrors.description} multiline rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={() => setIsModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEvent} disabled={saving} sx={{ backgroundColor: '#3b82f6', borderRadius: '12px', px: 4, fontWeight: 700, boxShadow: 'none', '&:hover': { backgroundColor: '#2563eb' } }}>
              {saving ? 'Saving...' : 'Deploy Event'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <DeleteConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} itemName={deleteTarget?.title} />
    </Box>
  );
};

export default Events;