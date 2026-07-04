import { Box, Button } from '@mui/material';
import { Brightness4, Brightness7, Language } from '@mui/icons-material';
import { Outlet } from 'react-router-dom';
import AppFooter from './Footer';
import { useColorMode } from '@/shared/lib/theme';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcherMenu } from '@/shared/ui/LanguageSwitcher';
import { useState } from 'react';

export const PublicLayout = () => {
  const { mode, toggleColorMode } = useColorMode();
  const { t } = useTranslation('app');
  const [anchorLanguageSwitcher, setAnchorLanguageSwitcher] =
    useState<null | HTMLElement>(null);
  const openLanguageSwitcher = Boolean(anchorLanguageSwitcher);

  const handleClickOpenLanguageSwitcher = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setAnchorLanguageSwitcher(event.currentTarget);
  };

  const handleCloseLanguageSwitcher = () => {
    setAnchorLanguageSwitcher(null);
  };

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
              gap: 1,
            }}
          >
            <Button
              startIcon={<Language fontSize="small" />}
              onClick={handleClickOpenLanguageSwitcher}
              variant="text"
              color="inherit"
              size="small"
            >
              {t('header.language')}
            </Button>
            <LanguageSwitcherMenu
              open={openLanguageSwitcher}
              anchorEl={anchorLanguageSwitcher}
              onClose={handleCloseLanguageSwitcher}
            />
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
              {t('header.theme')}
            </Button>
          </Box>
          <Outlet />
          <AppFooter />
        </Box>
      </Box>
    </Box>
  );
};
