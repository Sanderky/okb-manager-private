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
import { useTranslation } from 'react-i18next';
import { Note } from '@/shared/ui/Note';
import { getDateStr } from '@/shared/lib/string';
import { useEmployeeShowContext } from '../../model/providers/useEmployeeShowContext';
import type { FieldInfo } from '../../model/types';
import useEmployeeAttachments from '../../model/services/useAttachment';
import { AttachmentBox } from './AttachmentBox';
import { EventsListTable } from '@/features/upcoming-events';

const personalFields: FieldInfo[] = [
  { key: 'name', labelKey: 'form.fields.name' },
  { key: 'pesel', labelKey: 'form.fields.pesel' },
  { key: 'address', labelKey: 'form.fields.address' },
  { key: 'email', labelKey: 'form.fields.email' },
  { key: 'phone', labelKey: 'form.fields.phone' },
  { key: 'birthDate', labelKey: 'form.fields.birthDate' },
  { key: 'birthPlace', labelKey: 'form.fields.birthPlace' },
  { key: 'hourRate', labelKey: 'form.fields.hourRate' },
  { key: 'accountNumber', labelKey: 'form.fields.accountNumber' },
  { key: 'isContractor', labelKey: 'form.sections.contractor' },
];
const contractFields: FieldInfo[] = [
  { key: 'contractStartDate', labelKey: 'form.fields.contractStartDate' },
  { key: 'contractEndDate', labelKey: 'form.fields.contractEndDate' },
];
const a1Fields: FieldInfo[] = [
  { key: 'a1StartDate', labelKey: 'form.fields.a1StartDate' },
  { key: 'a1EndDate', labelKey: 'form.fields.a1EndDate' },
];

export const EmployeeShow = () => {
  const { t } = useTranslation('employees');

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
    if (key === 'isContractor') return value ? t('show.yes') : t('show.no');
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
                  {personalFields.map(({ key, labelKey }) => (
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
                          {labelKey ? t(labelKey) : key}:
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
                          <Typography variant="subtitle2" fontWeight="600">
                            {t('show.upcomingVacations', {
                              count: employeeVacation.length,
                            })}
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
                            <Typography variant="body2" color="textSecondary">
                              {getDateStr(empV.startDate, empV.endDate, true, t)}
                            </Typography>
                          </td>
                        </TableRow>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3">
                          <Typography variant="body2" color="textSecondary">
                            {t('show.noVacations')}
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
                label={t('attachments.idCard')}
                type="id_card"
                hook={attachmentsHook}
                employee={employee}
                onPreview={handleOpenPreview}
              />
              <AttachmentBox
                label={t('attachments.contract')}
                type="contract"
                hook={attachmentsHook}
                employee={employee}
                onPreview={handleOpenPreview}
                dateFields={contractFields}
              />
              <AttachmentBox
                label={t('attachments.a1')}
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
