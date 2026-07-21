import { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';
import type { LangCode } from '@/shared/config/i18n/languages';
import { WorkLogPdfDocument } from '../../ui/report/WorkLogPdfDocument';
import type { TableData } from '../types';

interface GeneratePdfOptions {
  weeksData: TableData[];
  lang: LangCode;
  title?: string;
  subtitle?: string;
  showVacation?: boolean;
  omitEmpty?: boolean;
  printTitle?: boolean;
  printTablesTitle?: boolean;
  onSuccess?: () => void;
  onError?: () => void;
}

export const useGenerateWorkLogsPdf = () => {
  const { t } = useTranslation(['workLogs']);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(
    async ({
      weeksData,
      lang,
      title,
      subtitle,
      showVacation = true,
      omitEmpty = false,
      printTitle = false,
      printTablesTitle = true,
      onSuccess,
      onError,
    }: GeneratePdfOptions) => {
      try {
        setIsGenerating(true);

        const newWindow = window.open('', '_blank');
        if (!newWindow) throw new Error('Pop-up blocked');

        const labels = {
          title,
          subtitle,
          weekTitle: t('workLogs:print.report.week', { lng: lang }),
          construction: t('workLogs:print.report.construction', { lng: lang }),
          employee: t('workLogs:print.report.employee', { lng: lang }),
          sum: t('workLogs:print.report.sum', { lng: lang }),
          vacation: t('workLogs:print.report.vacation', { lng: lang }),
          noData: t('workLogs:print.report.noData', { lng: lang }),
          constructionsCount: (count: number) =>
            t('workLogs:print.report.constructionsCount', { count, lng: lang }),
          employeesCount: (count: number) =>
            t('workLogs:print.report.employeesCount', { count, lng: lang }),
          totalSum: t('workLogs:print.report.totalSum', { lng: lang }),
        };

        const blob = await pdf(
          <WorkLogPdfDocument
            weeksData={weeksData}
            lang={lang}
            showVacation={showVacation}
            omitEmpty={omitEmpty}
            printTitle={printTitle}
            printTablesTitle={printTablesTitle}
            labels={labels}
          />
        ).toBlob();

        const pdfUrl = URL.createObjectURL(blob);
        newWindow.location.href = pdfUrl;

        onSuccess?.();
      } catch {
        onError?.();
      } finally {
        setIsGenerating(false);
      }
    },
    [t]
  );

  return { generatePdf, isGenerating };
};