import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Paper,
  useTheme,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Check, Clear } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import GradientText from '../components/brand/GradientText';
import BrainAnimation from '../components/brand/BrainAnimation';
import useFieldValidation from '../hooks/useFieldValidation';

const Register = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const username = useFieldValidation('', 'username', {
    required: true,
    minLength: 3,
    maxLength: 20,
    checkAvailability: true
  });

  const email = useFieldValidation('', 'email', {
    required: true,
    checkAvailability: true
  });

  const password = useFieldValidation('', 'password', {
    required: true,
    minLength: 8,
    maxLength: 50
  });

  const calculatePasswordStrength = (value) => {
    if (!value) return 0;
    let strength = 0;
    
    // Length
    if (value.length >= 8) strength += 20;
    if (value.length >= 12) strength += 10;
    
    // Character types
    if (/[A-Z]/.test(value)) strength += 20;
    if (/[a-z]/.test(value)) strength += 20;
    if (/[0-9]/.test(value)) strength += 20;
    if (/[^A-Za-z0-9]/.test(value)) strength += 20;
    
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 30) return theme.palette.error.main;
    if (strength < 50) return theme.palette.warning.main;
    if (strength < 80) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const passwordStrength = calculatePasswordStrength(password.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const isUsernameValid = username.validate();
    const isEmailValid = email.validate();
    const isPasswordValid = password.validate();
    
    if (!isUsernameValid || !isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register(username.value, email.value, password.value);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message === 'Network Error') {
        setError('Unable to connect to the server. Please try again later.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: '100%',
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <BrainAnimation size="medium" />
            <GradientText variant="h4" component="h1" sx={{ mt: 2 }}>
              Join Gnosis
            </GradientText>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Create your account to start learning
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username.value}
              onChange={username.handleChange}
              error={!!username.error}
              helperText={username.error}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {username.isChecking ? (
                      <CircularProgress size={20} />
                    ) : username.value && (
                      username.isAvailable ? (
                        <Check color="success" />
                      ) : (
                        <Clear color="error" />
                      )
                    )}
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email.value}
              onChange={email.handleChange}
              error={!!email.error}
              helperText={email.error}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {email.isChecking ? (
                      <CircularProgress size={20} />
                    ) : email.value && (
                      email.isAvailable ? (
                        <Check color="success" />
                      ) : (
                        <Clear color="error" />
                      )
                    )}
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={password.value}
              onChange={password.handleChange}
              error={!!password.error}
              helperText={password.error}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {password.value && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getPasswordStrengthColor(passwordStrength),
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.5,
                    display: 'block',
                    color: getPasswordStrengthColor(passwordStrength),
                  }}
                >
                  Password Strength: {passwordStrength}%
                </Typography>
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading || !username.isAvailable || !email.isAvailable || !!password.error}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
