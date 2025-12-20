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
import { IconButton, Menu } from '@mui/material';
import { useMediaQuery } from '@mui/system';
import { MoreHoriz } from '@mui/icons-material';

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
  renderBottomToolbar?: React.ReactNode;
  renderTopToolbar?: React.ReactNode;
}

export default function PageContainer(props: PageContainerProps) {
  const { children, breadcrumbs, renderBottomToolbar, renderTopToolbar, actions = null, fixedHeight = false } = props;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Stack
        sx={{
          width: '100%',
          height: fixedHeight ? '100%' : 'auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
        spacing={0}
      >
        <Stack
          direction={'row'}
          alignItems={'center'}
          flexWrap={'wrap'}
          sx={(theme) => ({
            minHeight: '47px',
            p: 1,
            gap: 2,
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`
          })}
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
        {renderTopToolbar &&

          <Box
            sx={{
              flexShrink: 0,
            }}
          >
            {renderTopToolbar}
          </Box>
        }

        <Box
          sx={{

            flex: 1,


            minHeight: 0,

            overflowY: fixedHeight ? 'hidden' : 'auto',
            overflowX: 'hidden',

            display: 'flex',
            flexDirection: 'column',

          }}
        >
          {children}
        </Box>
        {renderBottomToolbar &&

          <Box
            sx={{
              flexShrink: 0,

            }}
          >
            {renderBottomToolbar}
          </Box>
        }
      </Stack>
    </Box>
  );
}
