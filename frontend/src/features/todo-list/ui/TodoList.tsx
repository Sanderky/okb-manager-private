import React, { useMemo, useState } from 'react';
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
  Pagination,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import { PriorityHigh, Report, ReportOff } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next'; 
import { useTodo } from '../model/services/useTodo';
import {
  useAddTodo,
  useClearCompletedTodos,
  useDeleteTodo,
  useEditTodo,
  useToggleTodoImportance,
  useToggleTodoStatus,
} from '../model/services/useTodoMutations';
import { filterAndSortCompletedTodos } from '../lib/todoUtils';
import { AddTodoInput } from './TodoInput';

const ITEMS_PER_PAGE = 20;

export const TodoList = () => {
  const { t } = useTranslation(['todo', 'common']); 
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const dialogs = useDialogs();

  const { data: todos, isLoading, isError } = useTodo();
  const addMutation = useAddTodo();
  const toggleStatusMutation = useToggleTodoStatus();
  const deleteMutation = useDeleteTodo();
  const editMutation = useEditTodo();
  const toggleImportanceMutation = useToggleTodoImportance();
  const clearCompletedMutation = useClearCompletedTodos();

  const handleAddTodo = (text: string) => {
    addMutation.mutate(text);
  };

  const handleDeleteAllCompleted = async () => {
    if (
      await dialogs.confirm(
        t('todo:dialogs.deleteAll.description'),
        {
          title: t('todo:dialogs.deleteAll.title'),
          okText: t('common:buttons.delete'),
          severity: 'error',
          cancelText: t('common:buttons.cancel'),
        }
      )
    ) {
      clearCompletedMutation.mutate();
    }
  };

  const handleDelete = async (id: number) => {
    if (!id) return;
    if (
      await dialogs.confirm(t('todo:dialogs.deleteOne.description'), {
        title: t('todo:dialogs.deleteOne.title'),
        okText: t('common:buttons.delete'),
        severity: 'error',
        cancelText: t('common:buttons.cancel'),
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
    () => todos.filter((t) => !t.isCompleted),
    [todos]
  );

  const completedTodos = useMemo(
    () => filterAndSortCompletedTodos(todos),
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
            {t('todo:title')}
          </Typography>
        </Box>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            label={t('todo:tabs.todo', { count: activeTodos.length })}
            sx={{
              fontSize: { xs: '0.8rem', sm: '.85rem' },
              minWidth: 0,
            }}
          />
          <Tab
            label={t('todo:tabs.completed', { count: completedTodos.length })}
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
            <Typography color="error">{t('todo:errors.loadError')}</Typography>
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
                        mr: todo.isImportant && !todo.isCompleted ? 0 : 1,
                      }}
                    >
                      <Checkbox
                        icon={<RadioButtonUncheckedIcon fontSize="small" />}
                        checkedIcon={
                          <CheckCircleOutlineIcon fontSize="small" />
                        }
                        checked={todo.isCompleted}
                        onChange={() =>
                          toggleStatusMutation.mutate({
                            id: todo.id,
                            status: !todo.isCompleted,
                          })
                        }
                        sx={{
                          p: 0,
                          color: 'text.disabled',
                          '&.Mui-checked': { color: 'success.main' },
                        }}
                      />

                      {todo.isImportant && !todo.isCompleted && (
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
                        color: todo.isCompleted
                          ? 'text.disabled'
                          : todo.isImportant
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
                      {!todo.isCompleted && (
                        <Tooltip
                          title={
                            todo.isImportant
                              ? t('todo:actions.markUnimportant')
                              : t('todo:actions.markImportant')
                          }
                        >
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() =>
                              toggleImportanceMutation.mutate({
                                id: todo.id,
                                isImportant: !todo.isImportant,
                              })
                            }
                            size="small"
                          >
                            {todo.isImportant ? (
                              <ReportOff fontSize="small" />
                            ) : (
                              <Report fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={t('todo:actions.delete')}>
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
                  {todo.isCompleted && (
                    <Typography
                      ml={'28px'}
                      variant="caption"
                      color="textDisabled"
                    >
                      {t('todo:status.completedAt', { 
                        date: todo.completedAt ? dayjs(todo.completedAt).format('DD.MM.YYYY') : '-' 
                      })}
                    </Typography>
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
                  ? t('todo:emptyStates.allDone')
                  : t('todo:emptyStates.noCompleted')}
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
            {t('todo:actions.deleteAllCompleted')}
          </Button>
        </Box>
      )}
    </Paper>
  );
};