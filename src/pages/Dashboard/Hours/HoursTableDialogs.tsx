import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
} from '@mui/material';
import type { WorkHours } from '../../../types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../api/employees';
import { getConstructionList } from '../../../api/constructions';
import 'dayjs/locale/pl';
import {
  getPreviousWeek,
  getStartOfWeek,
  getWeeksInRange,
} from './HoursHelpers';
import WeekSelector from '../../../components/WeekSelector';
import { addWorkHours } from '../../../api/hours';
import { useReactToPrint } from 'react-to-print';
import { PrintReport } from './PrintReport';
import dayjs from 'dayjs';
import {
  getReporTranslations,
  Langs,
  type LangCode,
} from './reportTranslations';

interface AddConstructionWithEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  currentWeek: Date;
  onSuccess: () => void;
  existingConstructionIds: string[];
}

export const AddConstructionWithEmployeeDialog: React.FC<
  AddConstructionWithEmployeeDialogProps
> = ({ open, onClose, currentWeek, onSuccess, existingConstructionIds }) => {
  const [selectedConstruction, setSelectedConstruction] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const { data: employees } = useQuery({
    queryKey: ['employees', true],
    queryFn: () => getEmployeeList(true),
  });

  const { data: constructions } = useQuery({
    queryKey: ['constructions'],
    queryFn: getConstructionList,
  });

  const queryClient = useQueryClient();

  const addWorkHoursMutation = useMutation({
    mutationFn: addWorkHours,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workHours', currentWeek.toISOString()],
      });
      onSuccess();
      setSelectedConstruction('');
      setSelectedEmployee('');
      onClose();
    },
  });

  const availableConstructions = useMemo(() => {
    return (
      constructions?.filter(
        (construction) => !existingConstructionIds.includes(construction.id)
      ) || []
    );
  }, [constructions, existingConstructionIds]);

  const handleAdd = () => {
    if (!selectedConstruction || !selectedEmployee) return;

    const workHoursData: Omit<WorkHours, 'id'> = {
      constructionId: selectedConstruction,
      employeeId: selectedEmployee,
      weekStart: currentWeek,
      hours: [0, 0, 0, 0, 0, 0, 0],
    };

    addWorkHoursMutation.mutate(workHoursData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Dodaj nową budowę z pracownikiem</DialogTitle>
      <DialogContent>
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
              <MenuItem disabled>
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
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          className="border-gray-400"
        >
          Anuluj
        </Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          loading={addWorkHoursMutation.isPending}
          disabled={
            !selectedConstruction ||
            !selectedEmployee ||
            availableConstructions.length === 0
          }
        >
          Dodaj
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface AddEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  constructionId: string;
  currentWeek: Date;
  onEmployeeAdded: () => void;
  existingEmployeeIds: string[];
}

export const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  open,
  onClose,
  constructionId,
  currentWeek,
  onEmployeeAdded,
  existingEmployeeIds,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const { data: employees } = useQuery({
    queryKey: ['employees', true],
    queryFn: () => getEmployeeList(true),
  });

  const { data: constructions } = useQuery({
    queryKey: ['constructions'],
    queryFn: getConstructionList,
  });

  const queryClient = useQueryClient();

  const addWorkHoursMutation = useMutation({
    mutationFn: addWorkHours,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workHours', currentWeek.toISOString()],
      });
      onEmployeeAdded();
      setSelectedEmployee('');
      onClose();
    },
  });

  const availableEmployees = useMemo(() => {
    return (
      employees?.filter(
        (employee) => !existingEmployeeIds.includes(employee.id)
      ) || []
    );
  }, [employees, existingEmployeeIds]);

  const handleAdd = () => {
    if (!selectedEmployee) return;

    const workHoursData: Omit<WorkHours, 'id'> = {
      constructionId: constructionId,
      employeeId: selectedEmployee,
      weekStart: currentWeek,
      hours: [0, 0, 0, 0, 0, 0, 0],
    };

    addWorkHoursMutation.mutate(workHoursData);
  };

  const construction = constructions?.find((c) => c.id === constructionId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Dodaj pracownika do budowy: {construction?.name}
      </DialogTitle>
      <DialogContent>
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
              <MenuItem disabled>
                Wszyscy pracownicy są już dodani do tej budowy
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="outlined"
          className="border-gray-400"
          color="inherit"
        >
          Anuluj
        </Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          loading={addWorkHoursMutation.isPending}
          disabled={
            !selectedEmployee ||
            addWorkHoursMutation.isPending ||
            availableEmployees.length === 0
          }
        >
          Dodaj
        </Button>
      </DialogActions>
    </Dialog>
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Kopiowanie danych</DialogTitle>
      <DialogContent>
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
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="outlined"
          className="border-gray-400"
          color="inherit"
        >
          Anuluj
        </Button>
        <Button onClick={handleSave} variant="contained">
          Kopiuj
        </Button>
      </DialogActions>
    </Dialog>
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

  const weeks = getWeeksInRange(startWeek, endWeek);

  const handleSave = () => {
    // setReportLoading(true)
    setTimeout(() => {
      reactToPrintFn();
      handleClose();
    }, 1000);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Drukowanie raportu</DialogTitle>
      <DialogContent>
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

          <Typography sx={{ mt: 2 }}>
            Wybrane tygodnie: {weeks.length}
          </Typography>

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
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          variant="outlined"
          className="border-gray-400"
          color="inherit"
        >
          Anuluj
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          loading={reportLoading}
          disabled={isError}
        >
          Drukuj
        </Button>
      </DialogActions>
    </Dialog>
  );
};
