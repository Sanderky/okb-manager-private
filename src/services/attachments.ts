import { supabase } from '../supabase';
import type { Attachment, EmployeeAttachmentType } from '../types';

export const getEmployeeAttachments = async (
  employeeId: string
): Promise<Attachment[]> => {
  const { data, error } = await supabase
    .from('employee_attachments')
    .select('*')
    .eq('employee_id', employeeId);

  if (error) throw error;

  return data.map((item: any) => ({
    id: item.id,
    name: item.file_name,
    path: item.file_path,
    size: item.file_size,
    contentType: item.content_type,
    type: 'file',
    createdAt: item.created_at,

    attachmentType: item.type as EmployeeAttachmentType,
  }));
};

export const uploadAttachment = async (
  employeeId: string,
  file: File,
  type: EmployeeAttachmentType
): Promise<Attachment> => {
  const filePath = `employees/${employeeId}/${type}/${Date.now()}_${file.name}`;

  const { data: storageData, error: storageError } = await supabase.storage
    .from('files')
    .upload(filePath, file, { upsert: true });

  if (storageError) throw storageError;

  const { data: dbData, error: dbError } = await supabase
    .from('employee_attachments')
    .insert({
      employee_id: employeeId,
      file_path: storageData.path,
      file_name: file.name,
      file_size: file.size,
      content_type: file.type,
      type: type,
    })
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from('files').remove([filePath]);
    throw dbError;
  }

  return {
    id: dbData.id,
    name: file.name,
    path: storageData.path,
    size: file.size,
    type: 'file',
    contentType: file.type,
    createdAt: dbData.created_at,
    attachmentType: type,
  };
};

export const deleteAttachment = async (
  attachmentId: string,
  filePath: string
) => {
  const { error: dbError } = await supabase
    .from('employee_attachments')
    .delete()
    .eq('id', attachmentId);

  if (dbError) throw dbError;

  const { error: storageError } = await supabase.storage
    .from('files')
    .remove([filePath]);

  if (storageError) {
    console.error(
      'Failed to delete file from storage (orphan file created):',
      storageError
    );
  }
};
