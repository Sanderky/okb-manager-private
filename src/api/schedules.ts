// api/schedule.ts
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
  writeBatch,
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
  date: Date
): Promise<Employee[]> => {
  const weekStart = dayjs(date).startOf('week');
  const weekStartTimestamp = Timestamp.fromDate(weekStart.toDate());

  const schedulesQuery = query(
    collection(db, 'schedules'),
    where('constructions', 'array-contains', constructionId),
    where('weekStart', '==', weekStartTimestamp)
  );

  const querySnapshot = await getDocs(schedulesQuery);

  const employeesQuery = query(
    collection(db, 'employees'),
    where('status', '==', true)
  );
  const employeesSnapshot = await getDocs(employeesQuery);

  const employeeIds = querySnapshot.docs
    .filter((doc) => {
      const data = doc.data();
      const weekStart = dayjs(data.weekStart.toDate());
      const targetDate = dayjs(date);
      const dayIndex = targetDate.diff(weekStart, 'day');

      return data.constructions?.[dayIndex] === constructionId;
    })
    .map((doc) => doc.data().employeeId);

  const uniqueEmployeeIds = [...new Set(employeeIds)];

  const employeesOnConstruction = employeesSnapshot.docs
    .filter((doc) => uniqueEmployeeIds.includes(doc.id))
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Employee[];

  return employeesOnConstruction;
};

export const removeEmployeeSchedules = async (
  employeeId: string
): Promise<number> => {
  const schedulesRef = collection(db, 'schedules');
  const schedulesQuery = query(
    schedulesRef,
    where('employeeId', '==', employeeId)
  );
  const schedulesSnapshot = await getDocs(schedulesQuery);

  if (schedulesSnapshot.size === 0) return 0;

  const batchSize = 500;
  const schedulesDocs = schedulesSnapshot.docs;
  let deletedCount = 0;

  for (let i = 0; i < schedulesDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = schedulesDocs.slice(i, i + batchSize);

    chunk.forEach((scheduleDoc) => {
      batch.delete(scheduleDoc.ref);
    });

    await batch.commit();
    deletedCount += chunk.length;
  }

  return deletedCount;
};
