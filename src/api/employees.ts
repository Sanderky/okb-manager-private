import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Employee } from '../types';

export async function createEmployee(
  data: Partial<Employee> & { name: string }
) {
  try {
    if (!data.name) {
      throw new Error('Imię jest wymagane');
    }

    const employeeData: Omit<Employee, 'id'> = {
      name: data.name,
      isContractor: data.isContractor ?? null,
      pesel: data.pesel ?? null,
      birthDate: data.birthDate ?? null,
      address: data.address ?? null,
      hourRate: data.hourRate ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      status: data.status ?? true,
      accountNumber: data.accountNumber ?? null,
      note: data.note ?? null,
      contractStartDate: data.contractStartDate ?? null,
      contractEndDate: data.contractEndDate ?? null,
      contractISPermanent: data.contractISPermanent ?? false,
      a1StartDate: data.a1StartDate ?? null,
      a1EndDate: data.a1EndDate ?? null,
      a1Attachment: data.a1Attachment ?? null,
      contractAttachment: data.contractAttachment ?? null,
      idAttachment: data.idAttachment ?? null,
    };

    const docRef = await addDoc(collection(db, 'employees'), employeeData);
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

export async function getEmployeeList(activeOnly = false): Promise<Employee[]> {
  const employeesCol = collection(db, 'employees');

  let employeesSnapshot;

  if (activeOnly) {
    employeesSnapshot = await getDocs(
      query(employeesCol, where('status', '==', true))
    );
  } else {
    employeesSnapshot = await getDocs(employeesCol);
  }

  const employeesList = employeesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      name: data.name ?? '',
      birthDate: data.birthDate?.toDate() ?? null,
      contractStartDate: data.contractStartDate?.toDate() ?? null,
      contractEndDate: data.contractEndDate?.toDate() ?? null,
      contractISPermanent: data.contractISPermanent ?? false,
      a1StartDate: data.a1StartDate?.toDate() ?? null,
      a1EndDate: data.a1EndDate?.toDate() ?? null,
    } as Employee;
  });

  return employeesList;
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const employeeDoc = await getDoc(doc(db, 'employees', id));
  if (employeeDoc.exists()) {
    const data = employeeDoc.data();
    return {
      ...data,
      id: employeeDoc.id,
      name: data.name ?? '',
      birthDate: data.birthDate?.toDate() ?? null,
      contractStartDate: data.contractStartDate?.toDate() ?? null,
      contractEndDate: data.contractEndDate?.toDate() ?? null,
      a1StartDate: data.a1StartDate?.toDate() ?? null,
      a1EndDate: data.a1EndDate?.toDate() ?? null,
    } as Employee;
  } else {
    return null;
  }
}
