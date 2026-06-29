import type { Employee } from '@/entities/employee';
import type { ConstructionsWithWorkHours } from '../../../model/types';
import { WorkLogsTableRow } from './WorkLogsTableRow';
import React from 'react';
import { TableBody } from '@mui/material';

interface Props {
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  editMode: boolean;
  activeEmployees: Employee[];
  handleDeleteConstruction: (id: string, name: string) => void;
  handleDeleteEmployee: (id: string, empName: string, consName: string) => void;
  handleHoursChange: (
    id: string,
    dayIndex: number,
    value: string | number | null
  ) => void;
  handleOpenAddEmployeeDialog: (constructionId: string) => void;
}

const TableRows = React.memo(
  ({
    constructionsWithWorkHours,
    editMode,
    activeEmployees,
    handleDeleteConstruction,
    handleDeleteEmployee,
    handleHoursChange,
    handleOpenAddEmployeeDialog,
  }: Props) => {
    let globalRowIndex = 0;
    return constructionsWithWorkHours.map((construction) => {
      const startRowIndex = globalRowIndex;

      globalRowIndex += construction.workHours.length;
      return (
        <WorkLogsTableRow
          key={construction.id}
          construction={construction}
          startRowIndex={startRowIndex}
          editMode={editMode}
          activeEmployees={activeEmployees}
          handleDeleteConstruction={handleDeleteConstruction}
          handleDeleteEmployee={handleDeleteEmployee}
          handleHoursChange={handleHoursChange}
          handleOpenAddEmployeeDialog={handleOpenAddEmployeeDialog}
        />
      );
    });
  },
  (prev, next) => {
    return (
      prev.constructionsWithWorkHours === next.constructionsWithWorkHours &&
      prev.editMode === next.editMode &&
      prev.activeEmployees === next.activeEmployees
    );
  }
);

export const WorkLogsTableContent = (props: Props) => {
  return (
    <TableBody>
      <TableRows {...props} />
    </TableBody>
  );
};
