import {
  Button,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Add, GridView, ViewTimeline, DeleteSweep } from '@mui/icons-material';
import 'dayjs/locale/pl';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import type { Lodging, ViewMode } from '../model/types';
import {
  getOutdatedCount,
  useCleanOutdatedLodgings,
} from '../model/useCleanOutdatedLodgings';

interface Props {
  viewMode: ViewMode;
  lodgings: Lodging[];
  onOpenAdd: () => void;
  onSetViewMode: (mode: ViewMode) => void;
}

export const LodgingsActions = ({
  viewMode,
  lodgings,
  onOpenAdd,
  onSetViewMode,
}: Props) => {
  const notifications = useNotifications();
  const dialogs = useDialogs();
  const cleanOutdatedMutation = useCleanOutdatedLodgings();

  const handleCleanOutdated = async () => {
    const outdatedCount = getOutdatedCount(lodgings);
    if (outdatedCount <= 0) {
      notifications.show('Brak przedawnionych noclegów do usunięcia', {
        severity: 'info',
      });
      return;
    }

    const confirmed = await dialogs.confirm(
      `Znaleziono ${outdatedCount} zakończonych noclegów. Czy chcesz je trwale usunąć?`,
      {
        okText: 'Usuń wszystko',
        cancelText: 'Anuluj',
        title: 'Czyszczenie zakończonych noclegów',
        severity: 'error',
      }
    );

    if (confirmed) {
      await cleanOutdatedMutation.mutateAsync();
      notifications.show(`Usunięto ${outdatedCount} przedawnionych noclegów`, {
        severity: 'success',
      });
    }
  };

  const handleChangeViewMode = (
    _: React.MouseEvent<HTMLElement>,
    newMode: ViewMode
  ) => {
    if (newMode) onSetViewMode(newMode);
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
      <Tooltip title="Widok siatki">
        <ToggleButton
          value="grid"
          aria-label="siatka"
          size="small"
          sx={{ p: 0.5 }}
        >
          <GridView fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Widok osi czasu">
        <ToggleButton value="timeline" aria-label="oś czasu" sx={{ p: 0.5 }}>
          <ViewTimeline fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>,

    <Button
      variant="contained"
      startIcon={<Add />}
      onClick={onOpenAdd}
      size="small"
      key="new"
    >
      Dodaj nocleg
    </Button>,
    <Button
      key="clean"
      variant="outlined"
      color="error"
      startIcon={<DeleteSweep />}
      onClick={handleCleanOutdated}
      size="small"
    >
      Usuń stare
    </Button>,
  ];
};
