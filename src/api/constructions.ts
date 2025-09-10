import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import type { Construction } from "../types";

export async function createConstruction(data: Construction) {
   try {
    const newConstruction: Construction = {
      ...data,
      inProgress: true,
    }
    const docRef  = await addDoc(collection(db, "constructions"), newConstruction);
    return docRef.id;
  } catch (e) {
    console.error("Błąd podczas dodawania dokumentu: ", e);
  }
}

export async function getConstructions(): Promise<Construction[]> {
  const constructionsCol = collection(db, 'constructions');
  const constructionSnapshot = await getDocs(constructionsCol);

  const constructionsList = constructionSnapshot.docs.map(doc => {
    // 1. Pobierz dane dokumentu i dodaj do nich ID
    const docData = doc.data();
    return {
      id: doc.id,
      ...docData
    } as Construction;
  });

  return constructionsList;
}