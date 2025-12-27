import React, { useState } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useFamilyStore } from '@/store/familyStore';
import { Schedule, ScheduleKind } from '@/types/schedule';
import { VisibilityToggle } from '@/components/family/VisibilityToggle';

interface ScheduleFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function ScheduleForm({ onClose, onSuccess }: ScheduleFormProps) {
  const { addSchedule } = useScheduleStore();
  
  const { currentFamilyAccount } = useFamilyStore();
  
  const [formData, setFormData] = useState({
    name: '',
    kind: 'custom' as ScheduleKind,
    direction: 'income' as 'income' | 'expense',
    currency: 'RUB',
    initialAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=1', // По умолчанию 1 числа каждого месяца
    status: 'active' as 'active' | 'paused' | 'cancelled',
    description: '',
    visibility: 'personal' as 'personal' | 'family',
    familyAccountId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    if (!formData.initialAmount || isNaN(parseFloat(formData.initialAmount)) || parseFloat(formData.initialAmount) <= 0) {
      newErrors.initialAmount = 'Сумма должна быть положительным числом';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await addSchedule({
        name: formData.name,
        kind: formData.kind,
        direction: formData.direction,
        currency: formData.currency,
        initialAmount: parseFloat(formData.initialAmount),
        startDate: formData.startDate,
        recurrenceRule: formData.recurrenceRule,
        status: formData.status,
        description: formData.description || undefined,
        visibility: formData.visibility,
        familyAccountId: formData.visibility === 'family' && currentFamilyAccount?.id 
          ? currentFamilyAccount.id 
          : null
      });

      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Failed to create schedule:', error);
      setErrors({ form: 'Не удалось создать расписание' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Название *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Например, Зарплата Netflix"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Тип
          </label>
          <select
            value={formData.kind}
            onChange={(e) => setFormData({ ...formData, kind: e.target.value as ScheduleKind })}
            className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="custom">Разное</option>
            <option value="salary">Зарплата</option>
            <option value="rent">Аренда</option>
            <option value="subscription">Подписка</option>
            <option value="loan">Кредит</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Направление
          </label>
          <select
            value={formData.direction}
            onChange={(e) => setFormData({ ...formData, direction: e.target.value as 'income' | 'expense' })}
            className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Начальная сумма *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.initialAmount}
          onChange={(e) => setFormData({ ...formData, initialAmount: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Например, 5000"
        />
        {errors.initialAmount && <p className="mt-1 text-sm text-red-500">{errors.initialAmount}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Дата начала *
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Повторение
          </label>
          <select
            value={formData.recurrenceRule}
            onChange={(e) => setFormData({ ...formData, recurrenceRule: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="FREQ=MONTHLY;BYMONTHDAY=1">1 числа каждого месяца</option>
            <option value="FREQ=MONTHLY;BYMONTHDAY=15">15 числа каждого месяца</option>
            <option value="FREQ=MONTHLY;BYMONTHDAY=25">25 числа каждого месяца</option>
            <option value="FREQ=WEEKLY">Каждую неделю</option>
            <option value="FREQ=DAILY">Каждый день</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Статус
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' | 'cancelled' })}
          className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="active">Активно</option>
          <option value="paused">Пауза</option>
          <option value="cancelled">Отменено</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Описание
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Дополнительная информация о расписании"
        />
      </div>

      {/* Видимость */}
      <div>
        <VisibilityToggle
          visibility={formData.visibility}
          onChange={(visibility) => setFormData({ ...formData, visibility })}
          disabled={!currentFamilyAccount && formData.visibility === 'family'}
        />
        {!currentFamilyAccount && formData.visibility === 'family' && (
          <p className="mt-2 text-sm text-yellow-500">
            Создайте или выберите семейный аккаунт для добавления семейных расписаний
          </p>
        )}
      </div>

      {errors.form && <p className="text-sm text-red-500">{errors.form}</p>}

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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors"
        >
          Создать
        </button>
      </div>
    </form>
  );
}
