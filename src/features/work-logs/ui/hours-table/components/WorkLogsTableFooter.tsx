import {
  TableCell,
  TableRow,
  Button,
  Box,
  Typography,
  Tooltip,
  Stack,
  TableFooter,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import type { Construction } from '@/entities/construction';
import type { ConstructionsWithWorkHours } from '../../../model/types';
import { formatDecimal } from '@/shared/lib/format';
import { useTranslation } from 'react-i18next';

interface Props {
  availableConstructions: Construction[];
  editMode: boolean;
  onAddConstruction: () => void;
  hasUnsavedChanges: boolean;
  employeesCount: number;
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  totalHoursData: {
    dailyTotals: number[];
    grandTotal: number;
  };
}

export const WorkLogsTableFooter = ({
  availableConstructions,
  editMode,
  onAddConstruction,
  hasUnsavedChanges,
  employeesCount,
  constructionsWithWorkHours,
  totalHoursData,
}: Props) => {
  const { t } = useTranslation('workLogs');
  return (
    <TableFooter>
      <TableRow>
        <TableCell
          colSpan={9}
          sx={(theme) => ({
            position: 'sticky',
            bottom: -1,
            zIndex: 2,
            p: 0,
            pl: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
          })}
        >
          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            justifyContent={'space-between'}
            pl={1}
            py={1}
          >
            <Stack direction="row" alignItems="center" columnGap={3}>
              <Tooltip
                title={
                  availableConstructions.length === 0 && editMode
                    ? t('table.tooltips.noAvailableConstructions')
                    : ''
                }
              >
                <Box
                  component="span"
                  sx={{
                    order: editMode ? 1 : 4,
                  }}
                >
                  <Button
                    sx={{
                      visibility: editMode ? 'visible' : 'hidden',
                    }}
                    startIcon={<Add />}
                    onClick={onAddConstruction}
                    size="small"
                    variant="text"
                    color="primary"
                    disabled={availableConstructions.length === 0}
                  >
                    {t('actions.addConstruction')}
                  </Button>
                </Box>
              </Tooltip>

              {hasUnsavedChanges && (
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 500 }}
                  color="primary"
                  order={2}
                >
                  {t('table.unsavedChangesMark')}
                </Typography>
              )}

              <Stack
                direction="row"
                spacing={2}
                alignItems={'center'}
                divider={
                  <Box
                    sx={(theme) => ({
                      borderRight: `1px solid ${theme.palette.divider}`,
                      height: '15px',
                    })}
                  />
                }
                sx={{ order: 3 }}
              >
                <Typography
                  variant="overline"
                  color="textSecondary"
                  className="font-medium"
                >
                  {t('table.constructionsCount', {
                    count: constructionsWithWorkHours.length,
                  })}
                </Typography>
                <Typography
                  variant="overline"
                  color="textSecondary"
                  className="font-medium"
                >
                  {t('table.employeesCount', {
                    count: employeesCount,
                  })}
                </Typography>
              </Stack>
            </Stack>

            <Typography variant="overline" className="font-medium">
              {t('table.sum')}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell
          align="center"
          sx={(theme) => ({
            position: 'sticky',
            bottom: -1,
            p: 0,
            zIndex: 2,
            background: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Typography variant="overline" className="font-medium">
            {constructionsWithWorkHours.length > 0
              ? formatDecimal(totalHoursData.grandTotal)
              : '-'}
          </Typography>
        </TableCell>
      </TableRow>
    </TableFooter>
  );
};
