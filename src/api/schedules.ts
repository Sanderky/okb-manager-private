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
import type { Schedule } from '../types';

export const getScheduleList = async (): Promise<Schedule[]> => {
  const querySnapshot = await getDocs(collection(db, 'schedules'));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Schedule[];
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
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Schedule
  );
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
  constructionId: string
): Promise<string[]> => {
  const q = query(
    collection(db, 'schedules'),
    where('constructions', 'array-contains', constructionId)
  );
  const querySnapshot = await getDocs(q);

  const employeeIds = querySnapshot.docs.map((doc) => doc.data().employeeId);
  const uniqueEmployeeIds = [...new Set(employeeIds)];

  return uniqueEmployeeIds;
};
