import React from 'react';
import { Box, Tooltip, Typography, Stack, Link } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import type { Lodging } from '../model/types';
import type { Employee } from '@/entities/employee';
import { CELL_WIDTH, BAR_HEIGHT } from './LodgingsTimeline';
import { openGoogleMaps } from '@/shared/lib/browser';
import { LocationOn } from '@mui/icons-material';
import { getEmployeeLabel } from '../model/label';

interface TimelineBarProps {
  lodging: Lodging;
  startDiff: number;
  duration: number;
  topPosition: number;
  employees: Employee[];
  onEdit: (l: Lodging) => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  lodging,
  startDiff,
  duration,
  topPosition,
  employees,
  onEdit,
}) => {
  const getEmployeeNames = (ids: string[]) => {
    return ids
      .map((id) => employees.find((e) => e.id === id)?.name || 'Nieznany')
      .join(', ');
  };

  const assignedEmployees = employees.filter((e) =>
    lodging.employeeIds.includes(e.id)
  );

  const isActive = dayjs().isBetween(
    lodging.startDate,
    lodging.endDate,
    'day',
    '[]'
  );

  return (
    <Tooltip
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography
            variant="caption"
            display="block"
            sx={{ mb: 1 }}
          >{`${dayjs(lodging.startDate).format('DD.MM')} - ${dayjs(lodging.endDate).format('DD.MM.YYYY')}`}</Typography>

          {lodging.description && (
            <Typography
              display="block"
              sx={{ mb: 1 }}
              variant="caption"
              gutterBottom
            >
              {lodging.description}
            </Typography>
          )}

          {lodging.address && (
            <Link
              sx={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'row',
                textDecoration: 'none',
                mb: 1,
                alignItems: 'center',
              }}
              onClick={() => openGoogleMaps(lodging.address)}
            >
              <LocationOn
                fontSize="small"
                sx={{
                  color: 'location',
                  fontSize: '0.8rem',
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  color: 'location',
                  fontSize: '0.8rem',
                  ':hover': { textDecoration: 'underline' },
                }}
              >
                {lodging.address}
              </Typography>
            </Link>
          )}

          <Typography
            variant="caption"
            fontWeight="bold"
            display="block"
            gutterBottom
          >
            Zakwaterowani ({assignedEmployees.length}):
          </Typography>
          <Stack spacing={0.5}>
            {assignedEmployees.map((emp) => (
              <Typography key={emp.id} variant="caption" display="block">
                • {getEmployeeLabel(emp.name, lodging, emp.id)}
              </Typography>
            ))}
          </Stack>
        </Box>
      }
      arrow
      placement="top"
    >
      <Box
        onClick={() => onEdit(lodging)}
        sx={{
          position: 'absolute',
          left: startDiff * CELL_WIDTH,
          width: duration * CELL_WIDTH,
          height: BAR_HEIGHT,
          top: topPosition,
          bgcolor: isActive
            ? lodging.constructionSiteId
              ? 'primary.main'
              : 'warning.main'
            : 'grey.500',
          color: 'primary.contrastText',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          px: 1,
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: 1,
          transition: '0.2s',
          '&:hover': {
            zIndex: 15,
            bgcolor: isActive
              ? lodging.constructionSiteId
                ? 'primary.dark'
                : 'warning.dark'
              : 'grey.700',
          },
        }}
      >
        <Typography
          variant="caption"
          noWrap
          sx={{
            fontWeight: 'medium',
            fontSize: '0.7rem',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {lodging.name || getEmployeeNames(lodging.employeeIds)}
        </Typography>
      </Box>
    </Tooltip>
  );
};
