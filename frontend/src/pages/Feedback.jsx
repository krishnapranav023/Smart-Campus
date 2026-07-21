import React, { useEffect } from 'react';
import { Box, Typography, Paper, Grid, List, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { useAsync } from '../hooks/useAsync';

const Feedback = () => {
  const fetchStatsReq = React.useCallback(() => api.get('/feedback/stats'), []);
  const { execute: fetchStats, data: stats = {}, loading } = useAsync(fetchStatsReq);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const { 
    bestRated = [], 
    worstRated = [], 
    avgTypeData = [], 
    distributionData = [] 
  } = stats;

  if (loading && !stats.bestRated) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;


  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary' }}>Feedback Analytics</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>Rating distributions, best and worst events</Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                    Best Rated Events
                </Typography>
                <List sx={{ p: 0 }}>
                {bestRated.map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex' }}>
                            <Typography sx={{ color: 'text.secondary', width: 24, fontSize: '0.9rem' }}>{idx + 1}</Typography>
                            <Box>
                                <Typography sx={{ fontSize: '0.9rem', color: 'text.primary' }}>{item.name}</Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{item.res} responses</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f59e0b', lineHeight: 1 }}>{item.rating}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>/ 5</Typography>
                        </Box>
                    </Box>
                ))}
                </List>
            </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    Lowest Rated Events
                </Typography>
                <List sx={{ p: 0 }}>
                {worstRated.map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex' }}>
                            <Typography sx={{ color: 'text.secondary', width: 24, fontSize: '0.9rem' }}>{idx + 1}</Typography>
                            <Box>
                                <Typography sx={{ fontSize: '0.9rem', color: 'text.primary' }}>{item.name}</Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{item.res} responses</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ef4444', lineHeight: 1 }}>{item.rating}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>/ 5</Typography>
                        </Box>
                    </Box>
                ))}
                </List>
            </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: 280 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={3}>Average Rating by Event Type</Typography>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={avgTypeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{fill:'#6b7280', fontSize:12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill:'#6b7280', fontSize:12}} domain={[0, 5]} ticks={[0, 2, 5]} />
            <Tooltip cursor={{ fill: 'transparent' }} />
            <Bar dataKey="rating" fill="#eab308" radius={[2, 2, 0, 0]} barSize={90} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: 250 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={3}>Rating Distribution</Typography>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="star" axisLine={false} tickLine={false} tick={false} />
            <YAxis axisLine={false} tickLine={false} tick={{fill:'#6b7280', fontSize:12}} />
            <Tooltip cursor={{ fill: 'transparent' }} />
            <Bar dataKey="count" fill="#60a5fa" radius={[2, 2, 0, 0]} barSize={110} />
          </BarChart>
        </ResponsiveContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-around', pl: 5, pr: 5, mt: -2 }}>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>1</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>2</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>3</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>4</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>5 Stars</Typography>
        </Box>
      </Paper>

    </Box>
  );
};

export default Feedback;
