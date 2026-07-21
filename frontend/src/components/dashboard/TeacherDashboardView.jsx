import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button, IconButton,
  CircularProgress, Stack, Tooltip
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import RateReviewIcon from '@mui/icons-material/RateReview';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StarIcon from '@mui/icons-material/Star';

import api from '../../api';
import { useApp } from '../../context/AppContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid } from 'recharts';

const TeacherDashboardView = () => {
  const navigate = useNavigate();
  const { showSnackbar, themeMode } = useApp();
  const isLight = themeMode === 'light';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/organizers/dashboard-stats');
      setStats(res.data.data || res.data);
    } catch (e) {
      showSnackbar('Error loading coordinator dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleStatusUpdate = async (regId, status) => {
    try {
      await api.put(`/events/0/registrations/${regId}`, { status });
      showSnackbar(`Registration successfully marked as ${status.toLowerCase()}`);
      loadStats(); // refresh data
    } catch (e) {
      showSnackbar('Action failed', 'error');
    }
  };

  const getStatusChip = (status) => {
    const styles = {
      PENDING: { bg: '#fffbeb', text: '#d97706', label: 'Pending Review' },
      APPROVED: { bg: '#eff6ff', text: '#2563eb', label: 'Registered' },
      REJECTED: { bg: '#fef2f2', text: '#dc2626', label: 'Rejected' },
      ATTENDED: { bg: '#f0fdf4', text: '#16a34a', label: 'Attended' }
    };
    const s = styles[status] || { bg: 'action.hover', text: 'text.secondary', label: status };
    return (
      <Chip 
        label={s.label} size="small"
        sx={{ fontWeight: 800, fontSize: '0.65rem', borderRadius: '6px', bgcolor: s.bg, color: s.text }} 
      />
    );
  };

  if (loading || !stats) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  const { 
    kpis = {}, 
    pendingRegistrations = [], 
    coordinatedEvents = [], 
    proposals = [], 
    feedbacks = [], 
    budgets = [] 
  } = stats;

  // Calculate budget overview stats
  const budgetSummary = budgets.reduce((acc, curr) => {
    acc.allocated += curr.allocated || 0;
    acc.spent += curr.spent || 0;
    return acc;
  }, { allocated: 0, spent: 0 });
  const remainingBudget = budgetSummary.allocated - budgetSummary.spent;

  // Parse feedback ratings into visual average criteria
  const feedbackMetrics = feedbacks.reduce((acc, curr) => {
    try {
      const reviewObj = JSON.parse(curr.review);
      if (reviewObj && reviewObj.breakdown) {
        acc.overall += reviewObj.breakdown.overall || curr.rating || 0;
        acc.quality += reviewObj.breakdown.quality || 0;
        acc.venue += reviewObj.breakdown.venue || 0;
        acc.organization += reviewObj.breakdown.organization || 0;
        acc.timing += reviewObj.breakdown.timing || 0;
        acc.count += 1;
      }
    } catch {
      acc.overall += curr.rating || 0;
      acc.count += 1;
    }
    return acc;
  }, { overall: 0, quality: 0, venue: 0, organization: 0, timing: 0, count: 0 });

  const chartData = [
    { name: 'Overall', rating: feedbackMetrics.count > 0 ? parseFloat((feedbackMetrics.overall / feedbackMetrics.count).toFixed(1)) : 0 },
    { name: 'Event Quality', rating: feedbackMetrics.count > 0 ? parseFloat((feedbackMetrics.quality / feedbackMetrics.count).toFixed(1)) : 0 },
    { name: 'Venue & Facilities', rating: feedbackMetrics.count > 0 ? parseFloat((feedbackMetrics.venue / feedbackMetrics.count).toFixed(1)) : 0 },
    { name: 'Organization', rating: feedbackMetrics.count > 0 ? parseFloat((feedbackMetrics.organization / feedbackMetrics.count).toFixed(1)) : 0 },
    { name: 'Timing', rating: feedbackMetrics.count > 0 ? parseFloat((feedbackMetrics.timing / feedbackMetrics.count).toFixed(1)) : 0 },
  ];

  const cards = [
    { title: 'COORDINATED EVENTS', value: kpis.coordinatedEventsCount || 0, icon: <EventIcon sx={{ color: '#3b82f6' }} />, bg: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)' },
    { title: 'TOTAL REGISTRATIONS', value: kpis.totalRegistrations || 0, icon: <PeopleOutlineIcon sx={{ color: '#10b981' }} />, bg: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.1)' },
    { title: 'PENDING APPROVALS', value: kpis.pendingRegistrationsCount || 0, icon: <HelpOutlineIcon sx={{ color: '#f59e0b' }} />, bg: isLight ? '#fff7ed' : 'rgba(245, 158, 11, 0.1)' },
    { title: 'AVERAGE RATING', value: `${kpis.averageFeedbackRating || 0} / 5.0`, icon: <RateReviewIcon sx={{ color: '#eab308' }} />, bg: isLight ? '#fef9c3' : 'rgba(234, 179, 8, 0.1)' },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>Coordinator Console</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Approve registrations, check off student attendance, and submit event proposals
      </Typography>

      {/* KPI cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2.5,
                border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper'
              }}
            >
              <Box sx={{ p: 1.5, backgroundColor: c.bg, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.05em' }}>{c.title}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.2 }}>{c.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Coordinated Events Table */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>My Coordinated Events</Typography>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>EVENT IDENTITY</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>VENUE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>SCHEDULE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>REGISTRATIONS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>CHECKLIST</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coordinatedEvents.length > 0 ? (
                coordinatedEvents.map((evt) => (
                  <TableRow key={evt.id} hover sx={{ '& td': { py: 2 } }}>
                    <TableCell onClick={() => navigate(`/events/${evt.id}`)} sx={{ cursor: 'pointer' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{evt.title}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>{evt.type}</Typography>
                    </TableCell>
                    <TableCell>{evt.venue?.name || 'Grand Hall'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarMonthIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {new Date(evt.startDate).toLocaleDateString('en-GB')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800 }}>{evt._count?.registration || 0} registered</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" variant="contained"
                        onClick={() => navigate(`/events/${evt.id}`)}
                        sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#3b82f6', boxShadow: 'none' }}
                      >
                        Check Attendance
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="textSecondary" variant="body2">You are not coordinating any active events</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Grid of details */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Pending approvals */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Pending Event Registrations</Typography>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>STUDENT</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>EVENT</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>AFFILIATION</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRegistrations.length > 0 ? (
                    pendingRegistrations.map((reg) => (
                      <TableRow key={reg.id} hover sx={{ '& td': { py: 1.5 } }}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{reg.user?.name}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{reg.user?.email}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{reg.event?.title}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{reg.user?.institution?.name || 'N/A'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Approve Student">
                              <IconButton 
                                size="small" onClick={() => handleStatusUpdate(reg.id, 'APPROVED')}
                                sx={{ color: '#16a34a', bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.1)', '&:hover': { bgcolor: '#16a34a', color: '#fff' } }}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Request">
                              <IconButton 
                                size="small" onClick={() => handleStatusUpdate(reg.id, 'REJECTED')}
                                sx={{ color: '#dc2626', bgcolor: isLight ? '#fef2f2' : 'rgba(220, 38, 38, 0.1)', '&:hover': { bgcolor: '#dc2626', color: '#fff' } }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <Typography color="textSecondary" variant="body2">No pending registration requests to review</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Proposals timeline */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">My Proposal Pipeline</Typography>
              <Button onClick={() => navigate('/proposals')} size="small" endIcon={<LaunchIcon />} sx={{ textTransform: 'none', fontWeight: 700 }}>Propose</Button>
            </Box>
            <Stack spacing={2.5}>
              {proposals.length > 0 ? (
                proposals.map((prop) => (
                  <Box key={prop.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{prop.event?.title}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Submitted: {new Date(prop.createdAt).toLocaleDateString('en-GB')}</Typography>
                    </Box>
                    <Chip 
                      label={prop.status} size="small"
                      sx={{ 
                        fontWeight: 800, fontSize: '0.65rem', borderRadius: '6px',
                        bgcolor: prop.status === 'APPROVED' ? '#dcfce7' : prop.status === 'PENDING' ? '#fffbeb' : '#fef2f2',
                        color: prop.status === 'APPROVED' ? '#15803d' : prop.status === 'PENDING' ? '#b45309' : '#b91c1c'
                      }} 
                    />
                  </Box>
                ))
              ) : (
                <Typography color="textSecondary" variant="body2" align="center" sx={{ py: 4 }}>No event proposals submitted yet</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Budget & Feedback Analytics */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Feedback Ratings Breakdown</Typography>
            <Box sx={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={11} />
                  <ChartTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Bar dataKey="rating" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Recent Feedback Reviews</Typography>
            <Stack spacing={2} sx={{ maxHeight: 250, overflowY: 'auto' }}>
              {feedbacks.length > 0 ? (
                feedbacks.map((f, i) => {
                  let parsedReview = f.review;
                  try {
                    const parsedObj = JSON.parse(f.review);
                    parsedReview = parsedObj.comments || f.review;
                  } catch {}
                  return (
                    <Box key={i} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem' }}>{f.user?.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                          <StarIcon sx={{ fontSize: 13, color: '#eab308' }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800 }}>{f.rating}</Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>"{parsedReview}"</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: '#3b82f6', mt: 0.5, fontWeight: 600 }}>Event: {f.event?.title}</Typography>
                    </Box>
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>No feedback reviews submitted yet.</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDashboardView;
