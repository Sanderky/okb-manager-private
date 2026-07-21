import {
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Stack,
  useTheme,
} from '@mui/material';
import { EmployeeRow } from './ScheduleEmployeeRow';
import dayjs, { Dayjs } from 'dayjs';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import type { Employee } from '@/entities/employee';
import type { CellDisplayItem, ICell } from '../../model/types';
import { useTranslation } from 'react-i18next';

export interface ScheduleManagerMultiWeekViewProps {
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

export const ScheduleManagerMultiWeekView: React.FC<
  ScheduleManagerMultiWeekViewProps
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
  const theme = useTheme();
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
      <Table
        stickyHeader
        sx={{
          tableLayout: 'fixed',
          minWidth: {
            xs: `${50 + (50 / 1) * weeks.length}%`,
            sm: `${30 + (70 / 2) * weeks.length}%`,
            md: `${25 + (75 / 3) * weeks.length}%`,
            lg: `${15 + (85 / 4) * weeks.length}%`,
            xl: `${15 + (85 / 7) * weeks.length}%`,
          },
        }}
      >
        <TableHead sx={{ position: 'sticky', left: 0, zIndex: 4, top: 0 }}>
          <TableRow>
            <TableCell
              sx={(theme) => ({
                position: { xs: 'static', sm: 'sticky' },
                left: 0,
                zIndex: 4,
                // width: { xs: '150px', sm: '200px' },
                background: theme.palette.schedule.accent,
                width: {
                  xs: '50%',
                  sm: '30%',
                  md: '25%',
                  lg: '15%',
                },
              })}
              className="px-3 py-2 text-center"
            ></TableCell>
            {weeks.map((w, index) => {
              const isBefore = w.isBefore(dayjs(), 'isoWeek');
              const isAfter = w.isAfter(dayjs(), 'isoWeek');
              return (
                <TableCell
                  key={index}
                  sx={(theme) => ({
                    background: isBefore
                      ? theme.palette.schedule.past
                      : isAfter
                        ? theme.palette.background.default
                        : theme.palette.schedule.current,
                    borderLeft: `1px solid ${theme.palette.divider}`,
                    width: {
                      xs: `${50 / Math.min(weeks.length, 1)}%`,
                      sm: `${70 / Math.min(weeks.length, 2)}%`,
                      md: `${75 / Math.min(weeks.length, 3)}%`,
                      lg: `${85 / Math.min(weeks.length, 4)}%`,
                      xl: `${85 / Math.min(weeks.length, 7)}%`,
                    },
                  })}
                  className={`group relative cursor-pointer px-3 py-2`}
                  onClick={() => setActiveTable({ type: 1, week: w })}
                >
                  <Typography
                    className="block text-center font-semibold"
                    variant="caption"
                    color="textDisabled"
                  >
                    [{w.week()}]
                  </Typography>
                  <Typography
                    className="text-center font-semibold"
                    variant="body2"
                  >
                    {w.format('DD.MM')} - {w.add(6, 'day').format('DD.MM')}
                  </Typography>
                  <UnfoldMoreIcon
                    sx={{
                      fontSize: '1rem',
                      fontWeight: '300',
                      position: 'absolute',
                      top: '50%',
                      right: 10,
                      transform: 'translateY(-50%) rotate(90deg)',
                      opacity: 0,
                      transition: '0.3s',
                      '.group:hover &': { opacity: 1 },
                    }}
                  />
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredEmployees.map((emp, index) => (
            <EmployeeRow
              key={emp.id}
              employee={emp}
              weeks={weeks}
              onCellClick={handleShowInputConstruction}
              getCellContentItems={getCellContentItems}
              activeTable={activeTable}
              loadingCells={loadingCells}
              getCellKey={getCellKey}
              index={index}
              onEmployeeClick={handleOnEmployeeClick}
            />
          ))}
          {filteredEmployees.length === 0 && !isLoading && (
            <TableRow>
              <TableCell
                colSpan={weeks.length + 1}
                sx={{ border: 'none', p: 0 }}
              >
                <Stack
                  direction={'column'}
                  justifyContent={'center'}
                  alignItems={'center'}
                  sx={{
                    py: 5,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography
                    variant="body1"
                    align="center"
                    className="px-4 font-normal"
                    color="textSecondary"
                  >
                    {t('schedule:table.noEmployees')}
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
