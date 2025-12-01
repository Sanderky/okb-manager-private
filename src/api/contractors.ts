import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'constructionContractors';

export const getContractors = async () => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as { id: string; name: string }[];
};

export const addContractor = async (name: string) => {
  return addDoc(collection(db, COLLECTION_NAME), { name });
};

export const updateContractor = async ({
  id,
  name,
}: {
  id: string;
  name: string;
}) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  return updateDoc(docRef, { name });
};

export const deleteContractor = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  return deleteDoc(docRef);
};
