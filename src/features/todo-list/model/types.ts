export interface TodoItem {
  id: number;
  title: string;
  isCompleted: boolean;
  isImportant: boolean;
  createdAt: Date | undefined;
  completedAt?: Date | undefined;
}