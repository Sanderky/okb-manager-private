import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Contractor } from '@/entities/contractor';

interface ContractorsListProps {
  setOpenNote: (contractorId: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  contractors: Contractor[] | undefined;
  isFetchingError: boolean;
  handleAdd: (newName: string) => void;
}

export const ContractorsList = ({
  setOpenNote,
  handleAdd,
  isFetching,
  isFetchingError,
  isLoading,
  contractors,
}: ContractorsListProps) => {
  const { t } = useTranslation(['contractors', 'common']);
  const [newName, setNewName] = useState('');

  const onAdd = () => {
    handleAdd(newName);
    setNewName('');
  };

  if (isFetching)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (isFetchingError)
    return <Alert severity="error">{t('errors.fetchFailed')}</Alert>;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={(theme) => ({
          flex: 1,
          overflowY: 'auto',
          borderRadius: 0,
          border: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            '& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root':
              {
                borderBottom: 'none !important',
              },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell width="5%">{t('table.index')}</TableCell>
              <TableCell width="85%">{t('table.name')}</TableCell>
              <TableCell width="10%">{t('table.constructions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!contractors || contractors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  sx={{
                    textAlign: 'center',
                    py: 3,
                  }}
                >
                  {t('table.noData')}
                </TableCell>
              </TableRow>
            ) : (
              contractors?.map((contractor, index) => (
                <TableRow
                  hover
                  key={contractor.id}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setOpenNote(contractor.id)}
                >
                  <TableCell sx={{ textAlign: 'center' }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ minWidth: 160, width: 'min-content' }}>
                    {contractor.name}
                  </TableCell>
                  <TableCell align="center">
                    {contractor.constructionsCount ?? '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack
        direction={'row'}
        spacing={2}
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          zIndex: 2,
          flexShrink: 0,
        }}
      >
        <TextField
          size="small"
          fullWidth
          label={t('newContractorLabel')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          variant="outlined"
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          disabled={isLoading}
        />

        <Button
          variant="contained"
          onClick={onAdd}
          disabled={!newName.trim()}
          sx={{ whiteSpace: 'nowrap' }}
          loading={isLoading}
        >
          {t('common:buttons.add')}
        </Button>
      </Stack>
    </Box>
  );
};
