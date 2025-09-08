import { collection, addDoc } from "firebase/firestore";
import { db } from '../firebase';
import type { Construction } from "../types";

export async function createConstruction(data: Construction) {
   try {
    const docRef  = await addDoc(collection(db, "constructions"), data);
    return docRef.id;
  } catch (e) {
    console.error("Błąd podczas dodawania dokumentu: ", e);
  }
}
