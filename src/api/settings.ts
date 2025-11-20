import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { AlertsSettings } from '../types';
import { EmployeeAlertDefault } from '../hooks/useEmployeeAlert';

export const fetchAlertsSettings = async (): Promise<AlertsSettings> => {
  const { getDoc } = await import('firebase/firestore');
  const settingsRef = doc(db, 'settings', 'alerts');
  const docSnap = await getDoc(settingsRef);

  if (docSnap.exists()) {
    return docSnap.data() as AlertsSettings;
  } else {
    return EmployeeAlertDefault;
  }
};

export const updateAlertsSettings = async (
  data: AlertsSettings
): Promise<void> => {
  if (!data) return;
  const settingsRef = doc(db, 'settings', 'alerts');

  await setDoc(settingsRef, data);
};
