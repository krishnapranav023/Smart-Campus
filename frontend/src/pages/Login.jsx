import React, { useState, useEffect, useMemo } from 'react';
import { Box, Button, TextField, Typography, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useApp } from '../context/AppContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LayersIcon from '@mui/icons-material/Layers';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

const getDemoCredentials = () => [
  { role: 'Admin', email: 'krishnapranav2020@gmail.com', password: localStorage.getItem('demo_password_krishnapranav2020@gmail.com') || 'password123', color: '#6366f1' },
  { role: 'Organizer', email: '11229A023@kanchoiuniv.ac.in', password: localStorage.getItem('demo_password_11229A023@kanchoiuniv.ac.in') || 'password123', color: '#10b981' },
  { role: 'Participant', email: 'krishnapranav2024@gmail.com', password: localStorage.getItem('demo_password_krishnapranav2024@gmail.com') || 'password123', color: '#f59e0b' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, themeMode, toggleThemeMode } = useApp();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/global')
      .then(res => {
        if (res.data?.data) {
          setStats(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const demoCredentials = useMemo(() => getDemoCredentials(), []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        login(response.data.data);
        navigate('/dashboard');
      } else {
        alert(response.data.message || 'Login failed');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    }
  };

  const fillCredentials = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  const isFormFilled = email.trim() !== '' && password.trim() !== '';
  const isLight = themeMode === 'light';

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' },
      alignItems: { xs: 'center', md: 'stretch' },
      justifyContent: 'center',
      backgroundColor: isLight ? '#f4f6f8' : '#030712',
      color: isLight ? '#111827' : '#fff',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      py: { xs: 4, md: 0 },
      px: { xs: 2, sm: 4, md: 0 },
      transition: 'background-color 0.2s, color 0.2s',
    }}>
      {/* Floating Theme Toggle */}
      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 20 }, right: { xs: 12, sm: 20 }, zIndex: 100 }}>
        <Tooltip title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}>
          <IconButton 
            onClick={toggleThemeMode} 
            sx={{ 
              color: isLight ? '#475569' : '#cbd5e1', 
              border: '1px solid', 
              borderColor: isLight ? '#cbd5e1' : '#334155', 
              bgcolor: isLight ? '#ffffff' : '#111827',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              '&:hover': {
                bgcolor: isLight ? '#f1f5f9' : '#1f2937'
              }
            }}
          >
            {isLight ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ─── LEFT PANEL (Brand, Stats, Demo Credentials) ─── */}
      <Box sx={{ 
        flex: 1, 
        width: '100%',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        px: { xs: 2, sm: 4, md: 8 },
        py: { xs: 3, md: 6 },
        maxWidth: { xs: '100%', md: 600 },
      }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 3, md: 5 } }}>
          <Box sx={{ 
            width: 44, height: 44, borderRadius: '12px', 
            background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <LayersIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.02em', color: isLight ? '#1e293b' : '#fff' }}>EventHub</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', letterSpacing: '0.04em', fontWeight: 600 }}>Inter-College Event Management</Typography>
          </Box>
        </Box>

        {/* Headline */}
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.2rem', md: '2.4rem' }, lineHeight: 1.15, color: isLight ? '#0f172a' : '#fff', mb: 2 }}>
          The command center<br />for inter-college events
        </Typography>
        <Typography sx={{ color: isLight ? '#475569' : '#94a3b8', fontSize: { xs: '0.875rem', sm: '0.95rem' }, lineHeight: 1.6, mb: 4, maxWidth: 440, fontWeight: 500 }}>
          Manage events, track participation, analyze performance, and coordinate across institutions — all in one place.
        </Typography>

        {/* Dynamic Live Database Stats Cards */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 4, flexWrap: 'wrap' }}>
          {[
            { num: stats ? `${stats.totalInstitutions}` : '35', label: 'Institutions', color: '#3b82f6' },
            { num: stats ? `${stats.totalEvents}` : '328', label: 'Events', color: '#10b981' },
            { num: stats ? `${stats.totalParticipants}` : '1,001', label: 'Participants', color: '#f59e0b' },
          ].map((stat) => (
            <Box key={stat.label} sx={{ 
              border: '1px solid',
              borderColor: isLight ? '#e2e8f0' : '#1e293b', 
              borderRadius: '12px', 
              px: { xs: 2, sm: 3 }, 
              py: 1.5, 
              flex: 1,
              minWidth: { xs: 90, sm: 110 },
              background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.35)', 
              backdropFilter: 'blur(8px)',
              boxShadow: isLight ? '0 4px 6px -1px rgba(0,0,0,0.02)' : 'none',
              transition: 'all 0.2s',
            }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.2rem', sm: '1.4rem' }, color: stat.color }}>{stat.num}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 600 }}>{stat.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Demo Credentials */}
        <Box sx={{ 
          border: '1px solid',
          borderColor: isLight ? '#e2e8f0' : '#1e293b', 
          borderRadius: '14px', 
          p: { xs: 2, sm: 2.5 },
          background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.25)', 
          backdropFilter: 'blur(8px)',
          boxShadow: isLight ? '0 10px 15px -3px rgba(0,0,0,0.02)' : 'none',
          transition: 'all 0.2s',
        }}>
          <Typography sx={{ 
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.15em', 
            color: isLight ? '#475569' : '#94a3b8', textTransform: 'uppercase', mb: 2 
          }}>
            Quick Demo Login
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {demoCredentials.map((cred) => (
              <Box 
                key={cred.role}
                onClick={() => fillCredentials(cred)}
                sx={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderLeft: `3px solid ${cred.color}`, borderRadius: '8px',
                  px: 2, py: 1.5, cursor: 'pointer',
                  background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)',
                  border: isLight ? '1px solid #f1f5f9' : 'none',
                  borderLeftColor: cred.color,
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.7)', 
                    transform: 'translateX(4px)' 
                  },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: cred.color }}>{cred.role}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 500, wordBreak: 'break-all' }}>{cred.email}</Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: isLight ? '#94a3b8' : '#64748b' }}>Password: {cred.password}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.72rem', color: isLight ? '#94a3b8' : '#64748b', fontStyle: 'italic', fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>Click to fill</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ─── RIGHT PANEL (Sign In Form) ─── */}
      <Box sx={{ 
        flex: 1, 
        width: '100%',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        px: { xs: 2, sm: 4, md: 8 },
        py: { xs: 2, md: 0 },
      }}>
        <Box sx={{ 
          width: '100%', maxWidth: 420, 
          background: isLight ? '#ffffff' : 'rgba(21, 28, 43, 0.65)', 
          border: '1px solid',
          borderColor: isLight ? '#e5e7eb' : '#1e293b', 
          borderRadius: '16px',
          backdropFilter: 'blur(16px)',
          boxShadow: isLight ? '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.01)' : 'none',
          p: { xs: 3, sm: 4 },
          transition: 'all 0.2s',
        }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', color: isLight ? '#0f172a' : '#fff', mb: 0.5 }}>Sign In</Typography>
          <Typography sx={{ fontSize: '0.88rem', color: isLight ? '#475569' : '#94a3b8', mb: 3.5, fontWeight: 500 }}>Enter your credentials to continue</Typography>

          <form onSubmit={handleLogin}>
            <Typography sx={{ fontSize: '0.82rem', color: isLight ? '#475569' : '#94a3b8', mb: 0.8, fontWeight: 600 }}>Email Address</Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              sx={{ 
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                  borderRadius: '10px',
                  color: isLight ? '#0f172a' : '#e2e8f0',
                  '& fieldset': { borderColor: isLight ? '#cbd5e1' : '#334155' },
                  '&:hover fieldset': { borderColor: isLight ? '#94a3b8' : '#475569' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
                '& .MuiInputBase-input::placeholder': { color: isLight ? '#94a3b8' : '#475569', opacity: 1 },
              }}
            />

            <Typography sx={{ fontSize: '0.82rem', color: isLight ? '#475569' : '#94a3b8', mb: 0.8, fontWeight: 600 }}>Password</Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword 
                        ? <VisibilityOffIcon sx={{ color: isLight ? '#94a3b8' : '#64748b', fontSize: 20 }} /> 
                        : <VisibilityIcon sx={{ color: isLight ? '#94a3b8' : '#64748b', fontSize: 20 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 3.5,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                  borderRadius: '10px',
                  color: isLight ? '#0f172a' : '#e2e8f0',
                  '& fieldset': { borderColor: isLight ? '#cbd5e1' : '#334155' },
                  '&:hover fieldset': { borderColor: isLight ? '#94a3b8' : '#475569' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
                '& .MuiInputBase-input::placeholder': { color: isLight ? '#94a3b8' : '#475569', opacity: 1 },
              }}
            />

            <Button 
              type="submit" 
              fullWidth 
              variant="contained"
              disabled={!isFormFilled}
              sx={{ 
                py: 1.4, fontWeight: 700, fontSize: '0.95rem', borderRadius: '10px',
                textTransform: 'none', letterSpacing: '0.02em',
                background: isFormFilled ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : (isLight ? '#e2e8f0' : '#1e293b'),
                color: isFormFilled ? '#fff' : (isLight ? '#94a3b8' : '#475569'),
                boxShadow: isFormFilled ? '0 4px 14px rgba(59, 130, 246, 0.4)' : 'none',
                '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' },
                '&.Mui-disabled': { background: isLight ? '#e2e8f0' : '#1e293b', color: isLight ? '#94a3b8' : '#475569' },
                mb: 2.5
              }}
            >
              Sign In
            </Button>
          </form>

          <Box sx={{ textAlignment: 'center', display: 'flex', justifyContent: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ color: isLight ? '#475569' : '#94a3b8', fontWeight: 500 }}>
              Don't have an account?
            </Typography>
            <Typography 
              variant="body2" 
              onClick={() => navigate('/register')}
              sx={{ color: '#3b82f6', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              Create Account
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
