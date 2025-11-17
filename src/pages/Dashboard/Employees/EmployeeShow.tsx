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

import { type Employee, type FileItem } from '../../../types';
import { getEmployee, updateEmployee } from '../../../api/employees';

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
import AttachmentBox from './AttachmentBox';
import { PreviewDialog } from '../../../components/fileBrowser/FilePreviewDialog';
import { handleDownloadAttachment } from './EmployeeEditHelpers';

import FirebaseFileBrowser from '../../../components/fileBrowser/FileBrowser';
import { EmployeeAlertRange } from '../../../hooks/useEmployeeAlert';
import { getUpcomingVacationsForEmployee } from '../../../api/vacations';

import useLoading from '../../../hooks/useLoading';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { Note } from '../../../components/Note';

const personalFields = [
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
] as const;

const contractFields = [
  { key: 'contractStartDate', label: 'Data rozpoczęcia umowy' },
  { key: 'contractEndDate', label: 'Data wygaśnięcia umowy' },
] as const;

const a1Fields = [
  { key: 'a1StartDate', label: 'Data rozpoczęcia A1' },
  { key: 'a1EndDate', label: 'Data wygaśnięcia A1' },
] as const;

const generateDateBox = (
  key: keyof Employee,
  label: string,
  employeeData: Employee | null
) => {
  if (!employeeData) return null;

  const dateValue = employeeData[key];
  const isContractEndDate = key === 'contractEndDate';
  const isA1EndDate = key === 'a1EndDate';
  const isEndDateField = isContractEndDate || isA1EndDate;
  const isPermanent = isContractEndDate
    ? Boolean(employeeData.contractISPermanent)
    : false;

  let dateStyles = '';
  let severity: 'error' | 'warning' = 'warning';
  let message = '';
  let dayWord = 'dni';

  let displayValue: React.ReactNode;

  if (isContractEndDate && isPermanent) {
    displayValue = 'Umowa na czas nieokreślony';
    dateStyles = 'text-gray-400';
  } else if (dateValue instanceof Date) {
    displayValue = dayjs(dateValue).format('DD.MM.YYYY');

    if (isEndDateField && !isPermanent) {
      const today = dayjs().startOf('day');
      const endDate = dayjs(dateValue).startOf('day');
      const daysDiff = endDate.diff(today, 'day');
      const itemName = isA1EndDate ? 'A1' : 'Umowa';
      const warningRange = isA1EndDate
        ? EmployeeAlertRange.a1.warning
        : EmployeeAlertRange.contract.warning;
      const criticalRange = isA1EndDate
        ? EmployeeAlertRange.a1.critical
        : EmployeeAlertRange.contract.critical;

      if (Math.abs(daysDiff) === 1) dayWord = 'dzień';

      if (daysDiff <= criticalRange) {
        dateStyles = 'border-red-500/25! bg-red-500/10! text-red-700!';
        severity = 'error';
        message =
          daysDiff < 0
            ? `${itemName} wygasła ${Math.abs(daysDiff)} ${dayWord} temu`
            : daysDiff === 0
              ? `${itemName} kończy się dziś`
              : `${itemName} kończy się za ${daysDiff} ${dayWord}`;
      } else if (daysDiff <= warningRange) {
        dateStyles = 'border-amber-500/25! bg-amber-500/10! text-amber-600!';
        severity = 'warning';
        message = `${itemName} kończy się za ${daysDiff} ${dayWord}`;
      }
    }
  } else {
    displayValue = <em className="text-gray-400">Brak</em>;
  }

  return (
    <Grid key={key} size={{ xs: 12 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="flex-start"
        alignItems={{ xs: 'flex-start', lg: 'center' }}
        spacing={{ xs: 1, lg: 2 }}
        sx={{ width: '100%' }}
      >
        <Typography variant="body2" className="font-medium">
          {label}:
        </Typography>
        <Typography
          variant="body2"
          className={`border-lightGray rounded border px-3 py-1 text-gray-700 ${dateStyles}`}
        >
          {displayValue}
        </Typography>
      </Stack>

      {isEndDateField &&
        dateValue instanceof Date &&
        !isPermanent &&
        message && (
          <Alert
            severity={severity}
            // className={`border border-${severity}`}
            sx={{
              width: '100%',
              mt: 2,
              borderColor: `${severity}.main`,
              borderWidth: '1px',
            }}
          >
            <Typography variant="body2">{message}</Typography>
          </Alert>
        )}
    </Grid>
  );
};

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

  const handleOpenPreview = useCallback((file: FileItem | null | undefined) => {
    if (!file) return;
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const handleOpenFileInNewTab = useCallback(
    (file: FileItem | null | undefined) => {
      if (!file) return;
      const url = file.url;
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    },
    []
  );

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
    queryKey: ['employeeVacations', employeeId],
    queryFn: () => getUpcomingVacationsForEmployee(employeeId!),
    enabled: !!employeeId,
  });

  useEffect(() => {
    if (employee) {
      setNotFound(false);
    } else if (!isEmployeeLoading) {
      setNotFound(true);
    }
  }, [employee, isEmployeeLoading]);

  const updateNoteMutation = useMutation({
    mutationFn: (newNote: string) =>
      updateEmployee(employeeId!, { note: newNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      notifications.show('Notatka została zaktualizowana.', {
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
    if (key === 'isContractor') {
      return value ? 'Tak' : 'Nie';
    }

    if (value === null || value === undefined || value === '') {
      return <em className="text-gray-400">-</em>;
    }

    if (key === 'birthDate' && value instanceof Date) {
      return dayjs(value).format('DD.MM.YYYY');
    }

    if (key === 'hourRate' && typeof value === 'number') {
      return `${value} €/h`;
    }

    return String(value);
  };

  const error = errorEmployee || errorEmployeeVacation;
  const loading = isEmployeeLoading || isEmployeeVacationLoading;

  const renderShow = useMemo(() => {
    if (loading) {
      return <Loading message="Ładowanie danych pracownika..." />;
    }

    if (error) {
      return (
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          <Alert severity="error">
            Wystąpił błąd podczas ładowania danych pracownika.
          </Alert>
        </Box>
      );
    }

    if (notFound) {
      return (
        <Box sx={{ width: '100%' }}>
          <Alert severity="info">
            Nie znaleziono pracownika. Mógł zostać usunięty lub nie istnieje.
          </Alert>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button color="inherit" variant="contained" onClick={handleBack}>
              Wróć
            </Button>
          </Stack>
        </Box>
      );
    }

    return employee ? (
      <Box
        sx={{ width: '100%', boxShadow: 1 }}
        className="rounded-lg bg-white p-2 pb-4 md:p-4 md:pt-2 lg:p-6 lg:pt-2"
      >
        <Grid
          container
          spacing={2}
          alignItems={'center'}
          columns={12}
          sx={{ mb: 2 }}
        >
          <Grid size={{ xs: 12, sm: 8 }} sx={{ width: '100%!important' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
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
          </Grid>
        </Grid>
        {tab === 0 && (
          <Grid container spacing={{ xs: 2, lg: 3 }} columns={12}>
            <Grid size={{ xs: 12, lg: 6 }} sx={{ flexGrow: 1 }}>
              <Stack direction={'column'} spacing={{ xs: 2, lg: 3 }}>
                <TableContainer
                  component={Paper}
                  className="border-lightGray overflow-hidden rounded-lg border"
                  sx={{ boxShadow: 'none' }}
                >
                  <Table>
                    <TableBody>
                      {personalFields.map(({ key, label }) => (
                        <TableRow
                          key={key}
                          sx={{
                            borderBottom: '1px solid',
                            borderColor: 'grey.300',
                            '&:last-child': {
                              borderBottom: 'none',
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              minWidth: { xs: '135px', sm: '150px' },
                              width: '30%',
                              border: 'none',
                            }}
                            className="border-r-lightGray border-r bg-gray-50 p-2 sm:px-4"
                          >
                            <Typography
                              variant="body1"
                              className="text-sm font-medium text-gray-500"
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
                              className="text-dark text-sm font-semibold sm:text-base"
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

            <Grid size={{ xs: 12, lg: 6 }} sx={{ flexGrow: 1 }}>
              <Stack direction={'column'} spacing={2}>
                {employeeVacation && employeeVacation.length > 0 && (
                  <Box className="border-lightGray overflow-hidden rounded-lg border">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="px-4 py-3 text-left">
                            <Stack
                              direction={'row'}
                              alignItems={'center'}
                              spacing={1}
                            >
                              <CalendarMonthIcon className="text-blue-800" />
                              <Typography variant="subtitle2" fontWeight="600">
                                Nadchodzące urlopy pracownika:
                              </Typography>
                            </Stack>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {employeeVacation.map((empV) => (
                          <tr
                            key={empV.id}
                            className="transition-colors hover:bg-blue-50/50 active:bg-blue-100"
                          >
                            <td className="px-4 py-3">
                              <Typography
                                variant="body2"
                                className="text-gray-700"
                              >
                                {dayjs(empV.startDate).format('DD.MM.YYYY')} -{' '}
                                {dayjs(empV.endDate).format('DD.MM.YYYY')}
                              </Typography>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
                <Box className="rounded-lg border border-blue-700/25 bg-blue-50/50 p-3 md:p-5 md:pb-3">
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    mb={1.5}
                  >
                    <Typography
                      variant="subtitle1"
                      className="text-baseline font-semibold"
                    >
                      Dowód osobisty
                    </Typography>
                  </Stack>

                  <AttachmentBox
                    file={employee.idAttachment}
                    onShow={() => handleOpenPreview(employee.idAttachment)}
                    onDownload={() =>
                      handleDownloadAttachment(employee.idAttachment)
                    }
                    onNewCard={() =>
                      handleOpenFileInNewTab(employee.idAttachment)
                    }
                  />
                </Box>
                <Box className="rounded-lg border border-blue-700/25 bg-blue-50/50 p-3 md:p-5 md:pb-3">
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    mb={1.5}
                  >
                    <Typography
                      variant="subtitle1"
                      className="text-baseline font-semibold"
                    >
                      Umowa zatrudnienia
                    </Typography>
                  </Stack>

                  <AttachmentBox
                    file={employee.contractAttachment}
                    onShow={() =>
                      handleOpenPreview(employee.contractAttachment)
                    }
                    onDownload={() =>
                      handleDownloadAttachment(employee.contractAttachment)
                    }
                    onNewCard={() =>
                      handleOpenFileInNewTab(employee.contractAttachment)
                    }
                  />

                  <Grid container spacing={2}>
                    {contractFields.map(({ key, label }) => {
                      return generateDateBox(key, label, employee);
                    })}
                  </Grid>
                </Box>
                <Box className="rounded-lg border border-blue-700/25 bg-blue-50/50 p-3 md:p-5 md:pb-3">
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    mb={1.5}
                  >
                    <Typography
                      variant="subtitle1"
                      className="text-baseline font-semibold"
                    >
                      A1
                    </Typography>
                  </Stack>
                  <AttachmentBox
                    file={employee.a1Attachment}
                    onShow={() => handleOpenPreview(employee.a1Attachment)}
                    onDownload={() =>
                      handleDownloadAttachment(employee.a1Attachment)
                    }
                    onNewCard={() =>
                      handleOpenFileInNewTab(employee.a1Attachment)
                    }
                  />
                  <Grid container spacing={2}>
                    {a1Fields.map(({ key, label }) => {
                      return generateDateBox(key, label, employee);
                    })}
                  </Grid>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Box>
            <FirebaseFileBrowser
              baseDirectory={`employees/${employee.id}/files`}
            />
          </Box>
        )}
      </Box>
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
  ]);

  const pageTitle = employee?.name || 'Szczegóły Pracownika';

  return (
    <PageContainer
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
                className={
                  employee?.status
                    ? 'bg-green-300/50 text-green-600'
                    : 'bg-red-300/50 text-red-600'
                }
                variant="filled"
                sx={{
                  borderRadius: 1,
                  p: 0.5,
                  ml: 2,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              />
            )
          ) : null}
        </Stack>
      }
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>{renderShow}</Box>
      <PreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={previewFile}
      />
    </PageContainer>
  );
}
