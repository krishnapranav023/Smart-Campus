import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, List, Button, Stack, IconButton, 
  Tooltip, Badge, Skeleton 
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';

import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { notificationService } from '../services/notificationService';
import EmptyState from '../components/EmptyState';

const Notifications = () => {
  const navigate = useNavigate();
  const { showSnackbar, fetchUnreadCount } = useApp();
  const { execute: fetchNotifications, data: notifications = [], loading } = useAsync(notificationService.getAll);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => (notifications || []).filter(n => !n.read).length, [notifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
      fetchUnreadCount();
    } catch (e) {
      showSnackbar('Action failed', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      showSnackbar('All notifications marked as read');
      fetchNotifications();
      fetchUnreadCount();
    } catch (e) {
      showSnackbar('Action failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      showSnackbar('Notification deleted');
      fetchNotifications();
      fetchUnreadCount();
    } catch (e) {
      showSnackbar('Delete failed', 'error');
    }
  };

  const getTypeStyle = (type) => {
    const styles = {
      INFO: { color: '#3b82f6', bg: '#eff6ff' },
      SUCCESS: { color: '#10b981', bg: '#ecfdf5' },
      WARNING: { color: '#f59e0b', bg: '#fffbeb' },
      ERROR: { color: '#ef4444', bg: '#fef2f2' },
      PROPOSAL: { color: '#8b5cf6', bg: '#f5f3ff' },
      EVENT: { color: '#ec4899', bg: '#fdf2f8' }
    };
    return styles[type] || styles.INFO;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">Alert Center</Typography>
          <Typography variant="body1" color="text.secondary">
            {unreadCount > 0 ? `You have ${unreadCount} unread alerts` : 'All caught up!'}
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button 
            variant="outlined" 
            startIcon={<DoneAllIcon />} 
            onClick={handleMarkAllRead}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      {loading ? (
        <Stack spacing={2}>
          {[1,2,3,4].map(i => <Skeleton key={i} variant="rectangular" height={90} sx={{ borderRadius: 3 }} />)}
        </Stack>
      ) : (
        <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(notifications || []).map((n) => {
            const style = getTypeStyle(n.type);
            return (
              <Paper 
                key={n.id} 
                elevation={0} 
                onClick={() => {
                  if (!n.read) handleMarkAsRead(n.id);
                  if (n.actionPath) navigate(n.actionPath);
                }}
                sx={{ 
                  p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  opacity: n.read ? 0.6 : 1,
                  backgroundColor: n.read ? 'transparent' : 'background.paper',
                  cursor: n.actionPath ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.06)', borderColor: 'text.disabled' }
                }}
              >
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                   <Box sx={{ 
                       width: 48, height: 48, borderRadius: '14px', 
                       backgroundColor: style.bg, color: style.color,
                       display: 'flex', justifyContent: 'center', alignItems: 'center'
                   }}>
                     <NotificationsActiveOutlinedIcon fontSize="medium" />
                   </Box>
                   <Box>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: 'text.primary' }}>{n.title}</Typography>
                        {!n.read && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />}
                     </Box>
                     <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', fontWeight: 500, mb: 1 }}>{n.message}</Typography>
                     <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700 }}>
                        {new Date(n.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                     </Typography>
                   </Box>
                </Box>
                
                <Stack direction="row" spacing={1}>
                  {!n.read && (
                    <Tooltip title="Mark as read">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }} sx={{ color: 'text.secondary', '&:hover': { color: '#3b82f6', bgcolor: 'rgba(59,130,246,0.08)' } }}>
                            <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} sx={{ color: 'text.secondary', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)' } }}>
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            );
          })}
          
          {notifications.length === 0 && (
            <EmptyState 
              title="Inbox Clear" 
              message="When interesting things happen, we'll let you know." 
              icon={InfoOutlinedIcon} 
            />
          )}
        </List>
      )}
    </Box>
  );
};

export default Notifications;
