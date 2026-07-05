import { Box } from '@mui/material';
import HoursTableControlsMobile from './table-controls/TableControlsMobile';
import HoursTableControlsDesktop from './table-controls/TableControlsDesktop';
import { useTranslation } from 'react-i18next';
import type { LangCode } from '@/shared/config/languages';
import type { TableData } from '../../../model/types';
import { useGenerateWorkLogsPdf } from '@/features/work-logs/model/services/useGenerateWorkLogsPdf';

export interface HoursTableControlsViewProps {
  isLoading: boolean;
  currentWeek: Date;
  handleWeekChange: (target: 'prev' | 'current' | 'next' | Date) => void;
  handleToggleEditMode: (editMode?: boolean | undefined) => void;
  readOnly: boolean;
  handleCopyDataDialogOpen: () => void;
  handleToggleExpand: () => void;
  editMode: boolean;
  isExpanded: boolean;
  isCoping: boolean;
  onTableDelete?: () => void;
  showFilterBadge: boolean;
  handleCancelEdit: () => Promise<void>;
  handleFillWithSchedule: () => Promise<void>;
  setIsFilterOpen: (val: boolean) => void;
  hasUnsavedChanges: boolean;
  isEmpty: boolean;
  onPrint: () => Promise<void>;
}

export interface HoursTableControlsProps extends Omit<
  HoursTableControlsViewProps,
  'onPrint'
> {
  containerWidth: number;
  tableDataPayload: TableData | null;
}

const HoursTableControls = (props: HoursTableControlsProps) => {
  const { i18n } = useTranslation();
  const { generatePdf, isGenerating } = useGenerateWorkLogsPdf();

  const handlePrint = async () => {
    if (!props.tableDataPayload) return;
    const lang = i18n.language as LangCode;

    await generatePdf({
      weeksData: [props.tableDataPayload],
      lang
    });
  };
  const viewProps: HoursTableControlsViewProps = {
    ...props,
    isLoading: props.isLoading || isGenerating,
    onPrint: handlePrint,
  };

  return (
    <Box>
      {props.containerWidth < 600 ? (
        <HoursTableControlsMobile {...viewProps} />
      ) : (
        <HoursTableControlsDesktop {...viewProps} />
      )}
    </Box>
  );
};

export default HoursTableControls;
