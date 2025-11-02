'use client';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Breadcrumbs, { breadcrumbsClasses } from '@mui/material/Breadcrumbs';
import { type ContainerProps } from '@mui/material/Container';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Link } from 'react-router';

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

export interface Breadcrumb {
  title: string;
  path?: string;
}
export interface PageContainerProps extends ContainerProps {
  children?: React.ReactNode;
  title?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

export default function PageContainer(props: PageContainerProps) {
  const { children, breadcrumbs, actions = null } = props;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        minHeight: '100%',
      }}
    >
      <Stack
        sx={{
          flex: 1,
          py: 2,
          px: { xs: 2, sm: 3 },
          maxWidth: '1500px',
          overflow: 'hidden',
        }}
        spacing={0}
      >
        <Stack
          direction={'row'}
          alignItems={'center'}
          flexWrap={'wrap'}
          sx={{
            mb: 2,
            columnGap: 2,
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
          <PageHeaderToolbar>{actions}</PageHeaderToolbar>
        </Stack>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Box>
      </Stack>
    </Box>
  );
}
