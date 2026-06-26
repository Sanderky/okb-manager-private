import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Typography,
  Stack,
  Paper,
} from '@mui/material';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { Employee } from '@/entities/employee';
import type { CellDisplayItem, ICell } from '../../model/types';
import { WEEK_DAYS } from '@/shared/config/days';
import { ScheduleCellContent } from './ScheduleCellContent';

interface PrintableScheduleProps {
  activeTable: {
    type: number;
    week?: dayjs.Dayjs;
  };
  weeks: dayjs.Dayjs[];
  filteredEmployees: Employee[];
  getCellContentItems: (cell: ICell) => CellDisplayItem[];
}

export const PrintableSchedule = ({
  activeTable,
  weeks,
  filteredEmployees,
  getCellContentItems,
}: PrintableScheduleProps) => {
  const { t } = useTranslation(['schedule']);

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h6" gutterBottom align="center">
        {t('schedule:print.title')}
      </Typography>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>{t('schedule:print.view')}</strong>{' '}
          {activeTable.type === 0
            ? t('schedule:print.viewMonthly')
            : t('schedule:print.viewWeekly')}
        </Typography>
        <Typography variant="body2">
          <strong>{t('schedule:print.employeeCount')}</strong>{' '}
          {filteredEmployees.length}
        </Typography>
        <Typography variant="body2">
          <strong>{t('schedule:print.generatedAt')}</strong>{' '}
          {dayjs().format('DD.MM.YYYY HH:mm')}
        </Typography>
      </Stack>

      {activeTable.type === 0 ? (
        <TableContainer
          component={Paper}
          sx={{
            border: '1px solid #000',
            '& .MuiTableCell-root': {
              border: '1px solid #666',
              padding: '4px',
              color: 'black',
              textAlign: 'center',
              verticalAlign: 'middle',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
            },
            '& .MuiTypography-root': {
              fontSize: '0.75rem !important',
            },
          }}
        >
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '150px' }}>
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {t('schedule:print.employee')}
                  </Typography>
                </TableCell>
                {weeks.map((week, index) => (
                  <TableCell key={index}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {week.format('DD.MM')} -{' '}
                      {week.add(6, 'day').format('DD.MM')}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell sx={{ backgroundColor: '#f9f9f9' }}>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {employee.name}
                      {!employee.status && (
                        <Typography
                          component={'span'}
                          variant="inherit"
                          className="ml-1"
                          color="error"
                        >
                          {t('schedule:print.inactive')}
                        </Typography>
                      )}
                    </Typography>
                  </TableCell>
                  {weeks.map((week, weekIndex) => {
                    const cellData: ICell = {
                      empId: employee.id,
                      weekKey: week.format('YYYY-MM-DD'),
                      date: week,
                      isWeek: true,
                    };
                    return (
                      <TableCell key={weekIndex}>
                        <Box
                          sx={{
                            minHeight: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ScheduleCellContent
                            items={getCellContentItems(cellData)}
                            isWeek={true}
                          />
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            border: '1px solid #000',
            '& .MuiTableCell-root': {
              border: '1px solid #666',
              padding: '4px',
              color: 'black',
              textAlign: 'center',
              verticalAlign: 'middle',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
            },
            '& .MuiTypography-root': {
              fontSize: '0.75rem !important',
            },
          }}
        >
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '150px' }}>
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {t('schedule:print.employee')}
                  </Typography>
                </TableCell>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = activeTable.week?.add(dayIndex, 'day');
                  const isWeekend = dayIndex >= 5;
                  return (
                    <TableCell
                      key={dayIndex}
                      sx={{
                        backgroundColor: isWeekend ? '#e8e8e8' : '#f5f5f5',
                      }}
                    >
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {WEEK_DAYS[dayIndex]}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {day?.format('DD.MM.YYYY')}
                      </Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell sx={{ backgroundColor: '#f9f9f9' }}>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {employee.name}
                      {!employee.status && (
                        <Typography
                          component={'span'}
                          variant="inherit"
                          className="ml-1"
                          color="error"
                        >
                          {t('schedule:print.inactive')}
                        </Typography>
                      )}
                    </Typography>
                  </TableCell>
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const day = activeTable.week?.add(dayIndex, 'day');
                    const isWeekend = dayIndex >= 5;
                    const cellData: ICell = {
                      empId: employee.id,
                      weekKey: day?.format('YYYY-MM-DD') || '',
                      date: day || dayjs(),
                      isWeek: false,
                    };
                    return (
                      <TableCell
                        key={dayIndex}
                        sx={{
                          backgroundColor: isWeekend ? '#f0f0f0' : 'white',
                        }}
                      >
                        <Box
                          sx={{
                            minHeight: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {day ? (
                            <ScheduleCellContent
                              items={getCellContentItems(cellData)}
                              isWeek={false}
                            />
                          ) : null}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
