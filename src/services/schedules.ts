import { supabase } from '../supabase';
import type { ScheduleEntry, Employee } from '../types';
import dayjs, { Dayjs } from 'dayjs';

// --- Helpery ---

const toSqlDate = (date: Date | string| Dayjs) => dayjs(date).format('YYYY-MM-DD');

const mapToScheduleEntry = (row: any): ScheduleEntry => ({
  id: row.id,
  employeeId: row.employee_id,
  constructionId: row.construction_id,
  date: row.date,
  // JOINY:
  constructionName: row.constructions?.name,
  constructionActive: row.constructions?.status,
  employeeName: row.employees?.name,
  employeeActive: row.employees?.status,
});

// interface ScheduleRaw {
//   id: string;
//   employee_id: string;
//   construction_id: string;
//   date: string;
//   // Obiekty z JOIN-a (mogą być null, jeśli relacja jest uszkodzona, ale zazwyczaj są)
//   employees: { name: string; status: boolean } | null;
//   constructions: { name: string; status: boolean } | null;
// }

// --- Funkcje Serwisu ---

/**
 * Pobiera grafik dla zadanego zakresu dat.
 * Frontend sobie to zamieni na mapę dni.
 */
// export const getScheduleListForDateRange = async (
//   startDate: Date,
//   endDate: Date
// ): Promise<ScheduleEntry[]> => {
//   const { data, error } = await supabase
//     .from('daily_schedules')
//     .select('*')
//     .gte('date', toSqlDate(startDate))
//     .lte('date', toSqlDate(endDate));

//   if (error) throw error;
//   return data.map(mapToScheduleEntry);
// };
export const getScheduleListForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<ScheduleEntry[]> => {
  const { data, error } = await supabase
    .from('daily_schedules')
    .select(`
      *,
      employees ( name, status ),
      constructions ( name, status )
    `)
    .gte('date', toSqlDate(startDate))
    .lte('date', toSqlDate(endDate));

  if (error) throw error;
  return data.map(mapToScheduleEntry);
};

export const saveScheduleList = async (
  entries: { employeeId: string; date: Date; constructionId: string | null }[]
): Promise<void> => {
  if (entries.length === 0) return;

  // const toUpsert: any[] = [];
  // const toDeleteIds: string[] = []; // IDs to delete won't work well with composite keys, simpler to delete by params or handle nulls differently. 
  // W Supabase upsert działa, ale delete musi być osobno.
  
  // Strategia:
  // 1. constructionId !== null -> UPSERT
  // 2. constructionId === null -> DELETE
  
  const upserts = entries.filter(e => e.constructionId !== null).map(e => ({
      employee_id: e.employeeId,
      construction_id: e.constructionId,
      date: toSqlDate(e.date)
  }));

  // Dla usuwania musimy wywołać delete dla par (employee_id, date). 
  // Supabase nie ma prostego "delete where (col1, col2) in values".
  // Najprościej: usunąć wszystko z tego zakresu dla tego pracownika i wstawić nowe, 
  // ALE tutaj mamy mieszane dni.
  // Zróbmy pętlę promise'ów dla delete (będzie ich max 7 przy edycji tygodnia, więc luz).
  
  const deletes = entries.filter(e => e.constructionId === null);

  // Wykonaj UPSERTY
  if (upserts.length > 0) {
      const { error } = await supabase
          .from('daily_schedules')
          .upsert(upserts, { onConflict: 'employee_id, date' });
      if (error) throw error;
  }

  // Wykonaj DELETE (równolegle)
  if (deletes.length > 0) {
      const deletePromises = deletes.map(d => 
          supabase.from('daily_schedules')
            .delete()
            .eq('employee_id', d.employeeId)
            .eq('date', toSqlDate(d.date))
      );
      await Promise.all(deletePromises);
  }
};

/**
 * Zapisuje przypisanie pracownika do budowy na KONKRETNY DZIEŃ.
 * Jeśli constructionId jest null -> usuwa wpis.
 */
export const saveScheduleDay = async (
  employeeId: string,
  date: Date,
  constructionId: string | null
): Promise<void> => {
  const dateStr = toSqlDate(date);

  if (constructionId) {
    // UPSERT: Wstaw lub zaktualizuj
    const { error } = await supabase
      .from('daily_schedules')
      .upsert(
        {
          employee_id: employeeId,
          construction_id: constructionId,
          date: dateStr,
        },
        { onConflict: 'employee_id, date' } // Jeden pracownik = jedna budowa w danym dniu
      );
    if (error) throw error;
  } else {
    // DELETE: Usuń wpis
    const { error } = await supabase
      .from('daily_schedules')
      .delete()
      .eq('employee_id', employeeId)
      .eq('date', dateStr);

    if (error) throw error;
  }
};

/**
 * Usuwa wszystkie wpisy z grafiku dla pracownika.
 */
export const removeEmployeeSchedules = async (
  employeeId: string
): Promise<void> => {
  const { error } = await supabase
    .from('daily_schedules')
    .delete()
    .eq('employee_id', employeeId);

  if (error) throw error;
};

/**
 * ZWRACA LISTĘ PRACOWNIKÓW PRZYPISANYCH DO BUDÓW W DANYM DNIU.
 * To jest ta skomplikowana funkcja, teraz zoptymalizowana SQL-em.
 */

export const getEmployeesByScheduledConstruction = async (
  constructionIds: string[],
  date: Date
): Promise<{ constructionId: string; employees: Employee[] }[]> => {
  const dateStr = toSqlDate(date);

  if (constructionIds.length === 0) return [];

  // 1. Pobieramy wpisy z grafiku (tylko to wystarczy!)
  // Jeśli ktoś jest na urlopie, to mechanizm 'createVacation' już usunął jego wpis stąd.
  const { data: schedules, error } = await supabase
    .from('daily_schedules')
    .select(`
      construction_id,
      employee_id,
      employees (*) 
    `)
    .eq('date', dateStr)
    .in('construction_id', constructionIds);

  if (error) throw error;

  // 2. Grupujemy wyniki po budowie
  const resultBuilder: Record<string, Employee[]> = {};
  
  constructionIds.forEach(cid => {
    resultBuilder[cid] = [];
  });

  schedules.forEach((row: any) => {
    const empData = row.employees;
    
    // Sprawdzamy tylko, czy pracownik istnieje i jest aktywny
    if (!empData || !empData.status) {
        return;
    }

    // Mapowanie (bez zmian)
    const employee: Employee = {
      id: empData.id,
      name: empData.name,
      status: empData.status,
      isContractor: empData.is_contractor,
      pesel: empData.pesel,
      birthDate: empData.birth_date ? new Date(empData.birth_date) : null,
      address: empData.address,
      hourRate: empData.hour_rate,
      email: empData.email,
      phone: empData.phone,
      birthPlace: empData.birth_place,
      accountNumber: empData.account_number,
      note: empData.note,
      contractStartDate: empData.contract_start_date ? new Date(empData.contract_start_date) : null,
      contractEndDate: empData.contract_end_date ? new Date(empData.contract_end_date) : null,
      contractIsPermanent: empData.contract_is_permanent,
      a1StartDate: empData.a1_start_date ? new Date(empData.a1_start_date) : null,
      a1EndDate: empData.a1_end_date ? new Date(empData.a1_end_date) : null,
    };

    if (resultBuilder[row.construction_id]) {
      resultBuilder[row.construction_id].push(employee);
    }
  });

  return Object.entries(resultBuilder).map(([constructionId, employees]) => ({
    constructionId,
    employees,
  }));
};

// vacations check
// export const getEmployeesByScheduledConstruction = async (
//   constructionIds: string[],
//   date: Date
// ): Promise<{ constructionId: string; employees: Employee[] }[]> => {
//   const dateStr = toSqlDate(date);

//   if (constructionIds.length === 0) return [];

//   // 1. Pobieramy wpisy z grafiku OD RAZU z danymi pracownika (JOIN)
//   const { data: schedules, error } = await supabase
//     .from('daily_schedules')
//     .select(`
//       construction_id,
//       employee_id,
//       employees (*) 
//     `)
//     .eq('date', dateStr)
//     .in('construction_id', constructionIds);

//   if (error) throw error;

//   // 2. Pobieramy urlopy na ten dzień
//   const { data: vacations, error: vacError } = await supabase
//     .from('vacations')
//     .select('employee_id')
//     .lte('start_date', dateStr)
//     .gte('end_date', dateStr);

//   if (vacError) throw vacError;

//   const employeesOnVacation = new Set(vacations?.map((v) => v.employee_id));

//   // 3. Grupujemy wyniki po budowie
//   const resultBuilder: Record<string, Employee[]> = {};
  
//   constructionIds.forEach(cid => {
//     resultBuilder[cid] = [];
//   });

//   schedules.forEach((row: any) => {
//     const empData = row.employees;
    
//     // --- POPRAWKA TUTAJ ---
//     // Dodano warunek: !empData.status (jeśli status jest false/null, pomijamy)
//     if (!empData || !empData.status || employeesOnVacation.has(row.employee_id)) {
//         return;
//     }

//     const employee: Employee = {
//       id: empData.id,
//       name: empData.name,
//       status: empData.status,
//       isContractor: empData.is_contractor,
//       pesel: empData.pesel,
//       birthDate: empData.birth_date ? new Date(empData.birth_date) : null,
//       address: empData.address,
//       hourRate: empData.hour_rate,
//       email: empData.email,
//       phone: empData.phone,
//       birthPlace: empData.birth_place,
//       accountNumber: empData.account_number,
//       note: empData.note,
//       contractStartDate: empData.contract_start_date ? new Date(empData.contract_start_date) : null,
//       contractEndDate: empData.contract_end_date ? new Date(empData.contract_end_date) : null,
//       contractIsPermanent: empData.contract_is_permanent,
//       a1StartDate: empData.a1_start_date ? new Date(empData.a1_start_date) : null,
//       a1EndDate: empData.a1_end_date ? new Date(empData.a1_end_date) : null,
//     };

//     if (resultBuilder[row.construction_id]) {
//       resultBuilder[row.construction_id].push(employee);
//     }
//   });

//   return Object.entries(resultBuilder).map(([constructionId, employees]) => ({
//     constructionId,
//     employees,
//   }));
// };







// export const getEmployeesByScheduledConstruction = async (
//   constructionIds: string[],
//   date: Date
// ): Promise<{ constructionId: string; employees: Employee[] }[]> => {
//   const dateStr = toSqlDate(date);

//   if (constructionIds.length === 0) return [];

//   // 1. Pobieramy wpisy z grafiku OD RAZU z danymi pracownika (JOIN)
//   // To eliminuje potrzebę ręcznego pobierania tabeli employees i mapowania ID.
//   const { data: schedules, error } = await supabase
//     .from('daily_schedules')
//     .select(`
//       construction_id,
//       employee_id,
//       employees (*) 
//     `)
//     .eq('date', dateStr)
//     .in('construction_id', constructionIds);

//   if (error) throw error;

//   // 2. Pobieramy urlopy na ten dzień (żeby wykluczyć nieobecnych)
//   // Urlop musi trwać W TYM dniu (start <= date <= end)
//   const { data: vacations, error: vacError } = await supabase
//     .from('vacations')
//     .select('employee_id')
//     .lte('start_date', dateStr)
//     .gte('end_date', dateStr);

//   if (vacError) throw vacError;

//   // Tworzymy zbiór ID urlopowiczów dla szybkiego sprawdzania O(1)
//   const employeesOnVacation = new Set(vacations?.map((v) => v.employee_id));

//   // 3. Grupujemy wyniki po budowie
//   const resultBuilder: Record<string, Employee[]> = {};
  
//   // Inicjalizujemy puste tablice dla każdej budowy z zapytania
//   constructionIds.forEach(cid => {
//     resultBuilder[cid] = [];
//   });

//   schedules.forEach((row: any) => {
//     const empData = row.employees;
    
//     // Jeśli pracownika nie ma (bo usunięty) lub ma urlop -> pomijamy
//     if (!empData || employeesOnVacation.has(row.employee_id)) return;

//     // Mapujemy surowe dane z JOINa na nasz typ Employee
//     // (Możesz tu użyć mappera z employees.ts jeśli go wyeksportujesz)
//     const employee: Employee = {
//       id: empData.id,
//       name: empData.name,
//       status: empData.status,
//       isContractor: empData.is_contractor,
//       pesel: empData.pesel,
//       birthDate: empData.birth_date ? new Date(empData.birth_date) : null,
//       address: empData.address,
//       hourRate: empData.hour_rate,
//       email: empData.email,
//       phone: empData.phone,
//       birthPlace: empData.birth_place,
//       accountNumber: empData.account_number,
//       note: empData.note,
//       contractStartDate: empData.contract_start_date ? new Date(empData.contract_start_date) : null,
//       contractEndDate: empData.contract_end_date ? new Date(empData.contract_end_date) : null,
//       contractIsPermanent: empData.contract_is_permanent,
//       a1StartDate: empData.a1_start_date ? new Date(empData.a1_start_date) : null,
//       a1EndDate: empData.a1_end_date ? new Date(empData.a1_end_date) : null,
//     };

//     if (resultBuilder[row.construction_id]) {
//       resultBuilder[row.construction_id].push(employee);
//     }
//   });

//   // 4. Zwracamy w formacie oczekiwanym przez frontend
//   return Object.entries(resultBuilder).map(([constructionId, employees]) => ({
//     constructionId,
//     employees,
//   }));
// };


/**
 * Pobiera grafik dla danego tygodnia i grupuje go po pracownikach.
 * Zwraca strukturę, której oczekuje useHoursTable.
 */
// export const getScheduleListForWeek = async (weekStart: Date) => {
//   const startStr = toSqlDate(weekStart);
//   const endStr = toSqlDate(dayjs(weekStart).add(6, 'day'));

//   // 1. Pobieramy dane z JOIN-ami
//   const { data, error } = await supabase
//     .from('daily_schedules')
//     .select(`
//       id,
//       employee_id,
//       construction_id,
//       date,
//       employees ( name, status ),
//       constructions ( name, status )
//     `)
//     .gte('date', startStr)
//     .lte('date', endStr);

//   if (error) throw error;

//   // Rzutowanie na nasz typ pomocniczy
//   const rows = data as unknown as ScheduleRaw[];

//   // 2. Grupowanie danych per Pracownik
//   // Dzięki temu frontend dostanie gotową paczkę: Pracownik -> Lista jego budów w tygodniu
//   const grouped = new Map<string, {
//     employeeId: string;
//     employeeName: string;   // <--- Tu ląduje nazwa z JOINa
//     employeeActive: boolean; // <--- Tu ląduje status z JOINa
//     constructions: Array<{ 
//       id: string; 
//       name: string;        // <--- Nazwa budowy
//       active: boolean;     // <--- Status budowy
//       dayIndex: number     // 0-6 (Pon-Ndz)
//     }>
//   }>();

//   rows.forEach((row) => {
//     // Inicjalizacja grupy pracownika
//     if (!grouped.has(row.employee_id)) {
//       grouped.set(row.employee_id, {
//         employeeId: row.employee_id,
//         // Fallbacki na wypadek gdyby JOIN zwrócił null (np. pracownik usunięty fizycznie z bazy, ale ID zostało)
//         employeeName: row.employees?.name || 'Nieznany pracownik',
//         employeeActive: row.employees?.status ?? false,
//         constructions: []
//       });
//     }

//     const group = grouped.get(row.employee_id)!;
    
//     // Obliczamy index dnia tygodnia (0 dla daty weekStart)
//     const dayIndex = dayjs(row.date).diff(dayjs(weekStart), 'day');

//     if (dayIndex >= 0 && dayIndex < 7) {
//       group.constructions.push({
//         id: row.construction_id,
//         name: row.constructions?.name || 'Nieznana budowa',
//         active: row.constructions?.status ?? false,
//         dayIndex
//       });
//     }
//   });

//   return Array.from(grouped.values());
// };


export const getScheduleListForWeek = async (weekStart: Date) => {
  const startStr = dayjs(weekStart).format('YYYY-MM-DD');
  const endStr = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');

  const { data, error } = await supabase
    .from('daily_schedules')
    .select(`
      id,
      employee_id,
      construction_id,
      date,
      employees ( name, status ),
      constructions ( name, status )
    `)
    .gte('date', startStr)
    .lte('date', endStr);

  if (error) throw error;

  // Mapowanie wyników
  const rows = data;

  const grouped = new Map<string, {
    employeeId: string;
    employeeName: string;
    employeeActive: boolean;
    constructions: Array<{ id: string; name: string; active: boolean; dayIndex: number }>
  }>();

  rows.forEach((row: any) => {
    if (!grouped.has(row.employee_id)) {
      grouped.set(row.employee_id, {
        employeeId: row.employee_id,
        employeeName: row.employees?.name || 'Nieznany',
        employeeActive: row.employees?.status ?? false,
        constructions: []
      });
    }

    const group = grouped.get(row.employee_id)!;
    const dayIndex = dayjs(row.date).diff(dayjs(weekStart), 'day');

    if (dayIndex >= 0 && dayIndex < 7) {
      group.constructions.push({
        id: row.construction_id,
        name: row.constructions?.name || 'Nieznana',
        active: row.constructions?.status ?? false,
        dayIndex
      });
    }
  });

  return Array.from(grouped.values());
};