import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getComputedStatus, getStatusStyle } from '../../utils/eventStatus';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Link, Avatar, Chip,
  IconButton, Tooltip, Stack, CircularProgress, Button, Skeleton
} from '@mui/material';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimelineIcon from '@mui/icons-material/Timeline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LaunchIcon from '@mui/icons-material/Launch';

import { 
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  AreaChart, Area, Tooltip as RechartsTooltip 
} from 'recharts';

import api from '../../api';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../hooks/useAsync';
import TableSkeleton from '../TableSkeleton';

const AdminDashboardView = () => {
  const navigate = useNavigate();
  const { showSnackbar, themeMode } = useApp();
  const isLight = themeMode === 'light';
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const fetchGlobalStatsReq = useCallback(() => api.get('/dashboard/global'), []);
  const fetchGrowthReq = useCallback(() => api.get('/analytics/growth'), []);
  const fetchEventsReq = useCallback(() => api.get('/events?limit=5'), []);
  const fetchInstitutionsReq = useCallback(() => api.get('/analytics/top-institutions'), []);

  const { execute: fetchGlobalStats, data: stats = {}, loading: statsLoading } = useAsync(fetchGlobalStatsReq);
  const { execute: fetchGrowth, data: growthData = [], loading: growthLoading } = useAsync(fetchGrowthReq);
  const { execute: fetchEvents, data: eventPayload = { data: [] }, loading: eventsLoading } = useAsync(fetchEventsReq);
  const { execute: fetchInstitutions, data: topInsts = [], loading: instLoading } = useAsync(fetchInstitutionsReq);

  // Fetch calendar-specific events to highlight days
  const fetchCalendarEvents = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // 1-12
      const res = await api.get(`/events?year=${year}&month=${month}&limit=100`);
      const payload = res.data.data?.data || res.data.data || res.data || [];
      setCalendarEvents(payload);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setCalendarLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    Promise.all([
      fetchGlobalStats(),
      fetchGrowth(),
      fetchEvents(),
      fetchInstitutions()
    ]).catch(() => {
      showSnackbar('Error fetching admin metrics', 'error');
    });
  }, []);

  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  const topCards = [
    { title: 'INSTITUTIONS', value: stats.totalInstitutions || 0, icon: <CorporateFareIcon sx={{ color: '#3b82f6' }} />, bg: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)' },
    { title: 'TOTAL EVENTS', value: stats.totalEvents || 0, icon: <EventIcon sx={{ color: '#8b5cf6' }} />, bg: isLight ? '#f5f3ff' : 'rgba(139, 92, 246, 0.1)' },
    { title: 'PARTICIPANTS', value: stats.totalParticipants || 0, icon: <PeopleIcon sx={{ color: '#10b981' }} />, bg: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.1)' },
    { title: 'TOTAL WINNERS', value: stats.totalWinners || 0, icon: <EmojiEventsIcon sx={{ color: '#f59e0b' }} />, bg: isLight ? '#fff7ed' : 'rgba(245, 158, 11, 0.1)' },
    { title: 'ACTIVE EVENTS', value: stats.activeEventsCount || 0, icon: <TimelineIcon sx={{ color: '#06b6d4' }} />, bg: isLight ? '#ecfeff' : 'rgba(6, 182, 212, 0.1)' },
    { title: 'BUDGET ALLOCATED', value: `₹${((stats.totalBudget || 0)/10000000).toFixed(1)}Cr`, icon: <AttachMoneyIcon sx={{ color: '#ef4444' }} />, bg: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)' },
    { title: 'SPONSORSHIPS', value: `₹${((stats.totalSponsorship || 0)/10000000).toFixed(1)}Cr`, icon: <StarOutlineIcon sx={{ color: '#eab308' }} />, bg: isLight ? '#fef9c3' : 'rgba(234, 179, 8, 0.1)' },
    { title: 'PROPOSALS', value: stats.pendingProposals || 0, icon: <DescriptionIcon sx={{ color: '#f97316' }} />, bg: isLight ? '#fff7ed' : 'rgba(249, 115, 22, 0.1)' },
  ];

  // Calendar logic
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < startOffset; i++) {
      days.push({ day: null, date: null });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, date: dateString });
    }

    return days;
  }, [currentDate]);

  const changeMonth = (direction) => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(nextDate);
  };

  const hasEventOnDay = (dayObj) => {
    if (!dayObj.day) return false;
    return calendarEvents.some(evt => {
      const evDate = new Date(evt.startDate);
      return evDate.getFullYear() === currentDate.getFullYear() &&
             evDate.getMonth() === currentDate.getMonth() &&
             evDate.getDate() === dayObj.day;
    });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>Executive Dashboard</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Real-time metrics, cross-institutional performance, and registration trends
      </Typography>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {topCards.map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2.5,
                border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <Box sx={{ p: 1.5, backgroundColor: c.bg, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.05em' }}>{c.title}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.2 }}>{statsLoading ? <Skeleton width={60} /> : c.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts & Top lists */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Growth Area Chart */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>User Engagement Growth</Typography>
            {growthLoading ? (
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    <RechartsTooltip cursor={{ fill: 'action.hover' }} contentStyle={{ borderRadius: 12 }} />
                    <Area type="monotone" dataKey="participants" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top Performing Institutions */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Top Institutions</Typography>
            {instLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}><Skeleton height={40} /><Skeleton height={40} /></Box>
            ) : (
              <Stack spacing={2.5}>
                {topInsts.slice(0, 5).map((inst, index) => (
                  <Box key={inst.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 800 }}>
                        {index + 1}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{inst.name}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Code: {inst.code}</Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={`${inst.winsCount || 0} Wins`} size="small" 
                      sx={{ bgcolor: '#fff7ed', color: '#b45309', fontWeight: 800, fontSize: '0.7rem' }} 
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Calendar & Activities */}
      <Grid container spacing={4}>
        {/* Recent Registered Events */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">Recent Events</Typography>
              <Button onClick={() => navigate('/events')} size="small" endIcon={<LaunchIcon />} sx={{ textTransform: 'none', fontWeight: 700 }}>View All</Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>EVENT</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>HOST</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>START DATE</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eventsLoading ? (
                    <TableSkeleton rows={3} cols={4} />
                  ) : (
                    (eventPayload.data || []).slice(0, 5).map((evt) => (
                      <TableRow key={evt.id} hover onClick={() => navigate(`/events/${evt.id}`)} sx={{ cursor: 'pointer', '& td': { py: 1.8 } }}>
                        <TableCell sx={{ fontWeight: 800 }}>{evt.title}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{evt.institution?.name}</TableCell>
                        <TableCell>{new Date(evt.startDate).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell>
                          {(() => {
                            const computed = getComputedStatus(evt);
                            const s = getStatusStyle(computed, true);
                            return (
                              <Chip 
                                label={s.label} size="small" 
                                sx={{ 
                                  fontWeight: 800, fontSize: '0.65rem', borderRadius: '6px',
                                  bgcolor: s.bg, 
                                  color: s.text 
                                }} 
                              />
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Mini Calendar */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">Schedule Hub</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" onClick={() => changeMonth(-1)}><ChevronLeftIcon /></IconButton>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mx: 1 }}>
                  {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Typography>
                <IconButton size="small" onClick={() => changeMonth(1)}><ChevronRightIcon /></IconButton>
              </Box>
            </Box>

            <Grid container spacing={1} sx={{ textAlign: 'center', mb: 1 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <Grid item xs={1.7} key={i}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary' }}>{day}</Typography>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={1} sx={{ textAlign: 'center' }}>
              {calendarDays.map((d, index) => {
                const isToday = d.day && d.day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                const hasEvent = hasEventOnDay(d);
                
                return (
                  <Grid item xs={1.7} key={index}>
                    <Box 
                      sx={{ 
                        py: 0.8, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                        color: d.day ? (isToday ? '#fff' : 'text.primary') : 'transparent',
                        bgcolor: isToday ? '#3b82f6' : (hasEvent ? (isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.15)') : 'transparent'),
                        border: hasEvent && !isToday ? '1px solid #3b82f6' : 'none',
                        cursor: hasEvent ? 'pointer' : 'default',
                        transition: 'all 0.15s',
                        '&:hover': {
                          bgcolor: d.day ? (isToday ? '#2563eb' : 'action.hover') : 'transparent'
                        }
                      }}
                      onClick={() => {
                        if (hasEvent) {
                          // Navigate to events page pre-filtered or trigger list
                          navigate('/events');
                        }
                      }}
                    >
                      {d.day || ''}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboardView;
