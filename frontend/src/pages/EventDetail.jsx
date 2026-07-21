import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getComputedStatus, getStatusStyle } from '../utils/eventStatus';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Grid, Button, IconButton, Chip, 
  LinearProgress, Divider, Skeleton, Alert, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, Stack, Rating,
  Avatar, Card, CardContent, Tooltip, Tab, Tabs
} from '@mui/material';
import api from '../api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GavelIcon from '@mui/icons-material/Gavel';
import FlagIcon from '@mui/icons-material/Flag';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import VerifiedIcon from '@mui/icons-material/Verified';
import GroupIcon from '@mui/icons-material/Group';
import CategoryIcon from '@mui/icons-material/Category';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmailIcon from '@mui/icons-material/Email';

import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import useAsync from '../hooks/useAsync';
import { useApp } from '../context/AppContext';

// Reusable Feedback Components
import { EventRating, ReviewCard, RatingSummary } from '../components/EventRating';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSnackbar, user, themeMode } = useApp();
  
  const isLight = themeMode === 'light';
  const isStudent = user?.role === 'PARTICIPANT';
  const canManage = user?.role === 'ADMIN' || user?.role === 'ORGANIZER';

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', status: '', startDate: '', endDate: '', description: '', maxParticipants: 50 });
  const [activeTab, setActiveTab] = useState(0);

  // Registration state
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);

  // Local feedback list state to reactively render new submissions
  const [feedbacks, setFeedbacks] = useState([]);

  const fetchEventReq = useCallback(() => api.get(`/events/${id}`), [id]);
  const { execute: fetchEvent, data: event, loading, error } = useAsync(fetchEventReq);

  const checkRegistrationStatus = useCallback(async () => {
    if (!isStudent) return;
    try {
      const res = await api.get('/participants/my-registrations');
      const list = res.data.data || res.data;
      const found = list.find(r => r.eventId === parseInt(id));
      if (found) {
        setIsRegistered(true);
        setRegistrationStatus(found.status);
      } else {
        setIsRegistered(false);
        setRegistrationStatus(null);
      }
    } catch (e) {
      console.error('Error checking registration status:', e);
    }
  }, [id, isStudent]);

  useEffect(() => { 
    fetchEvent();
    checkRegistrationStatus();
  }, [fetchEvent, checkRegistrationStatus]);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        status: event.status || 'UPCOMING',
        startDate: event.startDate ? event.startDate.slice(0, 16) : '',
        endDate: event.endDate ? event.endDate.slice(0, 16) : '',
        description: event.description || '',
        maxParticipants: event.maxParticipants || 100
      });
      setFeedbacks(event.feedback || []);
    }
  }, [event]);

  const handleSaveEdit = async () => {
    try {
      await api.put(`/events/${id}`, formData);
      showSnackbar('Event details updated successfully');
      setIsEditModalOpen(false);
      fetchEvent();
    } catch (e) {
      showSnackbar(e.response?.data?.message || 'Update failed', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/events/${id}`);
      showSnackbar('Event terminated successfully');
      navigate('/events');
    } catch (e) {
      showSnackbar('Delete failed', 'error');
    }
  };

  const handleRegistrationToggle = async () => {
    if (registrationLoading) return;
    setRegistrationLoading(true);
    try {
      if (isRegistered) {
        await api.post(`/events/${id}/cancel-registration`);
        showSnackbar('Registration cancelled successfully');
        setIsRegistered(false);
        setRegistrationStatus(null);
      } else {
        await api.post(`/events/${id}/register`);
        showSnackbar('Registration request submitted successfully');
        setIsRegistered(true);
        setRegistrationStatus('PENDING');
      }
      fetchEvent();
    } catch (e) {
      showSnackbar(e.response?.data?.message || 'Registration action failed', 'error');
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Submit new student review
  const handleFeedbackSubmit = async (payload) => {
    try {
      await api.post('/feedback', payload);
      showSnackbar('Review submitted successfully!', 'success');
      fetchEvent();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to submit review', 'error');
      throw err;
    }
  };

  // Calculated rating averages
  const ratingStats = useMemo(() => {
    if (!feedbacks || feedbacks.length === 0) {
      return { overall: 0, quality: 0, venue: 0, organization: 0, timing: 0, count: 0 };
    }
    const count = feedbacks.length;
    const overall = feedbacks.reduce((s, f) => s + f.rating, 0) / count;
    const quality = feedbacks.reduce((s, f) => s + (f.qualityRating || 5), 0) / count;
    const venue = feedbacks.reduce((s, f) => s + (f.venueRating || 5), 0) / count;
    const organization = feedbacks.reduce((s, f) => s + (f.orgRating || 5), 0) / count;
    const timing = feedbacks.reduce((s, f) => s + (f.timingRating || 5), 0) / count;
    return { overall, quality, venue, organization, timing, count };
  }, [feedbacks]);

  // Check if current user has already submitted feedback
  const myFeedback = useMemo(() => {
    if (!user) return null;
    return feedbacks.find(f => f.userId === user.id);
  }, [feedbacks, user]);

  const getStatusChip = (evt) => {
    const computed = getComputedStatus(evt);
    const s = getStatusStyle(computed, isLight);
    return (
      <Chip 
        label={s.label} 
        size="small" 
        sx={{ fontWeight: 800, fontSize: '0.75rem', borderRadius: '6px', backgroundColor: s.bg, color: s.text }} 
      />
    );
  };

  const getRegistrationBadge = (status) => {
    const styles = {
      PENDING: { bg: '#fffbeb', text: '#d97706', label: 'Pending Approval' },
      APPROVED: { bg: '#eff6ff', text: '#2563eb', label: 'Approved' },
      REJECTED: { bg: '#fef2f2', text: '#dc2626', label: 'Rejected' },
      ATTENDED: { bg: '#f0fdf4', text: '#16a34a', label: 'Attended' }
    };
    const s = styles[status] || { bg: 'action.hover', text: 'text.secondary', label: 'Registered' };
    return (
      <Chip 
        label={s.label} 
        size="medium" 
        sx={{ fontWeight: 800, borderRadius: '8px', backgroundColor: s.bg, color: s.text, py: 1.5, px: 1 }} 
      />
    );
  };

  if (loading || !event) return <Box sx={{ p: 4 }}><Skeleton variant="rectangular" height={450} sx={{ borderRadius: 4 }} /></Box>;
  if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;

  const registeredCount = event._count?.registration || 0;
  const maxCap = event.maxParticipants || 100;
  const seatsRemaining = Math.max(0, maxCap - registeredCount);
  const progressValue = Math.min((registeredCount / maxCap) * 100, 100);

  // Gradient hero theme background based on ID/type
  const getBannerGradient = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'hackathon':
      case 'tech':
        return 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)';
      case 'cultural':
      case 'arts':
        return 'linear-gradient(135deg, #4c1d95 0%, #6b21a8 50%, #86198f 100%)';
      case 'sports':
        return 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)';
      case 'workshop':
      case 'seminar':
        return 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)';
      default:
        return 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #2563eb 100%)';
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ 
            backgroundColor: 'background.paper', 
            border: '1px solid', 
            borderColor: 'divider', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            '&:hover': { backgroundColor: 'action.hover' } 
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Stack direction="row" spacing={1.5}>
          <Tooltip title="Share Event">
            <IconButton 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showSnackbar('Event URL copied to clipboard!', 'success');
              }}
              sx={{ backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canManage && (
            <>
              <Button 
                startIcon={<EditIcon />} 
                variant="outlined" 
                onClick={() => setIsEditModalOpen(true)} 
                sx={{ borderRadius: '10px', textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
              >
                Edit Event
              </Button>
              <Button 
                startIcon={<DeleteIcon />} 
                variant="contained" 
                onClick={() => setDeleteTarget(event)} 
                sx={{ borderRadius: '10px', textTransform: 'none', backgroundColor: '#ef4444', '&:hover': { backgroundColor: '#dc2626' } }}
              >
                Delete
              </Button>
            </>
          )}
        </Stack>
      </Box>

      {/* Hero Banner Header */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          background: getBannerGradient(event.type),
          color: '#ffffff',
          position: 'relative',
          p: { xs: 3, md: 5 },
          mb: 4,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          {/* Header Badges */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ gap: 1, mb: 2 }}>
            <Chip 
              icon={<CategoryIcon style={{ color: '#fff', fontSize: 16 }} />} 
              label={event.type || 'General Event'} 
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                color: '#fff', 
                fontWeight: 700, 
                backdropFilter: 'blur(10px)',
                fontSize: '0.8rem' 
              }} 
            />
            {getStatusChip(event)}
            <Chip 
              label={`ID: #EVT-${event.id}`} 
              variant="outlined" 
              sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.75rem' }} 
            />
          </Stack>

          {/* Title & Host */}
          <Typography variant="h3" fontWeight="900" sx={{ mb: 1.5, fontSize: { xs: '1.8rem', md: '2.5rem' }, lineHeight: 1.2 }}>
            {event.title}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }} alignItems={{ sm: 'center' }} sx={{ opacity: 0.9, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon fontSize="small" sx={{ color: '#60a5fa' }} />
              <Typography variant="subtitle1" fontWeight="600">
                {event.institution?.name} {event.institution?.code ? `(${event.institution.code})` : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon fontSize="small" sx={{ color: '#34d399' }} />
              <Typography variant="subtitle1" fontWeight="600">
                {event.venue?.name || 'Main Campus Auditorium'}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Decorative backdrop shapes */}
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -80, right: 100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
      </Paper>

      {/* Main Grid Content */}
      <Grid container spacing={4}>
        {/* Main Content Area (Col 8) */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            
            {/* Quick Metrics Cards */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', height: '100%' }}>
                  <CalendarTodayIcon sx={{ color: '#3b82f6', mb: 1, fontSize: 28 }} />
                  <Typography variant="caption" display="block" color="text.secondary" fontWeight="700">START DATE</Typography>
                  <Typography variant="body2" fontWeight="800">
                    {new Date(event.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', height: '100%' }}>
                  <AccessTimeIcon sx={{ color: '#8b5cf6', mb: 1, fontSize: 28 }} />
                  <Typography variant="caption" display="block" color="text.secondary" fontWeight="700">END DATE</Typography>
                  <Typography variant="body2" fontWeight="800">
                    {new Date(event.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', height: '100%' }}>
                  <PeopleOutlineIcon sx={{ color: '#10b981', mb: 1, fontSize: 28 }} />
                  <Typography variant="caption" display="block" color="text.secondary" fontWeight="700">CAPACITY</Typography>
                  <Typography variant="body2" fontWeight="800">{registeredCount} / {maxCap}</Typography>
                  <Typography variant="caption" color={seatsRemaining > 0 ? 'success.main' : 'error.main'} fontWeight="700">
                    {seatsRemaining > 0 ? `${seatsRemaining} seats left` : 'Fully Booked'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', height: '100%' }}>
                  <EmojiEventsOutlinedIcon sx={{ color: '#f59e0b', mb: 1, fontSize: 28 }} />
                  <Typography variant="caption" display="block" color="text.secondary" fontWeight="700">SUB-EVENTS</Typography>
                  <Typography variant="body2" fontWeight="800">{event._count?.segment || 0} Segments</Typography>
                  <Typography variant="caption" color="text.secondary">Competitive Tracks</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Navigation Tabs for Event Details */}
            <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1, backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)' }}>
                <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} textColor="primary" indicatorColor="primary">
                  <Tab label="Overview" sx={{ fontWeight: 800, textTransform: 'none' }} />
                  <Tab label="Timeline & Schedule" sx={{ fontWeight: 800, textTransform: 'none' }} />
                  <Tab label="Guidelines & Rules" sx={{ fontWeight: 800, textTransform: 'none' }} />
                  <Tab label={`Reviews (${ratingStats.count})`} sx={{ fontWeight: 800, textTransform: 'none' }} />
                </Tabs>
              </Box>

              <Box sx={{ p: 4 }}>
                {/* TAB 0: OVERVIEW */}
                {activeTab === 0 && (
                  <Stack spacing={4}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <DescriptionIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight="800">Event Description & Objectives</Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.8, whitespace: 'pre-line' }}>
                        {event.description || 'No detailed description provided for this event.'}
                      </Typography>
                    </Box>

                    <Divider />

                    {/* Venue & Location info */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <LocationOnIcon sx={{ color: '#10b981' }} />
                        <Typography variant="h6" fontWeight="800">Venue & Host Institution</Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="800">HOST INSTITUTION</Typography>
                            <Typography variant="subtitle1" fontWeight="800">{event.institution?.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{event.institution?.location || 'Main University Campus'}</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="800">EVENT VENUE</Typography>
                            <Typography variant="subtitle1" fontWeight="800">{event.venue?.name || 'Main Auditorium'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Capacity: {event.venue?.capacity ? `${event.venue.capacity} persons` : 'Standard Hall'} | {event.venue?.location || 'Block A'}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Event Tags & Categories */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 1.5, color: 'text.secondary' }}>EVENT TAGS</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                        <Chip icon={<LocalOfferIcon fontSize="small" />} label={event.type || 'Inter-College'} variant="outlined" sx={{ fontWeight: 700 }} />
                        <Chip icon={<SchoolIcon fontSize="small" />} label={event.institution?.code || 'Campus'} variant="outlined" sx={{ fontWeight: 700 }} />
                        <Chip icon={<VerifiedIcon fontSize="small" />} label="Verified Certificate" variant="outlined" color="success" sx={{ fontWeight: 700 }} />
                        <Chip icon={<GroupIcon fontSize="small" />} label="Open for all Students" variant="outlined" color="primary" sx={{ fontWeight: 700 }} />
                      </Stack>
                    </Box>
                  </Stack>
                )}

                {/* TAB 1: TIMELINE */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" fontWeight="800" sx={{ mb: 3 }}>Event Schedule & Milestones</Typography>
                    {event.eventtimeline && event.eventtimeline.length > 0 ? (
                      <Stack spacing={2.5}>
                        {event.eventtimeline.map((item, idx) => (
                          <Paper 
                            key={item.id || idx} 
                            elevation={0} 
                            sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2.5, alignItems: 'center' }}
                          >
                            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)', textAlign: 'center', minWidth: 90 }}>
                              <AccessTimeIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Typography variant="caption" display="block" fontWeight="800" color="primary.main">
                                {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="800">{item.description}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(item.time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </Typography>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Stack spacing={2}>
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: isLight ? '#eff6ff' : 'rgba(59,130,246,0.15)' }}>
                            <FlagIcon sx={{ color: '#3b82f6' }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="800">Event Start & Opening Ceremony</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(event.startDate).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}
                            </Typography>
                          </Box>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: isLight ? '#f5f3ff' : 'rgba(139,92,246,0.15)' }}>
                            <EmojiEventsOutlinedIcon sx={{ color: '#8b5cf6' }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="800">Main Competition & Evaluation</Typography>
                            <Typography variant="caption" color="text.secondary">During official event duration</Typography>
                          </Box>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: isLight ? '#ecfdf5' : 'rgba(16,185,129,0.15)' }}>
                            <CheckCircleIcon sx={{ color: '#10b981' }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="800">Valedictory & Prize Distribution</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(event.endDate).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}
                            </Typography>
                          </Box>
                        </Paper>
                      </Stack>
                    )}
                  </Box>
                )}

                {/* TAB 2: GUIDELINES & RULES */}
                {activeTab === 2 && (
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GavelIcon sx={{ color: '#f59e0b' }} />
                      <Typography variant="h6" fontWeight="800">Rules & Code of Conduct</Typography>
                    </Box>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, backgroundColor: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.05)', border: '1px solid', borderColor: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)' }}>
                      <Stack spacing={1.5}>
                        <Typography variant="body2" fontWeight="700" color="#b45309">1. Student ID verification is mandatory upon reporting at the venue.</Typography>
                        <Typography variant="body2" fontWeight="700" color="#b45309">2. All participants must adhere to institutional discipline and maintain code of conduct.</Typography>
                        <Typography variant="body2" fontWeight="700" color="#b45309">3. Registrations are non-transferable once confirmed by the institution coordinator.</Typography>
                        <Typography variant="body2" fontWeight="700" color="#b45309">4. Certificates will be issued digitally post-event completion to verified attendees.</Typography>
                      </Stack>
                    </Paper>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 1.5 }}>Eligibility Criteria</Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CheckCircleIcon fontSize="small" sx={{ color: '#10b981' }} />
                          <Typography variant="body2" fontWeight="600">Open to undergraduate and postgraduate students of enrolled institutions.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CheckCircleIcon fontSize="small" sx={{ color: '#10b981' }} />
                          <Typography variant="body2" fontWeight="600">Prior registration via this platform before deadline is compulsory.</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                )}

                {/* TAB 3: REVIEWS */}
                {activeTab === 3 && (
                  <Stack spacing={4}>
                    {/* Structured Student Feedback Form */}
                    {isStudent && event.status !== 'CANCELLED' && (
                      <EventRating 
                        eventId={event.id} 
                        myFeedback={myFeedback} 
                        onSubmitSuccess={handleFeedbackSubmit} 
                      />
                    )}

                    {/* View All Submitted Reviews */}
                    {event.status !== 'CANCELLED' && (
                      <Box>
                        <Typography variant="h6" fontWeight="800" sx={{ mb: 3 }}>User Reviews ({ratingStats.count})</Typography>
                        {feedbacks.length > 0 ? (
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                              <Box sx={{ textAlign: 'center', py: 3, borderRight: { md: '1px solid' }, borderColor: 'divider', pr: { md: 3 } }}>
                                <Typography variant="h2" fontWeight="900" color="text.primary">{ratingStats.overall.toFixed(1)}</Typography>
                                <Rating value={ratingStats.overall} readOnly precision={0.1} sx={{ my: 1 }} />
                                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block' }}>
                                  Based on {ratingStats.count} Student Reviews
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={8}>
                              <RatingSummary averages={ratingStats} />
                            </Grid>
                            <Grid item xs={12}>
                              <Divider sx={{ my: 2 }} />
                              <Box sx={{ maxHeight: '500px', overflowY: 'auto', mt: 2 }}>
                                {feedbacks.map(f => (
                                  <ReviewCard key={f.id} feedback={f} />
                                ))}
                              </Box>
                            </Grid>
                          </Grid>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">No reviews submitted for this event yet.</Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Stack>
                )}
              </Box>
            </Paper>

          </Stack>
        </Grid>

        {/* Sidebar Actions & Info (Col 4) */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            
            {/* Registration Card */}
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
              <Typography variant="h6" fontWeight="800" sx={{ mb: 2 }}>Registration Card</Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Filled Capacity</Typography>
                  <Typography variant="caption" fontWeight="bold">{Math.round(progressValue)}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progressValue} 
                  sx={{ height: 10, borderRadius: 5, backgroundColor: 'action.hover', '& .MuiLinearProgress-bar': { backgroundColor: '#3b82f6' } }} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">{registeredCount} Registered</Typography>
                  <Typography variant="caption" color="text.secondary">{maxCap} Max Capacity</Typography>
                </Box>
              </Box>
              
              {isStudent && (
                <Stack spacing={2}>
                  <Divider />
                  {isRegistered ? (
                    <Stack spacing={1.5} alignItems="center">
                      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>Your Status:</Typography>
                      {getRegistrationBadge(registrationStatus)}
                      
                      {registrationStatus !== 'ATTENDED' && (
                        <Button 
                          fullWidth variant="outlined" color="error"
                          onClick={handleRegistrationToggle} disabled={registrationLoading}
                          sx={{ textTransform: 'none', borderRadius: '10px', py: 1.2, fontWeight: 700 }}
                        >
                          Cancel Registration
                        </Button>
                      )}
                    </Stack>
                  ) : (
                    <Button 
                      fullWidth variant="contained"
                      onClick={handleRegistrationToggle} 
                      disabled={registrationLoading || registeredCount >= maxCap || event.status === 'COMPLETED' || event.status === 'CANCELLED'}
                      sx={{ 
                        textTransform: 'none', borderRadius: '12px', py: 1.4, fontWeight: 800, fontSize: '1rem',
                        backgroundColor: '#2563eb', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', '&:hover': { backgroundColor: '#1d4ed8' } 
                      }}
                    >
                      {registeredCount >= maxCap ? 'Registration Full' : 'Register for Event'}
                    </Button>
                  )}
                </Stack>
              )}

              {!user && (
                <Button fullWidth variant="contained" onClick={() => navigate('/login')} sx={{ textTransform: 'none', borderRadius: '12px', fontWeight: 800 }}>
                  Log In to Register
                </Button>
              )}
            </Paper>

            {/* Event Coordinators */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ color: 'primary.main' }} /> Event Organizers
              </Typography>
              
              {event.eventcoordinator && event.eventcoordinator.length > 0 ? (
                <Stack spacing={2}>
                  {event.eventcoordinator.map(ec => (
                    <Box key={ec.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', fontWeight: 800 }}>
                        {ec.user?.name?.[0] || 'O'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="700">{ec.user?.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon fontSize="inherit" /> {ec.user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 800 }}>
                    {event.institution?.name?.[0] || 'A'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="700">Institution Coordinator</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {event.institution?.name} Event Desk
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Sponsors Section */}
            {event.sponsor && event.sponsor.length > 0 && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
                <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 2 }}>Event Sponsors</Typography>
                <Stack spacing={1.5}>
                  {event.sponsor.map(s => (
                    <Box key={s.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="700">{s.name}</Typography>
                      <Chip label={`₹${s.contribution}`} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700 }} />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}

          </Stack>
        </Grid>
      </Grid>

      {/* Edit Modal */}
      {canManage && (
        <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1, backgroundColor: 'background.paper' } }}>
          <DialogTitle sx={{ fontWeight: 900, fontSize: '1.4rem' }}>Edit Event Details</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <TextField fullWidth label="Event Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              <FormControl fullWidth>
                <Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} sx={{ borderRadius: '12px' }}>
                  <MenuItem value="UPCOMING">Upcoming</MenuItem>
                  <MenuItem value="ONGOING">Ongoing</MenuItem>
                  <MenuItem value="REGISTRATION_OPEN">Registration Open</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth label="Start Date" type="datetime-local" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              <TextField fullWidth label="End Date" type="datetime-local" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              <TextField fullWidth label="Description" multiline rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={() => setIsEditModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit} sx={{ backgroundColor: '#3b82f6', borderRadius: '12px', px: 4, fontWeight: 700, boxShadow: 'none' }}>Save Changes</Button>
          </DialogActions>
        </Dialog>
      )}

      <DeleteConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} itemName={event.title} />
    </Box>
  );
};

export default EventDetail;
