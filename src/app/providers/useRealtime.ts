import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabase';

export const useRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('app-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        (payload) => {
          const tableName = payload.table;

          switch (tableName) {
            case 'todos':
              queryClient.invalidateQueries({ queryKey: ['todos'] });
              break;
            case 'home_notes':
              queryClient.invalidateQueries({ queryKey: ['home', 'note'] });
              break;

            case 'employees':
              queryClient.invalidateQueries({ queryKey: ['employees'] });
              queryClient.invalidateQueries({ queryKey: ['alerts'] });
              break;

            case 'constructions':
              queryClient.invalidateQueries({ queryKey: ['constructions'] });
              queryClient.invalidateQueries({ queryKey: ['contractors'] });

              break;

            case 'contractors':
              queryClient.invalidateQueries({ queryKey: ['contractors'] });
              queryClient.invalidateQueries({ queryKey: ['constructions'] });
              break;

            case 'daily_schedules':
              queryClient.invalidateQueries({ queryKey: ['schedules'] });
              break;

            case 'vacations':
              queryClient.invalidateQueries({ queryKey: ['vacations'] });
              queryClient.invalidateQueries({ queryKey: ['schedules'] });
              queryClient.invalidateQueries({ queryKey: ['workLogs'] });
              break;

            case 'work_logs':
              queryClient.invalidateQueries({ queryKey: ['workLogs'] });
              break;

            case 'calendar_events':
            case 'calendar_event_employees':
            case 'calendar_event_constructions':
              queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
              break;

            case 'lodgings':
            case 'lodging_employees':
              queryClient.invalidateQueries({ queryKey: ['lodgings'] });
              break;
            case 'alert_settings':
              queryClient.invalidateQueries({ queryKey: ['alertsSettings'] });
              break;

            default:
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
