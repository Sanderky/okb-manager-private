// api/schedule.ts
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Employee, Schedule } from '../types';
import dayjs from 'dayjs';

export const getScheduleList = async (): Promise<Schedule[]> => {
  const querySnapshot = await getDocs(collection(db, 'schedules'));
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      weekStart: (data.weekStart as Timestamp).toDate(),
    } as Schedule;
  });
};

export const getScheduleListForWeek = async (
  weekStart: Date
): Promise<Schedule[]> => {
  const weekStartTimestamp = Timestamp.fromDate(weekStart);
  const q = query(
    collection(db, 'schedules'),
    where('weekStart', '==', weekStartTimestamp)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      weekStart: (data.weekStart as Timestamp).toDate(),
    } as Schedule;
  });
};

export const updateSchedule = async (
  schedule: Omit<Schedule, 'id'> & { id?: string }
): Promise<void> => {
  const { id, ...data } = schedule;
  if (id) {
    await setDoc(doc(db, 'schedules', id), data);
  } else {
    const newDocRef = doc(collection(db, 'schedules'));
    await setDoc(newDocRef, data);
  }
};

export const getEmployeesByScheduledConstruction = async (
  constructionId: string,
  date?: Date
): Promise<Employee[]> => {
  const querySnapshot = await getDocs(collection(db, 'schedules'));

  const employeesSnapshot = await getDocs(collection(db, 'employees'));
  const employedEmployees = employeesSnapshot.docs
    .filter((doc) => doc.data().status === true)
    .map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Employee
    );

  const employeeIds = querySnapshot.docs
    .filter((doc) => {
      const data = doc.data();
      const hasConstruction = data.constructions?.some(
        (c: string | null) => c === constructionId
      );

      if (!date) {
        return hasConstruction;
      }

      if (hasConstruction) {
        const weekStart = dayjs(data.weekStart.toDate());
        const targetDate = dayjs(date);

        if (
          targetDate.isBetween(weekStart, weekStart.add(6, 'day'), 'day', '[]')
        ) {
          const dayIndex = targetDate.diff(weekStart, 'day');

          const constructionAtDay = data.constructions?.[dayIndex];
          return constructionAtDay === constructionId;
        }
      }

      return false;
    })
    .map((doc) => doc.data().employeeId);

  const uniqueEmployeeIds = [...new Set(employeeIds)];

  const employeesOnConstruction = employedEmployees.filter((employee) =>
    uniqueEmployeeIds.includes(employee.id)
  );

  return employeesOnConstruction;
};
