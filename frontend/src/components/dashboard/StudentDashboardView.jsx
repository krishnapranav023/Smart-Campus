import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button, IconButton,
  CircularProgress, Stack, Avatar, Card, CardContent, Divider, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, Rating, 
  Tooltip, Badge
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import HandshakeIcon from '@mui/icons-material/Handshake';
import RateReviewIcon from '@mui/icons-material/RateReview';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import api from '../../api';
import { useApp } from '../../context/AppContext';
import QRCode from 'qrcode';

// Static Announcements List
const ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'SmartCampus Hackathon 2026 Registration Open',
    postedBy: 'Admin Authority',
    date: '20 July 2026',
    category: 'Hackathon',
    priority: 'HIGH',
    desc: 'Register for the annual inter-collegiate hackathon. Grand prize pool of ₹1,00,000 cash prizes and trophy. Teams of 2-4 allowed.'
  },
  {
    id: 2,
    title: 'Workshop on Cloud Native Architectures & Kubernetes',
    postedBy: 'SCSVMV Organizer',
    date: '18 July 2026',
    category: 'Workshop',
    priority: 'NORMAL',
    desc: 'Join us for a full day practical workshop on AWS EKS and Kubernetes development lifecycle. Hands-on credits will be provided.'
  },
  {
    id: 3,
    title: 'Economics Olympiad Venue Relocation Notice',
    postedBy: 'Coordinator Team',
    date: '15 July 2026',
    category: 'Academic',
    priority: 'HIGH',
    desc: 'Please note the Economics Olympiad 2026 scheduled on 16 Aug has been moved from Hall B to the Grand Campus Auditorium.'
  },
  {
    id: 4,
    title: 'Inter-Collegiate Sports Meet — Registrations Closing',
    postedBy: 'Sports Board',
    date: '10 July 2026',
    category: 'Sports',
    priority: 'NORMAL',
    desc: 'Registrations for Table Tennis Masters and Badminton leagues close tomorrow. Submit your entries before the deadline.'
  }
];

const StudentDashboardView = () => {
  const navigate = useNavigate();
  const { showSnackbar, user, themeMode } = useApp();
  const isLight = themeMode === 'light';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // QR Pass state
  const [passOpen, setPassOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Rating Modal state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewEventId, setReviewEventId] = useState(null);
  const [reviewEventTitle, setReviewEventTitle] = useState('');
  
  // Rating breakdown
  const [overallRating, setOverallRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [venueRating, setVenueRating] = useState(5);
  const [orgRating, setOrgRating] = useState(5);
  const [timingRating, setTimingRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`bookmarks_${user?.id}`)) || [];
    } catch {
      return [];
    }
  });
  const [myVolunteering, setMyVolunteering] = useState([]);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/participants/dashboard-stats');
      setStats(res.data.data || res.data);
      
      const volRes = await api.get('/participants/my-volunteering');
      setMyVolunteering(volRes.data.data || []);
    } catch (e) {
      showSnackbar('Error loading student dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const toggleBookmark = (eventId) => {
    let updated;
    if (bookmarks.includes(eventId)) {
      updated = bookmarks.filter(id => id !== eventId);
      showSnackbar('Removed from bookmarks');
    } else {
      updated = [...bookmarks, eventId];
      showSnackbar('Added to bookmarks');
    }
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${user?.id}`, JSON.stringify(updated));
  };

  const openQrPass = (reg) => {
    setSelectedReg(reg);
    const token = `REG-${reg.id}-${reg.eventId}-${reg.userId}`;
    QRCode.toDataURL(token, { width: 220, margin: 1 }, (err, url) => {
      if (err) {
        console.error(err);
        showSnackbar('Failed to generate QR Pass', 'error');
      } else {
        setQrCodeUrl(url);
        setPassOpen(true);
      }
    });
  };

  const handleReviewSubmit = async () => {
    setSubmittingReview(true);
    try {
      const reviewBlob = JSON.stringify({
        comments,
        breakdown: {
          overall: overallRating,
          quality: qualityRating,
          venue: venueRating,
          organization: orgRating,
          timing: timingRating
        }
      });

      await api.post('/feedback', {
        eventId: reviewEventId,
        rating: overallRating,
        review: reviewBlob
      });

      showSnackbar('Event experience rating submitted successfully!');
      setReviewOpen(false);
      setComments('');
      loadStats();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const kpis = stats?.kpis || {};
  const upcomingEvents = stats?.upcomingEvents || [];
  const rawRegisteredEvents = stats?.registeredEvents || [];

  // Filter schedule for future events
  const registeredEvents = useMemo(() => {
    const now = new Date();
    return rawRegisteredEvents.filter(r => new Date(r.event?.startDate) >= now || new Date(r.event?.endDate) >= now);
  }, [rawRegisteredEvents]);

  // Derived KPI figures
  const completedEventsCount = useMemo(() => {
    const now = new Date();
    return rawRegisteredEvents.filter(r => new Date(r.event?.endDate) < now && r.status === 'ATTENDED').length;
  }, [rawRegisteredEvents]);

  const totalRegisteredCount = useMemo(() => {
    return rawRegisteredEvents.length;
  }, [rawRegisteredEvents]);

  const attendanceRate = useMemo(() => {
    const now = new Date();
    const completed = rawRegisteredEvents.filter(r => new Date(r.event?.endDate) < now);
    if (completed.length === 0) return 100;
    const attended = completed.filter(r => r.status === 'ATTENDED').length;
    return Math.round((attended / completed.length) * 100);
  }, [rawRegisteredEvents]);

  const winsCount = useMemo(() => kpis.winsCount || 0, [kpis]);
  const pointsEarned = useMemo(() => (winsCount * 100) + (totalRegisteredCount * 25), [winsCount, totalRegisteredCount]);

  const recommendedEvents = useMemo(() => {
    if (upcomingEvents.length === 0) return [];
    const registeredIds = new Set(rawRegisteredEvents.map(r => r.eventId));
    return upcomingEvents.filter(e => !registeredIds.has(e.id)).slice(0, 3);
  }, [upcomingEvents, rawRegisteredEvents]);

  // Mini Calendar Calculations
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Month Days
    for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
    return days;
  }, [currentDate]);

  const handleMonthChange = (dir) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
  };

  const getDayEvent = (date) => {
    if (!date) return null;
    return rawRegisteredEvents.find(r => {
      const d = new Date(r.event?.startDate);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
  };

  if (loading || !stats) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

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

  const getEventStatusChip = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < now) {
      return <Chip label="Completed" size="small" sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem' }} />;
    }
    if (start <= now && end >= now) {
      return <Chip label="Ongoing" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.65rem' }} />;
    }
    return <Chip label="Upcoming" size="small" sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 800, fontSize: '0.65rem' }} />;
  };

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
      
      {/* ── Welcome Header & Quick Stats Strip ── */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name || 'Krishna Pranav'} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Stay updated with your upcoming events, certificates, registrations, and achievements.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={() => navigate('/events')}
          startIcon={<EventIcon />}
          sx={{ 
            textTransform: 'none', borderRadius: '10px', bgcolor: '#4f46e5', boxShadow: 'none', px: 3, py: 1.2, fontWeight: 700,
            '&:hover': { bgcolor: '#3b82f6', transform: 'translateY(-2px)' }, transition: 'all 0.2s'
          }}
        >
          Explore Events
        </Button>
      </Box>

      {/* ── Student Profile Header Card ── */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" sx={{ '& .MuiBadge-badge': { bgcolor: '#22c55e', height: 12, minWidth: 12, borderRadius: '50%' } }}>
              <Avatar sx={{ width: 68, height: 68, bgcolor: '#4f46e5', color: '#fff', fontSize: '1.8rem', fontWeight: 900 }}>
                {user?.name?.charAt(0).toUpperCase() || 'K'}
              </Avatar>
            </Badge>
          </Grid>
          <Grid item xs>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Typography variant="h5" fontWeight="800">{user?.name || 'Krishna Pranav'}</Typography>
              <Chip label="Participant" size="small" sx={{ bgcolor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', fontWeight: 800, fontSize: '0.7rem', height: 20 }} />
            </Stack>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SchoolIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Computer Science Engineering</Typography>
              </Grid>
              <Grid item sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CorporateFareIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>{user?.institution?.name || 'SCSVMV University'}</Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/settings')}
              startIcon={<SettingsIcon />} 
              sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
            >
              Profile Settings
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ── KPI Grid ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Upcoming Registrations', value: totalRegisteredCount, trend: '↑ Today', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.08)', icon: <EventIcon /> },
          { label: 'Completed Events', value: completedEventsCount, trend: '↑ 1 New', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.08)', icon: <CheckCircleIcon /> },
          { label: 'Attendance Rate', value: `${attendanceRate}%`, trend: 'Stable', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)', icon: <AutoAwesomeIcon /> },
          { label: 'Certificates Earned', value: winsCount, trend: '↓ Weekly', color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', icon: <WorkspacePremiumIcon /> },
          { label: 'Leaderboard Rank', value: `#${kpis.leaderboardRank || '—'}`, trend: '↑ Top 10%', color: '#9333ea', bg: 'rgba(147, 51, 234, 0.08)', icon: <StarIcon /> },
          { label: 'Achievement Points', value: pointsEarned, trend: '↑ +250 XP', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.08)', icon: <EmojiEventsIcon /> },
        ].map((card, i) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1.5,
                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }, transition: 'all 0.2s', cursor: 'pointer'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: card.bg, color: card.color, width: 36, height: 36 }}>{card.icon}</Avatar>
                <Typography fontSize="0.7rem" fontWeight={800} sx={{ color: card.color }}>{card.trend}</Typography>
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={900}>{card.value}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>{card.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Main Dashboard Layout Grid ── */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        
        {/* Left Side (Schedule & Recommendations) */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            
            {/* Event Schedule */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
              <Typography variant="h6" fontWeight="800" sx={{ mb: 3 }}>My Event Schedule</Typography>
              {registeredEvents.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>EVENT IDENTITY</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>VENUE</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>DATE & TIME</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>REG. STATUS</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>EVENT STATUS</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {registeredEvents.map((reg) => (
                        <TableRow key={reg.id} hover sx={{ '& td': { py: 1.8 } }}>
                          <TableCell onClick={() => navigate(`/events/${reg.eventId}`)} sx={{ cursor: 'pointer' }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>{reg.event?.title}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600 }}>{reg.event?.type}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{reg.event?.venue?.name || 'Main Campus Hall'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarMonthIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                {new Date(reg.event?.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{getStatusChip(reg.status)}</TableCell>
                          <TableCell>{getEventStatusChip(reg.event?.startDate, reg.event?.endDate)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              {/* QR Pass */}
                              {(reg.status === 'APPROVED' || reg.status === 'ATTENDED') && (
                                <Tooltip title="View Pass">
                                  <IconButton size="small" onClick={() => openQrPass(reg)} sx={{ color: '#4f46e5', bgcolor: 'action.hover' }}>
                                    <QrCode2Icon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Button 
                                size="small" variant="outlined" 
                                onClick={() => navigate(`/events/${reg.eventId}`)}
                                sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}
                              >
                                Details
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CalendarMonthIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
                  <Typography variant="h6" fontWeight={700} color="text.secondary">No registered events</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                    Find hackathons, workshops, and symposiums to build your portfolio.
                  </Typography>
                  <Button 
                    variant="contained" startIcon={<EventIcon />} onClick={() => navigate('/events')}
                    sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#4f46e5', boxShadow: 'none' }}
                  >
                    Browse Events
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Recommended Events */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
              <Typography variant="h6" fontWeight="800" sx={{ mb: 3 }}>Recommended For You</Typography>
              <Grid container spacing={3}>
                {recommendedEvents.map((evt) => (
                  <Grid item xs={12} md={4} key={evt.id}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%',
                        display: 'flex', flexDirection: 'column', position: 'relative',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }, transition: 'all 0.25s'
                      }}
                    >
                      {/* Fake Banner with Dynamic Colors */}
                      <Box sx={{ height: 110, bgcolor: '#1e1b4b', p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Chip label={evt.type} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.62rem', fontWeight: 800, alignSelf: 'flex-start' }} />
                        <Typography sx={{ color: '#fff', fontSize: '0.62rem', fontWeight: 700 }}>🎁 Prize: ₹5,000 cash pool</Typography>
                      </Box>
                      
                      <IconButton 
                        onClick={() => toggleBookmark(evt.id)} 
                        size="small" 
                        sx={{ position: 'absolute', top: 12, right: 12, color: bookmarks.includes(evt.id) ? '#ef4444' : '#fff', bgcolor: 'rgba(0,0,0,0.3)' }}
                      >
                        {bookmarks.includes(evt.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                      </IconButton>

                      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', mb: 1, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{evt.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 600 }}>🏛️ Host: Anna University</Typography>
                        
                        <Stack spacing={1} sx={{ mt: 'auto' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography fontSize="0.7rem" color="text.secondary">Seats Remaining</Typography>
                            <Typography fontSize="0.75rem" fontWeight={800} color="#16a34a">45 / 100</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography fontSize="0.7rem" color="text.secondary">Level</Typography>
                            <Typography fontSize="0.75rem" fontWeight={800} color="#ea580c">Intermediate</Typography>
                          </Box>
                          
                          <Button 
                            fullWidth variant="contained"
                            onClick={() => navigate(`/events/${evt.id}`)}
                            sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#4f46e5', boxShadow: 'none' }}
                          >
                            Register
                          </Button>
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>

          </Stack>
        </Grid>

        {/* Right Side (Calendar & Announcements) */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={4}>
            
            {/* Monthly Calendar Widget */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h6" fontWeight="800">Events Calendar</Typography>
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => handleMonthChange(-1)}><ChevronLeftIcon /></IconButton>
                  <Typography variant="body2" fontWeight={800} sx={{ display: 'flex', alignItems: 'center' }}>
                    {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </Typography>
                  <IconButton size="small" onClick={() => handleMonthChange(1)}><ChevronRightIcon /></IconButton>
                </Stack>
              </Box>

              {/* Grid Calendar */}
              <Grid container spacing={1} sx={{ textAlign: 'center', mb: 2 }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <Grid item xs={1.7} key={d}>
                    <Typography fontSize="0.72rem" fontWeight={800} color="text.secondary">{d}</Typography>
                  </Grid>
                ))}
                {calendarDays.map((day, i) => {
                  if (!day) return <Grid item xs={1.7} key={`empty-${i}`} />;
                  const hasEvent = getDayEvent(day);
                  const isToday = new Date().toDateString() === day.toDateString();
                  
                  return (
                    <Grid item xs={1.7} key={day.toISOString()}>
                      <Tooltip title={hasEvent ? `Event: ${hasEvent.event?.title}` : ''}>
                        <Box 
                          onClick={() => hasEvent && navigate(`/events/${hasEvent.eventId}`)}
                          sx={{ 
                            height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                            fontSize: '0.75rem', fontWeight: isToday || hasEvent ? 800 : 500, cursor: hasEvent ? 'pointer' : 'default',
                            bgcolor: isToday ? '#4f46e5' : hasEvent ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                            color: isToday ? '#fff' : hasEvent ? '#4f46e5' : 'text.primary',
                            '&:hover': hasEvent ? { bgcolor: '#4f46e5', color: '#fff' } : {}
                          }}
                        >
                          {day.getDate()}
                        </Box>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>

            {/* Announcements Section */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="800">Campus Announcements</Typography>
                <NotificationsActiveIcon sx={{ color: '#d97706' }} />
              </Box>
              
              <Stack spacing={2.5}>
                {ANNOUNCEMENTS.map((ann) => (
                  <Box key={ann.id} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Chip label={ann.category} size="small" sx={{ fontSize: '0.62rem', fontWeight: 800, bgcolor: 'action.selected' }} />
                      {ann.priority === 'HIGH' && <Chip label="HIGH PRIORITY" size="small" sx={{ fontSize: '0.6rem', fontWeight: 800, bgcolor: '#fef2f2', color: '#dc2626' }} />}
                    </Stack>
                    <Typography fontWeight={800} fontSize="0.85rem" sx={{ mb: 0.5 }}>{ann.title}</Typography>
                    <Typography fontSize="0.75rem" color="text.secondary" sx={{ mb: 1.5 }}>{ann.desc}</Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">By: {ann.postedBy}</Typography>
                      <Typography variant="caption" color="text.secondary">{ann.date}</Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>

          </Stack>
        </Grid>

      </Grid>

      {/* ── QR PASS MODAL ── */}
      <Dialog open={passOpen} onClose={() => setPassOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">Event Attendance Pass</Typography>
          <IconButton onClick={() => setPassOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          {qrCodeUrl && (
            <>
              <img src={qrCodeUrl} alt="Attendance Pass QR Code" style={{ border: '4px solid #fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 2.5 }}>{selectedReg?.event?.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                REG-ID: REG-{selectedReg?.id}-{selectedReg?.eventId}-{selectedReg?.userId}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPassOpen(false)} fullWidth variant="contained" sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', boxShadow: 'none' }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── FEEDBACK RATE MODAL ── */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>Rate Event Experience</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Help us improve future events. Rate <strong>{reviewEventTitle}</strong> across the following criteria.
          </Typography>
          
          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>Overall Experience</Typography>
              <Rating value={overallRating} onChange={(e, val) => setOverallRating(val)} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>Event Quality & Flow</Typography>
              <Rating value={qualityRating} onChange={(e, val) => setQualityRating(val)} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>Venue & Facilities</Typography>
              <Rating value={venueRating} onChange={(e, val) => setVenueRating(val)} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>Organization & Staff</Typography>
              <Rating value={orgRating} onChange={(e, val) => setOrgRating(val)} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>Timing & Schedule</Typography>
              <Rating value={timingRating} onChange={(e, val) => setTimingRating(val)} />
            </Box>
            <TextField 
              label="Review & Suggestions" 
              multiline rows={3} placeholder="Please provide your written suggestions..." 
              fullWidth variant="outlined"
              value={comments} onChange={(e) => setComments(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setReviewOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button 
            variant="contained" onClick={handleReviewSubmit} disabled={submittingReview}
            sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', boxShadow: 'none', px: 3 }}
          >
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentDashboardView;
