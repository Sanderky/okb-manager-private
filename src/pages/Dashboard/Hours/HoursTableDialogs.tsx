import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Chip,
} from '@mui/material';
import type { Construction, Employee, WorkHours } from '../../../types';
import 'dayjs/locale/pl';
import {
  getPreviousWeek,
  getStartOfWeek,
  getWeekNumber,
  getWeeksInRange,
} from './HoursHelpers';
import WeekSelector from '../../../components/WeekSelector';
import { useReactToPrint } from 'react-to-print';
import { PrintReport } from './PrintReport';
import dayjs from 'dayjs';
import {
  getReporTranslations,
  Langs,
  type LangCode,
} from './reportTranslations';
import BaseDialog from '../../../components/BaseDialog';
import { ExpandLess, ExpandMore, FilterList } from '@mui/icons-material';
import EmployeesContructionsFilters from './EmployeesConstructionsFilters';
import { useQuery } from '@tanstack/react-query';
import { getConstructionList } from '../../../services/constructions';
import { getEmployeeList } from '../../../services/employees';

interface AddConstructionWithEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  currentWeek: Date;
  onSuccess: (newWorkHours: WorkHours[]) => void;
  availableConstructions: Construction[];
  activeEmployees: Employee[];
}

export const AddConstructionWithEmployeeDialog: React.FC<
  AddConstructionWithEmployeeDialogProps
> = ({
  open,
  onClose,
  currentWeek,
  onSuccess,
  availableConstructions,
  activeEmployees: employees,
}) => {
  const [selectedConstruction, setSelectedConstruction] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  const handleChangeEmployeeFilter = (
    _: React.SyntheticEvent<Element, Event>,
    newValue: Employee[]
  ) => {
    setSelectedEmployees(newValue);
  };

  const handleSelectAllEmployees = () => {
    setSelectedEmployees(employees || []);
  };

  const handleDeselectAllEmployees = () => {
    setSelectedEmployees([]);
  };

  const handleAdd = () => {
    if (!selectedConstruction || selectedEmployees.length === 0) return;

    const newWorkHoursArray: WorkHours[] = selectedEmployees.map((employee) => {
      const workHoursData: Omit<WorkHours, 'id'> = {
        constructionId: selectedConstruction,
        employeeId: employee.id,
        weekStart: currentWeek,
        hours: [null, null, null, null, null, null, null],
      };

      return {
        ...workHoursData,
        id: `${workHoursData.constructionId}_${workHoursData.employeeId}_${workHoursData.weekStart.getTime()}`,
      };
    });

    onSuccess(newWorkHoursArray);
    setSelectedConstruction('');
    setSelectedEmployees([]);
    onClose();
  };

  const isAllSelected = selectedEmployees.length === employees.length;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Dodaj nową budowę z pracownikami"
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={
              !selectedConstruction ||
              selectedEmployees.length === 0 ||
              availableConstructions.length === 0
            }
          >
            Dodaj ({selectedEmployees.length})
          </Button>
        </Stack>
      }
    >
      <FormControl fullWidth sx={{ mt: 2 }}>
        <Autocomplete
          size="small"
          value={
            availableConstructions.find((c) => c.id === selectedConstruction) ||
            null
          }
          onChange={(_, newValue) =>
            setSelectedConstruction(newValue?.id || '')
          }
          options={availableConstructions}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => (
            <TextField {...params} label="Wybierz budowę" />
          )}
          noOptionsText={
            availableConstructions.length === 0
              ? 'Wszystkie budowy są już dodane do tabeli'
              : 'Brak dostępnych opcji'
          }
        />
      </FormControl>

      <FormControl fullWidth sx={{ mt: 2 }}>
        <Autocomplete
          size="small"
          multiple
          options={employees || []}
          disableCloseOnSelect
          getOptionLabel={(option) => option.name}
          value={selectedEmployees}
          onChange={handleChangeEmployeeFilter}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checked={selected} />
                {option.name}
                {!option.status && (
                  <Chip
                    label="Nieaktywny"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Wybierz pracowników"
              placeholder={
                selectedEmployees.length === 0 ? 'Wybierz pracowników...' : ''
              }
            />
          )}
          noOptionsText="Brak dostępnych pracowników"
        />
      </FormControl>
      <Stack direction="row" mt={1} spacing={1} justifyContent={'flex-end'}>
        <Button onClick={handleSelectAllEmployees} disabled={isAllSelected}>
          Wszystko
        </Button>
        <Button onClick={handleDeselectAllEmployees}>Wyczyść</Button>
      </Stack>
    </BaseDialog>
  );
};

interface AddEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  selectedConstruction: Construction | null;
  currentWeek: Date;
  onEmployeeAdded: (newWorkHours: WorkHours[]) => void;
  availableEmployees: Employee[];
}

export const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  open,
  onClose,
  selectedConstruction,
  currentWeek,
  onEmployeeAdded,
  availableEmployees,
}) => {
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  const handleChangeEmployeeFilter = (
    _: React.SyntheticEvent<Element, Event>,
    newValue: Employee[]
  ) => {
    setSelectedEmployees(newValue);
  };

  const handleSelectAllEmployees = () => {
    setSelectedEmployees(availableEmployees);
  };

  const handleDeselectAllEmployees = () => {
    setSelectedEmployees([]);
  };

  const handleAdd = () => {
    if (selectedEmployees.length === 0 || !selectedConstruction) return;

    const newWorkHoursArray: WorkHours[] = selectedEmployees.map((employee) => {
      const workHoursData: Omit<WorkHours, 'id'> = {
        constructionId: selectedConstruction.id,
        employeeId: employee.id,
        weekStart: currentWeek,
        hours: [null, null, null, null, null, null, null],
      };

      return {
        ...workHoursData,
        id: `${workHoursData.constructionId}_${workHoursData.employeeId}_${workHoursData.weekStart.getTime()}`,
      };
    });

    onEmployeeAdded(newWorkHoursArray);
    setSelectedEmployees([]);
    onClose();
  };

  const isAllSelected = selectedEmployees.length === availableEmployees.length;
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Dodaj pracowników do budowy: ${selectedConstruction?.name}`}
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={selectedEmployees.length === 0}
          >
            Dodaj ({selectedEmployees.length})
          </Button>
        </Stack>
      }
    >
      <FormControl fullWidth sx={{ mt: 2 }}>
        <Autocomplete
          size="small"
          multiple
          options={availableEmployees}
          disableCloseOnSelect
          getOptionLabel={(option) => option.name}
          value={selectedEmployees}
          onChange={handleChangeEmployeeFilter}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checked={selected} />
                {option.name}
                {!option.status && (
                  <Chip
                    label="Nieaktywny"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Wybierz pracowników"
              placeholder={
                selectedEmployees.length === 0 ? 'Wybierz pracowników...' : ''
              }
            />
          )}
          noOptionsText={
            availableEmployees.length === 0
              ? 'Wszyscy pracownicy są już dodani do tej budowy'
              : 'Brak dostępnych opcji'
          }
        />
      </FormControl>
      <Stack direction="row" mt={1} spacing={1} justifyContent={'flex-end'}>
        <Button onClick={handleSelectAllEmployees} disabled={isAllSelected}>
          Wszystko
        </Button>
        <Button onClick={handleDeselectAllEmployees}>Wyczyść</Button>
      </Stack>
    </BaseDialog>
  );
};

interface CopyTableDialogProps {
  open: boolean;
  onClose: () => void;
  handleCopyFromSourceWeek: (sourceWeek: Date) => void;
  currentWeek: Date;
}

export const CopyTableDialog: React.FC<CopyTableDialogProps> = ({
  open,
  onClose,
  handleCopyFromSourceWeek,
  currentWeek,
}) => {
  const [weekToCopy, setWeekToCopy] = useState<Date>(
    getPreviousWeek(currentWeek)
  );

  useEffect(() => {
    if (open) {
      setWeekToCopy(getPreviousWeek(currentWeek));
    }
  }, [open, currentWeek]);

  const handleSave = () => {
    handleCopyFromSourceWeek(weekToCopy);
    onClose();
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Kopiowanie danych`}
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button onClick={handleSave} variant="contained">
            Kopiuj
          </Button>
        </Stack>
      }
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={{ xs: 2, sm: 1 }}
      >
        <Typography>Kopiuj dane z wybranego tygodnia:</Typography>
        <WeekSelector value={weekToCopy} onChange={setWeekToCopy} />
      </Stack>
      <Alert severity="info" sx={{ mt: 2 }}>
        Kopiowianie nadpisuje wszystkie dane w obecnym tygodniu
      </Alert>
    </BaseDialog>
  );
};

interface FiltersDialogProps {
  selectedConstructions: Construction[];
  onSelectedConstructionsChange: (constructions: Construction[]) => void;
  selectedEmployees: Employee[];
  onSelectedEmployeesChange: (employees: Employee[]) => void;
  isOpen: boolean;
  onClose: () => void;
  showInactiveEmployees: boolean;
  showInactiveConstructions: boolean;
  employees: Employee[];
  constructions: Construction[];
  handleShowInactiveConstructionsChange: (val: boolean) => void;
  handleShowInactiveEmployeesChange: (val: boolean) => void;
}

export const FiltersDialog = ({
  selectedConstructions,
  selectedEmployees,
  onSelectedConstructionsChange,
  onSelectedEmployeesChange,
  isOpen,
  onClose,
  showInactiveEmployees,
  showInactiveConstructions,
  employees,
  constructions,
  handleShowInactiveConstructionsChange,
  handleShowInactiveEmployeesChange,
}: FiltersDialogProps) => {
  return (
    <BaseDialog
      open={isOpen}
      onClose={onClose}
      title="Filtry"
      showConfirm={false}
    >
      <EmployeesContructionsFilters
        selectedConstructions={selectedConstructions}
        selectedEmployees={selectedEmployees}
        onSelectedConstructionsChange={onSelectedConstructionsChange}
        onSelectedEmployeesChange={onSelectedEmployeesChange}
        showInactiveConstructions={showInactiveConstructions}
        showInactiveEmployees={showInactiveEmployees}
        handleShowInactiveConstructionsChange={
          handleShowInactiveConstructionsChange
        }
        handleShowInactiveEmployeesChange={handleShowInactiveEmployeesChange}
        employees={employees}
        constructions={constructions}
      />
    </BaseDialog>
  );
};

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
  const printContentRef = useRef<HTMLDivElement>(null);

  const [startWeek, setStartWeek] = useState<Date>(
    defaultStartWeek ?? getPreviousWeek(new Date())
  );
  const [endWeek, setEndWeek] = useState<Date>(
    defaultStartWeek ?? getStartOfWeek(new Date())
  );

  const [isError, setIsError] = useState<boolean>(false);
  const [reportLoading, setReportLoading] = useState<boolean>(true);
  const [printTitle, setPrintTile] = useState<boolean>(true);
  const [printTablesTitle, setPrintTablesTitle] = useState<boolean>(true);
  const [omitEmpty, setOmitEmpty] = useState<boolean>(false);
  const [showVacation, setShowVacation] = useState<boolean>(true);
  const [lang, setLang] = useState<LangCode>('pl-PL');

  const [selectedConstructionIds, setSelectedConstructionIds] = useState<
    string[]
  >([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const [showInactiveEmployees, setShowInactiveEmployees] = useState(false);
  const [showInactiveConstructions, setShowInactiveConstructions] =
    useState(false);

  const { data: allEmployees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const { data: allConstructions = [] } = useQuery({
    queryKey: ['constructions'],
    queryFn: () => getConstructionList(),
  });

  const selectedConstructions = useMemo(
    () =>
      allConstructions.filter((c) => selectedConstructionIds.includes(c.id)),
    [allConstructions, selectedConstructionIds]
  );

  const selectedEmployees = useMemo(
    () => allEmployees.filter((e) => selectedEmployeeIds.includes(e.id)),
    [allEmployees, selectedEmployeeIds]
  );

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const weeks = getWeeksInRange(startWeek, endWeek);

  useEffect(() => {
    if (defaultStartWeek) {
      setStartWeek(defaultStartWeek);
      setEndWeek(defaultStartWeek);
    }
  }, [defaultStartWeek]);

  useEffect(() => {
    if (startWeek > endWeek) setIsError(true);
    else setIsError(false);
  }, [startWeek, endWeek]);

  const reset = () => {
    setStartWeek(defaultStartWeek ?? getStartOfWeek(new Date()));
    setEndWeek(defaultStartWeek ?? getStartOfWeek(new Date()));
    setPrintTile(true);
    setPrintTablesTitle(true);
    setOmitEmpty(false);
    setShowVacation(true);
    setIsError(false);
    setReportLoading(false);
    setLang('pl-PL');
    setSelectedConstructionIds([]);
    setSelectedEmployeeIds([]);
    setShowInactiveEmployees(false);
    setShowInactiveConstructions(false);
    setIsFilterExpanded(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const reportTranslations = getReporTranslations(lang);

  const reactToPrintFn = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: `${reportTranslations.fileNamePrefix}${dayjs(startWeek).format('DD.MM.YYYY')}_${dayjs(endWeek).add(6, 'days').format('DD.MM.YYYY')}`,
    pageStyle: `
    @page {
      margin: 10mm;
    }`,
  });

  const handleSave = () => {
    setTimeout(() => {
      reactToPrintFn();
      handleClose();
    }, 1000);
  };

  const handleSelectEmployees = (employees: Employee[]) => {
    setSelectedEmployeeIds(employees.map((e) => e.id));
  };

  const handleSelectConstructions = (constructions: Construction[]) => {
    setSelectedConstructionIds(constructions.map((c) => c.id));
  };

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title={`Drukowanie raportu`}
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleSave}
            variant="contained"
            loading={reportLoading}
            disabled={isError}
          >
            Drukuj
          </Button>
        </Stack>
      }
    >
      <Box sx={{ display: 'none' }}>
        <PrintReport
          showVacation={showVacation}
          omitEmpty={omitEmpty}
          printTitle={printTitle}
          printTablesTitle={printTablesTitle}
          startWeek={startWeek}
          endWeek={endWeek}
          ref={printContentRef}
          onLoading={(isLoading: boolean) => setReportLoading(isLoading)}
          lang={lang}
          selectedConstructions={selectedConstructionIds}
          selectedEmployees={selectedEmployeeIds}
        />
      </Box>

      <Stack direction={'column'} alignItems="flex-start">
        {isError && (
          <Alert sx={{ width: '100%', mb: 2 }} severity="error">
            Tydzień początkowy nie może być później niż końcowy
          </Alert>
        )}
        <Typography sx={{ mb: 0.5 }}>Tydzień początkowy:</Typography>
        <WeekSelector
          value={startWeek}
          onChange={setStartWeek}
          comparisonDate={endWeek}
        />
        <Typography
          variant="caption"
          mt={0.5}
        >{`Tydzień ${getWeekNumber(startWeek)}`}</Typography>

        <Typography sx={{ mt: 2, mb: 0.5 }}>Tydzień końcowy:</Typography>
        <WeekSelector
          value={endWeek}
          onChange={setEndWeek}
          comparisonDate={startWeek}
        />
        <Typography
          variant="caption"
          mt={0.5}
        >{`Tydzień ${getWeekNumber(endWeek)}`}</Typography>

        <Typography sx={{ mt: 2 }}>Wybrane tygodnie: {weeks.length}</Typography>
        <Divider sx={{ mt: 2 }} flexItem />

        <Typography sx={{ mt: 1, mb: 2 }}>
          Filtruj budowy i pracowników
        </Typography>

        <Tooltip title="Filtry">
          <Badge
            color="primary"
            variant="dot"
            badgeContent={
              selectedConstructions.length + selectedEmployees.length > 0
                ? 1
                : 0
            }
          >
            <Button
              size="small"
              startIcon={<FilterList />}
              onClick={() => setIsFilterExpanded((prev) => !prev)}
              sx={{
                ml: 1,
              }}
            >
              Filtry
              {isFilterExpanded ? <ExpandLess /> : <ExpandMore />}
            </Button>
          </Badge>
        </Tooltip>

        <Collapse
          in={isFilterExpanded}
          timeout="auto"
          sx={{
            width: '100%',
          }}
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
              selectedConstructions={selectedConstructions}
              selectedEmployees={selectedEmployees}
              onSelectedConstructionsChange={handleSelectConstructions}
              onSelectedEmployeesChange={handleSelectEmployees}
              showInactiveConstructions={showInactiveConstructions}
              showInactiveEmployees={showInactiveEmployees}
              handleShowInactiveConstructionsChange={
                setShowInactiveConstructions
              }
              handleShowInactiveEmployeesChange={setShowInactiveEmployees}
              employees={allEmployees}
              constructions={allConstructions}
            />
          </Box>
        </Collapse>

        <Divider sx={{ mt: 2 }} flexItem />

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={printTitle}
                onChange={(e) => setPrintTile(e.target.checked)}
              />
            }
            label="Drukuj tytuł raportu"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={printTablesTitle}
                onChange={(e) => setPrintTablesTitle(e.target.checked)}
              />
            }
            label="Drukuj tytuły tabelek"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showVacation}
                onChange={(e) => setShowVacation(e.target.checked)}
              />
            }
            label="Pokaż informacje o urlopach"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={omitEmpty}
                onChange={(e) => setOmitEmpty(e.target.checked)}
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
                Object.entries(Langs).find(([code]) => code === lang)
                  ? { code: lang, name: Langs[lang as keyof typeof Langs] }
                  : null
              }
              onChange={(_, newValue) =>
                setLang((newValue?.code as LangCode) || 'pl-PL')
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
