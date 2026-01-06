import { supabase } from '../supabase';
import type { Attachment, EmployeeAttachmentType } from '../types';
import { removePolishChars, sanitizeFileName } from '../utils';

const STORAGE_BUCKET = 'files';

const mapToAttachment = (item: any): Attachment => ({
  id: item.id,
  employeeId: item.employee_id,
  name: item.file_name,
  path: item.file_path,
  size: item.file_size,
  contentType: item.content_type,
  type: 'file',

  createdAt: new Date(item.created_at),

  attachmentType: item.type as EmployeeAttachmentType,
});

export const getEmployeeAttachments = async (
  employeeId: string
): Promise<Attachment[]> => {
  const { data, error } = await supabase
    .from('employee_attachments')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(mapToAttachment);
};

export const uploadAttachment = async (
  employeeId: string,
  file: File,
  type: EmployeeAttachmentType,
  onProgress?: (progress: number) => void
): Promise<Attachment> => {
  if (onProgress) onProgress(10);

  const safeName = sanitizeFileName(file.name);

  const filePath = `employees/${employeeId}/${type}/${Date.now()}_${safeName}`;

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600',
    });

  if (storageError) throw storageError;

  const { data: dbData, error: dbError } = await supabase
    .from('employee_attachments')
    .insert({
      employee_id: employeeId,
      file_path: filePath,
      // file_name: file.name,
      file_name: removePolishChars(file.name),
      file_size: file.size,
      content_type: file.type,
      type: type,
    })
    .select()
    .single();

  if (dbError) {
    console.error('Błąd zapisu w bazie, usuwam osierocony plik ze Storage...');
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    throw dbError;
  }
  if (onProgress) onProgress(100);
  return mapToAttachment(dbData);
};

export const deleteAttachment = async (
  attachmentId: string,
  filePath: string
): Promise<void> => {
  const { error: dbError } = await supabase
    .from('employee_attachments')
    .delete()
    .eq('id', attachmentId);

  if (dbError) throw dbError;

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (storageError) {
    console.warn(
      'Rekord usunięty, ale plik pozostał w Storage (orphan):',
      storageError
    );
  }
};

export const getAttachmentUrl = (path: string): string => {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return data.publicUrl;
};

export const getSignedAttachmentUrl = async (
  path: string
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 3600); // Ważny 1h

  if (error) {
    console.error('Błąd generowania linku:', error);
    return null;
  }
  return data.signedUrl;
};
