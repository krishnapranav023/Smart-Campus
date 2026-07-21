import React, { useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, List, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Skeleton, CircularProgress } from '@mui/material';
import { analyticsService } from '../services/analyticsService';
import { useAsync } from '../hooks/useAsync';

const CollaborationInsights = () => {
  const fetchCollab = useCallback(() => analyticsService.getCollaboration(), []);
  const { execute, data: raw, loading } = useAsync(fetchCollab);

  useEffect(() => { execute(); }, [execute]);

  const { collaborations = [], weVisit = [], visitUs = [] } = raw || {};

  const mostActive  = collaborations.slice(0, 15);
  const allCollabs  = collaborations;

  const EmptyRow = ({ cols }) => (
    <TableRow>
      <TableCell colSpan={cols} align="center" sx={{ py: 4, color: 'text.secondary' }}>
        No collaboration data yet
      </TableCell>
    </TableRow>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" color="text.primary">Relationship Tracker</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Institution collaboration patterns — derived from shared event registrations (live data)
      </Typography>

      <Grid container spacing={3} mb={4}>
        {/* Left: Most Active Collaborations */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', backgroundColor: 'background.paper' }}>
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary" mb={3}>
              Most Active Collaborations
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[...Array(8)].map((_, i) => <Skeleton key={i} height={36} sx={{ borderRadius: 2 }} />)}
              </Box>
            ) : mostActive.length === 0 ? (
              <Typography color="text.secondary">No collaboration data yet</Typography>
            ) : (
              <List sx={{ p: 0 }}>
                {mostActive.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5, alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.primary', flex: 1, mr: 2 }}>
                      {item.i1.length > 28 ? item.i1.substring(0, 28) + '…' : item.i1}
                      <Box component="span" sx={{ color: 'text.disabled', mx: 1 }}>+</Box>
                      {item.i2.length > 28 ? item.i2.substring(0, 28) + '…' : item.i2}
                    </Typography>
                    <Box sx={{ textAlign: 'right', minWidth: 60 }}>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#3b82f6', lineHeight: 1 }}>{item.score}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>collabs</Typography>
                    </Box>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Right: We Visit & Visit Us */}
        <Grid item xs={12} md={5}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary" mb={2}>
                  Institutions We Visit Most
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[...Array(5)].map((_, i) => <Skeleton key={i} height={28} sx={{ borderRadius: 2 }} />)}
                  </Box>
                ) : weVisit.length === 0 ? (
                  <Typography color="text.secondary" fontSize="0.85rem">No data yet</Typography>
                ) : (
                  <List sx={{ p: 0 }}>
                    {weVisit.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <Typography sx={{ color: 'text.secondary', width: 20, fontSize: '0.85rem', fontWeight: 700 }}>{idx + 1}</Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: 'text.primary' }}>{item.name}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>{item.visits} visits</Typography>
                      </Box>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary" mb={2}>
                  Institutions That Visit Us
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[...Array(5)].map((_, i) => <Skeleton key={i} height={28} sx={{ borderRadius: 2 }} />)}
                  </Box>
                ) : visitUs.length === 0 ? (
                  <Typography color="text.secondary" fontSize="0.85rem">No data yet</Typography>
                ) : (
                  <List sx={{ p: 0 }}>
                    {visitUs.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <Typography sx={{ color: 'text.secondary', width: 20, fontSize: '0.85rem', fontWeight: 700 }}>{idx + 1}</Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: 'text.primary' }}>{item.name}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{item.visits} visits</Typography>
                      </Box>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* All Collaborations Table */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" mb={2}>
          All Collaborations ({allCollabs.length})
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow sx={{ '& th': { borderBottom: '1px solid', borderColor: 'divider', color: 'text.secondary', fontSize: '0.8rem', pb: 1.5, fontWeight: 800 } }}>
                <TableCell>INSTITUTION 1</TableCell>
                <TableCell>INSTITUTION 2</TableCell>
                <TableCell align="center">COLLABORATIONS</TableCell>
                <TableCell align="right">LAST COLLABORATED</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(4)].map((_, j) => (
                      <TableCell key={j}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : allCollabs.length === 0 ? (
                <EmptyRow cols={4} />
              ) : (
                allCollabs.map((m, idx) => (
                  <TableRow key={idx} hover sx={{ '& td': { borderBottom: '1px solid', borderColor: 'divider', py: 1.5 } }}>
                    <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem' }}>{m.i1}</TableCell>
                    <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem' }}>{m.i2}</TableCell>
                    <TableCell align="center" sx={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 700 }}>{m.score}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {m.lastCollaborated ? new Date(m.lastCollaborated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default CollaborationInsights;
