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
import { getDiskUsage } from '../../../services/metrics';

const formatToGB = (bytes: number | undefined, showPostfix = true): string => {
  if (!bytes || bytes === 0) return showPostfix ? '0 GB' : '0';

  const gb = bytes / Math.pow(1024, 3);

  return `${gb.toFixed(0)}${showPostfix ? ' GB' : ''}`;
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

const DiskUsage = () => {
  const {
    data: diskUsage,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['disk-usage'],
    queryFn: getDiskUsage,
    staleTime: 60 * 1000 * 15
  });

  const rounded = Number(
    ((diskUsage?.used ?? 0) / Math.pow(1024, 3)).toFixed(0)
  );
  const progressColor =
    rounded >= 90 ? (rounded >= 95 ? 'error' : 'warning') : 'primary';

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
            {isError && <Typography color="error" variant='caption'>Wystąpił błąd podczas pobierania danych</Typography>}
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
                  {formatToGB(diskUsage?.used)}
                </Typography>{' '}
                / {formatToGB(diskUsage?.total)}
              </Typography>
            )}
          </Box>
          {!isError && !isLoading && (
            <CircularProgressWithLabel color={progressColor} value={rounded} />
          )}
            {isLoading && <CircularProgress size={'2rem'}/>}

        </Stack>
      </CardContent>
    </Card>
  );
};

export default DiskUsage;
