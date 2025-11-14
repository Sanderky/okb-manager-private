// DashboardLayout.tsx
import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Outlet } from 'react-router';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import Logo from './Logo';
import { ScrollContext } from '../../context/ScrollContext';

export default function DashboardLayout() {
  const theme = useTheme();

  const [isDesktopNavigationExpanded, setIsDesktopNavigationExpanded] =
    React.useState(true);
  const [isMobileNavigationExpanded, setIsMobileNavigationExpanded] =
    React.useState(false);

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

  // Ref do scrollowanego elementu
  const scrollableRef = React.useRef<HTMLDivElement>(null);

  // Funkcja do scrollowania na górę
  const scrollToTop = React.useCallback(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      // Fallback na window
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
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
              }}
              className="bg-stone-100"
            >
              <Outlet />
            </Box>
          </Box>
        </Box>
      </Box>
    </ScrollContext.Provider>
  );
}
