import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Stack from '@mui/material/Stack';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Button,
  Chip,
  ListItemIcon,
  Menu,
  MenuItem,
} from '@mui/material';

import Logout from '@mui/icons-material/Logout';

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  borderWidth: 0,
  borderBottomWidth: 1,
  borderStyle: 'solid',
  borderColor: (theme.vars ?? theme).palette.divider,
  boxShadow: 'none',
  zIndex: theme.zIndex.drawer + 1,
}));

const LogoContainer = styled('div')({
  position: 'relative',
  height: 40,
  display: 'flex',
  alignItems: 'center',
  '& img': {
    maxHeight: 40,
  },
});

export interface DashboardHeaderProps {
  logo?: React.ReactNode;
  title?: string;
  menuOpen: boolean;
  onToggleMenu: (open: boolean) => void;
}

export default function DashboardHeader({
  logo,
  title,
  menuOpen,
  onToggleMenu,
}: DashboardHeaderProps) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleMenuOpen = React.useCallback(() => {
    onToggleMenu(!menuOpen);
  }, [menuOpen, onToggleMenu]);

  const handleSettingsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleSettingsClose();
    await logout();
    navigate('/login');
  };

  const getMenuIcon = React.useCallback(
    (isExpanded: boolean) => {
      const expandMenuActionText = t('menu.expand');
      const collapseMenuActionText = t('menu.collapse');

      return (
        <Tooltip
          title={`${isExpanded ? collapseMenuActionText : expandMenuActionText} menu`}
          enterDelay={1000}
        >
          <div>
            <IconButton
              size="small"
              aria-label={`${isExpanded ? collapseMenuActionText : expandMenuActionText} menu`}
              onClick={handleMenuOpen}
            >
              {isExpanded ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
          </div>
        </Tooltip>
      );
    },
    [handleMenuOpen]
  );

  // const open = Boolean(anchorEl);

  return (
    <AppBar color="inherit" position="absolute" sx={{ displayPrint: 'none' }}>
      <Toolbar sx={{ backgroundColor: 'inherit', mx: { xs: -0.75, sm: -1 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          <Stack direction="row" alignItems="center">
            <Box sx={{ mr: 1 }}>{getMenuIcon(menuOpen)}</Box>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Stack direction="row" alignItems="center">
                {logo ? <LogoContainer>{logo}</LogoContainer> : null}
                {title ? (
                  <Typography
                    variant="h6"
                    sx={{
                      color: (theme.vars ?? theme).palette.primary.main,
                      fontWeight: '700',
                      ml: 1,
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                    }}
                  >
                    {title}
                  </Typography>
                ) : null}
              </Stack>
            </Link>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ marginLeft: 'auto' }}
          >
            <React.Fragment>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <Button
                  variant="text"
                  onClick={handleSettingsOpen}
                  size="small"
                  sx={{ ml: 2 }}
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user?.email?.charAt(0)}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}
                    className="font-medium text-gray-500"
                  >
                    {user?.email}
                  </Typography>
                </Button>
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleSettingsClose}
                slotProps={{
                  paper: {
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.32))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      '&::before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleLogout} className="py-0">
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Wyloguj
                </MenuItem>
              </Menu>
            </React.Fragment>
            {/* <Stack direction="row" alignItems="center">
              <Chip
                avatar={<Avatar>{auth.user?.email.charAt(0)}</Avatar>}
                label={auth.user?.email}
              />
            </Stack> */}
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
