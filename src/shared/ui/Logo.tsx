import { default as LogoIcon } from '@mui/icons-material/TokenOutlined';
import { Typography } from '@mui/material';

export default function Logo() {
  return (
    <h1 className="inline-flex flex-row items-center justify-center font-medium">
      <LogoIcon className="text-3xl" />
      <div>
        <Typography
          component={'span'}
          className="text-3xl font-medium text-shadow-sm/20"
          sx={(theme) => ({
            color: theme.palette.secondary.main,
          })}
        >
          OKB
        </Typography>
        <Typography
          component={'span'}
          className="text-xl font-medium underline"
        >
          manager
        </Typography>
      </div>
    </h1>
  );
}
