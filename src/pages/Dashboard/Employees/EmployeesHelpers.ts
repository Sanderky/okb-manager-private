import type { Employee } from '../../../types';

export const sortEmployees = (employees: Employee[]): Employee[] => {
  return [...employees].sort((a, b) => {
    const getLastFirstName = (fullName: string) => {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length === 1) return ['', parts[0]];
      const lastName = parts.pop()!;
      const firstName = parts.join(' ');
      return [lastName.toLowerCase(), firstName.toLowerCase()];
    };

    const [aLastName, aFirstName] = getLastFirstName(a.name);
    const [bLastName, bFirstName] = getLastFirstName(b.name);

    if (aLastName < bLastName) return -1;
    if (aLastName > bLastName) return 1;

    if (aFirstName < bFirstName) return -1;
    if (aFirstName > bFirstName) return 1;

    return 0;
  });
};
