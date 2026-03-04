import type { FileBrowserItem } from "../model/types";

export const mapStorageItem = (item: any, path: string): FileBrowserItem => {
  const fullPath = path ? `${path}/${item.name}` : item.name;
  if (!item.id) {
    return { name: item.name, type: 'folder', path: fullPath };
  }
  return {
    id: item.id,
    name: item.name,
    type: 'file',
    path: fullPath,
    createdAt: item.created_at ? new Date(item.created_at) : new Date(),
    size: item.metadata?.size || 0,
    contentType: item.metadata?.mimetype || 'application/octet-stream',
  };
};
