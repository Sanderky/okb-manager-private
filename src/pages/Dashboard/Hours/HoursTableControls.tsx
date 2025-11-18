import React, { useState } from 'react';
import {
  Button,
  Box,
  Typography,
  MenuItem,
  IconButton,
  Stack,
  Tooltip,
  Divider,
  Grid,
  Menu,
  Badge,
  useTheme,
  useMediaQuery,
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
} from '@mui/icons-material';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
import WeekSelector from '../../../components/WeekSelector';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useReactToPrint } from 'react-to-print';
import type { Construction, Employee } from '../../../types';
import FilterListIcon from '@mui/icons-material/FilterList';
import { FiltersDialog } from './HoursTableDialogs';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

interface HoursTableControlsProps {
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
  tableBorder: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
  selectedConstructions: Construction[];
  onSelectedConstructionsChange: (constructions: Construction[]) => void;
  selectedEmployees: Employee[];
  onSelectedEmployeesChange: (employees: Employee[]) => void;
  handleCancelEdit: () => Promise<void>;
  handleFillWithSchedule: () => Promise<void>;
}

const HoursTableControls = ({
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
  tableBorder,
  contentRef,
  selectedConstructions,
  onSelectedConstructionsChange,
  selectedEmployees,
  onSelectedEmployeesChange,
  handleCancelEdit,
  handleFillWithSchedule,
}: HoursTableControlsProps) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
      spacing={1}
      direction={'column'}
      className="border-lightGray rounded-lg border bg-gray-50 p-2"
      sx={{
        border: tableBorder,
        mb: 1,
      }}
    >
      <Stack
        spacing={1}
        direction={'row'}
        justifyContent={'space-between'}
        sx={{
          alignItems: 'center',
        }}
      >
        <WeekSelector
          disabled={isLoading}
          value={currentWeek}
          onChange={onWeeekChange}
        />

        <IconButton onClick={handleClickMobileMenu}>
          <MoreHoriz />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={openMobileMenu}
          onClose={handleCloseMobileMenu}
        >
          <MenuItem
            disableRipple
            sx={{ fontWeight: 'bold', cursor: 'default' }}
            key={'weekNumber'}
          >
            Tydzień {dayjs(currentWeek).isoWeek()}
          </MenuItem>
          <Divider />

          {!readOnly && (
            <MenuItem
              key={'editMode'}
              onClick={() => {
                if (!isExpanded) handleToggleExpand();
                handleCloseMobileMenu();
                handleToggleEditMode();
              }}
              disableRipple
              disabled={isLoading}
            >
              {editMode ? 'Zapisz' : 'Edytuj'}
            </MenuItem>
          )}
          {!readOnly && editMode && (
            <MenuItem
              disabled={isLoading}
              key={'cancel'}
              onClick={() => {
                handleCloseMobileMenu();
                handleCancelEdit();
              }}
              disableRipple
            >
              Anuluj
            </MenuItem>
          )}
          {!readOnly && editMode && (
            <MenuItem
              key={'copy'}
              onClick={() => {
                handleCloseMobileMenu();
                handleCopyDataDialogOpen();
              }}
              disableRipple
              disabled={isLoading}
            >
              Kopiuj z innego tygodnia
            </MenuItem>
          )}
          {!readOnly && editMode && (
            <MenuItem
              key={'fill'}
              onClick={() => {
                handleFillWithSchedule();
                handleCopyDataDialogOpen();
              }}
              disableRipple
              disabled={isLoading}
            >
              Uzupełnij proponowane
            </MenuItem>
          )}
          <Divider />
          <MenuItem
            key={'filters'}
            onClick={() => {
              setIsFilterOpen(true);
              handleCloseMobileMenu();
            }}
            disableRipple
            disabled={isLoading}
          >
            {`Filtry (${selectedConstructions.length + selectedEmployees.length})`}
          </MenuItem>
          <MenuItem
            key={'print'}
            onClick={() => {
              reactToPrintFn();
              handleCloseMobileMenu();
            }}
            disableRipple
            disabled={isLoading}
          >
            Drukuj
          </MenuItem>
          <MenuItem
            key={'expand'}
            onClick={() => {
              handleCloseMobileMenu();
              handleToggleExpand();
            }}
            disableRipple
          >
            {isExpanded ? 'Zwiń tabelę' : 'Rozwiń tabelę'}
          </MenuItem>
          {readOnly && onTableDelete && (
            <MenuItem
              key={'close'}
              onClick={() => {
                handleCloseMobileMenu();
                onTableDelete();
              }}
              disableRipple
            >
              Zamknij tabelę
            </MenuItem>
          )}
        </Menu>
      </Stack>
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
            <ChevronLeft />
          </IconButton>
        </Tooltip>
        <Tooltip title={'Obecny tydzień'}>
          <Button
            variant="outlined"
            color="primary"
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
            <ChevronRight />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );

  const desktop = (
    <Box
      className="border-lightGray mb-2 rounded-lg border bg-gray-50 p-2"
      sx={{
        display: { xs: 'none', sm: 'flex' },

        flexDirection: { sm: 'column-reverse', md: 'row' },
        gap: 2,
      }}
    >
      <Grid
        container
        spacing={2}
        justifyContent="space-between"
        sx={{
          alignItems: 'center',
        }}
      >
        <Grid>
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
                <ChevronLeft />
              </IconButton>
            </Tooltip>
            <Tooltip title={'Obecny tydzień'}>
              <Button
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
                <ChevronRight />
              </IconButton>
            </Tooltip>
          </Stack>
        </Grid>

        <Grid>
          <Stack
            alignItems="center"
            direction="row"
            // spacing={1}
            sx={{ flexShrink: 0 }}
          >
            <Typography
              sx={{
                display: { xs: 'none', sm: 'none', md: 'none', lg: 'block' },
                mr: 1,
              }}
              variant="body2"
            >
              Wybrany tydzień:
            </Typography>
            <WeekSelector
              disabled={isLoading}
              value={currentWeek}
              onChange={onWeeekChange}
            />

            <Tooltip title="Filtry">
              <Badge
                color="primary"
                badgeContent={
                  selectedConstructions.length + selectedEmployees.length
                }
              >
                <IconButton
                  size="small"
                  className="rounded-lg border"
                  color="primary"
                  onClick={() => setIsFilterOpen(true)}
                  sx={(theme) => ({
                    borderColor: theme.palette.primary.light,
                    ml: 1,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                    },
                  })}
                >
                  <FilterListIcon />
                </IconButton>
              </Badge>
            </Tooltip>
          </Stack>
        </Grid>

        <Grid display={'flex'} alignItems="center">
          <Typography
            textTransform={'capitalize'}
            className="rounded-full border border-gray-700 px-3 py-1 font-semibold"
          >
            Tydzień {dayjs(currentWeek).isoWeek()}
          </Typography>
        </Grid>
      </Grid>
      <Stack direction={'row'} sx={{ marginLeft: 'auto', alignItems: 'top' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: 'min-content',
          }}
        >
          {!readOnly && (
            <>
              <Button
                disabled={isLoading}
                size="small"
                onClick={() => {
                  if (!isExpanded) handleToggleExpand();

                  handleToggleEditMode();
                }}
              >
                {editMode ? 'Zapisz' : 'Edytuj'}
              </Button>

              {editMode && (
                <Button
                  disabled={isLoading}
                  size="small"
                  onClick={() => handleCancelEdit()}
                  sx={{
                    color: 'inherit',
                  }}
                >
                  Anuluj
                </Button>
              )}

              <Tooltip title="Kopiuj z innego tygodnia">
                <span>
                  <IconButton
                    disabled={isLoading || !editMode}
                    onClick={handleCopyDataDialogOpen}
                    loading={isCoping}
                  >
                    <ContentCopy />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Uzupełnij proponowane">
                <span>
                  <IconButton
                    disabled={isLoading || !editMode}
                    onClick={handleFillWithSchedule}
                    loading={isCoping}
                  >
                    <AutoFixHigh />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}
          <Tooltip title="Drukuj tabelkę">
            <span>
              <IconButton
                disabled={isLoading}
                onClick={reactToPrintFn}
                loading={isLoading}
              >
                <Print />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={isExpanded ? 'Zwiń' : 'Rozwiń'}>
            <IconButton onClick={handleToggleExpand}>
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Tooltip>
          {readOnly && onTableDelete && (
            <Tooltip title="Usuń tabelę porównawczą">
              <span>
                <IconButton disabled={isLoading} onClick={onTableDelete}>
                  <Clear />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Stack>
    </Box>
  );

  return (
    <>
      {isPhone ? phone : desktop}

      <FiltersDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onSelectedConstructionsChange={onSelectedConstructionsChange}
        selectedEmployees={selectedEmployees}
        onSelectedEmployeesChange={onSelectedEmployeesChange}
        selectedConstructions={selectedConstructions}
      />
    </>
  );
};

export default HoursTableControls;
