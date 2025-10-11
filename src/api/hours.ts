
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import type {WorkHours } from '../types'

export const getWorkHoursList = async (weekStart: Date): Promise<WorkHours[]> => {
  const q = query(
    collection(db, 'workHours'),
    where('weekStart', '==', weekStart)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  } as WorkHours));
};

export const addWorkHours = async (workHours: Omit<WorkHours, 'id'>): Promise<void> => {
  const docId = `${workHours.constructionId}_${workHours.employeeId}_${workHours.weekStart.getTime()}`;
  await setDoc(doc(db, 'workHours', docId), workHours);
};

export const updateWorkHours = async (workHours: WorkHours): Promise<void> => {
  await setDoc(doc(db, 'workHours', workHours.id), workHours);
};

export const deleteWorkHours = async (workHoursId: string): Promise<void> => {
  await deleteDoc(doc(db, 'workHours', workHoursId));
};

export const deleteConstructionWorkHours = async (constructionId: string, weekStart: Date): Promise<void> => {
  const q = query(
    collection(db, 'workHours'),
    where('constructionId', '==', constructionId),
    where('weekStart', '==', weekStart)
  );
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  querySnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
};

export const copyFromPreviousWeek = async (currentWeek: Date, previousWeek: Date): Promise<void> => {
  const batch = writeBatch(db);
  
  const currentWeekQuery = query(
    collection(db, 'workHours'),
    where('weekStart', '==', currentWeek)
  );
  const currentWeekSnapshot = await getDocs(currentWeekQuery);
  
  currentWeekSnapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });
  
  const previousWeekQuery = query(
    collection(db, 'workHours'),
    where('weekStart', '==', previousWeek)
  );
  const previousWeekSnapshot = await getDocs(previousWeekQuery);
  
  previousWeekSnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const newDocId = `${data.constructionId}_${data.employeeId}_${currentWeek.getTime()}`;
    const newDocRef = doc(db, 'workHours', newDocId);
    
    batch.set(newDocRef, {
      constructionId: data.constructionId,
      employeeId: data.employeeId,
      weekStart: currentWeek,
      hours: data.hours,
      id: newDocId
    });
  });
  
  await batch.commit();
};