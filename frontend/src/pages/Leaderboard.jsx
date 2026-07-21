import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, ButtonGroup, Avatar } from '@mui/material';
import api from '../api';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const Leaderboard = () => {
  const [tab, setTab] = useState('institutions');
  const [institutions, setInstitutions] = useState([]);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const instRes = await api.get('/leaderboard');
        setInstitutions(instRes.data?.data ?? instRes.data);
        
        const partRes = await api.get('/participants/leaderboard');
        setParticipants(partRes.data?.data ?? partRes.data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };
    
    fetchData();
  }, []);


  const getRankDisplay = (rank) => {
    if (rank <= 3) {
      return (
        <EmojiEventsIcon sx={{ fontSize: 22, color: rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : '#cd7f32' }} />
      );
    }
    return <Typography sx={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>{rank}</Typography>;
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" color="text.primary">Leaderboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Rankings based on wins, participation, and events hosted</Typography>

      <Box sx={{ mb: 3 }}>
        <ButtonGroup variant="contained" aria-label="tabs" elevation={0} sx={{ '& .MuiButton-root': { textTransform: 'none', borderRadius: '8px', fontWeight: 500 }}}>
          <Button startIcon={<CorporateFareIcon />} onClick={() => setTab('institutions')}
            sx={{ backgroundColor: tab === 'institutions' ? '#3b82f6' : 'background.paper', color: tab === 'institutions' ? '#fff' : 'text.secondary', border: '1px solid', borderColor: 'divider', '&:hover': { backgroundColor: tab === 'institutions' ? '#2563eb' : 'action.hover' } }}>
            Institutions
          </Button>
          <Button startIcon={<PersonOutlineIcon />} onClick={() => setTab('participants')}
            sx={{ backgroundColor: tab === 'participants' ? '#3b82f6' : 'background.paper', color: tab === 'participants' ? '#fff' : 'text.secondary', border: '1px solid', borderColor: 'divider', ml: 2, '&:hover': { backgroundColor: tab === 'participants' ? '#2563eb' : 'action.hover' } }}>
            Participants
          </Button>
        </ButtonGroup>
      </Box>

      {tab === 'institutions' && (
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', overflow: 'hidden' }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow sx={{ '& th': { borderBottom: '1px solid', borderColor: 'divider', color: 'text.secondary', fontSize: '0.85rem' } }}>
                  <TableCell width="60" align="center">Rank</TableCell>
                  <TableCell>Institution</TableCell>
                  <TableCell align="center">Wins</TableCell>
                  <TableCell align="center">Participants</TableCell>
                  <TableCell align="center">Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {institutions.map((inst, idx) => (
                  <TableRow key={inst.id} sx={{ '& td': { borderBottom: '1px solid', borderColor: 'divider', py: 2 }, backgroundColor: idx < 3 ? 'action.hover' : 'transparent' }}>
                    <TableCell align="center">{getRankDisplay(idx + 1)}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: 'text.primary' }}>{inst.name}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '0.9rem' }}>{inst.wins}</TableCell>
                    <TableCell align="center" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{inst.participants}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '0.9rem' }}>{inst.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tab === 'participants' && (
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', overflow: 'hidden' }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 550 }}>
              <TableHead>
                <TableRow sx={{ '& th': { borderBottom: '1px solid', borderColor: 'divider', color: 'text.secondary', fontSize: '0.85rem' } }}>
                  <TableCell width="60" align="center">Rank</TableCell>
                  <TableCell>Participant</TableCell>
                  <TableCell>Institution</TableCell>
                  <TableCell align="center">Wins</TableCell>
                  <TableCell align="center">Participations</TableCell>
                  <TableCell align="center">Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.map((p, idx) => (
                  <TableRow key={p.id} sx={{ '& td': { borderBottom: '1px solid', borderColor: 'divider', py: 1.8 }, backgroundColor: idx < 3 ? 'action.hover' : 'transparent' }}>
                    <TableCell align="center">{getRankDisplay(idx + 1)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 30, height: 30, bgcolor: '#e0e7ff', color: '#4338ca', fontSize: '13px', fontWeight: 'bold' }}>
                          {p.name?.charAt(0).toUpperCase() || '?'}
                        </Avatar>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#3b82f6' }}>{p.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{p.institution}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '0.9rem' }}>{p.wins}</TableCell>
                    <TableCell align="center" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{p.participations}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '0.9rem' }}>{p.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default Leaderboard;
