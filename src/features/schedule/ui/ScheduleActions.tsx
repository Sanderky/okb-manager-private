import { useRef } from 'react';
import { Button } from '@mui/material';
import { Print } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { PrintableSchedule } from './components/SchedulePrint';
import { useScheduleContext } from '../model/providers/useScheduleContext';

export const ScheduleActions = () => {
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
    documentTitle: 'Harmonogram',
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
        Drukuj
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
