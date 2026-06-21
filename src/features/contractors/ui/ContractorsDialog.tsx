import {
  Box,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import BaseDialog from '@/shared/ui/BaseDialog';
import { useMemo } from 'react';
import { ArrowBack } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { type Contractor } from '@/entities/contractor';
import { ContractorDetails } from './ContractorDetails';
import { ContractorsList } from './ContractorsList';
import { useContractorsService } from '../model/services/useContractorsService';
interface ContractorsDialogProps {
  open: boolean;
  onClose: () => void;
}
export const ContractorsDialog = ({
  open,
  onClose
}: ContractorsDialogProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeNoteContractor = searchParams.get('contractorId');

  const handleSetActiveContractor = (id: string | null) => {
    setSearchParams((prev) => {
      if (id) {
        prev.set('contractorId', id);
      } else {
        prev.delete('contractorId');
      }
      return prev;
    });
  };

  const contractorsController = useContractorsService();
  const activeContractor = useMemo(() => {
    return contractorsController.contractors?.find((c) => c.id === activeNoteContractor);
  }, [activeNoteContractor, contractorsController.contractors]);

  const handleDelete = async (contractor: Contractor) => {
    const result = await contractorsController.handleDelete(contractor);
    if (result) {
      handleSetActiveContractor(null);
    }
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={'Wykonawcy'}
      showCancel={false}
      maxWidth={'md'}
      contentSx={{
        p: 0,
        position: 'relative',
        overflow: 'hidden',
        height: '70vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {activeContractor && (
        <Box
          sx={(theme) => ({
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            backgroundColor: theme.palette.background.paper,
            display: 'flex',
            flexDirection: 'column',
          })}
        >
          <Stack
            direction={'row'}
            alignItems={'center'}
            gap={1}
            sx={(theme) => ({
              borderBottom: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.default,
              px: 1,
              flexShrink: 0,
            })}
          >
            <IconButton onClick={() => handleSetActiveContractor(null)}>
              <ArrowBack />
            </IconButton>
            <Typography>Szczegóły:</Typography>
            <Typography fontWeight="bold">{activeContractor.name}</Typography>
          </Stack>

          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              p: 2,
              pt: 4,
            }}
          >
            <ContractorDetails
              contractor={activeContractor}
              onDelete={handleDelete}
              onEdit={contractorsController.handleEdit}
              onSaveNote={contractorsController.handleSaveNote}
              isLoading={contractorsController.isLoading}
              constructions={contractorsController.getConstructionsForContractor(activeContractor.id)}
            />
          </Box>
        </Box>
      )}

      <ContractorsList setOpenNote={handleSetActiveContractor} {...contractorsController} />
    </BaseDialog>
  );
};


