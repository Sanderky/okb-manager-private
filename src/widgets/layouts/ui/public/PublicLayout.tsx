import {
  Box,
  Button
} from '@mui/material';
import {
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import { Outlet } from 'react-router-dom';
import AppFooter from './Footer';
import { useColorMode } from '@/shared/lib/ThemeContext';

export const PublicLayout = () => {
  const { mode, toggleColorMode } = useColorMode();

  return (
    <Box
      component="section"
      className="relative h-screen w-full overflow-hidden"
      sx={(theme) => ({
        background: theme.palette.background.gradient,
      })}
    >
      <Box
        sx={(theme) => ({
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: theme.palette.background.grid,
          backgroundSize: '6rem 4rem',
        })}
      />
      <Box sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
        <Box className="flex h-screen flex-col">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              p: 1,
            }}
          >
            <Button
              startIcon={
                mode === 'dark' ? (
                  <Brightness7 fontSize="small" />
                ) : (
                  <Brightness4 fontSize="small" />
                )
              }
              onClick={toggleColorMode}
              variant="text"
              color="inherit"
              size="small"
            >
              Motyw
            </Button>
          </Box>
          <Outlet />
          <AppFooter />
        </Box>
      </Box>
    </Box>
  );
};