import { Menu, MenuItem, ListItemIcon, type MenuProps } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import {
  LANGUAGES_CONFIG,
  UI_LANGUAGES,
  type LangCode,
} from '../config/languages';

interface LanguageSwitcherMenuProps extends MenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onLanguageChange?: () => void;
  open: boolean;
}

export const LanguageSwitcherMenu = ({
  anchorEl,
  onClose,
  open,
  onLanguageChange,
  ...rest
}: LanguageSwitcherMenuProps) => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode: LangCode) => {
    i18n.changeLanguage(langCode);
    onClose();
    onLanguageChange?.();
  };

  const currentLang = i18n.language;

  return (
    <>
      <Menu anchorEl={anchorEl} open={open} onClose={onClose} {...rest}>
        {UI_LANGUAGES.map((code) => {
          const lang = LANGUAGES_CONFIG[code];
          const isSelected = currentLang === lang.code;
          return (
            <MenuItem
              key={lang.code}
              selected={isSelected}
              onClick={() => handleLanguageChange(lang.code)}
              sx={{ minWidth: 150 }}
            >
              <ListItemIcon>
                {isSelected ? (
                  <CheckIcon fontSize="small" color="primary" />
                ) : null}
              </ListItemIcon>
              {lang.nativeName}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};
