import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import {
  getPreviousWeek,
  getStartOfWeek,
  getWeeksInRange,
} from '@/shared/lib/date';
import { useConstructions, type Construction } from '@/entities/construction';
import { useEmployees, type Employee } from '@/entities/employee';
import type { LangCode } from '@/shared/model/types';
import { useTranslation } from 'react-i18next';

export const usePrintReportDialog = (
  defaultStartWeek?: Date,
  onClose?: () => void
) => {
  const { t } = useTranslation('workLogs');

  const printContentRef = useRef<HTMLDivElement>(null);

  const [startWeek, setStartWeek] = useState<Date>(
    defaultStartWeek ?? getPreviousWeek(new Date())
  );
  const [endWeek, setEndWeek] = useState<Date>(
    defaultStartWeek ?? getStartOfWeek(new Date())
  );

  const [isError, setIsError] = useState<boolean>(false);
  const [reportLoading, setReportLoading] = useState<boolean>(true);
  const [printTitle, setPrintTile] = useState<boolean>(true);
  const [printTablesTitle, setPrintTablesTitle] = useState<boolean>(true);
  const [omitEmpty, setOmitEmpty] = useState<boolean>(false);
  const [showVacation, setShowVacation] = useState<boolean>(true);
  const [lang, setLang] = useState<LangCode>('pl-PL');

  const [selectedConstructionIds, setSelectedConstructionIds] = useState<
    string[]
  >([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [showInactiveEmployees, setShowInactiveEmployees] = useState(false);
  const [showInactiveConstructions, setShowInactiveConstructions] =
    useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const { employees: allEmployees = [] } = useEmployees();
  const { constructions: allConstructions = [] } = useConstructions();

  const selectedConstructions = useMemo(
    () =>
      allConstructions.filter((c) => selectedConstructionIds.includes(c.id)),
    [allConstructions, selectedConstructionIds]
  );

  const selectedEmployees = useMemo(
    () => allEmployees.filter((e) => selectedEmployeeIds.includes(e.id)),
    [allEmployees, selectedEmployeeIds]
  );

  const weeks = getWeeksInRange(startWeek, endWeek);

  useEffect(() => {
    if (defaultStartWeek) {
      setStartWeek(defaultStartWeek);
      setEndWeek(defaultStartWeek);
    }
  }, [defaultStartWeek]);

  useEffect(() => {
    setIsError(startWeek > endWeek);
  }, [startWeek, endWeek]);

  const reset = useCallback(() => {
    setStartWeek(defaultStartWeek ?? getStartOfWeek(new Date()));
    setEndWeek(defaultStartWeek ?? getStartOfWeek(new Date()));
    setPrintTile(true);
    setPrintTablesTitle(true);
    setOmitEmpty(false);
    setShowVacation(true);
    setIsError(false);
    setReportLoading(false);
    setLang('pl-PL');
    setSelectedConstructionIds([]);
    setSelectedEmployeeIds([]);
    setShowInactiveEmployees(false);
    setShowInactiveConstructions(false);
    setIsFilterExpanded(false);
  }, [defaultStartWeek]);

  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  const reactToPrintFn = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: `${t('print.report.fileNamePrefix', { lng: lang })}${dayjs(startWeek).format('DD.MM.YYYY')}_${dayjs(endWeek).add(6, 'days').format('DD.MM.YYYY')}`,
    pageStyle: `@page { margin: 10mm; }`,
  });

  const handleSave = useCallback(() => {
    setTimeout(() => {
      reactToPrintFn();
      handleClose();
    }, 1000);
  }, [reactToPrintFn, handleClose]);

  const handleSelectEmployees = useCallback((employees: Employee[]) => {
    setSelectedEmployeeIds(employees.map((e) => e.id));
  }, []);

  const handleSelectConstructions = useCallback(
    (constructions: Construction[]) => {
      setSelectedConstructionIds(constructions.map((c) => c.id));
    },
    []
  );

  return {
    printContentRef,
    startWeek,
    setStartWeek,
    endWeek,
    setEndWeek,
    isError,
    reportLoading,
    setReportLoading,
    printTitle,
    setPrintTile,
    printTablesTitle,
    setPrintTablesTitle,
    omitEmpty,
    setOmitEmpty,
    showVacation,
    setShowVacation,
    lang,
    setLang,
    selectedConstructionIds,
    selectedEmployeeIds,
    showInactiveEmployees,
    setShowInactiveEmployees,
    showInactiveConstructions,
    setShowInactiveConstructions,
    allEmployees,
    allConstructions,
    selectedConstructions,
    selectedEmployees,
    isFilterExpanded,
    setIsFilterExpanded,
    weeks,
    handleClose,
    handleSave,
    handleSelectEmployees,
    handleSelectConstructions,
  };
};
