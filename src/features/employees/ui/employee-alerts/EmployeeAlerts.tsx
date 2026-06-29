import {
  Card,
  Typography,
  Stack,
  Box,
  List,
  ListItem,
  IconButton,
  CardContent,
  Chip,
  CircularProgress,
  alpha,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Done, Settings } from '@mui/icons-material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useEmployeeAlerts } from '@/entities/employee';
import { EmployeeAlertsSettingsModal } from './EmployeeAlertsSettingsModal';

export const EmployeeAlerts = () => {
  const { t } = useTranslation('employees');
  const { alerts, isLoading: loading } = useEmployeeAlerts();

  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  const MAX_VISIBLE_ITEMS = 3;
  const hasMoreItems = alerts.length > MAX_VISIBLE_ITEMS;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card
      className="rounded-lg"
      sx={(theme) => ({
        boxShadow: 0,
        border: `1px solid ${theme.palette.divider}`,
      })}
    >
      <CardContent
        className="pb-0"
        sx={{
          '&:last-child': { paddingBottom: 0 },
        }}
      >
        <Box>
          <Stack
            direction={'row'}
            alignItems={'center'}
            justifyContent={'space-between'}
            sx={{ mb: 1 }}
          >
            <Stack direction={'row'} alignItems={'center'} spacing={1}>
              <ReportProblemIcon color="warning" />
              <Typography variant="body1" className="font-medium">
                {t('alerts.title')}
              </Typography>
              {hasMoreItems && (
                <Chip
                  label={t('alerts.count', { count: alerts.length })}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Stack>
            <IconButton
              sx={{ p: 0.5 }}
              onClick={() => setIsSettingsDialogOpen(true)}
            >
              <Settings />
            </IconButton>
          </Stack>

          {loading ? (
            <Stack
              justifyContent={'center'}
              alignItems={'center'}
              sx={{ height: '100%' }}
            >
              <CircularProgress />
            </Stack>
          ) : (
            <Box
              sx={(theme) => ({
                position: 'relative',
                '&:after': {
                  content: '""',
                  pointerEvents: 'none',
                  display:
                    (isExpanded && !loading) || !hasMoreItems
                      ? 'none'
                      : 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  boxShadow: `inset 0px -25px 10px -15px ${alpha(theme.palette.background.paper, 1)}`,
                },
              })}
            >
              <Box
                sx={{
                  maxHeight: isExpanded || !hasMoreItems ? 'none' : 200,
                  overflow: 'auto',
                  position: 'relative',
                }}
              >
                <List>
                  {alerts.length === 0 ? (
                    <Stack direction={'row'} spacing={1} className="mb-2">
                      <Done />
                      <Typography color={'textSecondary'}>
                        {t('alerts.empty')}
                      </Typography>
                    </Stack>
                  ) : (
                    alerts.map((alert) => (
                      <ListItem
                        key={alert.id}
                        onClick={() =>
                          navigate(`/employees/${alert.employeeId}`)
                        }
                        sx={(theme) => ({
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          borderLeftWidth: '8px',
                          alignItems: 'flex-start',
                          mb: 1,

                          borderLeftColor:
                            alert.severity === 'error'
                              ? theme.palette.error.main
                              : theme.palette.warning.main,
                          background:
                            alert.severity === 'error'
                              ? alpha(theme.palette.error.main, 0.4)
                              : alpha(theme.palette.warning.main, 0.4),
                          ':hover': {
                            background:
                              alert.severity === 'error'
                                ? theme.palette.error.main
                                : theme.palette.warning.main,
                          },
                        })}
                      >
                        <Typography variant="subtitle2">
                          {t(alert.titleKey, { name: alert.employeeName })}
                        </Typography>
                        <Typography variant="body2">
                          {t(alert.messageData.key, {
                            ...alert.messageData.params,
                            type: alert.messageData.params?.typeKey
                              ? t(alert.messageData.params.typeKey as string)
                              : '',
                          })}
                        </Typography>
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            </Box>
          )}
          {hasMoreItems && (
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <IconButton onClick={toggleExpanded} size="small">
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          )}
          <EmployeeAlertsSettingsModal
            isOpen={isSettingsDialogOpen}
            onClose={() => setIsSettingsDialogOpen(false)}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
