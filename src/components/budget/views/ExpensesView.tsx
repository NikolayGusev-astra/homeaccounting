'use client';

import * as React from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Check, X, CreditCard, Droplet, Utensils, MoreHorizontal, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ExpenseCategory } from '@/types/budget';

const categoryIcons: Record<ExpenseCategory, any> = {
  кредиты: CreditCard,
  коммунальные: Droplet,
  питание: Utensils,
  прочее: MoreHorizontal,
};

const categoryColors: Record<ExpenseCategory, string> = {
  кредиты: 'text-purple-400',
  коммунальные: 'text-blue-400',
  питание: 'text-orange-400',
  прочее: 'text-cyan-400',
};

export default function ExpensesView() {
  const { expenses, deleteExpense, toggleExpensePaid, addExpense, updateExpense } = useBudgetStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<any>(null);
  const [filter, setFilter] = React.useState<'all' | 'required' | 'optional'>('all');

  const filteredExpenses = expenses.filter(exp => {
    if (filter === 'required') return exp.isRequired;
    if (filter === 'optional') return !exp.isRequired;
    return true;
  });

  const totalRequired = expenses.filter(e => e.isRequired).reduce((sum, e) => sum + e.amount, 0);
  const totalOptional = expenses.filter(e => !e.isRequired).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pink-400 neon-text-pink">
            Расходы
          </h2>
          <p className="text-sm text-pink-500/60 mt-1">
            Управление обязательными и необязательными платежами
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="neon-button">
              <Plus className="h-4 w-4 mr-2" />
              Добавить расход
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d0d14] border-pink-500/30 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-pink-400">Добавить расход</DialogTitle>
            </DialogHeader>
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
              Обязательные платежи
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
              Необязательные расходы
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
          Все
        </Button>
        <Button
          variant={filter === 'required' ? 'default' : 'ghost'}
          onClick={() => setFilter('required')}
          className={filter === 'required' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'text-pink-500/60 hover:bg-pink-500/10'}
        >
          Обязательные
        </Button>
        <Button
          variant={filter === 'optional' ? 'default' : 'ghost'}
          onClick={() => setFilter('optional')}
          className={filter === 'optional' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'text-pink-500/60 hover:bg-pink-500/10'}
        >
          Необязательные
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredExpenses.length === 0 ? (
          <Card className="neon-card">
            <CardContent className="p-12 text-center">
              <p className="text-pink-500/60">Нет добавленных расходов</p>
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
                      <div className="flex items-center gap-2 mb-2">
                        <CategoryIcon className={`h-5 w-5 ${categoryColors[exp.category]}`} />
                        <h3 className="text-lg font-semibold text-pink-300">{exp.name}</h3>
                        <Badge
                          variant={exp.isPaid ? "default" : "secondary"}
                          className={exp.isPaid ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-pink-500/20 text-pink-400 border-pink-500/30"}
                        >
                          {exp.isPaid ? 'Оплачено' : 'Не оплачено'}
                        </Badge>
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-500/60 min-w-[80px]">
                          {exp.category}
                        </Badge>
                        {exp.isRequired && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Обязательно
                          </Badge>
                        )}
                        {exp.frequency && (
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-500/60 min-w-[80px]">
                            {exp.frequency === 'monthly' ? 'Ежемесячно' :
                             exp.frequency === 'weekly' ? 'Еженедельно' :
                             exp.frequency === 'biweekly' ? 'Раз в 2 недели' :
                             exp.frequency === 'once' ? 'Разово' : 'Ежемесячно'}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {exp.dayOfMonth && (
                          <p className="text-sm text-cyan-500/60">
                            День платежа: <span className="text-cyan-400 font-medium">{exp.dayOfMonth} числа</span>
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
            <DialogTitle className="text-pink-400">Редактировать расход</DialogTitle>
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

interface ExpenseFormProps {
  onSubmit: (data: Omit<import('@/types/budget').Expense, 'id' | 'history' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Partial<import('@/types/budget').Expense>;
}

function ExpenseForm({ onSubmit, onCancel, initialData }: ExpenseFormProps) {
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
        <label className="text-sm font-medium text-pink-400 mb-2 block">Категория</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
        >
          <option value="кредиты">💳 Кредиты</option>
          <option value="коммунальные">💧 Коммунальные</option>
          <option value="питание">🍔 Питание</option>
          <option value="прочее">📱 Прочее</option>
        </select>
      </div>
      {formData.category === 'коммунальные' && (
        <div>
          <label className="text-sm font-medium text-pink-400 mb-2 block">Подкатегория</label>
          <select
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
          >
            <option value="">Без подкатегории</option>
            <option value="электро">⚡ Электроэнергия</option>
            <option value="газ">🔥 Газ</option>
            <option value="вода">💧 Вода</option>
            <option value="отопление">🌡️ Отопление</option>
            <option value="интернет">📶 Интернет</option>
            <option value="тв">📺 ТВ</option>
          </select>
        </div>
      )}
      <div>
        <label className="text-sm font-medium text-pink-400 mb-2 block">Название</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
          placeholder="Кредит в Сбербанке, Электроэнергия и т.д."
        />
      </div>
      <div>
        <label className="text-sm font-medium text-pink-400 mb-2 block">Сумма (₽)</label>
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
        <label className="text-sm font-medium text-pink-400 mb-2 block">День платежа</label>
        <input
          type="number"
          min="1"
          max="31"
          value={formData.dayOfMonth}
          onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
          placeholder="15 (оставьте пустым для без конкретной даты)"
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
          Обязательный платеж
        </label>
      </div>
      <div>
        <label className="text-sm font-medium text-pink-400 mb-2 block">Периодичность</label>
        <select
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input"
        >
          <option value="monthly">Ежемесячно</option>
          <option value="weekly">Еженедельно</option>
          <option value="biweekly">Раз в 2 недели</option>
          <option value="once">Разово</option>
        </select>
      </div>
      {formData.frequency === 'once' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-pink-400 mb-2 block">Целевой месяц</label>
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
            <label className="text-sm font-medium text-pink-400 mb-2 block">Год</label>
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
        <label className="text-sm font-medium text-pink-400 mb-2 block">Примечание (необязательно)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none neon-input resize-none"
          rows={2}
          placeholder="Дополнительная информация"
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          className="flex-1 neon-button"
        >
          Сохранить
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="text-pink-400 hover:bg-pink-500/10"
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}
