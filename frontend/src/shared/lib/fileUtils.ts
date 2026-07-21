export const getFileExtension = (filename: string): string | null => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex <= 0) return null;
  return filename.substring(lastDotIndex + 1).toLowerCase();
};

export const getFileNameWithoutExtension = (filename: string): string => {
  const lastSlashIndex = filename.lastIndexOf('/');
  const baseFilename =
    lastSlashIndex === -1 ? filename : filename.substring(lastSlashIndex + 1);
  const lastDotIndex = baseFilename.lastIndexOf('.');
  if (lastDotIndex <= 0) return baseFilename;
  return baseFilename.substring(0, lastDotIndex);
};

export const getFileType = (fileName: string) => {
  const extension = getFileExtension(fileName);
  if (!extension) return 'unsupported';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension))
    return 'image';
  if (extension === 'pdf') return 'pdf';
  if (['txt', 'md', 'js', 'css', 'html', 'json'].includes(extension))
    return 'text';
  if (['doc', 'docx'].includes(extension)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'excel';
  return 'unsupported';
};

export const canOpenPreview = (item: { type: string; name: string }) => {
  if (item.type === 'folder') return false;
  const fileType = getFileType(item.name);
  return fileType === 'image' || fileType === 'pdf';
};

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};