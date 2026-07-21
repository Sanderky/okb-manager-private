import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { CellDisplayItem } from '../../model/types';

interface ScheduleCellContentProps {
  items: CellDisplayItem[];
  isWeek: boolean;
}

export const ScheduleCellContent: React.FC<ScheduleCellContentProps> = ({
  items,
  isWeek,
}) => {
  if (items.length === 0) return null;

  if (!isWeek) {
    const item = items[0];
    return (
      <Typography
        className="font-medium"
        variant="body2"
        sx={{
          textDecoration: !item.isActive ? 'line-through' : 'none',
          color: item.isVacation
            ? 'vacation'
            : !item.isActive
              ? 'text.disabled'
              : 'text.primary',
        }}
      >
        {item.text}
      </Typography>
    );
  }

  return (
    <Stack
      direction="column"
      spacing={0.5}
      justifyContent="center"
      sx={{ width: '100%', py: 0.5 }}
    >
      {items.map((item) => (
        <Box
          component="div"
          key={item.id + item.text}
          sx={{
            textDecoration: !item.isActive ? 'line-through' : 'none',
            color: item.isVacation
              ? 'vacation'
              : !item.isActive
                ? 'text.disabled'
                : 'inherit',
            fontSize: '0.75rem',
            fontWeight: 500,
            lineHeight: 1.3,
          }}
        >
          {item.text}
        </Box>
      ))}
    </Stack>
  );
};
