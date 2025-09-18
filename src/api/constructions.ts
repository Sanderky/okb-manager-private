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

export async function createConstruction(data: Construction) {
  try {
    const newConstruction: Construction = {
      ...data,
      inProgress: true,
    };
    const docRef = await addDoc(
      collection(db, 'constructions'),
      newConstruction
    );
    return docRef.id;
  } catch (e) {
    console.error('Błąd podczas dodawania dokumentu: ', e);
    throw e;
  }
}

export async function updateConstruction(
  id: string,
  data: Partial<Construction>
): Promise<void> {
  try {
    const constructionRef = doc(db, 'constructions', id);
    await updateDoc(constructionRef, data);
  } catch (e) {
    console.error('Błąd podczas aktualizacji dokumentu: ', e);
    throw e;
  }
}

export async function removeConstruction(id: string): Promise<void> {
  try {
    const constructionRef = doc(db, 'constructions', id);
    await deleteDoc(constructionRef);
  } catch (e) {
    console.error('Błąd podczas usuwania dokumentu: ', e);
    throw e;
  }
}

export async function getConstructionList(): Promise<Construction[]> {
  const constructionsCol = collection(db, 'constructions');
  const constructionSnapshot = await getDocs(constructionsCol);

  const constructionsList = constructionSnapshot.docs.map((doc) => {
    const docData = doc.data();
    return {
      id: doc.id,
      ...docData,
    } as Construction;
  });

  return constructionsList;
}

export async function getConstruction(
  id: string
): Promise<Construction | null> {
  const constructionDoc = await getDoc(doc(db, 'constructions', id));
  if (constructionDoc.exists()) {
    return {
      id: constructionDoc.id,
      ...constructionDoc.data(),
    } as Construction;
  } else {
    return null;
  }
}
