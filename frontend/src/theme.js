import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#3b82f6', // EventHub bright blue
      light: '#60a5fa', 
      dark: '#2563eb', 
    },
    secondary: {
      main: '#10b981', // Emerald green
    },
    background: {
      default: mode === 'light' ? '#f4f6f8' : '#030712', // Ultra dark background (gray-950 equivalent)
      paper: mode === 'light' ? '#ffffff' : '#111827', // Slate dark background (gray-900 equivalent)
    },
    text: {
      primary: mode === 'light' ? '#111827' : '#f9fafb', // Slate black vs off-white
      secondary: mode === 'light' ? '#6b7280' : '#9ca3af',
    },
    divider: mode === 'light' ? '#e5e7eb' : '#374151',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          backgroundImage: 'none',
          // Automatically maps default borders dynamically based on theme mode
          border: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.palette.divider,
        }),
      },
    },
  },
});

const defaultTheme = getTheme('light');
export default defaultTheme;
