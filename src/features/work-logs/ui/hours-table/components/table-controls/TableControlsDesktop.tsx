import {
  Button,
  Box,
  Typography,
  IconButton,
  Stack,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  ContentCopy,
  ChevronLeft,
  ChevronRight,
  Clear,
  ExpandLess,
  ExpandMore,
  Print,
  AutoFixHigh,
} from '@mui/icons-material';
import FilterListIcon from '@mui/icons-material/FilterList';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import WeekSelector from '@/shared/ui/WeekSelector';
import type { HoursTableControlsViewProps } from '../HoursTableControls';
import { useTranslation } from 'react-i18next';

dayjs.extend(isoWeek);

const HoursTableControlsDesktop = ({
  isLoading,
  currentWeek,
  handleWeekChange,
  handleToggleEditMode,
  readOnly,
  handleCopyDataDialogOpen,
  handleToggleExpand,
  editMode,
  isExpanded,
  isCoping,
  onTableDelete,
  showFilterBadge,
  handleCancelEdit,
  handleFillWithSchedule,
  setIsFilterOpen,
  hasUnsavedChanges,
  onPrint,
  isEmpty,
}: HoursTableControlsViewProps) => {
  const { t } = useTranslation(['workLogs', 'common']);

  return (
    <Box
      sx={(theme) => ({
        p: 1,
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: { xs: 'none', sm: 'flex' },
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
      })}
    >
      <Stack direction={'row'}>
        <Tooltip title={t('controls.previousWeek')}>
          <IconButton
            size="small"
            className="rounded-l-lg rounded-r-none border"
            color="primary"
            onClick={() => handleWeekChange('prev')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': { borderColor: theme.palette.primary.main },
            })}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('controls.currentWeek')}>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            className="rounded-none border-x-0"
            onClick={() => handleWeekChange('current')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': { borderColor: theme.palette.primary.main },
            })}
          >
            {t('controls.today')}
          </Button>
        </Tooltip>
        <Tooltip title={t('controls.nextWeek')}>
          <IconButton
            size="small"
            className="rounded-l-none rounded-r-lg border"
            color="primary"
            onClick={() => handleWeekChange('next')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': { borderColor: theme.palette.primary.main },
            })}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <WeekSelector
        disabled={isLoading}
        value={currentWeek}
        onChange={handleWeekChange}
      />

      <Tooltip title={t('controls.filters')}>
        <Badge
          color="primary"
          variant="dot"
          badgeContent={showFilterBadge ? 1 : 0}
        >
          <IconButton
            size="small"
            className="rounded-lg border"
            color="primary"
            onClick={() => setIsFilterOpen(true)}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': { borderColor: theme.palette.primary.main },
            })}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Badge>
      </Tooltip>

      {!readOnly &&
        (hasUnsavedChanges || !isEmpty) &&
        (editMode ? (
          <>
            <Button
              disabled={isLoading}
              size="small"
              variant={'contained'}
              onClick={() => {
                if (!isExpanded) handleToggleExpand();
                handleToggleEditMode();
              }}
            >
              {t('common:buttons.save')}
            </Button>
            <Button
              disabled={isLoading}
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => handleCancelEdit()}
              sx={{ color: 'inherit' }}
            >
              {t('common:buttons.cancel')}
            </Button>
          </>
        ) : (
          <Button
            disabled={isLoading}
            size="small"
            variant={'outlined'}
            sx={{ mr: 1 }}
            onClick={() => {
              if (!isExpanded) handleToggleExpand();
              handleToggleEditMode();
            }}
          >
            {t('common:buttons.edit')}
          </Button>
        ))}

      <Stack direction={'row'} gap={2} sx={{ ml: 'auto' }}>
        {!readOnly &&
          editMode && [
            <Tooltip key="copy" title={t('actions.copyFromOtherWeek')}>
              <span>
                <IconButton
                  disabled={isLoading || !editMode}
                  onClick={handleCopyDataDialogOpen}
                  loading={isCoping}
                  sx={{ p: 0 }}
                >
                  <ContentCopy />
                </IconButton>
              </span>
            </Tooltip>,
            <Tooltip key="fill" title={t('actions.fillProposed')}>
              <span>
                <IconButton
                  disabled={isLoading || !editMode}
                  onClick={handleFillWithSchedule}
                  loading={isCoping}
                  sx={{ p: 0 }}
                >
                  <AutoFixHigh />
                </IconButton>
              </span>
            </Tooltip>,
          ]}

        <Tooltip title={t('controls.printTable')}>
          <span>
            <IconButton
              disabled={isLoading}
              onClick={onPrint}
              loading={isLoading}
              sx={{ p: 0 }}
            >
              <Print />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip
          title={
            isExpanded ? t('controls.collapseTable') : t('controls.expandTable')
          }
        >
          <IconButton onClick={handleToggleExpand} sx={{ p: 0 }}>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Tooltip>

        {readOnly && onTableDelete && (
          <Tooltip title={t('controls.deleteComparisonTable')}>
            <span>
              <IconButton
                disabled={isLoading}
                onClick={onTableDelete}
                sx={{ p: 0 }}
              >
                <Clear />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>

      <Typography
        textTransform={'capitalize'}
        className="rounded-full border px-3 py-1 font-semibold"
        sx={{ borderColor: 'text.primary' }}
      >
        {t('controls.weekNumber', { week: dayjs(currentWeek).isoWeek() })}
      </Typography>
    </Box>
  );
};

export default HoursTableControlsDesktop;
