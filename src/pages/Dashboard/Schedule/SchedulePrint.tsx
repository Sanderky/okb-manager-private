import { type JSX } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import type { Employee } from '../../../types';
import type { ICell } from './ScheduleHelpers';

interface PrintableScheduleProps {
  activeTable: {
    type: number;
    week?: dayjs.Dayjs;
  };
  weeks: dayjs.Dayjs[];
  filteredEmployees: Employee[];
  //   cellText: (employee: Employee, date: dayjs.Dayjs) => string;
  cellText: (cell: ICell, renderEmptyCellIndicator?: boolean) => JSX.Element;
}

const WEEK_DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sb', 'Nd'];

export const PrintableSchedule = ({
  activeTable,
  weeks,
  filteredEmployees,
  cellText,
}: PrintableScheduleProps) => {
  return (
    <Box sx={{ backgroundColor: 'white', color: 'black' }}>
      {activeTable.type === 0 ? (
        <TableContainer component={Box}>
          <Table
            sx={{
              tableLayout: 'fixed',
              width: '100%',
            //   width: 'fit-content',
              border: '1px solid black',
              '& .MuiTableCell-root': {
                border: '1px solid black',
                padding: '4px 8px',
                backgroundColor: 'white !important',
                color: 'black !important',
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    // width: '20%',
                    width: '120px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  Pracownik
                </TableCell>
                {weeks.map((week, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
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
                  <TableCell>
                    <Typography
                      sx={{
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      {employee.name}
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
                      <TableCell
                        key={weekIndex}
                        sx={{
                          textAlign: 'center',
                          '& p': {
                            color: '#000 !important'
                          }
                        }}
                      >
                        {cellText(cellData, false)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Box}>
          <Table
            sx={{
              tableLayout: 'fixed',
              width: '100%',
            //   width: 'fit-content',
              border: '1px solid black',
              '& .MuiTableCell-root': {
                border: '1px solid black',
                padding: '4px 8px',
                backgroundColor: 'white !important',
                color: 'black !important',
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    // width: '150px',
                    width: '120px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  Pracownik
                </TableCell>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = activeTable.week?.add(dayIndex, 'day');
                  return (
                    <TableCell
                      key={dayIndex}
                      sx={{
                        fontWeight: 'bold',
                        textAlign: 'center',
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
                        {day?.format('DD.MM')}
                      </Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Typography
                      sx={{
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      {employee.name}
                    </Typography>
                  </TableCell>
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const day = activeTable.week?.add(dayIndex, 'day');
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
                          textAlign: 'center',
                          '& p': {
                            color: '#000 !important'
                          }
                        }}
                      >
                        {day ? cellText(cellData, false) : ''}
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
