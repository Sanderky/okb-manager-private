export interface TodoItem {
  id: number;
  title: string;
  is_completed: boolean;
  is_important: boolean;
  created_at: string;
  completed_at?: string | null;
}