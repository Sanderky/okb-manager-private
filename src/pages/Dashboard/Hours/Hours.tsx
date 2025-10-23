import React, { useEffect, useRef, useState } from 'react';
import { Button, Box, Typography, Divider, Stack, Alert } from '@mui/material';
import HoursTable from './HoursTable';
import { Add, Print, Summarize } from '@mui/icons-material';
import { PrintReportDialog } from './HoursTableDialogs';
import type { ConstructionsWithWorkHours } from './useHoursTable';
import type { Construction } from '../../../types';
import { useReactToPrint } from 'react-to-print';
import { MultiTablePrintReport } from './PrintReport';

const usePrintShortcut = (onPrint: () => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isPrintShortcut =
        (event.ctrlKey || event.metaKey) && event.key === 'p';

      if (isPrintShortcut) {
        event.preventDefault();
        event.stopPropagation();
        onPrint();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onPrint]);
};

export interface TableData {
  weekStart: Date;
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  weekDates: Date[];
  totalHoursData: { dailyTotals: number[]; grandTotal: number };
  selectedConstructions: string[];
  availableConstructions: Construction[];
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

  useEffect(() => {
    console.log('333', tablesData);
  }, [tablesData]);

  const reactToPrintFn = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: `test`,
    pageStyle: `
    @page {
      margin: 10mm;
    }`,
  });

  usePrintShortcut(reactToPrintFn);

  return (
    <Box p={3}>
      <Stack
        mb={3}
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          rowGap: 2,
        }}
      >
        <Typography
          variant="h4"
          className="text-2xl font-medium md:text-3xl"
          sx={{ flexShrink: { xs: 1, sm: 0 } }}
        >
          Ewidencja godzin pracy
        </Typography>
        <Stack
          direction={'row'}
          spacing={2}
          alignItems={'center'}
          justifyContent={'flex-end'}
          flexWrap={'wrap'}
          sx={{ rowGap: 1 }}
        >
          <Button
            onClick={reactToPrintFn}
            startIcon={<Print />}
            variant="contained"
            sx={{
              flexGrow: 0,
            }}
          >
            Drukuj
          </Button>
          <Button
            onClick={() => setPrintReportDialogOpen(true)}
            startIcon={<Summarize />}
            variant="contained"
            sx={{ flexGrow: 0, whiteSpace: 'nowrap' }}
          >
            Generuj raport
          </Button>
        </Stack>
      </Stack>
      <Alert sx={{ mb: 3 }} severity="info">
        Zmiany od razu zapisują się w bazie danych
      </Alert>

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
    </Box>
  );
};

export default Hours;
