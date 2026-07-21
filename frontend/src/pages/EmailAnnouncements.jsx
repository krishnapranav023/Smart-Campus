import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, CircularProgress 
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

import api from '../api';
import { useApp } from '../context/AppContext';

const EmailAnnouncements = () => {
  const { showSnackbar } = useApp();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedEventId, setSelectedEventId] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/organizers/my-events');
        setEvents(res.data.data || []);
      } catch (e) {
        showSnackbar('Error loading coordinated events', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !emailSubject || !emailMessage) {
      showSnackbar('Please fill all announcement fields', 'warning');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await api.post('/organizers/announce', {
        eventId: selectedEventId,
        subject: emailSubject,
        message: emailMessage
      });
      showSnackbar(res.data.message || 'Announcement broadcasted successfully!');
      setEmailSubject('');
      setEmailMessage('');
    } catch (err) {
      showSnackbar('Failed to send announcement broadcast', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <MailOutlineIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">Email Announcement Broadcast</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Directly broadcast styled HTML notifications and reminders to all registered participants.
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <form onSubmit={handleSendAnnouncement}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Target Event</InputLabel>
                <Select
                  value={selectedEventId}
                  label="Select Target Event"
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  {events.map((evt) => (
                    <MenuItem key={evt.id} value={evt.id}>{evt.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Email Subject Title" 
                placeholder="e.g. Important Update: Venue Changed" 
                fullWidth variant="outlined" size="small"
                value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Announcement Message Content" 
                multiline rows={6} placeholder="Write the announcement message content here..." 
                fullWidth variant="outlined"
                value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                type="submit" variant="contained" disabled={sendingEmail} startIcon={<MailOutlineIcon />}
                sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', boxShadow: 'none', px: 4, py: 1 }}
              >
                {sendingEmail ? 'Broadcasting...' : 'Broadcast Email Announcement'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default EmailAnnouncements;
