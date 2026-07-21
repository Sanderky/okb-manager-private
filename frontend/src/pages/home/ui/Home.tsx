import { Card, Box, Grid, CardContent, Tabs, Tab } from '@mui/material';
import PageContainer from '@/shared/ui/PageContainer';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConstructionsCard, EmployeesCard } from './InfoCards';
import { useEmployees, useEmployeeStats } from '@/entities/employee';
import {
  useConstructions,
  useConstructionStats,
} from '@/entities/construction';
import { EmployeeAlerts } from '@/features/employees';
import { DiskUsage } from '@/features/disk-usage';
import { TodoList } from '@/features/todo-list';
import { HomeNote } from '@/features/home-note';
import { FileBrowser } from '@/features/file-browser';
import { useUpcomingEvents } from '@/entities/events';
import { EventsBox } from '@/features/upcoming-events';
import { UpcomingVacation } from '@/features/upcoming-vacations/ui/UpcomingVacations';

const SHOW_DISK_USAGE = import.meta.env.VITE_SHOW_DISK_USAGE;

export const Home = () => {
  const { t } = useTranslation('home');
  const navigate = useNavigate();

  const [tab, setTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const { data: employeeStats, isLoading: employeesLoading } =
    useEmployeeStats();
  const { data: constructionStats, isLoading: constructionsLoading } =
    useConstructionStats();
  const { employees } = useEmployees();
  const { constructions } = useConstructions();
  const { data: upcomingEvents = [], isLoading: isUpcomingEventsLoading } =
    useUpcomingEvents();

  const employeesMap = useMemo(() => {
    const map: Record<string, string> = {};

    employees.forEach((employee) => {
      map[employee.id] = employee.name;
    });

    return map;
  }, [employees]);

  const constructionsMap = useMemo(() => {
    return constructions.reduce(
      (acc, constr) => {
        acc[constr.id] = constr.name;
        return acc;
      },
      {} as Record<string, string>
    );
  }, [constructions]);

  const handleEmployeesClick = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  const handleConstructionsClick = useCallback(() => {
    navigate('/constructions');
  }, [navigate]);

  return (
    <PageContainer
      breadcrumbs={[{ title: t('breadcrumbs.home') }]}
      fixedHeight={tab === 1}
      renderTopToolbar={
        <Box
          className="overflow-hidden"
          sx={(theme) => ({
            background: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab
              label={t('tabs.info')}
              sx={{
                fontSize: { xs: '0.8rem', sm: '.85rem' },
                minWidth: 0,
              }}
            />
            <Tab
              label={t('tabs.files')}
              sx={{
                fontSize: { xs: '0.8rem', sm: '.85rem' },
                minWidth: { xs: 0, sm: 100 },
              }}
            />
          </Tabs>
        </Box>
      }
    >
      {tab === 0 ? (
        <Box sx={{ px: { xs: 0.5, sm: 2 }, pt: 2, pb: 4 }}>
          <Grid
            container
            columns={12}
            spacing={{ xs: 2, lg: 3 }}
            sx={{
              minHeight: 0,
            }}
          >
            <Grid
              container
              columns={12}
              spacing={{ xs: 1.5, md: 2, lg: 3 }}
              size={12}
              alignItems={'flex-start'}
            >
              <Grid container columns={12} size={{ xs: 12, lg: 6 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EmployeesCard
                    isLoading={employeesLoading}
                    handleEmployeesClick={handleEmployeesClick}
                    employeeStats={employeeStats}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ConstructionsCard
                    isLoading={constructionsLoading}
                    handleConstructionsClick={handleConstructionsClick}
                    constructionStats={constructionStats}
                  />
                </Grid>

                {SHOW_DISK_USAGE && (
                  <Grid size={{ xs: 12 }}>
                    <DiskUsage />
                  </Grid>
                )}
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <EmployeeAlerts />
              </Grid>
            </Grid>

            <Grid
              container
              columns={12}
              spacing={{ xs: 1.5, md: 2, lg: 3 }}
              size={12}
              alignContent={'flex-start'}
            >
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card
                  className="rounded-lg"
                  sx={(theme) => ({
                    boxShadow: 0,
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <CardContent className="pb-0">
                    <UpcomingVacation />
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Card
                  className="rounded-lg"
                  sx={(theme) => ({
                    boxShadow: 0,
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <CardContent className="pb-0">
                    <EventsBox
                      events={upcomingEvents}
                      isLoading={isUpcomingEventsLoading}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container columns={12} size={12}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <TodoList />
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <HomeNote />
              </Grid>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <FileBrowser
          baseDirectory=""
          constructionsMap={constructionsMap}
          employeesMap={employeesMap}
        />
      )}
    </PageContainer>
  );
};
