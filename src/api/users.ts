import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export const syncUserToFirestore = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);

  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      uid: user.uid,
      preferences: null,
    });
  }
};
