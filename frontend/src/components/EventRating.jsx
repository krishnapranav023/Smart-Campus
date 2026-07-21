import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Rating, TextField, Button, Stack, Divider, 
  Dialog, DialogTitle, DialogContent, DialogActions, Grid 
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const RatingSummary = ({ averages }) => {
  const categories = [
    { label: 'Event Quality', value: averages.quality },
    { label: 'Venue & Facilities', value: averages.venue },
    { label: 'Organization & Staff', value: averages.organization },
    { label: 'Timing & Schedule', value: averages.timing }
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Stack spacing={1.5}>
        {categories.map((c) => (
          <Box key={c.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>{c.label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={c.value || 5} precision={0.1} readOnly size="small" />
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{c.value ? c.value.toFixed(1) : '5.0'}</Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export const ReviewCard = ({ feedback }) => {
  const dateStr = feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
  
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', mb: 2 }}>
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="800">{feedback.user?.name || 'Verified Participant'}</Typography>
            <Typography variant="caption" color="text.secondary">{feedback.user?.email}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>{dateStr}</Typography>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rating value={feedback.rating} readOnly size="small" />
          <Typography variant="body2" fontWeight={800} color="text.primary">({feedback.rating}/5)</Typography>
        </Box>
        {feedback.review && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'block', mb: 0.2 }}>REVIEW</Typography>
            <Typography variant="body2">{feedback.review}</Typography>
          </Box>
        )}
        {feedback.suggestions && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'block', mb: 0.2 }}>SUGGESTIONS</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{feedback.suggestions}</Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export const EventRating = ({ eventId, myFeedback, onSubmitSuccess }) => {
  const [rating, setRating] = useState(null);
  const [qualityRating, setQualityRating] = useState(null);
  const [venueRating, setVenueRating] = useState(null);
  const [orgRating, setOrgRating] = useState(null);
  const [timingRating, setTimingRating] = useState(null);
  const [review, setReview] = useState('');
  const [suggestions, setSuggestions] = useState('');
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePreSubmit = () => {
    if (!rating) {
      setErrorMsg('Overall Rating is required');
      return;
    }
    setErrorMsg('');
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      await onSubmitSuccess({
        eventId,
        rating,
        qualityRating,
        venueRating,
        orgRating,
        timingRating,
        review: review.trim() || undefined,
        suggestions: suggestions.trim() || undefined
      });
      setReview('');
      setSuggestions('');
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  // If already reviewed, display read-only submitted ratings
  if (myFeedback) {
    return (
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 26 }} />
          <Box>
            <Typography variant="subtitle1" fontWeight="800" color="#16a34a">✓ Review Submitted Successfully</Typography>
            <Typography variant="caption" color="text.secondary">You have already reviewed this event. Reviews cannot be changed.</Typography>
          </Box>
        </Stack>

        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={800}>Overall Rating</Typography>
                <Rating value={myFeedback.rating} readOnly size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">Event Quality</Typography>
                <Rating value={myFeedback.qualityRating} readOnly size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">Venue & Facilities</Typography>
                <Rating value={myFeedback.venueRating} readOnly size="small" />
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">Organization & Staff</Typography>
                <Rating value={myFeedback.orgRating} readOnly size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">Timing & Schedule</Typography>
                <Rating value={myFeedback.timingRating} readOnly size="small" />
              </Box>
            </Stack>
          </Grid>
        </Grid>

        {myFeedback.review && (
          <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'block', mb: 0.5 }}>YOUR REVIEW</Typography>
            <Typography variant="body2">{myFeedback.review}</Typography>
          </Box>
        )}
        {myFeedback.suggestions && (
          <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'block', mb: 0.5 }}>YOUR SUGGESTIONS</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{myFeedback.suggestions}</Typography>
          </Box>
        )}
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
      <Typography variant="h6" fontWeight="800" sx={{ mb: 3 }}>⭐ Event Review & Rating</Typography>
      
      {errorMsg && <Typography color="error" sx={{ mb: 2, fontWeight: 700, fontSize: '0.85rem' }}>{errorMsg}</Typography>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>Overall Rating *</Typography>
              <Rating value={rating} onChange={(e, val) => setRating(val)} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'text.secondary' }}>Event Quality</Typography>
              <Rating value={qualityRating} onChange={(e, val) => setQualityRating(val)} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'text.secondary' }}>Venue & Facilities</Typography>
              <Rating value={venueRating} onChange={(e, val) => setVenueRating(val)} />
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'text.secondary' }}>Organization & Staff</Typography>
              <Rating value={orgRating} onChange={(e, val) => setOrgRating(val)} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'text.secondary' }}>Timing & Schedule</Typography>
              <Rating value={timingRating} onChange={(e, val) => setTimingRating(val)} />
            </Box>
          </Stack>
        </Grid>
      </Grid>

      <Stack spacing={3}>
        <TextField 
          label="Written Review (Optional)" 
          multiline rows={3} placeholder="Tell other students about your experience..." 
          fullWidth variant="outlined"
          value={review} onChange={(e) => setReview(e.target.value)}
        />
        <TextField 
          label="Improvement Suggestions (Optional)" 
          multiline rows={2} placeholder="Any specific suggestions for the coordinators..." 
          fullWidth variant="outlined"
          value={suggestions} onChange={(e) => setSuggestions(e.target.value)}
        />
        
        <Button
          variant="contained"
          onClick={handlePreSubmit}
          disabled={loading}
          sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#4f46e5', fontWeight: 700, py: 1.2, boxShadow: 'none', '&:hover': { bgcolor: '#3b82f6', boxShadow: 'none' } }}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </Stack>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Permanency</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Once submitted, your review cannot be edited or deleted. Are you sure you want to save this permanently?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmSubmit} sx={{ borderRadius: '8px', bgcolor: '#4f46e5', fontWeight: 700, boxShadow: 'none' }}>
            Yes, Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
