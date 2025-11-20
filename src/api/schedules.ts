import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  documentId,
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
  constructionIds: string[],
  date: Date
): Promise<{ constructionId: string; employees: Employee[] }[]> => {
  const weekStart = dayjs(date).startOf('week');
  const weekStartTimestamp = Timestamp.fromDate(weekStart.toDate());
  const targetDate = dayjs(date);

  const schedulesQuery = query(
    collection(db, 'schedules'),
    where('weekStart', '==', weekStartTimestamp)
  );

  const querySnapshot = await getDocs(schedulesQuery);

  const constructionEmployeeMap: Record<string, Set<string>> = {};
  const allEmployeeIds = new Set<string>();

  constructionIds.forEach((cid) => {
    constructionEmployeeMap[cid] = new Set();
  });

  querySnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const scheduleWeekStart = dayjs(data.weekStart.toDate());
    const dayIndex = targetDate.diff(scheduleWeekStart, 'day');
    const todayConstructionId = data.constructions?.[dayIndex];

    if (todayConstructionId && constructionEmployeeMap[todayConstructionId]) {
      constructionEmployeeMap[todayConstructionId].add(data.employeeId);
      allEmployeeIds.add(data.employeeId);
    }
  });

  if (allEmployeeIds.size === 0) {
    return constructionIds.map((cid) => ({
      constructionId: cid,
      employees: [],
    }));
  }

  const uniqueEmployeeIds = Array.from(allEmployeeIds);

  const [employeesSnapshot, vacationSnapshot] = await Promise.all([
    getDocs(
      query(
        collection(db, 'employees'),
        where(documentId(), 'in', uniqueEmployeeIds)
      )
    ),
    getDocs(
      query(
        collection(db, 'vacations'),
        where(
          'date',
          '==',
          Timestamp.fromDate(dayjs(date).startOf('day').toDate())
        ),
        where('employeeId', 'in', uniqueEmployeeIds)
      )
    ),
  ]);

  const employeesMap = new Map(
    employeesSnapshot.docs.map((doc) => [
      doc.id,
      { id: doc.id, ...doc.data() } as Employee,
    ])
  );

  const vacationEmployeeIds = new Set(
    vacationSnapshot.docs.map((doc) => doc.data().employeeId)
  );

  const result = constructionIds.map((cid) => {
    const employeeIds = Array.from(constructionEmployeeMap[cid] || []);

    const employees = employeeIds
      .filter((id) => !vacationEmployeeIds.has(id) && employeesMap.has(id))
      .map((id) => employeesMap.get(id)!);

    return {
      constructionId: cid,
      employees,
    };
  });

  return result;
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
