import {
  Card,
  Typography,
  Stack,
  Box,
  CardContent,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Construction } from '@mui/icons-material';
import PeopleIcon from '@mui/icons-material/People';

interface EmployeesCardProps {
  handleEmployeesClick: () => void;
  isLoading: boolean;
  employeeStats:
    | {
        total: number;
        active: number;
      }
    | undefined;
}

export const EmployeesCard = ({
  handleEmployeesClick,
  isLoading,
  employeeStats,
}: EmployeesCardProps) => {
  return (
    <Card
      onClick={handleEmployeesClick}
      className="rounded-lg hover:shadow-sm"
      sx={(theme) => ({
        boxShadow: 0,
        border: `1px solid ${theme.palette.divider}`,
        cursor: 'pointer',
      })}
    >
      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <CardContent className="p-4">
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent={'space-between'}
            >
              <Box>
                <Typography variant="body1" color="textSecondary">
                  Pracownicy
                </Typography>
                <Typography variant="h4">
                  {employeeStats?.active || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PeopleIcon />
              </Avatar>
            </Stack>
          </CardContent>
          <Divider />
          <Box className="px-4 py-2">
            <Stack direction={'column'}>
              <Typography variant="overline" color="textSecondary">
                Zarchiwizowani:{' '}
                <Typography component={'span'} color="textPrimary">
                  {Number(employeeStats?.total) -
                    Number(employeeStats?.active) || 0}
                </Typography>
              </Typography>
              <Typography variant="overline" color="textSecondary">
                Wszyscy:{' '}
                <Typography component={'span'} color="textPrimary">
                  {Number(employeeStats?.total) || 0}
                </Typography>
              </Typography>
            </Stack>
          </Box>
        </>
      )}
    </Card>
  );
};

interface ConstructionsCardProps {
  handleConstructionsClick: () => void;
  isLoading: boolean;
  constructionStats:
    | {
        total: number;
        active: number;
      }
    | undefined;
}

export const ConstructionsCard = ({
  handleConstructionsClick,
  isLoading,
  constructionStats,
}: ConstructionsCardProps) => {
  return (
    <Card
      onClick={handleConstructionsClick}
      className="rounded-lg hover:shadow-sm"
      sx={(theme) => ({
        boxShadow: 0,
        border: `1px solid ${theme.palette.divider}`,
        cursor: 'pointer',
      })}
    >
      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <CardContent className="p-4">
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent={'space-between'}
            >
              <Box>
                <Typography variant="body1" color="textSecondary">
                  Aktywne budowy
                </Typography>
                <Typography variant="h4">
                  {constructionStats?.active || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <Construction />
              </Avatar>
            </Stack>
          </CardContent>
          <Divider />
          <Box className="px-4 py-2">
            <Stack direction={'column'}>
              <Typography variant="overline" color="textSecondary">
                Zakończone:{' '}
                <Typography component={'span'} color="textPrimary">
                  {Number(constructionStats?.total) -
                    Number(constructionStats?.active) || 0}
                </Typography>
              </Typography>
              <Typography variant="overline" color="textSecondary">
                Wszystkie:{' '}
                <Typography component={'span'} color="textPrimary">
                  {Number(constructionStats?.total) || 0}
                </Typography>
              </Typography>
            </Stack>
          </Box>
        </>
      )}
    </Card>
  );
};
