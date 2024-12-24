import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  useTheme,
  useMediaQuery,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';
import GnosisSquareLogo from './brand/GnosisSquareLogo';
import HistoryIcon from '@mui/icons-material/History';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setAnchorElNav(null);
    setAnchorElUser(null);
  }, [user]);

  const handleOpenNavMenu = (event) => {
    if (event?.currentTarget) {
      setAnchorElNav(event.currentTarget);
    }
  };
  
  const handleOpenUserMenu = (event) => {
    if (event?.currentTarget) {
      setAnchorElUser(event.currentTarget);
    }
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const navItems = user ? [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Learn', path: '/learn' },
    { label: 'Practice', path: '/practice' },
  ] : [];

  return (
    <AppBar 
      position="fixed"
      elevation={isScrolled ? 4 : 0}
      sx={{
        background: isHomePage 
          ? isScrolled 
            ? 'rgba(255, 255, 255, 0.95)'
            : 'transparent'
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: isScrolled ? 'blur(10px)' : 'none',
        borderBottom: isScrolled ? '1px solid' : 'none',
        borderColor: 'divider',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar 
          disableGutters 
          sx={{ 
            minHeight: { xs: 64, md: 72 },
            gap: 2
          }}
        >
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RouterLink to="/" style={{ textDecoration: 'none' }}>
              <GnosisSquareLogo 
                variant={isHomePage && !isScrolled ? 'light' : 'default'} 
                size={isMobile ? 'small' : 'medium'}
              />
            </RouterLink>
            {!isMobile && (
              <Typography
                variant="h6"
                component="div"
                sx={{
                  ml: 2,
                  fontWeight: 600,
                  color: isHomePage && !isScrolled ? '#fff' : 'text.primary',
                  transition: 'color 0.3s ease-in-out',
                }}
              >
                Gnosis
              </Typography>
            )}
          </Box>

          {/* Mobile menu */}
          {user && (
            <Box sx={{ display: { xs: 'flex', md: 'none' }, ml: 'auto' }}>
              <IconButton
                size="large"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                sx={{
                  color: isHomePage && !isScrolled ? '#fff' : 'text.primary',
                }}
              >
                <MenuIcon />
              </IconButton>
              {Boolean(anchorElNav) && (
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorElNav}
                  open={Boolean(anchorElNav)}
                  onClose={handleCloseNavMenu}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  sx={{
                    display: { xs: 'block', md: 'none' },
                  }}
                  slotProps={{
                    paper: {
                      elevation: 0,
                      sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                      },
                    },
                  }}
                >
                  {navItems.map((item) => (
                    <MenuItem 
                      key={item.path} 
                      onClick={() => {
                        handleCloseNavMenu();
                        navigate(item.path);
                      }}
                    >
                      <Typography textAlign="center">{item.label}</Typography>
                    </MenuItem>
                  ))}
                </Menu>
              )}
            </Box>
          )}

          {/* Desktop navigation */}
          {user && (
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 2, ml: 4 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  onClick={handleCloseNavMenu}
                  sx={{
                    color: isHomePage && !isScrolled ? '#fff' : 'text.primary',
                    display: 'block',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: isHomePage && !isScrolled 
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* User menu */}
          {user ? (
            <Box sx={{ flexShrink: 0 }}>
              <Tooltip title="Account settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar 
                    alt={user.email} 
                    src={user.photoURL}
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      border: isHomePage && !isScrolled ? '2px solid white' : 'none',
                    }}
                  >
                    {user.email[0].toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              {Boolean(anchorElUser) && (
                <Menu
                  sx={{ mt: '45px' }}
                  id="user-menu-appbar"
                  anchorEl={anchorElUser}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  slotProps={{
                    paper: {
                      elevation: 0,
                      sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                      },
                    },
                  }}
                >
                  <MenuItem onClick={() => {
                    handleCloseUserMenu();
                    navigate('/history');
                  }}>
                    <HistoryIcon sx={{ mr: 1 }} />
                    <Typography textAlign="center">History</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
              <Button
                component={RouterLink}
                to="/login"
                variant={isHomePage && !isScrolled ? 'outlined' : 'contained'}
                sx={{
                  color: isHomePage && !isScrolled ? '#fff' : undefined,
                  borderColor: isHomePage && !isScrolled ? '#fff' : undefined,
                }}
              >
                Login
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant={isHomePage && !isScrolled ? 'contained' : 'outlined'}
                sx={{
                  bgcolor: isHomePage && !isScrolled ? '#fff' : undefined,
                  color: isHomePage && !isScrolled ? theme.palette.primary.main : undefined,
                  '&:hover': {
                    bgcolor: isHomePage && !isScrolled ? '#f5f5f5' : undefined,
                  },
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
