import { TaskStatus } from '@/types';

export const STATUSES: TaskStatus[] = ['To Do', 'Doing', 'High Priority', 'Done', 'Blocked'];

export const STATUS_COLORS: Record<TaskStatus, string> = {
  'To Do': 'bg-gray-700',
  'Doing': 'bg-blue-600',
  'High Priority': 'bg-red-600',
  'Done': 'bg-green-600',
  'Blocked': 'bg-yellow-600',
};
