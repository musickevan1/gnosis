import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import QuizIcon from '@mui/icons-material/Quiz';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SchoolIcon from '@mui/icons-material/School';
import GnosisLogo from '../components/brand/GnosisLogo';
import GradientText from '../components/brand/GradientText';
import FeatureCard from '../components/brand/FeatureCard';

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const features = [
    {
      icon: <AutoStoriesIcon sx={{ fontSize: 28 }} />,
      title: 'Personalized Learning',
      description: 'AI-powered lessons tailored to your interests and learning style',
    },
    {
      icon: <QuizIcon sx={{ fontSize: 28 }} />,
      title: 'Interactive Quizzes',
      description: 'Engaging assessments that adapt to your knowledge level',
    },
    {
      icon: <PsychologyIcon sx={{ fontSize: 28 }} />,
      title: 'Intelligent Feedback',
      description: 'Real-time insights to optimize your learning journey',
    },
    {
      icon: <SchoolIcon sx={{ fontSize: 28 }} />,
      title: 'Track Progress',
      description: 'Monitor your growth with detailed analytics and insights',
    },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
      overflow: 'visible',
      position: 'relative',
    }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url(/pattern.png)',
            opacity: 0.1,
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 4 }}>
                <GnosisLogo variant="light" size="xlarge" />
              </Box>
              <GradientText
                variant="h4"
                gradient="light"
                sx={{
                  mb: 4,
                  fontWeight: 400,
                  maxWidth: 600,
                }}
              >
                Unlock Your Knowledge Through AI-Powered Learning
              </GradientText>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                >
                  Get Started
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Box>
            </Grid>
            {!isMobile && (
              <Grid item md={6}>
                <Box
                  sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}40 0%, ${theme.palette.secondary.main}40 100%)`,
                      borderRadius: '50%',
                      filter: 'blur(100px)',
                    },
                  }}
                >
                  <Box
                    component="img"
                    src="/hero-image.png"
                    alt="Learning Illustration"
                    sx={{
                      width: '100%',
                      maxWidth: 500,
                      height: 'auto',
                      display: 'block',
                      margin: '0 auto',
                      position: 'relative',
                      zIndex: 1,
                      transform: 'scale(1.1)',
                      animation: 'float 6s ease-in-out infinite',
                      '@keyframes float': {
                        '0%, 100%': {
                          transform: 'scale(1.1) translateY(0)',
                        },
                        '50%': {
                          transform: 'scale(1.1) translateY(-20px)',
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 8, md: 12 },
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200%',
            height: '100%',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            zIndex: 0,
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <GradientText
              variant="h3"
              sx={{
                mb: 2,
                fontWeight: 600,
              }}
            >
              Why Choose Gnosis?
            </GradientText>
            <GradientText
              variant="h6"
              gradient="dark"
              sx={{
                fontWeight: 400,
                opacity: 0.8,
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              Experience the future of learning with our AI-powered platform
            </GradientText>
          </Box>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <FeatureCard {...feature} gradient />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
