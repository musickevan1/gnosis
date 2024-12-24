import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

const GnosisLogo = ({ variant = 'default', size = 'medium' }) => {
  const theme = useTheme();

  const sizes = {
    small: { fontSize: '1.5rem', letterSpacing: '0.2rem' },
    medium: { fontSize: '2rem', letterSpacing: '0.25rem' },
    large: { fontSize: '3rem', letterSpacing: '0.3rem' },
    xlarge: { fontSize: '4rem', letterSpacing: '0.4rem' },
  };

  const variants = {
    default: {
      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
    },
    light: {
      background: 'linear-gradient(45deg, #FFFFFF 30%, #E0E0FF 90%)',
    },
    dark: {
      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: sizes[size].fontSize,
          letterSpacing: sizes[size].letterSpacing,
          background: variants[variant].background,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          m: 0,
        }}
      >
        GNOSIS
      </Typography>
    </Box>
  );
};

export default GnosisLogo;
