import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useScheduleContext } from '../model/providers/useScheduleContext';

export const ScheduleBottomToolbar = () => {
  const { t } = useTranslation(['schedule']);
  const {
    activeTable,
    selectedEmployees,
    employeesCount,
    filteredEmployees,
    weeks,
    fromWeek,
    toWeek,
  } = useScheduleContext();

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
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent={'space-between'}
        alignItems={'center'}
        className="px-3"
        columnGap={2}
        rowGap={0.5}
        py={1}
        sx={{
          height: '100%',
        }}
      >
        {activeTable.type === 0 ? (
          <>
            <Stack
              direction={'row'}
              spacing={2}
              alignItems={'center'}
              flexWrap={'wrap'}
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
                sx={{
                  lineHeight: 1,
                }}
              >
                {t('schedule:bottomToolbar.employees')}{' '}
                {selectedEmployees.length > 0
                  ? `${selectedEmployees.length} / ${employeesCount}`
                  : filteredEmployees.length}
              </Typography>
              <Typography
                variant="overline"
                color="textSecondary"
                className="font-medium"
                sx={{
                  lineHeight: 1,
                }}
              >
                {t('schedule:bottomToolbar.weeks', { count: weeks.length })}
              </Typography>
            </Stack>
            <Typography
              variant="overline"
              color="textSecondary"
              className="font-medium"
              sx={{
                lineHeight: 1,
              }}
            >
              <Typography
                component={'span'}
                variant="inherit"
                sx={{
                  lineHeight: 1,
                }}
              >
                {t('schedule:bottomToolbar.range')}{' '}
              </Typography>
              {dayjs(fromWeek).format('DD.MM.YYYY')} -{' '}
              {dayjs(toWeek).add(6, 'day').format('DD.MM.YYYY')}
            </Typography>
          </>
        ) : (
          <>
            <Stack
              direction={'row'}
              spacing={2}
              alignItems={'center'}
              divider={
                <Box
                  sx={(theme) => ({
                    borderRight: `1px solid ${theme.palette.divider}`,
                    height: '15px',
                  })}
                />
              }
              flexWrap={'wrap'}
            >
              <Typography
                variant="overline"
                color="textSecondary"
                className="font-medium"
                sx={{
                  lineHeight: 1,
                }}
              >
                {t('schedule:bottomToolbar.employees')}{' '}
                {selectedEmployees.length > 0
                  ? `${selectedEmployees.length} / ${employeesCount}`
                  : filteredEmployees.length}
              </Typography>
              <Typography
                variant="overline"
                color="textSecondary"
                className="font-medium"
                sx={{
                  lineHeight: 1,
                }}
              >
                {t('schedule:bottomToolbar.weeks', { count: 1 })}
              </Typography>
            </Stack>
            <Typography
              variant="overline"
              color="textSecondary"
              className="font-medium"
              sx={{
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              {activeTable.week.format('DD.MM.YYYY')} -{' '}
              {activeTable.week.add(6, 'day').format('DD.MM.YYYY')}
            </Typography>
          </>
        )}
      </Stack>
    </Box>
  );
};
