'use client';

import React, { useState } from 'react';
import { FamilySettings } from '@/components/family/FamilySettings';
import { FamilyMembersList } from '@/components/family/FamilyMembersList';
import { InviteMember } from '@/components/family/InviteMember';
import { useFamilyStore } from '@/store/familyStore';

export default function FamilyPage() {
  const { currentFamilyAccount } = useFamilyStore();
  const [activeTab, setActiveTab] = useState<'settings' | 'members' | 'invite'>('settings');
  const [showInviteForm, setShowInviteForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Семейный бюджет</h1>
          <p className="text-gray-400">
            {currentFamilyAccount 
              ? `Управляйте семейными финансами вместе: ${currentFamilyAccount.name}`
              : 'Создайте семейный аккаунт для совместного управления финансами'
            }
          </p>
        </div>

        {/* Tabs */}
        {currentFamilyAccount && (
          <div className="flex gap-2 border-b border-gray-800">
            <button
              onClick={() => {
                setActiveTab('settings');
                setShowInviteForm(false);
              }}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'settings' && !showInviteForm
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Настройки
            </button>
            <button
              onClick={() => {
                setActiveTab('members');
                setShowInviteForm(false);
              }}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'members' && !showInviteForm
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Участники
            </button>
            <button
              onClick={() => {
                setActiveTab('invite');
                setShowInviteForm(true);
              }}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                showInviteForm
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Пригласить
            </button>
          </div>
        )}

        {/* Content */}
        {!currentFamilyAccount ? (
          <FamilySettings />
        ) : (
          <>
            {showInviteForm ? (
              <InviteMember
                familyAccountId={currentFamilyAccount.id}
                onClose={() => {
                  setShowInviteForm(false);
                  setActiveTab('settings');
                }}
              />
            ) : activeTab === 'members' ? (
              <FamilyMembersList familyAccountId={currentFamilyAccount.id} />
            ) : (
              <FamilySettings />
            )}
          </>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <div className="p-6 bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-800 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Как это работает?</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">1.</span>
                <span>Создайте семейный аккаунт</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">2.</span>
                <span>Пригласите супруга/супругу по email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">3.</span>
                <span>Выберите видимость "Семейное" для транзакций, которые хотите видеть вместе</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">4.</span>
                <span>Смотрите общую статистику и управляйте семейными расходами</span>
              </li>
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-800 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Важно знать</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Личные данные видны только вам</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Семейные данные видны всем участникам</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Приглашение действительно 7 дней</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Владелец может удалять участников и менять роли</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
