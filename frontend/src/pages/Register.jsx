import React, { useState } from 'react';
import { 
  Box, Button, TextField, Typography, Paper, Container, Tooltip, IconButton, 
  Select, MenuItem, FormControl, InputLabel 
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [role, setRole] = useState('PARTICIPANT');
  const { themeMode, toggleThemeMode } = useApp();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', { 
        name, email, password, institutionId: Number(institutionId), role 
      });
      // Extract the correct user data from response.data.data
      const userData = response.data.data;
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const isLight = themeMode === 'light';

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundImage: isLight 
        ? 'radial-gradient(circle at bottom left, #e0f2fe 0%, #f4f6f8 60%)' 
        : 'radial-gradient(circle at bottom left, #0e1e38 0%, #030712 60%)',
      position: 'relative',
      transition: 'background-image 0.2s',
    }}>
      {/* Floating Theme Toggle */}
      <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}>
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

      <Container maxWidth="xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5 }}
        >
          <Paper 
            elevation={10} 
            sx={{ 
              p: 4, 
              borderRadius: 3, 
              textAlign: 'center',
              backgroundColor: isLight ? '#ffffff' : 'rgba(21, 28, 43, 0.65)',
              border: '1px solid',
              borderColor: isLight ? '#e5e7eb' : '#1e293b',
              backdropFilter: 'blur(16px)',
              transition: 'background-color 0.2s, border-color 0.2s'
            }}
          >
            <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom>
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Join the Multi-Institution Platform
            </Typography>

            <form onSubmit={handleRegister}>
              <TextField 
                fullWidth 
                label="Full Name" 
                variant="outlined" 
                margin="normal" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                    color: isLight ? '#0f172a' : '#e2e8f0',
                    '& fieldset': { borderColor: isLight ? '#cbd5e1' : '#334155' },
                    '&:hover fieldset': { borderColor: isLight ? '#94a3b8' : '#475569' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                  }
                }} 
              />
              <TextField 
                fullWidth 
                label="Email" 
                type="email" 
                variant="outlined" 
                margin="normal" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                    color: isLight ? '#0f172a' : '#e2e8f0',
                    '& fieldset': { borderColor: isLight ? '#cbd5e1' : '#334155' },
                    '&:hover fieldset': { borderColor: isLight ? '#94a3b8' : '#475569' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                  }
                }} 
              />
              <TextField 
                fullWidth 
                label="Password" 
                type="password" 
                variant="outlined" 
                margin="normal" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                    color: isLight ? '#0f172a' : '#e2e8f0',
                    '& fieldset': { borderColor: isLight ? '#cbd5e1' : '#334155' },
                    '&:hover fieldset': { borderColor: isLight ? '#94a3b8' : '#475569' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                  }
                }} 
              />
              <TextField 
                fullWidth 
                label="Institution ID (Ex: 1)" 
                type="number" 
                variant="outlined" 
                margin="normal" 
                value={institutionId} 
                onChange={(e) => setInstitutionId(e.target.value)} 
                required 
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                    color: isLight ? '#0f172a' : '#e2e8f0',
                    '& fieldset': { borderColor: isLight ? '#cbd5e1' : '#334155' },
                    '&:hover fieldset': { borderColor: isLight ? '#94a3b8' : '#475569' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                  }
                }} 
              />

              <FormControl fullWidth variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
                <InputLabel id="role-select-label">Account Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  label="Account Role"
                  sx={{ 
                    borderRadius: '10px',
                    backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                    color: isLight ? '#0f172a' : '#e2e8f0',
                    '& fieldset': { borderColor: isLight ? '#cbd5e1' : '#334155' },
                    '&:hover fieldset': { borderColor: isLight ? '#94a3b8' : '#475569' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                  }}
                >
                  <MenuItem value="PARTICIPANT">Student / Participant</MenuItem>
                  <MenuItem value="ORGANIZER">Event Coordinator / Organizer</MenuItem>
                </Select>
              </FormControl>
              <Button type="submit" fullWidth variant="contained" color="primary" size="large" sx={{ py: 1.5, fontWeight: 700, borderRadius: '10px' }}>
                Register
              </Button>
            </form>

            <Box mt={3}>
              <Typography variant="body2" color="text.secondary">
                Already have an account? {' '}
                <Link to="/login" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Register;
