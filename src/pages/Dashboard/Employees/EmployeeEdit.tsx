import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate, useParams } from 'react-router';
import { getEmployee, updateEmployee } from '../../../api/employees';
import type { Employee } from '../../../types';
import EmployeeForm, {
  type FormFieldValue,
  type EmployeeFormState,
  validate,
} from './EmployeeForm';
import PageContainer from '../../../components/PageContainer';
import { Stack } from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function EmployeeEditForm({
  employee,
  onSubmit,
}: {
  employee: Employee;
  onSubmit: (
    formValues: Partial<EmployeeFormState['values']>
  ) => Promise<{ success: boolean; errors?: EmployeeFormState['errors'] }>;
}) {
  const [formState, setFormState] = React.useState<EmployeeFormState>(() => ({
    values: employee,
    errors: {},
  }));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleFormFieldChange = React.useCallback(
    (name: keyof EmployeeFormState['values'], value: FormFieldValue) => {
      setFormState((prevState) => ({
        ...prevState,
        values: { ...prevState.values, [name]: value },
        errors: { ...prevState.errors, [name]: undefined },
      }));
    },
    []
  );

  const handleFormReset = React.useCallback(() => {
    setFormState({ values: employee, errors: {} });
  }, [employee]);

  const handleFormSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitError(null);
      setIsSubmitting(true);

      const { success, errors } = await onSubmit(formState.values);

      if (!success) {
        setFormState((prev) => ({ ...prev, errors: errors || {} }));
        setSubmitError('Proszę poprawić błędy w formularzu.');
      }
      setIsSubmitting(false);
    },
    [onSubmit, formState.values]
  );

  return (
    <EmployeeForm
      formState={formState}
      onFieldChange={handleFormFieldChange}
      onSubmit={handleFormSubmit}
      onReset={handleFormReset}
      isSubmitting={isSubmitting}
      submitError={submitError}
    />
  );
}

export default function EmployeeEdit() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const loadData = React.useCallback(async () => {
    if (!employeeId) {
      setError(new Error('Brak ID pracownika.'));
      setIsLoading(false);
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const showData = await getEmployee(employeeId);
      if (showData) {
        setEmployee(showData);
      } else {
        setError(new Error('Nie znaleziono pracownika.'));
      }
    } catch (showDataError) {
      setError(showDataError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = React.useCallback(
    async (formValues: Partial<EmployeeFormState['values']>) => {
      const validationErrors = validate(formValues);
      if (Object.keys(validationErrors).length > 0) {
        return { success: false, errors: validationErrors };
      }

      if (!employeeId) {
        throw new Error('Brak ID pracownika do aktualizacji.');
      }

      try {
        await updateEmployee(employeeId, formValues);
        navigate(`/employees/${employeeId}`);
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
    },
    [employeeId, navigate]
  );

  const handleBack = React.useCallback(() => {
    navigate(`/employees/${employeeId}`);
  }, [navigate, employeeId]);

  const renderEdit = React.useMemo(() => {
    if (isLoading) {
      return (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadData}>
              Ponów
            </Button>
          }
        >
          {error.message}
        </Alert>
      );
    }

    return employee ? (
      <Box
        sx={{ width: '100%', maxWidth: { sm: '100%', md: '1790px' } }}
        className="border-lightGray rounded-lg border bg-white px-6 py-4"
      >
        <EmployeeEditForm employee={employee} onSubmit={handleSubmit} />
      </Box>
    ) : (
      <Alert severity="warning">Nie znaleziono danych pracownika.</Alert>
    );
  }, [isLoading, error, employee, handleSubmit, loadData]);

  const pageTitle = employee?.name || 'pracownika';

  return (
    <PageContainer
      title={`Edycja ${pageTitle}`}
      breadcrumbs={[
        { title: 'Pracownicy', path: '/employees' },
        {
          title: employee?.name || '...',
          path: `/employees/${employeeId}`,
        },
        { title: 'Edytuj' },
      ]}
      actions={
        <Stack direction="row" alignItems="center" spacing={3}>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Powrót
          </Button>
        </Stack>
      }
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>{renderEdit}</Box>
    </PageContainer>
  );
}
