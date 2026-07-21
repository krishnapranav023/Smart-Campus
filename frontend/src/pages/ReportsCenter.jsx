import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, Stack, Card, CardContent, CircularProgress 
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';

import api from '../api';
import { useApp } from '../context/AppContext';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ReportsCenter = () => {
  const { showSnackbar } = useApp();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/organizers/dashboard-stats');
        setStats(res.data.data || res.data);
      } catch (e) {
        showSnackbar('Error loading data for reports', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Report Export: PDF
  const exportPDF = (type, tableData, title, headers) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
    
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] } // Indigo Color
    });
    
    doc.save(`${type}_report_${Date.now()}.pdf`);
    showSnackbar('PDF report downloaded successfully');
  };

  // Report Export: Excel
  const exportExcel = (type, dataList, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(dataList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Sheet');
    XLSX.writeFile(workbook, `${filename}_${Date.now()}.xlsx`);
    showSnackbar('Excel report downloaded successfully');
  };

  if (loading || !stats) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  const { feedbacks = [], allRegistrations = [], allWinners = [] } = stats;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <GetAppIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">Reports Generation Center</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Export live production sheets formatted for offline review and presentation.
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Grid container spacing={3}>
          {/* Report 1: Attendance */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ borderRadius: 3, p: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>ATTENDANCE SHEET</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2.5 }}>
                  {allRegistrations.filter(r => r.status === 'ATTENDED').length} Attended
                </Typography>
                <Stack spacing={1}>
                  <Button 
                    size="small" fullWidth variant="contained" startIcon={<GetAppIcon />}
                    onClick={() => {
                      const headers = ['Student Name', 'Email', 'Affiliation', 'Status'];
                      const rows = allRegistrations.map(r => [r.user?.name, r.user?.email, r.user?.institution?.name, r.status]);
                      exportPDF('attendance', rows, 'Attendance Verification Sheet', headers);
                    }}
                    sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: '#4f46e5', boxShadow: 'none' }}
                  >
                    Download PDF
                  </Button>
                  <Button 
                    size="small" fullWidth variant="outlined" startIcon={<GetAppIcon />}
                    onClick={() => {
                      const data = allRegistrations.map(r => ({ Name: r.user?.name, Email: r.user?.email, College: r.user?.institution?.name, Status: r.status }));
                      exportExcel('attendance', data, 'Attendance_Roster');
                    }}
                    sx={{ textTransform: 'none', borderRadius: '6px' }}
                  >
                    Excel Sheet
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Report 2: Registrations */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ borderRadius: 3, p: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>REGISTRATIONS ROSTER</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2.5 }}>
                  {allRegistrations.length} Applications
                </Typography>
                <Stack spacing={1}>
                  <Button 
                    size="small" fullWidth variant="contained" startIcon={<GetAppIcon />}
                    onClick={() => {
                      const headers = ['Student Name', 'Email', 'Phone', 'Affiliation', 'Status'];
                      const rows = allRegistrations.map(r => [r.user?.name, r.user?.email, r.user?.phone || 'N/A', r.user?.institution?.name, r.status]);
                      exportPDF('registrations', rows, 'Registrations Roster Sheet', headers);
                    }}
                    sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: '#4f46e5', boxShadow: 'none' }}
                  >
                    Download PDF
                  </Button>
                  <Button 
                    size="small" fullWidth variant="outlined" startIcon={<GetAppIcon />}
                    onClick={() => {
                      const data = allRegistrations.map(r => ({ Name: r.user?.name, Email: r.user?.email, Phone: r.user?.phone, College: r.user?.institution?.name, Status: r.status }));
                      exportExcel('registrations', data, 'Registrations_List');
                    }}
                    sx={{ textTransform: 'none', borderRadius: '6px' }}
                  >
                    Excel Sheet
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Report 3: Winners */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ borderRadius: 3, p: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>SEGMENT WINNERS</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2.5 }}>
                  {allWinners.length} Winners
                </Typography>
                <Stack spacing={1}>
                  <Button 
                    size="small" fullWidth variant="contained" startIcon={<GetAppIcon />}
                    onClick={() => {
                      const headers = ['Student Name', 'Affiliation', 'Event', 'Segment', 'Position'];
                      const rows = allWinners.map(w => [w.user?.name, w.user?.institution?.code, w.event?.title, w.segment?.name, `Rank #${w.position}`]);
                      exportPDF('winners', rows, 'Event Segment Winners Sheet', headers);
                    }}
                    sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: '#4f46e5', boxShadow: 'none' }}
                  >
                    Download PDF
                  </Button>
                  <Button 
                    size="small" fullWidth variant="outlined" startIcon={<GetAppIcon />}
                    onClick={() => {
                      const data = allWinners.map(w => ({ Name: w.user?.name, College: w.user?.institution?.name, Event: w.event?.title, Segment: w.segment?.name, Position: w.position }));
                      exportExcel('winners', data, 'Segment_Winners');
                    }}
                    sx={{ textTransform: 'none', borderRadius: '6px' }}
                  >
                    Excel Sheet
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Report 4: Feedbacks */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ borderRadius: 3, p: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>FEEDBACK MATRIX</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2.5 }}>
                  {feedbacks.length} Reviews
                </Typography>
                <Stack spacing={1}>
                  <Button 
                    size="small" fullWidth variant="contained" startIcon={<GetAppIcon />}
                    onClick={() => {
                      const headers = ['Student Name', 'Event', 'RatingScore', 'Review Suggestion'];
                      const rows = feedbacks.map(f => {
                        let commentStr = f.review;
                        try {
                          const parsed = JSON.parse(f.review);
                          commentStr = parsed.comments || f.review;
                        } catch {}
                        return [f.user?.name, f.event?.title, `${f.rating}/5`, commentStr];
                      });
                      exportPDF('feedback', rows, 'Feedback Matrix Summary Sheet', headers);
                    }}
                    sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: '#4f46e5', boxShadow: 'none' }}
                  >
                    Download PDF
                  </Button>
                  <Button 
                    size="small" fullWidth variant="outlined" startIcon={<GetAppIcon />}
                    onClick={() => {
                      const data = feedbacks.map(f => {
                        let comments = f.review;
                        let breakdown = {};
                        try {
                          const parsed = JSON.parse(f.review);
                          comments = parsed.comments || f.review;
                          breakdown = parsed.breakdown || {};
                        } catch {}
                        return {
                          Name: f.user?.name,
                          Event: f.event?.title,
                          OverallRating: f.rating,
                          Quality: breakdown.quality || '',
                          Venue: breakdown.venue || '',
                          Organization: breakdown.organization || '',
                          Timing: breakdown.timing || '',
                          Review: comments
                        };
                      });
                      exportExcel('feedback', data, 'Feedback_Summary');
                    }}
                    sx={{ textTransform: 'none', borderRadius: '6px' }}
                  >
                    Excel Sheet
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ReportsCenter;
