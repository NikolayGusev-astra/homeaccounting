import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { 
  FamilyAccount, 
  FamilyMember, 
  FamilyInvitation,
  CreateFamilyAccountInput,
  UpdateFamilyAccountInput,
  CreateFamilyMemberInput,
  CreateInvitationInput,
  Visibility
} from '@/types/family';

interface FamilyStore {
  // State
  familyAccounts: FamilyAccount[];
  familyMembers: FamilyMember[];
  invitations: FamilyInvitation[];
  currentFamilyAccount: FamilyAccount | null;
  isLoading: boolean;
  error: string | null;
  
  // Family Account methods
  createFamilyAccount: (name: string) => Promise<void>;
  updateFamilyAccount: (id: string, updates: UpdateFamilyAccountInput) => Promise<void>;
  deleteFamilyAccount: (id: string) => Promise<void>;
  setCurrentFamilyAccount: (account: FamilyAccount | null) => void;
  
  // Family Members methods
  inviteMember: (familyAccountId: string, invitedEmail: string) => Promise<void>;
  acceptInvitation: (inviteCode: string) => Promise<void>;
  declineInvitation: (inviteId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: 'owner' | 'member') => Promise<void>;
  leaveFamily: () => Promise<void>;
  
  // Sync methods
  syncFamilyAccounts: () => Promise<void>;
  syncFamilyMembers: (familyAccountId: string) => Promise<void>;
  syncInvitations: () => Promise<void>;
  
  // Utility methods
  getCurrentUserId: () => Promise<string | null>;
  isFamilyMember: (familyAccountId: string) => Promise<boolean>;
  isFamilyOwner: (familyAccountId: string) => Promise<boolean>;
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  familyAccounts: [],
  familyMembers: [],
  invitations: [],
  currentFamilyAccount: null,
  isLoading: false,
  error: null,
  
  // Получить текущий user_id
  getCurrentUserId: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  },
  
  // ========== FAMILY ACCOUNT METHODS ==========
  
  createFamilyAccount: async (name: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const userId = await get().getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('family_accounts')
        .insert<CreateFamilyAccountInput>({ name, created_by: userId })
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create family account');
      
      set(state => ({
        familyAccounts: [...state.familyAccounts, data],
        currentFamilyAccount: data,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create family account',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateFamilyAccount: async (id: string, updates: UpdateFamilyAccountInput) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('family_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to update family account');
      
      set(state => ({
        familyAccounts: state.familyAccounts.map(acc => 
          acc.id === id ? data : acc
        ),
        currentFamilyAccount: state.currentFamilyAccount?.id === id 
          ? data 
          : state.currentFamilyAccount,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update family account',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteFamilyAccount: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('family_accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        familyAccounts: state.familyAccounts.filter(acc => acc.id !== id),
        familyMembers: state.familyMembers.filter(m => m.family_account_id !== id),
        currentFamilyAccount: state.currentFamilyAccount?.id === id 
          ? null 
          : state.currentFamilyAccount,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete family account',
        isLoading: false 
      });
      throw error;
    }
  },
  
  setCurrentFamilyAccount: (account: FamilyAccount | null) => {
    set({ currentFamilyAccount: account });
  },
  
  // ========== FAMILY MEMBERS METHODS ==========
  
  inviteMember: async (familyAccountId: string, invitedEmail: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const userId = await get().getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      // Проверяем, является ли пользователь владельцем
      const isOwner = await get().isFamilyOwner(familyAccountId);
      if (!isOwner) throw new Error('Only family owner can invite members');
      
      // Создаем приглашение
      const { data, error } = await supabase
        .from('family_invitations')
        .insert<CreateInvitationInput>({
          family_account_id: familyAccountId,
          invited_by: userId,
          invited_email: invitedEmail,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 дней
        })
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        invitations: [...state.invitations, data],
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to invite member',
        isLoading: false 
      });
      throw error;
    }
  },
  
  acceptInvitation: async (inviteCode: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const userId = await get().getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      // Находим приглашение по коду (для простоты используем id)
      const { data: invitation, error: fetchError } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('id', inviteCode)
        .eq('status', 'pending')
        .single();
      
      if (fetchError || !invitation) throw new Error('Invalid or expired invitation');
      
      // Проверяем срок действия
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }
      
      // Добавляем члена семьи
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .insert<CreateFamilyMemberInput>({
          family_account_id: invitation.family_account_id,
          user_id: userId,
          role: 'member'
        })
        .select()
        .single();
      
      if (memberError) throw memberError;
      
      // Обновляем статус приглашения
      await supabase
        .from('family_invitations')
        .update({ status: 'accepted' })
        .eq('id', inviteCode);
      
      // Обновляем state
      set(state => ({
        familyMembers: [...state.familyMembers, member],
        currentFamilyAccount: state.familyAccounts.find(
          acc => acc.id === invitation.family_account_id
        ) || null,
        invitations: state.invitations.filter(inv => inv.id !== inviteCode),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to accept invitation',
        isLoading: false 
      });
      throw error;
    }
  },
  
  declineInvitation: async (inviteId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('family_invitations')
        .update({ status: 'declined' })
        .eq('id', inviteId);
      
      if (error) throw error;
      
      set(state => ({
        invitations: state.invitations.filter(inv => inv.id !== inviteId),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to decline invitation',
        isLoading: false 
      });
      throw error;
    }
  },
  
  removeMember: async (memberId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Получаем информацию о члене семьи
      const { data: member } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', memberId)
        .single();
      
      if (!member) throw new Error('Member not found');
      
      // Проверяем права
      const userId = await get().getCurrentUserId();
      const isOwner = await get().isFamilyOwner(member.family_account_id);
      const isSelf = member.user_id === userId;
      
      if (!isOwner && !isSelf) {
        throw new Error('Not authorized to remove this member');
      }
      
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      
      set(state => ({
        familyMembers: state.familyMembers.filter(m => m.id !== memberId),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove member',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateMemberRole: async (memberId: string, role: 'owner' | 'member') => {
    set({ isLoading: true, error: null });
    
    try {
      // Получаем информацию о члене семьи
      const { data: member } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', memberId)
        .single();
      
      if (!member) throw new Error('Member not found');
      
      // Проверяем права (только владелец может менять роли)
      const isOwner = await get().isFamilyOwner(member.family_account_id);
      if (!isOwner) throw new Error('Only family owner can update roles');
      
      const { error } = await supabase
        .from('family_members')
        .update({ role })
        .eq('id', memberId);
      
      if (error) throw error;
      
      set(state => ({
        familyMembers: state.familyMembers.map(m => 
          m.id === memberId ? { ...m, role } : m
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update member role',
        isLoading: false 
      });
      throw error;
    }
  },
  
  leaveFamily: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const currentAccount = get().currentFamilyAccount;
      if (!currentAccount) throw new Error('No family account selected');
      
      const userId = await get().getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      // Проверяем, является ли пользователь владельцем
      const isOwner = await get().isFamilyOwner(currentAccount.id);
      if (isOwner) {
        throw new Error('Family owner cannot leave. Transfer ownership or delete account first.');
      }
      
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('user_id', userId)
        .eq('family_account_id', currentAccount.id);
      
      if (error) throw error;
      
      set(state => ({
        familyMembers: state.familyMembers.filter(
          m => !(m.user_id === userId && m.family_account_id === currentAccount.id)
        ),
        currentFamilyAccount: null,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to leave family',
        isLoading: false 
      });
      throw error;
    }
  },
  
  // ========== SYNC METHODS ==========
  
  syncFamilyAccounts: async () => {
    try {
      const userId = await get().getCurrentUserId();
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('family_accounts')
        .select('*')
        .or(`created_by.eq.${userId},id.in.(select family_account_id from family_members where user_id.eq.${userId})`);
      
      if (error) throw error;
      
      set({ familyAccounts: data || [] });
    } catch (error) {
      console.error('Failed to sync family accounts:', error);
    }
  },
  
  syncFamilyMembers: async (familyAccountId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_account_id', familyAccountId);
      
      if (error) throw error;
      
      set({ familyMembers: data || [] });
    } catch (error) {
      console.error('Failed to sync family members:', error);
    }
  },
  
  syncInvitations: async () => {
    try {
      const userId = await get().getCurrentUserId();
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('family_invitations')
        .select('*')
        .or(`invited_by.eq.${userId},invited_email.in.(select email from profiles where user_id.eq.${userId})`)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      set({ invitations: data || [] });
    } catch (error) {
      console.error('Failed to sync invitations:', error);
    }
  },
  
  // ========== UTILITY METHODS ==========
  
  isFamilyMember: async (familyAccountId: string) => {
    try {
      const userId = await get().getCurrentUserId();
      if (!userId) return false;
      
      const { data, error } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_account_id', familyAccountId)
        .eq('user_id', userId)
        .single();
      
      return !error && !!data;
    } catch {
      return false;
    }
  },
  
  isFamilyOwner: async (familyAccountId: string) => {
    try {
      const userId = await get().getCurrentUserId();
      if (!userId) return false;
      
      const { data, error } = await supabase
        .from('family_members')
        .select('role')
        .eq('family_account_id', familyAccountId)
        .eq('user_id', userId)
        .single();
      
      return !error && data?.role === 'owner';
    } catch {
      return false;
    }
  }
}));
