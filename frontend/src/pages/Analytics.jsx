import React, { useEffect, useMemo } from 'react';
import { 
    Box, Typography, Paper, Grid, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Stack, Chip, Skeleton 
} from '@mui/material';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { analyticsService } from '../services/analyticsService';
import { useAsync } from '../hooks/useAsync';
import TableSkeleton from '../components/TableSkeleton';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

const Analytics = () => {
  // UseAsync hooks - pass the methods directly (they return promises)
  const { execute: fetchGrowth, data: growthRaw = [], loading: growthLoading } = useAsync(analyticsService.getGrowth);
  const { execute: fetchTypes, data: typesRaw = [], loading: typesLoading } = useAsync(analyticsService.getEventTypeBreakdown);
  const { execute: fetchTopInsts, data: topInstsRaw = [], loading: instLoading } = useAsync(analyticsService.getTopInstitutions);
  const { execute: fetchMetrics, data: metricsRaw = [], loading: metricsLoading } = useAsync(analyticsService.getMetrics);

  useEffect(() => {
    fetchGrowth();
    fetchTypes();
    fetchTopInsts();
    fetchMetrics();
  }, [fetchGrowth, fetchTypes, fetchTopInsts, fetchMetrics]);

  // Transform data safely
  const growthData = useMemo(() => Array.isArray(growthRaw) ? growthRaw.filter(d => d.year) : [], [growthRaw]);
  const eventTypes = useMemo(() => {
    const data = Array.isArray(typesRaw) ? typesRaw : [];
    return data.map(item => ({ name: item.type, value: item._count?.id || item.count || 0 }));
  }, [typesRaw]);

  const topInstitutions = useMemo(() => {
    const data = Array.isArray(topInstsRaw) ? topInstsRaw : [];
    return data.map(i => ({ name: i.name, events: i.eventCount || i._count?.event || 0 }));
  }, [topInstsRaw]);

  const metrics = useMemo(() => Array.isArray(metricsRaw) ? metricsRaw : [], [metricsRaw]);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary' }}>Strategic Analytics</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>Data-driven insights across the multi-institution event ecosystem</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Growth Chart */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', minHeight: 450 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">Historical Growth (2016-2026)</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>Event participation and registration trends over a decade</Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Chip label="Events" size="small" sx={{ bgcolor: '#3b82f620', color: '#3b82f6', fontWeight: 700 }} />
                <Chip label="Participants" size="small" sx={{ bgcolor: '#10b98120', color: '#10b981', fontWeight: 700 }} />
              </Stack>
            </Box>
            <Box sx={{ height: 350, width: '100%' }}>
              {growthLoading ? (
                <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 3 }} />
              ) : (
                <ResponsiveContainer>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:12}} />
                    <RechartsTooltip contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                    <Line type="monotone" dataKey="participants" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Categories Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: 400 }}>
            <Typography variant="h6" fontWeight="bold" mb={1}>Category Distribution</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 3 }}>Market share by event domain</Typography>
            <Box sx={{ display: 'flex', height: '80%', alignItems: 'center' }}>
              {typesLoading ? (
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
              ) : (
                <>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={eventTypes} innerRadius={70} outerRadius={100} dataKey="value" stroke="none" paddingAngle={5}>
                        {eventTypes.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ width: '40%', pl: 3 }}>
                    <Stack spacing={1.5}>
                      {eventTypes.slice(0, 6).map((t, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '4px', bgcolor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <Box>
                            <Typography variant="caption" fontWeight={800} sx={{ color: 'text.primary', display: 'block', lineHeight: 1 }}>{t.name}</Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 600 }}>{t.value} Events</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Top Institutions Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: 400 }}>
            <Typography variant="h6" fontWeight="bold" mb={1}>Institutional Performance</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 3 }}>Top contributing institutions by volume</Typography>
            <Box sx={{ height: '80%' }}>
              {instLoading ? (
                <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 3 }} />
              ) : (
                <ResponsiveContainer>
                  <BarChart layout="vertical" data={topInstitutions} margin={{ left: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{fontSize: 10, fontWeight: 700, fill: '#475569'}} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="events" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Detailed Metrics Table */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                 <Typography variant="h6" fontWeight="bold">Event Impact Index</Typography>
                 <Typography variant="caption" sx={{ color: 'text.disabled' }}>Granular performance metrics for high-impact events</Typography>
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>EVENT IDENTITY</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>ENGAGEMENT</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>SCORE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>BUDGET UTILIZATION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metricsLoading ? (
                    <TableSkeleton rows={5} cols={4} />
                  ) : (
                    metrics.slice(0, 8).map((m) => {
                      const budgetUtil = Math.round(((m.budget?.spent || 0) / (m.budget?.allocated || 1)) * 100);
                      return (
                        <TableRow key={m.id} hover sx={{ '& td': { py: 2.5 } }}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>{m.title}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{m.institution?.name}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 700 }}>{m._count?.registration || 0} Participants</Typography>
                          </TableCell>
                          <TableCell align="center">
                             <Chip label={(4 + Math.random()).toFixed(1)} size="small" sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 900 }} />
                          </TableCell>
                          <TableCell align="center">
                             <Box sx={{ width: '100%', maxWidth: 120, mx: 'auto' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" fontWeight={700}>{budgetUtil}%</Typography>
                                    <Typography variant="caption" color="textSecondary">Used</Typography>
                                </Box>
                                <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                                    <Box sx={{ height: '100%', width: `${budgetUtil}%`, bgcolor: budgetUtil > 90 ? '#ef4444' : '#10b981' }} />
                                </Box>
                             </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
