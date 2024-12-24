import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingLogo = ({ size = 'medium' }) => {
  const dimensions = {
    small: { width: 100, fontSize: '1rem' },
    medium: { width: 150, fontSize: '1.5rem' },
    large: { width: 200, fontSize: '2rem' },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: dimensions[size].width,
          height: dimensions[size].width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress
          size={dimensions[size].width}
          thickness={4}
          sx={{
            color: 'primary.main',
            position: 'absolute',
          }}
        />
        <CircularProgress
          size={dimensions[size].width * 0.8}
          thickness={4}
          sx={{
            color: 'secondary.main',
            position: 'absolute',
          }}
        />
        <Typography
          variant="h4"
          sx={{
            fontSize: dimensions[size].fontSize,
            fontWeight: 700,
            background: 'linear-gradient(45deg, #3f51b5 30%, #7c4dff 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          G
        </Typography>
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontSize: dimensions[size].fontSize * 0.8,
          fontWeight: 500,
          opacity: 0.9,
        }}
      >
        GNOSIS
      </Typography>
    </Box>
  );
};

export default LoadingLogo;
