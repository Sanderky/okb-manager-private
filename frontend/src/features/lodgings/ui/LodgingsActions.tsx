import {
  Button,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Add, GridView, ViewTimeline, DeleteSweep } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import type { ViewMode } from '../model/types';
import {
  getOutdatedCount,
  useCleanOutdatedLodgings,
} from '../model/services/useCleanOutdatedLodgings';
import { useLodgingsContext } from '../model/providers/LodgingsContext';

export const LodgingsActions = () => {
  const { t } = useTranslation(['lodgings', 'common']);
  const { lodgings, openAdd, setViewMode, viewMode } = useLodgingsContext();

  const notifications = useNotifications();
  const dialogs = useDialogs();
  const cleanOutdatedMutation = useCleanOutdatedLodgings();

  const handleCleanOutdated = async () => {
    const outdatedCount = getOutdatedCount(lodgings);
    if (outdatedCount <= 0) {
      notifications.show(t('lodgings:notifications.cleanEmpty'), {
        severity: 'info',
      });
      return;
    }

    const confirmed = await dialogs.confirm(
      t('lodgings:dialogs.cleanOutdated.description', { count: outdatedCount }),
      {
        okText: t('lodgings:dialogs.cleanOutdated.ok'),
        cancelText: t('common:buttons.cancel'),
        title: t('lodgings:dialogs.cleanOutdated.title'),
        severity: 'error',
      }
    );

    if (confirmed) {
      await cleanOutdatedMutation.mutateAsync();
      notifications.show(
        t('lodgings:notifications.cleanSuccess', { count: outdatedCount }),
        { severity: 'success' }
      );
    }
  };

  const handleChangeViewMode = (
    _: React.MouseEvent<HTMLElement>,
    newMode: ViewMode
  ) => {
    if (newMode) setViewMode(newMode);
  };

  return [
    <ToggleButtonGroup
      key="view"
      value={viewMode}
      exclusive
      onChange={handleChangeViewMode}
      size="small"
      aria-label="widok"
    >
      <Tooltip title={t('lodgings:actions.gridTooltip')}>
        <ToggleButton
          value="grid"
          aria-label="siatka"
          size="small"
          sx={{ p: 0.5 }}
        >
          <GridView fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title={t('lodgings:actions.timelineTooltip')}>
        <ToggleButton value="timeline" aria-label="oś czasu" sx={{ p: 0.5 }}>
          <ViewTimeline fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>,

    <Button
      variant="contained"
      startIcon={<Add />}
      onClick={openAdd}
      size="small"
      key="new"
    >
      {t('lodgings:actions.addLodging')}
    </Button>,
    <Button
      key="clean"
      variant="outlined"
      color="error"
      startIcon={<DeleteSweep />}
      onClick={handleCleanOutdated}
      size="small"
    >
      {t('lodgings:actions.cleanOld')}
    </Button>,
  ];
};
