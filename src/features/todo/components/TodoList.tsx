import React, { useMemo, useState } from 'react';
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
  TextField,
  InputAdornment,
  Pagination,
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
} from '../api';
import { useDialogs } from '../../../shared/ui/dialogs/useDialogs';
import { PriorityHigh, Report, ReportOff } from '@mui/icons-material';
import dayjs from 'dayjs';

const ITEMS_PER_PAGE = 20;

const AddTodoInput = ({
  onAdd,
  disabled,
}: {
  onAdd: (text: string) => void;
  disabled: boolean;
}) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onAdd(text);
      setText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box sx={{ p: 2, pb: 0 }}>
      <TextField
        multiline
        placeholder="Dodaj nowe zadanie..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={disabled}
        size="small"
        fullWidth
        slotProps={{
          input: {
            size: 'small',
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={handleSubmit}
                  disabled={!text.trim() || disabled}
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};

const TodoList = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const dialogs = useDialogs();

  const {
    data: todos = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  });

  const addMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
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

  const handleAddTodo = (text: string) => {
    addMutation.mutate(text);
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
  const handleDelete = async (id: number) => {
    if (!id) return;
    if (
      await dialogs.confirm('Czy na pewno chcesz usunąć to zadanie?', {
        title: 'Usuwanie zadania',
        okText: 'Usuń',
        severity: 'error',
        cancelText: 'Anuluj',
      })
    ) {
      deleteMutation.mutate(id);
    }
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

  const handleTabChange = (_: React.SyntheticEvent, newVal: number) => {
    setTabValue(newVal);
    setPage(1);
  };

  const activeTodos = useMemo(
    () => todos.filter((t) => !t.is_completed),
    [todos]
  );

  const completedTodos = useMemo(
    () =>
      todos
        .filter((t) => t.is_completed)
        .sort((a, b) => {
          const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
          const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0;

          if (timeB !== timeA) {
            return timeB - timeA;
          }

          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }),
    [todos]
  );

  const visibleTodos = tabValue === 0 ? activeTodos : completedTodos;

  const pageCount = Math.ceil(visibleTodos.length / ITEMS_PER_PAGE);
  const paginatedTodos = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return visibleTodos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [visibleTodos, page]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

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
          onChange={handleTabChange}
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
        <AddTodoInput
          onAdd={handleAddTodo}
          disabled={addMutation.isPending || isLoading || isError}
        />
      )}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          px: 2,
          py: 0,
          overflowY: 'auto',
          maxHeight: '500px',
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
            {paginatedTodos.map((todo) => (
              <ListItem
                key={todo.id}
                disablePadding
                sx={(theme) => ({
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  py: 2,
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover .lodgings-edit': {
                    opacity: 1,
                    visibility: 'visible',
                    transform: 'translateY(0)',
                  },
                })}
              >
                <Stack direction={'column'} sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      flex: 1,
                    }}
                  >
                    <Stack
                      direction={'row'}
                      alignItems={'center'}
                      sx={{
                        mr: todo.is_important && !todo.is_completed ? 0 : 1,
                      }}
                    >
                      <Checkbox
                        icon={<RadioButtonUncheckedIcon fontSize="small" />}
                        checkedIcon={
                          <CheckCircleOutlineIcon fontSize="small" />
                        }
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
                      multiline
                      defaultValue={todo.title}
                      fullWidth
                      onBlur={(e) =>
                        handleEditBlur(todo.id, todo.title, e.target.value)
                      }
                      sx={{
                        fontSize: '0.9rem',
                        color: todo.is_completed
                          ? 'text.disabled'
                          : todo.is_important
                            ? 'warning.main'
                            : 'text.primary',
                        transition: 'color 0.2s',
                      }}
                    />
                    <Stack
                      direction={'row'}
                      gap={1}
                      className="lodgings-edit"
                      sx={{
                        ml: 1,
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
                          onClick={() => handleDelete(todo.id)}
                          size="small"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                  {todo.is_completed && (
                    <Typography
                      ml={'28px'}
                      variant="caption"
                      color="textDisabled"
                    >{`Wykonano: ${todo.completed_at ? dayjs(todo.completed_at).format('DD.MM.YYYY') : '-'}`}</Typography>
                  )}
                </Stack>
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

      {((tabValue === 1 && completedTodos.length > 0) ||
        visibleTodos.length > ITEMS_PER_PAGE) && <Divider />}

      {visibleTodos.length > ITEMS_PER_PAGE && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            px: 2,
            pb: tabValue === 1 && completedTodos.length > 0 ? 0 : 2,
            pt: 2,
          }}
        >
          <Pagination
            count={pageCount}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="small"
          />
        </Box>
      )}

      {tabValue === 1 && completedTodos.length > 0 && (
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
      )}
    </Paper>
  );
};

export default TodoList;
