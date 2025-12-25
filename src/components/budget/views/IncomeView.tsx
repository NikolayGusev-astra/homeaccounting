'use client';

import * as React from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { cn, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function IncomeView() {
  const { income, deleteIncome, toggleIncomeReceived, addIncome, updateIncome, currentMonth } = useBudgetStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingIncome, setEditingIncome] = React.useState<any>(null);
  const [filter, setFilter] = React.useState<'all' | 'received' | 'unreceived'>('all');

  // Получаем выбранный месяц и год
  const [selectedYear, selectedMonth] = currentMonth.split('-').map(Number);

  // Функция для проверки, относится ли доход к выбранному месяцу
  const isIncomeInMonth = (inc: any) => {
    if (inc.frequency === 'once') {
      // Для разовых - проверяем targetMonth и targetYear
      return inc.targetYear === selectedYear && inc.targetMonth === selectedMonth;
    } else if (inc.frequency === 'monthly') {
      // Ежемесячные показываем всегда
      return true;
    } else if (inc.frequency === 'weekly' || inc.frequency === 'biweekly') {
      // Еженедельные и раз в две недели показываем всегда
      return true;
    }
    return true;
  };

  // Фильтрация доходов по месяцу и статусу
  const filteredIncome = income.filter(inc => {
    if (!isIncomeInMonth(inc)) return false;
    if (filter === 'received') return inc.received;
    if (filter === 'unreceived') return !inc.received;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400 neon-text-cyan">
            Доходы
          </h2>
          <p className="text-sm text-cyan-500/60 mt-1">
            Управление источниками дохода
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="neon-button-cyan">
              <Plus className="h-4 w-4 mr-2" />
              Добавить доход
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d0d14] border-cyan-500/30">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">Добавить доход</DialogTitle>
            </DialogHeader>
            <IncomeForm
              onSubmit={(data) => {
                addIncome(data);
                setIsAddDialogOpen(false);
              }}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Income List */}
      <div className="grid gap-4">
        {income.length === 0 ? (
          <Card className="neon-card">
            <CardContent className="p-12 text-center">
              <p className="text-cyan-500/60">Нет добавленных доходов</p>
            </CardContent>
          </Card>
        ) : (
          filteredIncome.map((inc) => (
            <Card key={inc.id} className="neon-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-cyan-300">{inc.name}</h3>
                      <Badge
                        variant={inc.received ? "default" : "secondary"}
                        className={cn(
                          inc.received ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
                          "min-w-[80px]"
                        )}
                      >
                        {inc.received ? 'Получено' : 'Ожидается'}
                      </Badge>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-500/60 min-w-[80px]">
                        {inc.frequency === 'monthly' ? 'Ежемесячно' :
                         inc.frequency === 'weekly' ? 'Еженедельно' :
                         inc.frequency === 'biweekly' ? 'Раз в 2 недели' :
                         inc.frequency === 'once' ? 'Разово' : 'Ежемесячно'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-cyan-500/60">
                        День поступления: <span className="text-cyan-400 font-medium">{inc.dayOfMonth} числа</span>
                      </p>
                      <p className="text-2xl font-bold text-green-400 neon-text-green">
                        {formatCurrency(inc.amount)}
                      </p>
                      {inc.notes && (
                        <p className="text-xs text-cyan-500/40 mt-2">{inc.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleIncomeReceived(inc.id)}
                        className={inc.received ? "text-green-400 hover:bg-green-500/10" : "text-cyan-400 hover:bg-cyan-500/10"}
                      >
                        {inc.received ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setEditingIncome(inc);
                            setIsEditDialogOpen(true);
                          }}
                        className="text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteIncome(inc.id)}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#0d0d14] border-cyan-500/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-cyan-400">Редактировать доход</DialogTitle>
          </DialogHeader>
          <IncomeForm
            onSubmit={(data) => {
              updateIncome(editingIncome.id, data);
              setIsEditDialogOpen(false);
              setEditingIncome(null);
            }}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingIncome(null);
            }}
            initialData={editingIncome}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface IncomeFormProps {
  onSubmit: (data: Omit<import('@/types/budget').Income, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Partial<import('@/types/budget').Income>;
}

function IncomeForm({ onSubmit, onCancel, initialData }: IncomeFormProps) {
  const [formData, setFormData] = React.useState({
    name: initialData?.name || '',
    amount: initialData?.amount?.toString() || '',
    dayOfMonth: initialData?.dayOfMonth?.toString() || '',
    frequency: initialData?.frequency || 'monthly' as 'monthly' | 'weekly' | 'biweekly' | 'once',
    targetMonth: initialData?.targetMonth?.toString() || '',
    targetYear: initialData?.targetYear?.toString() || '',
    received: initialData?.received || false,
    notes: initialData?.notes || '',
    isTransfer: initialData?.isTransfer || false,
    transferType: initialData?.transferType || 'received' as 'sent' | 'received',
  });

  // Синхронизируем formData с initialData при изменении editingIncome
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        amount: initialData.amount?.toString() || '',
        dayOfMonth: initialData.dayOfMonth?.toString() || '',
        frequency: initialData.frequency || 'monthly' as 'monthly' | 'weekly' | 'biweekly' | 'once',
        targetMonth: initialData.targetMonth?.toString() || '',
        targetYear: initialData.targetYear?.toString() || '',
        received: initialData.received || false,
        notes: initialData.notes || '',
        isTransfer: initialData.isTransfer || false,
        transferType: initialData.transferType || 'received' as 'sent' | 'received',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const incomeData = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      dayOfMonth: parseInt(formData.dayOfMonth),
      frequency: formData.frequency,
      received: initialData?.received ?? false, // При редактировании сохраняем исходный статус, при создании - false
      receivedDate: initialData?.received ? initialData.receivedDate : null, // При редактировании сохраняем исходную дату, при создании - null
      notes: formData.notes || undefined,
      isTransfer: formData.isTransfer || undefined,
      transferType: formData.isTransfer ? formData.transferType : undefined,
    };

    // Добавляем поля targetMonth и targetYear только для разовых платежей
    if (formData.frequency === 'once') {
      (incomeData as any).targetMonth = formData.targetMonth ? parseInt(formData.targetMonth) : undefined;
      (incomeData as any).targetYear = formData.targetYear ? parseInt(formData.targetYear) : undefined;
    }

    onSubmit(incomeData as Omit<import('@/types/budget').Income, 'id' | 'createdAt'>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-cyan-400 mb-2 block">Название</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
          placeholder="Зарплата, премия и т.д."
        />
      </div>
      <div>
        <label className="text-sm font-medium text-cyan-400 mb-2 block">Сумма (₽)</label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
          placeholder="100000"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-cyan-400 mb-2 block">День поступления</label>
        <input
          type="number"
          required
          min="1"
          max="31"
          value={formData.dayOfMonth}
          onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
          placeholder="10"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-cyan-400 mb-2 block">Периодичность</label>
        <select
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
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
            <label className="text-sm font-medium text-cyan-400 mb-2 block">Целевой месяц</label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.targetMonth}
              onChange={(e) => setFormData({ ...formData, targetMonth: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
              placeholder="12"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-cyan-400 mb-2 block">Год</label>
            <input
              type="number"
              min="2024"
              max="2050"
              value={formData.targetYear}
              onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
              placeholder="2024"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isTransfer"
          checked={formData.isTransfer}
          onChange={(e) => setFormData({ ...formData, isTransfer: e.target.checked })}
          className="w-4 h-4 text-cyan-400 bg-[#0a0a0f] border-cyan-500/30 rounded focus:ring-cyan-400"
        />
        <label htmlFor="isTransfer" className="text-sm font-medium text-cyan-400 cursor-pointer">
          Это перевод
        </label>
      </div>

      {formData.isTransfer && (
        <div>
          <label className="text-sm font-medium text-cyan-400 mb-2 block">Тип перевода</label>
          <select
            value={formData.transferType}
            onChange={(e) => setFormData({ ...formData, transferType: e.target.value as 'sent' | 'received' })}
            className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
          >
            <option value="received">💰 Полученный перевод (доход)</option>
            <option value="sent">💸 Отправленный перевод (будет в расходах)</option>
          </select>
          <p className="text-xs text-cyan-500/60 mt-1">
            {formData.transferType === 'received' 
              ? 'Полученный перевод учитывается как доход'
              : 'Отправленный перевод будет автоматически добавлен в расходы'}
          </p>
        </div>
      )}
      
      <div>
        <label className="text-sm font-medium text-cyan-400 mb-2 block">Примечание (необязательно)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input resize-none"
          rows={2}
          placeholder="Дополнительная информация"
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          className="flex-1 neon-button-cyan"
        >
          Сохранить
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="text-cyan-400 hover:bg-cyan-500/10"
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}
