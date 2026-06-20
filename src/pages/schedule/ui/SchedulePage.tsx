import PageContainer from '@/shared/ui/PageContainer';

import {
  ScheduleProvider,
  ScheduleActions,
  ScheduleBottomToolbar,
  ScheduleManager,
} from '@/features/schedule';

export const SchedulePage = () => {
  return (
    <ScheduleProvider>
      <PageContainer
        fixedHeight={true}
        breadcrumbs={[{ title: 'Harmonogram' }]}
        actions={<ScheduleActions />}
        renderBottomToolbar={<ScheduleBottomToolbar />}
      >
        <ScheduleManager />
      </PageContainer>
    </ScheduleProvider>
  );
};
