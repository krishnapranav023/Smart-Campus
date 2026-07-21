import React, { useEffect, useState, useMemo } from 'react';
import useUrlSearchQuery from '../hooks/useUrlSearchQuery';
import { 
  Box, Typography, Grid, Paper, Button, Stack, FormControl, 
  Select, MenuItem, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, Card, CardContent, Chip, Tooltip, IconButton,
  Autocomplete, Divider, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Tabs, Tab
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import CloseIcon from '@mui/icons-material/Close';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import EventIcon from '@mui/icons-material/Event';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import LaunchIcon from '@mui/icons-material/Launch';

import api from '../api';
import { useApp } from '../context/AppContext';

const Winners = () => {
  const { showSnackbar, user, themeMode } = useApp();
  const isLight = themeMode === 'light';
  
  const canManage = user?.role === 'ADMIN' || user?.role === 'ORGANIZER';

  // Filters state
  const [search, setSearch] = useUrlSearchQuery();
  const [instFilter, setInstFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  // Winners data
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state for Event Cards
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);

  // Assign Winner Form State
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [segments, setSegments] = useState([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [position, setPosition] = useState('1');

  // Event Detail Modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeEventGroup, setActiveEventGroup] = useState(null);
  const [detailTab, setDetailTab] = useState(0); // 0 = Competitive Winners, 1 = Participants
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');

  // Certificate Viewer Modal
  const [certOpen, setCertOpen] = useState(false);
  const [activeCert, setActiveCert] = useState(null); // contains { user, event, segment, position } (position = null for participation)

  // Lists for Form
  const [events, setEvents] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  // Fetch Winners
  const loadWinners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/winners');
      setWinners(res.data.data || res.data || []);
    } catch (e) {
      showSnackbar('Failed to fetch winners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignFormData = async () => {
    try {
      const [evRes, instRes] = await Promise.all([
        api.get('/events?limit=200'),
        api.get('/institutions')
      ]);
      const rawEvents = evRes.data.data?.data || evRes.data.data || evRes.data || [];
      const allEvents = Array.isArray(rawEvents) ? rawEvents : [];
      const now = new Date();
      
      // Deduplicate events by ID and identify which completed events have/have not declared winners
      const winnerEventIds = new Set(winners.map(w => w.eventId));
      const uniqueEventsMap = new Map();
      
      allEvents.forEach(e => {
        if (e && e.id && !uniqueEventsMap.has(e.id)) {
          // Strictly exclude UPCOMING, REGISTRATION_OPEN, PROPOSED, CANCELLED
          // Only allow completed events (status === 'COMPLETED' or endDate < now)
          const isCompleted = e.status === 'COMPLETED' || (e.endDate && new Date(e.endDate) < now);
          if (isCompleted && e.status !== 'CANCELLED' && e.status !== 'PROPOSED') {
            const hasWinners = winnerEventIds.has(e.id) || (e.winner && e.winner.length > 0);
            uniqueEventsMap.set(e.id, { ...e, hasWinners });
          }
        }
      });

      // Sort: Completed events WITHOUT winners FIRST at top, then completed events WITH winners
      const sortedEventsList = Array.from(uniqueEventsMap.values()).sort((a, b) => {
        if (a.hasWinners === b.hasWinners) {
          return new Date(b.startDate) - new Date(a.startDate);
        }
        return a.hasWinners ? 1 : -1;
      });

      setEvents(sortedEventsList);
      
      const rawInsts = instRes.data.data || instRes.data || [];
      const allInsts = Array.isArray(rawInsts) ? rawInsts : [];
      setInstitutions(allInsts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadWinners();
  }, []);

  useEffect(() => {
    if (winners !== undefined) {
      loadAssignFormData();
    }
  }, [winners]);

  // Reset function to clear all form fields upon cancel or close
  const resetAssignForm = () => {
    setAssignOpen(false);
    setSelectedEvent(null);
    setSelectedSegmentId('');
    setSegments([]);
    setRegisteredStudents([]);
    setWinner1st(null);
    setWinner2nd(null);
    setWinner3rd(null);
  };

  // Fetch segments & students when event is selected (in Assign Winner Form)
  useEffect(() => {
    if (!selectedEvent) {
      setSegments([]);
      setRegisteredStudents([]);
      setSelectedSegmentId('');
      setWinner1st(null);
      setWinner2nd(null);
      setWinner3rd(null);
      return;
    }

    const fetchEventRelations = async () => {
      try {
        const [detRes, regRes] = await Promise.all([
          api.get(`/events/${selectedEvent.id}`),
          api.get(`/events/${selectedEvent.id}/registrations`)
        ]);
        const fullEvt = detRes.data.data || detRes.data;
        const availableSegments = fullEvt.segment || [];
        setSegments(availableSegments);
        
        const regs = regRes.data.data || regRes.data || [];
        const studentList = regs.map(r => r.user).filter(Boolean);
        setRegisteredStudents(studentList);

        // Auto-select first segment if available
        if (availableSegments.length > 0) {
          setSelectedSegmentId(availableSegments[0].id.toString());
        }
      } catch (e) {
        showSnackbar('Error loading event details', 'error');
      }
    };
    fetchEventRelations();
  }, [selectedEvent]);

  // When segment changes, pre-fill existing winners if they exist for this event + segment
  useEffect(() => {
    if (!selectedEvent || !selectedSegmentId || registeredStudents.length === 0) return;
    
    const sId = parseInt(selectedSegmentId);
    const existingForSegment = winners.filter(w => w.eventId === selectedEvent.id && w.segmentId === sId);
    
    const w1 = existingForSegment.find(w => w.position === 1);
    const w2 = existingForSegment.find(w => w.position === 2);
    const w3 = existingForSegment.find(w => w.position === 3);

    setWinner1st(w1 ? registeredStudents.find(s => s.id === w1.userId) || w1.user : null);
    setWinner2nd(w2 ? registeredStudents.find(s => s.id === w2.userId) || w2.user : null);
    setWinner3rd(w3 ? registeredStudents.find(s => s.id === w3.userId) || w3.user : null);
  }, [selectedSegmentId, selectedEvent, registeredStudents, winners]);

  // Load Registrations for Active Event Group (when details modal is opened)
  const fetchEventRegistrations = async (eventId) => {
    setLoadingRegs(true);
    try {
      const res = await api.get(`/events/${eventId}/registrations`);
      const regs = res.data.data || res.data || [];
      setEventRegistrations(regs.map(r => r.user));
    } catch (e) {
      console.error('Error fetching event registrations:', e);
    } finally {
      setLoadingRegs(false);
    }
  };

  useEffect(() => {
    if (activeEventGroup) {
      fetchEventRegistrations(activeEventGroup.id);
      setDetailTab(0);
      setParticipantSearch('');
    }
  }, [activeEventGroup]);

  // Separate participants who did not win any segment in this event
  const nonWinnerParticipants = useMemo(() => {
    if (!activeEventGroup) return [];
    const winnerUserIds = new Set(activeEventGroup.winners.map(w => w.userId));
    return eventRegistrations.filter(user => {
      if (!user) return false;
      if (instFilter && user.institutionId !== parseInt(instFilter)) return false;
      return !winnerUserIds.has(user.id);
    });
  }, [eventRegistrations, activeEventGroup, instFilter]);

  // Filter non-winner participants by user search query (name, email, institution name/code)
  const filteredParticipants = useMemo(() => {
    if (!participantSearch.trim()) return nonWinnerParticipants;
    const q = participantSearch.toLowerCase().trim();
    return nonWinnerParticipants.filter(user => 
      (user.name && user.name.toLowerCase().includes(q)) ||
      (user.email && user.email.toLowerCase().includes(q)) ||
      (user.institution?.name && user.institution.name.toLowerCase().includes(q)) ||
      (user.institution?.code && user.institution.code.toLowerCase().includes(q))
    );
  }, [nonWinnerParticipants, participantSearch]);

  const filteredWinners = useMemo(() => {
    if (!activeEventGroup) return [];
    return activeEventGroup.winners.filter(win => !instFilter || win.user?.institutionId === parseInt(instFilter));
  }, [activeEventGroup, instFilter]);

  // All-in-one Winner Form State (1st, 2nd, 3rd)
  const [winner1st, setWinner1st] = useState(null);
  const [winner2nd, setWinner2nd] = useState(null);
  const [winner3rd, setWinner3rd] = useState(null);

  const handleAssignWinner = async () => {
    if (!selectedEvent || !selectedSegmentId) {
      showSnackbar('Please select an event and segment', 'error');
      return;
    }
    if (!winner1st && !winner2nd && !winner3rd) {
      showSnackbar('Please select at least one podium winner (1st, 2nd, or 3rd)', 'error');
      return;
    }

    const winnersPayload = [];
    if (winner1st) winnersPayload.push({ userId: winner1st.id, position: 1 });
    if (winner2nd) winnersPayload.push({ userId: winner2nd.id, position: 2 });
    if (winner3rd) winnersPayload.push({ userId: winner3rd.id, position: 3 });

    try {
      await api.post('/winners/bulk', {
        eventId: selectedEvent.id,
        segmentId: parseInt(selectedSegmentId),
        winners: winnersPayload
      });
      showSnackbar('Podium winners assigned successfully!', 'success');
      setAssignOpen(false);
      setSelectedEvent(null);
      setSelectedSegmentId('');
      setWinner1st(null);
      setWinner2nd(null);
      setWinner3rd(null);
      loadWinners();
    } catch (e) {
      showSnackbar(e.response?.data?.message || 'Failed to assign winners', 'error');
    }
  };

  // Group events and attach winners if they exist
  const groupedEvents = useMemo(() => {
    const winnersMap = {};
    winners.forEach(w => {
      if (!w.eventId) return;
      if (!winnersMap[w.eventId]) {
        winnersMap[w.eventId] = [];
      }
      winnersMap[w.eventId].push(w);
    });

    return events
      .map(event => {
        const eventWinners = winnersMap[event.id] || [];
        // Sort winners inside group by segment, then position
        const sortedWinners = [...eventWinners].sort((a, b) => {
          if (a.segmentId !== b.segmentId) return a.segmentId - b.segmentId;
          return a.position - b.position;
        });

        return {
          id: event.id,
          event: event,
          winners: sortedWinners
        };
      })
      .filter(group => {
        const matchesSearch = group.event.title.toLowerCase().includes(search.toLowerCase()) ||
                             group.winners.some(w => w.user?.name?.toLowerCase().includes(search.toLowerCase()));
        
        const matchesInst = !instFilter || 
                            group.event.institutionId === parseInt(instFilter) ||
                            group.winners.some(w => w.user?.institutionId === parseInt(instFilter));
                            
        const matchesYear = !yearFilter || new Date(group.event.startDate).getFullYear().toString() === yearFilter;
        return matchesSearch && matchesInst && matchesYear;
      })
      .sort((a, b) => new Date(b.event.startDate) - new Date(a.event.startDate));
  }, [events, winners, search, instFilter, yearFilter]);

  // Paginated Event Groups
  const paginatedGroups = useMemo(() => {
    const start = page * rowsPerPage;
    return groupedEvents.slice(start, start + rowsPerPage);
  }, [groupedEvents, page, rowsPerPage]);

  // Theme styling configurations by Position (Gold, Silver, Bronze, Participation)
  const getThemeConfig = (pos) => {
    if (pos === 1) {
      return {
        label: 'Gold Medalist',
        medalText: '1st Place (Winner)',
        primary: '#846215', // Gold
        accent: '#d4af37',
        bg: isLight ? '#fef9c3' : 'rgba(234,179,8,0.18)',
        waxColor: '#d4af37',
        textStyle: 'CERTIFICATE OF MERIT',
        descText: 'for securing a podium finish of 1st Place (Winner)'
      };
    }
    if (pos === 2) {
      return {
        label: 'Silver Medalist',
        medalText: '2nd Place',
        primary: '#475569', // Silver
        accent: '#94a3b8',
        bg: isLight ? '#f1f5f9' : 'rgba(148,163,184,0.18)',
        waxColor: '#94a3b8',
        textStyle: 'CERTIFICATE OF MERIT',
        descText: 'for securing a podium finish of 2nd Place'
      };
    }
    if (pos === 3) {
      return {
        label: 'Bronze Medalist',
        medalText: '3rd Place',
        primary: '#7c2d12', // Bronze
        accent: '#c2410c',
        bg: isLight ? '#ffedd5' : 'rgba(217,119,6,0.18)',
        waxColor: '#c2410c',
        textStyle: 'CERTIFICATE OF MERIT',
        descText: 'for securing a podium finish of 3rd Place'
      };
    }
    // Participation (No Position)
    return {
      label: 'Participant',
      medalText: 'Participation',
      primary: '#1e3a8a', // Deep Blue
      accent: '#3b82f6',
      bg: isLight ? '#eff6ff' : 'rgba(59,130,246,0.15)',
      waxColor: '#3b82f6',
      textStyle: 'CERTIFICATE OF PARTICIPATION',
      descText: 'for active and valued participation'
    };
  };

  const handlePrintCert = () => {
    const printContent = document.getElementById("certificate-print-area").innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    window.location.reload();
  };

  // Convert SVG to PNG canvas and trigger client download
  const handleDownloadPNG = () => {
    const svgElement = document.querySelector("#certificate-svg");
    if (!svgElement) {
      showSnackbar('Error downloading certificate: Template not loaded', 'error');
      return;
    }

    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1600; // High quality double-size resolution
        canvas.height = 1200;
        const context = canvas.getContext("2d");
        
        // Draw image onto canvas
        context.drawImage(image, 0, 0, 1600, 1200);

        const png = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = png;
        const name = activeCert.user?.name || 'Certificate';
        downloadLink.download = `Certificate_${name.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobURL);
        showSnackbar('Certificate downloaded successfully!', 'success');
      };
      image.src = blobURL;
    } catch (err) {
      console.error('Download error:', err);
      showSnackbar('Download failed due to canvas rendering constraints', 'error');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">Winners &amp; Achievements</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Choose an event to view podium finishers, participation certificates, and awards
          </Typography>
        </Box>
        {canManage && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setAssignOpen(true)}
            sx={{ backgroundColor: '#3b82f6', textTransform: 'none', borderRadius: '10px', px: 2.5, fontWeight: 700, boxShadow: 'none', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            Assign Winner
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search event name, winner name..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1.5} justifyContent={{ md: 'flex-end' }}>
              <FormControl size="small" sx={{ width: { xs: '65%', md: 240 } }}>
                <Select 
                  displayEmpty value={instFilter} onChange={e => { setInstFilter(e.target.value); setPage(0); }}
                  sx={{ backgroundColor: 'action.hover', borderRadius: '10px' }}
                >
                  <MenuItem value="">All Colleges</MenuItem>
                  {institutions.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ width: { xs: '35%', md: 140 } }}>
                <Select 
                  displayEmpty value={yearFilter} onChange={e => { setYearFilter(e.target.value); setPage(0); }}
                  sx={{ backgroundColor: 'action.hover', borderRadius: '10px' }}
                >
                  <MenuItem value="">All Years</MenuItem>
                  {['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016'].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Events Grid */}
      {loading ? (
        <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>
      ) : groupedEvents.length === 0 ? (
        <Paper elevation={0} sx={{ py: 10, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4, mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary">No event winner records found</Typography>
          <Typography variant="body2" color="text.secondary">Try adjusting your filters or search terms</Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3} mb={3}>
            {paginatedGroups.map(group => {
              // Group podium list strictly by Segment to clearly distinguish segment winners
              const segmentGroups = {};
              group.winners.forEach(w => {
                if (instFilter && w.user?.institutionId !== parseInt(instFilter)) return;
                const segName = w.segment?.name || 'General';
                if (!segmentGroups[segName]) segmentGroups[segName] = [];
                segmentGroups[segName].push(w);
              });

              return (
                <Grid item xs={12} sm={6} md={4} key={group.id}>
                  <Card 
                    elevation={0}
                    onClick={() => { setActiveEventGroup(group); setDetailOpen(true); }}
                    sx={{ 
                      borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%',
                      backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column',
                      cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderColor: '#3b82f6' }
                    }}
                  >
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {/* Top Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ maxWidth: '85%' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineBreak: 'anywhere' }}>
                            {group.event.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, fontWeight: 600 }}>
                            <CorporateFareIcon sx={{ fontSize: 14 }} /> Host: {group.event.institution?.code || 'N/A'}
                          </Typography>
                        </Box>
                        <EmojiEventsIcon sx={{ color: '#eab308', fontSize: 26 }} />
                      </Box>

                      <Divider sx={{ my: 1.5, borderColor: 'divider' }} />

                       {/* Winners preview grouped by segment */}
                       <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                         WINNERS BY SEGMENT
                       </Typography>
 
                       <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                         {group.winners.length === 0 ? (
                           <Box sx={{ py: 2, textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                               {new Date(group.event.startDate) > new Date()
                                 ? 'Winners not declared yet (Upcoming Event).'
                                 : 'No podium winners declared. General participation certificates available.'}
                             </Typography>
                           </Box>
                         ) : (
                           Object.entries(segmentGroups).slice(0, 2).map(([segName, winnersList]) => (
                             <Box key={segName}>
                               <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                                 {segName.toUpperCase()}
                               </Typography>
                               <Stack spacing={0.6}>
                                 {winnersList.slice(0, 2).map(w => {
                                   const emoji = w.position === 1 ? '🥇' : w.position === 2 ? '🥈' : '🥉';
                                   return (
                                     <Box key={w.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 1 }}>
                                       <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.75rem' }}>
                                         {emoji} {w.user?.name}
                                       </Typography>
                                       <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                                         {w.user?.institution?.code}
                                       </Typography>
                                     </Box>
                                   );
                                 })}
                               </Stack>
                             </Box>
                           ))
                         )}
                         {group.winners.length > 4 && (
                           <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, pt: 0.5 }}>
                             + View all {group.winners.length} achievements
                          </Typography>
                        )}
                      </Stack>

                      {/* Footer */}
                      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                          <EventIcon sx={{ fontSize: 14 }} /> 
                          {new Date(group.event.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </Typography>
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          Open Awards <LaunchIcon sx={{ fontSize: 12 }} />
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={groupedEvents.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[9, 18, 36, 90]}
            sx={{
              borderTop: '1px solid', borderColor: 'divider',
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { color: 'text.secondary', fontWeight: 600 }
            }}
          />
        </>
      )}

      {/* Event Winners & Participants Details Modal */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: 0, sm: 4 },
            p: 0,
            m: { xs: 0, sm: 2 },
            width: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
            backgroundColor: 'background.paper',
            overflow: 'hidden'
          }
        }}
      >
        {activeEventGroup && (
          <>
            <DialogTitle component="div" sx={{ m: 0, p: { xs: 2, sm: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ pr: 2 }}>
                <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{activeEventGroup.event.title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5, mt: 0.5, fontWeight: 600 }}>
                  <CorporateFareIcon sx={{ fontSize: 14 }} /> Host: {activeEventGroup.event.institution?.name} • {new Date(activeEventGroup.event.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
              </Box>
              <IconButton onClick={() => setDetailOpen(false)} sx={{ flexShrink: 0 }}><CloseIcon /></IconButton>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1, sm: 3 }, pt: 1 }}>
              <Tabs 
                value={detailTab} 
                onChange={(_, val) => setDetailTab(val)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label={`Competitive Awards (${filteredWinners.length})`} sx={{ textTransform: 'none', fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.875rem' } }} />
                <Tab label={`Participants List (${nonWinnerParticipants.length})`} sx={{ textTransform: 'none', fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.875rem' } }} />
              </Tabs>
            </Box>
            
            <DialogContent sx={{ p: { xs: 2, sm: 4 }, minHeight: 300 }}>
              {/* TAB 0: COMPETITIVE WINNERS (GOLD, SILVER, BRONZE PER SEGMENT) */}
              {detailTab === 0 && (
                filteredWinners.length === 0 ? (
                  <Box sx={{ py: 6, px: 2, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <WorkspacePremiumIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: 'text.primary' }}>
                      {instFilter 
                        ? 'No Winners from the Selected College' 
                        : (new Date(activeEventGroup.event.startDate) > new Date()
                          ? 'Winners Not Declared Yet (Upcoming Event)'
                          : 'No Podium Winners Declared')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                      {instFilter 
                        ? 'There are no podium winners from the selected college for this event.' 
                        : (new Date(activeEventGroup.event.startDate) > new Date()
                          ? 'This event is scheduled for the future. Winners will be declared once the event is completed.'
                          : 'No competitive podium winners have been assigned for this event. All participants are eligible for certificates of participation in the next tab.')}
                    </Typography>
                    <Button variant="contained" onClick={() => setDetailTab(1)} sx={{ textTransform: 'none', backgroundColor: '#3b82f6', fontWeight: 700, borderRadius: '8px' }}>
                      View Participants List
                    </Button>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 500 }}>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>SEGMENT</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>RANK MEDAL</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>WINNER NAME</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>INSTITUTION</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', pr: 2 }}>CERTIFICATE</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredWinners.map(win => {
                          const themeInfo = getThemeConfig(win.position);
                          return (
                            <TableRow key={win.id} hover sx={{ '& td': { py: 1.5 } }}>
                              <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {win.segment?.name || 'General'}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={themeInfo.medalText}
                                  size="small"
                                  sx={{ 
                                    bgcolor: themeInfo.bg, color: themeInfo.primary, 
                                    fontWeight: 800, borderRadius: '6px', fontSize: '0.75rem' 
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>
                                {win.user?.name}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>
                                {win.user?.institution?.name} ({win.user?.institution?.code})
                              </TableCell>
                              <TableCell align="right" sx={{ pr: 2 }}>
                                <Button 
                                  variant="outlined" 
                                  size="small"
                                  startIcon={<WorkspacePremiumIcon />}
                                  onClick={() => { setActiveCert(win); setCertOpen(true); }}
                                  sx={{ 
                                    textTransform: 'none', borderRadius: '8px', fontWeight: 700,
                                    borderColor: 'divider', color: 'text.primary',
                                    '&:hover': { borderColor: '#3b82f6', color: '#3b82f6', bgcolor: 'rgba(59,130,246,0.04)' }
                                  }}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )
              )}

              {/* TAB 1: PARTICIPANTS (ELIGIBLE FOR PARTICIPATION CERTIFICATES) */}
              {detailTab === 1 && (
                loadingRegs ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress size={30} /></Box>
                ) : (
                  <Stack spacing={2.5}>
                    {/* Search Bar for Participants */}
                    <TextField
                      size="small"
                      placeholder="Search participants..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                      }}
                      sx={{
                        width: '100%',
                        maxWidth: 400,
                        '& .MuiOutlinedInput-root': { borderRadius: '10px' }
                      }}
                    />

                    {filteredParticipants.length === 0 ? (
                      <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
                        {participantSearch ? 'No participants matching your search.' : 'No other registered participants recorded for this event.'}
                      </Typography>
                    ) : (
                      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflowX: 'auto' }}>
                        <Table size="small" sx={{ minWidth: 500 }}>
                          <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>PARTICIPANT NAME</TableCell>
                              <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>EMAIL ADDRESS</TableCell>
                              <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>INSTITUTION</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', pr: 2 }}>CERTIFICATE</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredParticipants.map(user => (
                              <TableRow key={user.id} hover sx={{ '& td': { py: 1.5 } }}>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>
                                  {user.name}
                                </TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                  {user.email}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>
                                  {user.institution?.name} ({user.institution?.code})
                                </TableCell>
                                <TableCell align="right" sx={{ pr: 3 }}>
                                  <Button 
                                    variant="outlined" 
                                    size="small"
                                    startIcon={<WorkspacePremiumIcon />}
                                    onClick={() => { 
                                      // Pass null position to represent a general Participation Certificate
                                      setActiveCert({
                                        user,
                                        event: activeEventGroup.event,
                                        segment: { name: 'General Event Attendance' },
                                        position: null 
                                      }); 
                                      setCertOpen(true); 
                                    }}
                                    sx={{ 
                                      textTransform: 'none', borderRadius: '8px', fontWeight: 700,
                                      borderColor: 'divider', color: 'text.primary',
                                      '&:hover': { borderColor: '#3b82f6', color: '#3b82f6', bgcolor: 'rgba(59,130,246,0.04)' }
                                    }}
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Stack>
                )
              )}
            </DialogContent>
            
            <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={() => setDetailOpen(false)} variant="outlined" sx={{ textTransform: 'none', borderRadius: '8px' }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* All-in-One Assign Segment Award Dialog */}
      <Dialog open={assignOpen} onClose={resetAssignForm} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1, backgroundColor: 'background.paper' } }}>
        <DialogTitle component="div" sx={{ fontWeight: 900, fontSize: '1.4rem', color: 'text.primary', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">Declare Event Podium Winners</Typography>
            <Typography variant="caption" color="text.secondary">Select event, segment, and assign Gold, Silver, & Bronze winners in one step.</Typography>
          </Box>
          <IconButton onClick={resetAssignForm}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={events}
                  getOptionLabel={option => option ? `${option.title} (${option.institution?.code || 'Event'})` : ''}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  value={selectedEvent}
                  onChange={(_, value) => {
                    setSelectedEvent(value);
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, px: 2 }}>
                      <Box>
                        <Typography 
                          variant="body2" 
                          fontWeight="800" 
                          sx={{ color: !option.hasWinners ? '#d97706' : 'text.primary' }}
                        >
                          {option.title} {!option.hasWinners ? '• (Pending Winners)' : ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.institution?.name} ({option.institution?.code})
                        </Typography>
                      </Box>
                      {!option.hasWinners && (
                        <Typography variant="caption" fontWeight="800" sx={{ color: '#d97706', fontSize: '0.75rem' }}>
                          Needs Declaration
                        </Typography>
                      )}
                    </Box>
                  )}
                  renderInput={params => <TextField {...params} label="1. Select Event" fullWidth placeholder="Type event name..." />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!selectedEvent}>
                  <Select
                    value={selectedSegmentId}
                    onChange={e => setSelectedSegmentId(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>2. Choose Segment / Track</MenuItem>
                    {segments.map(seg => <MenuItem key={seg.id} value={seg.id}>{seg.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {selectedEvent && (
              <Box sx={{ p: 2, bgcolor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="700">AUTOMATIC PARTICIPANT LIST FILTERED FROM EVENT REGISTRATION</Typography>
                  <Typography variant="body2" color="primary.main" fontWeight="800">
                    {registeredStudents.length} Verified Registered Participants
                  </Typography>
                </Box>
                {selectedEvent.hasWinners && (
                  <Chip label="Editing Existing Winners" color="info" size="small" sx={{ fontWeight: 800 }} />
                )}
              </Box>
            )}

            <Divider />

            <Typography variant="subtitle2" fontWeight="800">3. Assign Podium Positions (Gold, Silver, Bronze)</Typography>

            <Grid container spacing={2}>
              {/* 1st Place Gold */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '2px solid #eab308', bgcolor: isLight ? '#fefce8' : 'rgba(234, 179, 8, 0.05)' }}>
                  <Chip label="1st Place (Gold 🥇)" size="small" sx={{ bgcolor: '#fef08a', color: '#854d0e', fontWeight: 800, mb: 1.5 }} />
                  <Autocomplete
                    disabled={!selectedEvent || registeredStudents.length === 0}
                    options={registeredStudents.filter(s => s.id !== winner2nd?.id && s.id !== winner3rd?.id)}
                    getOptionLabel={option => option ? `${option.name} (${option.institution?.code || 'Student'})` : ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    value={winner1st}
                    onChange={(_, value) => setWinner1st(value)}
                    renderInput={params => <TextField {...params} size="small" placeholder="Select 1st Place" />}
                  />
                </Paper>
              </Grid>

              {/* 2nd Place Silver */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '2px solid #94a3b8', bgcolor: isLight ? '#f8fafc' : 'rgba(148, 163, 184, 0.05)' }}>
                  <Chip label="2nd Place (Silver 🥈)" size="small" sx={{ bgcolor: '#e2e8f0', color: '#334155', fontWeight: 800, mb: 1.5 }} />
                  <Autocomplete
                    disabled={!selectedEvent || registeredStudents.length === 0}
                    options={registeredStudents.filter(s => s.id !== winner1st?.id && s.id !== winner3rd?.id)}
                    getOptionLabel={option => option ? `${option.name} (${option.institution?.code || 'Student'})` : ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    value={winner2nd}
                    onChange={(_, value) => setWinner2nd(value)}
                    renderInput={params => <TextField {...params} size="small" placeholder="Select 2nd Place" />}
                  />
                </Paper>
              </Grid>

              {/* 3rd Place Bronze */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '2px solid #b45309', bgcolor: isLight ? '#fff7ed' : 'rgba(180, 83, 9, 0.05)' }}>
                  <Chip label="3rd Place (Bronze 🥉)" size="small" sx={{ bgcolor: '#ffedd5', color: '#9a3412', fontWeight: 800, mb: 1.5 }} />
                  <Autocomplete
                    disabled={!selectedEvent || registeredStudents.length === 0}
                    options={registeredStudents.filter(s => s.id !== winner1st?.id && s.id !== winner2nd?.id)}
                    getOptionLabel={option => option ? `${option.name} (${option.institution?.code || 'Student'})` : ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    value={winner3rd}
                    onChange={(_, value) => setWinner3rd(value)}
                    renderInput={params => <TextField {...params} size="small" placeholder="Select 3rd Place" />}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={resetAssignForm} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAssignWinner} 
            disabled={!selectedEvent || !selectedSegmentId}
            sx={{ backgroundColor: '#2563eb', borderRadius: '12px', px: 4, py: 1, fontWeight: 800, boxShadow: 'none', '&:hover': { backgroundColor: '#1d4ed8' } }}
          >
            Submit Podium Awards
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upgraded Certificate Viewer Modal */}
      <Dialog 
        open={certOpen} 
        onClose={() => setCertOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 0, overflow: 'hidden', backgroundColor: 'background.paper' } }}
      >
        <DialogTitle component="div" sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">Digital Certificate Preview</Typography>
          <IconButton onClick={() => setCertOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 4 }, display: 'flex', justifyContent: 'center', backgroundColor: isLight ? '#f1f5f9' : '#090d16', overflowX: 'auto' }}>
          {activeCert && (() => {
            const tc = getThemeConfig(activeCert.position);
            return (
              <Box id="certificate-print-area" sx={{ boxShadow: '0 10px 40px rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden', width: '100%', maxWidth: 760, display: 'flex', justifyContent: 'center' }}>
                <svg id="certificate-svg" width="800" height="600" viewBox="0 0 800 600" style={{ fontFamily: 'Georgia, serif', display: 'block', maxWidth: '100%', height: 'auto' }}>
                  {/* Background base */}
                  <rect width="800" height="600" fill="#fdfbf7" />
                  
                  {/* Vintage Watermark Background Pattern themed to the Medal type */}
                  <g opacity="0.04">
                    <path d="M 0 0 L 800 600 M 800 0 L 0 600" stroke={tc.primary} strokeWidth="2"/>
                    <circle cx="400" cy="300" r="220" fill="none" stroke={tc.primary} strokeWidth="1.5" strokeDasharray="5,5" />
                    <circle cx="400" cy="300" r="180" fill="none" stroke={tc.primary} strokeWidth="3" />
                  </g>

                  {/* Double Colored Borders */}
                  <rect x="25" y="25" width="750" height="550" fill="none" stroke={tc.primary} strokeWidth="5" />
                  <rect x="35" y="35" width="730" height="530" fill="none" stroke={tc.accent} strokeWidth="1.5" />
                  <rect x="42" y="42" width="716" height="516" fill="none" stroke={tc.primary} strokeWidth="1" strokeDasharray="3,3" />

                  {/* Stylized Corner Ornaments themed to Medal */}
                  {/* Top-Left */}
                  <path d="M 25 60 L 60 25 M 25 75 L 75 25 M 35 35 L 35 90 M 35 35 L 90 35" stroke={tc.primary} strokeWidth="1.5" fill="none" />
                  {/* Top-Right */}
                  <path d="M 775 60 L 740 25 M 775 75 L 725 25 M 765 35 L 765 90 M 765 35 L 710 35" stroke={tc.primary} strokeWidth="1.5" fill="none" />
                  {/* Bottom-Left */}
                  <path d="M 25 540 L 60 575 M 25 525 L 75 575 M 35 565 L 35 510 M 35 565 L 90 565" stroke={tc.primary} strokeWidth="1.5" fill="none" />
                  {/* Bottom-Right */}
                  <path d="M 775 540 L 740 575 M 775 525 L 725 575 M 765 565 L 765 510 M 765 565 L 710 565" stroke={tc.primary} strokeWidth="1.5" fill="none" />

                  {/* Header Text */}
                  <text x="400" y="85" textAnchor="middle" fontSize="11" fontWeight="bold" fill={tc.primary} letterSpacing="3">
                    NATIONAL INTER-UNIVERSITY ALLIANCE
                  </text>
                  <text x="400" y="125" textAnchor="middle" fontSize="28" fontWeight="800" fill="#1e293b" letterSpacing="2">
                    {tc.textStyle}
                  </text>
                  
                  <line x1="300" y1="145" x2="500" y2="145" stroke={tc.primary} strokeWidth="1.5" />
                  <circle cx="400" cy="145" r="4" fill={tc.primary} />

                  {/* Subtitle */}
                  <text x="400" y="185" textAnchor="middle" fontSize="14" fontStyle="italic" fill="#64748b">
                    This is proudly presented to
                  </text>

                  {/* Recipient Name */}
                  <text x="400" y="250" textAnchor="middle" fontSize="32" fontWeight="bold" fill={tc.primary} fontStyle="italic">
                    {activeCert.user?.name}
                  </text>

                  {/* Body Text */}
                  <text x="400" y="305" textAnchor="middle" fontSize="15" fill="#475569">
                    from <tspan fontWeight="bold" fill="#1e293b">{activeCert.user?.institution?.name || 'Academic Institution'}</tspan>
                  </text>

                  <text x="400" y="345" textAnchor="middle" fontSize="16" fill="#475569">
                    {tc.descText}
                  </text>

                  <text x="400" y="380" textAnchor="middle" fontSize="15" fill="#475569">
                    in the segment <tspan fontWeight="bold" fill="#1e293b">"{activeCert.segment?.name}"</tspan> at the national event
                  </text>

                  {/* Event Title */}
                  <text x="400" y="420" textAnchor="middle" fontSize="22" fontWeight="800" fill={tc.primary}>
                    {activeCert.event?.title}
                  </text>

                  <text x="400" y="455" textAnchor="middle" fontSize="13" fill="#64748b">
                    Conducted on {new Date(activeCert.event?.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </text>

                  {/* Wax Seal Ribbon (Themed Color Ribbon) */}
                  <g transform="translate(180, 510)">
                    {/* Ribbons */}
                    <path d="M -10 -5 L -20 40 L 0 35 L 20 40 L 10 -5" fill={tc.accent} opacity="0.8"/>
                    <path d="M 0 -5 L 15 45 L 0 38 L -15 45 L 0 -5" fill={tc.primary} opacity="0.9"/>
                    {/* Wax Seal Circles */}
                    <circle cx="0" cy="0" r="30" fill={tc.primary} />
                    <circle cx="0" cy="0" r="26" fill={tc.accent} />
                    <circle cx="0" cy="0" r="22" fill={tc.primary} />
                    {activeCert.position ? (
                      <polygon points="0,-12 3,-3 12,-3 5,3 8,12 0,6 -8,12 -5,3 -12,-3 -3,-3" fill={tc.accent} />
                    ) : (
                      // Participation ribbon star
                      <circle cx="0" cy="0" r="6" fill={tc.accent} />
                    )}
                  </g>

                  {/* Signatures */}
                  <g transform="translate(280, 520)">
                    <text x="0" y="-12" textAnchor="middle" fontSize="18" fontStyle="italic" fill="#1d4ed8">
                      {activeCert.event?.institution?.code || 'Host'} Coord.
                    </text>
                    <line x1="-70" y1="0" x2="70" y2="0" stroke="#94a3b8" strokeWidth="1" />
                    <text x="0" y="15" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">EVENT COORDINATOR</text>
                  </g>

                  <g transform="translate(540, 520)">
                    <text x="0" y="-12" textAnchor="middle" fontSize="18" fontStyle="italic" fill="#1d4ed8">
                      MIP Authority
                    </text>
                    <line x1="-70" y1="0" x2="70" y2="0" stroke="#94a3b8" strokeWidth="1" />
                    <text x="0" y="15" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">PLATFORM AUTHORITY</text>
                  </g>

                  {/* Secure Verification Hash */}
                  <text x="750" y="550" textAnchor="end" fontSize="9" fill="#94a3b8" style={{ fontFamily: 'monospace' }}>
                    SECURE ID: MIP-CERT-{activeCert.id || 'P'}-{new Date(activeCert.event?.startDate).getFullYear()}
                  </text>
                </svg>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1.5 }}>
          <Button onClick={() => setCertOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Close</Button>
          <Button 
            variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintCert}
            sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700, borderColor: 'divider', color: 'text.primary' }}
          >
            Print
          </Button>
          <Button 
            variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadPNG}
            sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700, backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            Download PNG
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Winners;
