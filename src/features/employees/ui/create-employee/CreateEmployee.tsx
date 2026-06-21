import { useAddEmployeeContext } from '../../model/providers/useEmployeeCreateContext';
import { EmployeeForm } from '../EmployeeForm';

export function AddEmployee() {
  const {
    formState,
    handleFieldChange,
    handleSubmit,
    actionLoading,
    registerFieldRef,
  } = useAddEmployeeContext();

  return (
    <EmployeeForm
      formState={formState}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      isSubmitting={actionLoading}
      isEditForm={false}
      registerFieldRef={registerFieldRef}
    />
  );
}
