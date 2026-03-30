import React, { useState, useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pl';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';
import type { LocalAssignment, Lodging, LodgingAssignment } from './types';

export const useManageForm = (
  initialData: Lodging | undefined,
  open: boolean,
  onSubmit: (data: Partial<Lodging>) => void,
  constructions: Construction[],
  onDelete: (id: string) => void,
  onClose: () => void,
  employees: Employee[]
) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().add(1, 'week'));

  const [selectedConstruction, setSelectedConstruction] =
    useState<Construction | null>(null);

  const [assignments, setAssignments] = useState<LocalAssignment[]>([]);
  const [employeeToAdd, setEmployeeToAdd] = useState<Employee | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setAddress(initialData?.address || '');
      setDescription(initialData?.description || '');

      const sDate = initialData ? dayjs(initialData.startDate) : dayjs();
      const eDate = initialData
        ? dayjs(initialData.endDate)
        : dayjs().add(1, 'week');
      setStartDate(sDate);
      setEndDate(eDate);

      const foundConstruction = initialData?.constructionSiteId
        ? constructions.find((s) => s.id === initialData.constructionSiteId)
        : null;
      setSelectedConstruction(foundConstruction || null);

      if (initialData?.assignments) {
        setAssignments(
          initialData.assignments.map((a) => ({
            employeeId: a.employeeId,
            startDate: dayjs(a.startDate),
            endDate: dayjs(a.endDate),
          }))
        );
      } else {
        setAssignments([]);
      }
      setEmployeeToAdd(null);
    }
  }, [open, initialData, constructions]);

  const handleSubmit = () => {
    if (!startDate || !endDate) return;

    const assignmentsPayload: LodgingAssignment[] = assignments.map((a) => ({
      employeeId: a.employeeId,
      startDate: a.startDate.toDate(),
      endDate: a.endDate.toDate(),
    }));

    const employeeIds = assignments.map((a) => a.employeeId);

    onSubmit({
      name,
      address,
      description,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      employeeIds,
      assignments: assignmentsPayload,
      constructionSiteId: selectedConstruction?.id || null,
    });
  };

  const handleDelete = () => {
    if (initialData) {
      onClose();
      onDelete(initialData.id);
    }
  };

  const handleAddEmployee = () => {
    if (!employeeToAdd || !startDate || !endDate) return;

    if (assignments.some((a) => a.employeeId === employeeToAdd.id)) {
      return;
    }

    const newAssignment: LocalAssignment = {
      employeeId: employeeToAdd.id,
      startDate: startDate,
      endDate: endDate,
    };

    setAssignments([...assignments, newAssignment]);
    setEmployeeToAdd(null);
  };

  const handleRemoveAssignment = (empId: string) => {
    setAssignments(assignments.filter((a) => a.employeeId !== empId));
  };

  const handleAssignmentDateChange = (
    empId: string,
    field: 'startDate' | 'endDate',
    value: Dayjs | null
  ) => {
    if (!value) return;
    setAssignments(
      assignments.map((a) => {
        if (a.employeeId === empId) {
          return { ...a, [field]: value };
        }
        return a;
      })
    );
  };

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status),
    [employees]
  );

  const availableEmployees = useMemo(
    () =>
      activeEmployees.filter(
        (e) => !assignments.some((a) => a.employeeId === e.id)
      ),
    [activeEmployees, assignments]
  );

  return {
    availableEmployees,
    handleAddEmployee,
    handleAssignmentDateChange,
    handleRemoveAssignment,
    handleDelete,
    handleSubmit,
    selectedConstruction,
    setSelectedConstruction,
    name,
    setName,
    address,
    setAddress,
    description,
    setDescription,
    startDate,
    setStartDate,
    setEndDate,
    endDate,
    assignments,
    employeeToAdd,
    setEmployeeToAdd,
  };
};
