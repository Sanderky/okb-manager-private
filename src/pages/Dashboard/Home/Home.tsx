import {
  Card,
  Typography,
  Divider,
  Stack,
  Box,
  List,
  ListItem,
} from '@mui/material';
import PageContainer from '../../../components/PageContainer';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEmployeeList } from '../../../api/employees';
import { getConstructionList } from '../../../api/constructions';
import FirebaseFileBrowser from '../../../components/fileBrowser/FileBrowser';
import { useEmployeeAlert } from '../../../context/EmployeeAlertContext';
import { Done } from '@mui/icons-material';

interface CountCardProps {
  data: number;
  title: string;
  onClick?: () => void;
}

const CountCard = ({ data, title, onClick }: CountCardProps) => {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: '20px',
        width: '200px',
        height: '200px',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        },
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography
          gutterBottom
          variant="h5"
          component="div"
          sx={{ textAlign: 'center', width: '100%', paddingTop: '5px' }}
        >
          {title}
        </Typography>
      </Stack>
      <Divider />
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', fontSize: '5rem' }}
        >
          {data ?? '-'}
        </Typography>
      </Box>
    </Card>
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
          <Stack direction={'row'} spacing={1}>
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
                borderLeft:
                  alert.severity === 'warning'
                    ? '8px #ffa503 solid'
                    : '8px #ff4858 solid',
                alignItems: 'flex-start',
                background: alert.severity === 'error' ? '#ffe0e3' : '#ffdb9b',
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
          ))
        )}
      </List>
    </Box>
  );
};

const Home = () => {
  const navigate = useNavigate();

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
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
    <PageContainer
      breadcrumbs={[{ title: 'Strona główna' }]}
    >
      <Stack direction={'row'} spacing={5} mb={4}>
        <CountCard
          data={employees?.length ?? 0}
          title="Pracownicy"
          onClick={handleEmployeesClick}
        />
        <CountCard
          data={constructions?.length ?? 0}
          title="Budowy"
          onClick={handleConstructionsClick}
        />
      </Stack>
      <EmployeeAlerts />
      <FirebaseFileBrowser baseDirectory="general" />
    </PageContainer>
  );
};

export default Home;
