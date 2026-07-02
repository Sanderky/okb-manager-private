import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

const AppFooter = () => {
  const { t } = useTranslation('app');

  return (
    <footer>
      <Stack
        direction={'row'}
        justifyContent={'space-between'}
        sx={{
          pb: 1,
          px: 1,
          columnGap: 1,
          rowGap: 1,
        }}
        flexWrap={'wrap'}
      >
        <Typography
          sx={{
            fontSize: 'inherit',
            color: isMock ? 'red' : undefined,
          }}
        >
          {isMock ? t('footer.demoWarning') : t('footer.adminPanel')}
        </Typography>
        <Typography
          sx={{
            fontSize: 'inherit',
          }}
        >
          &copy; {new Date().getFullYear()},{' '}
          {isMock ? t('footer.demo') : import.meta.env.VITE_COMPANY_NAME}
        </Typography>
      </Stack>
    </footer>
  );
};

export default AppFooter;
