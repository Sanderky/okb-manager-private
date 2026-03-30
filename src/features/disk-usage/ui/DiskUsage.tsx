import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useDiskUsage } from '../model/useDiskUsage';
import { CircularProgressWithLabel } from './CircualProgressWithLabel';

export const DiskUsage = () => {
  
  const {percentage, error, used, total, isLoading} = useDiskUsage();
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
            {error && (
              <Typography color="error" variant="caption">
                {percentage > 100
                  ? 'Nieprawidłowy zakres. Zużycie jest większe niż limit'
                  : 'Wystąpił błąd podczas pobierania danych'}
              </Typography>
            )}
            {!error && !isLoading && (
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
          {!error && !isLoading && (
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
