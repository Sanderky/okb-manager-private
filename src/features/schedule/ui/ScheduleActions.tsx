import { useRef } from 'react';
import { Button } from '@mui/material';
import { Print } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';
import { PrintableSchedule } from './components/SchedulePrint';
import { useScheduleContext } from '../model/providers/useScheduleContext';

export const ScheduleActions = () => {
  const { t } = useTranslation(['schedule']);
  const {
    isLoading,
    activeTable,
    weeks,
    filteredEmployees,
    getCellContentItems,
  } = useScheduleContext();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: t('schedule:printTitle'),
  });

  return (
    <>
      <Button
        size="small"
        onClick={handlePrint}
        variant="contained"
        startIcon={<Print />}
        disabled={isLoading}
      >
        {t('schedule:actions.print')}
      </Button>
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <PrintableSchedule
            activeTable={activeTable}
            weeks={weeks}
            filteredEmployees={filteredEmployees}
            getCellContentItems={getCellContentItems}
          />
        </div>
      </div>
    </>
  );
};
