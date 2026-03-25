import * as supabaseApi from './api';
import * as mockApi from './api.mock';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const {
  getTodos,
  addTodo,
  updateTodoStatus,
  updateTodoImportance,
  updateTodoTitle,
  deleteTodo,
  deleteCompletedTodos,
} = isMock ? mockApi : supabaseApi;
