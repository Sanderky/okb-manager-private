import { Box, Typography } from '@mui/material';
import 'dayjs/locale/pl';
import { FOLDER_TRANSLATIONS } from '@/shared/config/storage';
import { EMPTY_MAP } from '../../model/services/useFileBrowser';
import React from 'react';

export const FileBreadcrumbs = ({
  path,
  baseDirectory,
  onClick,
  employeesMap = EMPTY_MAP,
  constructionsMap = EMPTY_MAP,
}: {
  path: string;
  baseDirectory: string;
  onClick: (path: string) => void;
  employeesMap?: Record<string, string>;
  constructionsMap?: Record<string, string>;
}) => {
  const fullPathSegments = path.split('/').filter(Boolean);
  const baseSegments = baseDirectory.split('/').filter(Boolean);

  const getDisplayName = (segment: string) => {
    if (FOLDER_TRANSLATIONS[segment]) return FOLDER_TRANSLATIONS[segment];

    if (employeesMap[segment]) return employeesMap[segment];

    if (constructionsMap[segment]) return constructionsMap[segment];

    return segment;
  };

  let rootDisplayName = 'Katalog główny';

  if (baseSegments.length > 0) {
    const lastBasePart = baseSegments[baseSegments.length - 1];
    const translatedName = getDisplayName(lastBasePart);

    if (translatedName !== lastBasePart) {
      rootDisplayName = translatedName;
    }
  }

  const startIndex = baseSegments.length;
  const visibleSegments = fullPathSegments.slice(startIndex);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      <Typography
        color={visibleSegments.length === 0 ? 'text.secondary' : 'text.primary'}
        variant="subtitle2"
        sx={{
          cursor: visibleSegments.length === 0 ? 'default' : 'pointer',
          '&:hover':
            visibleSegments.length > 0 ? { textDecoration: 'underline' } : {},
        }}
        onClick={() => visibleSegments.length > 0 && onClick(baseDirectory)}
      >
        {rootDisplayName}
      </Typography>

      {visibleSegments.length > 0 && (
        <Typography color="text.secondary" variant="body2">
          /
        </Typography>
      )}

      {visibleSegments.map((part, i) => {
        const isLast = i === visibleSegments.length - 1;

        const href = [...baseSegments, ...visibleSegments.slice(0, i + 1)].join(
          '/'
        );

        const displayName = getDisplayName(part);
        return (
          <React.Fragment key={i}>
            {isLast ? (
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ flexShrink: 0 }}
              >
                {displayName}
              </Typography>
            ) : (
              <Typography
                color="text.primary"
                variant="subtitle2"
                sx={{
                  flexShrink: 0,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => onClick(href)}
              >
                {displayName}
              </Typography>
            )}

            {!isLast && (
              <Typography color="text.secondary" variant="body2">
                /
              </Typography>
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};
