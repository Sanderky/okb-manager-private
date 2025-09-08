import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/PageContainer';
import { useTranslation } from 'react-i18next';

export default function ConstructionsList() {
    const navigate = useNavigate();
      const { t } = useTranslation();

  const handleCreateClick = React.useCallback(() => {
      navigate('/constructions/new');
    }, [navigate]);


  return (
    <PageContainer
      title={t('constructions.constructionsList')}
      breadcrumbs={[{ title: t('constructions.constructions') }]}
      actions={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Reload data" placement="right" enterDelay={1000}>
            <div>
              <IconButton size="small" aria-label="refresh" onClick={()=>{}}>
                <RefreshIcon />
              </IconButton>
            </div>
          </Tooltip>
          <Button
            variant="contained"
            onClick={handleCreateClick}
            startIcon={<AddIcon />}
          >
            {t('constructions.newConstruction')}
          </Button>
        </Stack>
      }
    >
      <Box sx={{ flex: 1, width: '100%' }}>
        <h1>budowy</h1>
      </Box>
    </PageContainer>
  );
}
