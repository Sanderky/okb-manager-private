import { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  getPreviousWeek,
  getStartOfWeek,
  getWeeksInRange,
} from '@/shared/lib/date';
import { useConstructions, type Construction } from '@/entities/construction';
import { useEmployees, type Employee } from '@/entities/employee';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LANG, type LangCode } from '@/shared/config/languages';
import { useWeekReport } from './useWeekReportData';
import { useGenerateWorkLogsPdf } from './useGenerateWorkLogsPdf';

export const usePrintReportDialog = (
  defaultStartWeek?: Date,
  onClose?: () => void
) => {
  const { t } = useTranslation('workLogs');

  const [startWeek, setStartWeek] = useState<Date>(
    defaultStartWeek ?? getPreviousWeek(new Date())
  );
  const [endWeek, setEndWeek] = useState<Date>(
    defaultStartWeek ?? getStartOfWeek(new Date())
  );

  const [isError, setIsError] = useState<boolean>(false);
  const [printTitle, setPrintTile] = useState<boolean>(true);
  const [printTablesTitle, setPrintTablesTitle] = useState<boolean>(true);
  const [omitEmpty, setOmitEmpty] = useState<boolean>(false);
  const [showVacation, setShowVacation] = useState<boolean>(true);
  const [lang, setLang] = useState<LangCode>(DEFAULT_LANG);

  const [selectedConstructionIds, setSelectedConstructionIds] = useState<
    string[]
  >([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [showInactiveEmployees, setShowInactiveEmployees] = useState(false);
  const [showInactiveConstructions, setShowInactiveConstructions] =
    useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const { generatePdf, isGenerating } = useGenerateWorkLogsPdf();
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

  const weeks = useMemo(
    () => getWeeksInRange(startWeek, endWeek),
    [startWeek, endWeek]
  );

  const {
    weeksData,
    isLoading: isDataLoading,
    error: dataError,
  } = useWeekReport({
    weekStarts: weeks,
    selectedConstructionIds,
    selectedEmployeeIds,
  });

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

  const handleSave = useCallback(async () => {
    if (isDataLoading || dataError || isError) return;

    await generatePdf({
      weeksData,
      lang,
      title: t('print.report.title', { lng: lang }),
      subtitle: `${t('print.report.subtitle', { lng: lang })}: ${dayjs(startWeek).format('DD.MM.YYYY')} - ${dayjs(endWeek).add(6, 'days').format('DD.MM.YYYY')} (${t('print.report.weeksCount', { count: weeks.length, lng: lang })})`,
      showVacation,
      omitEmpty,
      printTitle,
      printTablesTitle,
      onSuccess: handleClose,
      onError: () => setIsError(true),
    });
  }, [
    isDataLoading,
    dataError,
    isError,
    weeksData,
    lang,
    showVacation,
    omitEmpty,
    printTitle,
    printTablesTitle,
    startWeek,
    endWeek,
    weeks.length,
    t,
    handleClose,
    generatePdf,
  ]);

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
    startWeek,
    setStartWeek,
    endWeek,
    setEndWeek,
    isError,
    reportLoading: isGenerating,
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
    isDataLoading,
  };
};
