import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  createTheme,
  ThemeProvider,
  type PaletteMode,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getDesignTokens } from '../../config/theme';
import { useTranslation } from 'react-i18next';
import { plPL as corePlPL } from '@mui/material/locale';
import { plPL as pickersPlPL } from '@mui/x-date-pickers/locales';

interface ThemeContextType {
  toggleColorMode: () => void;
  mode: PaletteMode;
}

const muiLocales: Record<string, any[]> = {
  pl: [corePlPL, pickersPlPL],
};

const ColorModeContext = createContext<ThemeContextType>({
  toggleColorMode: () => {},
  mode: 'light',
});

export const useColorMode = () => useContext(ColorModeContext);

export const ThemeContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { i18n } = useTranslation();
  const [mode, setMode] = useState<PaletteMode>(() => {
    try {
      const storedMode = localStorage.getItem('themeMode');
      return storedMode === 'dark' || storedMode === 'light'
        ? storedMode
        : 'light';
    } catch (e) {
      return 'light';
    }
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(() => {
    const currentLang = i18n.language
      ? i18n.language.substring(0, 2).toLowerCase()
      : 'pl';
    const activeLocales = muiLocales[currentLang] || muiLocales['pl'];

    return createTheme(getDesignTokens(mode), ...activeLocales);
  }, [mode, i18n.language]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
