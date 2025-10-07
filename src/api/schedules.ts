import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Schedule } from '../types';

export async function createSchedule(data: Schedule) {
  try {
    const newSchedule: Schedule = {
      ...data,
    };
    const docRef = await addDoc(collection(db, 'schedule'), newSchedule);
    return docRef.id;
  } catch (e) {
    console.error('Błąd podczas dodawania harmonogramu: ', e);
    throw e;
  }
}

export async function updateSchedule(id: string, data: Partial<Schedule>) {
  try {
    const scheduleRef = doc(db, 'schedule', id);
    await updateDoc(scheduleRef, data);
  } catch (e) {
    console.error('Błąd podczas aktualizacji harmonogramu: ', e);
    throw e;
  }
}

export async function removeSchedule(id: string) {
  try {
    await deleteDoc(doc(db, 'schedule', id));
  } catch (e) {
    console.error('Błąd podczas usuwania harmonogramu: ', e);
    throw e;
  }
}

export async function getScheduleList(): Promise<Schedule[]> {
  const scheduleCol = collection(db, 'schedule');
  const scheduleSnapshot = await getDocs(scheduleCol);
  return scheduleSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
    } as Schedule;
  });
}

export async function getSchedule(id: string): Promise<Schedule | null> {
  const scheduleDoc = await getDoc(doc(db, 'schedule', id));
  if (scheduleDoc.exists()) {
    return { id: scheduleDoc.id, ...scheduleDoc.data() } as Schedule;
  }
  return null;
}
