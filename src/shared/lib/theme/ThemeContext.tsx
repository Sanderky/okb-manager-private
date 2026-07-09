import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  createTheme,
  ThemeProvider,
  type PaletteMode,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useTranslation } from 'react-i18next';
import { getDesignTokens } from '../../config/theme';
import {
  DEFAULT_LANG,
  getShortLang,
  type LangCode,
} from '../../config/i18n/languages';
import { MUI_LOCALES } from '@/shared/config/i18n/resources';

interface ThemeContextType {
  toggleColorMode: () => void;
  mode: PaletteMode;
}

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

  const currentLangCode = useMemo(() => {
    const lang = i18n.language as LangCode;
    return MUI_LOCALES[lang] ? lang : DEFAULT_LANG;
  }, [i18n.language]);

  const shortLang = getShortLang(currentLangCode);

  const theme = useMemo(() => {
    const activeLocales = MUI_LOCALES[currentLangCode];
    return createTheme(getDesignTokens(mode), ...activeLocales);
  }, [mode, currentLangCode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale={shortLang}
        >
          <CssBaseline enableColorScheme />
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
