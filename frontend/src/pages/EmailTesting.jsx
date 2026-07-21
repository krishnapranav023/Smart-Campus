import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Stack, Chip,
  Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Alert, Divider, Avatar
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SendIcon from '@mui/icons-material/Send';
import PreviewIcon from '@mui/icons-material/Preview';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RefreshIcon from '@mui/icons-material/Refresh';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

import api from '../api';
import { useApp } from '../context/AppContext';

const EMAIL_TYPES = [
  'WELCOME', 'REGISTRATION_CONFIRMATION', 'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED',
  'EVENT_REMINDER', 'EVENT_CANCELLATION', 'WINNER_ANNOUNCEMENT', 'CERTIFICATE_AVAILABLE',
  'FEEDBACK_REQUEST', 'PROPOSAL_SUBMITTED', 'PROPOSAL_APPROVED', 'PROPOSAL_REJECTED',
  'PASSWORD_RESET', 'ANNOUNCEMENT'
];

// Dev accounts for quick testing
const DEV_ACCOUNTS = [
  {
    role: 'Admin',
    name: 'Krishna Pranav',
    email: 'krishnapranav2020@gmail.com',
    icon: <AdminPanelSettingsIcon />,
    color: '#4f46e5',
    bg: '#eff6ff',
    suggestedType: 'ANNOUNCEMENT'
  },
  {
    role: 'Student',
    name: 'Krishna Pranav',
    email: 'krishnapranav2024@gmail.com',
    icon: <SchoolIcon />,
    color: '#16a34a',
    bg: '#f0fdf4',
    suggestedType: 'REGISTRATION_APPROVED'
  },
  {
    role: 'Organizer',
    name: 'SCSVMV Organizer',
    email: '11229A023@kanchoiuniv.ac.in',
    icon: <ManageAccountsIcon />,
    color: '#b45309',
    bg: '#fffbeb',
    suggestedType: 'PROPOSAL_APPROVED'
  }
];

const StatusBadge = ({ status }) => {
  const map = {
    CONNECTED: { icon: <CheckCircleOutlineIcon fontSize="small" />, color: '#16a34a', bg: '#f0fdf4', label: 'Connected & Ready' },
    NOT_CONFIGURED: { icon: <WarningAmberIcon fontSize="small" />, color: '#b45309', bg: '#fffbeb', label: 'Mock Mode (Not Configured)' },
    ERROR: { icon: <ErrorOutlineIcon fontSize="small" />, color: '#dc2626', bg: '#fef2f2', label: 'Connection Failed' }
  };
  const s = map[status] || map.NOT_CONFIGURED;
  return (
    <Chip
      icon={s.icon}
      label={s.label}
      size="medium"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 800, fontSize: '0.8rem', px: 1, '& .MuiChip-icon': { color: s.color } }}
    />
  );
};

const EmailTesting = () => {
  const { showSnackbar, themeMode } = useApp();
  const isLight = themeMode === 'light';
  const previewRef = useRef(null);

  const [smtpStatus, setSmtpStatus] = useState(null);
  const [smtpLoading, setSmtpLoading] = useState(true);

  const [recipient, setRecipient] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [emailType, setEmailType] = useState('WELCOME');
  const [sending, setSending] = useState(false);

  // Track which quick-send button is loading
  const [quickSending, setQuickSending] = useState(null);
  // Track "Send to All" state
  const [sendingAll, setSendingAll] = useState(false);

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewing, setPreviewing] = useState(false);

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  const fetchStatus = async () => {
    setSmtpLoading(true);
    try {
      const res = await api.get('/email/status');
      setSmtpStatus(res.data.data);
    } catch {
      setSmtpStatus({ status: 'ERROR', message: 'Failed to fetch SMTP status' });
    } finally {
      setSmtpLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/email/logs?limit=50');
      setLogs(res.data.data || []);
    } catch {
      showSnackbar('Failed to load email delivery logs', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
  }, []);

  // Generic send utility
  const dispatchEmail = async (recipientEmail, recipientNameVal, type) => {
    const res = await api.post('/email/send-test', {
      recipientEmail,
      recipientName: recipientNameVal,
      emailType: type
    });
    return res.data.message;
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!recipient) return showSnackbar('Please enter a recipient email address', 'warning');
    setSending(true);
    try {
      const msg = await dispatchEmail(recipient, recipientName || 'Test Recipient', emailType);
      showSnackbar(msg);
      fetchLogs();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to send test email', 'error');
    } finally {
      setSending(false);
    }
  };

  // Quick send to a specific dev account
  const handleQuickSend = async (account) => {
    setQuickSending(account.email);
    try {
      const msg = await dispatchEmail(account.email, account.name, account.suggestedType);
      showSnackbar(`✅ Sent to ${account.role}: ${account.email}`);
      fetchLogs();
    } catch (err) {
      showSnackbar(`Failed to send to ${account.role}`, 'error');
    } finally {
      setQuickSending(null);
    }
  };

  // Send to all 3 dev accounts sequentially
  const handleSendToAll = async () => {
    setSendingAll(true);
    let success = 0;
    for (const account of DEV_ACCOUNTS) {
      try {
        await dispatchEmail(account.email, account.name, account.suggestedType);
        success++;
      } catch {
        // continue
      }
    }
    showSnackbar(`✅ Sent ${success}/${DEV_ACCOUNTS.length} emails successfully`);
    fetchLogs();
    setSendingAll(false);
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const res = await api.get(`/email/preview/${emailType}`, { responseType: 'text' });
      setPreviewHtml(res.data);
    } catch {
      showSnackbar('Failed to load template preview', 'error');
    } finally {
      setPreviewing(false);
    }
  };

  const handleClearLogs = async () => {
    setClearingLogs(true);
    try {
      await api.delete('/email/logs');
      showSnackbar('Email delivery log history cleared');
      setLogs([]);
    } catch {
      showSnackbar('Failed to clear logs', 'error');
    } finally {
      setClearingLogs(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <MailOutlineIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">Email System Testing Console</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Verify SMTP connectivity, preview styled templates, dispatch test emails, and monitor delivery history.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>

        {/* SMTP Status Card */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>SMTP Connection Status</Typography>
                {smtpLoading ? (
                  <CircularProgress size={20} />
                ) : smtpStatus ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
                    <StatusBadge status={smtpStatus.status} />
                    <Alert severity={smtpStatus.status === 'CONNECTED' ? 'success' : smtpStatus.status === 'ERROR' ? 'error' : 'warning'} sx={{ py: 0.5 }}>
                      {smtpStatus.message}
                    </Alert>
                    {smtpStatus.smtpHost && (
                      <Typography variant="caption" color="text.secondary">
                        Host: <strong>{smtpStatus.smtpHost}:{smtpStatus.smtpPort}</strong> &nbsp;|&nbsp; User: <strong>{smtpStatus.smtpUser}</strong>
                      </Typography>
                    )}
                    {smtpStatus.mockLogPath && (
                      <Typography variant="caption" color="text.secondary">
                        Mock log file: <strong>{smtpStatus.mockLogPath}</strong>
                      </Typography>
                    )}
                  </Box>
                ) : null}
              </Box>
              <Tooltip title="Recheck SMTP Connection">
                <IconButton onClick={fetchStatus} sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: '#4f46e5', color: '#fff' } }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Grid>

        {/* ── Quick Test — Dev Accounts ── */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FlashOnIcon sx={{ color: '#f59e0b' }} /> Quick Test — Dev Accounts
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  One-click send to Admin, Student and Organizer inboxes using their recommended email template.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={sendingAll ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                disabled={sendingAll}
                onClick={handleSendToAll}
                sx={{ textTransform: 'none', borderRadius: '10px', bgcolor: '#4f46e5', boxShadow: 'none', px: 3 }}
              >
                {sendingAll ? 'Sending to all...' : 'Send to All 3'}
              </Button>
            </Box>

            <Grid container spacing={2}>
              {DEV_ACCOUNTS.map((account) => (
                <Grid item xs={12} md={4} key={account.email}>
                  <Box sx={{
                    p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider',
                    display: 'flex', flexDirection: 'column', gap: 1.5,
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: account.bg, color: account.color, width: 40, height: 40 }}>
                        {account.icon}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={700} fontSize="0.9rem">{account.name}</Typography>
                        <Chip label={account.role} size="small" sx={{ bgcolor: account.bg, color: account.color, fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
                      </Box>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      📧 {account.email}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={account.suggestedType.replace(/_/g, ' ')}
                        size="small"
                        sx={{ bgcolor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)', fontSize: '0.6rem', fontWeight: 700, flex: 1, borderRadius: '6px' }}
                      />
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small" fullWidth variant="outlined"
                        onClick={() => { setRecipient(account.email); setRecipientName(account.name); setEmailType(account.suggestedType); }}
                        sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem' }}
                      >
                        Fill Form
                      </Button>
                      <Button
                        size="small" fullWidth variant="contained"
                        disabled={quickSending === account.email}
                        onClick={() => handleQuickSend(account)}
                        startIcon={quickSending === account.email ? <CircularProgress size={12} color="inherit" /> : <SendIcon sx={{ fontSize: 14 }} />}
                        sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: account.color, boxShadow: 'none', fontSize: '0.75rem' }}
                      >
                        {quickSending === account.email ? 'Sending...' : 'Send Now'}
                      </Button>
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Send Custom Test Email + Preview */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Send Custom Test Email</Typography>
            <form onSubmit={handleSendTest}>
              <Stack spacing={2.5}>
                <TextField
                  label="Recipient Email Address"
                  type="email"
                  placeholder="e.g. krishnapranav2024@gmail.com"
                  fullWidth size="small" variant="outlined"
                  value={recipient} onChange={(e) => setRecipient(e.target.value)}
                />
                <TextField
                  label="Recipient Name (Optional)"
                  placeholder="e.g. Krishna Pranav"
                  fullWidth size="small" variant="outlined"
                  value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Email Type / Template</InputLabel>
                  <Select value={emailType} label="Email Type / Template" onChange={(e) => setEmailType(e.target.value)}>
                    {EMAIL_TYPES.map(t => (
                      <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined" startIcon={<PreviewIcon />} onClick={handlePreview}
                    disabled={previewing} sx={{ textTransform: 'none', borderRadius: '8px', flex: 1 }}
                  >
                    {previewing ? 'Loading...' : 'Preview Template'}
                  </Button>
                  <Button
                    type="submit" variant="contained" startIcon={<SendIcon />} disabled={sending}
                    sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#4f46e5', boxShadow: 'none', flex: 1 }}
                  >
                    {sending ? 'Sending...' : 'Send Email'}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Paper>
        </Grid>

        {/* Template Preview Panel */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Email Template Preview
              {previewHtml && (
                <Typography component="span" variant="caption" sx={{ ml: 1, color: '#4f46e5', fontWeight: 600 }}>
                  [{emailType}]
                </Typography>
              )}
            </Typography>
            {previewHtml ? (
              <Box sx={{ height: 350, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <iframe
                  ref={previewRef}
                  srcDoc={previewHtml}
                  title="Email Template Preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  sandbox="allow-same-origin"
                />
              </Box>
            ) : (
              <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <PreviewIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">Click "Preview Template" to see the rendered HTML email</Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Email Delivery History Log */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">Email Delivery History</Typography>
                <Typography variant="body2" color="text.secondary">{logs.length} record{logs.length !== 1 ? 's' : ''} found</Typography>
              </Box>
              <Stack direction="row" spacing={1.5}>
                <Button
                  size="small" startIcon={<RefreshIcon />} variant="outlined" onClick={fetchLogs}
                  sx={{ textTransform: 'none', borderRadius: '8px' }}
                >
                  Refresh
                </Button>
                <Button
                  size="small" startIcon={<DeleteSweepIcon />} variant="outlined" color="error"
                  onClick={handleClearLogs} disabled={clearingLogs}
                  sx={{ textTransform: 'none', borderRadius: '8px' }}
                >
                  {clearingLogs ? 'Clearing...' : 'Clear All Logs'}
                </Button>
              </Stack>
            </Box>

            {logsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>TIMESTAMP</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>RECIPIENT</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>EMAIL TYPE</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>ERROR LOG</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <TableRow key={log.id} hover sx={{ '& td': { py: 1.5 } }}>
                          <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                            {new Date(log.timestamp).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                          </TableCell>
                          <TableCell>
                            <Typography fontSize="0.85rem" fontWeight={600}>{log.recipient}</Typography>
                            {/* Highlight known dev accounts */}
                            {DEV_ACCOUNTS.find(a => a.email === log.recipient) && (
                              <Chip
                                label={DEV_ACCOUNTS.find(a => a.email === log.recipient).role}
                                size="small"
                                sx={{ mt: 0.5, height: 18, fontSize: '0.6rem', fontWeight: 800 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.emailType.replace(/_/g, ' ')}
                              size="small"
                              sx={{ fontWeight: 700, fontSize: '0.65rem', borderRadius: '6px', bgcolor: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.status}
                              size="small"
                              icon={log.status === 'SUCCESS' ? <CheckCircleOutlineIcon fontSize="inherit" /> : <ErrorOutlineIcon fontSize="inherit" />}
                              sx={{
                                fontWeight: 800, fontSize: '0.65rem', borderRadius: '6px',
                                bgcolor: log.status === 'SUCCESS' ? '#f0fdf4' : '#fef2f2',
                                color: log.status === 'SUCCESS' ? '#16a34a' : '#dc2626',
                                '& .MuiChip-icon': { color: log.status === 'SUCCESS' ? '#16a34a' : '#dc2626' }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', color: log.errorMessage ? '#dc2626' : 'text.secondary', maxWidth: 280 }}>
                            {log.errorMessage || '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">No email delivery records found. Use Quick Test above to get started.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailTesting;
