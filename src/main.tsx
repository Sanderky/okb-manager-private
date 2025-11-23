import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import { GlobalStyles } from '@mui/material';
import './styles/global.css';
import App from './App.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeeAlertProvider } from './context/EmployeeAlertContext.tsx';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import dayjs from 'dayjs';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <QueryClientProvider client={queryClient}>
        <EmployeeAlertProvider>
          <App />
        </EmployeeAlertProvider>
      </QueryClientProvider>
    </StyledEngineProvider>
  </StrictMode>
);
