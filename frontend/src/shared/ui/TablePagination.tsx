import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Stack,
  Typography,
  Select,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { type MRT_TableInstance } from 'material-react-table';

const PaginationInput = ({ table }: { table: MRT_TableInstance<any> }) => {
  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount() === 0 ? 1 : table.getPageCount();

  const [value, setValue] = useState(String(pageIndex + 1));

  useEffect(() => {
    setValue(String(pageIndex + 1));
  }, [pageIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleCommit = () => {
    let page = Number(value) - 1;
    if (isNaN(page) || value === '') {
      page = pageIndex;
    } else {
      page = Math.min(Math.max(0, page), pageCount - 1);
    }
    table.setPageIndex(page);
    setValue(String(page + 1));
  };

  return (
    <Box
      component="input"
      type="number"
      min={1}
      max={pageCount}
      value={value}
      onChange={handleChange}
      onBlur={handleCommit}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleCommit();
      }}
      sx={(theme) => ({
        width: '40px',
        padding: '4px',
        height: '25px',
        textAlign: 'center',
        fontSize: '13px',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '4px',
        '&:focus': {
          outline: 'none',
          borderColor: 'primary.main',
        },
        '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
          WebkitAppearance: 'none',
          margin: 0,
        },
        MozAppearance: 'textfield',
      })}
    />
  );
};

interface TablePaginationProps {
  table: MRT_TableInstance<any>;
}

export const TablePagination = ({ table }: TablePaginationProps) => {
  const { t } = useTranslation('common');
  const { pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount() === 0 ? 1 : table.getPageCount();
  const totalRows = table.getPrePaginationRowModel().rows.length;

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        p: 1,
        borderTop: `1px solid ${theme.palette.divider}`,
        gap: 1,
        backgroundColor: theme.palette.background.paper,
      })}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        flexWrap={'nowrap'}
      >
        <IconButton
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          size="small"
          sx={{ p: 0.5 }}
        >
          <KeyboardArrowLeft fontSize="small" />
        </IconButton>

        <Stack direction="row" alignItems="center" spacing={1}>
          <PaginationInput table={table} />
          <Typography
            whiteSpace={'nowrap'}
            variant="overline"
            className="font-medium"
            color="textSecondary"
            sx={{ lineHeight: 1, textTransform: 'none' }}
          >
            {t('pagination.of', { count: pageCount })}
          </Typography>
        </Stack>

        <IconButton
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          size="small"
          sx={{ p: 0.5 }}
        >
          <KeyboardArrowRight fontSize="small" />
        </IconButton>
      </Stack>

      <Select
        value={pageSize}
        onChange={(e) => table.setPageSize(Number(e.target.value))}
        size="small"
        displayEmpty
        variant="outlined"
        sx={(theme) => ({
          height: '25px',
          fontSize: '13px',
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.divider,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
          },
        })}
      >
        {[5, 10, 20, 50, 100].map((size) => (
          <MenuItem key={size} value={size} sx={{ fontSize: '13px' }}>
            {t('pagination.rows', { count: size })}
          </MenuItem>
        ))}
      </Select>

      <Typography
        variant="overline"
        className="font-medium"
        sx={{ lineHeight: 1, textAlign: 'center' }}
        color="textSecondary"
      >
        {t('pagination.results', { count: totalRows })}
      </Typography>
    </Box>
  );
};
