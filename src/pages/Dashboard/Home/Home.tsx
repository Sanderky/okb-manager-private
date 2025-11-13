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
} from '@mui/material';
import PageContainer from '../../../components/PageContainer';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../api/employees';
import { getConstructionList } from '../../../api/constructions';
import FirebaseFileBrowser from '../../../components/fileBrowser/FileBrowser';
import { useEmployeeAlert } from '../../../context/EmployeeAlertContext';
import {
  Check,
  Close,
  Construction,
  Done,
  EditNote,
  Person,
} from '@mui/icons-material';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { HomeDocument } from '../../../types';

interface CountCardProps {
  data: number;
  title: string;
  tooltipTitle: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

const CountCard = ({
  data,
  title,
  onClick,
  icon,
  tooltipTitle,
}: CountCardProps) => {
  return (
    <Tooltip title={tooltipTitle}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: '20px',
          p: 2,
          width: '250px',
          transition: 'border 0.2s ease-in-out',
          '&:hover': {
            border: '1px solid #000',
          },
          cursor: 'pointer',
        }}
        onClick={onClick}
      >
        <Stack direction="row" sx={{ alignItems: 'center' }} spacing={2}>
          <Stack direction={'row'} spacing={0.5}>
            {icon && icon}
            <Typography
              gutterBottom
              variant="h5"
              component="div"
              sx={{ p: 0, m: 0, lineHeight: 1 }}
            >
              {title}
            </Typography>
          </Stack>
          <Typography
            variant="body1"
            sx={(theme) => ({ color: theme.palette.secondary.main, fontSize: '2rem', lineHeight: 1 })}
          >
            {data ?? '-'}
          </Typography>
        </Stack>
      </Card>
    </Tooltip>
  );
};

const EmployeeAlerts = () => {
  const { alerts } = useEmployeeAlert();
  const navigate = useNavigate();

  return (
    <Box
      // className="border-lightGray rounded-lg border p-2"
      mb={5}
    >
      <Typography variant="h5" mb={1}>
        Uwagi dotyczące pracowników
      </Typography>
      <List>
        {alerts.length === 0 ? (
          <Stack direction={'row'} spacing={1} key="noAlerts">
            <Done />
            <Typography color={'textSecondary'}>Brak uwag</Typography>
          </Stack>
        ) : (
          alerts.map((alert) => (
            // <Tooltip title="Przejdź do pracownika aby wyświetlić szczegóły" key={alert.id}>
              <ListItem
                key={alert.id}
                onClick={() => navigate(`/employees/${alert.employeeId}`)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  borderLeft:
                    alert.severity === 'warning'
                      ? '8px #ffa503 solid'
                      : '8px #ff4858 solid',
                  alignItems: 'flex-start',
                  background:
                    alert.severity === 'error' ? '#ffe0e3' : '#ffdb9b',
                  mb: 2,
                  '&:hover': {
                    background:
                      alert.severity === 'warning' ? '#ffa503' : '#ff4858',
                  },
                  transition: 'background 0.2s ease-in-out',
                }}
              >
                <Typography variant="subtitle2">{alert.title}</Typography>
                <Typography variant="body2">{alert.message}</Typography>
              </ListItem>
            // </Tooltip>
          ))
        )}
      </List>
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
    <Box
      className="rounded-lg border border-gray-300 bg-white p-4"
      sx={{ mb: 5 }}
    >
      <Stack spacing={1.5} direction={'column'} alignItems={'flex-start'}>
        <Stack
          direction="row"
          alignItems={'center'}
          sx={{ width: '100%' }}
          spacing={2}
        >
          <Typography variant="h5" className="mb-2">
            Notatka
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
                  size="small"
                  onClick={handleSaveNote}
                  color="success"
                  className="rounded-full border border-green-500 bg-green-50/50"
                  disabled={updateNoteMutation.isPending || !editNote}
                >
                  <Check />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={editNote ? 'Anuluj' : 'Edytuj notatkę'}>
              <IconButton
                size="small"
                onClick={() => {
                  if (editNote) {
                    handleCancelEdit();
                  } else {
                    setEditNote(true);
                  }
                }}
                color={!editNote ? 'primary' : 'inherit'}
                className={`rounded-lg border ${
                  editNote ? 'border-red-500 bg-red-50/50' : ''
                }`}
              >
                {editNote ? <Close className="text-red-400" /> : <EditNote />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <TextareaAutosize
          minRows={3}
          className={`rounded-sm border border-gray-400 bg-white px-2 py-1 ${
            editNote ? '' : 'bg-gray-100! opacity-50'
          }`}
          style={{ width: '100%', minHeight: '50px' }}
          placeholder="Dodaj notatkę..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          readOnly={updateNoteMutation.isPending || !editNote}
        />
        {updateNoteMutation.isPending && (
          <Typography variant="body2" color="text.secondary">
            Zapisywanie...
          </Typography>
        )}
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
      <Stack direction={'column'} spacing={2} mb={5}>
        <CountCard
          icon={<Person />}
          data={employees?.length ?? 0}
          title="Pracownicy:"
          onClick={handleEmployeesClick}
          tooltipTitle="Przejdź do listy pracowników"
        />
        <CountCard
          icon={<Construction />}
          data={constructions?.filter((c) => !c.endDate).length ?? 0}
          title="Budowy:"
          onClick={handleConstructionsClick}
          tooltipTitle="Przejdź do listy budów"
        />
      </Stack>
      <EmployeeAlerts />
      <Note />
      <Typography variant="h5" mb={2}>
        Lista plików
      </Typography>
      <FirebaseFileBrowser baseDirectory="general" />
    </PageContainer>
  );
};

export default Home;
