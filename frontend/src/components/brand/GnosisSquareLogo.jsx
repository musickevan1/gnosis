import React from 'react';
import { Box, useTheme } from '@mui/material';

const GnosisSquareLogo = ({ size = 'medium', variant = 'default' }) => {
  const theme = useTheme();
  
  const sizes = {
    small: 32,
    medium: 40,
    large: 48
  };

  const logoSize = sizes[size] || sizes.medium;
  const isLight = variant === 'light';
  
  return (
    <Box
      sx={{
        width: logoSize,
        height: logoSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isLight ? 'transparent' : theme.palette.primary.main,
        borderRadius: '12px',
        padding: '8px',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: theme.shadows[3]
        }
      }}
    >
      <svg
        width={logoSize * 0.7}
        height={logoSize * 0.7}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          fill={isLight ? theme.palette.primary.main : '#fff'}
        />
        <path
          d="M2 17L12 22L22 17"
          stroke={isLight ? theme.palette.primary.main : '#fff'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke={isLight ? theme.palette.primary.main : '#fff'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
};

export default GnosisSquareLogo;
