import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../components/PageContainer';
import Loading from '../../../components/Loading';
import { FOLDER_NAMES, type Employee, type FileItem } from '../../../types';
import { getEmployee, updateEmployee } from '../../../services/employees';
import EditIcon from '@mui/icons-material/Edit';
import {
  Chip,
  IconButton,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tabs,
  Tooltip,
} from '@mui/material';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { PreviewDialog } from '../../../components/fileBrowser/FilePreviewDialog';
import FileBrowser from '../../../components/fileBrowser/FileBrowser';
import { getUpcomingVacationsForEmployee } from '../../../services/vacations';
import useLoading from '../../../hooks/useLoading';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { Note } from '../../../components/Note';
import { useScroll } from '../../../context/ScrollContext';
import { fetchAlertsSettings } from '../../../services/settings';
import useEmployeeAttachments from './useAttachment';
import AttachmentBox from './AttachmentBox';
import { EventsListTable } from '../../../components/EventsBox';
import { getUpcomingEventsForEmployee } from '../../../services/calendar';
import { getDateStr } from '../Vacations/VacationsHelpers';

export interface FieldInfo {
  key: keyof Employee;
  label: string;
}
const personalFields: FieldInfo[] = [
  { key: 'name', label: 'Imię i nazwisko' },
  { key: 'pesel', label: 'PESEL' },
  { key: 'address', label: 'Adres' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefon' },
  { key: 'birthDate', label: 'Data urodzenia' },
  { key: 'birthPlace', label: 'Miejsce urodzenia' },
  { key: 'hourRate', label: 'Stawka' },
  { key: 'accountNumber', label: 'Numer konta' },
  { key: 'isContractor', label: 'Kontraktor' },
];

const contractFields: FieldInfo[] = [
  { key: 'contractStartDate', label: 'Data rozpoczęcia umowy' },
  { key: 'contractEndDate', label: 'Data wygaśnięcia umowy' },
];

const a1Fields: FieldInfo[] = [
  { key: 'a1StartDate', label: 'Data rozpoczęcia A1' },
  { key: 'a1EndDate', label: 'Data wygaśnięcia A1' },
];

export default function EmployeeShow() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);
  const [notFound, setNotFound] = useState(false);
  const notifications = useNotifications();
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [tab, setTab] = useState(0);

  const attachmentsHook = useEmployeeAttachments(employeeId);

  const handleOpenPreview = useCallback((file: FileItem | null | undefined) => {
    if (!file) return;

    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const {
    data: employee,
    isLoading: isEmployeeLoading,
    error: errorEmployee,
  } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getEmployee(employeeId!),
    enabled: !!employeeId,
  });

  const {
    data: employeeVacation,
    isLoading: isEmployeeVacationLoading,
    error: errorEmployeeVacation,
  } = useQuery({
    queryKey: ['vacations', 'employeeVacations', employeeId],
    queryFn: () => getUpcomingVacationsForEmployee(employeeId!),
    enabled: !!employeeId,
  });

  const { data: alertsSettings } = useQuery({
    queryKey: ['alertsSettings'],
    queryFn: fetchAlertsSettings,
  });

  const { data: upcomingEvents = [], isLoading: isUpcomingEventsLoading } =
    useQuery({
      queryKey: ['calendarEvents', 'upcoming', 'employee', employeeId],
      queryFn: () => getUpcomingEventsForEmployee(employeeId ?? ''),
      enabled: !!employeeId,
    });

  useEffect(() => {
    if (employee) setNotFound(false);
    else if (!isEmployeeLoading) setNotFound(true);
  }, [employee, isEmployeeLoading]);

  const updateNoteMutation = useMutation({
    mutationFn: (newNote: string) =>
      updateEmployee(employeeId!, { note: newNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      notifications.show('Notatka została zaktualizowane.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
    },
    onError: (error: Error) => {
      console.error('Update note error:', error);
      notifications.show('Wystąpił błąd podczas zapisywania notatki.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
  });

  const handleSaveNote = useCallback(
    async (note: string) => {
      startActionLoading();
      try {
        await updateNoteMutation.mutateAsync(note);
      } finally {
        stopActionLoading();
      }
    },
    [updateNoteMutation, startActionLoading, stopActionLoading]
  );

  const handleEmployeeEdit = useCallback(() => {
    navigate(`/employees/${employeeId}/edit`);
  }, [navigate, employeeId]);
  const handleBack = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  const formatFieldValue = (key: string, value: any) => {
    if (key === 'isContractor') return value ? 'Tak' : 'Nie';
    if (value === null || value === undefined || value === '')
      return (
        <Typography
          component={'span'}
          color="textSecondary"
          fontWeight={'bold'}
        >
          -
        </Typography>
      );
    if (key === 'birthDate' && value instanceof Date)
      return dayjs(value).format('DD.MM.YYYY');
    if (key === 'hourRate' && typeof value === 'number') return `${value} €/h`;
    return String(value);
  };

  const { scrollToTop } = useScroll();
  const handleVacationClick = (vacation: any) => {
    const startMonth = dayjs(vacation.startDate).format('YYYY-MM');
    navigate(`/vacations?month=${startMonth}&vacationId=${vacation.id}`);
    scrollToTop();
  };

  const error = errorEmployee || errorEmployeeVacation;
  const loading =
    isEmployeeLoading || isEmployeeVacationLoading || isUpcomingEventsLoading;

  const renderShow = useMemo(() => {
    if (loading) return <Loading message="Ładowanie danych pracownika..." />;
    if (error)
      return (
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          <Alert severity="error">
            Wystąpił błąd podczas ładowania danych pracownika.
          </Alert>
        </Box>
      );
    if (notFound)
      return (
        <Box sx={{ width: '100%' }}>
          <Alert severity="info">Nie znaleziono pracownika.</Alert>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button color="inherit" variant="contained" onClick={handleBack}>
              Wróć
            </Button>
          </Stack>
        </Box>
      );

    return employee ? (
      tab === 0 ? (
        <Box
          sx={(theme) => ({
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          })}
          className="rounded-lg p-2 md:p-4 lg:p-6"
        >
          <Grid container spacing={{ xs: 2, lg: 3 }} columns={12}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Stack direction={'column'} spacing={{ xs: 2, lg: 3 }}>
                <TableContainer
                  component={Paper}
                  className="overflow-hidden rounded-lg"
                  sx={(theme) => ({
                    boxShadow: 'none',

                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Table>
                    <TableBody>
                      {personalFields.map(({ key, label }) => (
                        <TableRow
                          key={key}
                          sx={(theme) => ({
                            borderBottom: '1px solid',
                            borderColor: theme.palette.divider,
                            '&:last-child': { borderBottom: 'none' },
                          })}
                        >
                          <TableCell
                            sx={(theme) => ({
                              minWidth: { xs: '135px', sm: '150px' },
                              width: '30%',
                              border: 'none',
                              background: theme.palette.background.default,
                              borderRight: `1px solid ${theme.palette.divider}`,
                            })}
                            className="p-2 sm:px-4"
                          >
                            <Typography
                              variant="body1"
                              className="text-sm font-medium"
                              color="textSecondary"
                            >
                              {label}:
                            </Typography>
                          </TableCell>
                          <TableCell
                            sx={{
                              border: 'none',
                              maxWidth: '100%',
                              overflow: 'visible',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              textAlign: 'right',
                            }}
                            className="p-2 sm:px-4"
                          >
                            <Typography
                              variant="body1"
                              className="text-sm font-semibold sm:text-base"
                              color="textPrimary"
                            >
                              {formatFieldValue(key, employee[key])}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Note content={employee?.note ?? ''} onSave={handleSaveNote} />
              </Stack>
            </Grid>

            <Grid
              container
              size={{ xs: 12, lg: 6 }}
              spacing={{ xs: 2, lg: 3 }}
              columns={12}
            >
              <Grid
                size={12}
                className="overflow-hidden rounded-lg"
                sx={(theme) => ({
                  alignSelf: 'flex-start',
                  border: `1px solid ${theme.palette.divider}`,
                })}
              >
                <EventsListTable type="employee" events={upcomingEvents} />
              </Grid>

              <Grid size={12}>
                {employeeVacation && (
                  <Box
                    className="overflow-hidden rounded-lg border"
                    sx={(theme) => ({
                      borderColor: theme.palette.divider,
                    })}
                  >
                    <table className="w-full">
                      <thead>
                        <TableRow
                          sx={(theme) => ({
                            background: theme.palette.accent.main,
                          })}
                        >
                          <th className="px-4 py-3 text-left">
                            <Stack
                              direction={'row'}
                              alignItems={'center'}
                              spacing={1}
                            >
                              <CalendarMonthIcon
                                sx={{ color: 'accent.superDark' }}
                              />
                              <Typography variant="subtitle2" fontWeight="600">
                                {`Nadchodzące urlopy pracownika (${employeeVacation.length}):`}
                              </Typography>
                            </Stack>
                          </th>
                        </TableRow>
                      </thead>
                      <TableBody
                        sx={(theme) => ({
                          '& > tr:not(:last-child) > td, & > tr:not(:last-child) > th':
                            {
                              borderBottom: `1px solid ${theme.palette.divider}`,
                            },
                          '& > tr:last-child > td, & > tr:last-child > th': {
                            borderBottom: 'none',
                          },
                        })}
                      >
                        {employeeVacation.length > 0 ? (
                          employeeVacation.map((empV) => (
                            <TableRow
                              key={empV.id}
                              onClick={() => handleVacationClick(empV)}
                              className="cursor-pointer transition-colors"
                              sx={(theme) => ({
                                ':hover': {
                                  background: theme.palette.accent.light,
                                },
                                ':active': {
                                  background: theme.palette.accent.main,
                                },
                              })}
                            >
                              <td className="px-4 py-3">
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                >
                                  {getDateStr(
                                    empV.startDate,
                                    empV.endDate,
                                    true
                                  )}
                                </Typography>
                              </td>
                            </TableRow>
                          ))
                        ) : (
                          <tr>
                            <td className="px-4 py-3">
                              <Typography variant="body2" color="textSecondary">
                                Brak urlopów
                              </Typography>
                            </td>
                          </tr>
                        )}
                      </TableBody>
                    </table>
                  </Box>
                )}
              </Grid>

              <Grid size={12}>
                <Stack direction={'column'} spacing={{ xs: 2, lg: 3 }}>
                  <AttachmentBox
                    label="Dowód osobisty"
                    type="id_card"
                    hook={attachmentsHook}
                    employee={employee}
                    onPreview={handleOpenPreview}
                  />
                  <AttachmentBox
                    label="Umowa zatrudnienia"
                    type="contract"
                    hook={attachmentsHook}
                    employee={employee}
                    onPreview={handleOpenPreview}
                    dateFields={contractFields}
                  />
                  <AttachmentBox
                    label="A1"
                    type="a1"
                    hook={attachmentsHook}
                    employee={employee}
                    onPreview={handleOpenPreview}
                    dateFields={a1Fields}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
          }}
        >
          <FileBrowser baseDirectory={`${FOLDER_NAMES['employees']}/${employee.id}`} />
        </Box>
      )
    ) : null;
  }, [
    loading,
    error,
    notFound,
    employee,
    tab,
    handleEmployeeEdit,
    handleSaveNote,
    actionLoading,
    employeeVacation,
    handleBack,
    handleOpenPreview,
    alertsSettings,
    attachmentsHook,
    upcomingEvents,
  ]);

  const pageTitle = employee?.name || 'Szczegóły Pracownika';

  return (
    <PageContainer
      fixedHeight={loading || tab === 1}
      title={`Pracownik ${pageTitle}`}
      breadcrumbs={[
        { title: 'Pracownicy', path: '/employees' },
        { title: pageTitle },
      ]}
      actions={
        <Stack direction="row" alignItems="center">
          {!error && !notFound ? (
            loading ? (
              <Loading size={24} message="" />
            ) : (
              <Chip
                label={employee?.status ? 'Aktywny' : 'Nieaktywny'}
                variant="filled"
                sx={(theme) => ({
                  borderRadius: 1,
                  p: 0.5,
                  ml: 2,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: employee?.status
                    ? theme.palette.status.employee.active.text
                    : theme.palette.status.employee.inactive.text,
                  background: employee?.status
                    ? theme.palette.status.employee.active.background
                    : theme.palette.status.employee.inactive.background,
                })}
              />
            )
          ) : null}
        </Stack>
      }
      renderTopToolbar={
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={(theme) => ({
            background: theme.palette.background.paper,
            pr: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab
              label="Informacje"
              sx={{
                fontSize: { xs: '0.8rem', sm: '.85rem' },
                padding: 2,
                minWidth: 0,
              }}
            />
            <Tab
              label="Pliki"
              sx={{
                fontSize: { xs: '0.8rem', sm: '.85rem' },
                padding: 2,
                minWidth: { xs: 0, sm: 100 },
              }}
            />
          </Tabs>
          <Stack
            direction="row"
            justifyContent="flex-end"
            flexGrow={1}
            spacing={{ xs: 1.5, sm: 3 }}
            sx={{ pl: 1 }}
          >
            <Tooltip title="Edytuj pracownika">
              <IconButton
                onClick={handleEmployeeEdit}
                color="primary"
                className="rounded-full border"
                size="small"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      }
    >
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          width: '100%',
          py: !error && tab === 0 ? 2 : 0,
          px: !error && tab === 0 ? { xs: 0.5, sm: 2 } : 0,
          height: tab === 0 ? 'auto' : '100%',
        }}
      >
        {renderShow}
      </Box>
      <PreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={previewFile}
      />
    </PageContainer>
  );
}
