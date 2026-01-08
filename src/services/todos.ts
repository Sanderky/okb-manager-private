import { supabase } from '../supabase';
import type { TodoItem } from '../types';

export const getTodos = async (): Promise<TodoItem[]> => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('is_important', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addTodo = async (title: string): Promise<TodoItem> => {
  const { data, error } = await supabase
    .from('todos')
    .insert([{ title, is_completed: false }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTodoStatus = async (
  id: number,
  is_completed: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('todos')
    .update({ is_completed })
    .eq('id', id);

  if (error) throw error;
};

export const updateTodoImportance = async (
  id: number,
  is_important: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('todos')
    .update({ is_important })
    .eq('id', id);

  if (error) throw error;
};

export const updateTodoTitle = async (
  id: number,
  title: string
): Promise<void> => {
  const { error } = await supabase.from('todos').update({ title }).eq('id', id);

  if (error) throw error;
};

export const deleteTodo = async (id: number): Promise<void> => {
  const { error } = await supabase.from('todos').delete().eq('id', id);

  if (error) throw error;
};

export const deleteCompletedTodos = async (): Promise<void> => {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('is_completed', true);

  if (error) throw error;
};
