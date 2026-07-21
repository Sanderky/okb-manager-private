import { sortByLastName, type Employee } from "@/entities/employee";

export const sortEmployees = (employees: Employee[]): Employee[] => {
  return [...employees].sort((a, b) => sortByLastName(a.name, b.name));
};
