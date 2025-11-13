import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
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
} from '@mui/material';
import type { Construction, Employee, WorkHours } from '../../../types';
import 'dayjs/locale/pl';
import {
  getPreviousWeek,
  getStartOfWeek,
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

interface AddConstructionWithEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  currentWeek: Date;
  onSuccess: (newWorkHours: WorkHours) => void;
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
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const handleAdd = () => {
    if (!selectedConstruction || !selectedEmployee) return;

    const workHoursData: Omit<WorkHours, 'id'> = {
      constructionId: selectedConstruction,
      employeeId: selectedEmployee,
      weekStart: currentWeek,
      hours: [0, 0, 0, 0, 0, 0, 0],
    };

    const newWorkHours: WorkHours = {
      ...workHoursData,
      id: `${workHoursData.constructionId}_${workHoursData.employeeId}_${workHoursData.weekStart.getTime()}`,
    };

    onSuccess(newWorkHours);
    setSelectedConstruction('');
    setSelectedEmployee('');
    onClose();
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Dodaj nową budowę z pracownikiem"
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={
              !selectedConstruction ||
              !selectedEmployee ||
              availableConstructions.length === 0
            }
          >
            Dodaj
          </Button>
        </Stack>
      }
    >
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Wybierz budowę</InputLabel>
        <Select
          value={selectedConstruction}
          onChange={(e) => setSelectedConstruction(e.target.value)}
          label="Wybierz budowę"
        >
          {availableConstructions.map((construction) => (
            <MenuItem key={construction.id} value={construction.id}>
              {construction.name}
            </MenuItem>
          ))}
          {availableConstructions.length === 0 && (
            <MenuItem disabled key={"noConstructions"}>
              Wszystkie budowy są już dodane do tabeli
            </MenuItem>
          )}
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Wybierz pracownika</InputLabel>
        <Select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          label="Wybierz pracownika"
        >
          {employees?.map((employee) => (
            <MenuItem key={employee.id} value={employee.id}>
              {employee.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </BaseDialog>
  );
};

interface AddEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  selectedConstruction: Construction | null
  currentWeek: Date;
  onEmployeeAdded: (newWorkHours: WorkHours) => void;
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
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const handleAdd = () => {
    if (!selectedEmployee || !selectedConstruction) return;

    const workHoursData: Omit<WorkHours, 'id'> = {
      constructionId: selectedConstruction.id,
      employeeId: selectedEmployee,
      weekStart: currentWeek,
      hours: [0, 0, 0, 0, 0, 0, 0],
    };

    const newWorkHours: WorkHours = {
      ...workHoursData,
      id: `${workHoursData.constructionId}_${workHoursData.employeeId}_${workHoursData.weekStart.getTime()}`,
    };

    onEmployeeAdded(newWorkHours);
    setSelectedEmployee('');
    onClose();
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Dodaj pracownika do budowy: ${selectedConstruction?.name}`}
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={!selectedEmployee || availableEmployees.length === 0}
          >
            Dodaj
          </Button>
        </Stack>
      }
    >
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Wybierz pracownika</InputLabel>
        <Select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          label="Wybierz pracownika"
        >
          {availableEmployees.map((employee) => (
            <MenuItem key={employee.id} value={employee.id}>
              {employee.name}
            </MenuItem>
          ))}
          {availableEmployees.length === 0 && (
            <MenuItem disabled key={'noEmployees'}>
              Wszyscy pracownicy są już dodani do tej budowy
            </MenuItem>
          )}
        </Select>
      </FormControl>
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
  const [weekToCopy, setWeekToCopy] = useState<Date>(currentWeek);

  const handleSave = () => {
    handleCopyFromSourceWeek(weekToCopy);
    onClose();
  };

  const handleCopyFromPrevious = () => {
    handleCopyFromSourceWeek(getPreviousWeek(currentWeek));
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
      <Divider sx={{ mb: 4, mt: 4 }}>
        <Button onClick={handleCopyFromPrevious}>
          Lub kopiuj z poprzedniego
        </Button>
      </Divider>
      <Alert severity="info">
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
}

export const FiltersDialog = ({
  selectedConstructions,
  selectedEmployees,
  onSelectedConstructionsChange,
  onSelectedEmployeesChange,
  isOpen,
  onClose,
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
      />
    </BaseDialog>
  );
};

interface PrintReportDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PrintReportDialog: React.FC<PrintReportDialogProps> = ({
  open,
  onClose,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  const [startWeek, setStartWeek] = useState<Date>(getStartOfWeek(new Date()));
  const [endWeek, setEndWeek] = useState<Date>(getStartOfWeek(new Date()));

  const [isError, setIsError] = useState<boolean>(false);
  const [reportLoading, setReportLoading] = useState<boolean>(true);
  const [printTitle, setPrintTile] = useState<boolean>(true);
  const [printTablesTitle, setPrintTablesTitle] = useState<boolean>(true);
  const [omitEmpty, setOmitEmpty] = useState<boolean>(false);
  const [showVacation, setShowVacation] = useState<boolean>(true);
  const [lang, setLang] = useState<LangCode>('pl-PL');

  const [selectedConstructions, setSelectedConstructions] = useState<
    Construction[]
  >([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const weeks = getWeeksInRange(startWeek, endWeek);

  useEffect(() => {
    if (startWeek > endWeek) setIsError(true);
    else setIsError(false);
  }, [startWeek, endWeek]);

  const reset = () => {
    setStartWeek(getStartOfWeek(new Date()));
    setEndWeek(getStartOfWeek(new Date()));
    setPrintTile(true);
    setPrintTablesTitle(true);
    setOmitEmpty(false);
    setShowVacation(true);
    setIsError(false);
    setReportLoading(false);
    setLang('pl-PL');
    setSelectedConstructions([]);
    setSelectedEmployees([]);
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
    setSelectedEmployees(employees);
  };

  const handleSelectConstructions = (constructions: Construction[]) => {
    setSelectedConstructions(constructions);
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
          selectedConstructions={selectedConstructions}
          selectedEmployees={selectedEmployees}
        />
      </Box>

      <Stack direction={'column'} alignItems="flex-start">
        {isError && (
          <Alert sx={{ width: '100%', mb: 2 }} severity="error">
            Tydzień początkowy nie może być później niż końcowy
          </Alert>
        )}
        <Typography>Tydzień początkowy</Typography>
        <WeekSelector value={startWeek} onChange={setStartWeek} />
        <Typography sx={{ mt: 2 }}>Tydzień końcowy</Typography>
        <WeekSelector value={endWeek} onChange={setEndWeek} />

        <Typography sx={{ mt: 2 }}>Wybrane tygodnie: {weeks.length}</Typography>
        <Divider sx={{ mt: 2 }} flexItem />

        <Typography sx={{ mt: 1, mb: 2 }}>
          Filtruj budowy i pracowników
        </Typography>

        <Tooltip title="Filtry">
          <Badge
            color="primary"
            badgeContent={
              selectedConstructions.length + selectedEmployees.length
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
            className="border-lightGray mb-2 rounded-lg border bg-gray-50 p-2"
            sx={{
              width: '100%',
            }}
          >
            <EmployeesContructionsFilters
              selectedConstructions={selectedConstructions}
              selectedEmployees={selectedEmployees}
              onSelectedConstructionsChange={handleSelectConstructions}
              onSelectedEmployeesChange={handleSelectEmployees}
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
            <InputLabel id="report-lang-select-label">
              Język docelowy
            </InputLabel>
            <Select
              size="small"
              labelId="report-lang-select-label"
              id="report-lang-select"
              value={lang}
              label="Język docelowy"
              onChange={(e) => setLang(e.target.value)}
            >
              {Object.entries(Langs).map(([code, name]) => (
                <MenuItem key={code} value={code}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FormGroup>
      </Stack>
    </BaseDialog>
  );
};
