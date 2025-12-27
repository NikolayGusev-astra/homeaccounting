// Schedule and ScheduleRevision types

export type ScheduleKind = 'salary' | 'rent' | 'subscription' | 'loan' | 'custom';
export type ScheduleStatus = 'active' | 'paused' | 'cancelled';

export interface Schedule {
  id: string;
  user_id: string;
  kind: ScheduleKind;
  direction: 'income' | 'expense';
  name: string;
  currency: 'RUB' | 'USD' | 'EUR';
  start_date: string;      // ISO date format: YYYY-MM-DD
  end_date?: string | null; // null = infinite
  recurrence_rule: string; // RRULE: e.g., "FREQ=MONTHLY;BYMONTHDAY=5"
  status: ScheduleStatus;
  notes?: string;
  created_at: string;     // ISO timestamp
  updated_at: string;     // ISO timestamp
}

export interface ScheduleRevision {
  id: string;
  schedule_id: string;
  user_id: string;
  valid_from: string;      // ISO date format: YYYY-MM-DD - when this revision starts
  valid_to?: string | null; // null = current revision, otherwise when it ended
  amount: number;
  reason?: string;
  created_at: string;     // ISO timestamp
  updated_at: string;     // ISO timestamp
}

export type CreateScheduleInput = Omit<Schedule, 'id' | 'created_at' | 'updated_at'> & {
  initialAmount: number; // Amount for first revision
};
export type CreateRevisionInput = Omit<ScheduleRevision, 'id' | 'created_at' | 'updated_at'>;
export type UpdateScheduleInput = Partial<Omit<Schedule, 'id' | 'user_id' | 'created_at'>>;
