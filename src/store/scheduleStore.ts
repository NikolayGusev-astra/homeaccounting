import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Schedule,
  ScheduleRevision,
  CreateScheduleInput,
  CreateRevisionInput,
  UpdateScheduleInput,
} from '@/types/schedule';
import type {
  Transaction,
  CreateTransactionInput,
} from '@/types/transaction';
import { supabase, getCurrentUserId, getCurrentUserIdSync, isSupabaseEnabled } from '@/lib/supabase';

interface ScheduleStore {
  // Data
  schedules: Schedule[];
  revisions: ScheduleRevision[];
  isSyncing: boolean;
  
  // CRUD for Schedules
  addSchedule: (schedule: CreateScheduleInput) => Promise<void>;
  updateSchedule: (id: string, updates: UpdateScheduleInput) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  
  // Revisions management (changing amounts)
  updateScheduleAmount: (
    scheduleId: string,
    newAmount: number,
    validFrom: string,
    applyToFutureOnly?: boolean
  ) => Promise<void>;
  
  // Sync
  syncToSupabase: () => Promise<void>;
  syncFromSupabase: () => Promise<void>;
}

let idCounter = 0;
const generateId = () => {
  idCounter += 1;
  return `${Date.now()}_${idCounter}_${Math.random().toString(36).substr(2, 6)}`;
};

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      schedules: [],
      revisions: [],
      isSyncing: false,

      // Add new schedule
      addSchedule: async (scheduleData) => {
        const userId = await getCurrentUserId();
        if (!userId || !isSupabaseEnabled() || !supabase) return;

        try {
          // Create schedule in Supabase
          const { data: schedule, error: scheduleError } = await supabase
            .from('schedules')
            .insert({
              user_id: userId,
              kind: scheduleData.kind,
              direction: scheduleData.direction,
              name: scheduleData.name,
              currency: scheduleData.currency || 'RUB',
              start_date: scheduleData.start_date,
              end_date: scheduleData.end_date || null,
              recurrence_rule: scheduleData.recurrence_rule,
              status: scheduleData.status || 'active',
              notes: scheduleData.notes || null,
            })
            .select()
            .single();

          if (scheduleError || !schedule) {
            throw scheduleError || new Error('Failed to create schedule');
          }

          // Create first revision with initial amount
          const { error: revisionError } = await supabase
            .from('schedule_revisions')
            .insert({
              schedule_id: schedule.id,
              user_id: userId,
              valid_from: scheduleData.start_date,
              valid_to: null,
              amount: scheduleData.amount || 0,
              reason: null,
            });

          if (revisionError) {
            console.error('Error creating first revision:', revisionError);
          }

          // Update local state
          const newSchedule: Schedule = {
            ...schedule,
            start_date: scheduleData.start_date,
          };

          set((state) => ({
            schedules: [...state.schedules, newSchedule],
          }));

        } catch (error) {
          console.error('Error adding schedule:', error);
          throw error;
        }
      },

      // Update schedule (basic fields, not amount)
      updateSchedule: async (id, updates) => {
        const userId = await getCurrentUserId();
        if (!userId || !isSupabaseEnabled() || !supabase) return;

        try {
          // Update schedule in Supabase
          const { error } = await supabase
            .from('schedules')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId);

          if (error) {
            console.error('Error updating schedule:', error);
            throw error;
          }

          // Update local state
          set((state) => ({
            schedules: state.schedules.map((sch) =>
              sch.id === id ? { ...sch, ...updates } : sch
            ),
          }));

        } catch (error) {
          console.error('Error updating schedule:', error);
          throw error;
        }
      },

      // Delete schedule (CASCADE will delete revisions and transactions)
      deleteSchedule: async (id) => {
        const userId = await getCurrentUserId();
        if (!userId || !isSupabaseEnabled() || !supabase) return;

        try {
          // Delete from Supabase (CASCADE will handle revisions and transactions)
          const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

          if (error) {
            console.error('Error deleting schedule:', error);
            throw error;
          }

          // Update local state
          set((state) => ({
            schedules: state.schedules.filter((sch) => sch.id !== id),
            revisions: state.revisions.filter((rev) => rev.schedule_id !== id),
          }));

        } catch (error) {
          console.error('Error deleting schedule:', error);
          throw error;
        }
      },

      // Update schedule amount (creates new revision)
      updateScheduleAmount: async (scheduleId, newAmount, validFrom, applyToFutureOnly = true) => {
        const userId = await getCurrentUserId();
        if (!userId || !isSupabaseEnabled() || !supabase) return;

        try {
          // Step 1: Close current revision
          if (applyToFutureOnly) {
            const { error: closeError } = await supabase
              .from('schedule_revisions')
              .update({ valid_to: validFrom })
              .eq('schedule_id', scheduleId)
              .eq('valid_to', null);

            if (closeError) {
              console.error('Error closing current revision:', closeError);
            }
          }

          // Step 2: Create new revision
          const { data: newRevision, error: createError } = await supabase
            .from('schedule_revisions')
            .insert({
              schedule_id: scheduleId,
              user_id: userId,
              valid_from: validFrom,
              valid_to: null,
              amount: newAmount,
              reason: 'amount_change',
            })
            .select()
            .single();

          if (createError || !newRevision) {
            console.error('Error creating new revision:', createError);
            return;
          }

          // Step 3: Delete old generated transactions (only future ones if applyToFutureOnly)
          const { error: deleteTxnError } = await supabase
            .from('transactions')
            .delete()
            .eq('schedule_id', scheduleId)
            .gte('date', validFrom)
            .eq('is_generated', true);

          if (deleteTxnError) {
            console.error('Error deleting old transactions:', deleteTxnError);
          }

          // Step 4: Regenerate transactions from new revision date
          const schedule = get().schedules.find((sch) => sch.id === scheduleId);
          if (!schedule) {
            console.error('Schedule not found:', scheduleId);
            return;
          }

          // Simple RRULE parser for common cases (monthly, weekly, etc.)
          // In production, you'd use rrule.js library
          const transactionsToCreate = generateTransactionDates(
            schedule.recurrence_rule,
            validFrom,
            schedule.end_date || null
          );

          if (transactionsToCreate.length > 0) {
            const transactionsData = transactionsToCreate.map((date) => ({
              user_id: userId,
              schedule_id: scheduleId,
              date,
              amount: newAmount,
              direction: schedule.direction,
              is_generated: true,
            }));

            const { error: insertError } = await supabase
              .from('transactions')
              .insert(transactionsData);

            if (insertError) {
              console.error('Error inserting new transactions:', insertError);
            }
          }

          // Update local state
          set((state) => ({
            revisions: [
              ...state.revisions,
              {
                id: newRevision.id,
                schedule_id: scheduleId,
                user_id: userId,
                valid_from: validFrom,
                valid_to: null,
                amount: newAmount,
                reason: 'amount_change',
                created_at: newRevision.created_at,
                updated_at: newRevision.updated_at,
              },
            ],
          }));

        } catch (error) {
          console.error('Error updating schedule amount:', error);
          throw error;
        }
      },

      // Sync schedules to Supabase (not typically needed since we use immediate CRUD)
      syncToSupabase: async () => {
        if (!isSupabaseEnabled() || !supabase) {
          console.warn('Supabase not configured, skipping sync');
          return;
        }

        const userId = await getCurrentUserId();
        if (!userId) {
          console.warn('No user ID, skipping sync');
          return;
        }

        set({ isSyncing: true });

        try {
          const { schedules } = get();

          if (schedules.length === 0) return;

          const schedulesData = schedules.map((sch) => ({
            id: sch.id,
            user_id: userId,
            kind: sch.kind,
            direction: sch.direction,
            name: sch.name,
            currency: sch.currency,
            start_date: sch.start_date,
            end_date: sch.end_date,
            recurrence_rule: sch.recurrence_rule,
            status: sch.status,
            notes: sch.notes || null,
          }));

          const { error } = await supabase
            .from('schedules')
            .upsert(schedulesData, {
              onConflict: 'id',
            });

          if (error) {
            console.error('Error syncing schedules:', error);
          }
        } catch (error) {
          console.error('Error during sync:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Load schedules from Supabase
      syncFromSupabase: async () => {
        if (!isSupabaseEnabled() || !supabase) {
          console.warn('Supabase not configured, skipping sync');
          return;
        }

        const userId = await getCurrentUserId();
        if (!userId) {
          console.warn('No user ID, skipping sync');
          return;
        }

        set({ isSyncing: true });

        try {
          // Load schedules
          const { data: schedulesData, error: schedulesError } = await supabase
            .from('schedules')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

          if (schedulesError) {
            console.error('Error loading schedules:', schedulesError);
          }

          // Load revisions
          const { data: revisionsData, error: revisionsError } = await supabase
            .from('schedule_revisions')
            .select('*')
            .eq('user_id', userId)
            .order('valid_from', { ascending: true });

          if (revisionsError) {
            console.error('Error loading revisions:', revisionsError);
          }

          const schedules: Schedule[] = (schedulesData || []).map((sch) => ({
            id: sch.id,
            user_id: sch.user_id,
            kind: sch.kind,
            direction: sch.direction,
            name: sch.name,
            currency: sch.currency,
            start_date: sch.start_date,
            end_date: sch.end_date,
            recurrence_rule: sch.recurrence_rule,
            status: sch.status,
            notes: sch.notes || undefined,
            created_at: sch.created_at,
            updated_at: sch.updated_at,
          }));

          const revisions: ScheduleRevision[] = (revisionsData || []).map((rev) => ({
            id: rev.id,
            schedule_id: rev.schedule_id,
            user_id: rev.user_id,
            valid_from: rev.valid_from,
            valid_to: rev.valid_to,
            amount: Number(rev.amount),
            reason: rev.reason || undefined,
            created_at: rev.created_at,
            updated_at: rev.updated_at,
          }));

          set({ schedules, revisions });
        } catch (error) {
          console.error('Error during sync from Supabase:', error);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'schedule-storage',
      partialize: (state) => ({
        schedules: state.schedules,
        revisions: state.revisions,
      }),
    }
  )
);

// Helper function to generate transaction dates from RRULE
// This is a simplified implementation - in production, use rrule.js library
function generateTransactionDates(
  recurrenceRule: string,
  startDate: string,
  endDate: string | null
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getFullYear() + 1, 11, 31);
  
  // Parse simple RRULE patterns
  if (recurrenceRule.includes('MONTHLY')) {
    const dayOfMonthMatch = recurrenceRule.match(/BYMONTHDAY=(\d+)/);
    const dayOfMonth = dayOfMonthMatch ? parseInt(dayOfMonthMatch[1]) : 1;
    
    for (let date = new Date(start); date <= end; date.setMonth(date.getMonth() + 1)) {
      date.setDate(dayOfMonth);
      dates.push(date.toISOString().split('T')[0]);
    }
  } else if (recurrenceRule.includes('WEEKLY')) {
    const dayOfWeekMatch = recurrenceRule.match(/BYDAY=(\w+)/);
    const dayOfWeek = dayOfWeekMatch ? parseInt(dayOfWeekMatch[1].replace('TH', '')) : 1;
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 7)) {
      dates.push(date.toISOString().split('T')[0]);
    }
  } else {
    // Default to monthly
    for (let date = new Date(start); date <= end; date.setMonth(date.getMonth() + 1)) {
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  
  return dates;
}
