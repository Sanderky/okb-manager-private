import type { FileItem } from "@/shared/model/types";

export interface FolderItem {
  name: string;
  type: 'folder';
  path: string;
  isSystem?: boolean;
}

export type FileBrowserItem = FileItem | FolderItem;
