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

  return (
    <>
      <Stack
        spacing={1}
        direction={'row'}
        justifyContent={'space-between'}
        className="border-lightGray rounded-lg border bg-gray-50 p-2"
        sx={{
          border: tableBorder,
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
          sx={{ flexShrink: 0 }}
        >
          <Typography
            sx={{
              display: { xs: 'none', sm: 'none', md: 'none', lg: 'block' },
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
        </Stack>
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
            key={1}
          >
            Tydzień {dayjs(currentWeek).isoWeek()}
          </MenuItem>
          <Divider />

          {!readOnly && (
            <MenuItem
              key={2}
              onClick={() => {
                if (!isExpanded) handleToggleExpand();
                handleCloseMobileMenu();
                handleToggleEditMode();
              }}
              disableRipple
            >
              {editMode ? 'Zapisz' : 'Edytuj'}
            </MenuItem>
          )}
          {!readOnly && editMode && (
            <MenuItem
              key={3}
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
              key={4}
              onClick={() => {
                handleCloseMobileMenu();
                handleCopyDataDialogOpen();
              }}
              disableRipple
            >
              Kopiuj z innego tygodnia
            </MenuItem>
          )}
          {!readOnly && editMode && (
            <MenuItem
              key={5}
              onClick={() => {
                handleFillWithSchedule();
                handleCopyDataDialogOpen();
              }}
              disableRipple
            >
              Uzupełnij proponowane
            </MenuItem>
          )}
          <Divider />
          <MenuItem
            key={6}
            onClick={() => {
              setIsFilterOpen(true);
              handleCloseMobileMenu();
            }}
            disableRipple
          >
            {`Filtry (${selectedConstructions.length + selectedEmployees.length})`}
          </MenuItem>
          <MenuItem
            key={7}
            onClick={() => {
              reactToPrintFn();
              handleCloseMobileMenu();
            }}
            disableRipple
          >
            Drukuj
          </MenuItem>
          <MenuItem
            key={8}
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
              key={9}
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
      <Stack
        direction={'row'}
        sx={{
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
          width: '100%',
          mt: 1,
          mb: 1,
        }}
      >
        <IconButton
          size="small"
          className="rounded-l-lg rounded-r-none border text-blue-300"
          onClick={() => handleWeekChange('prev')}
        >
          <ChevronLeft />
        </IconButton>
        <Button
          variant="outlined"
          className="rounded-none border-x-0"
          onClick={() => handleWeekChange('current')}
          sx={{
            width: '100%',
          }}
        >
          Dziś
        </Button>
        <IconButton
          size="small"
          className="rounded-l-none rounded-r-lg border text-blue-300"
          onClick={() => handleWeekChange('next')}
        >
          <ChevronRight />
        </IconButton>
      </Stack>
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
              <IconButton
                size="small"
                className="rounded-l-lg rounded-r-none border text-blue-300"
                onClick={() => handleWeekChange('prev')}
              >
                <ChevronLeft />
              </IconButton>
              <Button
                variant="outlined"
                className="rounded-none border-x-0"
                onClick={() => handleWeekChange('current')}
              >
                Dziś
              </Button>
              <IconButton
                size="small"
                className="rounded-l-none rounded-r-lg border text-blue-300"
                onClick={() => handleWeekChange('next')}
              >
                <ChevronRight />
              </IconButton>
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
                    className="rounded-lg border text-blue-500"
                    onClick={() => setIsFilterOpen(true)}
                    sx={{
                      ml: 1,
                    }}
                  >
                    <FilterListIcon />
                  </IconButton>
                </Badge>
              </Tooltip>
            </Stack>
          </Grid>

          <Grid display={'flex'} alignItems="center">
            <Typography component={'div'} variant="body1">
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
