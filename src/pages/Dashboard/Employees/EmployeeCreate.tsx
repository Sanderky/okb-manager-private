import * as React from 'react';
import { useNavigate } from 'react-router';
import EmployeeForm, {
  type EmployeeFormState,
  type FormFieldValue,
  validate,
} from './EmployeeForm';
import PageContainer from '../../../components/PageContainer';
import type { Employee } from '../../../types';
import { useTranslation } from 'react-i18next';
import { createEmployee } from '../../../api/employees';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { Box } from '@mui/material';

export default function EmployeeCreate() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const notifications = useNotifications();

  const [formState, setFormState] = React.useState<EmployeeFormState>({
    values: {
      status: true, // Domyślnie ustawiamy status na "Zatrudniony"
    },
    errors: {},
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleFieldChange = React.useCallback(
    (name: keyof EmployeeFormState['values'], value: FormFieldValue) => {
      setFormState((prevState) => ({
        ...prevState,
        values: { ...prevState.values, [name]: value },
        errors: { ...prevState.errors, [name]: undefined }, // Czyścimy błąd po zmianie
      }));
    },
    []
  );

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitError(null);

      const validationErrors = validate(formState.values);
      if (Object.keys(validationErrors).length > 0) {
        setFormState((prev) => ({ ...prev, errors: validationErrors }));
        setSubmitError('Proszę poprawić błędy w formularzu.');
        return;
      }

      setIsSubmitting(true);
      try {
        const employeeId = await createEmployee(formState.values as Employee);
        notifications.show('Pomyślnie utworzono pracownika.', {
          severity: 'success',
          autoHideDuration: 3000,
        });
        navigate(`/employees/${employeeId}`);
      } catch (createError) {
        const errorMessage = (createError as Error).message;
        setSubmitError(`Nie udało się utworzyć pracownika: ${errorMessage}`);
        notifications.show(`Błąd: ${errorMessage}`, {
          severity: 'error',
          autoHideDuration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState.values, navigate, notifications]
  );

  const handleReset = React.useCallback(() => {
    setFormState({ values: { status: true }, errors: {} });
  }, []);

  return (
    <PageContainer
      title={'Dodaj nowego pracownika'}
      breadcrumbs={[
        { title: 'Pracownicy', path: '/employees' },
        { title: 'Nowy' },
      ]}
    >
      <Box
        sx={{ width: '100%', maxWidth: { sm: '100%', md: '1790px' } }}
        className="border-lightGray rounded-lg border bg-white px-6 py-4"
      >
        <EmployeeForm
          formState={formState}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </Box>
    </PageContainer>
  );
}
