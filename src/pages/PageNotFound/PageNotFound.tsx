import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/PageContainer';
import { Box, Button, Stack, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <Stack direction={'row'} justifyContent={'center'} sx={{ flex: 1 }}>
        <Box
          className="border-lightGray rounded-lg border"
          sx={{
            background: '#fff',
            maxHeight: '300px',
            maxWidth: '400px',
            display: 'flex',
            flexGrow: 1,
            p: 1,
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
          }}
        >
          <Box>
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
              Ups! Nie znaleziono strony
            </Typography>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/home')}
              sx={{ mt: 5 }}
              variant="text"
            >
              Wróć na stronę główną
            </Button>
          </Box>
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default PageNotFound;
