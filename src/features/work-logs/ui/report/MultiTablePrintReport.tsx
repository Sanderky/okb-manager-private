import { forwardRef } from 'react';
import { Box } from '@mui/material';
import type { TableData } from '../../model/types';
import { PrintableTable } from './components/PrintableTable';

export const MultiTablePrintReport = forwardRef<
  HTMLDivElement,
  { tablesData: { [key: string]: TableData | null } }
>(({ tablesData }, ref) => {
  return (
    <Box ref={ref} sx={{ backgroundColor: 'white' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {Object.entries(tablesData).map(([tableId, tableData], index) => {
          if (!tableData) return null;

          return (
            <Box
              key={tableId}
              sx={{
                mb: 4,
                pageBreakBefore: index > 0 ? 'always' : 'auto',
                breakBefore: index > 0 ? 'page' : 'auto',
              }}
            >
              <PrintableTable
                constructionsWithWorkHours={
                  tableData.constructionsWithWorkHours
                }
                weekDates={tableData.weekDates}
                totalHoursData={tableData.totalHoursData}
                showVacation={true}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});
