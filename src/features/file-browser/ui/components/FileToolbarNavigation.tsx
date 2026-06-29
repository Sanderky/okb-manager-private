import {
  Box,
  Stack,
  Typography,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import { ArrowBack, Check } from '@mui/icons-material';
import { FileBreadcrumbs } from './FileBreadcrumbs';
import { useTranslation } from 'react-i18next';

interface FileToolbarNavigationProps {
  isSelectionMode: boolean;
  selectedCount: number;
  totalElementsCount: number;
  onCancelSelection: () => void;
  currentPath: string;
  baseDirectory: string;
  onChangePath: (path: string) => void;
  employeesMap: Record<string, string>;
  constructionsMap: Record<string, string>;
}

export const FileToolbarNavigation = ({
  isSelectionMode,
  selectedCount,
  totalElementsCount,
  onCancelSelection,
  currentPath,
  baseDirectory,
  onChangePath,
  employeesMap,
  constructionsMap,
}: FileToolbarNavigationProps) => {
  const { t } = useTranslation(['fileBrowser', 'common']);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        paddingRight: '10px',
        gap: 1,
        maxWidth: '100%',
        pl: 1,
        py: 0.5,
        height: '40px',
        bgcolor: isSelectionMode ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
      }}
    >
      {isSelectionMode ? (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          sx={{ pr: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Check color="primary" sx={{ fontSize: 20 }} />
            <Typography variant="body2" fontWeight={500} color="primary.main">
              {t('navigation.selected', {
                selected: selectedCount,
                total: totalElementsCount,
              })}
            </Typography>
          </Stack>
          <Button
            size="small"
            onClick={onCancelSelection}
            sx={{ textTransform: 'none' }}
          >
            {t('common:buttons.cancel')}
          </Button>
        </Stack>
      ) : (
        <>
          <Tooltip title={t('common:buttons.back')}>
            <span>
              <IconButton
                size="small"
                disabled={currentPath === baseDirectory}
                onClick={() =>
                  onChangePath(
                    currentPath.substring(0, currentPath.lastIndexOf('/'))
                  )
                }
              >
                <ArrowBack fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <FileBreadcrumbs
            path={currentPath}
            baseDirectory={baseDirectory}
            onClick={(path) => onChangePath(path)}
            employeesMap={employeesMap}
            constructionsMap={constructionsMap}
          />
        </>
      )}
    </Box>
  );
};
