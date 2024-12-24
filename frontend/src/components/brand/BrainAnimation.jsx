import React from 'react';
import { Box, useTheme } from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SchoolIcon from '@mui/icons-material/School';
import BiotechIcon from '@mui/icons-material/Biotech';

const BrainAnimation = ({ size = 'large' }) => {
  const theme = useTheme();

  // If size is a number, create custom dimensions
  const getSize = (size) => {
    if (typeof size === 'number') {
      return {
        outer: size,
        inner: size * 0.8,
        icon: size * 0.2
      };
    }

    // Predefined sizes
    const sizes = {
      small: { outer: 120, inner: 80, icon: 24 },
      medium: { outer: 160, inner: 120, icon: 32 },
      large: { outer: 200, inner: 160, icon: 40 },
    };
    
    return sizes[size] || sizes.medium;
  };

  const dimensions = getSize(size);

  const icons = [
    { Icon: PsychologyIcon, delay: 0 },
    { Icon: AutoStoriesIcon, delay: 1 },
    { Icon: SchoolIcon, delay: 2 },
    { Icon: BiotechIcon, delay: 3 },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        width: dimensions.outer,
        height: dimensions.outer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& .icon-orbit': {
          position: 'absolute',
          width: '100%',
          height: '100%',
          animation: 'rotate 12s linear infinite',
          '@keyframes rotate': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',
            },
          },
        },
      }}
    >
      {/* Central Brain Icon */}
      <Box
        sx={{
          width: dimensions.inner,
          height: dimensions.inner,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: `0 0 20px ${theme.palette.primary.main}40`,
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
              boxShadow: `0 0 20px ${theme.palette.primary.main}40`,
            },
            '50%': {
              transform: 'scale(1.05)',
              boxShadow: `0 0 30px ${theme.palette.primary.main}60`,
            },
            '100%': {
              transform: 'scale(1)',
              boxShadow: `0 0 20px ${theme.palette.primary.main}40`,
            },
          },
        }}
      >
        <PsychologyIcon
          sx={{
            fontSize: dimensions.icon * 2,
            color: theme.palette.background.paper,
            animation: 'float 3s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': {
                transform: 'translateY(0)',
              },
              '50%': {
                transform: 'translateY(-10px)',
              },
            },
          }}
        />
      </Box>

      {/* Orbiting Icons */}
      {icons.map(({ Icon, delay }, index) => (
        <Box
          key={index}
          className="icon-orbit"
          sx={{
            animationDelay: `${delay}s`,
          }}
        >
          <Icon
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: dimensions.icon,
              color: theme.palette.primary.main,
              animation: 'twinkle 1.5s ease-in-out infinite',
              animationDelay: `${delay * 0.3}s`,
              '@keyframes twinkle': {
                '0%, 100%': {
                  opacity: 0.5,
                  transform: 'translateX(-50%) scale(1)',
                },
                '50%': {
                  opacity: 1,
                  transform: 'translateX(-50%) scale(1.2)',
                },
              },
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default BrainAnimation;
