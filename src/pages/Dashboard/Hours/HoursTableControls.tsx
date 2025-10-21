import React from 'react';
import {
  Button,
  Box,
  Typography,
  MenuItem,
  IconButton,
  Switch,
  Stack,
  Tooltip,
  Divider,
  Grid,
  Menu,
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
} from '@mui/icons-material';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
import WeekSelector from '../../../components/WeekSelector';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useReactToPrint } from 'react-to-print';

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

  return (
    <>
      <Stack
        spacing={1}
        direction={'row'}
        justifyContent={'space-between'}
        className="border-lightGray mb-1 rounded-lg border p-2"
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
          <MenuItem disableRipple sx={{ fontWeight: 'bold' }}>
            Tydzień {dayjs(currentWeek).isoWeek()}
          </MenuItem>
          <Divider />

          <MenuItem
            onClick={() => {
              handleCloseMobileMenu();
              handleWeekChange('prev');
            }}
            disableRipple
          >
            Poprzedni tydzień
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseMobileMenu();
              handleWeekChange('current');
            }}
            disableRipple
          >
            Obecny tydzień
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseMobileMenu();
              handleWeekChange('next');
            }}
            disableRipple
          >
            Następny tydzień
          </MenuItem>
          <Divider />
          {!readOnly && [
            <MenuItem
              onClick={() => {
                handleCloseMobileMenu();
                handleToggleEditMode();
              }}
              disableRipple
            >
              {editMode ? 'Wyłącz edycję' : 'Włącz edycję'}
            </MenuItem>,
            <MenuItem
              onClick={() => {
                handleCloseMobileMenu();
                handleCopyDataDialogOpen();
              }}
              disableRipple
            >
              Kopiuj z innego tygodnia
            </MenuItem>,
          ]}
          <MenuItem
            onClick={() => {
              reactToPrintFn();
              handleToggleExpand();
            }}
            disableRipple
          >
            Drukuj
          </MenuItem>
          <MenuItem
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

      <Box
        className="border-lightGray mb-1 rounded-lg border p-2"
        sx={{
          display: { xs: 'none', sm: 'flex' },

          flexDirection: 'row',
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
          </Grid>

          <Grid display={'flex'} alignItems="center" sx={{ pr: 1.5, pl: 1.5 }}>
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
                <Tooltip title="Tryb edycji">
                  <Switch
                    disabled={isLoading}
                    checked={editMode}
                    onChange={(e) =>
                      handleToggleEditMode(e.currentTarget.checked)
                    }
                  />
                </Tooltip>
                <Tooltip title="Drukuj tabelkę">
                  <IconButton
                    disabled={isLoading}
                    onClick={reactToPrintFn}
                    loading={isLoading}
                  >
                    <Print />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Kopiuj z innego tygodnia">
                  <IconButton
                    disabled={isLoading}
                    onClick={handleCopyDataDialogOpen}
                    loading={isCoping}
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title={isExpanded ? 'Zwiń' : 'Rozwiń'}>
              <IconButton onClick={handleToggleExpand}>
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
            {readOnly && onTableDelete && (
              <Tooltip title="Usuń tabelę porównawczą">
                <IconButton disabled={isLoading} onClick={onTableDelete}>
                  <Clear />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Stack>
      </Box>
    </>
  );
};

export default HoursTableControls;
