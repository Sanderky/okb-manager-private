export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  type: 'file';
  contentType: string;
  isSystem?: boolean;
}

export interface FolderItem {
  name: string;
  type: 'folder';
  path: string;
  isSystem?: boolean;
}

export type FileBrowserItem = FileItem | FolderItem;

export type IsoDateString = string;

export type LangCode = 'pl-PL' | 'de-DE';
