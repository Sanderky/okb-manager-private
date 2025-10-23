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

export const getScheduleByEmployeeAndWeek = async (
  employeeId: string,
  weekStart: Date
): Promise<Schedule | null> => {
  const weekStartTimestamp = Timestamp.fromDate(weekStart);
  const q = query(
    collection(db, 'schedules'),
    where('employeeId', '==', employeeId),
    where('weekStart', '==', weekStartTimestamp)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;

  return {
    id: querySnapshot.docs[0].id,
    ...querySnapshot.docs[0].data(),
  } as Schedule;
};
