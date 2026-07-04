import React from 'react';
import {
  Button,
  Typography,
  FormControl,
  Alert,
  Stack,
  Divider,
  Box,
  FormGroup,
  Checkbox,
  FormControlLabel,
  Badge,
  Tooltip,
  Collapse,
  Autocomplete,
  TextField,
} from '@mui/material';
import { getWeekNumber } from '@/shared/lib/date';
import WeekSelector from '@/shared/ui/WeekSelector';
import BaseDialog from '@/shared/ui/BaseDialog';
import { ExpandLess, ExpandMore, FilterList } from '@mui/icons-material';
import EmployeesContructionsFilters from '../EmployeesConstructionsFilters';
import { PrintReport } from './PrintReport';
import { usePrintReportDialog } from '../../model/services/usePrintReport';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_LANG,
  LANGUAGES_CONFIG,
  REPORT_LANGUAGES,
  type LangCode,
} from '@/shared/config/languages';

interface PrintReportDialogProps {
  open: boolean;
  onClose: () => void;
  defaultStartWeek?: Date;
}

export const PrintReportDialog: React.FC<PrintReportDialogProps> = ({
  open,
  onClose,
  defaultStartWeek,
}) => {
  const state = usePrintReportDialog(defaultStartWeek, onClose);
  const { t } = useTranslation([
    'workLogs',
    'constructions',
    'employees',
    'common',
  ]);

  return (
    <BaseDialog
      open={open}
      onClose={state.handleClose}
      title={t('workLogs:dialogs.printReport.title')}
      showConfirm={false}
      actions={
        <Button
          onClick={state.handleSave}
          variant="contained"
          loading={state.reportLoading}
          disabled={state.isError}
        >
          {t('common:buttons.print')}
        </Button>
      }
    >
      <Box sx={{ display: 'none' }}>
        <PrintReport
          showVacation={state.showVacation}
          omitEmpty={state.omitEmpty}
          printTitle={state.printTitle}
          printTablesTitle={state.printTablesTitle}
          startWeek={state.startWeek}
          endWeek={state.endWeek}
          ref={state.printContentRef}
          onLoading={state.setReportLoading}
          lang={state.lang}
          selectedConstructions={state.selectedConstructionIds}
          selectedEmployees={state.selectedEmployeeIds}
        />
      </Box>

      <Stack direction="column" alignItems="flex-start">
        {state.isError && (
          <Alert sx={{ width: '100%', mb: 2 }} severity="error">
            {t('workLogs:dialogs.printReport.startWeekAfterEndWeek')}
          </Alert>
        )}

        <Typography sx={{ mb: 0.5 }}>
          {t('workLogs:dialogs.printReport.startWeek')}
        </Typography>
        <WeekSelector
          value={state.startWeek}
          onChange={state.setStartWeek}
          comparisonDate={state.endWeek}
        />
        <Typography
          variant="caption"
          mt={0.5}
        >{`${t('workLogs:dialogs.printReport.week')} ${getWeekNumber(state.startWeek)}`}</Typography>

        <Typography sx={{ mt: 2, mb: 0.5 }}>
          {t('workLogs:dialogs.printReport.endWeek')}
        </Typography>
        <WeekSelector
          value={state.endWeek}
          onChange={state.setEndWeek}
          comparisonDate={state.startWeek}
        />
        <Typography
          variant="caption"
          mt={0.5}
        >{`${t('workLogs:dialogs.printReport.week')} ${getWeekNumber(state.endWeek)}`}</Typography>

        <Typography sx={{ mt: 2 }}>
          {t('workLogs:dialogs.printReport.selectedWeeks', {
            weekCount: state.weeks.length,
          })}
        </Typography>
        <Divider sx={{ mt: 2 }} flexItem />

        <Typography sx={{ mt: 1, mb: 2 }}>
          {t('workLogs:dialogs.printReport.filterEmployeesAndConstructions')}
        </Typography>
        <Tooltip title={t('workLogs:dialogs.printReport.filters')}>
          <Badge
            color="primary"
            variant="dot"
            badgeContent={
              state.selectedConstructions.length +
                state.selectedEmployees.length >
              0
                ? 1
                : 0
            }
          >
            <Button
              size="small"
              startIcon={<FilterList />}
              onClick={() => state.setIsFilterExpanded(!state.isFilterExpanded)}
              sx={{ ml: 1 }}
            >
              {t('workLogs:dialogs.printReport.filters')}{' '}
              {state.isFilterExpanded ? <ExpandLess /> : <ExpandMore />}
            </Button>
          </Badge>
        </Tooltip>

        <Collapse
          in={state.isFilterExpanded}
          timeout="auto"
          sx={{ width: '100%' }}
        >
          <Box
            className="mb-2 rounded-lg p-2"
            sx={(theme) => ({
              width: '100%',
              background: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
            })}
          >
            <EmployeesContructionsFilters
              selectedConstructions={state.selectedConstructions}
              selectedEmployees={state.selectedEmployees}
              onSelectedConstructionsChange={state.handleSelectConstructions}
              onSelectedEmployeesChange={state.handleSelectEmployees}
              showInactiveConstructions={state.showInactiveConstructions}
              showInactiveEmployees={state.showInactiveEmployees}
              handleShowInactiveConstructionsChange={
                state.setShowInactiveConstructions
              }
              handleShowInactiveEmployeesChange={state.setShowInactiveEmployees}
              employees={state.allEmployees}
              constructions={state.allConstructions}
            />
          </Box>
        </Collapse>
        <Divider sx={{ mt: 2 }} flexItem />

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={state.printTitle}
                onChange={(e) => state.setPrintTile(e.target.checked)}
              />
            }
            label={t('workLogs:dialogs.printReport.printReportTitle')}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={state.printTablesTitle}
                onChange={(e) => state.setPrintTablesTitle(e.target.checked)}
              />
            }
            label={t('workLogs:dialogs.printReport.printTableTitles')}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={state.showVacation}
                onChange={(e) => state.setShowVacation(e.target.checked)}
              />
            }
            label={t('workLogs:dialogs.printReport.showVacationInfo')}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={state.omitEmpty}
                onChange={(e) => state.setOmitEmpty(e.target.checked)}
              />
            }
            label={t('workLogs:dialogs.printReport.avoidEmptyWeeks')}
          />

          <FormControl sx={{ mt: 2 }}>
            <Autocomplete
              size="small"
              options={REPORT_LANGUAGES.map((code) => LANGUAGES_CONFIG[code])}
              getOptionLabel={(option) => t(`common:${option.translationKey}`)}
              isOptionEqualToValue={(option, value) =>
                option.code === value.code
              }
              value={
                LANGUAGES_CONFIG[state.lang as LangCode] ||
                LANGUAGES_CONFIG[DEFAULT_LANG]
              }
              onChange={(_, newValue) =>
                state.setLang(newValue ? newValue.code : DEFAULT_LANG)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('workLogs:dialogs.printReport.sourceLanguage')}
                />
              )}
            />
          </FormControl>
        </FormGroup>
      </Stack>
    </BaseDialog>
  );
};
