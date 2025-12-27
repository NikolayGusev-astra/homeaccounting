// TypeScript типы для семейного бюджета

export interface FamilyAccount {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_account_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export type Visibility = 'personal' | 'family';

export interface FamilyInvitation {
  id: string;
  family_account_id: string;
  invited_by: string;
  invited_email: string;
  status: 'pending' | 'accepted' | 'declined';
  expires_at: string;
  created_at: string;
}

// Типы для создания/обновления
export type CreateFamilyAccountInput = Omit<FamilyAccount, 'id' | 'created_at' | 'updated_at'>;
export type UpdateFamilyAccountInput = Partial<Pick<FamilyAccount, 'name'>>;

export type CreateFamilyMemberInput = Omit<FamilyMember, 'id' | 'joined_at'>;
export type UpdateFamilyMemberInput = Partial<Pick<FamilyMember, 'role'>>;

export type CreateInvitationInput = Omit<FamilyInvitation, 'id' | 'status' | 'created_at'>;
