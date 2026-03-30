import { Box, Button, Typography, Stack } from '@mui/material';
import { BookmarkOutlined } from '@mui/icons-material';
import 'dayjs/locale/pl';
import { useLodgingsStats } from '../model/useLodgingsStats';
import useNotifications from '@/shared/ui/notifications/useNotifications';

interface Props {
  onSetDefaultView: () => void;
  defaultViewMode: 'grid' | 'timeline';
  viewMode: 'grid' | 'timeline';
}

export const LodgingsBottomToolbar = ({
  onSetDefaultView,
  defaultViewMode,
  viewMode,
}: Props) => {
  const stats = useLodgingsStats();
  const notifications = useNotifications();

  const handleSetDefaultView = () => {
    onSetDefaultView();
    notifications.show('Ustawiono bieżący widok jako domyślny', {
      severity: 'success',
    });
  };

  return (
    <Box
      sx={(theme) => ({
        height: '100%',
        flexShrink: 0,
        background: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Stack
        direction={{ sx: 'column', sm: 'row' }}
        alignItems={'center'}
        className="px-3"
        columnGap={2}
        rowGap={0.5}
        py={1}
        sx={{ height: '100%', color: 'text.secondary' }}
      >
        <Stack
          direction={{ sx: 'column', sm: 'row' }}
          spacing={2}
          alignItems={'center'}
          flexWrap={'wrap'}
          sx={{
            mb: { xs: 1, sm: 0 },
          }}
          divider={
            <Box
              sx={(theme) => ({
                borderRight: `1px solid ${theme.palette.divider}`,
                height: '15px',
              })}
            />
          }
        >
          <Typography
            variant="overline"
            className="font-medium"
            color="textSecondary"
            sx={{ lineHeight: 1 }}
          >
            {`Zakwaterowani dziś: ${stats.accommodatedToday}/${stats.accommodatedTotal} (${stats.totalEmployees})`}
          </Typography>
          <Typography
            variant="overline"
            color="textSecondary"
            className="font-medium"
            sx={{ lineHeight: 1 }}
          >
            {`Noclegi: ${stats.activeLodgingsCount}/${stats.totalLodgings}`}
          </Typography>
        </Stack>

        {defaultViewMode !== viewMode && (
          <Button
            sx={{ ml: { sx: 0, sm: 'auto' }, p: 0.1, px: 0.5 }}
            onClick={handleSetDefaultView}
            variant="outlined"
            size="small"
            color="inherit"
            startIcon={<BookmarkOutlined fontSize="small" />}
          >
            Ustaw jako domyślny
          </Button>
        )}
      </Stack>
    </Box>
  );
};
