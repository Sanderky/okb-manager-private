import React, { useMemo, useRef, useEffect } from 'react';
import { Box, Typography, Stack, Tooltip, alpha, Link } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';

import type { Employee } from '../../../types';
import { openGoogleMaps } from '../../../utils';
import { getEmployeeLabel } from '../utils';
import type { ExtendedLodging } from '../types';
import type { Construction } from '../../../entities/constructions';

interface LodgingTimelineProps {
  lodgings: ExtendedLodging[];
  onEdit: (l: ExtendedLodging) => void;
  employees: Employee[];
  sites: Construction[];
  handleClickOnConstruction: (id: string | undefined) => void;
}

const CELL_WIDTH = 40;
const HEADER_HEIGHT = 60;
const SITE_COL_WIDTH = 200;

const BAR_HEIGHT = 36;
const BAR_GAP = 6;
const ROW_PADDING = 12;
const MIN_ROW_HEIGHT = 60;

const calculateLanes = (lodgings: ExtendedLodging[]) => {
  if (!lodgings.length) return { items: [], maxLanes: 0 };

  const sorted = [...lodgings].sort(
    (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
  );

  const lanesEndDates: number[] = [];

  const itemsWithLanes = sorted.map((item) => {
    const itemStart = dayjs(item.startDate).valueOf();
    const itemEnd = dayjs(item.endDate).valueOf();

    let laneIndex = -1;

    for (let i = 0; i < lanesEndDates.length; i++) {
      if (itemStart > lanesEndDates[i]) {
        laneIndex = i;
        break;
      }
    }

    if (laneIndex === -1) {
      laneIndex = lanesEndDates.length;
      lanesEndDates.push(itemEnd);
    } else {
      lanesEndDates[laneIndex] = Math.max(lanesEndDates[laneIndex], itemEnd);
    }

    return { ...item, lane: laneIndex };
  });

  return { items: itemsWithLanes, maxLanes: lanesEndDates.length };
};

const LodgingTimeline: React.FC<LodgingTimelineProps> = ({
  lodgings,
  onEdit,
  employees,
  sites,
  handleClickOnConstruction,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { minDate, totalDays } = useMemo(() => {
    if (lodgings.length === 0) {
      const start = dayjs().startOf('month');
      const end = dayjs().endOf('month');
      return {
        minDate: start,
        maxDate: end,
        totalDays: end.diff(start, 'day') + 1,
      };
    }
    const sorted = [...lodgings].sort(
      (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
    );
    const min = dayjs(sorted[0].startDate).subtract(5, 'day');
    let max = sorted.reduce(
      (acc, curr) =>
        dayjs(curr.endDate).isAfter(acc) ? dayjs(curr.endDate) : acc,
      dayjs(sorted[0].endDate)
    );
    max = max.add(10, 'day');
    return { minDate: min, maxDate: max, totalDays: max.diff(min, 'day') + 1 };
  }, [lodgings]);

  const daysArray = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => minDate.add(i, 'day')),
    [minDate, totalDays]
  );

  const rows = useMemo(() => {
    const relevantSites = sites.filter(
      (s) => s.status || lodgings.some((l) => l.constructionSiteId === s.id)
    );

    relevantSites.sort((a, b) => {
      if (a.status === b.status) return a.name.localeCompare(b.name);
      return a.status ? -1 : 1;
    });

    const siteRows = relevantSites.map((site) => {
      const siteLodgings = lodgings.filter(
        (l) => l.constructionSiteId === site.id
      );
      const { items, maxLanes } = calculateLanes(siteLodgings);

      const linesCount = Math.max(1, maxLanes);
      const rowHeight =
        linesCount * (BAR_HEIGHT + BAR_GAP) + ROW_PADDING * 2 - BAR_GAP;

      return {
        site,
        lodgings: items,
        height: Math.max(MIN_ROW_HEIGHT, rowHeight),
      };
    });

    const orphans = lodgings.filter((l) => !l.constructionSiteId);
    if (orphans.length > 0) {
      const orphanSite: any = {
        id: 'orphan',
        name: 'Brak przypisania',
        location: null,
        status: true,
      };
      const { items, maxLanes } = calculateLanes(orphans);
      const linesCount = Math.max(1, maxLanes);
      const rowHeight =
        linesCount * (BAR_HEIGHT + BAR_GAP) + ROW_PADDING * 2 - BAR_GAP;

      siteRows.push({
        site: orphanSite,
        lodgings: items,
        height: Math.max(MIN_ROW_HEIGHT, rowHeight),
      });
    }
    return siteRows;
  }, [sites, lodgings]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayDiff = dayjs().diff(minDate, 'day');
      if (todayDiff > 0)
        scrollContainerRef.current.scrollLeft = (todayDiff - 2) * CELL_WIDTH;
    }
  }, [minDate]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      <Box
        ref={scrollContainerRef}
        sx={{ overflow: 'auto', flex: 1, position: 'relative' }}
      >
        <Box sx={{ minWidth: 'fit-content' }}>
          <Box
            sx={{
              display: 'flex',
              height: HEADER_HEIGHT,
              position: 'sticky',
              top: 0,
              zIndex: 30,
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                width: SITE_COL_WIDTH,
                minWidth: SITE_COL_WIDTH,
                position: { xs: 'static', sm: 'sticky' },
                left: 0,
                zIndex: 40,
                bgcolor: 'schedule.accent',
                borderRight: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                px: 2,
              }}
            >
              <Typography
                variant="caption"
                fontWeight="bold"
                color="textSecondary"
              >
                BUDOWA
              </Typography>
            </Box>

            {daysArray.map((day, index) => {
              const isWeekend = day.day() === 0 || day.day() === 6;
              const isToday = day.isSame(dayjs(), 'day');
              const isFirstOfMonth = day.date() === 1;
              const isLastOfMonth = day.date() === day.daysInMonth();
              return (
                <Box
                  key={day.toString()}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box
                    sx={{
                      height: '20px',
                      position: 'relative',
                      borderBottom: 1,
                      borderRight:
                        isLastOfMonth || index === daysArray.length - 1 ? 1 : 0,
                      borderRightColor: isLastOfMonth
                        ? 'text.primary'
                        : 'divider',
                      borderBottomColor: 'divider',
                    }}
                  >
                    {(isFirstOfMonth || index === 0) && (
                      <Typography
                        variant="caption"
                        sx={{
                          zIndex: 10,
                          position: 'absolute',
                          top: 0,
                          left: 4,
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {day.format('MMMM')}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={(theme) => ({
                      width: CELL_WIDTH,
                      minWidth: CELL_WIDTH,
                      borderRight: 1,
                      borderRightColor: isLastOfMonth
                        ? 'text.primary'
                        : 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: isToday
                        ? theme.palette.schedule.current
                        : isWeekend
                          ? theme.palette.background.default
                          : theme.palette.background.paper,
                      flex: 1,
                    })}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={isToday ? 'bold' : 'normal'}
                      color={isToday ? 'textPrimary' : 'textSecondary'}
                    >
                      {day.format('DD')}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ fontSize: '0.65rem' }}
                    >
                      {day.format('dd')}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                paddingLeft: `${SITE_COL_WIDTH}px`,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              {daysArray.map((day) => {
                const isWeekend = day.day() === 0 || day.day() === 6;
                const isToday = day.isSame(dayjs(), 'day');
                const isLastOfMonth = day.date() === day.daysInMonth();

                return (
                  <Box
                    key={'bg-' + day.toString()}
                    sx={(theme) => ({
                      width: CELL_WIDTH,
                      minWidth: CELL_WIDTH,
                      borderRight: 1,
                      borderRightColor: isLastOfMonth
                        ? 'text.primary'
                        : 'divider',
                      bgcolor: isToday
                        ? alpha(theme.palette.schedule.current, 0.5)
                        : isWeekend
                          ? theme.palette.background.default
                          : theme.palette.background.paper,
                    })}
                  />
                );
              })}
            </Box>
            <Box
              sx={{
                backgroundColor: 'background.paper',
              }}
            >
              {rows.map((row) => (
                <Box
                  key={row.site.id}
                  sx={(theme) => ({
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    height: row.height,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.tableHover, 0.5),
                    },
                    '&:hover .lodgings-timeline-construction': {
                      bgcolor: theme.palette.tableHover,
                    },
                  })}
                >
                  <Box
                    className="lodgings-timeline-construction"
                    sx={{
                      width: SITE_COL_WIDTH,
                      minWidth: SITE_COL_WIDTH,
                      position: { xs: 'static', sm: 'sticky' },
                      left: 0,
                      zIndex: 20,
                      bgcolor: 'background.paper',
                      borderRight: 1,
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      px: 2,
                    }}
                  >
                    <Stack spacing={0}>
                      <Typography
                        variant="subtitle2"
                        noWrap
                        title={row.site.name}
                        onClick={() => handleClickOnConstruction(row.site.id)}
                        sx={{
                          color:
                            row.site.id === 'orphan'
                              ? 'text.secondary'
                              : row.site.status
                                ? 'text.primary'
                                : 'text.disabled',
                          textDecoration: row.site.status
                            ? 'none'
                            : 'line-through',
                          fontStyle:
                            row.site.id === 'orphan' ? 'italic' : 'normal',
                          ':hover': {
                            textDecoration: 'underline',
                            cursor: 'pointer',
                          },
                        }}
                      >
                        {row.site.name}
                      </Typography>
                      {row.site.location && (
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          noWrap
                        >
                          {row.site.location}
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  <Box sx={{ flex: 1, position: 'relative' }}>
                    {row.lodgings.map((lodging) => {
                      const startDiff = dayjs(lodging.startDate).diff(
                        minDate,
                        'day'
                      );
                      const duration =
                        dayjs(lodging.endDate).diff(
                          dayjs(lodging.startDate),
                          'day'
                        ) + 1;
                      const isActive = dayjs().isBetween(
                        lodging.startDate,
                        lodging.endDate,
                        'day',
                        '[]'
                      );

                      const topPosition =
                        ROW_PADDING + lodging.lane * (BAR_HEIGHT + BAR_GAP);

                      const assignedEmployees = employees.filter((e) =>
                        lodging.employeeIds.includes(e.id)
                      );

                      return (
                        <Tooltip
                          key={lodging.id}
                          title={
                            <Box sx={{ p: 0.5 }}>
                              <Typography
                                variant="caption"
                                display="block"
                                sx={{ mb: 1 }}
                              >{`${dayjs(lodging.startDate).format('DD.MM')} - ${dayjs(lodging.endDate).format('DD.MM.YYYY')}`}</Typography>

                              {lodging.description && (
                                <Typography
                                  display="block"
                                  sx={{ mb: 1 }}
                                  variant="caption"
                                  gutterBottom
                                >
                                  {lodging.description}
                                </Typography>
                              )}

                              {lodging.address && (
                                <Link
                                  sx={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    textDecoration: 'none',
                                    mb: 1,
                                    alignItems: 'center',
                                  }}
                                  onClick={() =>
                                    openGoogleMaps(lodging.address)
                                  }
                                >
                                  <LocationOn
                                    fontSize="small"
                                    sx={{
                                      color: 'location',
                                      fontSize: '0.8rem',
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      color: 'location',
                                      fontSize: '0.8rem',
                                      ':hover': { textDecoration: 'underline' },
                                    }}
                                  >
                                    {lodging.address}
                                  </Typography>
                                </Link>
                              )}

                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                display="block"
                                gutterBottom
                              >
                                Zakwaterowani ({assignedEmployees.length}):
                              </Typography>
                              <Stack spacing={0.5}>
                                {assignedEmployees.map((emp) => (
                                  <Typography
                                    key={emp.id}
                                    variant="caption"
                                    display="block"
                                  >
                                    •{' '}
                                    {getEmployeeLabel(
                                      emp.name,
                                      lodging,
                                      emp.id
                                    )}
                                  </Typography>
                                ))}
                              </Stack>
                            </Box>
                          }
                        >
                          <Box
                            onClick={() => onEdit(lodging)}
                            sx={{
                              position: 'absolute',
                              left: startDiff * CELL_WIDTH,
                              width: Math.max(
                                duration * CELL_WIDTH,
                                CELL_WIDTH
                              ),
                              top: topPosition,
                              height: BAR_HEIGHT,
                              bgcolor: isActive ? 'primary.main' : 'grey.500',
                              borderRadius: 1,
                              cursor: 'pointer',
                              px: 1,
                              display: 'flex',
                              alignItems: 'center',
                              zIndex: 10,
                              transition: '0.2s',
                              '&:hover': {
                                zIndex: 15,
                                bgcolor: isActive ? 'primary.dark' : 'grey.700',
                              },
                            }}
                          >
                            {lodging.name && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#fff',
                                  fontWeight: 500,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {lodging.name}
                              </Typography>
                            )}
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LodgingTimeline;
