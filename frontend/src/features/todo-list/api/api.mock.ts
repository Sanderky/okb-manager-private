import { mockDb } from '@/shared/api/mock/mockDb';
import { delay } from '@/shared/lib/delay';
import type { TodoItem } from '../model/types';
import { mapTodoFromDB } from './mappers';
import type { TodoDTO } from './types';

export const getTodos = async (): Promise<TodoItem[]> => {
  await delay();

  const sortedTodos = [...mockDb.todos].sort((a, b) => {
    if (a.is_important !== b.is_important) {
      return a.is_important ? -1 : 1;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return sortedTodos.map(mapTodoFromDB);
};

export const addTodo = async (title: string): Promise<TodoItem> => {
  await delay();

  const maxId =
    mockDb.todos.length > 0 ? Math.max(...mockDb.todos.map((t) => t.id)) : 0;

  const newTodo: TodoDTO = {
    id: maxId + 1,
    title,
    is_completed: false,
    is_important: false,
    created_at: new Date().toISOString(),
    completed_at: null,
  };

  mockDb.todos.push(newTodo as any);

  return mapTodoFromDB(newTodo);
};

export const updateTodoStatus = async (
  id: number,
  isCompleted: boolean
): Promise<void> => {
  await delay();

  const index = mockDb.todos.findIndex((t) => t.id === id);
  if (index === -1) throw new Error(`Todo with id ${id} not found`);

  mockDb.todos[index] = {
    ...mockDb.todos[index],
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
  } as any;
};

export const updateTodoImportance = async (
  id: number,
  isImportant: boolean
): Promise<void> => {
  await delay();

  const index = mockDb.todos.findIndex((t) => t.id === id);
  if (index === -1) throw new Error(`Todo with id ${id} not found`);

  mockDb.todos[index].is_important = isImportant;
};

export const updateTodoTitle = async (
  id: number,
  title: string
): Promise<void> => {
  await delay();

  const index = mockDb.todos.findIndex((t) => t.id === id);
  if (index === -1) throw new Error(`Todo with id ${id} not found`);

  mockDb.todos[index].title = title;
};

export const deleteTodo = async (id: number): Promise<void> => {
  await delay();
  mockDb.todos = mockDb.todos.filter((t) => t.id !== id);
};

export const deleteCompletedTodos = async (): Promise<void> => {
  await delay();
  mockDb.todos = mockDb.todos.filter((t) => t.is_completed === false);
};
