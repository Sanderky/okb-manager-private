import React from 'react';
import { Stack, Tabs, Tab, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export interface EmployeeShowTopToolbarProps {
  tab: number;
  handleTabChange: (_: React.SyntheticEvent, newValue: number) => void;
  handleEmployeeEdit: () => void;
}

export const EmployeeShowTopToolbar = ({
  tab,
  handleTabChange,
  handleEmployeeEdit,
}: EmployeeShowTopToolbarProps) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={(theme) => ({
        background: theme.palette.background.paper,
        pr: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Tabs value={tab} onChange={handleTabChange}>
        <Tab
          label="Informacje"
          sx={{
            fontSize: { xs: '0.8rem', sm: '.85rem' },
            padding: 2,
            minWidth: 0,
          }}
        />
        <Tab
          label="Pliki"
          sx={{
            fontSize: { xs: '0.8rem', sm: '.85rem' },
            padding: 2,
            minWidth: { xs: 0, sm: 100 },
          }}
        />
      </Tabs>
      <Stack
        direction="row"
        justifyContent="flex-end"
        flexGrow={1}
        spacing={{ xs: 1.5, sm: 3 }}
        sx={{ pl: 1 }}
      >
        <Tooltip title="Edytuj pracownika">
          <IconButton
            onClick={handleEmployeeEdit}
            color="primary"
            className="rounded-full border"
            size="small"
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
};
