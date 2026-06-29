import React, { useRef, useState, useCallback } from 'react';
import { Button, Box, Typography, Stack } from '@mui/material';
import { Add, Print, Summarize } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import usePrintShortcut from '@/shared/lib/usePrintShortcut';
import PageContainer from '@/shared/ui/PageContainer';
import useContainerBreakpoint from '@/shared/lib/useContainerWidth';
import {
  HoursTable,
  MultiTablePrintReport,
  PrintReportDialog,
  type TableData,
} from '@/features/work-logs';
import { useTranslation } from 'react-i18next';

export const WorkLogsPage: React.FC = () => {
  const { t } = useTranslation(['workLogs', 'common']);

  const [containerRef, width] = useContainerBreakpoint();

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

  const handleTableDataUpdate = useCallback(
    (tableId: string, newData: TableData) => {
      setTablesData((prev) => {
        const prevData = prev[tableId];
        if (prevData && JSON.stringify(prevData) === JSON.stringify(newData)) {
          return prev;
        }

        return {
          ...prev,
          [tableId]: newData,
        };
      });
    },
    []
  );

  const handleAddComparisonTable = () => {
    const newKey =
      comparisionTables.length > 0 ? Math.max(...comparisionTables) + 1 : 1;
    setComparisionTables((prev) => [...prev, newKey]);
  };

  const reactToPrintFn = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: t('print.multiTableFileName'),
    pageStyle: `
    @page {
      margin: 10mm;
    }`,
  });

  usePrintShortcut(reactToPrintFn);

  return (
    <PageContainer
      breadcrumbs={[{ title: t('pageTitle') }]}
      actions={[
        <Button
          variant="contained"
          key="add-comparision"
          size="small"
          startIcon={<Add />}
          onClick={handleAddComparisonTable}
        >
          {t('actions.addComparison')}
        </Button>,
        <Button
          key="print"
          size="small"
          onClick={() => reactToPrintFn()}
          startIcon={<Print />}
          variant="contained"
          sx={{ flexGrow: 0 }}
        >
          {t('common:buttons.print')}
        </Button>,
        <Button
          size="small"
          key="report"
          onClick={() => setPrintReportDialogOpen(true)}
          startIcon={<Summarize />}
          variant="contained"
          sx={{ flexGrow: 0, whiteSpace: 'nowrap' }}
        >
          {t('actions.generateReport')}
        </Button>,
      ]}
    >
      <Box
        ref={containerRef}
        sx={{
          direction: 'flex',
          flex: 1,
        }}
      >
        <Stack direction="column">
          <HoursTable
            containerWidth={width}
            readOnly={false}
            tableId="main"
            onTableDataUpdate={(data) => handleTableDataUpdate('main', data)}
          />

          {comparisionTables.map((key) => (
            <Box key={key}>
              <Box
                sx={(theme) => ({
                  pt: 2,
                  px: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                })}
              >
                <Typography
                  variant="h5"
                  component={'div'}
                  mb={1}
                  sx={{
                    fontSize: '1rem',
                  }}
                >
                  {t('table.comparisonTitle', { key })}
                </Typography>
              </Box>

              <HoursTable
                containerWidth={width}
                onTableDelete={() => handleDeleteTable(key)}
                onTableDataUpdate={(data) =>
                  handleTableDataUpdate(`comparison-${key}`, data)
                }
                tableId={`comparison-${key}`}
              />
            </Box>
          ))}
        </Stack>

        <PrintReportDialog
          open={printReportDialogOpen}
          onClose={() => setPrintReportDialogOpen(false)}
          defaultStartWeek={tablesData['main']?.weekStart}
        />

        <Box sx={{ display: 'none' }}>
          <MultiTablePrintReport
            tablesData={tablesData}
            ref={printContentRef}
          />
        </Box>
      </Box>
    </PageContainer>
  );
};
