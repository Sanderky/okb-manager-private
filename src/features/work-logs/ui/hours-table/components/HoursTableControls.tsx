import React from 'react';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { useReactToPrint } from 'react-to-print';
import HoursTableControlsMobile from './table-controls/TableControlsMobile';
import HoursTableControlsDesktop from './table-controls/TableControlsDesktop';
import { useTranslation } from 'react-i18next';

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
  onPrint: () => void;
}

export interface HoursTableControlsProps extends Omit<
  HoursTableControlsViewProps,
  'onPrint'
> {
  containerWidth: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const HoursTableControls = (props: HoursTableControlsProps) => {
  const { t } = useTranslation('workLogs');

  const reactToPrintFn = useReactToPrint({
    contentRef: props.contentRef,
    documentTitle: `${t('print.documentTitlePrefix')}_${dayjs(props.currentWeek).format('DD.MM.YYYY')}_${dayjs(props.currentWeek).add(6, 'days').format('DD.MM.YYYY')}`,
    pageStyle: `@page { margin: 10mm; }`,
  });

  const viewProps: HoursTableControlsViewProps = {
    ...props,
    onPrint: reactToPrintFn,
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
