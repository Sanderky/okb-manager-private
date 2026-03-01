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
  TextField,
  Button,
  Alert,
  CircularProgress,
  alpha,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Done, Settings } from '@mui/icons-material';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import BaseDialog from '@/shared/ui/BaseDialog';
import {
  fetchAlertsSettings,
  getEmployeeAlerts,
  updateAlertsSettings,
  type AlertsSettings,
} from '@/entities/employee';

interface EmployeeAlertsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AlertsSettingsErrors {
  a1Warning: string;
  a1Critical: string;
  contractWarning: string;
  contractCritical: string;
}

export const EmployeeAlertsSettingsBase = ({
  isOpen,
  onClose,
}: EmployeeAlertsSettingsProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AlertsSettings>({
    a1Warning: 0,
    a1Critical: 0,
    contractWarning: 0,
    contractCritical: 0,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [formErrors, setFormErrors] = useState<AlertsSettingsErrors>({
    a1Warning: '',
    a1Critical: '',
    contractWarning: '',
    contractCritical: '',
  });

  const resetErrors = () => {
    setFormErrors({
      a1Warning: '',
      a1Critical: '',
      contractWarning: '',
      contractCritical: '',
    });
  };

  const validate = (): boolean => {
    let isValid = true;
    const newErrors: AlertsSettingsErrors = {
      a1Warning: '',
      a1Critical: '',
      contractWarning: '',
      contractCritical: '',
    };

    if (isNaN(formData.a1Warning) || formData.a1Warning < 0) {
      newErrors.a1Warning = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (isNaN(formData.a1Critical) || formData.a1Critical < 0) {
      newErrors.a1Critical = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (isNaN(formData.contractWarning) || formData.contractWarning < 0) {
      newErrors.contractWarning = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (isNaN(formData.contractCritical) || formData.contractCritical < 0) {
      newErrors.contractCritical = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (
      !isNaN(formData.a1Warning) &&
      !isNaN(formData.a1Critical) &&
      formData.a1Warning !== 0 &&
      formData.a1Critical !== 0
    ) {
      if (formData.a1Critical >= formData.a1Warning) {
        newErrors.a1Critical =
          'Wartość krytyczna musi być mniejsza niż ostrzeżenie';
        isValid = false;
      }
    }

    if (
      !isNaN(formData.contractWarning) &&
      !isNaN(formData.contractCritical) &&
      formData.contractWarning !== 0 &&
      formData.contractCritical !== 0
    ) {
      if (formData.contractCritical >= formData.contractWarning) {
        newErrors.contractCritical =
          'Wartość krytyczna musi być mniejsza niż ostrzeżenie';
        isValid = false;
      }
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const {
    data: alertsSettings,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['alertsSettings'],
    queryFn: fetchAlertsSettings,
    enabled: isOpen,
  });

  const notifications = useNotifications();

  const updateMutation = useMutation({
    mutationFn: updateAlertsSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertsSettings'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setHasChanges(false);
      notifications.show('Ustawienia alertów zostały zmienione.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Alerts settings update error:', error);
      notifications.show('Wystąpił błąd podczas zapisywania ustawień!', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
  });

  useEffect(() => {
    if (alertsSettings) {
      setFormData(alertsSettings);
      setHasChanges(false);
    }
  }, [alertsSettings]);

  const handleInputChange = (field: keyof AlertsSettings, value: string) => {
    const numValue = parseInt(value) || 0;

    setFormData((prev) => ({
      ...prev,
      [field]: numValue,
    }));

    if (alertsSettings) {
      const hasFieldChanged = alertsSettings[field] !== numValue;
      setHasChanges(hasFieldChanged);
    }
  };

  const handleSave = () => {
    if (!hasChanges) return;
    if (validate()) {
      updateMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    if (alertsSettings) {
      setFormData(alertsSettings);
    }
    setHasChanges(false);
    resetErrors();
    onClose();
  };

  return (
    <Box>
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Błąd podczas ładowania ustawień: {error.message}
        </Alert>
      ) : (
        <>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Alerty umowy zatrudnienia
          </Typography>
          <Stack direction={'column'} spacing={3}>
            <TextField
              label="Liczba dni do ostrzeżenia"
              type="number"
              error={Boolean(formErrors.contractWarning)}
              helperText={formErrors.contractWarning}
              size="small"
              value={formData.contractWarning}
              onChange={(e) =>
                handleInputChange('contractWarning', e.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
            <TextField
              label="Liczba dni do ostrzeżenia krytycznego"
              size="small"
              type="number"
              error={Boolean(formErrors.contractCritical)}
              helperText={formErrors.contractCritical}
              value={formData.contractCritical}
              onChange={(e) =>
                handleInputChange('contractCritical', e.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
          </Stack>

          <Typography variant="subtitle2" sx={{ my: 2 }}>
            Alerty A1
          </Typography>
          <Stack direction={'column'} spacing={3} sx={{ mb: 3 }}>
            <TextField
              label="Liczba dni do ostrzeżenia"
              type="number"
              size="small"
              helperText={formErrors.a1Warning}
              error={Boolean(formErrors.a1Warning)}
              value={formData.a1Warning}
              onChange={(e) => handleInputChange('a1Warning', e.target.value)}
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
            <TextField
              label="Liczba dni do ostrzeżenia krytycznego"
              type="number"
              error={Boolean(formErrors.a1Critical)}
              size="small"
              helperText={formErrors.a1Critical}
              value={formData.a1Critical}
              onChange={(e) => handleInputChange('a1Critical', e.target.value)}
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
          </Stack>
          <Stack direction="row" spacing={1} justifyContent={'flex-start'}>
            <Button
              onClick={handleClose}
              variant="outlined"
              size="small"
              loading={updateMutation.isPending}
              color="inherit"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!hasChanges}
              size="small"
              loading={updateMutation.isPending}
            >
              Zapisz
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
};

const EmployeeAlertsSettings = ({
  isOpen,
  onClose,
}: EmployeeAlertsSettingsProps) => {
  // const handleClose = () => {
  //   if (alertsSettings) {
  //     setFormData(alertsSettings);
  //   }
  //   setHasChanges(false);
  //   resetErrors();
  //   onClose();
  // };

  return (
    <BaseDialog
      open={isOpen}
      onClose={onClose}
      title="Ustawienia alertów"
      showConfirm={false}
      maxWidth="sm"
      fullWidth
    >
      <EmployeeAlertsSettingsBase isOpen={isOpen} onClose={onClose} />
    </BaseDialog>
  );
};

export const EmployeeAlerts = () => {
  const { data: alerts = [], isLoading: loading } = useQuery({
    queryKey: ['alerts'],
    queryFn: getEmployeeAlerts,
  });

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
            sx={{
              mb: 1,
            }}
          >
            <Stack direction={'row'} alignItems={'center'} spacing={1}>
              <ReportProblemIcon color="warning" />
              <Typography variant="body1" className="font-medium">
                Uwagi dotyczące pracowników
              </Typography>
              {hasMoreItems && (
                <Chip
                  label={`${alerts.length} ${alerts.length === 4 || alerts.length === 3 ? 'uwagi' : 'uwag'}`}
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
                      <Typography color={'textSecondary'}>Brak uwag</Typography>
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
                          {alert.title}
                        </Typography>
                        <Typography variant="body2">{alert.message}</Typography>
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
          <EmployeeAlertsSettings
            isOpen={isSettingsDialogOpen}
            onClose={() => setIsSettingsDialogOpen(false)}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
