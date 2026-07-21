export const sortByLastName = (a: string, b: string): number => {
  const getLastFirstName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
      return [parts[0].toLowerCase(), ''];
    } else {
      const lastName = parts.pop()!;
      const firstName = parts.join(' ');
      return [lastName.toLowerCase(), firstName.toLowerCase()];
    }
  };

  const [aLastName, aFirstName] = getLastFirstName(a);
  const [bLastName, bFirstName] = getLastFirstName(b);

  if (aLastName < bLastName) return -1;
  if (aLastName > bLastName) return 1;

  if (aFirstName < bFirstName) return -1;
  if (aFirstName > bFirstName) return 1;

  return 0;
};