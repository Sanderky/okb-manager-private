import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { WorkHours } from '../types';

export const getWorkHoursList = async (
  weekStart: Date
): Promise<WorkHours[]> => {
  const weekStartTimestamp = Timestamp.fromDate(weekStart);

  const q = query(
    collection(db, 'workHours'),
    where('weekStart', '==', weekStartTimestamp)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    const weekStart = data.weekStart?.toDate?.() || new Date(data.weekStart);

    return {
      id: doc.id,
      ...data,
      weekStart,
    } as WorkHours;
  });
};

export const addWorkHours = async (
  workHours: Omit<WorkHours, 'id'>
): Promise<WorkHours> => {
  const weekStartTimestamp = Timestamp.fromDate(workHours.weekStart);

  const docId = `${workHours.constructionId}_${workHours.employeeId}_${workHours.weekStart.getTime()}`;

  await setDoc(doc(db, 'workHours', docId), {
    ...workHours,
    weekStart: weekStartTimestamp,
  });

  return {
    id: docId,
    ...workHours,
  } as WorkHours;
};

export const updateWorkHours = async (workHours: WorkHours): Promise<void> => {
  const weekStartTimestamp = Timestamp.fromDate(workHours.weekStart);

  await setDoc(doc(db, 'workHours', workHours.id), {
    ...workHours,
    weekStart: weekStartTimestamp,
  });
};

export const deleteWorkHours = async (workHoursId: string): Promise<void> => {
  await deleteDoc(doc(db, 'workHours', workHoursId));
};

export const deleteConstructionWorkHours = async (
  constructionId: string,
  weekStart: Date
): Promise<void> => {
  const weekStartTimestamp = Timestamp.fromDate(weekStart);

  const q = query(
    collection(db, 'workHours'),
    where('constructionId', '==', constructionId),
    where('weekStart', '==', weekStartTimestamp)
  );
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);

  querySnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};

export const removeWorkHoursByConstruction = async (
  constructionId: string
): Promise<void> => {
  const workHoursRef = collection(db, 'workHours');
  const workHoursQuery = query(
    workHoursRef,
    where('constructionId', '==', constructionId)
  );
  const workHoursSnapshot = await getDocs(workHoursQuery);

  if (workHoursSnapshot.size <= 500) {
    const batch = writeBatch(db);

    workHoursSnapshot.docs.forEach((workHourDoc) => {
      batch.delete(workHourDoc.ref);
    });

    const constructionRef = doc(db, 'constructions', constructionId);
    batch.delete(constructionRef);

    await batch.commit();
  } else {
    const batchSize = 500;
    const workHoursDocs = workHoursSnapshot.docs;

    for (let i = 0; i < workHoursDocs.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = workHoursDocs.slice(i, i + batchSize);

      chunk.forEach((workHourDoc) => {
        batch.delete(workHourDoc.ref);
      });

      await batch.commit();
    }
  }
};

export const removeEmployeeWorkHours = async (
  employeeId: string
): Promise<number> => {
  const workHoursRef = collection(db, 'workHours');
  const workHoursQuery = query(
    workHoursRef,
    where('employeeId', '==', employeeId)
  );
  const workHoursSnapshot = await getDocs(workHoursQuery);

  if (workHoursSnapshot.size === 0) return 0;

  const batchSize = 500;
  const workHoursDocs = workHoursSnapshot.docs;
  let deletedCount = 0;

  for (let i = 0; i < workHoursDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = workHoursDocs.slice(i, i + batchSize);

    chunk.forEach((workHourDoc) => {
      batch.delete(workHourDoc.ref);
    });

    await batch.commit();
    deletedCount += chunk.length;
  }

  return deletedCount;
};

export const copyFromPreviousWeek = async (
  currentWeek: Date,
  previousWeek: Date
): Promise<void> => {
  const batch = writeBatch(db);

  const currentWeekTimestamp = Timestamp.fromDate(currentWeek);
  const previousWeekTimestamp = Timestamp.fromDate(previousWeek);

  const currentWeekQuery = query(
    collection(db, 'workHours'),
    where('weekStart', '==', currentWeekTimestamp)
  );
  const currentWeekSnapshot = await getDocs(currentWeekQuery);

  currentWeekSnapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });

  const previousWeekQuery = query(
    collection(db, 'workHours'),
    where('weekStart', '==', previousWeekTimestamp)
  );
  const previousWeekSnapshot = await getDocs(previousWeekQuery);

  previousWeekSnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const newDocId = `${data.constructionId}_${data.employeeId}_${currentWeek.getTime()}`;
    const newDocRef = doc(db, 'workHours', newDocId);

    batch.set(newDocRef, {
      constructionId: data.constructionId,
      constructionName: data.constructionName,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      weekStart: currentWeekTimestamp,
      hours: data.hours,
      id: newDocId,
    });
  });

  await batch.commit();
};

export const deleteAllWorkHoursForWeek = async (
  weekStart: Date
): Promise<void> => {
  const weekStartTimestamp = Timestamp.fromDate(weekStart);

  const q = query(
    collection(db, 'workHours'),
    where('weekStart', '==', weekStartTimestamp)
  );
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);

  querySnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};
