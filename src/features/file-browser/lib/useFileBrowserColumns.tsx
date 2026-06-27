import { useMemo } from 'react';
import type { MRT_ColumnDef } from 'material-react-table';
import { Stack, Tooltip, Typography, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { FileBrowserItem } from '@/shared/model/types';
import { formatBytes } from '@/shared/lib/fileUtils';
import { RenderFileImage } from '../ui/components/RenderFileImage';

export const useFileBrowserColumns = () => {
  const { t } = useTranslation('fileBrowser');

  return useMemo<MRT_ColumnDef<FileBrowserItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('details.name'),
        muiTableBodyCellProps: { sx: { pl: 0 } },
        muiTableHeadCellProps: { sx: { pl: 0 } },
        Cell: ({ renderedCellValue, cell, row }) => (
          <Stack direction="row" alignItems="center" spacing={1}>
            <RenderFileImage file={row.original} />
            <Tooltip enterDelay={500} title={cell.getValue() as string}>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {renderedCellValue}
              </Typography>
            </Tooltip>
          </Stack>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('details.added'),
        size: 150,
        muiTableHeadCellProps: {
          sx: { display: { xs: 'none', md: 'table-cell' } },
        },
        muiTableBodyCellProps: {
          sx: { display: { xs: 'none', md: 'table-cell' } },
        },
        Cell: ({ cell, row }) => {
          if (row.original.type === 'folder') return '';

          const dateStr = cell.getValue() as string;

          const fullDate = dayjs(dateStr).format('DD.MM.YYYY, HH:mm');
          const shortDate = dayjs(dateStr).format('DD.MM.YYYY');

          return (
            <Tooltip enterDelay={500} title={fullDate}>
              <span>{shortDate}</span>
            </Tooltip>
          );
        },
      },
      {
        accessorKey: 'size',
        header: t('details.size'),
        size: 150,
        muiTableHeadCellProps: {
          sx: { display: { xs: 'none', md: 'table-cell' } },
        },
        muiTableBodyCellProps: {
          sx: { display: { xs: 'none', md: 'table-cell' } },
        },
        Cell: ({ cell, row }) => {
          if (row.original.type === 'folder') return '';
          return (
            <Chip
              label={formatBytes(cell.getValue() as number)}
              size="small"
              variant="outlined"
            />
          );
        },
      },
    ],
    [t]
  );
};
