import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addTodo,
  deleteCompletedTodos,
  deleteTodo,
  updateTodoImportance,
  updateTodoStatus,
  updateTodoTitle,
} from '../../api';

export const useAddTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};

export const useToggleTodoStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: boolean }) =>
      updateTodoStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useEditTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      updateTodoTitle(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useToggleTodoImportance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isImportant }: { id: number; isImportant: boolean }) =>
      updateTodoImportance(id, isImportant),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useClearCompletedTodos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompletedTodos,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};
