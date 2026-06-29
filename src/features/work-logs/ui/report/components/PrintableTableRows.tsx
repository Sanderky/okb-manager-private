import React from 'react';
import { TableCell, TableRow, Box, Typography } from '@mui/material';
import { CancelPresentation } from '@mui/icons-material';
import type { ConstructionsWithWorkHours } from '../../../model/types';
import type { LangCode } from '@/shared/model/types';
import { formatDecimal } from '@/shared/lib/format';
import { printStyles } from './printStyles';
import { useTranslation } from 'react-i18next';

interface PrintableTableRowsProps {
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  showVacation: boolean;
  lang: LangCode;
}

export const PrintableTableRows = ({
  constructionsWithWorkHours,
  showVacation,
  lang,
}: PrintableTableRowsProps) => {
  const { t } = useTranslation('workLogs');

  if (constructionsWithWorkHours.length > 0) {
    return constructionsWithWorkHours.map((construction) => {
      return (
        <React.Fragment key={construction.id}>
          {construction.workHours.map((workHour, employeeIndex) => (
            <TableRow key={workHour.id}>
              <TableCell
                sx={{
                  px: 1,
                  py: 0,
                  fontWeight: 600,
                  verticalAlign: 'top',
                  borderBottom: 'none !important',
                  borderTop: 'none !important',
                  width: printStyles.constructionCellWidth,
                  minWidth: printStyles.constructionCellMinWidth,
                }}
              >
                {employeeIndex === 0 ? construction.name : ''}
              </TableCell>

              <TableCell
                sx={{
                  px: 1,
                  py: 0,
                  width: printStyles.employeeCellWidth,
                  fontWeight: 600,
                  minWidth: printStyles.employeeCellMinWidth,
                  borderTop: printStyles.tableBorder,
                }}
              >
                {workHour.employeeName}
              </TableCell>

              {workHour.hours.map((hour, dayIndex) => {
                const isVacation = workHour.isOnVacation[dayIndex];
                let content;

                if (isVacation && showVacation) {
                  content = (
                    <Typography variant="body2" color="textPrimary">
                      {t('print.report.vacation', { lng: lang })}
                    </Typography>
                  );
                } else if (hour === null || hour === undefined) {
                  content = null;
                } else {
                  content = (
                    <Typography>{formatDecimal(hour, lang)}</Typography>
                  );
                }

                return (
                  <TableCell
                    key={dayIndex}
                    align="center"
                    sx={{
                      borderTop: printStyles.tableBorder,
                      width: printStyles.numberCellMaxWidth,
                      minWidth: '20px',
                      p: printStyles.numberCellPadding,
                    }}
                  >
                    {content}
                  </TableCell>
                );
              })}

              <TableCell
                align="center"
                sx={{
                  fontWeight: 600,
                  width: printStyles.numberCellMaxWidth,
                  minWidth: '20px',
                  p: printStyles.numberCellPadding,
                }}
              >
                {formatDecimal(workHour.total, lang)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell
              sx={{
                borderTop: 'none !important',
                borderBottom: printStyles.borderBold,
                p: 0.5,
                background: '#fff',
              }}
            ></TableCell>
            <TableCell
              sx={{
                borderBottom: printStyles.borderBold,
                p: 0.5,
                background: '#fff',
                borderRight: 'none !important',
              }}
              colSpan={8}
            ></TableCell>
            <TableCell
              align="center"
              className="bg-gray-100"
              sx={{
                borderBottom: printStyles.borderBold,
                p: 0.5,
                fontWeight: 'bold',
                padding: 0,
                borderLeft: 'none !important',
              }}
            >
              {formatDecimal(construction.totalHours, lang)}
            </TableCell>
          </TableRow>
        </React.Fragment>
      );
    });
  } else {
    return (
      <TableRow>
        <TableCell colSpan={10} sx={{ height: '300px' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CancelPresentation
              sx={{ color: 'text.secondary', fontSize: 40 }}
            />
            <Typography color="textSecondary" variant="body2">
              {t('print.report.noData', { lng: lang })}
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
    );
  }
};
