import { useNavigate } from 'react-router-dom';
import PageContainer from '../../../shared/ui/PageContainer';
import { Button, Stack, Typography } from '@mui/material';

export const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <Stack direction={'column'} alignItems={'center'}>
        <Typography
          textAlign={'center'}
          variant="h5"
          component={'div'}
          sx={(theme) => ({ fontSize: '8rem', fontWeight: 'bold', color: theme.palette.secondary.main })}
        >
          404
        </Typography>
        <Typography
          textAlign={'center'}
          variant="body1"
          sx={{ fontSize: '1rem', fontWeight: 'bold' }}
        >
          Ups! Strona nie istnieje!
        </Typography>
        <Typography
          textAlign={'center'}
          variant="body1"
          color="textSecondary"
          sx={{ fontSize: '1rem' }}
        >
          Wygląda na to że strona której szukasz nie istnieje lub została
          usunięta.
        </Typography>
        <Stack
          direction={'row'}
          sx={{
            flexWrap: 'wrap',
            gap: 2,
            mt: 3,
          }}
        >
          <Button variant="outlined" onClick={() => navigate(-1)} color="inherit">
            Wróć
          </Button>
          <Button variant="contained" onClick={() => navigate('/home')} color="secondary">
            Strona główna
          </Button>
        </Stack>
      </Stack>
    </PageContainer>
  );
};