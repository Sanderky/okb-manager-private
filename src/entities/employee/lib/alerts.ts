import dayjs from "dayjs";

export const generateAlertMessage = (
  type: 'contract' | 'a1',
  days: number,
  dateStr: string
) => {
  const date = dayjs(dateStr).format('DD.MM.YYYY');
  const typeName = type === 'contract' ? 'Umowa' : 'A1';
  const dayWord = Math.abs(days) === 1 ? 'dzień' : 'dni';

  if (days < 0) {
    return `${typeName} wygasła ${Math.abs(days)} ${dayWord} temu (${date})`;
  }
  if (days === 0) {
    return `${typeName} wygasa dzisiaj!`;
  }
  return `${typeName} wygasa ${date} (za ${days} ${dayWord})`;
};

export const generateAlertTitle = (type: 'contract' | 'a1', name: string) => {
  return `${type === 'contract' ? 'Kończy się umowa' : 'Kończy się A1'} - ${name}`;
};