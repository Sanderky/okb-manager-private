import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  Tooltip,
  Chip,
  Box,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import dayjs from 'dayjs';
import { Note } from '@/shared/ui/Note';
import { openGoogleMaps } from '@/shared/lib/browser';
import type { Construction } from '@/entities/construction';
import { useConstructionShowContext } from '../../model/providers/ShowConstructionContext';
import { EventsListTable } from '@/features/upcoming-events';

export const ConstructionShow = () => {
  const { t } = useTranslation('constructions');

  const personalFields = useMemo(
    () => [
      { key: 'name', label: t('fields.name') },
      { key: 'location', label: t('fields.location') },
      { key: 'contractorName', label: t('fields.contractor') },
      { key: 'startDate', label: t('fields.startDate') },
      { key: 'endDate', label: t('fields.endDate') },
    ],
    [t]
  );

  const {
    construction,
    handleNavigateToContractor,
    handleSaveNote,
    isSavingNote,
    upcomingEvents,
    activeScheduleEmployees,
    handleNavigateToEmployee,
  } = useConstructionShowContext();

  const renderInfoCell = useCallback(
    (
      construction: Construction,
      key: string,
      value: string | boolean | Date | null | undefined
    ) => {
      if (!construction || !value) {
        return (
          <Typography
            fontWeight={'bold'}
            color="textSecondary"
            component={'span'}
          >
            -
          </Typography>
        );
      } else {
        if (key === 'location') {
          return (
            <Tooltip title={t('tooltips.openMaps')}>
              <Typography
                variant="body1"
                className="text-sm font-semibold sm:text-base"
                sx={{
                  display: 'inline-block',
                  cursor: construction?.location ? 'pointer' : 'default',
                  color: construction?.location ? 'location' : 'inherit',
                  ':hover': { textDecoration: 'underline' },
                }}
                onClick={() => openGoogleMaps(construction.location)}
              >
                {String(value)}{' '}
                <LocationOnIcon fontSize="small" sx={{ color: 'location' }} />
              </Typography>
            </Tooltip>
          );
        }

        if (key === 'contractorName') {
          return (
            <Tooltip title={t('tooltips.viewContractor')}>
              <Typography
                variant="body1"
                className="text-sm font-semibold sm:text-base"
                color="textPrimary"
                sx={{
                  display: 'inline-block',
                  cursor: construction?.location ? 'pointer' : 'default',
                  ':hover': { textDecoration: 'underline' },
                }}
                onClick={() =>
                  handleNavigateToContractor(construction.contractorId ?? '')
                }
              >
                {String(value)}
              </Typography>
            </Tooltip>
          );
        }

        if (
          (key === 'startDate' || key === 'endDate') &&
          value instanceof Date
        ) {
          return (
            <Typography
              variant="body1"
              className="text-sm font-semibold sm:text-base"
            >
              {dayjs(value).format('L')}
            </Typography>
          );
        }

        return (
          <Typography
            variant="body1"
            className="text-sm font-semibold sm:text-base"
          >
            {String(value)}
          </Typography>
        );
      }
    },
    [handleNavigateToContractor, t]
  );

  if (!construction) return null;

  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      })}
      className="rounded-lg p-2 md:p-4 lg:p-6"
    >
      <Grid container spacing={{ xs: 2, lg: 3 }} columns={12} sx={{}}>
        <Grid size={{ xs: 12, lg: 6 }} sx={{ flexGrow: 1 }}>
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
                        '&:last-child': {
                          borderBottom: 'none',
                        },
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
                          className="text-sm font-medium text-gray-500"
                        >
                          {label}:
                        </Typography>
                      </TableCell>

                      <TableCell
                        align="right"
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
                        {renderInfoCell(
                          construction,
                          key,
                          construction[key as keyof Construction]
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Note
              content={construction?.note ?? ''}
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
          alignContent={'flex-start'}
        >
          <Grid
            size={12}
            className="overflow-hidden rounded-lg"
            sx={(theme) => ({
              alignSelf: 'flex-start',
              border: `1px solid ${theme.palette.divider}`,
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
                    <Stack direction={'row'} alignItems={'center'} spacing={1}>
                      <PeopleIcon sx={{ color: 'accent.superDark' }} />
                      <Typography variant="subtitle2" fontWeight="600">
                        {t('show.activeEmployees', {
                          count: activeScheduleEmployees?.length || 0,
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
                {activeScheduleEmployees &&
                activeScheduleEmployees.length > 0 ? (
                  activeScheduleEmployees.map((employee) => {
                    return (
                      <TableRow
                        key={employee.id}
                        onClick={() => handleNavigateToEmployee(employee.id)}
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
                          <Stack
                            direction={'row'}
                            alignItems={'center'}
                            spacing={1}
                          >
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              className="font-medium"
                            >
                              {employee.name}
                            </Typography>
                            {employee.isContractor && (
                              <Chip
                                label={t('show.contractorChip')}
                                size="small"
                              />
                            )}
                          </Stack>
                        </td>
                      </TableRow>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-3">
                      <Typography variant="body2" color="textSecondary">
                        {t('show.noEmployees')}
                      </Typography>
                    </td>
                  </tr>
                )}
              </TableBody>
            </table>
          </Grid>

          <Grid
            size={12}
            className="overflow-hidden rounded-lg"
            sx={(theme) => ({
              alignSelf: 'flex-start',
              border: `1px solid ${theme.palette.divider}`,
            })}
          >
            <EventsListTable type="construction" events={upcomingEvents} />
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};
