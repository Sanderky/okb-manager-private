import type { TodoItem } from '../model/types';

export const mapTodoFromDB = (row: any): TodoItem => ({
  id: row.id,
  title: row.title,
  isCompleted: row.is_completed,
  isImportant: row.is_important,
  createdAt: row.created_at ? new Date(row.created_at) : undefined,
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
});