import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Button, Stack,
  CircularProgress, Divider, Avatar, Dialog, DialogContent, DialogActions, IconButton
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarIcon from '@mui/icons-material/Star';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import CloseIcon from '@mui/icons-material/Close';

import api from '../api';
import { useApp } from '../context/AppContext';

// Theme styling configurations matching Winners.jsx
const getThemeConfig = (pos, isLight) => {
  if (pos === 1) {
    return {
      label: 'Gold Medalist',
      medalText: '1st Place (Winner)',
      primary: '#846215', // Gold
      accent: '#d4af37',
      bg: isLight ? '#fef9c3' : 'rgba(234,179,8,0.18)',
      waxColor: '#d4af37',
      textStyle: 'CERTIFICATE OF MERIT',
      descText: 'for securing a podium finish of 1st Place (Winner)'
    };
  }
  if (pos === 2) {
    return {
      label: 'Silver Medalist',
      medalText: '2nd Place',
      primary: '#475569', // Silver
      accent: '#94a3b8',
      bg: isLight ? '#f1f5f9' : 'rgba(148,163,184,0.18)',
      waxColor: '#94a3b8',
      textStyle: 'CERTIFICATE OF MERIT',
      descText: 'for securing a podium finish of 2nd Place'
    };
  }
  if (pos === 3) {
    return {
      label: 'Bronze Medalist',
      medalText: '3rd Place',
      primary: '#7c2d12', // Bronze
      accent: '#c2410c',
      bg: isLight ? '#ffedd5' : 'rgba(217,119,6,0.18)',
      waxColor: '#c2410c',
      textStyle: 'CERTIFICATE OF MERIT',
      descText: 'for securing a podium finish of 3rd Place'
    };
  }
  // Participation
  return {
    label: 'Participant',
    medalText: 'Participation',
    primary: '#1e3a8a', // Deep Blue
    accent: '#3b82f6',
    bg: isLight ? '#eff6ff' : 'rgba(59,130,246,0.15)',
    waxColor: '#3b82f6',
    textStyle: 'CERTIFICATE OF PARTICIPATION',
    descText: 'for active and valued participation'
  };
};

const positionConfig = {
  1: { label: '1st Place', icon: <LooksOneIcon />, border: '#f59e0b' },
  2: { label: '2nd Place', icon: <LooksTwoIcon />, border: '#9ca3af' },
  3: { label: '3rd Place', icon: <Looks3Icon />,   border: '#fb923c' },
};

const CertificateCard = ({ achievement, onView, studentName }) => {
  const posStyle = positionConfig[achievement.position] || { label: 'Participant', icon: <WorkspacePremiumIcon />, border: '#3b82f6' };
  const theme = getThemeConfig(achievement.position, true);

  const handleDownload = () => {
    // Render and download directly using the SVG converter
    const svgElement = document.querySelector(`#certificate-svg-${achievement.id}`);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1200;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, 1600, 1200);
      
      const png = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = png;
      downloadLink.download = `Certificate_${studentName.replace(/\s+/g, '_')}_${achievement.event?.title?.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    image.src = blobURL;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        border: `2px solid ${posStyle.border}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 32px ${posStyle.border}44` }
      }}
    >
      {/* Hidden SVG Template to enable direct downloads from the card */}
      <Box sx={{ display: 'none' }}>
        <CertificateSvgTemplate id={`certificate-svg-${achievement.id}`} achievement={achievement} studentName={studentName} isLight={true} />
      </Box>

      {/* Gold/Silver/Bronze header banner */}
      <Box sx={{ bgcolor: theme.bg, borderBottom: `1px solid ${posStyle.border}`, px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: posStyle.border, color: '#fff', width: 36, height: 36, '& svg': { fontSize: 20 } }}>
          {posStyle.icon}
        </Avatar>
        <Box>
          <Typography fontWeight={800} fontSize="0.85rem" sx={{ color: theme.primary }}>{posStyle.label}</Typography>
          <Typography fontSize="0.72rem" sx={{ color: theme.primary, opacity: 0.8 }}>Certificate of Achievement</Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <WorkspacePremiumIcon sx={{ color: posStyle.border, fontSize: 32, opacity: 0.7 }} />
        </Box>
      </Box>

      {/* Card body */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5, lineHeight: 1.3 }}>
          {achievement.event?.title || 'Event'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Segment: <strong>{achievement.segment?.name || 'General'}</strong>
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
          AWARDED ON
        </Typography>
        <Typography fontSize="0.85rem" fontWeight={700}>
          {achievement.createdAt ? new Date(achievement.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
        </Typography>

        {achievement.prizeText && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>PRIZE</Typography>
            <Typography fontSize="0.85rem" fontWeight={700}>{achievement.prizeText}</Typography>
          </Box>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Stack direction="row" spacing={1}>
          <Button
            fullWidth size="small" variant="contained" startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.8rem', bgcolor: '#4f46e5', boxShadow: 'none', '&:hover': { bgcolor: '#3b82f6', boxShadow: 'none' } }}
          >
            Download
          </Button>
          <Button
            size="small" variant="outlined" startIcon={<VisibilityIcon />}
            onClick={() => onView(achievement)}
            sx={{ textTransform: 'none', borderRadius: '8px', minWidth: '90px' }}
          >
            View
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

// Common Winner Certificate Design (Standardized SVG)
const CertificateSvgTemplate = ({ id, achievement, studentName, isLight }) => {
  const tc = getThemeConfig(achievement.position, isLight);
  const awardDate = achievement.createdAt ? new Date(achievement.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');

  return (
    <svg id={id} width="800" height="600" viewBox="0 0 800 600" style={{ fontFamily: 'Georgia, serif', display: 'block', backgroundColor: '#fdfbf7', maxWidth: '100%', height: 'auto' }}>
      {/* Background base */}
      <rect width="800" height="600" fill="#fdfbf7" />
      
      {/* Vintage Watermark Background Pattern */}
      <g opacity="0.04">
        <path d="M 0 0 L 800 600 M 800 0 L 0 600" stroke={tc.primary} strokeWidth="2"/>
        <circle cx="400" cy="300" r="220" fill="none" stroke={tc.primary} strokeWidth="1.5" strokeDasharray="5,5" />
        <circle cx="400" cy="300" r="180" fill="none" stroke={tc.primary} strokeWidth="3" />
      </g>

      {/* Double Colored Borders */}
      <rect x="25" y="25" width="750" height="550" fill="none" stroke={tc.primary} strokeWidth="5" />
      <rect x="35" y="35" width="730" height="530" fill="none" stroke={tc.accent} strokeWidth="1.5" />
      <rect x="42" y="42" width="716" height="516" fill="none" stroke={tc.primary} strokeWidth="1" strokeDasharray="3,3" />

      {/* Stylized Corner Ornaments */}
      <path d="M 25 60 L 60 25 M 25 75 L 75 25 M 35 35 L 35 90 M 35 35 L 90 35" stroke={tc.primary} strokeWidth="1.5" fill="none" />
      <path d="M 775 60 L 740 25 M 775 75 L 725 25 M 765 35 L 765 90 M 765 35 L 710 35" stroke={tc.primary} strokeWidth="1.5" fill="none" />
      <path d="M 25 540 L 60 575 M 25 525 L 75 575 M 35 565 L 35 510 M 35 565 L 90 565" stroke={tc.primary} strokeWidth="1.5" fill="none" />
      <path d="M 775 540 L 740 575 M 775 525 L 725 575 M 765 565 L 765 510 M 765 565 L 710 565" stroke={tc.primary} strokeWidth="1.5" fill="none" />

      {/* Header Text */}
      <text x="400" y="85" textAnchor="middle" fontSize="11" fontWeight="bold" fill={tc.primary} letterSpacing="3">
        NATIONAL INTER-UNIVERSITY ALLIANCE
      </text>
      <text x="400" y="125" textAnchor="middle" fontSize="28" fontWeight="800" fill="#1e293b" letterSpacing="2">
        {tc.textStyle}
      </text>
      
      <line x1="300" y1="145" x2="500" y2="145" stroke={tc.primary} strokeWidth="1.5" />
      <circle cx="400" cy="145" r="4" fill={tc.primary} />

      {/* Subtitle */}
      <text x="400" y="185" textAnchor="middle" fontSize="14" fontStyle="italic" fill="#64748b">
        This is proudly presented to
      </text>

      {/* Recipient Name */}
      <text x="400" y="250" textAnchor="middle" fontSize="32" fontWeight="bold" fill={tc.primary} fontStyle="italic">
        {studentName}
      </text>

      {/* Body Text */}
      <text x="400" y="305" textAnchor="middle" fontSize="15" fill="#475569">
        from <tspan fontWeight="bold" fill="#1e293b">{achievement.event?.institution?.name || 'Academic Institution'}</tspan>
      </text>

      <text x="400" y="345" textAnchor="middle" fontSize="16" fill="#475569">
        {tc.descText}
      </text>

      <text x="400" y="380" textAnchor="middle" fontSize="15" fill="#475569">
        in the segment <tspan fontWeight="bold" fill="#1e293b">"{achievement.segment?.name || 'General'}"</tspan> at the national event
      </text>

      {/* Event Title */}
      <text x="400" y="420" textAnchor="middle" fontSize="22" fontWeight="800" fill={tc.primary}>
        {achievement.event?.title}
      </text>

      <text x="400" y="455" textAnchor="middle" fontSize="13" fill="#64748b">
        Conducted on {awardDate}
      </text>

      {/* Wax Seal Ribbon */}
      <g transform="translate(180, 510)">
        <path d="M -10 -5 L -20 40 L 0 35 L 20 40 L 10 -5" fill={tc.accent} opacity="0.8"/>
        <path d="M 0 -5 L 15 45 L 0 38 L -15 45 L 0 -5" fill={tc.primary} opacity="0.9"/>
        <circle cx="0" cy="0" r="30" fill={tc.primary} />
        <circle cx="0" cy="0" r="26" fill={tc.accent} />
        <circle cx="0" cy="0" r="22" fill={tc.primary} />
        {achievement.position ? (
          <polygon points="0,-12 3,-3 12,-3 5,3 8,12 0,6 -8,12 -5,3 -12,-3 -3,-3" fill={tc.accent} />
        ) : (
          <circle cx="0" cy="0" r="6" fill={tc.accent} />
        )}
      </g>

      {/* Signatures */}
      <g transform="translate(280, 520)">
        <text x="0" y="-12" textAnchor="middle" fontSize="18" fontStyle="italic" fill="#1d4ed8">
          {achievement.event?.institution?.code || 'Host'} Coord.
        </text>
        <line x1="-70" y1="0" x2="70" y2="0" stroke="#94a3b8" strokeWidth="1" />
        <text x="0" y="15" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">EVENT COORDINATOR</text>
      </g>

      <g transform="translate(540, 520)">
        <text x="0" y="-12" textAnchor="middle" fontSize="18" fontStyle="italic" fill="#1d4ed8">
          MIP Authority
        </text>
        <line x1="-70" y1="0" x2="70" y2="0" stroke="#94a3b8" strokeWidth="1" />
        <text x="0" y="15" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">PLATFORM AUTHORITY</text>
      </g>

      {/* Secure Verification Hash */}
      <text x="750" y="550" textAnchor="end" fontSize="9" fill="#94a3b8" style={{ fontFamily: 'monospace' }}>
        SECURE ID: MIP-CERT-{achievement.id || 'P'}-{new Date().getFullYear()}
      </text>
    </svg>
  );
};

const MyCertificates = () => {
  const { showSnackbar } = useApp();
  const [achievements, setAchievements] = useState([]);
  const [studentName, setStudentName] = useState('Student');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Preview Dialog States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAchievement, setPreviewAchievement] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const parsedUser = JSON.parse(userStr);
          setStudentName(parsedUser.name || 'Student');
        }

        const res = await api.get('/participants/dashboard-stats');
        const data = res.data.data;
        setAchievements(data.achievements || []);
        setStats(data.kpis || null);
      } catch {
        showSnackbar('Failed to load certificates', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpenPreview = (achievement) => {
    setPreviewAchievement(achievement);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewAchievement(null);
  };

  const handleDownloadPreview = () => {
    if (!previewAchievement) return;
    const svgElement = document.querySelector(`#certificate-svg-preview`);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1200;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, 1600, 1200);
      
      const png = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = png;
      downloadLink.download = `Certificate_${studentName.replace(/\s+/g, '_')}_${previewAchievement.event?.title?.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    image.src = blobURL;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <WorkspacePremiumIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">My Certificates</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.3 }}>
            Your achievement certificates from events you've won.
          </Typography>
        </Box>
      </Box>

      {/* KPI Strip */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: 'Total Certificates', value: achievements.length, color: '#4f46e5', icon: <WorkspacePremiumIcon /> },
            { label: 'Events Won', value: stats.winsCount || 0, color: '#16a34a', icon: <EmojiEventsIcon /> },
            { label: 'Leaderboard Rank', value: stats.leaderboardRank ? `#${stats.leaderboardRank}` : '—', color: '#d97706', icon: <StarIcon /> },
          ].map(s => (
            <Grid item xs={12} md={4} key={s.label}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${s.color}18`, color: s.color, width: 44, height: 44 }}>
                  {s.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Certificates Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : achievements.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
          <WorkspacePremiumIcon sx={{ fontSize: 72, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" fontWeight={700} color="text.secondary">No certificates yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 360, mx: 'auto' }}>
            Participate in events, compete in segments, and win to earn certificates here.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {achievements.map((achievement, i) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id || i}>
              <CertificateCard achievement={achievement} studentName={studentName} onView={handleOpenPreview} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Common Winner Certificate Dialog Preview (standardized SVG) */}
      <Dialog 
        open={previewOpen} 
        onClose={handleClosePreview} 
        maxWidth="md" 
        fullWidth 
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: 0, sm: 4 },
            p: 0,
            m: { xs: 0, sm: 2 },
            width: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
            backgroundColor: 'background.paper',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Digital Certificate Preview
          </Typography>
          <IconButton onClick={handleClosePreview} sx={{ flexShrink: 0 }}><CloseIcon /></IconButton>
        </Box>

        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflowX: 'auto', p: { xs: 1.5, sm: 4 }, bgcolor: 'action.hover' }}>
          {previewAchievement ? (
            <Box sx={{ boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderRadius: '10px', overflow: 'hidden', border: '1px solid', borderColor: 'divider', width: '100%', maxWidth: 760, display: 'flex', justifyContent: 'center' }}>
              <CertificateSvgTemplate id="certificate-svg-preview" achievement={previewAchievement} studentName={studentName} isLight={true} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}><CircularProgress /></Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Button onClick={handleClosePreview} variant="outlined" sx={{ textTransform: 'none', borderRadius: '8px', px: 3 }}>
            Close
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="contained"
            onClick={handleDownloadPreview}
            sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#4f46e5', px: 3, boxShadow: 'none', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyCertificates;
