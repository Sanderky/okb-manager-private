import PageContainer from '@/shared/ui/PageContainer';

import {
  ScheduleProvider,
  ScheduleActions,
  ScheduleBottomToolbar,
  ScheduleManager,
} from '@/features/schedule';
import { useTranslation } from 'react-i18next';

export const SchedulePage = () => {
  const { t } = useTranslation('schedule');

  return (
    <ScheduleProvider>
      <PageContainer
        fixedHeight={true}
        breadcrumbs={[{ title: t('pageTitle') }]}
        actions={<ScheduleActions />}
        renderBottomToolbar={<ScheduleBottomToolbar />}
      >
        <ScheduleManager />
      </PageContainer>
    </ScheduleProvider>
  );
};
