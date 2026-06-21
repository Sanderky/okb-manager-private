import {
  Grid,
  Stack,
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Box,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import dayjs from 'dayjs';
import { Note } from '@/shared/ui/Note';
import { EventsListTable } from '@/features/calendar';
import { getDateStr } from '@/shared/lib/string';
import { useEmployeeShowContext } from '../../model/providers/useEmployeeShowContext';
import type { FieldInfo } from '../../model/types';
import useEmployeeAttachments from '../../model/useAttachment';
import { AttachmentBox } from '../AttachmentBox';

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

export const EmployeeShow = () => {
  const {
    employee,
    employeeId,
    employeeVacation,
    upcomingEvents,
    handleVacationClick,
    handleSaveNote,
    isSavingNote,
    handleOpenPreview,
  } = useEmployeeShowContext();

  const attachmentsHook = useEmployeeAttachments(employeeId);

  const formatFieldValue = (key: string, value: any) => {
    if (key === 'isContractor') return value ? 'Tak' : 'Nie';
    if (value === null || value === undefined || value === '')
      return (
        <Typography component="span" color="textSecondary" fontWeight="bold">
          -
        </Typography>
      );
    if (key === 'birthDate' && value instanceof Date)
      return dayjs(value).format('DD.MM.YYYY');
    if (key === 'hourRate' && typeof value === 'number') return `${value} €/h`;
    return String(value);
  };

  if (!employee) return null;

  return (
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
          <Stack direction="column" spacing={{ xs: 2, lg: 3 }}>
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
                          {formatFieldValue(
                            key,
                            employee[key as keyof typeof employee]
                          )}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Note
              content={employee.note ?? ''}
              onSave={handleSaveNote}
              loading={isSavingNote}
            />
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
                sx={(theme) => ({ borderColor: theme.palette.divider })}
              >
                <table className="w-full">
                  <thead>
                    <TableRow
                      sx={(theme) => ({
                        background: theme.palette.accent.main,
                      })}
                    >
                      <th className="px-4 py-3 text-left">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarMonthIcon
                            sx={{ color: 'accent.superDark' }}
                          />
                          <Typography
                            variant="subtitle2"
                            fontWeight="600"
                          >{`Nadchodzące urlopy pracownika (${employeeVacation.length}):`}</Typography>
                        </Stack>
                      </th>
                    </TableRow>
                  </thead>
                  <TableBody
                    sx={(theme) => ({
                      '& > tr:not(:last-child) > td, & > tr:not(:last-child) > th':
                        { borderBottom: `1px solid ${theme.palette.divider}` },
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
                            <Typography variant="body2" color="textSecondary">
                              {getDateStr(empV.startDate, empV.endDate, true)}
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
            <Stack direction="column" spacing={{ xs: 2, lg: 3 }}>
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
  );
};
