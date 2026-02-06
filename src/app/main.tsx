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
import { AuthProvider } from './context/AuthContext.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorPage from './pages/Error/ErrorPage.tsx';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: 60 * 1000 * 1,
      staleTime: 60 * 1000 * 10,
      refetchOnWindowFocus: true,

    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ErrorBoundary FallbackComponent={ErrorPage}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {/* <EmployeeAlertProvider> */}
              <App />
            {/* </EmployeeAlertProvider> */}
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StyledEngineProvider>
  </StrictMode>
);
