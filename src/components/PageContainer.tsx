'use client';
import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Breadcrumbs, { breadcrumbsClasses } from '@mui/material/Breadcrumbs';
import { type ContainerProps } from '@mui/material/Container';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Link } from 'react-router';
import { useLayout } from '../context/LayoutContext';
import { IconButton, Menu } from '@mui/material';
import { useMediaQuery } from '@mui/system';
import { MoreHoriz, MoreVert } from '@mui/icons-material';

const PageHeaderBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: {
    color: (theme.vars || theme).palette.action.disabled,
    margin: 1,
  },
  [`& .${breadcrumbsClasses.ol}`]: {
    alignItems: 'center',
  },
  flexShrink: 0,
}));

const PageHeaderToolbar = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(1),
  flexGrow: 1,
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
}));

export const ResponsivePageActions = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!isMobile) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        {children}
      </Stack>
    );
  }

  return (
    <>
      <IconButton
        aria-label="więcej akcji"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreHoriz />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'long-button',
          },
          paper: {
            sx: {
              minWidth: '200px',
              maxWidth: '200px',
            },
          },
        }}
      >
        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              const element = child as React.ReactElement<any>;

              return React.cloneElement(element, {
                fullWidth: true,
                onClick: (e: React.MouseEvent) => {
                  if (element.props.onClick) element.props.onClick(e);
                  handleClose();
                },
                style: { ...element.props.style },
                sx: { ...element.props.sx },
                variant: 'outlined',
              });
            }
            return child;
          })}
        </Box>
      </Menu>
    </>
  );
};

export interface Breadcrumb {
  title: string;
  path?: string;
}
export interface PageContainerProps extends ContainerProps {
  children?: React.ReactNode;
  title?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  fixedHeight?: boolean;
}

export default function PageContainer(props: PageContainerProps) {
  const { children, breadcrumbs, actions = null, fixedHeight = false } = props;

  const { setHeaderHeight, topBarHeight } = useLayout();

  const headerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!headerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const elementHeight =
          entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height;
        setHeaderHeight(elementHeight + 48);
      }
    });

    observer.observe(headerRef.current);

    return () => observer.disconnect();
  }, [setHeaderHeight]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: fixedHeight ? `calc(100vh - ${topBarHeight ?? 64}px)` : 'auto',
        overflowY: fixedHeight ? 'hidden' : 'auto',
        overflowX: 'hidden',
      }}
    >
      <Stack
        sx={{
          width: '100%',
          maxWidth: '1300px',
          pt: 2,
          pb: 2,
          px: { xs: 1, md: 2 },
          height: fixedHeight ? '100%' : 'auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
        spacing={0}
      >
        <Stack
          ref={headerRef}
          direction={'row'}
          alignItems={'center'}
          flexWrap={'wrap'}
          sx={{
            mb: 2,
            gap: 2,
          }}
        >
          <PageHeaderBreadcrumbs
            aria-label="breadcrumb"
            separator={<NavigateNextRoundedIcon fontSize="small" />}
            sx={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              my: 0,
            }}
          >
            {breadcrumbs
              ? breadcrumbs.map((breadcrumb, index) => {
                  return breadcrumb.path ? (
                    <MuiLink
                      key={index}
                      component={Link}
                      underline="hover"
                      color="inherit"
                      to={breadcrumb.path}
                      sx={{
                        maxWidth: 250,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                      }}
                      title={breadcrumb.title}
                    >
                      {breadcrumb.title}
                    </MuiLink>
                  ) : (
                    <Typography
                      key={index}
                      sx={{
                        color: 'text.primary',
                        fontWeight: 600,
                        maxWidth: 250,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                      }}
                      title={breadcrumb.title}
                    >
                      {breadcrumb.title}
                    </Typography>
                  );
                })
              : null}
          </PageHeaderBreadcrumbs>
          <PageHeaderToolbar>
            <ResponsivePageActions>{actions}</ResponsivePageActions>
          </PageHeaderToolbar>
        </Stack>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            height: fixedHeight ? '100%' : 'auto',
            overflow: 'visible',
          }}
        >
          {children}
        </Box>
      </Stack>
    </Box>
  );
}
