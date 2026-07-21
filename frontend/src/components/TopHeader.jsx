import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Avatar, IconButton, Badge, Tooltip, Chip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import CommandSearchDialog from './CommandSearchDialog';

const TopHeader = ({ onDrawerToggle = () => {} }) => {
  const navigate = useNavigate();
  const { themeMode, toggleThemeMode, unreadCount } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);

  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) user = JSON.parse(userStr);
  } catch (err) {
    console.error('Header user parse error:', err);
    localStorage.removeItem('user');
  }

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) return null;

  return (
    <>
      <Box sx={{ 
        height: 70, 
        bgcolor: 'background.paper', 
        borderBottom: '1px solid',
        borderBottomColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 4 },
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        {/* Mobile Hamburger Button */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box
          onClick={openSearch}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openSearch();
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.8, sm: 1.5 },
            px: { xs: 1.2, sm: 2 },
            py: 0.8,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            cursor: 'pointer',
            minWidth: 0,
            flex: 1,
            maxWidth: 420,
            overflow: 'hidden',
            transition: 'all 0.15s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: themeMode === 'light' ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.1)',
            },
          }}
        >
          <SearchIcon fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
          <Typography
            variant="body2"
            noWrap
            sx={{ 
              color: 'text.secondary', 
              opacity: 0.8, 
              flex: 1, 
              userSelect: 'none',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Search platform...
          </Typography>
          <Chip
            label="Ctrl+K"
            size="small"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 700,
              height: 22,
              borderRadius: '6px',
              bgcolor: 'background.paper',
              color: 'text.secondary',
              display: { xs: 'none', sm: 'inline-flex' },
              flexShrink: 0
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, ml: { xs: 1, sm: 3 }, flexShrink: 0 }}>
          <Tooltip title={`Toggle ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}>
            <IconButton size="small" onClick={toggleThemeMode} sx={{ color: 'text.secondary' }}>
              {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton size="small" onClick={() => navigate('/notifications')}>
              <Badge badgeContent={unreadCount} color="error" overlap="circular">
                <NotificationsIcon sx={{ color: 'text.secondary' }} />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Settings">
            <IconButton size="small" onClick={() => navigate('/settings')}>
              <SettingsIcon sx={{ color: 'text.secondary' }} />
            </IconButton>
          </Tooltip>

          <Box 
            onClick={() => navigate('/profile')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              cursor: 'pointer',
              pl: 2,
              borderLeft: '1px solid',
              borderLeftColor: 'divider',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" fontWeight="bold" color="text.primary" lineHeight={1.2}>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.role}
              </Typography>
            </Box>
            <Avatar 
              sx={{ 
                width: 36, height: 36, 
                bgcolor: '#3b82f6', 
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              {user.name?.charAt(0)}
            </Avatar>
          </Box>
        </Box>
      </Box>

      <CommandSearchDialog open={searchOpen} onClose={closeSearch} />
    </>
  );
};

export default TopHeader;
