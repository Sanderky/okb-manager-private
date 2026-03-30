import { Grid } from '@mui/material';
import 'dayjs/locale/pl';
import { type Employee } from '@/entities/employee';
import LodgingCard from './LodgingCard';
import { type Construction } from '@/entities/construction';
import type { Lodging } from '../model/types';

interface Props {
  lodgings: Lodging[];
  constructions: Construction[];
  employees: Employee[];
  handleEmployeeClick: (id: string) => void;
  onEdit: (lodging: Lodging) => void;
  handleClickOnConstruction: (id: string | undefined) => void;
}
export const LodgingsCards = ({
  lodgings,
  constructions,
  employees,
  handleEmployeeClick,
  onEdit,
  handleClickOnConstruction,
}: Props) => {
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
              onEdit={onEdit}
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
