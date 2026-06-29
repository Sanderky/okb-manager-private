import { ConstructionForm } from '@/features/constructions';
import { useAddConstructionContext } from '../../model/providers/AddConstructionContext';

export function AddConstruction() {
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
      submitError={isError ? 'Wystąpił błąd podczas tworzenia budowy.' : null}
      isEditForm={false}
      registerFieldRef={registerFieldRef}
      onCancel={handleCancel}
    />
  );
}
