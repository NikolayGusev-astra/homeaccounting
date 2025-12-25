'use client';

import * as React from 'react';
import { useAccountStore } from '@/store/useAccountStore';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Wallet, CreditCard, PiggyBank } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { AccountType } from '@/types/budget';
import { cn } from '@/lib/utils';

const accountIcons: Record<AccountType, any> = {
  debit: Wallet,
  credit_card: CreditCard,
  savings: PiggyBank,
};

const accountColors: Record<AccountType, string> = {
  debit: 'text-green-400',
  credit_card: 'text-yellow-400',
  savings: 'text-purple-400',
};

export default function AccountsView() {
  const { accounts, addAccount, updateAccount, deleteAccount, getAccountBalance } = useAccountStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<any>(null);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleDeleteAccount = (id: string) => {
    if (window.confirm('Удалить этот счёт?')) {
      deleteAccount(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400 neon-text-cyan">
            Счёта
          </h2>
          <p className="text-sm text-cyan-500/60 mt-1">
            Управление банковскими картами, кредитками и накопительными счетами
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="neon-button">
              <Plus className="h-4 w-4 mr-2" />
              Добавить счёт
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d0d14] border-cyan-500/30 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">Добавить счёт</DialogTitle>
            </DialogHeader>
            <AccountForm
              onSubmit={(data) => {
                addAccount(data);
                setIsAddDialogOpen(false);
              }}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="neon-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-500/60">
              Всего средств
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-400 neon-text-green">
              {formatCurrency(totalBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <Card className="neon-card col-span-full">
            <CardContent className="p-12 text-center">
              <p className="text-cyan-500/60">Нет добавленных счётов</p>
            </CardContent>
          </Card>
        ) : (
          accounts.map((acc) => {
            const AccountIcon = accountIcons[acc.type];
            const AccountColor = accountColors[acc.type];
            const balance = getAccountBalance(acc.id);

            return (
              <Card key={acc.id} className="neon-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AccountIcon className={`h-6 w-6 ${AccountColor}`} />
                        <h3 className="text-lg font-semibold text-cyan-300">{acc.name}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-cyan-500/30 text-cyan-500/60 min-w-[80px]",
                            acc.type === 'debit' && "border-green-500/30 text-green-400",
                            acc.type === 'credit_card' && "border-yellow-500/30 text-yellow-400",
                            acc.type === 'savings' && "border-purple-500/30 text-purple-400"
                          )}
                        >
                          {acc.type === 'debit' ? 'Дебетовая карта' :
                           acc.type === 'credit_card' ? 'Кредитная карта' :
                           acc.type === 'savings' ? 'Накопительный счёт' : 'Счёт'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-cyan-500/60">
                          Банк: <span className="text-cyan-400 font-medium">{acc.bankName}</span>
                        </p>
                        <p className="text-sm text-cyan-500/60">
                          Валюта: <span className="text-cyan-400 font-medium">{acc.currency}</span>
                        </p>
                        {acc.creditLimit && (
                          <p className="text-sm text-cyan-500/60">
                            Кредитный лимит: <span className="text-yellow-400 font-medium">{formatCurrency(acc.creditLimit)}</span>
                          </p>
                        )}
                        {acc.interestRate && (
                          <p className="text-sm text-cyan-500/60">
                            Процентная ставка: <span className="text-cyan-400 font-medium">{acc.interestRate}%</span>
                          </p>
                        )}
                        {acc.gracePeriodDays && (
                          <p className="text-sm text-cyan-500/60">
                            Грейс-период: <span className="text-yellow-400 font-medium">{acc.gracePeriodDays} дней</span>
                          </p>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-cyan-300 neon-text-cyan">
                        {formatCurrency(balance)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingAccount(acc);
                          setIsAddDialogOpen(true);
                        }}
                        className="text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAccount(acc.id)}
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
    </div>
  );
}

interface AccountFormProps {
  onSubmit: (data: Omit<import('@/types/budget').Account, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Partial<import('@/types/budget').Account>;
}

function AccountForm({ onSubmit, onCancel, initialData }: AccountFormProps) {
  const [formData, setFormData] = React.useState({
    name: initialData?.name || '',
    type: initialData?.type || 'debit' as AccountType,
    bankName: initialData?.bankName || '',
    currency: initialData?.currency || 'RUB',
    balance: initialData?.balance?.toString() || '',
    creditLimit: initialData?.creditLimit?.toString() || '',
    interestRate: initialData?.interestRate?.toString() || '',
    gracePeriodDays: initialData?.gracePeriodDays?.toString() || '',
    color: initialData?.color || '#00D4FF',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const accountData = {
      name: formData.name,
      type: formData.type,
      bankName: formData.bankName,
      currency: formData.currency,
      balance: parseFloat(formData.balance),
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      gracePeriodDays: formData.gracePeriodDays ? parseInt(formData.gracePeriodDays) : undefined,
      color: formData.color,
    };

    onSubmit(accountData as Omit<import('@/types/budget').Account, 'id' | 'createdAt'>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-cyan-400 mb-2 block">Название счёта</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
          placeholder="Карты Сбербанка, Тинькофф и т.д."
        />
      </div>
      <div>
        <label className="text-sm font-medium text-cyan-400 mb-2 block">Тип счёта</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
        >
          <option value="debit">👛 Дебетовая карта</option>
          <option value="credit_card">💳 Кредитная карта</option>
          <option value="savings">🐖 Накопительный счёт</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-cyan-400 mb-2 block">Банк</label>
        <input
          type="text"
          required
          value={formData.bankName}
          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
          placeholder="Сбербанк, Тинькофф и т.д."
        />
      </div>
      <div>
        <label className="text-sm font-medium text-cyan-400 mb-2 block">Валюта</label>
        <select
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'RUB' | 'USD' | 'EUR' })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
        >
          <option value="RUB">🇷🇺 Рубли</option>
          <option value="USD">🇺🇸 Доллары</option>
          <option value="EUR">🇪🇺 Евро</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-cyan-400 mb-2 block">Баланс</label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={formData.balance}
          onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
          placeholder="100000"
        />
      </div>
      {formData.type === 'credit_card' && (
        <>
          <div>
            <label className="text-sm font-medium text-cyan-400 mb-2 block">Кредитный лимит</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
              placeholder="200000"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-cyan-400 mb-2 block">Процентная ставка (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.interestRate}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
              placeholder="15.9"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-cyan-400 mb-2 block">Грейс-период (дней)</label>
            <input
              type="number"
              min="0"
              max="60"
              value={formData.gracePeriodDays}
              onChange={(e) => setFormData({ ...formData, gracePeriodDays: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none neon-input"
              placeholder="21"
            />
          </div>
        </>
      )}
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
