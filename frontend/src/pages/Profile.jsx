import React from 'react';
import { Box, Typography, Paper, TextField, Button, Avatar, Chip, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const Profile = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {
    name: 'Platform Admin',
    email: 'admin@platform.edu',
    role: 'ADMIN',
    institutionId: 1,
    createdAt: new Date().toISOString()
  };

  const roleColors = {
    ADMIN:       { bg: 'rgba(239,68,68,0.12)',    color: '#f87171' },
    ORGANIZER:   { bg: 'rgba(99,102,241,0.12)',   color: '#818cf8' },
    PARTICIPANT: { bg: 'rgba(16,185,129,0.12)',   color: '#34d399' },
  };
  const rc = roleColors[user.role] || { bg: 'action.hover', color: 'text.secondary' };

  const infoRows = [
    { label: 'Email',         value: user.email },
    { label: 'Role',          value: user.role },
    { label: 'Institution ID', value: user.institutionId || 1 },
    { label: 'Member since',  value: user.createdAt && !isNaN(Date.parse(user.createdAt)) ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'Jan 2026' },
  ];

  return (
    <Box sx={{ maxWidth: 620 }}>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          My Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update your profile information
        </Typography>
      </Box>

      {/* Avatar row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(99,102,241,0.18)', color: '#818cf8', fontSize: '28px', fontWeight: 'bold' }}>
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: 'text.primary' }}>
            {user.name}
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 1 }}>
            {user.email}
          </Typography>
          <Chip
            label={user.role}
            size="small"
            sx={{ backgroundColor: rc.bg, color: rc.color, fontWeight: 700, borderRadius: '6px', fontSize: '0.7rem' }}
          />
        </Box>
      </Box>

      {/* Edit Information card */}
      <Paper
        elevation={0}
        sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', mb: 3 }}
      >
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" mb={3}>
          Edit Information
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, mb: 1 }}>
            Display Name
          </Typography>
          <TextField
            fullWidth variant="outlined" size="small"
            defaultValue={user.name}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, mb: 1 }}>
            Phone Number
          </Typography>
          <TextField
            fullWidth variant="outlined" size="small"
            defaultValue="+91 98765 43210"
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, mb: 1 }}>
            Bio
          </Typography>
          <TextField
            fullWidth multiline rows={3} variant="outlined" size="small"
            defaultValue="System administrator for the Multi-Institution Event Management Platform."
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{
            backgroundColor: '#3b82f6', textTransform: 'none',
            borderRadius: '8px', boxShadow: 'none', fontWeight: 700,
            '&:hover': { backgroundColor: '#2563eb' }
          }}
        >
          Save Changes
        </Button>
      </Paper>

      {/* Account Information card */}
      <Paper
        elevation={0}
        sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}
      >
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" mb={3}>
          Account Information
        </Typography>

        {infoRows.map((row, i) => (
          <React.Fragment key={row.label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
              <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                {row.label}
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: 'text.primary', fontWeight: 600 }}>
                {row.value}
              </Typography>
            </Box>
            {i < infoRows.length - 1 && <Divider sx={{ borderColor: 'divider' }} />}
          </React.Fragment>
        ))}
      </Paper>
    </Box>
  );
};

export default Profile;
