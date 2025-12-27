import React, { useState, useEffect } from 'react';
import { useFamilyStore } from '@/store/familyStore';

export function FamilySettings() {
  const {
    familyAccounts,
    currentFamilyAccount,
    familyMembers,
    isLoading,
    error,
    createFamilyAccount,
    deleteFamilyAccount,
    setCurrentFamilyAccount,
    syncFamilyAccounts,
    syncFamilyMembers,
  } = useFamilyStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  useEffect(() => {
    syncFamilyAccounts();
    if (currentFamilyAccount) {
      syncFamilyMembers(currentFamilyAccount.id);
    }
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;

    try {
      await createFamilyAccount(newAccountName.trim());
      setNewAccountName('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create family account:', err);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Вы уверены, что хотите удалить семейный аккаунт? Все семейные данные будут потеряны.')) {
      return;
    }

    try {
      await deleteFamilyAccount(accountId);
      if (currentFamilyAccount?.id === accountId) {
        setCurrentFamilyAccount(null);
      }
    } catch (err) {
      console.error('Failed to delete family account:', err);
    }
  };

  const handleSelectAccount = (account: { id: string; name: string }) => {
    setCurrentFamilyAccount(account);
    syncFamilyMembers(account.id);
  };

  return (
    <div className="p-6 bg-gray-900 rounded-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Семейный бюджет</h2>
        <p className="text-gray-400">Управляйте семейными финансами вместе с супругой/супругом</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-800 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Список семейных аккаунтов */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Ваши семейные аккаунты</h3>
        
        {familyAccounts.length === 0 && !showCreateForm && (
          <div className="p-6 bg-gray-800 rounded-lg text-center">
            <p className="text-gray-400 mb-4">У вас пока нет семейных аккаунтов</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Создать семейный аккаунт
            </button>
          </div>
        )}

        {familyAccounts.length > 0 && (
          <div className="space-y-3">
            {familyAccounts.map((account) => (
              <div
                key={account.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentFamilyAccount?.id === account.id
                    ? 'border-blue-600 bg-blue-900/20'
                    : 'border-gray-800 bg-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">
                      {account.name}
                    </h4>
                    <p className="text-sm text-gray-400">
                      Создан: {new Date(account.created_at).toLocaleDateString('ru-RU')}
                    </p>
                    {currentFamilyAccount?.id === account.id && familyMembers.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-green-400">
                          Участников: {familyMembers.length}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleSelectAccount(account)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {currentFamilyAccount?.id === account.id ? 'Текущий' : 'Выбрать'}
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="px-3 py-2 bg-red-900 hover:bg-red-800 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Форма создания нового аккаунта */}
        {showCreateForm && (
          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Создать новый семейный аккаунт
            </h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-300 mb-2">
                  Название семейного аккаунта
                </label>
                <input
                  id="accountName"
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Например: Семья Ивановых"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!newAccountName.trim() || isLoading}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Создание...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewAccountName('');
                  }}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Кнопка создания нового аккаунта (если список не пуст) */}
        {familyAccounts.length > 0 && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={isLoading}
            className="w-full p-4 bg-gray-800 hover:bg-gray-700 border-2 border-dashed border-gray-700 rounded-lg text-gray-300 hover:text-white font-medium transition-all"
          >
            + Создать еще один семейный аккаунт
          </button>
        )}
      </div>
    </div>
  );
}
