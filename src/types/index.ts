export type EmployeeAttachment =
  | 'idAttachment'
  | 'contractAttachment'
  | 'a1Attachment';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: boolean;
  note: string;
  contractStartDate: Date | null;
  contractEndDate?: Date | null;
  contractISPermanent?: boolean;
  a1StartDate: Date | null;
  a1EndDate: Date | null;
  a1Attachment: FileItem | null;
  contractAttachment: FileItem | null;
  idAttachment: FileItem | null;
}

export interface Construction {
  id: string;
  name: string;
  location: string;
  contractor: string;
  startDate: Date | null;
  endDate: Date | null;
  // inProgress: boolean;
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

export interface Vacation {
  id: string;
  employeeId: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

export type File = FileItem | FolderItem;
