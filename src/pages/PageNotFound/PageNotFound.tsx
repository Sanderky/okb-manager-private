import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/PageContainer';
import { Box, Button, Stack, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <Stack direction={'row'} justifyContent={'center'}>
        <Box
          sx={{
            borderRadius: '20px',
            background: '#fff',
            py: 6,
            px: 12,
          }}
        >
          <Typography
            textAlign={'right'}
            variant="h5"
            sx={{
              color: '#ffd85f',
              fontSize: '4rem',
            }}
          >
            404
          </Typography>
          <Typography variant="h5" textAlign={'left'} component={'div'}>
            Nie znaleziono dokumentu
          </Typography>
          <Typography
            variant="h5"
            textAlign={'left'}
            component={'div'}
            sx={{ mt: 1 }}
          >
            Wróć na stronę główną
          </Typography>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/home')}
            sx={{ width: 'min-content', mt: 5 }}
            variant="contained"
          >
            Wróć
          </Button>
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default PageNotFound;
