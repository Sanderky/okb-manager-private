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
import {
  Avatar,
  Button,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
} from '@mui/material';

import Logout from '@mui/icons-material/Logout';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Settings } from '@mui/icons-material';
import UserSettingsDialog from './UserSettingsDialog';
import { useLayout } from '../../context/LayoutContext';

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
  const navigate = useNavigate();

  const handleMenuOpen = React.useCallback(() => {
    onToggleMenu(!menuOpen);
  }, [menuOpen, onToggleMenu]);

  const handleBackdropOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const [openSettings, setOpenSettings] = React.useState(false);

  const handleClickOpenSettings = () => {
    setOpenSettings(true);
    setAnchorEl(null);
  };
  const handleCloseSettingsDialog = () => {
    setOpenSettings(false);
  };

  const handleBackdropClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleBackdropClose();
    await logout();
    navigate('/login');
  };

  const getMenuIcon = React.useCallback(
    (isExpanded: boolean) => {
      const expandMenuActionText = 'Rozszerz';
      const collapseMenuActionText = 'Zwiń';

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
    <AppBar
      color="inherit"
      position="absolute"
      sx={{
        displayPrint: 'none',
        overflowX: 'hidden',
        // backgroundColor: 'transparent',
      }}
      // className="bg-stone-100"
      // className="bg-darkYellow"
    >
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
                  onClick={handleBackdropOpen}
                  size="small"
                  sx={{ ml: 2 }}
                >
                  <AccountCircleIcon
                    className="text-3xl"
                    sx={{ color: 'text.primary' }}
                  />
                  <Typography
                    variant="body2"
                    color="textPrimary"
                    sx={{
                      ml: 1,
                      display: { xs: 'none', sm: 'block' },
                      textTransform: 'none',
                    }}
                    className="font-medium"
                  >
                    {user?.user_metadata.display_name ??
                      user?.email ??
                      'Użytkownik'}
                  </Typography>
                </Button>
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleBackdropClose}
                slotProps={{
                  paper: {
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.32))',
                      mt: 1.5,
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
                <Stack
                  direction={'row'}
                  alignItems={'center'}
                  spacing={2}
                  sx={{
                    display: { sm: 'none' },
                    px: 2,
                    pb: 0.5,
                  }}
                >
                  <Avatar sx={{ width: 20, height: 20 }} />{' '}
                  <Typography
                    variant="overline"
                    sx={{
                      textTransform: 'none',
                    }}
                    className="font-medium text-gray-500"
                  >
                    {user?.user_metadata.display_name ??
                      user?.email ??
                      'Użytkownik'}
                  </Typography>
                </Stack>
                <Divider
                  sx={{
                    display: { xs: 'block', sm: 'none' },
                  }}
                />
                <MenuItem
                  onClick={handleClickOpenSettings}
                  sx={{ minHeight: 35, borderColor: 'divider' }}
                  className="sm:border-b"
                >
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  Ustawienia konta
                </MenuItem>
                {/* <Divider
                  sx={{
                    m: 0,
                    display: { xs: 'none', sm: 'block' },
                  }}
                /> */}
                <MenuItem onClick={handleLogout} sx={{ minHeight: 35 }}>
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
      <UserSettingsDialog
        open={openSettings}
        onClose={handleCloseSettingsDialog}
      />
    </AppBar>
  );
}
