import {
  Card,
  Typography,
  Stack,
  Box,
  List,
  ListItem,
  IconButton,
  TextareaAutosize,
  Tooltip,
  Grid,
  CardContent,
  Avatar,
  Chip,
} from '@mui/material';
import PageContainer from '../../../components/PageContainer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../api/employees';
import { getConstructionList } from '../../../api/constructions';
import FirebaseFileBrowser from '../../../components/fileBrowser/FileBrowser';
import { useEmployeeAlert } from '../../../context/EmployeeAlertContext';
import { Construction, Done, Person } from '@mui/icons-material';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { HomeDocument } from '../../../types';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import dayjs from 'dayjs';
import { getVacationListForMonths } from '../../../api/vacations';
import Loading from '../../../components/Loading';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

// interface CountCardProps {
//   data: number;
//   title: string;
//   tooltipTitle: string;
//   onClick?: () => void;
//   icon?: React.ReactNode;
// }

// const CountCard = ({
//   data,
//   title,
//   onClick,
//   icon,
//   tooltipTitle,
// }: CountCardProps) => {
//   return (
//     <Tooltip title={tooltipTitle}>
//       <Card
//         variant="outlined"
//         sx={{
//           borderRadius: '20px',
//           p: 2,
//           width: '250px',
//           transition: 'border 0.2s ease-in-out',
//           '&:hover': {
//             border: '1px solid #000',
//           },
//           cursor: 'pointer',
//         }}
//         onClick={onClick}
//       >
//         <Stack direction="row" sx={{ alignItems: 'center' }} spacing={2}>
//           <Stack direction={'row'} spacing={0.5}>
//             {icon && icon}
//             <Typography
//               gutterBottom
//               variant="h5"
//               component="div"
//               sx={{ p: 0, m: 0, lineHeight: 1 }}
//             >
//               {title}
//             </Typography>
//           </Stack>
//           <Typography
//             variant="body1"
//             sx={(theme) => ({
//               color: theme.palette.secondary.main,
//               fontSize: '2rem',
//               lineHeight: 1,
//             })}
//           >
//             {data ?? '-'}
//           </Typography>
//         </Stack>
//       </Card>
//     </Tooltip>
//   );
// };

const EmployeeAlerts = () => {
  const { alerts } = useEmployeeAlert();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const MAX_VISIBLE_ITEMS = 3;
  const hasMoreItems = alerts.length > MAX_VISIBLE_ITEMS;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
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
        <ReportProblemIcon className="text-yellow-500" />
        <Typography variant="body1" className="font-medium">
          Uwagi dotyczące pracowników
        </Typography>
        {hasMoreItems && (
          <Chip
            label={`${alerts.length} uwag`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        )}
      </Stack>
      <Box
        sx={{
          maxHeight: isExpanded ? 'none' : 200,
          overflow: 'auto',
        }}
      >
        <List className="mb-2">
          {alerts.length === 0 ? (
            <Stack direction={'row'} spacing={1} className="mb-2">
              <Done />
              <Typography color={'textSecondary'}>Brak uwag</Typography>
            </Stack>
          ) : (
            alerts.map((alert) => (
              <ListItem
                key={alert.id}
                onClick={() => navigate(`/employees/${alert.employeeId}`)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  borderLeftWidth: '8px',
                  alignItems: 'flex-start',
                  mb: 2,
                }}
                className={`${alert.severity === 'error' ? 'border-l-red-400' : 'border-l-yellow-400'} ${alert.severity === 'error' ? 'hover:bg-red-200' : 'hover:bg-amber-200'} ${alert.severity === 'error' ? 'bg-red-100' : 'bg-amber-100'} last:mb-0`}
              >
                <Typography variant="subtitle2">{alert.title}</Typography>
                <Typography variant="body2">{alert.message}</Typography>
              </ListItem>
            ))
          )}
        </List>
      </Box>
      {hasMoreItems && (
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <IconButton
            onClick={toggleExpanded}
            size="small"
            className="text-gray-400"
          >
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

const UpcomingVacation = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ['employees', { status: true }],
    queryFn: () => getEmployeeList(true),
  });

  const { data: upcomingVacations, isLoading } = useQuery({
    queryKey: ['upcoming-vacations'],
    queryFn: async () => {
      const now = dayjs();
      const nextMonth = now.add(1, 'month');

      const currentMonthKey = now.format('YYYY-MM');
      const nextMonthKey = nextMonth.format('YYYY-MM');

      const vacations = await getVacationListForMonths([
        currentMonthKey,
        nextMonthKey,
      ]);

      const today = dayjs().startOf('day');
      return vacations.filter(
        (vacation) =>
          dayjs(vacation.startDate).isAfter(today) ||
          dayjs(vacation.endDate).isAfter(today)
      );
    },
  });

  const groupedVacations = useMemo(() => {
    if (!upcomingVacations || !employees) return [];

    const uniqueGroups = new Map();

    upcomingVacations.forEach((vacation) => {
      const employee = employees.find((emp) => emp.id === vacation.employeeId);

      if (!employee) {
        return;
      }

      if (!uniqueGroups.has(vacation.groupId)) {
        uniqueGroups.set(vacation.groupId, {
          ...vacation,
          employeeName: employee.name,
        });
      }
    });

    return Array.from(uniqueGroups.values()).sort(
      (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
    );
  }, [upcomingVacations, employees]);

  const MAX_VISIBLE_ITEMS = 2;
  const hasMoreItems = groupedVacations.length > MAX_VISIBLE_ITEMS;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
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
        <NotificationsIcon
          sx={{
            color: 'primary.main',
          }}
        />
        <Typography variant="body1" className="font-medium">
          Nadchodzące urlopy
        </Typography>
        {hasMoreItems && (
          <Chip
            label={`${groupedVacations.length} urlopów`}
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
        <Box>
          <Box
            sx={{
              maxHeight: isExpanded ? 'none' : 200,
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <List className="mb-2">
              {groupedVacations.length === 0 ? (
                <Stack direction={'row'} spacing={1}>
                  <Done />
                  <Typography color={'textSecondary'}>
                    Brak nadchodzących urlopów
                  </Typography>
                </Stack>
              ) : (
                groupedVacations.map((vacation) => (
                  <ListItem
                    key={vacation.groupId}
                    onClick={() =>
                      navigate(`/employees/${vacation.employeeId}`)
                    }
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                    className={`border-lightGray rounded-md border bg-blue-50/50 text-blue-950 last:mb-0 hover:bg-blue-100`}
                  >
                    <Typography variant="subtitle2">
                      {vacation.employeeName}
                    </Typography>
                    <Typography variant="body2">
                      {dayjs(vacation.startDate).format('DD.MM.YYYY')} -{' '}
                      {dayjs(vacation.endDate).format('DD.MM.YYYY')}
                    </Typography>
                  </ListItem>
                ))
              )}
            </List>
          </Box>
          {hasMoreItems && (
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <IconButton
                onClick={toggleExpanded}
                size="small"
                className="text-gray-400"
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const Note = () => {
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const [editNote, setEditNote] = useState(false);
  const [note, setNote] = useState('');

  const HOME_DOC_ID = 'home';

  const { data: home } = useQuery({
    queryKey: ['home', HOME_DOC_ID],
    queryFn: async (): Promise<HomeDocument | null> => {
      const homeDocRef = doc(db, 'home', HOME_DOC_ID);
      const docSnap = await getDoc(homeDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          note: data.note,
        };
      }
      return null;
    },
  });

  useEffect(() => {
    if (home?.note !== undefined) {
      setNote(home.note || '');
    } else {
      setNote('');
    }
  }, [home]);

  const updateNoteMutation = useMutation({
    mutationFn: async (newNote: string) => {
      const homeDocRef = doc(db, 'home', HOME_DOC_ID);
      const docSnap = await getDoc(homeDocRef);

      if (docSnap.exists()) {
        await updateDoc(homeDocRef, {
          note: newNote,
        });
      } else {
        const newHome = {
          note: newNote,
        };
        await setDoc(homeDocRef, newHome);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['home', HOME_DOC_ID],
      });
      notifications.show('Notatka została zaktualizowana.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
    },
    onError: (error: Error) => {
      console.error('Update note error:', error);
      notifications.show('Wystąpił błąd podczas zapisywania notatki.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
  });

  const handleSaveNote = useCallback(async () => {
    const currentNote = home?.note ?? '';
    if (currentNote === note) {
      return;
    }
    updateNoteMutation.mutate(note);
    setEditNote(false);
  }, [home?.note, note, updateNoteMutation]);

  const handleCancelEdit = () => {
    setEditNote(false);
    setNote(home?.note ?? '');
  };

  return (
    <Box className="rounded-lg border border-dashed border-gray-300 bg-white p-4">
      <Stack spacing={1.5} direction={'column'} alignItems={'flex-start'}>
        <Stack
          direction="row"
          alignItems={'center'}
          sx={{ width: '100%' }}
          spacing={2}
        >
          <Typography
            variant="body1"
            className="font-medium"
            sx={{
              alignSelf: 'flex-start',
            }}
          >
            Notatka:
          </Typography>
          <Stack
            direction="row"
            sx={{ width: '100%' }}
            justifyContent={'flex-end'}
            alignItems="center"
            spacing={2}
          >
            {editNote && (
              <Tooltip title="Zapisz notatkę">
                <IconButton
                  onClick={handleSaveNote}
                  size="small"
                  color="success"
                  className="rounded-full border border-green-500 bg-green-50/50"
                  disabled={updateNoteMutation.isPending || !editNote}
                >
                  <CheckIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={editNote ? 'Anuluj' : 'Edytuj notatkę'}>
              <IconButton
                size="small"
                onClick={editNote ? handleCancelEdit : () => setEditNote(true)}
                color={!editNote ? 'primary' : 'inherit'}
                className={`rounded-lg border ${editNote ? 'border-red-500 bg-red-50/50' : ''}`}
              >
                {editNote ? (
                  <CloseIcon className="text-red-400" />
                ) : (
                  <EditNoteIcon />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <TextareaAutosize
          minRows={3}
          className={`rounded-sm border border-gray-300 bg-white px-2 py-1 ${editNote ? '' : 'bg-gray-50! opacity-75'}`}
          style={{ width: '100%', minHeight: '50px', maxHeight: '500px' }}
          placeholder="..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          readOnly={updateNoteMutation.isPending || !editNote}
        />
      </Stack>
    </Box>
  );
};

const Home = () => {
  const navigate = useNavigate();

  const { data: employees } = useQuery({
    queryKey: ['employees', { status: true }],
    queryFn: () => getEmployeeList(true),
  });

  const { data: constructions } = useQuery({
    queryKey: ['constructions'],
    queryFn: getConstructionList,
  });

  const handleEmployeesClick = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  const handleConstructionsClick = useCallback(() => {
    navigate('/constructions');
  }, [navigate]);

  return (
    <PageContainer breadcrumbs={[{ title: 'Strona główna' }]}>
      <Grid container columns={12} spacing={{ xs: 2, lg: 3 }}>
        <Grid
          container
          columns={12}
          spacing={{ xs: 2, lg: 3 }}
          size={{ xs: 12, lg: 6 }}
          alignContent={'flex-start'}
        >
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              sx={{ boxShadow: 1, cursor: 'pointer' }}
              onClick={handleEmployeesClick}
              className="hover:shadow-sm"
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="body1">Pracownicy</Typography>
                    <Typography variant="h4">
                      {employees?.length || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              sx={{ boxShadow: 1, cursor: 'pointer' }}
              onClick={handleConstructionsClick}
              className="hover:shadow-sm"
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <Construction />
                  </Avatar>
                  <Box>
                    <Typography variant="body1">Aktywne budowy</Typography>
                    <Typography variant="h4">
                      {constructions?.filter((c) => !c.endDate).length || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid
            size={{ xs: 12 }}
            sx={{
              display: { xs: 'none', lg: 'block' },
            }}
          >
            <Note />
          </Grid>
        </Grid>

        <Grid
          container
          columns={12}
          spacing={{ xs: 2, lg: 3 }}
          size={{ xs: 12, lg: 6 }}
          alignContent={'flex-start'}
        >
          <Grid size={{ xs: 12 }}>
            <Card sx={{ boxShadow: 1 }} className="hover:shadow-sm">
              <CardContent className="pb-0">
                <EmployeeAlerts />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ boxShadow: 1 }}>
              <CardContent className="pb-0">
                <UpcomingVacation />
              </CardContent>
            </Card>
          </Grid>
          <Grid
            size={{ xs: 12 }}
            sx={{
              display: { xs: 'block', lg: 'none' },
            }}
          >
            <Note />
          </Grid>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h5" mb={2}>
            Lista plików
          </Typography>
          <FirebaseFileBrowser baseDirectory="general" />
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Home;
