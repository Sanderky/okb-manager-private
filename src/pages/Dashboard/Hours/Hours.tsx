import React, { useRef, useState } from 'react';
import { Button, Box, Typography, Divider, Stack } from '@mui/material';
import HoursTable from './HoursTable';
import { Add, Print, Summarize } from '@mui/icons-material';
import { PrintReportDialog } from './HoursTableDialogs';
import type { ConstructionsWithWorkHours } from './useHoursTable';
import { useReactToPrint } from 'react-to-print';
import { MultiTablePrintReport } from './PrintReport';
import usePrintShortcut from '../../../hooks/usePrintShortcut';
import PageContainer from '../../../components/PageContainer';

export interface TableData {
  weekStart: Date;
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  weekDates: Date[];
  totalHoursData: { dailyTotals: number[]; grandTotal: number };
}

const Hours: React.FC = () => {
  const [comparisionTables, setComparisionTables] = useState<number[]>([]);
  const [tablesData, setTablesData] = useState<{ [key: string]: TableData }>(
    {}
  );

  const printContentRef = useRef<HTMLDivElement>(null);

  const handleDeleteTable = (keyToDelete: number) => {
    setComparisionTables((prev) => prev.filter((key) => key !== keyToDelete));
    setTablesData((prev) => {
      const newData = { ...prev };
      delete newData[`comparison-${keyToDelete}`];
      return newData;
    });
  };
  const [printReportDialogOpen, setPrintReportDialogOpen] = useState(false);

  const handleTableDataUpdate = (tableId: string, data: TableData) => {
    setTablesData((prev) => ({
      ...prev,
      [tableId]: data,
    }));
  };

  const handleAddComparisonTable = () => {
    const newKey =
      comparisionTables.length > 0 ? Math.max(...comparisionTables) + 1 : 1;
    setComparisionTables((prev) => [...prev, newKey]);
  };

  const reactToPrintFn = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: `Ewidencja_godzin_pracy`,
    pageStyle: `
    @page {
      margin: 10mm;
    }`,
  });

  usePrintShortcut(reactToPrintFn);

  return (
    <PageContainer
      breadcrumbs={[{ title: 'Ewidencja godzin pracy' }]}
      actions={[
        <Button
          size="small"
          onClick={reactToPrintFn}
          startIcon={<Print />}
          variant="contained"
          sx={{
            flexGrow: 0,
          }}
        >
          Drukuj
        </Button>,
        <Button
          size="small"
          onClick={() => setPrintReportDialogOpen(true)}
          startIcon={<Summarize />}
          variant="contained"
          sx={{ flexGrow: 0, whiteSpace: 'nowrap' }}
        >
          Generuj raport
        </Button>,
      ]}
    >
      <Stack direction="column" spacing={6}>
        <HoursTable
          readOnly={false}
          onTableDataUpdate={(data) => handleTableDataUpdate('main', data)}
          tableId="main"
        />

        {comparisionTables.map((key, index) => (
          <Box key={index}>
            <Typography
              variant="h5"
              component={'div'}
              mb={1}
              sx={{ fontSize: '1.2rem' }}
            >
              Tabela porównawcza {index + 1}
            </Typography>

            <HoursTable
              onTableDelete={() => handleDeleteTable(key)}
              onTableDataUpdate={(data) =>
                handleTableDataUpdate(`comparison-${key}`, data)
              }
              tableId={`comparison-${key}`}
            />
          </Box>
        ))}
      </Stack>

      <Divider sx={{ mt: 5, mb: 5 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={handleAddComparisonTable}
        >
          Dodaj tabelkę porównawczą
        </Button>
      </Divider>

      <PrintReportDialog
        open={printReportDialogOpen}
        onClose={() => setPrintReportDialogOpen(false)}
      />

      <Box sx={{ display: 'none' }}>
        <MultiTablePrintReport tablesData={tablesData} ref={printContentRef} />
      </Box>
    </PageContainer>
  );
};

export default Hours;
