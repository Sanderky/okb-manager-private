import {
  Typography,
  Stack,
  Box,
  List,
  ListItem,
  IconButton,
  Chip,
  alpha,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BeachAccess, Done } from '@mui/icons-material';
import dayjs from 'dayjs';
import { getUpcomingVacations } from '../../../api/vacations';
import Loading from '../../../shared/ui/Loading';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useScroll } from '../../../context/ScrollContext';
import { getDateStr } from '../Vacations/VacationsHelpers';

const UpcomingVacation = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: upcomingVacations = [], isLoading } = useQuery({
    queryKey: ['vacations', 'upcoming-vacations'],
    queryFn: () => getUpcomingVacations(),
  });

  const MAX_VISIBLE_ITEMS = 2;
  const hasMoreItems = upcomingVacations.length > MAX_VISIBLE_ITEMS;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const { scrollToTop } = useScroll();

  const handleVacationClick = (vacation: any) => {
    const startMonth = dayjs(vacation.startDate).format('YYYY-MM');
    navigate(`/vacations?month=${startMonth}&vacationId=${vacation.id}`);
    scrollToTop();
  };

  return (
    <Box>
      <Stack
        direction={'row'}
        alignItems={'center'}
        spacing={1}
        sx={{
          mb: 1,
        }}
      >
        <BeachAccess
          sx={{
            color: 'primary.main',
          }}
        />
        <Typography variant="body1" className="font-medium">
          Nadchodzące urlopy
        </Typography>
        {hasMoreItems && (
          <Chip
            label={`${upcomingVacations.length} ${upcomingVacations.length > 4 ? 'urlopów' : 'urlopy'}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        )}
      </Stack>
      {isLoading ? (
        <Stack direction={'row'} spacing={1} className="my-5">
          <Loading size={25} message="" />
        </Stack>
      ) : (
        <Box
          sx={(theme) => ({
            position: 'relative',
            '&:after': {
              content: '""',
              pointerEvents: 'none',
              display: isExpanded && !isLoading ? 'none' : 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 'calc(100% - 34px)',
              boxShadow: hasMoreItems
                ? `inset 0px -25px 10px -15px ${alpha(theme.palette.background.paper, 1)}`
                : 'none',
            },
          })}
        >
          <Box
            sx={{
              maxHeight: isExpanded ? 'none' : 180,
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <List className="mb-2">
              {upcomingVacations.length === 0 ? (
                <Stack direction={'row'} spacing={1}>
                  <Done />
                  <Typography color={'textSecondary'}>
                    Brak nadchodzących urlopów
                  </Typography>
                </Stack>
              ) : (
                upcomingVacations.map((vacation) => (
                  <ListItem
                    key={vacation.groupId}
                    onClick={() => handleVacationClick(vacation)}
                    sx={(theme) => ({
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      alignItems: 'flex-start',
                      mb: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      background: theme.palette.accent.light,
                      ':hover': {
                        background: theme.palette.accent.main,
                      },
                    })}
                    className={`rounded-md last:mb-0`}
                  >
                    <Typography variant="subtitle2">
                      {vacation.employeeName}
                    </Typography>
                    <Typography variant="body2">
                      {getDateStr(vacation.startDate, vacation.endDate, true)}
                    </Typography>
                  </ListItem>
                ))
              )}
            </List>
          </Box>
          {hasMoreItems && (
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <IconButton onClick={toggleExpanded} size="small">
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default UpcomingVacation;
