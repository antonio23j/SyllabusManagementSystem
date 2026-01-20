import React, { useState, useContext } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Avatar,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  School,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { ColorModeContext } from '../App';
import { gradients } from '../theme';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect based on role
      const userRole = response.data.user?.role;
      console.log('User role:', userRole);
      
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'teacher') {
        navigate('/teacher', { replace: true });
      } else if (userRole === 'head') {
        navigate('/head', { replace: true });
      } else {
        setError('Unknown user role. Please contact administrator.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'light'
          ? gradients.login.light
          : gradients.login.dark,
        position: 'relative',
        overflow: 'hidden',
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '38%',
          height: '38%',
          borderRadius: '50%',
          background: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.18),
          filter: 'blur(60px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '34%',
          height: '34%',
          borderRadius: '50%',
          background: alpha(theme.palette.secondary.main, theme.palette.mode === 'light' ? 0.12 : 0.2),
          filter: 'blur(60px)',
        }}
      />

      {/* Dark mode toggle */}
      <IconButton
        onClick={colorMode.toggleColorMode}
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          color: 'white',
          bgcolor: alpha(theme.palette.common.white, 0.1),
          backdropFilter: 'blur(10px)',
          '&:hover': {
            bgcolor: alpha(theme.palette.common.white, 0.2),
          },
        }}
      >
        {theme.palette.mode === 'dark' ? <LightMode /> : <DarkMode />}
      </IconButton>

      <Paper
        sx={{
          width: 'min(460px, 92vw)',
          borderRadius: 4,
          border: '1px solid',
          borderColor: alpha(theme.palette.common.black, theme.palette.mode === 'light' ? 0.08 : 0.2),
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.95 : 0.92),
          backdropFilter: 'blur(16px)',
          p: { xs: 3, md: 4 },
          animation: 'fadeIn 0.4s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(12px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            <School sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Syllabus Manager
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Sign in to continue
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        <Box>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{ mb: 2.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={loading}
            sx={{
              py: 1.4,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 2.5,
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Sign In'
            )}
          </Button>
        </Box>

        <Divider sx={{ my: 2.5 }} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center' }}
        >
          Secure login for authorized personnel only
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
