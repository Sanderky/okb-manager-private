import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Toolbar from '@mui/material/Toolbar';
import type {} from '@mui/material/themeCssVarsAugmentation';
// import PersonIcon from '@mui/icons-material/Person';
import ConstructionIcon from '@mui/icons-material/Construction';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { BeachAccess, Settings } from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import { matchPath, useLocation } from 'react-router';
import DashboardSidebarContext from './DashboardSidebarContext';
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '@/shared/config/drawer';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleIcon from '@mui/icons-material/People';
import {
  getDrawerSxTransitionMixin,
  getDrawerWidthTransitionMixin,
} from '@/shared/lib/mixins';
import { Hotel, Schedule } from '@mui/icons-material';
import DashboardSidebarPageItem from './DashboardSidebarPageItem';
import DashboardSidebarDividerItem from './DashboardSidebarDividerItem';

export interface DashboardSidebarProps {
  expanded?: boolean;
  setExpanded: (expanded: boolean) => void;
  onSettingsDialogOpen: () => void;
  disableCollapsibleSidebar?: boolean;
  container?: Element;
}

export default function DashboardSidebar({
  expanded = true,
  setExpanded,
  disableCollapsibleSidebar = false,
  container,
  onSettingsDialogOpen,
}: DashboardSidebarProps) {
  const theme = useTheme();

  const { pathname } = useLocation();

  const [expandedItemIds, setExpandedItemIds] = React.useState<string[]>([]);

  const isOverSmViewport = useMediaQuery(theme.breakpoints.up('sm'));
  const isOverMdViewport = useMediaQuery(theme.breakpoints.up('md'));

  const [isFullyExpanded, setIsFullyExpanded] = React.useState(expanded);
  const [isFullyCollapsed, setIsFullyCollapsed] = React.useState(!expanded);

  React.useEffect(() => {
    if (expanded) {
      const drawerWidthTransitionTimeout = setTimeout(() => {
        setIsFullyExpanded(true);
      }, theme.transitions.duration.enteringScreen);

      return () => clearTimeout(drawerWidthTransitionTimeout);
    }

    setIsFullyExpanded(false);

    return () => {};
  }, [expanded, theme.transitions.duration.enteringScreen]);

  React.useEffect(() => {
    if (!expanded) {
      const drawerWidthTransitionTimeout = setTimeout(() => {
        setIsFullyCollapsed(true);
      }, theme.transitions.duration.leavingScreen);

      return () => clearTimeout(drawerWidthTransitionTimeout);
    }

    setIsFullyCollapsed(false);

    return () => {};
  }, [expanded, theme.transitions.duration.leavingScreen]);

  const mini = !disableCollapsibleSidebar && !expanded;

  const handleSetSidebarExpanded = React.useCallback(
    (newExpanded: boolean) => () => {
      setExpanded(newExpanded);
    },
    [setExpanded]
  );

  const handlePageItemClick = React.useCallback(
    (itemId: string, hasNestedNavigation: boolean) => {
      if (hasNestedNavigation && !mini) {
        setExpandedItemIds((previousValue) =>
          previousValue.includes(itemId)
            ? previousValue.filter(
                (previousValueItemId) => previousValueItemId !== itemId
              )
            : [...previousValue, itemId]
        );
        console.log(expandedItemIds);
      } else if (!isOverSmViewport && !hasNestedNavigation) {
        setExpanded(false);
      }
    },
    [mini, setExpanded, isOverSmViewport]
  );

  const hasDrawerTransitions =
    isOverSmViewport && (!disableCollapsibleSidebar || isOverMdViewport);

  const getDrawerContent = React.useCallback(
    (viewport: 'phone' | 'tablet' | 'desktop') => (
      <React.Fragment>
        <Toolbar />
        <Box
          component="nav"
          aria-label={`${viewport.charAt(0).toUpperCase()}${viewport.slice(1)}`}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'auto',
            scrollbarGutter: mini ? 'stable' : 'auto',
            overflowX: 'hidden',
            ...(hasDrawerTransitions
              ? getDrawerSxTransitionMixin(isFullyExpanded, 'padding')
              : {}),
          }}
        >
          <List
            dense
            sx={{
              width: mini ? MINI_DRAWER_WIDTH : 'auto',
              // px: mini ? 0 : 2,
              py: 0,
            }}
          >
            <DashboardSidebarPageItem
              id="home"
              title="Dashboard"
              icon={<HomeIcon />}
              href="/home"
              selected={!!matchPath('/home/*', pathname)}
            />
            <DashboardSidebarPageItem
              id="constructions"
              title="Budowy"
              icon={<ConstructionIcon />}
              href="/constructions"
              selected={!!matchPath('/constructions/*', pathname)}
            />
            <DashboardSidebarPageItem
              id="employees"
              title="Pracownicy"
              icon={<PeopleIcon />}
              href="/employees"
              selected={!!matchPath('/employees/*', pathname)}
            />
            <DashboardSidebarPageItem
              id="lodgings"
              title="Zakwaterowania"
              icon={<Hotel />}
              href="/lodgings"
              selected={!!matchPath('/lodgings/*', pathname)}
            />
            <DashboardSidebarPageItem
              id="vacations"
              title="Kalendarz"
              icon={<CalendarMonthIcon />}
              href="/calendar"
              selected={!!matchPath('/calendar/*', pathname)}
            />
            <DashboardSidebarPageItem
              id="vacations"
              title="Urlopy"
              icon={<BeachAccess />}
              href="/vacations"
              selected={!!matchPath('/vacations/*', pathname)}
            />
            <DashboardSidebarPageItem
              id="schedule"
              title="Harmonogram"
              icon={<EventNoteIcon />}
              href="/schedule"
              selected={!!matchPath('/schedule/*', pathname)}
            />
            <DashboardSidebarPageItem
              id="hours"
              title="Godziny pracy"
              icon={<Schedule />}
              href="/hours"
              selected={!!matchPath('/hours/*', pathname)}
            />
            <DashboardSidebarDividerItem/>
            <DashboardSidebarPageItem
              id="settings"
              title="Ustawienia"
              onClick={onSettingsDialogOpen}
              icon={<Settings />}
            />
          </List>
        </Box>
      </React.Fragment>
    ),
    [mini, hasDrawerTransitions, isFullyExpanded, pathname]
  );

  const getDrawerSharedSx = React.useCallback(
    (isTemporary: boolean) => {
      const drawerWidth = mini ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;

      return {
        displayPrint: 'none',
        width: drawerWidth,
        flexShrink: 0,
        ...getDrawerWidthTransitionMixin(expanded),
        ...(isTemporary ? { position: 'absolute' } : {}),
        [`& .MuiDrawer-paper`]: {
          position: 'absolute',
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundImage: 'none',
          ...getDrawerWidthTransitionMixin(expanded),
        },
      };
    },
    [expanded, mini]
  );

  const sidebarContextValue = React.useMemo(() => {
    return {
      onPageItemClick: handlePageItemClick,
      mini,
      fullyExpanded: isFullyExpanded,
      fullyCollapsed: isFullyCollapsed,
      hasDrawerTransitions,
    };
  }, [
    handlePageItemClick,
    mini,
    isFullyExpanded,
    isFullyCollapsed,
    hasDrawerTransitions,
  ]);

  return (
    <DashboardSidebarContext.Provider value={sidebarContextValue}>
      <Drawer
        container={container}
        variant="temporary"
        open={expanded}
        onClose={handleSetSidebarExpanded(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: 'block',
            sm: disableCollapsibleSidebar ? 'block' : 'none',
            md: 'none',
          },
          height: '100vh',
          ...getDrawerSharedSx(true),
        }}
      >
        {getDrawerContent('phone')}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: {
            xs: 'none',
            sm: disableCollapsibleSidebar ? 'none' : 'block',
            md: 'none',
          },

          ...getDrawerSharedSx(false),
        }}
      >
        {getDrawerContent('tablet')}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          ...getDrawerSharedSx(false),
        }}
      >
        {getDrawerContent('desktop')}
      </Drawer>
    </DashboardSidebarContext.Provider>
  );
}
