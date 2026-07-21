import { ConstructionForm } from '@/features/constructions';
import { useTranslation } from 'react-i18next';
import { useAddConstructionContext } from '../../model/providers/AddConstructionContext';

export function AddConstruction() {
  const { t } = useTranslation('constructions');
  const {
    formState,
    handleFieldChange,
    handleSubmit,
    handleCancel,
    actionLoading,
    isError,
    registerFieldRef,
  } = useAddConstructionContext();

  return (
    <ConstructionForm
      formState={formState}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      isSubmitting={actionLoading}
      submitError={isError ? t('notifications.createError') : null}
      isEditForm={false}
      registerFieldRef={registerFieldRef}
      onCancel={handleCancel}
    />
  );
}
