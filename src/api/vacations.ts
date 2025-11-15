import {
  collection,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  writeBatch,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Vacation } from '../types';
import dayjs from 'dayjs';

export const batchCreateVacations = async (
  employeeId: string,
  startDate: Date,
  endDate: Date,
  groupId: string,
  color: string, // kolor jest teraz obowiązkowy
  description?: string
) => {
  const batch = writeBatch(db);
  const vacationRef = collection(db, 'vacations');

  const currentDate = new Date(startDate.getTime());

  while (currentDate <= endDate) {
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const yearMonth = `${year}-${month}`;

    const newVacationDocument = {
      employeeId: employeeId,
      date: Timestamp.fromDate(new Date(currentDate)),
      yearMonth: yearMonth,
      groupId: groupId,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      description: description || '',
      color: color, // obowiązkowe
    };

    const newDocRef = doc(vacationRef);
    batch.set(newDocRef, newVacationDocument);

    currentDate.setDate(currentDate.getDate() + 1);
  }

  await batch.commit();
};

export async function createVacation(
  data: Partial<Vacation> | Partial<Vacation>[]
) {
  const dataArray = Array.isArray(data) ? data : [data];

  if (dataArray.length === 0) {
    return Array.isArray(data) ? [] : null;
  }

  const batch = writeBatch(db);
  const vacationRef = collection(db, 'vacations');
  const createdIds: string[] = [];

  dataArray.forEach((vacationData) => {
    const cleanedData = {
      ...vacationData,
      description: vacationData.description || '',
      color: vacationData.color,
    };
    const newDocRef = doc(vacationRef);
    batch.set(newDocRef, cleanedData);
    createdIds.push(newDocRef.id);
  });

  await batch.commit();

  return Array.isArray(data) ? createdIds : createdIds[0];
}

export async function updateVacationGroup(
  groupId: string,
  data: Partial<Vacation>
) {
  const { startDate, endDate, employeeId, color, description } = data;

  if (!startDate || !endDate || !employeeId || !color) {
    throw new Error('Missing required fields');
  }

  await removeVacation(groupId);

  await batchCreateVacations(
    employeeId,
    startDate,
    endDate,
    groupId,
    color,
    description
  );
}

export async function removeVacation(id: string) {
  const q = query(collection(db, 'vacations'), where('groupId', '==', id));
  const snapshot = await getDocs(q);

  const batchDeletions = snapshot.docs.map((d) =>
    deleteDoc(doc(db, 'vacations', d.id))
  );
  await Promise.all(batchDeletions);
}

export async function getVacationList(): Promise<Vacation[]> {
  const vacationSnapshot = await getDocs(collection(db, 'vacations'));
  return vacationSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: (data.date as Timestamp).toDate(),
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: (data.endDate as Timestamp).toDate(),
    } as Vacation;
  });
}

export async function getVacation(id: string): Promise<Vacation | null> {
  const vacationDoc = await getDoc(doc(db, 'vacations', id));
  if (vacationDoc.exists()) {
    const data = vacationDoc.data();
    return {
      id: vacationDoc.id,
      ...data,
      date: (data.date as Timestamp).toDate(),
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: (data.endDate as Timestamp).toDate(),
    } as Vacation;
  }
  return null;
}

export async function getVacationListForMonths(
  monthKeys: string[]
): Promise<Vacation[]> {
  if (!monthKeys.length) return [];

  const chunks = [];
  for (let i = 0; i < monthKeys.length; i += 10) {
    chunks.push(monthKeys.slice(i, i + 10));
  }

  const allVacations: Vacation[] = [];

  for (const chunk of chunks) {
    const q = query(
      collection(db, 'vacations'),
      where('yearMonth', 'in', chunk)
    );
    const snapshot = await getDocs(q);
    const chunkVacations = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: (data.date as Timestamp).toDate(),
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
      } as Vacation;
    });
    allVacations.push(...chunkVacations);
  }

  return allVacations;
}

export const getUpcomingVacationsForEmployee = async (
  employeeId: string
): Promise<Vacation[]> => {
  const now = dayjs();
  const oneMonthFromNow = now.add(1, 'month').endOf('day');

  const monthKeys: string[] = [];
  for (let i = -1; i < 2; i++) {
    const date = now.add(i, 'month');
    const month = date.month() + 1;
    const year = date.year();
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    monthKeys.push(monthKey);
  }

  const vacations = await getVacationListForMonths(monthKeys);

  const employeeVacations = vacations.filter(
    (vacation) => vacation.employeeId === employeeId
  );

  const uniqueVacations = employeeVacations.reduce((acc, vacation) => {
    if (!acc.has(vacation.groupId)) {
      acc.set(vacation.groupId, vacation);
    }
    return acc;
  }, new Map<string, Vacation>());

  const uniqueVacationsArray = Array.from(uniqueVacations.values());

  const filteredVacations = uniqueVacationsArray.filter((vacation) => {
    const startDate = dayjs(vacation.startDate);
    const endDate = dayjs(vacation.endDate);

    const isCurrent = now.isBetween(startDate, endDate, 'day', '[]');
    const isUpcoming =
      startDate.isAfter(now) && startDate.isBefore(oneMonthFromNow);

    return isCurrent || isUpcoming;
  });

  return filteredVacations;
};

export const removeEmployeeVacations = async (
  employeeId: string
): Promise<number> => {
  const vacationsRef = collection(db, 'vacations');
  const vacationsQuery = query(
    vacationsRef,
    where('employeeId', '==', employeeId)
  );
  const vacationsSnapshot = await getDocs(vacationsQuery);

  if (vacationsSnapshot.size === 0) return 0;

  const batchSize = 500;
  const vacationsDocs = vacationsSnapshot.docs;
  let deletedCount = 0;

  for (let i = 0; i < vacationsDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = vacationsDocs.slice(i, i + batchSize);

    chunk.forEach((vacationDoc) => {
      batch.delete(vacationDoc.ref);
    });

    await batch.commit();
    deletedCount += chunk.length;
  }

  return deletedCount;
};
