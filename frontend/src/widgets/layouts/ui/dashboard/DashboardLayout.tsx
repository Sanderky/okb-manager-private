import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Toolbar from '@mui/material/Toolbar';
import { Outlet } from 'react-router';
import DashboardHeader from './components/DashboardHeader';
import DashboardSidebar from './components/sidebar/DashboardSidebar';
import Logo from '@/shared/ui/Logo';
import { ScrollContext } from '@/shared/lib/ScrollContext';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from '@mui/material';
import BaseDialog from '@/shared/ui/BaseDialog';
import { ExpandMore } from '@mui/icons-material';
import { UserSettingsBase } from '@/features/user-settings';
import { RodoSettings } from '@/features/app-settings';
import { EmployeeAlertsSettingsBase } from '@/features/employees';
import { useTranslation } from 'react-i18next';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings = ({ isOpen, onClose }: SettingsProps) => {
  const {t} = useTranslation('app');
  return (
    <BaseDialog
      open={isOpen}
      onClose={onClose}
      title={t('settings.title')}
      showConfirm={false}
      maxWidth="sm"
      fullWidth
      contentSx={{ p: 0 }}
    >
      <Accordion disableGutters>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel1-content"
          id="panel1-header"
          sx={{
            backgroundColor: 'background.default',
          }}
        >
          <Typography
            component="span"
            sx={{ fontWeight: 500, fontSize: '1.1rem' }}
            variant="body1"
          >
            {t('settings.employeesAlerts')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <EmployeeAlertsSettingsBase isOpen={isOpen} onClose={onClose} />
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel2-content"
          id="panel2-header"
          sx={{
            backgroundColor: 'background.default',
          }}
        >
          <Typography
            component="span"
            sx={{ fontWeight: 500, fontSize: '1.1rem' }}
            variant="body1"
          >
            {t('settings.accountSettings')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <UserSettingsBase open={isOpen} showEmailConfirmationButton />
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel3-content"
          id="panel3-header"
          sx={{
            backgroundColor: 'background.default',
          }}
        >
          <Typography
            component="span"
            sx={{ fontWeight: 500, fontSize: '1.1rem' }}
            variant="body1"
          >
            {t('settings.rodo')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RodoSettings isOpen={isOpen} onClose={onClose} />
        </AccordionDetails>
      </Accordion>
    </BaseDialog>
  );
};

export function DashboardLayout() {
  const theme = useTheme();

  const [isDesktopNavigationExpanded, setIsDesktopNavigationExpanded] =
    React.useState(true);
  const [isMobileNavigationExpanded, setIsMobileNavigationExpanded] =
    React.useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false);

  const isOverMdViewport = useMediaQuery(theme.breakpoints.up('md'));

  const isNavigationExpanded = isOverMdViewport
    ? isDesktopNavigationExpanded
    : isMobileNavigationExpanded;

  const setIsNavigationExpanded = React.useCallback(
    (newExpanded: boolean) => {
      if (isOverMdViewport) {
        setIsDesktopNavigationExpanded(newExpanded);
      } else {
        setIsMobileNavigationExpanded(newExpanded);
      }
    },
    [
      isOverMdViewport,
      setIsDesktopNavigationExpanded,
      setIsMobileNavigationExpanded,
    ]
  );

  const handleToggleHeaderMenu = React.useCallback(
    (isExpanded: boolean) => {
      setIsNavigationExpanded(isExpanded);
    },
    [setIsNavigationExpanded]
  );

  const layoutRef = React.useRef<HTMLDivElement>(null);

  const scrollableRef = React.useRef<HTMLDivElement>(null);

  const scrollToTop = React.useCallback(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, []);

  const scrollContextValue = React.useMemo(
    () => ({
      scrollToTop,
    }),
    [scrollToTop]
  );

  const handleOpenSettingsDialog = React.useCallback(
    () => setIsSettingsDialogOpen(true),
    []
  );
  const handleCloseSettingsDialog = React.useCallback(
    () => setIsSettingsDialogOpen(false),
    []
  );

  return (
    <ScrollContext.Provider value={scrollContextValue}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <DashboardHeader
          logo={<Logo />}
          title=""
          menuOpen={isNavigationExpanded}
          onToggleMenu={handleToggleHeaderMenu}
        />

        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <DashboardSidebar
            expanded={isNavigationExpanded}
            setExpanded={setIsNavigationExpanded}
            container={layoutRef?.current ?? undefined}
            onSettingsDialogOpen={handleOpenSettingsDialog}
          />

          <Box
            component="main"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            <Toolbar sx={{ displayPrint: 'none', flexShrink: 0 }} />
            <Box
              ref={scrollableRef}
              sx={(theme) => ({
                background: theme.palette.background.default,
                flexGrow: 1,

                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              })}
            >
              <Outlet />
            </Box>
          </Box>
        </Box>

        <Settings
          isOpen={isSettingsDialogOpen}
          onClose={handleCloseSettingsDialog}
        />
      </Box>
    </ScrollContext.Provider>
  );
}
