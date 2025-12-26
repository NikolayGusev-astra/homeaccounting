'use client';

import * as React from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Check, X, CreditCard, Droplet, Utensils, MoreHorizontal, Edit, ArrowLeftRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ExpenseCategory } from '@/types/budget';
import { t } from '@/lib/i18n';
import { useTranslation } from '@/lib/useTranslation';

const categoryIcons: Record<ExpenseCategory, any> = {
  кредиты: CreditCard,
  коммунальные: Droplet,
  домашние_траты: Utensils,
  здоровье: MoreHorizontal,
  автомобиль: MoreHorizontal,
  прочее: MoreHorizontal,
  переводы: ArrowLeftRight,
};

const categoryColors: Record<ExpenseCategory, string> = {
  кредиты: 'text-purple-400',
  коммунальные: 'text-blue-400',
  домашние_траты: 'text-orange-400',
  здоровье: 'text-green-400',
  автомобиль: 'text-yellow-400',
  прочее: 'text-cyan-400',
  переводы: 'text-pink-400',
};

// Category labels will be translated dynamically using t()
const getCategoryLabel = (category: ExpenseCategory): string => {
  const categoryKeyMap: Record<ExpenseCategory, string> = {
    кредиты: 'category.credits',
    коммунальные: 'category.utilities',
    домашние_траты: 'category.home',
    здоровье: 'category.health',
    автомобиль: 'category.car',
    прочее: 'category.other',
    переводы: 'category.transfers',
  };
  return t(categoryKeyMap[category]);
};

// Subcategory labels will be translated dynamically using t()
const getSubcategoryLabel = (subcategory: string): string => {
  const subcategoryKeyMap: Record<string, string> = {
    электро: 'subcategory.electricity',
    газ: 'subcategory.gas',
    вода: 'subcategory.water',
    отопление: 'subcategory.heating',
    интернет: 'subcategory.internet',
    тв: 'subcategory.tv',
    продукты: 'subcategory.groceries',
    бытовая_химия: 'subcategory.household',
    косметика: 'subcategory.cosmetics',
    ремонт: 'subcategory.repair',
    аптека: 'subcategory.pharmacy',
    клиника: 'subcategory.clinic',
    спорт: 'subcategory.sport',
    ремонт_авто: 'subcategory.carRepair',
    заправка: 'subcategory.gasStation',
    обслуживание: 'subcategory.carService',
  };
  return t(subcategoryKeyMap[subcategory] || subcategory);
};

interface ExpenseFormProps {
  onSubmit: (data: Omit<import('@/types/budget').Expense, 'id' | 'history' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Partial<import('@/types/budget').Expense>;
}

function ExpenseForm({ onSubmit, onCancel, initialData }: ExpenseFormProps) {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExpensesView.tsx:78',message:'ExpenseForm component entry',data:{hasOnSubmit:typeof onSubmit === 'function',hasOnCancel:typeof onCancel === 'function',hasInitialData:!!initialData},timestamp:Date.now(),sessionId:'debug-session',runId:'expenses-error-debug',hypothesisId:'E'})}).catch(()=>{});
  // #endregion agent log
  
  const { language } = useTranslation();
  
  // Force re-render on language change
  React.useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExpensesView.tsx:83',message:'ExpenseForm useEffect',data:{language:language},timestamp:Date.now(),sessionId:'debug-session',runId:'expenses-error-debug',hypothesisId:'F'})}).catch(()=>{});
    // #endregion agent log
    // This will trigger re-render when language changes
  }, [language]);
  
  const [formData, setFormData] = React.useState({
    category: initialData?.category || 'кредиты' as ExpenseCategory,
    subcategory: initialData?.subcategory || '',
    name: initialData?.name || '',
    amount: initialData?.amount?.toString() || '',
    dayOfMonth: initialData?.dayOfMonth?.toString() || '',
    frequency: initialData?.frequency || 'monthly' as 'monthly' | 'weekly' | 'biweekly' | 'once',
    targetMonth: initialData?.targetMonth?.toString() || '',
    targetYear: initialData?.targetYear?.toString() || '',
    isRequired: initialData?.isRequired ?? true,
    notes: initialData?.notes || '',
    isTransfer: initialData?.isTransfer || false,
    transferType: initialData?.transferType || 'sent' as 'sent' | 'received',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expenseData = {
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      name: formData.name,
      amount: parseFloat(formData.amount),
      dayOfMonth: formData.dayOfMonth ? parseInt(formData.dayOfMonth) : null,
      dueDate: null,
      isPaid: false,
      isRequired: formData.isRequired,
      notes: formData.notes || undefined,
      frequency: formData.frequency,
      isTransfer: formData.category === 'переводы' || formData.isTransfer || undefined,
      transferType: (formData.category === 'переводы' || formData.isTransfer) ? formData.transferType : undefined,
    };

    if (formData.frequency === 'once') {
      (expenseData as any).targetMonth = formData.targetMonth ? parseInt(formData.targetMonth) : undefined;
      (expenseData as any).targetYear = formData.targetYear ? parseInt(formData.targetYear) : undefined;
    }

    onSubmit(expenseData as Omit<import('@/types/budget').Expense, 'id' | 'history' | 'createdAt'>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-pink-400 mb-2 block">{t('expenses.category')}</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
        >
          <option value="кредиты">{t('category.credits')}</option>
          <option value="коммунальные">{t('category.utilities')}</option>
          <option value="домашние_траты">{t('category.home')}</option>
          <option value="здоровье">{t('category.health')}</option>
          <option value="автомобиль">{t('category.car')}</option>
          <option value="прочее">{t('category.other')}</option>
          <option value="переводы">{t('category.transfers')}</option>
        </select>
      </div>
      
      {/* Подкатегории для коммунальных */}
      {formData.category === 'коммунальные' && (
        <div>
          <label className="text-sm font-medium text-pink-400 mb-2 block">{t('expenses.subcategory')}</label>
          <select
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
          >
            <option value="">{t('expenses.noSubcategory')}</option>
            <option value="электро">{t('subcategory.electricity')}</option>
            <option value="газ">{t('subcategory.gas')}</option>
            <option value="вода">{t('subcategory.water')}</option>
            <option value="отопление">{t('subcategory.heating')}</option>
            <option value="интернет">{t('subcategory.internet')}</option>
            <option value="тв">{t('subcategory.tv')}</option>
          </select>
        </div>
      )}
      
      {/* Подкатегории для домашних трат */}
      {formData.category === 'домашние_траты' && (
        <div>
          <label className="text-sm font-medium text-pink-400 mb-2 block">{t('expenses.subcategory')}</label>
          <select
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
          >
            <option value="">{t('expenses.noSubcategory')}</option>
            <option value="продукты">{t('subcategory.groceries')}</option>
            <option value="бытовая_химия">{t('subcategory.household')}</option>
            <option value="косметика">{t('subcategory.cosmetics')}</option>
            <option value="ремонт">{t('subcategory.repair')}</option>
          </select>
        </div>
      )}
      
      {/* Подкатегории для здоровья */}
      {formData.category === 'здоровье' && (
        <div>
          <label className="text-sm font-medium text-pink-400 mb-2 block">{t('expenses.subcategory')}</label>
          <select
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
          >
            <option value="">{t('expenses.noSubcategory')}</option>
            <option value="аптека">{t('subcategory.pharmacy')}</option>
            <option value="клиника">{t('subcategory.clinic')}</option>
            <option value="спорт">{t('subcategory.sport')}</option>
          </select>
        </div>
      )}
      
      {/* Подкатегории для автомобиля */}
      {formData.category === 'автомобиль' && (
        <div>
          <label className="text-sm font-medium text-pink-400 mb-2 block">{t('expenses.subcategory')}</label>
          <select
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
          >
            <option value="">{t('expenses.noSubcategory')}</option>
            <option value="ремонт_авто">{t('subcategory.carRepair')}</option>
            <option value="заправка">{t('subcategory.gasStation')}</option>
            <option value="обслуживание">{t('subcategory.carService')}</option>
          </select>
        </div>
      )}
      {formData.category === 'переводы' && (
        <div>
          <label className="text-sm font-medium text-pink-400 mb-2 block">{t('expenses.transferType')}</label>
          <select
            value={formData.transferType}
            onChange={(e) => setFormData({ ...formData, transferType: e.target.value as 'sent' | 'received' })}
            className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
          >
            <option value="sent">{t('expenses.transfer.sent')}</option>
            <option value="received">{t('expenses.transfer.received')}</option>
          </select>
          <p className="text-xs text-pink-500/60 mt-1">
            {formData.transferType === 'sent' 
              ? t('expenses.transfer.sentDesc')
              : t('expenses.transfer.receivedDesc')}
          </p>
        </div>
      )}
      <div>
        <label className="text-sm font-medium text-pink-400 mb-2 block">{t('expenses.name')}</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
          placeholder={t('expenses.name')}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-pink-400 mb-2 block">{t('expenses.amount')}</label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
          placeholder="15000"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-pink-400 mb-2 block">{t('expenses.dayOfMonth')}</label>
        <input
          type="number"
          min="1"
          max="31"
          value={formData.dayOfMonth}
          onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
          placeholder="15"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isRequired"
          checked={formData.isRequired}
          onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
          className="w-4 h-4 accent-pink-500"
        />
        <label htmlFor="isRequired" className="text-sm text-pink-400">
          {t('expenses.isRequired')}
        </label>
      </div>
      <div>
        <label className="text-sm font-medium text-pink-400 mb-2 block">{t('income.frequency')}</label>
        <select
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
        >
          <option value="monthly">{t('income.frequency.monthly')}</option>
          <option value="weekly">{t('income.frequency.weekly')}</option>
          <option value="biweekly">{t('income.frequency.biweekly')}</option>
          <option value="once">{t('income.frequency.once')}</option>
        </select>
      </div>
      {formData.frequency === 'once' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-pink-400 mb-2 block">{t('income.targetMonth')}</label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.targetMonth}
              onChange={(e) => setFormData({ ...formData, targetMonth: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
              placeholder="12"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-pink-400 mb-2 block">{t('income.year')}</label>
            <input
              type="number"
              min="2024"
              max="2050"
              value={formData.targetYear}
              onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
              placeholder="2024"
            />
          </div>
        </div>
      )}
      <div>
        <label className="text-sm font-medium text-pink-400 mb-2 block">{t('income.notesOptional')}</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input resize-none"
          rows={2}
          placeholder={t('income.notesPlaceholder')}
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          className="flex-1 neon-button"
        >
          {t('common.save')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="text-pink-400 hover:bg-pink-500/10"
        >
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}

export default function ExpensesView() {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExpensesView.tsx:79',message:'ExpensesView component entry',data:{expenseFormDefined:typeof ExpenseForm !== 'undefined',dialogDefined:typeof Dialog !== 'undefined',buttonDefined:typeof Button !== 'undefined',badgeDefined:typeof Badge !== 'undefined',useTranslationDefined:typeof useTranslation !== 'undefined',tDefined:typeof t !== 'undefined',categoryIconsDefined:typeof categoryIcons !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'expenses-error-debug',hypothesisId:'A'})}).catch(()=>{});
  // #endregion agent log
  
  const { expenses, deleteExpense, toggleExpensePaid, addExpense, updateExpense, currentMonth } = useBudgetStore();
  const { language } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<any>(null);
  const [filter, setFilter] = React.useState<'all' | 'required' | 'optional'>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  
  // Force re-render on language change
  React.useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExpensesView.tsx:91',message:'ExpensesView useEffect language change',data:{language:language,expenseFormDefined:typeof ExpenseForm !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'expenses-error-debug',hypothesisId:'B'})}).catch(()=>{});
    // #endregion agent log
    // This will trigger re-render when language changes
  }, [language]);

  // Получаем выбранный месяц и год с проверкой
  const { selectedYear, selectedMonth } = React.useMemo(() => {
    if (!currentMonth || typeof currentMonth !== 'string') {
      const now = new Date();
      return { selectedYear: now.getFullYear(), selectedMonth: now.getMonth() + 1 };
    }
    try {
      const parts = currentMonth.split('-');
      if (parts.length !== 2) {
        const now = new Date();
        return { selectedYear: now.getFullYear(), selectedMonth: now.getMonth() + 1 };
      }
      return {
        selectedYear: Number(parts[0]),
        selectedMonth: Number(parts[1])
      };
    } catch (error) {
      const now = new Date();
      return { selectedYear: now.getFullYear(), selectedMonth: now.getMonth() + 1 };
    }
  }, [currentMonth]);

  // Функция для проверки, относится ли расход к выбранному месяцу
  const isExpenseInMonth = React.useCallback((exp: any) => {
    if (!exp || !exp.frequency) return true;
    
    if (exp.frequency === 'once') {
      // Для разовых - проверяем targetMonth и targetYear
      return exp.targetYear === selectedYear && exp.targetMonth === selectedMonth;
    } else if (exp.frequency === 'monthly') {
      // Ежемесячные показываем всегда
      return true;
    } else if (exp.frequency === 'weekly' || exp.frequency === 'biweekly') {
      // Еженедельные и раз в две недели показываем всегда
      return true;
    }
    return true;
  }, [selectedYear, selectedMonth]);

  // Фильтрация расходов по месяцу, статусу и категории
  const filteredExpenses = React.useMemo(() => {
    if (!expenses || !Array.isArray(expenses)) return [];
    
    return expenses.filter(exp => {
      if (!exp) return false;
      
      // Фильтр по месяцу
      if (!isExpenseInMonth(exp)) return false;
      
      // Фильтр по обязательности
      if (filter === 'required') {
        if (!exp.isRequired) return false;
      } else if (filter === 'optional') {
        if (exp.isRequired) return false;
      }
      
      // Фильтр по категории
      if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
      
      return true;
    });
  }, [expenses, filter, categoryFilter, isExpenseInMonth]);

  const totalRequired = React.useMemo(() => {
    if (!expenses || !Array.isArray(expenses)) return 0;
    return expenses.filter(e => e && e.isRequired).reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const totalOptional = React.useMemo(() => {
    if (!expenses || !Array.isArray(expenses)) return 0;
    return expenses.filter(e => e && !e.isRequired).reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  // #region agent log
  const beforeRenderCheck = {
    expenseFormDefined: typeof ExpenseForm !== 'undefined',
    expenseFormType: typeof ExpenseForm,
    expenseFormIsFunction: typeof ExpenseForm === 'function',
    expenseFormIsComponent: React.isValidElement ? 'checking' : 'no-check',
  };
  fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExpensesView.tsx:166',message:'ExpensesView before render',data:beforeRenderCheck,timestamp:Date.now(),sessionId:'debug-session',runId:'expenses-error-debug',hypothesisId:'C'})}).catch(()=>{});
  // #endregion agent log
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pink-400 neon-text-pink">
            {t('expenses.title')}
          </h2>
          <p className="text-sm text-pink-500/60 mt-1">
            {t('expenses.subtitle')}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="neon-button">
              <Plus className="h-4 w-4 mr-2" />
              {t('expenses.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d0d14] border-pink-500/30 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-pink-400">{t('expenses.add')}</DialogTitle>
              <DialogDescription className="text-pink-500/60">
                {t('expenses.subtitle')}
              </DialogDescription>
            </DialogHeader>
            {/* #region agent log */}
            {(() => {
              fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExpensesView.tsx:191',message:'Before ExpenseForm render',data:{expenseFormDefined:typeof ExpenseForm !== 'undefined',expenseFormType:typeof ExpenseForm,expenseFormValue:ExpenseForm ? 'exists' : 'null/undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'expenses-error-debug',hypothesisId:'D'})}).catch(()=>{});
              return null;
            })()}
            {/* #endregion agent log */}
            <ExpenseForm
              onSubmit={(data) => {
                addExpense(data);
                setIsAddDialogOpen(false);
              }}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="neon-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pink-500/60">
              {t('expenses.totalRequired')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-pink-400 neon-text-pink">
              {formatCurrency(totalRequired)}
            </p>
          </CardContent>
        </Card>
        <Card className="neon-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pink-500/60">
              {t('expenses.totalOptional')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-cyan-400 neon-text-cyan">
              {formatCurrency(totalOptional)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'text-pink-500/60 hover:bg-pink-500/10'}
        >
          {t('expenses.filter.all')}
        </Button>
        <Button
          variant={filter === 'required' ? 'default' : 'ghost'}
          onClick={() => setFilter('required')}
          className={filter === 'required' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'text-pink-500/60 hover:bg-pink-500/10'}
        >
          {t('expenses.filter.required')}
        </Button>
        <Button
          variant={filter === 'optional' ? 'default' : 'ghost'}
          onClick={() => setFilter('optional')}
          className={filter === 'optional' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'text-pink-500/60 hover:bg-pink-500/10'}
        >
          {t('expenses.filter.optional')}
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredExpenses.length === 0 ? (
          <Card className="neon-card">
            <CardContent className="p-12 text-center">
              <p className="text-pink-500/60">{t('expenses.empty')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredExpenses.map((exp) => {
            const CategoryIcon = categoryIcons[exp.category];
            return (
              <Card key={exp.id} className="neon-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CategoryIcon className={`h-5 w-5 ${categoryColors[exp.category]}`} />
                        <h3 className="text-lg font-semibold text-pink-300">{exp.name}</h3>
                        <Badge
                          variant={exp.isPaid ? "default" : "secondary"}
                          className={exp.isPaid ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-pink-500/20 text-pink-400 border-pink-500/30"}
                        >
                          {exp.isPaid ? t('expenses.isPaid') : t('expenses.notPaid')}
                        </Badge>
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-500/60 min-w-[80px]">
                          {getCategoryLabel(exp.category)}
                        </Badge>
                        {exp.subcategory && (
                          <Badge variant="outline" className="text-xs bg-pink-500/10 text-pink-400 border-pink-500/30">
                            {getSubcategoryLabel(exp.subcategory)}
                          </Badge>
                        )}
                        {exp.isRequired && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            {t('expenses.required')}
                          </Badge>
                        )}
                        {exp.frequency && (
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-500/60 min-w-[80px]">
                            {exp.frequency === 'monthly' ? t('income.frequency.monthly') :
                             exp.frequency === 'weekly' ? t('income.frequency.weekly') :
                             exp.frequency === 'biweekly' ? t('income.frequency.biweekly') :
                             exp.frequency === 'once' ? t('income.frequency.once') : t('income.frequency.monthly')}
                          </Badge>
                        )}
                        {exp.isTransfer && (
                          <Badge className={cn(
                            exp.transferType === 'sent' 
                              ? "bg-orange-500/20 text-orange-400 border-orange-500/30" 
                              : "bg-green-500/20 text-green-400 border-green-500/30",
                            "min-w-[100px]"
                          )}>
                            {exp.transferType === 'sent' ? '💸 Отправлен' : '💰 Получен'}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {exp.dayOfMonth && (
                          <p className="text-sm text-cyan-500/60">
                            {t('expenses.dayOfMonth')}: <span className="text-cyan-400 font-medium">{exp.dayOfMonth}</span>
                          </p>
                        )}
                        <p className="text-2xl font-bold text-pink-400 neon-text-pink">
                          {formatCurrency(exp.amount)}
                        </p>
                        {exp.notes && (
                          <p className="text-xs text-cyan-500/40 mt-2">{exp.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpensePaid(exp.id)}
                        className={exp.isPaid ? "text-green-400 hover:bg-green-500/10" : "text-cyan-400 hover:bg-cyan-500/10"}
                      >
                        {exp.isPaid ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingExpense(exp);
                          setIsEditDialogOpen(true);
                        }}
                        className="text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExpense(exp.id)}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#0d0d14] border-pink-500/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-pink-400">{t('expenses.edit')}</DialogTitle>
            <DialogDescription className="text-pink-500/60">
              {t('expenses.subtitle')}
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            onSubmit={(data) => {
              updateExpense(editingExpense.id, data);
              setIsEditDialogOpen(false);
              setEditingExpense(null);
            }}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingExpense(null);
            }}
            initialData={editingExpense}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
