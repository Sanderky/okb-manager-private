import { supabase } from '@/shared/api/supabase';
import type { TodoItem } from '../model/types';
import { mapTodoFromDB } from './mappers';

const TABLE_NAME = 'todos';

export const getTodos = async (): Promise<TodoItem[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('is_important', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapTodoFromDB);
};

export const addTodo = async (title: string): Promise<TodoItem> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{ title, is_completed: false }])
    .select()
    .single();

  if (error) throw error;
  return mapTodoFromDB(data);
};

export const updateTodoStatus = async (
  id: number,
  isCompleted: boolean
): Promise<void> => {
  const updates = {
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', id);

  if (error) throw error;
};

export const updateTodoImportance = async (
  id: number,
  isImportant: boolean
): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ is_important: isImportant })
    .eq('id', id);

  if (error) throw error;
};

export const updateTodoTitle = async (
  id: number,
  title: string
): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ title })
    .eq('id', id);

  if (error) throw error;
};

export const deleteTodo = async (id: number): Promise<void> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) throw error;
};

export const deleteCompletedTodos = async (): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('is_completed', true);

  if (error) throw error;
};
