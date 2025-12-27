import React, { useState } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';

interface ScheduleAmountEditorProps {
  scheduleId: string;
  scheduleName: string;
  currentAmount: number;
  currentAmountDate: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function ScheduleAmountEditor({ 
  scheduleId, 
  scheduleName, 
  currentAmount, 
  currentAmountDate,
  onClose,
  onSuccess 
}: ScheduleAmountEditorProps) {
  const { updateScheduleAmount } = useScheduleStore();
  
  const [newAmount, setNewAmount] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAmount || isNaN(parseFloat(newAmount)) || parseFloat(newAmount) <= 0) {
      setError('Сумма должна быть положительным числом');
      return;
    }

    try {
      await updateScheduleAmount(scheduleId, parseFloat(newAmount), effectiveDate);
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Failed to update schedule amount:', error);
      setError('Не удалось обновить сумму расписания');
    }
  };

  const getFuturePreview = () => {
    if (!newAmount) return null;
    
    const amount = parseFloat(newAmount);
    const startDate = new Date(effectiveDate);
    const today = new Date();
    
    if (startDate <= today) {
      return 'Новая сумма начнёт действовать сегодня';
    }
    
    const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Новая сумма начнёт действовать завтра';
    if (diffDays < 7) return `Новая сумма начнёт действовать через ${diffDays} дня`;
    if (diffDays < 30) return `Новая сумма начнёт действовать через ${Math.floor(diffDays / 7)} недель`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return `Новая сумма начнёт действовать через ${diffMonths} месяцев`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-800/50 dark:bg-gray-900/50 border border-gray-700 dark:border-gray-600 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-white dark:text-gray-100 mb-2">
          Текущая сумма: {currentAmount.toLocaleString('ru-RU')} ₽
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          С даты: {currentAmountDate}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Новая сумма *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Например, 6000"
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Дата начала действия новой суммы *
        </label>
        <input
          type="date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Все будущие платежи после этой даты будут с новой суммой
        </p>
      </div>

      {newAmount && (
        <div className="bg-blue-900/20 dark:bg-blue-900/20 border border-blue-700 dark:border-blue-600 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Предпросмотр изменений
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {getFuturePreview()}
          </p>
          <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
            <p>• Прошлые платежи останутся с суммой {currentAmount.toLocaleString('ru-RU')} ₽</p>
            <p>• Новые платежи после {effectiveDate} будут с суммой {parseFloat(newAmount).toLocaleString('ru-RU')} ₽</p>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={!newAmount}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors"
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}
