import { useCallback } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Hotel } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { plPL } from '@mui/x-date-pickers/locales';
import PageContainer from '@/shared/ui/PageContainer';
import { EmployeeApi } from '@/entities/employee';
import Loading from '@/shared/ui/Loading';
import { useNavigate } from 'react-router-dom';
import { ConstructionApi } from '@/entities/construction';
import {
  LodgingsActions,
  LodgingsBottomToolbar,
  useLodgings,
  useManageLodging,
  useViewMode,
  LodgingsTimeline,
  ManageLodgingDialog,
  LodgingsCards,
} from '@/features/lodgings';

export const LodgingsPage = () => {
  const navigate = useNavigate();

  const { onSetDefaultView, setViewMode, viewMode, defaultViewMode } =
    useViewMode();
  const { isOpen, editingLodging, openAdd, openEdit, close } =
    useManageLodging();
  const { lodgings, isLoading: loadingLodgings } = useLodgings();

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => EmployeeApi.getEmployeeList(),
  });

  const { data: constructions = [], isLoading: loadingSites } = useQuery({
    queryKey: ['constructions'],
    queryFn: () => ConstructionApi.getConstructionList(false),
  });

  const handleClickOnConstruction = useCallback(
    (id: string | undefined) => {
      if (!id || id === 'orphan') return;
      navigate(`/constructions/${id}`);
    },
    [navigate]
  );

  const handleEmployeeClick = (id: string) => {
    navigate(`/employees/${id}`);
  };

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
      actions={
        <LodgingsActions
          lodgings={lodgings}
          onOpenAdd={openAdd}
          onSetViewMode={setViewMode}
          viewMode={viewMode}
        />
      }
      renderBottomToolbar={
        <LodgingsBottomToolbar
          onSetDefaultView={onSetDefaultView}
          defaultViewMode={defaultViewMode}
          viewMode={viewMode}
        />
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
              <Button sx={{ mt: 2 }} onClick={openAdd}>
                Dodaj pierwszy nocleg
              </Button>
            </Box>
          ) : viewMode === 'timeline' ? (
            <LodgingsTimeline
              handleClickOnConstruction={handleClickOnConstruction}
              lodgings={lodgings}
              onEdit={openEdit}
              employees={employees}
              constructions={constructions}
            />
          ) : (
            <LodgingsCards
              handleClickOnConstruction={handleClickOnConstruction}
              handleEmployeeClick={handleEmployeeClick}
              lodgings={lodgings}
              onEdit={openEdit}
              employees={employees}
              constructions={constructions}
            />
          )}

          <ManageLodgingDialog
            open={isOpen}
            onClose={close}
            initialData={editingLodging}
            employees={employees}
            constructions={constructions}
          />
        </Box>
      </LocalizationProvider>
    </PageContainer>
  );
};
