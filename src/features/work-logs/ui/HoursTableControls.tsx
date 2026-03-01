import React from 'react';
import {
  Button,
  Box,
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
  Clear,
  ExpandLess,
  ExpandMore,
  MoreHoriz,
  Print,
  AutoFixHigh,
  Close,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
import WeekSelector from '@/shared/ui/WeekSelector';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useReactToPrint } from 'react-to-print';
import FilterListIcon from '@mui/icons-material/FilterList';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

interface HoursTableControlsProps {
  containerWidth: number;
  isLoading: boolean;
  currentWeek: Date;
  handleWeekChange: (week: 'next' | 'current' | 'prev') => void;
  onWeeekChange: (weekStart: Date) => void;
  handleToggleEditMode: (editMode?: boolean | undefined) => void;
  readOnly: boolean;
  handleCopyDataDialogOpen: () => void;
  handleToggleExpand: () => void;
  editMode: boolean;
  isExpanded: boolean;
  isCoping: boolean;
  onTableDelete?: () => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  showFilterBadge: boolean;
  handleCancelEdit: () => Promise<void>;
  handleFillWithSchedule: () => Promise<void>;
  setIsFilterOpen: (val: boolean) => void;
  hasUnsavedChanges: boolean;
}

const HoursTableControls = ({
  containerWidth,
  isLoading,
  currentWeek,
  handleWeekChange,
  onWeeekChange,
  handleToggleEditMode,
  readOnly,
  handleCopyDataDialogOpen,
  handleToggleExpand,
  editMode,
  isExpanded,
  onTableDelete,
  isCoping,
  contentRef,
  showFilterBadge,
  handleCancelEdit,
  handleFillWithSchedule,
  setIsFilterOpen
}: HoursTableControlsProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMobileMenu = Boolean(anchorEl);
  const handleClickMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMobileMenu = () => {
    setAnchorEl(null);
  };

  const reactToPrintFn = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Tabelka_godzin_${dayjs(currentWeek).format('DD.MM.YYYY')}_${dayjs(currentWeek).add(6, 'days').format('DD.MM.YYYY')}`,
    pageStyle: `
    @page {
      margin: 10mm;
    }`,
  });

  const phone = (
    <Stack
      gap={1}
      direction={'row'}
      justifyContent={'space-between'}
      sx={(theme) => ({
        p: 1,
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`
      })}
    >
      <Stack
        spacing={1}
        direction={'row'}
        // justifyContent={'space-between'}
        sx={{
          alignItems: 'center',
        }}
      >
        <WeekSelector
          small={true}
          disabled={isLoading}
          value={currentWeek}
          onChange={onWeeekChange}
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
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
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
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
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
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
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
          list: {
            'aria-labelledby': 'long-button',
          },
          paper: {
            sx: {
              minWidth: '200px',
            },
          },
        }}
      >
        <MenuItem disableRipple sx={{ cursor: 'default' }} key={'weekNumber'}>
          <Typography className="w-full px-3 py-1 font-semibold">
            Tydzień {dayjs(currentWeek).isoWeek()}
          </Typography>
        </MenuItem>
        <Divider />

        {!readOnly && editMode
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
          : !readOnly && (
            <MenuItem key={'editMode'} disableRipple>
              <Button
                size="small"
                fullWidth
                loading={isLoading}
                color="primary"
                // className="rounded-lg border"
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
        <Divider />
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
              reactToPrintFn();
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
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
              })}
            >
              Zamknij tabelkę
            </Button>
          </MenuItem>
        )}
      </Menu>
    </Stack>
  );

  const desktop = (
    <Box
      sx={(theme) => ({
        p: 1,
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: { xs: 'none', sm: 'flex' },
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
      })}

    >
      <Stack direction={'row'}>
        <Tooltip title={'Poprzedni tydzień'}>
          <IconButton
            size="small"
            className="rounded-l-lg rounded-r-none border"
            color="primary"
            onClick={() => handleWeekChange('prev')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            })}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={'Obecny tydzień'}>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            className="rounded-none border-x-0"
            onClick={() => handleWeekChange('current')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
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
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            })}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <WeekSelector
        disabled={isLoading}
        value={currentWeek}
        onChange={onWeeekChange}
      />

      <Tooltip title="Filtry">
        <Badge
          color="primary"
          variant="dot"
          badgeContent={showFilterBadge ? 1 : 0}
        >
          <IconButton
            size="small"
            className="rounded-lg border"
            color="primary"
            onClick={() => setIsFilterOpen(true)}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              // ml: 1,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            })}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Badge>
      </Tooltip>
      {!readOnly &&
        (editMode ? (
          <>
            <Button
              disabled={isLoading}
              size="small"
              variant={'contained'}
              onClick={() => {
                if (!isExpanded) handleToggleExpand();
                handleToggleEditMode();
              }}
            >
              Zapisz
            </Button>
            <Button
              disabled={isLoading}
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => handleCancelEdit()}
              sx={{
                color: 'inherit',
              }}
            >
              Anuluj
            </Button>
          </>
        ) : (
          <Button
            disabled={isLoading}
            size="small"
            variant={'outlined'}
            sx={{
              mr: 1,
            }}
            onClick={() => {
              if (!isExpanded) handleToggleExpand();

              handleToggleEditMode();
            }}
          >
            Edytuj
          </Button>
        ))}

      <Stack
        direction={'row'}
        gap={2}
        sx={{
          ml: 'auto',
        }}
      >
        {!readOnly &&
          editMode && [
            <Tooltip key="copy" title="Kopiuj z innego tygodnia">
              <span>
                <IconButton
                  disabled={isLoading || !editMode}
                  onClick={handleCopyDataDialogOpen}
                  loading={isCoping}
                  sx={{
                    p: 0,
                  }}
                >
                  <ContentCopy />
                </IconButton>
              </span>
            </Tooltip>,
            <Tooltip key="fill" title="Uzupełnij proponowane">
              <span>
                <IconButton
                  disabled={isLoading || !editMode}
                  onClick={handleFillWithSchedule}
                  loading={isCoping}
                  sx={{
                    p: 0,
                  }}
                >
                  <AutoFixHigh />
                </IconButton>
              </span>
            </Tooltip>,
          ]}

        <Tooltip title="Drukuj tabelkę">
          <span>
            <IconButton
              disabled={isLoading}
              onClick={reactToPrintFn}
              loading={isLoading}
              sx={{
                p: 0,
              }}
            >
              <Print />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={isExpanded ? 'Zwiń' : 'Rozwiń'}>
          <IconButton
            onClick={handleToggleExpand}
            sx={{
              p: 0,
            }}
          >
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Tooltip>
        {readOnly && onTableDelete && (
          <Tooltip title="Usuń tabelę porównawczą">
            <span>
              <IconButton
                disabled={isLoading}
                onClick={onTableDelete}
                sx={{
                  p: 0,
                }}
              >
                <Clear />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
      <Typography
        textTransform={'capitalize'}
        className="rounded-full border px-3 py-1 font-semibold"
        sx={{
            borderColor: 'text.primary'
          }}
      >
        Tydzień {dayjs(currentWeek).isoWeek()}
      </Typography>
    </Box>
  );

  return <Box>{containerWidth < 600 ? phone : desktop}</Box>;
};

export default HoursTableControls;
