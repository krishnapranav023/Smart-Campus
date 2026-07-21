import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Drawer, List, ListItem, ListItemIcon, ListItemText, 
  Box, Typography, Divider, ListItemButton, Chip
} from '@mui/material';
import { useApp } from '../context/AppContext';

// ── Icons ──────────────────────────────────────────────────────────────────────
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import LogoutIcon from '@mui/icons-material/Logout';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import FeedbackIcon from '@mui/icons-material/Feedback';
import LayersIcon from '@mui/icons-material/Layers';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DescriptionIcon from '@mui/icons-material/Description';
import PlaceIcon from '@mui/icons-material/Place';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HandshakeIcon from '@mui/icons-material/Handshake';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import GetAppIcon from '@mui/icons-material/GetApp';
import ScienceIcon from '@mui/icons-material/Science';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import StarIcon from '@mui/icons-material/Star';

const DRAWER_WIDTH = 260;

// ── Per-role sidebar definitions ───────────────────────────────────────────────

const ADMIN_MENU = [
  { section: 'Overview' },
  { text: 'Dashboard',      icon: <DashboardIcon />,           path: '/dashboard' },
  { text: 'Analytics',      icon: <LayersIcon />,              path: '/analytics' },
  { text: 'Notifications',  icon: <NotificationsNoneIcon />,   path: '/notifications' },

  { section: 'Event Management' },
  { text: 'Events',         icon: <EventIcon />,               path: '/events' },
  { text: 'Proposals',      icon: <DescriptionIcon />,         path: '/proposals' },
  { text: 'Venues',         icon: <PlaceIcon />,               path: '/venues' },
  { text: 'Budget',         icon: <AccountBalanceWalletIcon />,path: '/budget' },
  { text: 'Winners',        icon: <EmojiEventsIcon />,         path: '/winners' },

  { section: 'People' },
  { text: 'Participants',   icon: <PeopleIcon />,              path: '/participants' },
  { text: 'Organizers',     icon: <HandshakeIcon />,           path: '/organizers' },
  { text: 'Institutions',   icon: <CorporateFareIcon />,       path: '/institutions' },
  { text: 'Sponsors',       icon: <StarOutlineIcon />,         path: '/sponsors' },

  { section: 'Tools' },
  { text: 'Leaderboard',    icon: <LeaderboardIcon />,         path: '/leaderboard' },
  { text: 'Feedback',       icon: <FeedbackIcon />,            path: '/feedback' },
  { text: 'Email Testing',  icon: <ScienceIcon />,             path: '/email-testing', badge: 'DEV' },
];

const ORGANIZER_MENU = [
  { section: 'Overview' },
  { text: 'Dashboard',      icon: <DashboardIcon />,           path: '/dashboard' },
  { text: 'Notifications',  icon: <NotificationsNoneIcon />,   path: '/notifications' },

  { section: 'My Events' },
  { text: 'Events',         icon: <EventIcon />,               path: '/events' },
  { text: 'QR Check-in',    icon: <QrCodeScannerIcon />,       path: '/check-in' },
  { text: 'Volunteers',     icon: <HandshakeIcon />,           path: '/volunteers' },
  { text: 'Participants',   icon: <PeopleIcon />,              path: '/participants' },
  { text: 'Winners',        icon: <EmojiEventsIcon />,         path: '/winners' },

  { section: 'Communication' },
  { text: 'Announcements',  icon: <MailOutlineIcon />,         path: '/announcements' },
  { text: 'Reports Center', icon: <GetAppIcon />,              path: '/reports' },
  { text: 'Feedback',       icon: <FeedbackIcon />,            path: '/feedback' },
  { text: 'Analytics',      icon: <LayersIcon />,              path: '/analytics' },

  { section: 'Info' },
  { text: 'Venues',         icon: <PlaceIcon />,               path: '/venues' },
  { text: 'Institutions',   icon: <CorporateFareIcon />,       path: '/institutions' },
];

const STUDENT_MENU = [
  { section: 'My Space' },
  { text: 'Dashboard',      icon: <DashboardIcon />,           path: '/dashboard' },
  { text: 'Notifications',  icon: <NotificationsNoneIcon />,   path: '/notifications' },

  { section: 'Events' },
  { text: 'Browse Events',  icon: <EventIcon />,               path: '/events' },
  { text: 'My Registrations',icon: <HowToRegIcon />,           path: '/participants' },
  { text: 'Volunteer',      icon: <HandshakeIcon />,           path: '/volunteer' },

  { section: 'Achievements' },
  { text: 'Winners',        icon: <EmojiEventsIcon />,         path: '/winners' },
  { text: 'Leaderboard',    icon: <LeaderboardIcon />,         path: '/leaderboard' },
  { text: 'My Certificates',icon: <WorkspacePremiumIcon />,    path: '/certificates' },

  { section: 'Community' },
  { text: 'Feedback',       icon: <FeedbackIcon />,            path: '/feedback' },
  { text: 'Institutions',   icon: <CorporateFareIcon />,       path: '/institutions' },
];

const ROLE_MENUS = {
  ADMIN: ADMIN_MENU,
  ORGANIZER: ORGANIZER_MENU,
  PARTICIPANT: STUDENT_MENU,
};

const ROLE_LABELS = {
  ADMIN: { label: 'Admin', color: '#4f46e5', bg: 'rgba(79,70,229,0.1)' },
  ORGANIZER: { label: 'Organizer', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  PARTICIPANT: { label: 'Student', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
};

// ──────────────────────────────────────────────────────────────────────────────

const Navigation = ({ mobileOpen = false, handleDrawerToggle = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { themeMode } = useApp();

  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) user = JSON.parse(userStr);
  } catch (err) {
    console.error('Nav user parse error:', err);
    localStorage.removeItem('user');
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  const menuItems = ROLE_MENUS[user.role] || STUDENT_MENU;
  const roleStyle = ROLE_LABELS[user.role] || ROLE_LABELS.PARTICIPANT;
  const isLight = themeMode === 'light';

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo + Role Badge */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ 
          width: 38, height: 38, borderRadius: 2, 
          backgroundColor: '#3b82f6', display: 'flex', 
          alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', fontSize: 18, color: '#fff', flexShrink: 0
        }}>
          S
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight="extrabold" sx={{ letterSpacing: 0.5, color: isLight ? '#111827' : '#fff', lineHeight: 1.1 }}>
            SmartCampus
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600, display: 'block' }}>
            {user.role === 'PARTICIPANT' ? 'Student Portal' : `${roleStyle.label} Panel`}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ backgroundColor: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)' }} />

      {/* Menu Items */}
      <Box sx={{ overflow: 'auto', flexGrow: 1, px: 1.5, py: 1 }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0 }} disablePadding>
          {menuItems.map((item, idx) => {
            if (item.section) {
              return (
                <Typography
                  key={`section-${idx}`}
                  variant="caption"
                  sx={{
                    px: 1.5, pt: idx === 0 ? 1 : 2, pb: 0.5,
                    fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.08em',
                    color: isLight ? '#9ca3af' : '#4b5563',
                    textTransform: 'uppercase'
                  }}
                >
                  {item.section}
                </Typography>
              );
            }

            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    handleDrawerToggle();
                  }}
                  sx={{
                    borderRadius: '10px',
                    px: 1.5, py: 0.8,
                    backgroundColor: isActive
                      ? (isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)')
                      : 'transparent',
                    color: isActive
                      ? '#3b82f6'
                      : (isLight ? '#4b5563' : '#9ca3af'),
                    '&:hover': {
                      backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                      color: isLight ? '#111827' : '#e5e7eb',
                      '& .MuiListItemIcon-root': { color: isLight ? '#3b82f6' : '#e5e7eb' }
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: isActive ? '#3b82f6' : 'inherit', '& svg': { fontSize: 20 } }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 }}
                  />
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800, bgcolor: '#4f46e5', color: '#fff', borderRadius: '4px' }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User Info + Logout */}
      <Box sx={{ p: 1.5 }}>
        <Divider sx={{ backgroundColor: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)', mb: 1.5 }} />
        <Box sx={{ px: 1.5, mb: 1 }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: isLight ? '#111827' : '#e5e7eb', display: 'block' }}>
            {user.name}
          </Typography>
          <Typography variant="caption" sx={{ color: isLight ? '#6b7280' : '#6b7280', fontSize: '0.7rem', display: 'block' }}>
            {user.email}
          </Typography>
        </Box>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: '10px', px: 1.5, py: 0.8,
              color: '#f87171',
              '&:hover': { backgroundColor: 'rgba(239,68,68,0.08)' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit', '& svg': { fontSize: 20 } }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Temporary Mobile Drawer (Screens < md) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: isLight ? '#ffffff' : '#090d16',
            color: isLight ? '#1f2937' : '#fff',
            borderRight: isLight ? '1px solid #e5e7eb' : '1px solid #111827',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Permanent Desktop Drawer (Screens >= md) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: isLight ? '#ffffff' : '#090d16',
            color: isLight ? '#1f2937' : '#fff',
            borderRight: isLight ? '1px solid #e5e7eb' : '1px solid #111827',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Navigation;
