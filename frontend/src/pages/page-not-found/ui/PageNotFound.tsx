import { useNavigate } from 'react-router-dom';
import PageContainer from '@/shared/ui/PageContainer';
import { Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export const PageNotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('app');

  return (
    <PageContainer>
      <Stack direction={'column'} alignItems={'center'}>
        <Typography
          textAlign={'center'}
          variant="h5"
          component={'div'}
          sx={(theme) => ({
            fontSize: '8rem',
            fontWeight: 'bold',
            color: theme.palette.secondary.main,
          })}
        >
          404
        </Typography>
        <Typography
          textAlign={'center'}
          variant="body1"
          sx={{ fontSize: '1rem', fontWeight: 'bold' }}
        >
          {t('pageNotFound.notExist')}
        </Typography>
        <Typography
          textAlign={'center'}
          variant="body1"
          color="textSecondary"
          sx={{ fontSize: '1rem' }}
        >
          {t('pageNotFound.pageDeletedInfo')}
        </Typography>
        <Stack
          direction={'row'}
          sx={{
            flexWrap: 'wrap',
            gap: 2,
            mt: 3,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            color="inherit"
          >
            {t('pageNotFound.goBack')}
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/home')}
            color="secondary"
          >
            {t('pageNotFound.mainPage')}
          </Button>
        </Stack>
      </Stack>
    </PageContainer>
  );
};
