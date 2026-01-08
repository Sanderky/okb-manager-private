import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  IconButton,
  InputBase,
  Checkbox,
  CircularProgress,
  Button,
  Paper,
  Divider,
  Stack,
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AddIcon from '@mui/icons-material/Add';

import {
  getTodos,
  addTodo,
  updateTodoStatus,
  deleteTodo,
  updateTodoTitle,
  deleteCompletedTodos,
  updateTodoImportance,
} from '../services/todos';
import { useDialogs } from '../hooks/useDialogs/useDialogs';
import { PriorityHigh, Report, ReportOff } from '@mui/icons-material';

const TodoList = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [newTodoText, setNewTodoText] = useState('');
  const dialogs = useDialogs();

  const {
    data: todos = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
    refetchInterval: 5000,
  });

  const addMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setNewTodoText('');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: boolean }) =>
      updateTodoStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      updateTodoTitle(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const toggleImportanceMutation = useMutation({
    mutationFn: ({ id, isImportant }: { id: number; isImportant: boolean }) =>
      updateTodoImportance(id, isImportant),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const clearCompletedMutation = useMutation({
    mutationFn: deleteCompletedTodos,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      addMutation.mutate(newTodoText);
    }
  };

  const handleDeleteAllCompleted = async () => {
    if (
      await dialogs.confirm(
        'Czy na pewno chcesz usunąć wszystkie wykonane zadania?',
        {
          title: 'Usuwanie wykonanych zadań',
          okText: 'Usuń',
          severity: 'error',
          cancelText: 'Anuluj',
        }
      )
    ) {
      clearCompletedMutation.mutate();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTodo();
  };

  const handleEditBlur = (
    id: number,
    currentTitle: string,
    newTitle: string
  ) => {
    if (currentTitle !== newTitle && newTitle.trim() !== '') {
      editMutation.mutate({ id, title: newTitle });
    }
  };

  const activeTodos = todos.filter((t) => !t.is_completed);
  const completedTodos = todos.filter((t) => t.is_completed);
  const visibleTodos = tabValue === 0 ? activeTodos : completedTodos;

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '350px',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: theme.palette.background.paper,
      })}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="body1" className="font-medium">
            Lista zadań
          </Typography>
        </Box>
        <Tabs
          value={tabValue}
          onChange={(_, newVal) => setTabValue(newVal)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            label={`Do zrobienia (${activeTodos.length})`}
            sx={{
              fontSize: { xs: '0.8rem', sm: '.85rem' },
              minWidth: 0,
            }}
          />
          <Tab
            label={`Wykonane (${completedTodos.length})`}
            sx={{
              fontSize: { xs: '0.8rem', sm: '.85rem' },
              minWidth: 0,
            }}
          />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box sx={{ p: 2, pb: 0 }}>
          <Box
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              p: '2px 4px',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            })}
          >
            <InputBase
              sx={{ ml: 1, flex: 1, fontSize: '0.9rem' }}
              placeholder="Dodaj nowe zadanie..."
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={addMutation.isPending || isLoading || isError}
            />
            <IconButton
              color="primary"
              onClick={handleAddTodo}
              disabled={
                !newTodoText.trim() ||
                addMutation.isPending ||
                isError ||
                isLoading
              }
              size="small"
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
      )}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          overflowY: 'auto',
          maxHeight: '400px',
        }}
      >
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {isError && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Typography color="error">Błąd ładowania zadań</Typography>
          </Box>
        )}

        {!isLoading && !isError && (
          <List sx={{ p: 0 }}>
            {visibleTodos.map((todo) => (
              <ListItem
                key={todo.id}
                disablePadding
                secondaryAction={
                  <Stack
                    direction={'row'}
                    gap={1}
                    className="lodgings-edit"
                    sx={{
                      transition: 'all 0.2s ease-in-out',
                      opacity: 1,
                      visibility: 'visible',
                      transform: 'translateY(0)',

                      '@media (hover: hover)': {
                        opacity: 0,
                        visibility: 'hidden',
                        transform: 'translateY(5px)',
                      },
                    }}
                  >
                    {!todo.is_completed && (
                      <Tooltip
                        title={
                          todo.is_important
                            ? 'Oznacz jako nieważne'
                            : 'Oznacz jako ważne'
                        }
                      >
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() =>
                            toggleImportanceMutation.mutate({
                              id: todo.id,
                              isImportant: !todo.is_important,
                            })
                          }
                          size="small"
                        >
                          {todo.is_important ? (
                            <ReportOff fontSize="small" />
                          ) : (
                            <Report fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Usuń zadanie">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => deleteMutation.mutate(todo.id)}
                        size="small"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                }
                sx={(theme) => ({
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  py: 0.5,
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover .lodgings-edit': {
                    opacity: 1,
                    visibility: 'visible',
                    transform: 'translateY(0)',
                  },
                })}
              >
                <Stack
                  direction={'row'}
                  alignItems={'center'}
                  sx={{ mr: todo.is_important && !todo.is_completed ? 0 : 1 }}
                >
                  <Checkbox
                    icon={<RadioButtonUncheckedIcon fontSize="small" />}
                    checkedIcon={<CheckCircleOutlineIcon fontSize="small" />}
                    checked={todo.is_completed}
                    onChange={() =>
                      toggleStatusMutation.mutate({
                        id: todo.id,
                        status: !todo.is_completed,
                      })
                    }
                    sx={{
                      p: 0,
                      color: 'text.disabled',
                      '&.Mui-checked': { color: 'success.main' },
                    }}
                  />

                  {todo.is_important && !todo.is_completed && (
                    <PriorityHigh
                      fontSize="small"
                      sx={{ color: 'warning.main' }}
                    />
                  )}
                </Stack>

                <InputBase
                  defaultValue={todo.title}
                  fullWidth
                  onBlur={(e) =>
                    handleEditBlur(todo.id, todo.title, e.target.value)
                  }
                  sx={{
                    fontSize: '0.9rem',
                    textDecoration: todo.is_completed ? 'line-through' : 'none',
                    color: todo.is_completed
                      ? 'text.disabled'
                      : todo.is_important
                        ? 'warning.main'
                        : 'text.primary',
                    transition: 'color 0.2s',
                  }}
                />
              </ListItem>
            ))}

            {visibleTodos.length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  mt: 4,
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                }}
              >
                {tabValue === 0
                  ? 'Wszystko zrobione!'
                  : 'Brak wykonanych zadań'}
              </Box>
            )}
          </List>
        )}
      </Box>

      {tabValue === 1 && completedTodos.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              color="error"
              variant="text"
              disabled={isLoading || isError}
              onClick={handleDeleteAllCompleted}
              startIcon={<DeleteOutlineIcon fontSize="small" />}
            >
              Usuń wszystkie wykonane
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default TodoList;
