import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Avatar, Typography, Grid,
  Chip, Divider, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import MailIcon from '@mui/icons-material/Mail';
import PhoneIcon from '@mui/icons-material/Phone';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const ParticipantProfileModal = ({ open, onClose, participant, mode = 'view', onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    about: '',
    institutionId: ''
  });

  useEffect(() => {
    if (participant) {
      setFormData({
        name: participant.name || '',
        email: participant.email || '',
        phone: participant.phone || '',
        about: participant.about || '',
        institutionId: participant.institutionId || ''
      });
    }
  }, [participant]);

  // Bug 15 Fix: Guard against null participant for BOTH modes
  if (!participant && open) return null;
  if (!open) return null;

  const handleSave = () => {
    onSave(participant.id, formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="bold">
          {mode === 'view' ? 'Participant Profile' : 'Edit Profile'}
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, mt: 1 }}>
          <Avatar 
            sx={{ width: 80, height: 80, bgcolor: '#3b82f6', mb: 2, fontSize: '2rem' }}
          >
            {formData.name?.charAt(0) || <PersonIcon />}
          </Avatar>
          <Typography variant="h5" fontWeight="bold">{formData.name}</Typography>
          <Typography variant="body2" color="textSecondary">{participant.institution?.name}</Typography>
        </Box>

        {mode === 'view' ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MailIcon color="action" />
                <Box>
                  <Typography variant="caption" color="textSecondary">Email Address</Typography>
                  <Typography variant="body1">{formData.email}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PhoneIcon color="action" />
                <Box>
                  <Typography variant="caption" color="textSecondary">Phone Number</Typography>
                  <Typography variant="body1">{formData.phone || 'Not provided'}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">About</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                {formData.about || 'No bio provided.'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip icon={<EmojiEventsIcon />} label={`${participant._count?.winner || 0} Wins`} color="primary" variant="outlined" />
                <Chip icon={<SchoolIcon />} label={`${participant._count?.registration || 0} Participations`} color="secondary" variant="outlined" />
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField 
              fullWidth label="Full Name" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
            />
            <TextField 
              fullWidth label="Email Address" 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
            />
            <TextField 
              fullWidth label="Phone Number" 
              value={formData.phone} 
              onChange={e => setFormData({ ...formData, phone: e.target.value })} 
            />
            <TextField 
              fullWidth multiline rows={4} label="About / Bio" 
              value={formData.about} 
              onChange={e => setFormData({ ...formData, about: e.target.value })} 
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
        {mode === 'edit' && (
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#3b82f6', borderRadius: 2 }}>
            Save Changes
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ParticipantProfileModal;
