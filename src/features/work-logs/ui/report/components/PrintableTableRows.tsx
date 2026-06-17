import React from 'react';
import { TableCell, TableRow, Box, Typography } from '@mui/material';
import 'dayjs/locale/pl';
import { CancelPresentation } from '@mui/icons-material';
import type { ConstructionsWithWorkHours } from '../../../model/types';
import type { LangCode } from '@/shared/model/types';
import { formatToPolishDecimal } from '@/shared/lib/format';
import { getReportTranslations } from '../../../lib/reportTranslations';
import { printStyles } from './printStyles';

interface PrintableTableRows {
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  showVacation: boolean;
  lang: LangCode;
}

export const PrintableTableRows = ({
  constructionsWithWorkHours,
  showVacation,
  lang,
}: PrintableTableRows) => {
  const translations = getReportTranslations(lang);
  if (constructionsWithWorkHours.length > 0) {
    return constructionsWithWorkHours.map((construction) => {
      return (
        <React.Fragment key={construction.id}>
          {construction.workHours.map((workHour, employeeIndex) => (
            <TableRow key={workHour.id}>
              <TableCell
                sx={{
                  // p: numberCellPadding,
                  px: 1,
                  py: 0,
                  fontWeight: 600,
                  verticalAlign: 'top',
                  borderBottom: 'none !important',
                  borderTop: 'none !important',
                  width: printStyles.constructionCellWidth,
                  minWidth: printStyles.constructionCellMinWidth,
                  // wordBreak: 'break-all',
                }}
              >
                {employeeIndex === 0 ? construction.name : ''}
              </TableCell>

              <TableCell
                sx={{
                  // p: numberCellPadding,
                  px: 1,
                  py: 0,
                  // pl: 2,
                  width: printStyles.employeeCellWidth,
                  // fontWeight: 'bold',
                  fontWeight: 600,
                  minWidth: printStyles.employeeCellMinWidth,
                  borderTop: printStyles.tableBorder,
                  // wordBreak: 'break-all',
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
                      {translations.vacation}
                    </Typography>
                  );
                } else if (hour === null || hour === undefined) {
                  content = null;
                } else {
                  content = (
                    <Typography>{formatToPolishDecimal(hour)}</Typography>
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
                {formatToPolishDecimal(workHour.total)}
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
              {formatToPolishDecimal(construction.totalHours)}
            </TableCell>
          </TableRow>
        </React.Fragment>
      );
    });
  } else
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
              Brak danych dla danego tygodnia
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
    );
};
