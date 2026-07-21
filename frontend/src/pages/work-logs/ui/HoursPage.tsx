import React, { useState, useCallback } from 'react';
import { Button, Box, Typography, Stack } from '@mui/material';
import { Add, Print, Summarize } from '@mui/icons-material';
import PageContainer from '@/shared/ui/PageContainer';
import useContainerBreakpoint from '@/shared/lib/useContainerWidth';
import {
  HoursTable,
  PrintReportDialog,
  useGenerateWorkLogsPdf,
  type TableData,
} from '@/features/work-logs';
import { useTranslation } from 'react-i18next';
import type { LangCode } from '@/shared/config/i18n/languages';
import usePrintShortcut from '@/shared/lib/usePrintShortcut';

export const WorkLogsPage: React.FC = () => {
  const { t, i18n } = useTranslation(['workLogs', 'common']);
  const [containerRef, width] = useContainerBreakpoint();
  const [comparisionTables, setComparisionTables] = useState<number[]>([]);
  const [tablesData, setTablesData] = useState<{ [key: string]: TableData }>(
    {}
  );
  const [printReportDialogOpen, setPrintReportDialogOpen] = useState(false);

  const handleDeleteTable = (keyToDelete: number) => {
    setComparisionTables((prev) => prev.filter((key) => key !== keyToDelete));
    setTablesData((prev) => {
      const newData = { ...prev };
      delete newData[`comparison-${keyToDelete}`];
      return newData;
    });
  };

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

  const { generatePdf, isGenerating } = useGenerateWorkLogsPdf();

  const handlePrintAllVisibleTables = async () => {
    const lang = i18n.language as LangCode;
    const weeksDataArray = Object.values(tablesData).filter(Boolean);

    await generatePdf({
      weeksData: weeksDataArray,
      lang,
      printTablesTitle: true,
    });
  };
  usePrintShortcut(handlePrintAllVisibleTables);

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
          onClick={handlePrintAllVisibleTables}
          disabled={isGenerating}
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
      <Box ref={containerRef} sx={{ direction: 'flex', flex: 1 }}>
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
                  sx={{ fontSize: '1rem' }}
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
      </Box>
    </PageContainer>
  );
};
