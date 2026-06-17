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
import 'dayjs/locale/pl';
import { getWeekNumber } from '@/shared/lib/date';
import WeekSelector from '@/shared/ui/WeekSelector';
import BaseDialog from '@/shared/ui/BaseDialog';
import { ExpandLess, ExpandMore, FilterList } from '@mui/icons-material';
import EmployeesContructionsFilters from '../EmployeesConstructionsFilters';
import { PrintReport } from './PrintReport';
import type { LangCode } from '@/shared/model/types';
import { Langs } from '@/shared/config/langCodes';
import { usePrintReportDialog } from '../../model/usePrintReport';

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

  return (
    <BaseDialog
      open={open}
      onClose={state.handleClose}
      title="Drukowanie raportu"
      showConfirm={false}
      actions={
        <Button
          onClick={state.handleSave}
          variant="contained"
          loading={state.reportLoading}
          disabled={state.isError}
        >
          Drukuj
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
            Tydzień początkowy nie może być później niż końcowy
          </Alert>
        )}

        <Typography sx={{ mb: 0.5 }}>Tydzień początkowy:</Typography>
        <WeekSelector
          value={state.startWeek}
          onChange={state.setStartWeek}
          comparisonDate={state.endWeek}
        />
        <Typography
          variant="caption"
          mt={0.5}
        >{`Tydzień ${getWeekNumber(state.startWeek)}`}</Typography>

        <Typography sx={{ mt: 2, mb: 0.5 }}>Tydzień końcowy:</Typography>
        <WeekSelector
          value={state.endWeek}
          onChange={state.setEndWeek}
          comparisonDate={state.startWeek}
        />
        <Typography
          variant="caption"
          mt={0.5}
        >{`Tydzień ${getWeekNumber(state.endWeek)}`}</Typography>

        <Typography sx={{ mt: 2 }}>
          Wybrane tygodnie: {state.weeks.length}
        </Typography>
        <Divider sx={{ mt: 2 }} flexItem />

        <Typography sx={{ mt: 1, mb: 2 }}>
          Filtruj budowy i pracowników
        </Typography>
        <Tooltip title="Filtry">
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
              Filtry {state.isFilterExpanded ? <ExpandLess /> : <ExpandMore />}
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
            label="Drukuj tytuł raportu"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={state.printTablesTitle}
                onChange={(e) => state.setPrintTablesTitle(e.target.checked)}
              />
            }
            label="Drukuj tytuły tabelek"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={state.showVacation}
                onChange={(e) => state.setShowVacation(e.target.checked)}
              />
            }
            label="Pokaż informacje o urlopach"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={state.omitEmpty}
                onChange={(e) => state.setOmitEmpty(e.target.checked)}
              />
            }
            label="Omijaj puste tygodnie"
          />

          <FormControl sx={{ mt: 2 }}>
            <Autocomplete
              size="small"
              options={Object.entries(Langs).map(([code, name]) => ({
                code,
                name,
              }))}
              getOptionLabel={(option) => option.name}
              value={
                Object.entries(Langs).find(([code]) => code === state.lang)
                  ? {
                      code: state.lang,
                      name: Langs[state.lang as keyof typeof Langs],
                    }
                  : null
              }
              onChange={(_, newValue) =>
                state.setLang((newValue?.code as LangCode) || 'pl-PL')
              }
              renderInput={(params) => (
                <TextField {...params} label="Język docelowy" />
              )}
            />
          </FormControl>
        </FormGroup>
      </Stack>
    </BaseDialog>
  );
};
