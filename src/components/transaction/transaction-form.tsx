import React, { useState } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';
import { Transaction, TransactionType, TransactionCategory } from '@/types/transaction';
import { ExpenseSubcategoryDetail, CreditKind, TransferKind } from '@/types/budget';

interface TransactionFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function TransactionForm({ onClose, onSuccess }: TransactionFormProps) {
  const { addTransaction } = useScheduleStore();
  
  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    currency: 'RUB',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: undefined,
    subcategory: '' as ExpenseSubcategoryDetail | undefined,
    isTransfer: false,
    transferType: undefined as TransferKind | undefined,
    recipient: '',
    isCredit: false,
    creditKind: undefined as CreditKind | undefined,
    bankName: '',
    interestRate: '',
    creditLimit: '',
    gracePeriod: '',
    isRecurring: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    const newErrors: Record<string, string> = {};
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Сумма должна быть положительным числом';
    }
    
    if (formData.type === 'expense' && !formData.category) {
      newErrors.category = 'Категория обязательна для расходов';
    }
    
    if (formData.isTransfer && !formData.recipient) {
      newErrors.recipient = 'Получатель обязательн для переводов';
    }
    
    if (formData.isCredit && !formData.bankName) {
      newErrors.bankName = 'Банк обязателен для кредитов';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await addTransaction({
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        date: formData.date,
        description: formData.description || undefined,
        category: formData.type === 'expense' ? formData.category : undefined,
        subcategory: formData.subcategory,
        isTransfer: formData.isTransfer,
        transferType: formData.transferType,
        recipient: formData.recipient || undefined,
        isCredit: formData.isCredit,
        creditKind: formData.creditKind,
        bankName: formData.bankName || undefined,
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
        gracePeriod: formData.gracePeriod || undefined
      });

      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      setErrors({ form: 'Не удалось создать транзакцию' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Тип транзакции *
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
          className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Сумма *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Например, 5000"
        />
        {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Валюта
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="RUB">₽ Рубли</option>
            <option value="USD">$ Доллары</option>
            <option value="EUR">€ Евро</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Дата *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {formData.type === 'expense' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Категория *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: undefined })}
              className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Выберите категорию</option>
              <option value="Еда">Еда</option>
              <option value="Транспорт">Транспорт</option>
              <option value="Жильё">Жильё</option>
              <option value="Развлечения">Развлечения</option>
              <option value="Здоровье">Здоровье</option>
              <option value="Образование">Образование</option>
              <option value="Одежда">Одежда</option>
              <option value="Хобби">Хобби</option>
              <option value="Прочее">Прочее</option>
              <option value="Кредит">Кредит</option>
              <option value="Перевод">Перевод</option>
              <option value="Подписки">Подписки</option>
              <option value="Связь">Связь</option>
              <option value="Налоги">Налоги</option>
              <option value="Страхование">Страхование</option>
              <option value="Прочие расходы">Прочие расходы</option>
              <option value="Скидки">Скидки</option>
              <option value="Кэшбэк">Кэшбэк</option>
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
          </div>

          {formData.category === 'Жильё' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Подкатегория
              </label>
              <select
                value={formData.subcategory || ''}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value as ExpenseSubcategoryDetail })}
                className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите подкатегорию</option>
                <option value="электро">Электроэнергия</option>
                <option value="газ">Газ</option>
                <option value="вода">Вода</option>
                <option value="интернет">Интернет</option>
                <option value="тв">ТВ</option>
                <option value="ремонт">Ремонт</option>
              </select>
            </div>
          )}
        </>
      )}

      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isTransfer}
            onChange={(e) => setFormData({ ...formData, isTransfer: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Это перевод
          </span>
        </label>

        {formData.isTransfer && (
          <div className="pl-6 space-y-3">
            <select
              value={formData.transferType || ''}
              onChange={(e) => setFormData({ ...formData, transferType: e.target.value as TransferKind })}
              className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Тип перевода</option>
              <option value="to_self">Свои карты</option>
              <option value="to_family">Семье</option>
              <option value="to_friend">Друзьям</option>
            </select>
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Получатель (имя, номер карты)"
            />
            {errors.recipient && <p className="mt-1 text-sm text-red-500">{errors.recipient}</p>}
          </div>
        )}

      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isCredit}
            onChange={(e) => setFormData({ ...formData, isCredit: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Это кредит
          </span>
        </label>

        {formData.isCredit && (
          <div className="pl-6 space-y-3">
            <select
              value={formData.creditKind || ''}
              onChange={(e) => setFormData({ ...formData, creditKind: e.target.value as CreditKind })}
              className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Тип кредита</option>
              <option value="mortgage">Ипотека</option>
              <option value="consumer_credit">Потребительский кредит</option>
              <option value="credit_card">Кредитная карта</option>
              <option value="auto_loan">Автокредит</option>
            </select>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Название банка"
            />
            {errors.bankName && <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                className="px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Процентная ставка"
              />
              <input
                type="number"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                className="px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Лимит кредита"
              />
            </div>
            <input
              type="text"
              value={formData.gracePeriod}
              onChange={(e) => setFormData({ ...formData, gracePeriod: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Льготный период (например, 30 дней)"
            />
          </div>
        )}
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
          placeholder="Дополнительная информация о транзакции"
        />
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
