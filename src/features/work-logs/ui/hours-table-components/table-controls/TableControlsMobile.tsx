import React, { useState } from 'react';
import {
  Button,
  Typography,
  MenuItem,
  IconButton,
  Stack,
  Tooltip,
  Divider,
  Menu,
  Badge,
} from '@mui/material';
import {
  ContentCopy,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  MoreHoriz,
  Print,
  AutoFixHigh,
  Close,
} from '@mui/icons-material';
import FilterListIcon from '@mui/icons-material/FilterList';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import WeekSelector from '@/shared/ui/WeekSelector';
import type { HoursTableControlsViewProps } from '../HoursTableControls';

dayjs.extend(isoWeek);

const HoursTableControlsMobile = ({
  isLoading,
  currentWeek,
  handleWeekChange,
  handleToggleEditMode,
  readOnly,
  handleCopyDataDialogOpen,
  handleToggleExpand,
  editMode,
  isExpanded,
  onTableDelete,
  showFilterBadge,
  handleCancelEdit,
  handleFillWithSchedule,
  setIsFilterOpen,
  hasUnsavedChanges,
  isEmpty,
  onPrint,
}: HoursTableControlsViewProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMobileMenu = Boolean(anchorEl);

  const handleClickMobileMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleCloseMobileMenu = () => setAnchorEl(null);

  return (
    <Stack
      gap={1}
      direction={'row'}
      justifyContent={'space-between'}
      sx={(theme) => ({
        p: 1,
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Stack spacing={1} direction={'row'} sx={{ alignItems: 'center' }}>
        <WeekSelector
          small={true}
          disabled={isLoading}
          value={currentWeek}
          onChange={handleWeekChange}
        />

        <Stack direction={'row'}>
          <Tooltip title={'Poprzedni tydzień'}>
            <IconButton
              className="rounded-l-lg rounded-r-none border"
              color="primary"
              size="small"
              onClick={() => handleWeekChange('prev')}
              sx={(theme) => ({
                borderColor: theme.palette.primary.light,
                '&:hover': { borderColor: theme.palette.primary.main },
              })}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={'Obecny tydzień'}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              className="rounded-none border-x-0"
              onClick={() => handleWeekChange('current')}
              sx={(theme) => ({
                flexGrow: 1,
                borderColor: theme.palette.primary.light,
                '&:hover': { borderColor: theme.palette.primary.main },
              })}
            >
              Dziś
            </Button>
          </Tooltip>
          <Tooltip title={'Następny tydzień'}>
            <IconButton
              size="small"
              className="rounded-l-none rounded-r-lg border"
              color="primary"
              onClick={() => handleWeekChange('next')}
              sx={(theme) => ({
                borderColor: theme.palette.primary.light,
                '&:hover': { borderColor: theme.palette.primary.main },
              })}
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <IconButton onClick={handleClickMobileMenu}>
        <MoreHoriz />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={openMobileMenu}
        onClose={handleCloseMobileMenu}
        slotProps={{
          paper: { sx: { minWidth: '200px' } },
        }}
      >
        <MenuItem disableRipple sx={{ cursor: 'default' }} key={'weekNumber'}>
          <Typography className="w-full px-3 py-1 font-semibold">
            Tydzień {dayjs(currentWeek).isoWeek()}
          </Typography>
        </MenuItem>
        <Divider />

        {!readOnly && (editMode || hasUnsavedChanges)
          ? [
              <MenuItem key={'editMode'} disableRipple>
                <Button
                  size="small"
                  fullWidth
                  loading={isLoading}
                  color="primary"
                  variant={'contained'}
                  onClick={() => {
                    if (!isExpanded) handleToggleExpand();
                    handleCloseMobileMenu();
                    handleToggleEditMode();
                  }}
                >
                  Zapisz
                </Button>
              </MenuItem>,
              <MenuItem key={'cancel'} disableRipple>
                <Button
                  size="small"
                  fullWidth
                  loading={isLoading}
                  color="inherit"
                  className="rounded-lg border"
                  onClick={() => {
                    handleCloseMobileMenu();
                    handleCancelEdit();
                  }}
                >
                  Anuluj
                </Button>
              </MenuItem>,
            ]
          : !readOnly &&
            !isEmpty && (
              <MenuItem key={'editMode'} disableRipple>
                <Button
                  size="small"
                  fullWidth
                  loading={isLoading}
                  color="primary"
                  variant={'outlined'}
                  onClick={() => {
                    if (!isExpanded) handleToggleExpand();
                    handleCloseMobileMenu();
                    handleToggleEditMode();
                  }}
                >
                  Edytuj
                </Button>
              </MenuItem>
            )}

        {!readOnly && editMode && (
          <MenuItem key={'copy'} disableRipple>
            <Button
              startIcon={<ContentCopy />}
              size="small"
              fullWidth
              disabled={!editMode}
              loading={isLoading}
              color="primary"
              className="rounded-lg border"
              onClick={() => {
                handleCloseMobileMenu();
                handleCopyDataDialogOpen();
              }}
            >
              Kopiuj z innego tygodnia
            </Button>
          </MenuItem>
        )}
        {!readOnly && editMode && (
          <MenuItem key={'fill'} disableRipple>
            <Button
              startIcon={<AutoFixHigh />}
              size="small"
              fullWidth
              disabled={!editMode}
              loading={isLoading}
              color="primary"
              className="rounded-lg border"
              onClick={() => {
                handleCloseMobileMenu();
                handleFillWithSchedule();
              }}
            >
              Uzupełnij proponowane
            </Button>
          </MenuItem>
        )}
        {!isEmpty && <Divider />}
        <MenuItem key={'filters'} disableRipple>
          <Badge
            variant="dot"
            badgeContent={showFilterBadge ? 1 : 0}
            color="primary"
            sx={{ width: '100%' }}
          >
            <Button
              startIcon={<FilterListIcon />}
              size="small"
              fullWidth
              loading={isLoading}
              color="primary"
              className="rounded-lg border"
              onClick={() => {
                setIsFilterOpen(true);
                handleCloseMobileMenu();
              }}
            >
              Filtry
            </Button>
          </Badge>
        </MenuItem>
        <MenuItem key={'print'} disableRipple>
          <Button
            startIcon={<Print />}
            size="small"
            fullWidth
            loading={isLoading}
            color="primary"
            className="rounded-lg border"
            onClick={() => {
              onPrint();
              handleCloseMobileMenu();
            }}
          >
            Drukuj
          </Button>
        </MenuItem>
        <MenuItem key={'expand'} disableRipple>
          <Button
            startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
            size="small"
            fullWidth
            color="primary"
            className="rounded-lg border"
            onClick={() => {
              handleCloseMobileMenu();
              handleToggleExpand();
            }}
          >
            {isExpanded ? 'Zwiń tabelę' : 'Rozwiń tabelę'}
          </Button>
        </MenuItem>
        {readOnly && onTableDelete && (
          <MenuItem key={'close'} disableRipple>
            <Button
              startIcon={<Close />}
              size="small"
              fullWidth
              color="primary"
              className="rounded-lg border"
              onClick={() => {
                handleCloseMobileMenu();
                onTableDelete();
              }}
              sx={(theme) => ({
                borderColor: theme.palette.primary.light,
                '&:hover': { borderColor: theme.palette.primary.main },
              })}
            >
              Zamknij tabelkę
            </Button>
          </MenuItem>
        )}
      </Menu>
    </Stack>
  );
};

export default HoursTableControlsMobile;
