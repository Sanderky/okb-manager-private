import Box from '@mui/material/Box';
import { useParams } from 'react-router';
import PageContainer from '../../../components/PageContainer';
import { useTranslation } from 'react-i18next';

export default function ConstructionShow() {
  const { constructionId } = useParams();
  const {t} = useTranslation() 
  

  return (
    <PageContainer
      title={`${t('constructions.construction')} ${constructionId}`}
      breadcrumbs={[
        { title: t('constructions.constructions'), path: '/constructions' },
        { title: constructionId || t('constructions.construction') },
      ]}
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>szczegóły budowy</Box>
    </PageContainer>
  );
}
