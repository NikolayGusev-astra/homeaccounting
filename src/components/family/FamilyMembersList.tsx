import React from 'react';
import { useFamilyStore } from '@/store/familyStore';

interface FamilyMembersListProps {
  familyAccountId?: string;
}

export function FamilyMembersList({ familyAccountId }: FamilyMembersListProps) {
  const {
    familyMembers,
    isLoading,
    removeMember,
    updateMemberRole,
    leaveFamily,
    getCurrentUserId,
  } = useFamilyStore();

  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    getCurrentUserId().then(setCurrentUserId);
  }, []);

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого члена семьи?')) {
      return;
    }

    try {
      await removeMember(memberId);
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'owner' | 'member') => {
    try {
      await updateMemberRole(memberId, newRole);
    } catch (err) {
      console.error('Failed to update member role:', err);
    }
  };

  const handleLeaveFamily = async () => {
    if (!confirm('Вы уверены, что хотите покинуть семейный бюджет? Все ваши семейные данные будут потеряны.')) {
      return;
    }

    try {
      await leaveFamily();
    } catch (err) {
      console.error('Failed to leave family:', err);
    }
  };

  if (!familyAccountId) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg text-center">
        <p className="text-gray-400">Выберите семейный аккаунт для просмотра участников</p>
      </div>
    );
  }

  if (familyMembers.length === 0) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg text-center">
        <p className="text-gray-400">В этом семейном аккаунте пока нет участников</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 rounded-xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Участники семьи</h3>
        <p className="text-sm text-gray-400">Управляйте участниками семейного бюджета</p>
      </div>

      <div className="space-y-3">
        {familyMembers.map((member) => (
          <div
            key={member.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              member.user_id === currentUserId
                ? 'border-blue-600 bg-blue-900/20'
                : 'border-gray-800 bg-gray-800'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-base font-semibold text-white">
                    {member.user_id === currentUserId ? 'Вы' : member.user_id}
                  </h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    member.role === 'owner'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {member.role === 'owner' ? 'Владелец' : 'Участник'}
                  </span>
                  {member.user_id === currentUserId && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white">
                      Это вы
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Присоединился: {new Date(member.joined_at).toLocaleDateString('ru-RU')}
                </p>
              </div>

              {member.user_id !== currentUserId && (
                <div className="flex gap-2 ml-4">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as 'owner' | 'member')}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                  >
                    <option value="member">Участник</option>
                    <option value="owner">Владелец</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.id, member.user_id)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Кнопка выхода из семьи */}
      {currentUserId && familyMembers.some(m => m.user_id === currentUserId) && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <button
            onClick={handleLeaveFamily}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-red-900 hover:bg-red-800 text-red-400 hover:text-red-300 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Покинуть семейный бюджет
          </button>
          <p className="mt-2 text-xs text-gray-500 text-center">
            Все ваши семейные данные будут потеряны. Это действие нельзя отменить.
          </p>
        </div>
      )}
    </div>
  );
}
