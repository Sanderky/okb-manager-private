import React, { useState } from 'react';
import { Button, Box, Typography, Divider, Stack, Alert } from '@mui/material';
import HoursTable from './HoursTable';
import { Add, Summarize } from '@mui/icons-material';
import { PrintReportDialog } from './HoursTableDialogs';

const Hours: React.FC = () => {
  const [comparisionTables, setComparisionTables] = useState<number[]>([]);
  const handleDeleteTable = (keyToDelete: number) => {
    setComparisionTables((prev) => prev.filter((key) => key !== keyToDelete));
  };

  const [printReportDialogOpen, setPrintReportDialogOpen] = useState(false);

  return (
    <Box p={3}>
      <Stack
        mb={3}
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          rowGap: 2,
        }}
      >
        <Typography variant="h4" className="text-2xl font-medium md:text-3xl">
          Ewidencja godzin pracy
        </Typography>
        <Button
          onClick={() => setPrintReportDialogOpen(true)}
          startIcon={<Summarize />}
          variant="contained"
        >
          Drukuj raport
        </Button>
      </Stack>
      <Alert sx={{ mb: 3 }} severity="info">
        Zmiany od razu zapisują się w bazie danych
      </Alert>

      <Stack direction="column" spacing={6}>
        <HoursTable readOnly={false} />

        {comparisionTables.map((key, index) => (
          <Box>
            <Typography
              variant="h5"
              component={'div'}
              mb={1}
              sx={{ fontSize: '1.2rem' }}
            >
              Tabela porównawcza {index + 1}
            </Typography>

            <HoursTable
              key={key}
              onTableDelete={() => handleDeleteTable(key)}
            />
          </Box>
        ))}
      </Stack>

      <Divider sx={{ mt: 10, mb: 5 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() =>
            setComparisionTables((prev) => [...prev, prev.length + 1])
          }
        >
          Dodaj tabelkę porównawczą
        </Button>
      </Divider>

      <PrintReportDialog
        open={printReportDialogOpen}
        onClose={() => setPrintReportDialogOpen(false)}
      />
    </Box>
  );
};

export default Hours;
