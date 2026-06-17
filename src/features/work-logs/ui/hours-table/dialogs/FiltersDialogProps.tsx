import 'dayjs/locale/pl';
import BaseDialog from '@/shared/ui/BaseDialog';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';
import EmployeesContructionsFilters from '../../EmployeesConstructionsFilters';

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
  isOpen,
  onClose,
  ...filterProps
}: FiltersDialogProps) => (
  <BaseDialog
    open={isOpen}
    onClose={onClose}
    title="Filtry"
    showConfirm={false}
  >
    <EmployeesContructionsFilters {...filterProps} />
  </BaseDialog>
);
