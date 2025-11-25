import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { HomeDocument } from '../types';

export const getHomeNote = async (): Promise<HomeDocument | null> => {
  const homeDocRef = doc(db, 'home', 'note');
  const docSnap = await getDoc(homeDocRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      note: data.note,
    };
  }
  return null;
};
