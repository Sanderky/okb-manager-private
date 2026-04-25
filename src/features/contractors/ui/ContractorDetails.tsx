import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Note } from '@/shared/ui/Note';
import { Link } from 'react-router-dom';
import type { Construction } from '@/entities/construction';
import { type Contractor } from '@/entities/contractor';

const ITEMS_PER_PAGE = 10;

interface ContractorDetailsProps {
  contractor: Contractor;
  onSaveNote: (contractorId: string, newNote: string) => Promise<void>;
  onEdit: (newName: string, contractor: Contractor) => void;
  onDelete: (contractor: Contractor) => void;
  isLoading: boolean;
  constructions: Construction[];
}

export const ContractorDetails = ({
  contractor,
  onEdit,
  onDelete,
  isLoading,
  onSaveNote,
  constructions,
}: ContractorDetailsProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [localName, setLocalName] = useState(contractor.name);
  const [page, setPage] = useState(1);
  const handleSave = () => {
    onEdit(localName, contractor);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setLocalName(contractor.name);
  };

  useEffect(() => {
    setPage(1);
  }, [contractor.id]);

  const count = Math.ceil(constructions.length / ITEMS_PER_PAGE);
  const paginatedConstructions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return constructions.slice(start, end);
  }, [constructions, page]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Stack direction={'column'} spacing={2}>
      <TextField
        size="small"
        value={isEditMode ? localName : contractor.name}
        fullWidth
        label={'Nazwa'}
        disabled={isLoading || !isEditMode}
        onChange={(e) => setLocalName(e.target.value)}
      />

      <Stack direction={'row'} spacing={1} justifyContent={'space-between'}>
        <Stack direction={'row'} spacing={1}>
          {isEditMode ? (
            [
              <Button
                key="save"
                onClick={handleSave}
                variant="contained"
                size="small"
                disabled={isLoading}
              >
                Zapisz
              </Button>,
              <Button
                key="cancel"
                onClick={handleCancel}
                color="inherit"
                variant="outlined"
                size="small"
                disabled={isLoading}
              >
                Anuluj
              </Button>,
            ]
          ) : (
            <Button
              key="edit"
              color="primary"
              variant="outlined"
              size="small"
              onClick={() => setIsEditMode(true)}
            >
              Edytuj nazwę
            </Button>
          )}
        </Stack>

        <Button
          key="delete"
          color="error"
          variant="outlined"
          size="small"
          onClick={() => onDelete(contractor)}
          disabled={isLoading}
        >
          Usuń wykonawcę
        </Button>
      </Stack>
      <Divider />
      <Box>
        <Typography variant="body1" className="font-medium">
          Lista budów:
        </Typography>
        {!constructions || constructions?.length === 0 ? (
          <Typography variant="overline">Brak budów</Typography>
        ) : (
          <>
            <List dense>
              {paginatedConstructions.map((c, index) => {
                const realIndex = (page - 1) * ITEMS_PER_PAGE + index + 1;

                return (
                  <ListItem key={c.id}>
                    <Link
                      to={`/constructions/${c.id}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        width: '100%',
                      }}
                    >
                      <Typography
                        sx={{
                          textDecoration: c.status ? 'none' : 'line-through',
                          color: c.status ? 'text.primary' : 'text.disabled',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        {`${realIndex}. ${c.name}`}
                      </Typography>
                    </Link>
                  </ListItem>
                );
              })}
            </List>

            {count > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Pagination
                  count={count}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="small"
                />
              </Box>
            )}
          </>
        )}
      </Box>
      <Divider />

      <Note
        content={contractor.note ?? ''}
        onSave={(note) => onSaveNote(contractor.id, note)}
        showFrame={false}
      />
    </Stack>
  );
};
