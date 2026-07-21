import type { TodoItem } from '../model/types';

export const filterAndSortCompletedTodos = (todos: TodoItem[]) => {
  return todos
    .filter((t) => t.isCompleted)
    .sort((a, b) => {
      const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;

      if (timeB !== timeA) {
        return timeB - timeA;
      }

      const createdA = a.createdAt?.getTime() ?? 0;
      const createdB = b.createdAt?.getTime() ?? 0;

      return createdB - createdA;
    });
};
