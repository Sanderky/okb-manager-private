// import React from 'react';
// import {
//   TableRow,
//   TableCell,
//   Typography,
//   Tooltip,
//   useTheme,
//   useMediaQuery,
//   CircularProgress,
// } from '@mui/material';
// import { Dayjs } from 'dayjs';
// import type { Employee } from '../../../types';
// import type { ICell } from './ScheduleHelpers';

// interface EmployeeRowProps {
//   employee: Employee;
//   weeks: Dayjs[];
//   onCellClick: (e: React.MouseEvent<HTMLElement>, cell: ICell) => void;
//   cellText: (cell: ICell) => React.ReactNode;
//   activeTable: { type: number; week: Dayjs };
//   loading?: boolean;
// }

// interface ScheduleCellProps {
//   cell: ICell;
//   onClick: (e: React.MouseEvent<HTMLElement>, cell: ICell) => void;
//   cellText: (cell: ICell) => React.ReactNode;
//   loading?: boolean;
// }

// // Komponent ScheduleCell
// const ScheduleCell: React.FC<ScheduleCellProps> = React.memo(
//   ({ cell, onClick, cellText, loading = false }) => (
//     <TableCell
//       sx={{
//         cursor: loading ? 'default' : 'pointer',
//         transition: '0.3s',
//         padding: '6px 12px',
//         textAlign: 'center',
//         position: 'relative',
//       }}
//       className="hover:bg-lightBlue border-l border-l-gray-300"
//       onClick={(e) => {
//         if (loading) {
//           e.stopPropagation();
//           return;
//         }
//         onClick(e, cell);
//       }}
//     >
//       {loading ? <CircularProgress size={16} /> : cellText(cell)}
//     </TableCell>
//   )
// );

// // Główny komponent EmployeeRow
// export const EmployeeRow: React.FC<EmployeeRowProps> = React.memo(
//   ({
//     employee,
//     weeks,
//     onCellClick,
//     cellText,
//     activeTable,
//     loading = false,
//   }) => {
//     const theme = useTheme();
//     const isXs = useMediaQuery(theme.breakpoints.only('xs'));

//     if (activeTable.type === 1) {
//       return (
//         <TableRow
//           sx={{
//             '&:last-child td, &:last-child th': {
//               borderBottom: '0 !important',
//             },
//           }}
//         >
//           <TableCell
//             sx={{
//               position: 'sticky',
//               left: 0,
//               zIndex: 3,
//               backgroundColor: '#f6faff',
//               padding: '6px 12px',
//               textAlign: 'center',
//             }}
//           >
//             <Tooltip
//               arrow
//               placement="top"
//               title={employee.name}
//               slotProps={{
//                 popper: {
//                   modifiers: [
//                     {
//                       name: 'offset',
//                       options: {
//                         offset: [0, -5],
//                       },
//                     },
//                   ],
//                 },
//               }}
//             >
//               <Typography
//                 sx={{
//                   fontSize: {
//                     xs: '0.75rem',
//                     md: '0.85rem',
//                   },
//                   fontWeight: 600,
//                 }}
//                 noWrap
//               >
//                 {employee.name}
//               </Typography>
//             </Tooltip>
//           </TableCell>

//           {Array.from({ length: 7 }).map((_, i) => {
//             const day = activeTable.week.add(i, 'day');
//             const cell: ICell = {
//               empId: employee.id,
//               weekKey: activeTable.week.format('YYYY-MM-DD'),
//               date: day,
//               isWeek: false,
//             };

//             return (
//               <ScheduleCell
//                 key={i}
//                 cell={cell}
//                 onClick={onCellClick}
//                 cellText={cellText}
//                 loading={loading}
//               />
//             );
//           })}
//         </TableRow>
//       );
//     }

//     return (
//       <TableRow
//         sx={{
//           '&:last-child td, &:last-child th': { borderBottom: '0 !important' },
//         }}
//       >
//         <TableCell
//           sx={{
//             position: 'sticky',
//             left: 0,
//             zIndex: 3,
//             backgroundColor: '#f6faff',
//             padding: '6px 12px',
//             textAlign: 'center',
//           }}
//         >
//           <Typography noWrap sx={{ fontWeight: 600 }} variant="body2">
//             {employee.name}
//           </Typography>
//         </TableCell>

//         {weeks.map((week, i) => {
//           const cell: ICell = {
//             empId: employee.id,
//             weekKey: week.format('YYYY-MM-DD'),
//             date: week,
//             isWeek: true,
//           };

//           if (isXs && i > 0) {
//             return null;
//           }

//           return (
//             <ScheduleCell
//               key={week.format('YYYY-MM-DD')}
//               cell={cell}
//               onClick={onCellClick}
//               cellText={cellText}
//               loading={loading}
//             />
//           );
//         })}
//       </TableRow>
//     );
//   }
// );

import React from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { Dayjs } from 'dayjs';
import type { Employee } from '../../../types';
import type { ICell } from './ScheduleHelpers';

interface EmployeeRowProps {
  employee: Employee;
  weeks: Dayjs[];
  onCellClick: (e: React.MouseEvent<HTMLElement>, cell: ICell) => void;
  cellText: (cell: ICell) => React.ReactNode;
  activeTable: { type: number; week: Dayjs };
  loadingCells: Set<string>;
  getCellKey: (cell: ICell) => string;
  onCellChange: (
    empId: string,
    date: Dayjs,
    value: any,
    isWeek: boolean,
    cell: ICell
  ) => Promise<void>;
}

interface ScheduleCellProps {
  cell: ICell;
  onClick: (e: React.MouseEvent<HTMLElement>, cell: ICell) => void;
  cellText: (cell: ICell) => React.ReactNode;
  loadingCells: Set<string>;
  getCellKey: (cell: ICell) => string;
}

// Komponent ScheduleCell
const ScheduleCell: React.FC<ScheduleCellProps> = React.memo(
  ({ cell, onClick, cellText, loadingCells, getCellKey }) => {
    const cellKey = getCellKey(cell);
    const isLoading = loadingCells.has(cellKey);

    return (
      <TableCell
        sx={{
          cursor: isLoading ? 'default' : 'pointer',
          transition: '0.3s',
          padding: '6px 12px',
          textAlign: 'center',
          position: 'relative',
        }}
        className="hover:bg-lightBlue border-l border-l-gray-300"
        onClick={(e) => {
          if (isLoading) {
            e.stopPropagation();
            return;
          }
          onClick(e, cell);
        }}
      >
        {isLoading ? <CircularProgress size={16} /> : cellText(cell)}
      </TableCell>
    );
  }
);

// Główny komponent EmployeeRow
export const EmployeeRow: React.FC<EmployeeRowProps> = React.memo(
  ({
    employee,
    weeks,
    onCellClick,
    cellText,
    activeTable,
    loadingCells,
    getCellKey,
    onCellChange,
  }) => {
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.only('xs'));

    if (activeTable.type === 1) {
      return (
        <TableRow
          sx={{
            '&:last-child td, &:last-child th': {
              borderBottom: '0 !important',
            },
          }}
        >
          <TableCell
            sx={{
              position: 'sticky',
              left: 0,
              zIndex: 3,
              // backgroundColor: '#f6faff',
              padding: '6px 12px',
              textAlign: 'center',
            }}
            className="bg-gray-100"
          >
            <Tooltip
              arrow
              placement="top"
              title={employee.name}
              slotProps={{
                popper: {
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [0, -5],
                      },
                    },
                  ],
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: '0.75rem',
                    md: '0.85rem',
                  },
                  fontWeight: 600,
                }}
                noWrap
              >
                {employee.name}
              </Typography>
            </Tooltip>
          </TableCell>

          {Array.from({ length: 7 }).map((_, i) => {
            const day = activeTable.week.add(i, 'day');
            const cell: ICell = {
              empId: employee.id,
              weekKey: activeTable.week.format('YYYY-MM-DD'),
              date: day,
              isWeek: false,
            };

            return (
              <ScheduleCell
                key={i}
                cell={cell}
                onClick={onCellClick}
                cellText={cellText}
                loadingCells={loadingCells}
                getCellKey={getCellKey}
              />
            );
          })}
        </TableRow>
      );
    }

    return (
      <TableRow
        sx={{
          '&:last-child td, &:last-child th': { borderBottom: '0 !important' },
        }}
      >
        <TableCell
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 3,
            // backgroundColor: '#f6faff',
            padding: '6px 12px',
            textAlign: 'center',
          }}
          className="bg-gray-100"
        >
          <Typography noWrap sx={{ fontWeight: 600 }} variant="body2">
            {employee.name}
          </Typography>
        </TableCell>

        {weeks.map((week, i) => {
          const cell: ICell = {
            empId: employee.id,
            weekKey: week.format('YYYY-MM-DD'),
            date: week,
            isWeek: true,
          };

          if (isXs && i > 0) {
            return null;
          }

          return (
            <ScheduleCell
              key={week.format('YYYY-MM-DD')}
              cell={cell}
              onClick={onCellClick}
              cellText={cellText}
              loadingCells={loadingCells}
              getCellKey={getCellKey}
            />
          );
        })}
      </TableRow>
    );
  }
);
