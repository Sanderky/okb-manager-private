import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Stack,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add,
  Hotel,
  GridView,
  ViewTimeline,
  DeleteSweep,
  BookmarkOutlined,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers';
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
} from '../api';
import { getConstructionList } from '../../../services/constructions';
import type { ExtendedLodging, Lodging } from '../types';
import Loading from '../../../components/Loading';
import { useNavigate } from 'react-router-dom';
import LodgingTimeline from './LodingsTimeline';
import LodgingCard from './LodgingCard';
import LodgingFormDialog from './LodingsFormDialog';

dayjs.extend(isBetween);
dayjs.locale('pl');

const LodgingsManager = () => {
  const [defaultViewMode, setDefaultViewMode] = useState<'grid' | 'timeline'>(
    () => {
      const saved = localStorage.getItem('lodgings_view_mode');
      return saved === 'grid' || saved === 'timeline' ? saved : 'timeline';
    }
  );
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>(() => {
    const saved = localStorage.getItem('lodgings_view_mode');
    return saved === 'grid' || saved === 'timeline' ? saved : 'timeline';
  });
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

  const handleClickOnConstruction = useCallback(
    (id: string | undefined) => {
      if (!id) return;
      navigate(`/constructions/${id}`);
    },
    [navigate]
  );

  const handleSetDefaultView = () => {
    localStorage.setItem('lodgings_view_mode', viewMode);
    setDefaultViewMode(viewMode);
    notifications.show('Ustawiono bieżący widok jako domyślny', {
      severity: 'success',
    });
  };

  const handleEmployeeClick = (id: string) => {
    navigate(`/employees/${id}`);
  };

  const stats = useMemo(() => {
    const today = dayjs();

    const activeLodgings = lodgings.filter((l) =>
      today.isBetween(dayjs(l.startDate), dayjs(l.endDate), 'day', '[]')
    );

    const accommodatedTodaySet = new Set<string>();

    const accommodatedTotalSet = new Set<string>();

    lodgings.forEach((lodging) => {
      const extLodging = lodging as ExtendedLodging;

      if (extLodging.employeeIds) {
        extLodging.employeeIds.forEach((id) => accommodatedTotalSet.add(id));
      }

      if (extLodging.assignments && extLodging.assignments.length > 0) {
        extLodging.assignments.forEach((assign) => {
          const start = dayjs(assign.startDate);
          const end = dayjs(assign.endDate);

          if (today.isBetween(start, end, 'day', '[]')) {
            accommodatedTodaySet.add(assign.employeeId);
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
          lodging.employeeIds.forEach((id: string) =>
            accommodatedTodaySet.add(id)
          );
        }
      }
    });

    return {
      activeLodgingsCount: activeLodgings.length,
      accommodatedToday: accommodatedTodaySet.size,
      accommodatedTotal: accommodatedTotalSet.size,
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
              handleClickOnConstruction={handleClickOnConstruction}
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
                      handleClickOnConstruction={handleClickOnConstruction}
                      siteName={site?.name}
                      siteId={site?.id}
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
