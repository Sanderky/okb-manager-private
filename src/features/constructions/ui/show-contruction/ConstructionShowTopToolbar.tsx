import Stack from '@mui/material/Stack';
import EditIcon from '@mui/icons-material/Edit';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import { alpha, IconButton, Tab, Tabs, Tooltip } from '@mui/material';

export interface ConstructionShowTopToolbarProps {
  handleTabChange: (
    _: React.SyntheticEvent<Element, Event>,
    newValue: number
  ) => void;
  tab: number;
  handleNavigateToConstructionEdit: () => void;
  handleOpenResumeConstructionDialogOpen: () => void;
  handleOpenFinishConstructionDialogOpen: () => void;
  isInProgress: boolean;
}

export const ConstructionShowTopToolbar = ({
  isInProgress,
  tab,
  handleTabChange,
  handleNavigateToConstructionEdit,
  handleOpenResumeConstructionDialogOpen,
  handleOpenFinishConstructionDialogOpen,
}: ConstructionShowTopToolbarProps) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={(theme) => ({
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        pr: 2,
      })}
    >
      <Tabs value={tab} onChange={handleTabChange}>
        <Tab
          label="Informacje"
          sx={{
            fontSize: { xs: '0.8rem', sm: '.85rem' },
            padding: 2,
            minWidth: 0,
          }}
        />
        <Tab
          label="Pliki"
          sx={{
            fontSize: { xs: '0.8rem', sm: '.85rem' },
            padding: 2,
            minWidth: { xs: 0, sm: 100 },
          }}
        />
      </Tabs>
      <Stack
        direction="row"
        justifyContent="flex-end"
        flexGrow={1}
        spacing={{ xs: 1.5, sm: 3 }}
        sx={{ pl: 1 }}
      >
        <Tooltip title="Edytuj budowę">
          <IconButton
            onClick={handleNavigateToConstructionEdit}
            color="primary"
            className="rounded-full border"
            size="small"
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        {isInProgress ? (
          <Tooltip title="Zakończ budowę">
            <IconButton
              onClick={handleOpenFinishConstructionDialogOpen}
              color="warning"
              size="small"
              sx={(theme) => ({
                border: `1px solid ${theme.palette.warning.main}`,
                background: alpha(theme.palette.warning.main, 0.1),
              })}
              className="rounded-full"
            >
              <EventAvailableIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Wznów budowę">
            <IconButton
              onClick={handleOpenResumeConstructionDialogOpen}
              color="success"
              size="small"
              className="rounded-full"
              sx={(theme) => ({
                border: `1px solid ${theme.palette.success.main}`,
                background: alpha(theme.palette.success.main, 0.1),
              })}
            >
              <EventRepeatIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  );
};
