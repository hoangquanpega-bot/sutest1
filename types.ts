
export interface IUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export enum PriorityLevel {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface ITask {
  id: string;
  name: string;
  assignee: IUser | null;
  startDate: number | null; // Timestamp
  endDate: number | null;   // Timestamp
  completedDate: number | null; // Timestamp
  group: string; // "Nhóm công việc"
  priority: PriorityLevel;
}

// Field IDs mapping (simulating the real field IDs from Lark)
export const FieldIds = {
  NAME: 'fld_name',
  ASSIGNEE: 'fld_assignee',
  START_DATE: 'fld_start',
  END_DATE: 'fld_end',
  COMPLETED_DATE: 'fld_complete',
  GROUP: 'fld_group',
  PRIORITY: 'fld_priority'
};
