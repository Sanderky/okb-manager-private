import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  TextField,
  Stack,
  Autocomplete,
  Chip,
  Divider,
  FormControl,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  Link,
} from '@mui/material';
import {
  Add,
  Edit,
  LocationOn,
  DateRange,
  Hotel,
  People,
  GridView,
  ViewTimeline,
  Close,
  PersonAdd,
  DeleteSweep,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { plPL } from '@mui/x-date-pickers/locales';

import PageContainer from '../../../components/PageContainer';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import { getEmployeeList } from '../../../services/employees';
import {
  getLodgings,
  createLodging,
  updateLodging,
  deleteLodging,
  deleteOutdatedLodgings,
} from '../../../services/lodgings';
import { getConstructionList } from '../../../services/constructions';
import type { Lodging, Employee, Construction } from '../../../types';
import Loading from '../../../components/Loading';
import BaseDialog from '../../../components/BaseDialog';
import { openGoogleMaps } from '../../../utils';
import { useNavigate } from 'react-router-dom';

dayjs.extend(isBetween);
dayjs.locale('pl');

type ExtendedLodging = Lodging & {
  constructionSiteId?: string | null;
  assignments?: {
    employeeId: string;
    startDate: string | Date;
    endDate: string | Date;
  }[];
};

interface LocalAssignment {
  employeeId: string;
  startDate: Dayjs;
  endDate: Dayjs;
}

const getEmployeeLabel = (
  employeeName: string,
  lodging: ExtendedLodging,
  employeeId: string
) => {
  const assignment = lodging.assignments?.find(
    (a) => a.employeeId === employeeId
  );

  if (!assignment) return employeeName;

  const lStart = dayjs(lodging.startDate);
  const lEnd = dayjs(lodging.endDate);
  const aStart = dayjs(assignment.startDate);
  const aEnd = dayjs(assignment.endDate);

  const isStartSame = lStart.isSame(aStart, 'day');
  const isEndSame = lEnd.isSame(aEnd, 'day');

  if (isStartSame && isEndSame) {
    return employeeName;
  }

  let dateInfo = '';
  if (!isStartSame && !isEndSame) {
    dateInfo = `${aStart.format('DD.MM')} - ${aEnd.format('DD.MM')}`;
  } else if (!isStartSame) {
    dateInfo = `od ${aStart.format('DD.MM')}`;
  } else if (!isEndSame) {
    dateInfo = `do ${aEnd.format('DD.MM')}`;
  }

  return `${employeeName} | ${dateInfo}`;
};

interface LodgingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onDelete: (id: string) => void;
  initialData?: any;
  loading: boolean;
  allEmployees: Employee[];
  sites: Construction[];
}

const LodgingFormDialog: React.FC<LodgingFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  allEmployees,
  onDelete,
  sites,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().add(1, 'week'));

  const [selectedSite, setSelectedSite] = useState<Construction | null>(null);

  const [assignments, setAssignments] = useState<LocalAssignment[]>([]);
  const [employeeToAdd, setEmployeeToAdd] = useState<Employee | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setAddress(initialData?.address || '');
      setDescription(initialData?.description || '');

      const sDate = initialData ? dayjs(initialData.startDate) : dayjs();
      const eDate = initialData
        ? dayjs(initialData.endDate)
        : dayjs().add(1, 'week');
      setStartDate(sDate);
      setEndDate(eDate);

      const foundSite = initialData?.constructionSiteId
        ? sites.find((s) => s.id === initialData.constructionSiteId)
        : null;
      setSelectedSite(foundSite || null);

      if (initialData?.assignments) {
        setAssignments(
          initialData.assignments.map((a: any) => ({
            employeeId: a.employeeId,
            startDate: dayjs(a.startDate),
            endDate: dayjs(a.endDate),
          }))
        );
      } else {
        setAssignments([]);
      }
      setEmployeeToAdd(null);
    }
  }, [open, initialData, sites]);

  const handleSubmit = () => {
    if (!startDate || !endDate) return;

    const assignmentsPayload = assignments.map((a) => ({
      employeeId: a.employeeId,
      startDate: a.startDate.toDate(),
      endDate: a.endDate.toDate(),
    }));

    const employeeIds = assignments.map((a) => a.employeeId);

    onSubmit({
      name,
      address,
      description,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      employeeIds,
      assignments: assignmentsPayload,
      constructionSiteId: selectedSite?.id || null,
    });
  };

  const handleDelete = () => {
    if (initialData) {
      onClose();
      onDelete(initialData.id);
    }
  };

  const handleAddEmployee = () => {
    if (!employeeToAdd || !startDate || !endDate) return;

    if (assignments.some((a) => a.employeeId === employeeToAdd.id)) {
      return;
    }

    const newAssignment: LocalAssignment = {
      employeeId: employeeToAdd.id,
      startDate: startDate,
      endDate: endDate,
    };

    setAssignments([...assignments, newAssignment]);
    setEmployeeToAdd(null);
  };

  const handleRemoveAssignment = (empId: string) => {
    setAssignments(assignments.filter((a) => a.employeeId !== empId));
  };

  const handleAssignmentDateChange = (
    empId: string,
    field: 'startDate' | 'endDate',
    value: Dayjs | null
  ) => {
    if (!value) return;
    setAssignments(
      assignments.map((a) => {
        if (a.employeeId === empId) {
          return { ...a, [field]: value };
        }
        return a;
      })
    );
  };

  const activeEmployees = useMemo(
    () => allEmployees.filter((e) => e.status),
    [allEmployees]
  );

  const availableEmployees = useMemo(
    () =>
      activeEmployees.filter(
        (e) => !assignments.some((a) => a.employeeId === e.id)
      ),
    [activeEmployees, assignments]
  );

  const sortedSites = useMemo(() => {
    return [...sites]
      .sort((a, b) => (a.status === b.status ? 0 : a.status ? -1 : 1))
      .filter((c) => c.status);
  }, [sites]);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={initialData ? 'Edytuj nocleg' : 'Nowy nocleg'}
      maxWidth="md"
      actions={
        <Stack
          direction={'row'}
          justifyContent={initialData ? 'space-between' : 'flex-end'}
          sx={{ flex: 1 }}
        >
          {initialData && (
            <Button onClick={handleDelete} color="error" variant="outlined">
              Usuń
            </Button>
          )}
          <Stack direction={'row'} spacing={1}>
            <Button onClick={onClose} color="inherit" variant="outlined">
              Anuluj
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !startDate || !endDate}
            >
              Zapisz
            </Button>
          </Stack>
        </Stack>
      }
    >
      <Stack spacing={2} mt={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box flex={1}>
            <Autocomplete
              options={sortedSites}
              getOptionLabel={(option) => option.name}
              value={selectedSite}
              onChange={(_, newValue) => setSelectedSite(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Budowa" size="small" />
              )}
            />
          </Box>
          <Box flex={1}>
            <TextField
              label="Tytuł"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Box>
        </Stack>

        <TextField
          label="Adres"
          size="small"
          fullWidth
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <TextField
          label="Opis / Uwagi"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
          <Stack direction="row" spacing={2} alignItems="center">
            <DatePicker
              label="Od *"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <Typography>-</Typography>
            <DatePicker
              label="Do *"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Stack>
        </LocalizationProvider>

        <Divider sx={{ pt: 2 }} />

        <Typography fontWeight={500}>Lista zakwaterowanych</Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems="center"
        >
          <FormControl fullWidth size="small">
            <Autocomplete
              size="small"
              options={availableEmployees}
              getOptionLabel={(option) => option.name}
              value={employeeToAdd}
              onChange={(_, newValue) => setEmployeeToAdd(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pracownik"
                  placeholder="Wyszukaj..."
                />
              )}
            />
          </FormControl>
          <Button
            variant="contained"
            size="medium"
            startIcon={<PersonAdd />}
            onClick={handleAddEmployee}
            disabled={!employeeToAdd}
            sx={{ minWidth: 120, width: { xs: '100%', sm: 'auto' } }}
          >
            Dodaj
          </Button>
        </Stack>

        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          {assignments.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Brak przypisanych pracowników
              </Typography>
            </Box>
          ) : (
            <Stack divider={<Divider />}>
              {assignments.map((assign) => {
                const employee = allEmployees.find(
                  (e) => e.id === assign.employeeId
                );
                if (!employee) return null;

                return (
                  <Stack
                    key={assign.employeeId}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    p={1}
                    alignItems={{ xs: 'normal', sm: 'center' }}
                  >
                    <Box
                      flex={{ xs: 0, sm: 1 }}
                      minWidth={0}
                      sx={{
                        display: 'flex',
                        alignItemsItems: 'center',
                        direction: 'row',
                      }}
                    >
                      <Typography
                        noWrap
                        sx={{
                          textAlign: 'left',
                        }}
                      >
                        {employee.name}
                      </Typography>
                      {!employee.status && (
                        <Chip
                          label="Nieaktywny"
                          size="small"
                          color="default"
                          sx={{ height: 16, fontSize: '0.6rem' }}
                        />
                      )}
                      <Box
                        sx={{
                          display: { xs: 'block', sm: 'none' },
                          ml: 'auto',
                        }}
                      >
                        <Tooltip title="Usuń pracownika z noclegu">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleRemoveAssignment(assign.employeeId)
                            }
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <DatePicker
                        value={assign.startDate}
                        onChange={(val) =>
                          handleAssignmentDateChange(
                            assign.employeeId,
                            'startDate',
                            val
                          )
                        }
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: { width: 140 },
                            variant: 'standard',
                          },
                        }}
                      />
                      <Typography variant="caption">-</Typography>
                      <DatePicker
                        value={assign.endDate}
                        onChange={(val) =>
                          handleAssignmentDateChange(
                            assign.employeeId,
                            'endDate',
                            val
                          )
                        }
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: { width: 140 },
                            variant: 'standard',
                          },
                          actionBar: { actions: [] },
                        }}
                      />
                    </Stack>
                    <Box
                      sx={{
                        display: { xs: 'none', sm: 'block' },
                      }}
                    >
                      <Tooltip title="Usuń pracownika z noclegu">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleRemoveAssignment(assign.employeeId)
                          }
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
      </Stack>
    </BaseDialog>
  );
};

// --- KARTA (GRID VIEW) ---
interface LodgingCardProps {
  lodging: ExtendedLodging;
  employees: Employee[];
  onEdit: (l: ExtendedLodging) => void;
  onEmployeeClick: (id: string) => void;
  siteName?: string;
}

const LodgingCard: React.FC<LodgingCardProps> = ({
  lodging,
  employees,
  onEdit,
  onEmployeeClick,
  siteName,
}) => {
  const assignedEmployees = useMemo(
    () => employees.filter((e) => lodging.employeeIds.includes(e.id)),
    [employees, lodging.employeeIds]
  );

  const isActive = dayjs().isBetween(
    lodging.startDate,
    lodging.endDate,
    'day',
    '[]'
  );

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: '0.3s',
        '&:hover': {
          borderColor: 'primary.main',
        },
        '&:hover .lodgings-edit': {
          opacity: 1,
          transform: 'translateY(0)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box pr={2}>
            <Stack direction="column" spacing={1}>
              <Box>
                {siteName && (
                  <Typography fontWeight="bold">{siteName}</Typography>
                )}
                {lodging.name && (
                  <Typography
                    variant="h6"
                    color="textSecondary"
                    component="div"
                    gutterBottom
                    fontWeight={400}
                    sx={{ lineHeight: 1.2 }}
                  >
                    {lodging.name}
                  </Typography>
                )}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <DateRange fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {dayjs(lodging.startDate).format('DD.MM')} -{' '}
                  {dayjs(lodging.endDate).format('DD.MM.YYYY')}
                </Typography>
                {isActive && (
                  <Chip
                    label="Aktywny"
                    color="success"
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </Stack>
              {lodging.address && (
                <Tooltip title="Otwórz w Google Maps">
                  <Link
                    sx={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'row',
                      textDecoration: 'none',
                      alignItems: 'center',
                    }}
                    onClick={() => openGoogleMaps(lodging.address)}
                  >
                    <LocationOn fontSize="small" sx={{ color: 'location' }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        color: 'location',
                        ':hover': { textDecoration: 'underline' },
                      }}
                    >
                      {lodging.address}
                    </Typography>
                  </Link>
                </Tooltip>
              )}
            </Stack>
          </Box>
          <Box>
            <IconButton
              sx={{
                transition: 'all 0.2s ease-in-out',
                opacity: 1,
                transform: 'translateY(0)',
                '@media (hover: hover)': {
                  opacity: 0,
                  transform: 'translateY(5px)',
                },
              }}
              className="lodgings-edit"
              size="small"
              onClick={() => onEdit(lodging)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        </Stack>

        {lodging.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {lodging.description}
          </Typography>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <People fontSize="small" color="action" />
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            ZAKWATEROWANI ({assignedEmployees.length}):
          </Typography>
        </Stack>

        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {assignedEmployees.length > 0 ? (
            assignedEmployees.map((emp) => (
              <Chip
                onClick={() => onEmployeeClick(emp.id)}
                key={emp.id}
                label={getEmployeeLabel(emp.name, lodging, emp.id)}
                size="small"
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transform: 'scale 0.5s ease',
                  ':hover': { scale: '1.05' },
                  textDecoration: emp.status ? '' : 'line-through',
                }}
              />
            ))
          ) : (
            <Typography
              variant="caption"
              color="text.disabled"
              fontStyle="italic"
            >
              Brak przypisanych pracowników
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

interface LodgingTimelineProps {
  lodgings: ExtendedLodging[];
  onEdit: (l: ExtendedLodging) => void;
  employees: Employee[];
  sites: Construction[];
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
    let min = dayjs(sorted[0].startDate).subtract(5, 'day');
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
                bgcolor: 'background.default',
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
                        ? theme.palette.schedule.accent
                        : isWeekend
                          ? theme.palette.background.default
                          : theme.palette.background.paper,
                      flex: 1,
                    })}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={isToday ? 'bold' : 'normal'}
                      color={isToday ? 'primary' : 'textSecondary'}
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
                        ? alpha(theme.palette.schedule.accent, 0.5)
                        : isWeekend
                          ? theme.palette.background.default
                          : theme.palette.background.paper,
                    })}
                  />
                );
              })}
            </Box>

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
                  '&:hover': { bgcolor: alpha(theme.palette.tableHover, 0.5) },
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
                                onClick={() => openGoogleMaps(lodging.address)}
                              >
                                <LocationOn
                                  fontSize="small"
                                  sx={{ color: 'location', fontSize: '0.8rem' }}
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
                                  {getEmployeeLabel(emp.name, lodging, emp.id)}
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
                            width: Math.max(duration * CELL_WIDTH, CELL_WIDTH),
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
  );
};

const LodgingsManager = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLodging, setEditingLodging] = useState<
    ExtendedLodging | undefined
  >(undefined);

  const navigate = useNavigate();
  const notifications = useNotifications();
  const dialogs = useDialogs();
  const queryClient = useQueryClient();

  const { data: lodgings = [], isLoading: loadingLodgings } = useQuery({
    queryKey: ['lodgings'],
    queryFn: getLodgings,
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const { data: sites = [], isLoading: loadingSites } = useQuery({
    queryKey: ['constructions'],
    queryFn: () => getConstructionList(false),
  });

  const createMutation = useMutation({
    mutationFn: createLodging,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodgings'] });
      notifications.show('Dodano nocleg', { severity: 'success' });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; data: Partial<Lodging> }) =>
      updateLodging(vars.id, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodgings'] });
      notifications.show('Zaktualizowano nocleg', { severity: 'success' });
      setIsDialogOpen(false);
      setEditingLodging(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLodging,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodgings'] });
      notifications.show('Usunięto nocleg', { severity: 'info' });
    },
  });

  const cleanMutation = useMutation({
    mutationFn: deleteOutdatedLodgings,
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['lodgings'] });
      notifications.show(`Usunięto ${count} przedawnionych noclegów`, {
        severity: 'success',
      });
    },
  });

  const handleOpenAdd = () => {
    setEditingLodging(undefined);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (lodging: Lodging) => {
    setEditingLodging(lodging);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await dialogs.confirm(
      'Czy na pewno chcesz usunąć ten nocleg?',
      {
        okText: 'Usuń',
        cancelText: 'Anuluj',
        title: 'Usuwanie noclegu',
        severity: 'error',
      }
    );
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleCleanOutdated = async () => {
    const today = dayjs();
    const outdatedCount = lodgings.filter((l) =>
      dayjs(l.endDate).isBefore(today, 'day')
    ).length;

    if (outdatedCount === 0) {
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
      cleanMutation.mutate();
    }
  };

  const handleFormSubmit = (data: Partial<Lodging>) => {
    if (editingLodging) {
      updateMutation.mutate({ id: editingLodging.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEmployeeClick = (id: string) => {
    navigate(`/employees/${id}`);
  };

  const stats = useMemo(() => {
    const today = dayjs();

    const activeLodgings = lodgings.filter((l) =>
      today.isBetween(dayjs(l.startDate), dayjs(l.endDate), 'day', '[]')
    );

    const accommodatedEmployeesSet = new Set<string>();

    lodgings.forEach((lodging) => {
      const extLodging = lodging as ExtendedLodging;

      if (extLodging.assignments && extLodging.assignments.length > 0) {
        extLodging.assignments.forEach((assign) => {
          const start = dayjs(assign.startDate);
          const end = dayjs(assign.endDate);

          if (today.isBetween(start, end, 'day', '[]')) {
            accommodatedEmployeesSet.add(assign.employeeId);
          }
        });
      } else {
        const lodgingActive = today.isBetween(
          dayjs(lodging.startDate),
          dayjs(lodging.endDate),
          'day',
          '[]'
        );
        if (lodgingActive) {
          lodging.employeeIds.forEach((id) => accommodatedEmployeesSet.add(id));
        }
      }
    });

    return {
      activeLodgingsCount: activeLodgings.length,
      accommodatedEmployees: accommodatedEmployeesSet.size,
      totalEmployees: employees.filter((e) => e.status).length,
      totalLodgings: lodgings.length,
    };
  }, [lodgings, employees]);

  const isLoading = loadingLodgings || loadingEmployees || loadingSites;

  if (isLoading)
    return (
      <PageContainer fixedHeight breadcrumbs={[{ title: 'Noclegi' }]}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Loading />
        </Box>
      </PageContainer>
    );

  return (
    <PageContainer
      fixedHeight
      breadcrumbs={[{ title: 'Noclegi' }]}
      actions={[
        <ToggleButtonGroup
          key="view"
          value={viewMode}
          exclusive
          onChange={(_, newMode) => {
            if (newMode) setViewMode(newMode);
          }}
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
            <ToggleButton
              value="timeline"
              aria-label="oś czasu"
              sx={{ p: 0.5 }}
            >
              <ViewTimeline fontSize="small" />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>,

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAdd}
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
      ]}
      renderBottomToolbar={
        <Box
          sx={(theme) => ({
            height: '100%',
            flexShrink: 0,
            background: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Stack
            direction={'row'}
            alignItems={'center'}
            className="px-3"
            columnGap={2}
            rowGap={0.5}
            py={1}
            sx={{ height: '100%' }}
          >
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
                sx={{ lineHeight: 1 }}
              >
                {`Zakwaterowani dziś: ${stats.accommodatedEmployees}/${stats.totalEmployees}`}
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
          </Stack>
        </Box>
      }
    >
      <LocalizationProvider
        localeText={
          plPL.components.MuiLocalizationProvider.defaultProps.localeText
        }
        dateAdapter={AdapterDayjs}
        adapterLocale="pl"
      >
        <Box sx={{ height: '100%', overflowY: 'auto' }}>
          {lodgings.length === 0 ? (
            <Box textAlign="center" py={5}>
              <Hotel sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Brak zaplanowanych noclegów
              </Typography>
              <Button sx={{ mt: 2 }} onClick={handleOpenAdd}>
                Dodaj pierwszy nocleg
              </Button>
            </Box>
          ) : viewMode === 'timeline' ? (
            <LodgingTimeline
              lodgings={lodgings}
              onEdit={handleOpenEdit}
              employees={employees}
              sites={sites}
            />
          ) : (
            <Grid p={{ xs: 2, sm: 3 }} container spacing={3}>
              {lodgings.map((lodging) => {
                const site = sites.find(
                  (s) =>
                    s.id === (lodging as ExtendedLodging).constructionSiteId
                );
                return (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={lodging.id}>
                    <LodgingCard
                      onEmployeeClick={handleEmployeeClick}
                      lodging={lodging}
                      employees={employees}
                      onEdit={handleOpenEdit}
                      siteName={site?.name}
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}

          <LodgingFormDialog
            open={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onDelete={handleDelete}
            onSubmit={handleFormSubmit}
            initialData={editingLodging}
            loading={createMutation.isPending || updateMutation.isPending}
            allEmployees={employees}
            sites={sites}
          />
        </Box>
      </LocalizationProvider>
    </PageContainer>
  );
};

export default LodgingsManager;
