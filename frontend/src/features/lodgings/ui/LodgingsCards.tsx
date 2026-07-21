import { Grid } from '@mui/material';
import 'dayjs/locale/pl';
import LodgingCard from './LodgingCard';
import type { Lodging } from '../model/types';
import { useLodgingsContext } from '../model/providers/LodgingsContext';

export const LodgingsCards = () => {
  const {
    handleClickOnConstruction,
    lodgings,
    openEdit,
    employees,
    constructions,
    handleEmployeeClick,
  } = useLodgingsContext();

  return (
    <Grid p={{ xs: 2, sm: 3 }} container spacing={3}>
      {lodgings.map((lodging) => {
        const construction = constructions.find(
          (s) => s.id === (lodging as Lodging).constructionSiteId
        );
        return (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={lodging.id}>
            <LodgingCard
              onEmployeeClick={handleEmployeeClick}
              lodging={lodging}
              employees={employees}
              onEdit={openEdit}
              handleClickOnConstruction={handleClickOnConstruction}
              constructionName={construction?.name}
              constructionId={construction?.id}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};
