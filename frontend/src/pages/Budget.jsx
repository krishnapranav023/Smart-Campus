import React, { useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Skeleton, CircularProgress } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { analyticsService } from '../services/analyticsService';
import { useAsync } from '../hooks/useAsync';

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000)     return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
};

const tierColor = (type) => {
  const t = (type || '').toLowerCase();
  if (t === 'platinum') return '#94a3b8';
  if (t === 'gold')     return '#f59e0b';
  if (t === 'silver')   return '#9ca3af';
  if (t === 'bronze')   return '#b45309';
  if (t === 'title')    return '#8b5cf6';
  return '#9ca3af';
};

const Budget = () => {
  const fetchBudget = useCallback(() => analyticsService.getBudgetSummary(), []);
  const { execute, data: raw, loading } = useAsync(fetchBudget);

  useEffect(() => { execute(); }, [execute]);

  const d = raw || {};
  const {
    totalSponsorship  = 0,
    totalAllocated    = 0,
    totalSpent        = 0,
    netSurplus        = 0,
    fundFlowData      = [],
    topSponsors       = [],
  } = d;

  const summaryCards = [
    { label: 'SPONSORSHIP INFLOW',   value: fmt(totalSponsorship), icon: <StarOutlineIcon   sx={{ color: '#f59e0b' }} /> },
    { label: 'TOTAL BUDGET ALLOCATED', value: fmt(totalAllocated),   icon: <AttachMoneyIcon  sx={{ color: '#3b82f6' }} /> },
    { label: 'TOTAL EXPENSES',        value: fmt(totalSpent),        icon: <TrendingDownIcon sx={{ color: '#ef4444' }} /> },
    { label: 'NET SURPLUS',           value: fmt(netSurplus),        icon: <TrendingUpIcon   sx={{ color: netSurplus >= 0 ? '#10b981' : '#ef4444' }} /> },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" color="text.primary">Budget &amp; Finance</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fund flow, sponsorship inflow, and expense analysis — live from database
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={4}>
        {summaryCards.map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'background.paper' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.5 }}>
                  {c.label}
                </Typography>
                {loading ? (
                  <Skeleton width={80} height={32} sx={{ mt: 0.5 }} />
                ) : (
                  <Typography variant="h5" fontWeight="bold" color="text.primary" sx={{ mt: 0.5 }}>
                    {c.value}
                  </Typography>
                )}
              </Box>
              {c.icon}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Annual Fund Flow Chart */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: 350, backgroundColor: 'background.paper' }}>
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" mb={2}>
          Annual Fund Flow
        </Typography>
        {loading ? (
          <Skeleton variant="rectangular" height="85%" sx={{ borderRadius: 2 }} />
        ) : fundFlowData.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '85%' }}>
            <Typography color="text.secondary">No budget data available yet</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={fundFlowData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `₹${v}K`} />
              <Tooltip formatter={(v, name) => [`₹${v}K`, name]} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="sponsorship" name="Budget Allocated" stackId="1" stroke="#f59e0b" fill="#fef3c7" />
              <Area type="monotone" dataKey="expenses"    name="Expenses"         stackId="1" stroke="#ef4444" fill="#fee2e2" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Top Sponsors */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" mb={2}>
          Top Sponsors by Contribution
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={40} sx={{ borderRadius: 2 }} />)}
          </Box>
        ) : topSponsors.length === 0 ? (
          <Typography color="text.secondary">No sponsor data available yet</Typography>
        ) : (
          topSponsors.map((s, idx) => (
            <Box key={s.id || idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ color: 'text.secondary', width: 24, fontSize: '0.9rem', fontWeight: 700 }}>{idx + 1}</Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: 'text.primary' }}>{s.name}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{s.eventTitle}</Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>{fmt(s.contribution)}</Typography>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: tierColor(s.type), letterSpacing: 0.5 }}>{(s.type || 'SPONSOR').toUpperCase()}</Typography>
              </Box>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
};

export default Budget;
