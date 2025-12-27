import React, { useState } from 'react';
import { useFamilyStore } from '@/store/familyStore';

interface InviteMemberProps {
  familyAccountId?: string;
  onClose?: () => void;
}

export function InviteMember({ familyAccountId, onClose }: InviteMemberProps) {
  const { inviteMember, isLoading, error } = useFamilyStore();
  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !familyAccountId) {
      return;
    }

    try {
      await inviteMember(familyAccountId, email.trim());
      setShowSuccess(true);
      setEmail('');
      
      setTimeout(() => {
        setShowSuccess(false);
        onClose?.();
      }, 3000);
    } catch (err) {
      console.error('Failed to invite member:', err);
    }
  };

  if (showSuccess) {
    return (
      <div className="p-6 bg-green-900/50 border border-green-700 rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h3 className="text-lg font-semibold text-green-400 mb-2">
          Приглашение отправлено!
        </h3>
        <p className="text-green-300 text-sm">
          Приглашение будет действительно в течение 7 дней
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">
        Пригласить члена семьи
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-300 mb-2">
            Email члена семьи
          </label>
          <input
            id="inviteEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.ru"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={isLoading}
          />
          <p className="mt-2 text-xs text-gray-500">
            Приглашение будет отправлено на указанный email и будет действительно в течение 7 дней
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!email.trim() || isLoading || !familyAccountId}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Отправка...' : 'Отправить приглашение'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
