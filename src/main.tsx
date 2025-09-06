import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import { GlobalStyles } from '@mui/material';
import './styles/global.css';
import App from './App.tsx';
import './i18n.ts';

createRoot(document.getElementById('root')!).render(
  <StyledEngineProvider enableCssLayer>
    <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
    <StrictMode>
      <App />
    </StrictMode>
  </StyledEngineProvider>
);
