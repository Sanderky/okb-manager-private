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
import type { Vacation } from '../types';

export async function createVacation(data: Vacation) {
  try {
    const newVacation: Vacation = {
      ...data,
    };
    const docRef = await addDoc(collection(db, 'vacations'), newVacation);
    return docRef.id;
  } catch (e) {
    console.error('Błąd podczas dodawania urlopu: ', e);
    throw e;
  }
}

export async function updateVacation(id: string, data: Partial<Vacation>) {
  try {
    const vacationRef = doc(db, 'vacations', id);
    await updateDoc(vacationRef, data);
  } catch (e) {
    console.error('Błąd podczas aktualizacji urlopu: ', e);
    throw e;
  }
}

export async function removeVacation(id: string) {
  try {
    await deleteDoc(doc(db, 'vacations', id));
  } catch (e) {
    console.error('Błąd podczas usuwania urlopu: ', e);
    throw e;
  }
}

export async function getVacationList(): Promise<Vacation[]> {
  const vacationCol = collection(db, 'vacations');
  const vacationSnapshot = await getDocs(vacationCol);
  return vacationSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
    } as Vacation;
  });
}

export async function getVacation(id: string): Promise<Vacation | null> {
  const vacationDoc = await getDoc(doc(db, 'vacations', id));
  if (vacationDoc.exists()) {
    return { id: vacationDoc.id, ...vacationDoc.data() } as Vacation;
  }
  return null;
}
