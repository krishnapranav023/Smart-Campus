import React, { Suspense, lazy, useMemo, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, CircularProgress } from '@mui/material';
import { getTheme } from './theme';
import { useApp } from './context/AppContext';

// Layout Components
import Navigation from './components/Navigation';
import TopHeader from './components/TopHeader';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalSnackbar from './components/GlobalSnackbar';

// Lazy Loaded Pages for performance and route splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Institutions = lazy(() => import('./pages/Institutions'));
const InstitutionDetail = lazy(() => import('./pages/InstitutionDetail'));
const Participants = lazy(() => import('./pages/Participants'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Winners = lazy(() => import('./pages/Winners'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Budget = lazy(() => import('./pages/Budget'));
const Proposals = lazy(() => import('./pages/Proposals'));
const Venues = lazy(() => import('./pages/Venues'));
const Users = lazy(() => import('./pages/Users'));
const Organizers = lazy(() => import('./pages/Organizers'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Sponsors = lazy(() => import('./pages/Sponsors'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Settings = lazy(() => import('./pages/Settings'));
const VolunteerManagement = lazy(() => import('./pages/VolunteerManagement'));
const StudentVolunteer = lazy(() => import('./pages/StudentVolunteer'));
const MyCertificates = lazy(() => import('./pages/MyCertificates'));
const QrScannerConsole = lazy(() => import('./pages/QrScannerConsole'));
const EmailAnnouncements = lazy(() => import('./pages/EmailAnnouncements'));
const ReportsCenter = lazy(() => import('./pages/ReportsCenter'));
const EmailTesting = lazy(() => import('./pages/EmailTesting'));

function LayoutWrapper({ children }) {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(prev => !prev);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: 'background.default',
      color: 'text.primary',
      transition: 'background-color 0.2s ease, color 0.2s ease'
    }}>
      {!isAuthPage && <Navigation mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          width: isAuthPage ? '100%' : { xs: '100%', md: 'calc(100% - 260px)' },
          minWidth: 0 // Prevent overflow
        }}
      >
        {!isAuthPage && <TopHeader onDrawerToggle={handleDrawerToggle} />}
        <Box sx={{ p: isAuthPage ? 0 : { xs: 2, sm: 3, md: 4 }, overflow: 'auto', flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  const { themeMode } = useApp();
  const currentTheme = useMemo(() => getTheme(themeMode), [themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <GlobalSnackbar />
      <Router>
        <LayoutWrapper>
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <CircularProgress size={50} thickness={4} />
            </Box>
          }>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
              <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
              <Route path="/institutions" element={<ProtectedRoute><Institutions /></ProtectedRoute>} />
              <Route path="/institutions/:id" element={<ProtectedRoute><InstitutionDetail /></ProtectedRoute>} />
              
              {/* Roles Restricted */}
              <Route path="/participants" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}><Participants /></ProtectedRoute>
              } />
              <Route path="/organizers" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><Organizers /></ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><Users /></ProtectedRoute>
              } />
              <Route path="/proposals" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><Proposals /></ProtectedRoute>
              } />
              <Route path="/venues" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}><Venues /></ProtectedRoute>
              } />
              <Route path="/budget" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><Budget /></ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}><Analytics /></ProtectedRoute>
              } />
              <Route path="/sponsors" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><Sponsors /></ProtectedRoute>
              } />
              {/* Volunteers — Organizer sees management, Student sees apply page */}
              <Route path="/volunteers" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}><VolunteerManagement /></ProtectedRoute>
              } />
              <Route path="/volunteer" element={
                <ProtectedRoute allowedRoles={['PARTICIPANT']}><StudentVolunteer /></ProtectedRoute>
              } />
              <Route path="/certificates" element={
                <ProtectedRoute allowedRoles={['PARTICIPANT']}><MyCertificates /></ProtectedRoute>
              } />
              <Route path="/check-in" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}><QrScannerConsole /></ProtectedRoute>
              } />
              <Route path="/announcements" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}><EmailAnnouncements /></ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}><ReportsCenter /></ProtectedRoute>
              } />
              <Route path="/email-testing" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><EmailTesting /></ProtectedRoute>
              } />

              {/* Common Authenticated */}
              <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="/winners" element={<ProtectedRoute><Winners /></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </LayoutWrapper>
      </Router>
    </ThemeProvider>
  );
}

export default App;
