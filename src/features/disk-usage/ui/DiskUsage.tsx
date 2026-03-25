import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
  type CircularProgressProps,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getDiskUsage } from '../api';

const formatToGB = (bytes: number | undefined): number => {
  if (!bytes || bytes === 0) return 0;

  const gb = bytes / Math.pow(1024, 3);

  return Math.ceil(gb);
};

const CircularProgressWithLabel = (
  props: CircularProgressProps & { value: number }
) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        size={'3.5rem'}
        enableTrackSlot
        thickness={5}
        variant="determinate"
        {...props}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          component="div"
          sx={{ color: 'text.secondary' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
};

export const DiskUsage = () => {
  const {
    data: diskUsage,
    isLoading,
    isError: error,
  } = useQuery({
    queryKey: ['disk-usage'],
    queryFn: getDiskUsage,
    staleTime: 60 * 1000 * 15,
  });

  const used = formatToGB(diskUsage?.used);
  const total = formatToGB(diskUsage?.total);
  const percentage = (used / total) * 100;
  const isError = error || percentage > 100;
  const progressColor =
    percentage >= 90 ? (percentage >= 95 ? 'error' : 'warning') : 'primary';

  return (
    <Card
      className="rounded-lg"
      sx={(theme) => ({
        p: 0,
        boxShadow: 0,
        border: `1px solid ${theme.palette.divider}`,
      })}
    >
      <CardContent sx={{ p: 2 }} className="pb-4">
        <Stack
          direction="row"
          alignItems={'center'}
          justifyContent={'space-between'}
          gap={1}
        >
          <Box>
            <Typography variant="body1" className="font-medium">
              Wykorzystanie dysku serwera
            </Typography>
            {isError && (
              <Typography color="error" variant="caption">
                {percentage > 100
                  ? 'Nieprawidłowy zakres. Zużycie jest większe niż limit'
                  : 'Wystąpił błąd podczas pobierania danych'}
              </Typography>
            )}
            {!isError && !isLoading && (
              <Typography color="textSecondary" fontSize={'1.5rem'}>
                <Typography
                  fontSize={'1.5rem'}
                  color="textPrimary"
                  component={'span'}
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {used} GB
                </Typography>{' '}
                / {total} GB
              </Typography>
            )}
          </Box>
          {!isError && !isLoading && (
            <CircularProgressWithLabel
              color={progressColor}
              value={percentage}
            />
          )}
          {isLoading && <CircularProgress size={'2rem'} />}
        </Stack>
      </CardContent>
    </Card>
  );
};
