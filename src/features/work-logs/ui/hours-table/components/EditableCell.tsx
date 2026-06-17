import React, { useState, useEffect, useCallback } from 'react';
import { Typography, InputBase } from '@mui/material';
import 'dayjs/locale/pl';
import { findAndFocus } from '../../../lib/findAndFocus';

const inputStyles = {
  textAlign: 'center',
  backgroundColor: 'transparent',
  padding: 0,
  height: '100%',
  flexGrow: 1,
} as const;

interface EditableCellProps {
  value: number | null;
  id: string;
  dayIndex: number;
  rowIndex: number;
  colIndex: number;
  onCommit: (id: string, dayIndex: number, val: number | null) => void;
  max?: number;
  isHoliday?: boolean;
  isActive: boolean;
}

export const EditableCell = React.memo(
  ({
    value,
    id,
    dayIndex,
    onCommit,
    max = 24,
    colIndex,
    rowIndex,
    isHoliday,
    isActive,
  }: EditableCellProps) => {
    const formatValue = (val: number | null) => {
      if (val === null) return '';
      return val.toString();
    };

    const [localValue, setLocalValue] = useState<string>(formatValue(value));

    useEffect(() => {
      setLocalValue(formatValue(value));
    }, [value]);

    const handleBlur = () => {
      let valToSend: number | null = null;

      if (localValue.trim() === '') {
        valToSend = null;
      } else {
        const parsed = parseFloat(localValue.replace(',', '.'));
        valToSend = isNaN(parsed) ? null : parsed;
      }

      if (valToSend !== value) {
        onCommit(id, dayIndex, valToSend);
      } else {
        setLocalValue(formatValue(valToSend));
      }
    };

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();

          if (colIndex === 6) {
            findAndFocus(rowIndex, 0, 1, 0);
          } else {
            findAndFocus(rowIndex, colIndex, 0, 1);
          }

          (e.target as HTMLElement).blur();
          return;
        }

        if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
        ) {
          e.preventDefault();

          let dRow = 0;
          let dCol = 0;

          switch (e.key) {
            case 'ArrowUp':
              dRow = -1;
              break;
            case 'ArrowDown':
              dRow = 1;
              break;
            case 'ArrowLeft':
              dCol = -1;
              break;
            case 'ArrowRight':
              dCol = 1;
              break;
          }

          findAndFocus(rowIndex, colIndex, dRow, dCol);
        }
      },
      [colIndex, rowIndex]
    );

    if (isHoliday) {
      return (
        <Typography color="vacation" variant="body2" className="font-medium">
          Urlop
        </Typography>
      );
    }

    return (
      <InputBase
        id={`cell-${rowIndex}-${colIndex}`}
        value={localValue}
        readOnly={!isActive}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        type="number"
        inputProps={{
          min: 0,
          max,
          step: 0.5,
          style: {
            ...inputStyles,
            caretColor: isActive ? 'auto' : 'transparent',
          },
        }}
        sx={(theme) => ({
          width: '100%',
          height: '100%',
          fontSize: '0.875rem',
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          '& .MuiInputBase-input': {
            height: '100% !important',
            color: theme.palette.text.primary,
            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '&[type=number]': { MozAppearance: 'textfield' },
            '&:focus': isActive
              ? {
                  boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`,
                }
              : {},
          },
        })}
      />
    );
  },
  (prev, next) => {
    return (
      prev.value === next.value &&
      prev.isHoliday === next.isHoliday &&
      prev.isActive === next.isActive &&
      prev.id === next.id &&
      prev.dayIndex === next.dayIndex &&
      prev.rowIndex === next.rowIndex &&
      prev.colIndex === next.colIndex
    );
  }
);
