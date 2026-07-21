import { useMemo } from 'react';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add,
  AutoFixHigh,
  ContentCopy,
  ReportProblem,
} from '@mui/icons-material';
import type { Construction } from '@/entities/construction';
import { useTranslation } from 'react-i18next';

interface NoTableProps {
  isLoading: boolean;
  error: boolean;
  isFilling: boolean;
  isReadOnly: boolean;
  handleFillWithSchedule: () => Promise<void>;
  handleCopyDataDialogOpen: () => void;
  availableConstructions: Construction[];
  handleAddConstruction: () => void;
}

export const NoTable = ({
  error,
  isLoading,
  availableConstructions,
  isReadOnly,
  handleCopyDataDialogOpen,
  handleFillWithSchedule,
  handleAddConstruction,
}: NoTableProps) => {
  const { t } = useTranslation('workLogs');
  const content = useMemo(() => {
    if (error) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ReportProblem sx={{ color: 'red', fontSize: 40 }} />
          <Typography color="error" variant="body1" sx={{ fontWeight: '400' }}>
            {t('table.errorLoadingData')}
          </Typography>
        </Box>
      );
    }
    if (isLoading) {
      return <CircularProgress />;
    }
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          color="textSecondary"
          variant="body1"
          sx={{ fontWeight: '400' }}
        >
          {t('table.noData')}
        </Typography>
        {!isReadOnly && (
          <>
            <Button
              onClick={handleFillWithSchedule}
              loading={isLoading}
              variant="outlined"
              startIcon={<AutoFixHigh />}
              sx={{ mt: 2 }}
            >
              {t('actions.fillProposed')}
            </Button>
            <Button
              onClick={handleCopyDataDialogOpen}
              loading={isLoading}
              variant="outlined"
              startIcon={<ContentCopy />}
              sx={{ mt: 2 }}
            >
              {t('actions.copyFromOtherWeek')}
            </Button>
            <Tooltip
              title={
                availableConstructions.length === 0
                  ? t('tooltips.allConstructionsAdded')
                  : ''
              }
            >
              <span>
                <Button
                  startIcon={<Add />}
                  sx={{ mt: 2 }}
                  onClick={handleAddConstruction}
                  variant="contained"
                  color="primary"
                  disabled={availableConstructions.length === 0}
                >
                  {t('actions.addFirstConstruction')}
                </Button>
              </span>
            </Tooltip>
          </>
        )}
      </Box>
    );
  }, [
    isLoading,
    error,
    handleCopyDataDialogOpen,
    handleFillWithSchedule,
    handleAddConstruction,
    availableConstructions,
    isReadOnly,
    t,
  ]);

  return (
    <Box
      sx={(theme) => ({
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      {content}
    </Box>
  );
};
