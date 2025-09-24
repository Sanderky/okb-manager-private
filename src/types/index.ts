import type { Dayjs } from 'dayjs';

type EndDateObject = {
  date: Date | null;
  permanent: boolean;
};

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: boolean;
  note: string;
  contractStartDate: Date | null;
  contractEndDate?: EndDateObject;
  a1StartDate: Date | null;
  a1EndDate?: EndDateObject;
  vacation: {
    id: string;
    startDate: Date;
    endDate: Date;
  }[];
}


export interface Construction {
  id: string;
  name: string;
  location: string;
  contractor: string;
  startDate: Date;
  endDate?: EndDateObject;
  inProgress: boolean;
  note?: string;
}


export interface FileItem {
  name: string;
  type: 'file';
  fullPath: string;
  url: string;
  timeCreated?: string;
  size?: number;
  contentType?: string;
}

export interface FolderItem {
  name: string;
  type: 'folder';
  fullPath: string;
}

export type File = FileItem | FolderItem;