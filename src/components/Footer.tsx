import { Stack, Typography } from '@mui/material';

const AppFooter = () => {
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
          fontSize: { xs: '0.7rem', sm: '0.8rem' },
        }}
        flexWrap={'wrap'}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: 'inherit',
          }}
        >
          Panel administracyjny - dostęp tylko dla autoryzowanego personelu.
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: 'inherit',
          }}
        >
          &copy; {new Date().getFullYear()}, {import.meta.env.VITE_COMPANY_NAME}
        </Typography>
      </Stack>
    </footer>
  );
};

export default AppFooter;
