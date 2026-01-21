import { createTheme, alpha } from '@mui/material/styles';

// Custom shadow generator for elevated floating effect
const createCustomShadows = (mode) => {
  const shadowColor = mode === 'light' ? 'rgba(0, 0, 0,' : 'rgba(0, 0, 0,';
  const multiplier = mode === 'light' ? 1 : 1.5;

  return [
    'none',
    `0px 2px 4px ${shadowColor} ${0.05 * multiplier})`,
    `0px 4px 8px ${shadowColor} ${0.08 * multiplier})`,
    `0px 6px 16px ${shadowColor} ${0.1 * multiplier})`,
    `0px 8px 24px ${shadowColor} ${0.12 * multiplier})`,
    `0px 12px 32px ${shadowColor} ${0.15 * multiplier})`,
    `0px 16px 40px ${shadowColor} ${0.18 * multiplier})`,
    `0px 20px 48px ${shadowColor} ${0.2 * multiplier})`,
    `0px 24px 56px ${shadowColor} ${0.22 * multiplier})`,
    `0px 28px 64px ${shadowColor} ${0.24 * multiplier})`,
    `0px 32px 72px ${shadowColor} ${0.26 * multiplier})`,
    `0px 36px 80px ${shadowColor} ${0.28 * multiplier})`,
    `0px 40px 88px ${shadowColor} ${0.3 * multiplier})`,
    `0px 44px 96px ${shadowColor} ${0.32 * multiplier})`,
    `0px 48px 104px ${shadowColor} ${0.34 * multiplier})`,
    `0px 52px 112px ${shadowColor} ${0.36 * multiplier})`,
    `0px 56px 120px ${shadowColor} ${0.38 * multiplier})`,
    `0px 60px 128px ${shadowColor} ${0.4 * multiplier})`,
    `0px 64px 136px ${shadowColor} ${0.42 * multiplier})`,
    `0px 68px 144px ${shadowColor} ${0.44 * multiplier})`,
    `0px 72px 152px ${shadowColor} ${0.46 * multiplier})`,
    `0px 76px 160px ${shadowColor} ${0.48 * multiplier})`,
    `0px 80px 168px ${shadowColor} ${0.5 * multiplier})`,
    `0px 84px 176px ${shadowColor} ${0.52 * multiplier})`,
    `0px 88px 184px ${shadowColor} ${0.54 * multiplier})`,
  ];
};

// Shared palette colors
const primaryColor = {
  main: '#1f4b99',
  light: '#3b6cbf',
  dark: '#15356c',
  contrastText: '#ffffff',
};

const secondaryColor = {
  main: '#0f766e',
  light: '#14a38f',
  dark: '#0b5a53',
  contrastText: '#ffffff',
};

// Shared component overrides
const getComponentOverrides = (mode) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          // Avoid purple-tinted dark track; keep it neutral/slate
          background: mode === 'light' ? '#f1f1f1' : '#0f172a',
        },
        '&::-webkit-scrollbar-thumb': {
          background: mode === 'light' ? '#c1c1c1' : '#334155',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: mode === 'light' ? '#a1a1a1' : '#475569',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 18,
        border: `1px solid ${alpha('#0f172a', 0.08)}`,
        transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 14px 28px rgba(15, 23, 42, 0.08)',
        },
      },
    },
    defaultProps: {
      elevation: 0,
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 16,
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        textTransform: 'none',
        fontWeight: 600,
        padding: '8px 20px',
      },
      contained: {
        boxShadow: '0px 10px 24px rgba(31, 75, 153, 0.2)',
        '&:hover': {
          boxShadow: '0px 14px 32px rgba(31, 75, 153, 0.3)',
        },
      },
      containedSecondary: {
        boxShadow: '0px 10px 24px rgba(15, 118, 110, 0.2)',
        '&:hover': {
          boxShadow: '0px 14px 32px rgba(15, 118, 110, 0.28)',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: `0 0 0 2px ${alpha(primaryColor.main, 0.1)}`,
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 3px ${alpha(primaryColor.main, 0.18)}`,
          },
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 20,
        boxShadow: '0px 30px 70px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 500,
        borderRadius: 8,
      },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        borderRadius: '12px !important',
        '&:before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          margin: '8px 0',
        },
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontWeight: 600,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
  },
});

// Light theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: primaryColor,
    secondary: secondaryColor,
    success: {
      main: '#1f7a4c',
      light: '#2fa365',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#d97706',
      light: '#f59e0b',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0ea5e9',
      light: '#38bdf8',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f6f5f1',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Manrope", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h3: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: createCustomShadows('light'),
  components: getComponentOverrides('light'),
});

// Dark theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#63a5ff',
      light: '#8ec0ff',
      dark: '#2b6fd6',
      contrastText: '#000000',
    },
    secondary: {
      main: '#4fd1c5',
      light: '#7be6dd',
      dark: '#1aa397',
      contrastText: '#000000',
    },
    success: {
      main: '#4ade80',
      light: '#6ee7a0',
      contrastText: '#000000',
    },
    warning: {
      main: '#fbbf24',
      light: '#fcd34d',
      contrastText: '#000000',
    },
    error: {
      main: '#f87171',
      light: '#fca5a5',
      contrastText: '#000000',
    },
    info: {
      main: '#38bdf8',
      light: '#7dd3fc',
      contrastText: '#000000',
    },
    background: {
      default: '#0b1220',
      paper: '#111827',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: '"Manrope", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h3: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: createCustomShadows('dark'),
  components: getComponentOverrides('dark'),
});

// Gradient backgrounds for headers
export const gradients = {
  header: {
    light: 'linear-gradient(135deg, #102a43 0%, #1f4b99 45%, #0f766e 100%)',
    dark: 'linear-gradient(135deg, #0b1220 0%, #0f172a 45%, #1f2937 100%)',
  },
  login: {
    light: 'linear-gradient(135deg, #f6f5f1 0%, #eef2f7 40%, #f3f6fb 100%)',
    dark: 'linear-gradient(135deg, #0b1220 0%, #0f172a 50%, #111827 100%)',
  },
};

// Status chip color helper
export const getStatusColor = (status) => {
  const statusColors = {
    approved: 'success',
    pending: 'warning',
    rejected: 'error',
    draft: 'info',
  };
  return statusColors[status] || 'default';
};
