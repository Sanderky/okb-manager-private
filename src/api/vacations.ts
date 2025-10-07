import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Vacation } from '../types';

export const batchCreateVacations = async (
  employeeId: string,
  startDate: Date,
  endDate: Date
) => {
  const batch = writeBatch(db);
  const vacationRef = collection(db, 'vacations');

  let currentDate = new Date(startDate.getTime());

  while (currentDate <= endDate) {
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const yearMonth = `${year}-${month}`;

    const newVacationDocument = {
      employeeId: employeeId,
      date: Timestamp.fromDate(new Date(currentDate)),
      yearMonth: yearMonth,
    };

    const newDocRef = doc(vacationRef);
    batch.set(newDocRef, newVacationDocument);

    currentDate.setDate(currentDate.getDate() + 1);
  }

  await batch.commit();
};

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

export async function getVacationListForMonths(
  monthKeys: string[]
): Promise<Vacation[]> {
  if (!monthKeys.length) return [];
  // Firestore 'in' obsługuje max 10 elementów
  const q = query(
    collection(db, 'vacations'),
    where('yearMonth', 'in', monthKeys)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Vacation
  );
}
