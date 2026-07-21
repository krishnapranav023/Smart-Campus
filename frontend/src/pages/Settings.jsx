import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, Switch, 
  FormControlLabel, Divider, Card, CardContent, Stack, Radio, RadioGroup,
  FormControl, FormLabel, InputAdornment, IconButton
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PaletteIcon from '@mui/icons-material/Palette';
import SecurityIcon from '@mui/icons-material/Security';
import ShieldIcon from '@mui/icons-material/Shield';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SaveIcon from '@mui/icons-material/Save';

import api from '../api';
import { useApp } from '../context/AppContext';

const Settings = () => {
  const { showSnackbar, themeMode, toggleThemeMode } = useApp();
  const isDark = themeMode === 'dark';

  // Get current user ID for per-user scoping
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.id || 'default';
  const prefKey = (key) => `pref_${userId}_${key}`;

  // State for security / password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Load preferences from per-user scoped localStorage or defaults
  const [emailAlerts, setEmailAlerts] = useState(() => JSON.parse(localStorage.getItem(prefKey('email_alerts')) ?? 'true'));
  const [pushAlerts, setPushAlerts] = useState(() => JSON.parse(localStorage.getItem(prefKey('push_alerts')) ?? 'true'));
  const [resultsAlerts, setResultsAlerts] = useState(() => JSON.parse(localStorage.getItem(prefKey('results_alerts')) ?? 'true'));
  const [visibility, setVisibility] = useState(() => localStorage.getItem(prefKey('visibility')) || 'public');

  const handleSavePreferences = () => {
    localStorage.setItem(prefKey('email_alerts'), JSON.stringify(emailAlerts));
    localStorage.setItem(prefKey('push_alerts'), JSON.stringify(pushAlerts));
    localStorage.setItem(prefKey('results_alerts'), JSON.stringify(resultsAlerts));
    localStorage.setItem(prefKey('visibility'), visibility);
    showSnackbar('Preferences saved successfully', 'success');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showSnackbar('All password fields are required', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar('New password and confirmation do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showSnackbar('New password must be at least 6 characters long', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      
      const userObj = JSON.parse(localStorage.getItem('user'));
      if (userObj && userObj.email) {
        localStorage.setItem(`demo_password_${userObj.email}`, newPassword);
      }

      showSnackbar('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Settings &amp; Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your account settings, theme customizations, security configurations, and notification controls
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Side: Theme & Preferences */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Theme Customization Card */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PaletteIcon sx={{ color: '#3b82f6' }} />
                  <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                    Theme Settings
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="text.primary">
                      Theme Mode
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Toggle between light and dark theme modes
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isDark}
                        onChange={toggleThemeMode}
                        icon={<LightModeIcon sx={{ fontSize: 18, color: '#f59e0b' }} />}
                        checkedIcon={<DarkModeIcon sx={{ fontSize: 18, color: '#6366f1' }} />}
                      />
                    }
                    label=""
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Notification Control Card */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <NotificationsActiveIcon sx={{ color: '#10b981' }} />
                  <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                    Notification Preferences
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={emailAlerts} 
                        onChange={(e) => setEmailAlerts(e.target.checked)} 
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium" color="text.primary">
                          Email Notifications
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Receive alerts for registration approvals and event changes
                        </Typography>
                      </Box>
                    }
                  />

                  <FormControlLabel
                    control={
                      <Switch 
                        checked={pushAlerts} 
                        onChange={(e) => setPushAlerts(e.target.checked)} 
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium" color="text.primary">
                          Push Alerts
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Get real-time browser notifications for updates
                        </Typography>
                      </Box>
                    }
                  />

                  <FormControlLabel
                    control={
                      <Switch 
                        checked={resultsAlerts} 
                        onChange={(e) => setResultsAlerts(e.target.checked)} 
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium" color="text.primary">
                          Result Announcements
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Notify me immediately when event podium winners are declared
                        </Typography>
                      </Box>
                    }
                  />
                </Stack>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSavePreferences}
                  sx={{ mt: 3, textTransform: 'none', borderRadius: '8px', fontWeight: 700, backgroundColor: '#3b82f6', boxShadow: 'none' }}
                >
                  Save Preferences
                </Button>
              </CardContent>
            </Card>

          </Stack>
        </Grid>

        {/* Right Side: Security / Password Change */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityIcon sx={{ color: '#ef4444' }} />
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  Security (Change Password)
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handleChangePassword}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                            {showCurrentPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />

                  <TextField
                    fullWidth
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton type="button" onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                            {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />

                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                            {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={changingPassword}
                    sx={{ 
                      textTransform: 'none', 
                      backgroundColor: '#ef4444', 
                      boxShadow: 'none', 
                      borderRadius: '8px', 
                      fontWeight: 700, 
                      py: 1.2,
                      '&:hover': { backgroundColor: '#dc2626' } 
                    }}
                  >
                    {changingPassword ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
