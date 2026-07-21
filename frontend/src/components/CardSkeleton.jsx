import React from 'react';
import { Card, CardContent, Skeleton, Box } from '@mui/material';

const CardSkeleton = () => {
  return (
    <Card sx={{ borderRadius: 3, p: 1, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="80%" />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1.5 }} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default CardSkeleton;
