import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, DialogContent, InputBase, Box, Typography, List, ListItemButton, 
  ListItemIcon, ListItemText, Stack, Chip, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import RateReviewIcon from '@mui/icons-material/RateReview';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import LayersIcon from '@mui/icons-material/Layers';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PlaceIcon from '@mui/icons-material/Place';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonIcon from '@mui/icons-material/Person';

import api from '../api';
import { useApp } from '../context/AppContext';

const PAGE_DEFINITIONS = [
  { name: 'Dashboard', path: '/dashboard', icon: DashboardIcon, roles: ['ADMIN', 'ORGANIZER', 'PARTICIPANT'], keywords: ['home', 'overview'] },
  { name: 'Events', path: '/events', icon: EventIcon, roles: ['ADMIN', 'ORGANIZER', 'PARTICIPANT'], keywords: ['catalog', 'hackathon', 'fest'] },
  { name: 'Institutions', path: '/institutions', icon: CorporateFareIcon, roles: ['ADMIN', 'ORGANIZER', 'PARTICIPANT'], keywords: ['college', 'university', 'srm'] },
  { name: 'Participants', path: '/participants', icon: PeopleIcon, roles: ['ADMIN', 'ORGANIZER'], keywords: ['students', 'people'] },
  { name: 'Leaderboard', path: '/leaderboard', icon: LeaderboardIcon, roles: ['ADMIN', 'ORGANIZER', 'PARTICIPANT'], keywords: ['rank', 'score', 'points'] },
  { name: 'Winners', path: '/winners', icon: EmojiEventsIcon, roles: ['ADMIN', 'ORGANIZER', 'PARTICIPANT'], keywords: ['achievements', 'trophy', 'awards'] },
  { name: 'Feedback', path: '/feedback', icon: RateReviewIcon, roles: ['ADMIN', 'ORGANIZER', 'PARTICIPANT'], keywords: ['reviews', 'rating'] },
  { name: 'Analytics', path: '/analytics', icon: LayersIcon, roles: ['ADMIN', 'ORGANIZER'], keywords: ['stats', 'metrics', 'reports'] },
  { name: 'Budget', path: '/budget', icon: AccountBalanceWalletIcon, roles: ['ADMIN'], keywords: ['finance', 'funds', 'money'] },
  { name: 'Proposals', path: '/proposals', icon: DescriptionIcon, roles: ['ADMIN', 'ORGANIZER'], keywords: ['pipeline', 'submit'] },
  { name: 'Sponsors', path: '/sponsors', icon: StarOutlineIcon, roles: ['ADMIN', 'ORGANIZER'], keywords: ['partners', 'funding'] },
  { name: 'Venues', path: '/venues', icon: PlaceIcon, roles: ['ADMIN', 'ORGANIZER'], keywords: ['location', 'hall', 'room'] },
  { name: 'Users', path: '/users', icon: PeopleIcon, roles: ['ADMIN'], keywords: ['accounts', 'admin'] },
  { name: 'Organizers', path: '/organizers', icon: PeopleIcon, roles: ['ADMIN'], keywords: ['coordinators', 'staff'] },
  { name: 'Notifications', path: '/notifications', icon: NotificationsNoneIcon, roles: ['ADMIN', 'ORGANIZER', 'PARTICIPANT'], keywords: ['alerts', 'messages'] },
  { name: 'Profile', path: '/profile', icon: PersonIcon, roles: ['ADMIN', 'ORGANIZER', 'PARTICIPANT'], keywords: ['account', 'settings', 'me'] },
];

const normalize = (value) => (value || '').toLowerCase().trim();

const matchesQuery = (query, ...fields) => {
  if (!query) return true;
  const q = normalize(query);
  return fields.some((field) => normalize(field).includes(q));
};

const extractList = (res) => {
  const payload = res?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const CommandSearchDialog = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, themeMode } = useApp();
  const isLight = themeMode === 'light';
  
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [winners, setWinners] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const role = user?.role;

  const accessiblePages = useMemo(
    () => PAGE_DEFINITIONS.filter((page) => !role || page.roles.includes(role)),
    [role]
  );

  useEffect(() => {
    if (!open) return;

    setQuery('');
    setActiveIndex(0);
    setEvents([]);
    setWinners([]);
    const timer = setTimeout(() => inputRef.current?.focus(), 80);

    const loadIndex = async () => {
      try {
        const requests = [api.get('/institutions')];

        if (role === 'ADMIN' || role === 'ORGANIZER') {
          requests.push(api.get('/participants'));
        }
        if (role === 'ADMIN') {
          requests.push(api.get('/organizers'), api.get('/users'));
        }

        const responses = await Promise.allSettled(requests);
        let idx = 0;

        if (responses[idx]?.status === 'fulfilled') {
          setInstitutions(extractList(responses[idx].value));
        }
        idx += 1;

        if (role === 'ADMIN' || role === 'ORGANIZER') {
          if (responses[idx]?.status === 'fulfilled') {
            setParticipants(extractList(responses[idx].value));
          }
          idx += 1;
        }

        if (role === 'ADMIN') {
          if (responses[idx]?.status === 'fulfilled') {
            setOrganizers(extractList(responses[idx].value));
          }
          idx += 1;
          if (responses[idx]?.status === 'fulfilled') {
            setUsers(extractList(responses[idx].value));
          }
        }
      } catch (err) {
        console.error('Failed to load command index:', err);
      }
    };

    loadIndex();
    return () => clearTimeout(timer);
  }, [open, role]);

  useEffect(() => {
    if (!query.trim()) {
      setEvents([]);
      setWinners([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const requests = [
          api.get(`/events?search=${encodeURIComponent(query)}&limit=5`),
          api.get(`/winners?search=${encodeURIComponent(query)}&limit=5`),
        ];
        const [eventsRes, winnersRes] = await Promise.allSettled(requests);

        if (eventsRes.status === 'fulfilled') {
          setEvents(extractList(eventsRes.value));
        } else {
          setEvents([]);
        }

        if (winnersRes.status === 'fulfilled') {
          setWinners(extractList(winnersRes.value));
        } else {
          setWinners([]);
        }
      } catch (err) {
        console.error('Failed to search:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const filteredPages = useMemo(() => {
    return accessiblePages.filter((page) =>
      matchesQuery(query, page.name, page.path.replace('/', ''), ...(page.keywords || []))
    );
  }, [accessiblePages, query]);

  const filteredInstitutions = useMemo(() => {
    if (!query.trim()) return [];
    return institutions
      .filter((inst) => matchesQuery(query, inst.name, inst.code, inst.type))
      .slice(0, 5);
  }, [query, institutions]);

  const filteredParticipants = useMemo(() => {
    if (!query.trim() || (role !== 'ADMIN' && role !== 'ORGANIZER')) return [];
    return participants
      .filter((part) => matchesQuery(query, part.name, part.email))
      .slice(0, 5);
  }, [query, participants, role]);

  const filteredOrganizers = useMemo(() => {
    if (!query.trim() || role !== 'ADMIN') return [];
    return organizers
      .filter((org) => matchesQuery(query, org.name, org.email))
      .slice(0, 4);
  }, [query, organizers, role]);

  const filteredUsers = useMemo(() => {
    if (!query.trim() || role !== 'ADMIN') return [];
    return users
      .filter((u) => matchesQuery(query, u.name, u.email, u.role))
      .slice(0, 4);
  }, [query, users, role]);

  const results = useMemo(() => {
    const items = [];

    filteredPages.forEach((page) => {
      const Icon = page.icon;
      items.push({
        type: 'page',
        label: page.name,
        icon: <Icon />,
        target: page.path,
      });
    });

    events.forEach((event) => {
      items.push({
        type: 'event',
        label: event.title,
        icon: <EventIcon />,
        subtitle: event.institution?.name || event.status,
        target: `/events/${event.id}`,
      });
    });

    filteredInstitutions.forEach((inst) => {
      items.push({
        type: 'institution',
        label: inst.name,
        icon: <CorporateFareIcon />,
        subtitle: inst.code ? `Code: ${inst.code}` : undefined,
        target: `/institutions/${inst.id}`,
      });
    });

    winners.forEach((winner) => {
      items.push({
        type: 'winner',
        label: winner.user?.name || 'Winner',
        icon: <EmojiEventsIcon />,
        subtitle: `${winner.event?.title || 'Event'} · Position ${winner.position}`,
        target: `/winners?q=${encodeURIComponent(winner.user?.name || query)}`,
      });
    });

    filteredParticipants.forEach((part) => {
      items.push({
        type: 'participant',
        label: part.name,
        icon: <PeopleIcon />,
        subtitle: part.email,
        target: `/participants?q=${encodeURIComponent(part.name)}`,
      });
    });

    filteredOrganizers.forEach((org) => {
      items.push({
        type: 'organizer',
        label: org.name,
        icon: <PeopleIcon />,
        subtitle: org.email,
        target: `/organizers?q=${encodeURIComponent(org.name)}`,
      });
    });

    filteredUsers.forEach((u) => {
      items.push({
        type: 'user',
        label: u.name,
        icon: <PersonIcon />,
        subtitle: `${u.email} · ${u.role}`,
        target: `/users?q=${encodeURIComponent(u.name)}`,
      });
    });

    return items.map((item, index) => ({ ...item, index }));
  }, [
    filteredPages,
    events,
    filteredInstitutions,
    winners,
    filteredParticipants,
    filteredOrganizers,
    filteredUsers,
    query,
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= results.length) {
      setActiveIndex(Math.max(0, results.length - 1));
    }
  }, [results.length, activeIndex]);

  const handleSelect = useCallback((item) => {
    onClose();
    navigate(item.target);
  }, [navigate, onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (results.length === 0) return;
        setActiveIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (results.length === 0) return;
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[activeIndex]) {
          handleSelect(results[activeIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, activeIndex, results, handleSelect, onClose]);

  const groupedSections = useMemo(() => {
    const sections = [];
    const types = ['page', 'event', 'institution', 'winner', 'participant', 'organizer', 'user'];
    const labels = {
      page: query ? 'Pages' : 'Quick Navigation',
      event: 'Events',
      institution: 'Institutions',
      winner: 'Winners',
      participant: 'Participants',
      organizer: 'Organizers',
      user: 'Users',
    };

    types.forEach((type) => {
      const groupItems = results.filter((item) => item.type === type);
      if (groupItems.length > 0) {
        sections.push({ type, label: labels[type], items: groupItems });
      }
    });

    return sections;
  }, [results, query]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 0,
          overflow: 'hidden',
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          mt: 8,
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2.5, borderBottom: '1px solid', borderColor: 'divider', gap: 2 }}>
          <SearchIcon sx={{ color: 'text.secondary', fontSize: 24 }} />
          <InputBase
            inputRef={inputRef}
            fullWidth
            placeholder="Search pages, events, institutions, winners, people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ 
              fontSize: '1.05rem', 
              color: 'text.primary',
              '& input::placeholder': {
                color: 'text.secondary',
                opacity: 0.6
              }
            }}
          />
          {loading && <CircularProgress size={20} />}
          <Chip label="ESC" size="small" sx={{ fontSize: '0.65rem', fontWeight: 800, borderRadius: '6px' }} />
        </Box>

        <Box sx={{ maxHeight: 420, overflowY: 'auto', p: 1.5 }}>
          {results.length > 0 ? (
            groupedSections.map((section) => (
              <Box key={section.type} sx={{ mb: 1 }}>
                <Typography
                  sx={{
                    px: 2,
                    py: 0.75,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: 1,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                  }}
                >
                  {section.label}
                </Typography>
                <List sx={{ p: 0 }}>
                  {section.items.map((item) => {
                    const isSelected = item.index === activeIndex;

                    return (
                      <ListItemButton
                        key={`${item.type}-${item.label}-${item.target}`}
                        selected={isSelected}
                        onClick={() => handleSelect(item)}
                        sx={{
                          borderRadius: 3,
                          mb: 0.5,
                          py: 1.5,
                          px: 2.5,
                          transition: 'all 0.15s',
                          bgcolor: isSelected ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)') : 'transparent',
                          '&:hover': {
                            bgcolor: isLight ? 'action.hover' : 'rgba(255, 255, 255, 0.05)',
                          }
                        }}
                      >
                        <ListItemIcon sx={{ color: isSelected ? '#3b82f6' : 'text.secondary', minWidth: 40 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontWeight: isSelected ? 800 : 600, fontSize: '0.9rem', color: 'text.primary' }}>
                              {item.label}
                            </Typography>
                          }
                          secondary={
                            item.subtitle && (
                              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.2 }}>
                                {item.subtitle}
                              </Typography>
                            )
                          }
                        />
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip 
                            label={item.type.toUpperCase()} 
                            size="small" 
                            sx={{ 
                              fontSize: '0.6rem', 
                              fontWeight: 900, 
                              borderRadius: '4px',
                              bgcolor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'action.hover',
                              color: isSelected ? '#3b82f6' : 'text.secondary'
                            }} 
                          />
                          {isSelected && (
                            <KeyboardReturnIcon sx={{ fontSize: 16, color: '#3b82f6', opacity: 0.8 }} />
                          )}
                        </Stack>
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            ))
          ) : query.trim() ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
              <Typography variant="body1" color="textSecondary" fontWeight="bold">No matches found</Typography>
              <Typography variant="caption" color="textSecondary">
                Try terms like &apos;Hackathon&apos;, &apos;SRM&apos;, &apos;Winner&apos;, or &apos;Budget&apos;
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary" fontWeight={600}>
                Start typing to search across the platform
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                Pages, events, institutions, winners, and people
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, bgcolor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
            <span style={{ fontWeight: 800 }}>↑↓</span> navigate · <span style={{ fontWeight: 800 }}>Enter</span> open · <span style={{ fontWeight: 800 }}>Esc</span> close
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
            Ctrl+K anywhere
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CommandSearchDialog;
