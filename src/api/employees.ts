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
import type { Employee } from '../types';


export async function createEmployee(data: Employee) {
  try {
    const newEmployee: Employee = {
      ...data,
    };
    const docRef = await addDoc(collection(db, 'employees'), newEmployee);
    return docRef.id;
  } catch (e) {
    console.error('Błąd podczas dodawania dokumentu: ', e);
    throw e;
  }
}

export async function updateEmployee(
  id: string,
  data: Partial<Employee>
): Promise<void> {
  try {
    const employeeRef = doc(db, 'employees', id);
    await updateDoc(employeeRef, data);
  } catch (e) {
    console.error('Błąd podczas aktualizacji dokumentu: ', e);
    throw e; 
  }
}

export async function removeEmployee(id: string): Promise<void> {
  try {
    const employeeRef = doc(db, 'employees', id);
    await deleteDoc(employeeRef);
  } catch (e) {
    console.error('Błąd podczas usuwania dokumentu: ', e);
    throw e;
  }
}

export async function getEmployeeList(): Promise<Employee[]> {
  const employeesCol = collection(db, 'employees');
  const employeesSnapshot = await getDocs(employeesCol);

  const employeesList = employeesSnapshot.docs.map((doc) => {
    // 1. Pobierz dane dokumentu i dodaj do nich ID
    const docData = doc.data();
    return {
      id: doc.id,
      ...docData,
    } as Employee;
  });

  return employeesList;
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const employeeDoc = await getDoc(doc(db, 'employees', id));
  if (employeeDoc.exists()) {
    return { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
  } else {
    return null;
  }
}
