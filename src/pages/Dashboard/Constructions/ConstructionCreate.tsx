import * as React from 'react';
import { useNavigate } from 'react-router';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import ConstructionForm, {
  type FormFieldValue,
  type ConstructionFormState,
} from './ConstructionForm';
import PageContainer from '../../../components/PageContainer';
import type { Construction } from '../../../types';
import { useTranslation } from 'react-i18next';
import { createConstruction } from '../../../api/constructions';
import { useConstructions } from '../../../hooks/useConstructions';


export default function ConstructionCreate() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {validate} = useConstructions()

  const notifications = useNotifications();

  const [formState, setFormState] = React.useState<ConstructionFormState>(() => ({
    values: {},
    errors: {},
  }));
  const formValues = formState.values;
  const formErrors = formState.errors;

  const setFormValues = React.useCallback(
    (newFormValues: Partial<ConstructionFormState['values']>) => {
      setFormState((previousState) => ({
        ...previousState,
        values: newFormValues,
      }));
    },
    [],
  );

  const setFormErrors = React.useCallback(
    (newFormErrors: Partial<ConstructionFormState['errors']>) => {
      setFormState((previousState) => ({
        ...previousState,
        errors: newFormErrors,
      }));
    },
    [],
  );

  const handleFormFieldChange = React.useCallback(
    (name: keyof ConstructionFormState['values'], value: FormFieldValue) => {
      const validateField = async (values: Partial<ConstructionFormState['values']>) => {
        const { issues } = validate(values);
        setFormErrors({
          ...formErrors,
          [name]: issues?.find((issue) => issue.path?.[0] === name)?.message,
        });
      };

      const newFormValues = { ...formValues, [name]: value };

      setFormValues(newFormValues);
      validateField(newFormValues);
    },
    [formValues, formErrors, setFormErrors, setFormValues, validate],
  );

  const handleFormReset = React.useCallback(() => {
    setFormValues({});
  }, [setFormValues]);

  const handleFormSubmit = React.useCallback(async () => {
    const { issues } = validate(formValues);
    if (issues && issues.length > 0) {
      setFormErrors(
        Object.fromEntries(issues.map((issue) => [issue.path?.[0], issue.message])),
      );
      return;
    }
    setFormErrors({});

    try {
      const constructionId = await createConstruction(formValues as Construction);
      notifications.show(t('constructions.createSuccess'), {
        severity: 'success',
        autoHideDuration: 3000,
      });

      navigate(`/constructions/${constructionId}`);
    } catch (createError) {
      notifications.show(
        `${t('constructions.createError')} ${(createError as Error).message}`,
        {
          severity: 'error',
          autoHideDuration: 3000,
        },
      );
      throw createError;
    }
  }, [formValues, navigate, notifications, setFormErrors, t, validate]);

  return (
    <PageContainer
      title={t("constructions.newConstructionCreation")}
      breadcrumbs={[{ title: t("constructions.constructions"), path: '/constructions' }, { title: t("constructions.newConstruction") }]}
    >
      <ConstructionForm
        formState={formState}
        onFieldChange={handleFormFieldChange}
        onSubmit={handleFormSubmit}
        onReset={handleFormReset}
        submitButtonLabel={t("form.create")}
      />
    </PageContainer>
  );
}
