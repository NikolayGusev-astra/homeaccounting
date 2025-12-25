'use client';

import * as React from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, CreditCard } from 'lucide-react';
import type { ExpenseCategory } from '@/types/budget';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const { addIncome, addExpense } = useBudgetStore();
  const [activeTab, setActiveTab] = React.useState<'income' | 'expense'>('income');
  const [formData, setFormData] = React.useState({
    name: '',
    amount: '',
    dayOfMonth: '',
    category: 'прочее' as ExpenseCategory,
    frequency: 'monthly' as 'monthly' | 'weekly' | 'biweekly' | 'once',
    isRequired: true,
    notes: '',
  });
  const [loading, setLoading] = React.useState(false);

  // Сброс формы при закрытии
  React.useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        amount: '',
        dayOfMonth: '',
        category: 'прочее' as ExpenseCategory,
        frequency: 'monthly' as 'monthly' | 'weekly' | 'biweekly' | 'once',
        isRequired: true,
        notes: '',
      });
      setActiveTab('income');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount) {
      alert('Заполните название и сумму');
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'income') {
        addIncome({
          name: formData.name,
          amount: parseFloat(formData.amount),
          dayOfMonth: formData.dayOfMonth ? parseInt(formData.dayOfMonth) : null,
          frequency: formData.frequency,
          received: false,
          receivedDate: null,
          notes: formData.notes || undefined,
          targetMonth: formData.frequency === 'once' ? new Date().getMonth() + 1 : null,
          targetYear: formData.frequency === 'once' ? new Date().getFullYear() : null,
        });
      } else {
        addExpense({
          name: formData.name,
          amount: parseFloat(formData.amount),
          category: formData.category,
          dayOfMonth: formData.dayOfMonth ? parseInt(formData.dayOfMonth) : null,
          dueDate: null,
          isPaid: false,
          isRequired: formData.isRequired,
          notes: formData.notes || undefined,
          frequency: formData.frequency,
          targetMonth: formData.frequency === 'once' ? new Date().getMonth() + 1 : null,
          targetYear: formData.frequency === 'once' ? new Date().getFullYear() : null,
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Ошибка при добавлении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d0d14] border-cyan-500/30 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-cyan-400">Быстрое добавление</DialogTitle>
          <DialogDescription className="text-cyan-500/60">
            Выберите тип и заполните форму
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'income' | 'expense')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#0a0a0f]">
            <TabsTrigger value="income" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <TrendingUp className="h-4 w-4 mr-2" />
              Доход
            </TabsTrigger>
            <TabsTrigger value="expense" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              <CreditCard className="h-4 w-4 mr-2" />
              Расход
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="income-name" className="text-cyan-400">Название</Label>
                <Input
                  id="income-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#0a0a0f] border-cyan-500/30 text-white"
                  placeholder="Например: Зарплата"
                  required
                />
              </div>

              <div>
                <Label htmlFor="income-amount" className="text-cyan-400">Сумма (₽)</Label>
                <Input
                  id="income-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="bg-[#0a0a0f] border-cyan-500/30 text-white"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="income-day" className="text-cyan-400">День месяца</Label>
                <Input
                  id="income-day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                  className="bg-[#0a0a0f] border-cyan-500/30 text-white"
                  placeholder="10"
                />
              </div>

              <div>
                <Label htmlFor="income-frequency" className="text-cyan-400">Периодичность</Label>
                <select
                  id="income-frequency"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="monthly">Ежемесячно</option>
                  <option value="weekly">Еженедельно</option>
                  <option value="biweekly">Раз в две недели</option>
                  <option value="once">Разово</option>
                </select>
              </div>

              <div>
                <Label htmlFor="income-notes" className="text-cyan-400">Примечание</Label>
                <Input
                  id="income-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-[#0a0a0f] border-cyan-500/30 text-white"
                  placeholder="Опционально"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {loading ? 'Сохранение...' : 'Добавить'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="expense" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="expense-name" className="text-pink-400">Название</Label>
                <Input
                  id="expense-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#0a0a0f] border-pink-500/30 text-white"
                  placeholder="Например: Продукты"
                  required
                />
              </div>

              <div>
                <Label htmlFor="expense-amount" className="text-pink-400">Сумма (₽)</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="bg-[#0a0a0f] border-pink-500/30 text-white"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="expense-category" className="text-pink-400">Категория</Label>
                <select
                  id="expense-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none"
                >
                  <option value="кредиты">💳 Кредиты</option>
                  <option value="коммунальные">💧 Коммунальные</option>
                  <option value="домашние_траты">🏠 Домашние траты</option>
                  <option value="здоровье">💊 Здоровье</option>
                  <option value="автомобиль">🚗 Автомобиль</option>
                  <option value="прочее">📦 Прочее</option>
                  <option value="переводы">↔️ Переводы</option>
                </select>
              </div>

              <div>
                <Label htmlFor="expense-day" className="text-pink-400">День месяца</Label>
                <Input
                  id="expense-day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                  className="bg-[#0a0a0f] border-pink-500/30 text-white"
                  placeholder="15"
                />
              </div>

              <div>
                <Label htmlFor="expense-frequency" className="text-pink-400">Периодичность</Label>
                <select
                  id="expense-frequency"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-pink-500/30 rounded-lg text-pink-400 focus:border-pink-400 focus:outline-none"
                >
                  <option value="monthly">Ежемесячно</option>
                  <option value="weekly">Еженедельно</option>
                  <option value="biweekly">Раз в две недели</option>
                  <option value="once">Разово</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="expense-required"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                  className="h-4 w-4 text-pink-600 bg-[#0a0a0f] border-pink-500/30 rounded focus:ring-pink-500"
                />
                <Label htmlFor="expense-required" className="text-pink-400 cursor-pointer">
                  Обязательный платеж
                </Label>
              </div>

              <div>
                <Label htmlFor="expense-notes" className="text-pink-400">Примечание</Label>
                <Input
                  id="expense-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-[#0a0a0f] border-pink-500/30 text-white"
                  placeholder="Опционально"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                >
                  {loading ? 'Сохранение...' : 'Добавить'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

