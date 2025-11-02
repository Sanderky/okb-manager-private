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
import type { Construction } from '../types';

export async function createConstruction(
  data: Partial<Construction> & { name: string }
) {
  if (!data.name || !data.startDate) {
    throw new Error('Nazwa i data rozpoczęcia są wymagane');
  }

  const constructionData: Omit<Construction, 'id'> = {
    ...(data.note !== undefined && { note: data.note }),
    name: data.name,
    location: data.location ?? null,
    contractor: data.contractor ?? null,
    startDate: data.startDate,
    endDate: data.endDate ?? null,
  };

  const docRef = await addDoc(
    collection(db, 'constructions'),
    constructionData
  );
  return docRef.id;
}

export async function updateConstruction(
  id: string,
  data: Partial<Construction>
): Promise<void> {
  const constructionRef = doc(db, 'constructions', id);
  await updateDoc(constructionRef, data);
}

export async function removeConstruction(id: string): Promise<void> {
  const constructionRef = doc(db, 'constructions', id);
  await deleteDoc(constructionRef);
}

export async function getConstructionList(): Promise<Construction[]> {
  const constructionsCol = collection(db, 'constructions');
  const constructionSnapshot = await getDocs(constructionsCol);

  const constructionsList = constructionSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      location: data.location ?? null,
      contractor: data.contractor ?? null,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate() ?? null,
      note: data.note ?? null,
    } as Construction;
  });

  return constructionsList;
}

export async function getConstruction(
  id: string
): Promise<Construction | null> {
  const constructionDoc = await getDoc(doc(db, 'constructions', id));
  if (constructionDoc.exists()) {
    const data = constructionDoc.data();
    return {
      id: constructionDoc.id,
      name: data.name,
      location: data.location ?? null,
      contractor: data.contractor ?? null,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate() ?? null,
      note: data.note ?? null,
    } as Construction;
  } else {
    return null;
  }
}
