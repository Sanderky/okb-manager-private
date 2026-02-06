import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Chip,
  Divider,
  Tooltip,
  Link,
} from '@mui/material';
import { Edit, LocationOn, DateRange, People } from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';

import type { Employee } from '../../../shared/model/types';
import { openGoogleMaps } from '../../../shared/lib/date';
import type { ExtendedLodging } from '../types';
import { getEmployeeLabel } from '../utils';


interface LodgingCardProps {
  lodging: ExtendedLodging;
  employees: Employee[];
  onEdit: (l: ExtendedLodging) => void;
  onEmployeeClick: (id: string) => void;
  siteName?: string;
  siteId?: string;
  handleClickOnConstruction: (id: string | undefined) => void;
}

const LodgingCard: React.FC<LodgingCardProps> = ({
  lodging,
  employees,
  onEdit,
  onEmployeeClick,
  siteName,
  siteId,
  handleClickOnConstruction,
}) => {
  const assignedEmployees = useMemo(
    () => employees.filter((e) => lodging.employeeIds.includes(e.id)),
    [employees, lodging.employeeIds]
  );

  const isActive = dayjs().isBetween(
    lodging.startDate,
    lodging.endDate,
    'day',
    '[]'
  );

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: '0.3s',
        '&:hover': {
          borderColor: 'primary.main',
        },
        '&:hover .lodgings-edit': {
          opacity: 1,
          transform: 'translateY(0)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box pr={2}>
            <Stack direction="column" spacing={1}>
              <Box>
                {siteName && (
                  <Typography
                    fontWeight="bold"
                    onClick={() => handleClickOnConstruction(siteId)}
                    sx={{
                      ':hover': {
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {siteName}
                  </Typography>
                )}
                {lodging.name && (
                  <Typography
                    variant="h6"
                    color="textSecondary"
                    component="div"
                    gutterBottom
                    fontWeight={400}
                    sx={{ lineHeight: 1.2 }}
                  >
                    {lodging.name}
                  </Typography>
                )}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <DateRange fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {dayjs(lodging.startDate).format('DD.MM')} -{' '}
                  {dayjs(lodging.endDate).format('DD.MM.YYYY')}
                </Typography>
                {isActive && (
                  <Chip
                    label="Aktywny"
                    color="success"
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </Stack>
              {lodging.address && (
                <Tooltip title="Otwórz w Google Maps">
                  <Link
                    sx={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'row',
                      textDecoration: 'none',
                      alignItems: 'center',
                    }}
                    onClick={() => openGoogleMaps(lodging.address)}
                  >
                    <LocationOn fontSize="small" sx={{ color: 'location' }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        color: 'location',
                        ':hover': { textDecoration: 'underline' },
                      }}
                    >
                      {lodging.address}
                    </Typography>
                  </Link>
                </Tooltip>
              )}
            </Stack>
          </Box>
          <Box>
            <IconButton
              sx={{
                transition: 'all 0.2s ease-in-out',
                opacity: 1,
                transform: 'translateY(0)',
                '@media (hover: hover)': {
                  opacity: 0,
                  transform: 'translateY(5px)',
                },
              }}
              className="lodgings-edit"
              size="small"
              onClick={() => onEdit(lodging)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        </Stack>

        {lodging.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {lodging.description}
          </Typography>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <People fontSize="small" color="action" />
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            ZAKWATEROWANI ({assignedEmployees.length}):
          </Typography>
        </Stack>

        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {assignedEmployees.length > 0 ? (
            assignedEmployees.map((emp) => (
              <Chip
                onClick={() => onEmployeeClick(emp.id)}
                key={emp.id}
                label={getEmployeeLabel(emp.name, lodging, emp.id)}
                size="small"
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transform: 'scale 0.5s ease',
                  ':hover': { scale: '1.05' },
                  textDecoration: emp.status ? '' : 'line-through',
                }}
              />
            ))
          ) : (
            <Typography
              variant="caption"
              color="text.disabled"
              fontStyle="italic"
            >
              Brak przypisanych pracowników
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LodgingCard;
