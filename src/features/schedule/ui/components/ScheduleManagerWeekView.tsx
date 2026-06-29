import {
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from '@mui/material';
import { EmployeeRow } from './ScheduleEmployeeRow';
import dayjs, { Dayjs } from 'dayjs';
import type { CellDisplayItem, ICell } from '../../model/types';
import type { Employee } from '@/entities/employee';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { WEEK_DAYS } from '@/shared/config/days';
import { useTranslation } from 'react-i18next';

export interface ScheduleManagerWeekViewProps {
  weeks: Dayjs[];
  filteredEmployees: Employee[];
  activeTable: { type: number; week: Dayjs };
  setActiveTable: React.Dispatch<
    React.SetStateAction<{ type: number; week: Dayjs }>
  >;
  loadingCells: Set<string>;
  isLoading: boolean;
  handleShowInputConstruction: (
    event: React.MouseEvent<HTMLElement>,
    cell: ICell
  ) => void;
  getCellContentItems: (cell: ICell) => CellDisplayItem[];
  getCellKey: (cell: ICell) => string;
  handleOnEmployeeClick: (id: string) => void;
}

export const ScheduleManagerWeekView: React.FC<
  ScheduleManagerWeekViewProps
> = ({
  weeks,
  filteredEmployees,
  activeTable,
  setActiveTable,
  loadingCells,
  isLoading,
  handleShowInputConstruction,
  getCellContentItems,
  getCellKey,
  handleOnEmployeeClick,
}) => {
  const { t } = useTranslation(['schedule']);

  return (
    <TableContainer
      component={Box}
      sx={(theme) => ({
        flex: 1,
        overflow: 'auto',
        width: '100%',
        background: theme.palette.background.default,
      })}
    >
      <Table stickyHeader sx={{ tableLayout: 'fixed', minWidth: 800 }}>
        <TableHead>
          <TableRow>
            <TableCell
              sx={(theme) => ({
                position: 'sticky',
                left: 0,
                zIndex: 4,
                width: { xs: '150px', sm: '200px' },
                background: theme.palette.schedule.accent,
              })}
              className="cursor-pointer px-3 py-2 text-center"
              onClick={() => setActiveTable((p) => ({ ...p, type: 0 }))}
            >
              <KeyboardReturnIcon />
            </TableCell>
            {Array.from({ length: 7 }).map((_, i) => {
              const day = activeTable.week.add(i, 'day');
              const isToday = day.isSame(dayjs(), 'day');
              return (
                <TableCell
                  key={i}
                  sx={(theme) => ({
                    width: '150px',
                    background: isToday
                      ? theme.palette.schedule.current
                      : theme.palette.background.default,
                    borderLeft: `1px solid ${theme.palette.divider}`,
                  })}
                  className={`px-3 py-2`}
                >
                  <Typography
                    className="block text-center font-semibold"
                    variant="caption"
                  >
                    {WEEK_DAYS[i]}
                  </Typography>
                  <Typography
                    className="text-center font-semibold"
                    variant="body2"
                  >
                    {day.format('DD.MM')}
                  </Typography>
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredEmployees.map((emp, index) => (
            <EmployeeRow
              onEmployeeClick={handleOnEmployeeClick}
              key={emp.id}
              employee={emp}
              weeks={weeks}
              onCellClick={handleShowInputConstruction}
              getCellContentItems={getCellContentItems}
              activeTable={activeTable}
              loadingCells={loadingCells}
              getCellKey={getCellKey}
              index={index}
            />
          ))}
          {filteredEmployees.length === 0 && !isLoading && (
            <TableRow>
              <TableCell colSpan={8} sx={{ border: 'none' }}>
                <Typography color="textSecondary" align="center">
                  {t('schedule:table.noEmployees')}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
