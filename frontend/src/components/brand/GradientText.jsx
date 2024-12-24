import React from 'react';
import { Typography, useTheme } from '@mui/material';

const GradientText = ({ 
  children, 
  variant = 'h1', 
  gradient = 'primary',
  component,
  sx = {},
  ...props 
}) => {
  const theme = useTheme();

  const gradients = {
    primary: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
    light: 'linear-gradient(45deg, #FFFFFF 30%, #E0E0FF 90%)',
    dark: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
    custom: props.customGradient,
  };

  return (
    <Typography
      variant={variant}
      component={component || variant}
      sx={{
        background: gradients[gradient],
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

export default GradientText;
