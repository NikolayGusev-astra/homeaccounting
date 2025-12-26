'use client';

import * as React from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, TrendingDown, Wallet, Target, PieChart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { t, useTranslation } from '@/lib/i18n';

export default function DashboardView() {
  const { currentMonth, getMonthlyForecast, getTotalExpenses, income, expenses, settings } = useBudgetStore();
  const { language } = useTranslation();
  const [selectedDay, setSelectedDay] = React.useState<any>(null);
  const [, setTick] = React.useState(0);
  
  // Force re-render on language change
  React.useEffect(() => {
    // This will trigger re-render when language changes
  }, [language]);

  // Перерендер при изменении данных в store
  const store = useBudgetStore.getState();
  React.useEffect(() => {
    setTick(tick => tick + 1);
  }, [income, expenses]);

  const [year, month] = currentMonth.split('-').map(Number);
  
  // Определяем начальный баланс для текущего месяца
  // Для первого месяца используем initialBalance, для последующих - endingBalance предыдущего месяца
  let startingBalance = settings.initialBalance || 0;
  
  // Если есть данные, рассчитываем прогноз для предыдущего месяца для переноса остатка
  if (income.length > 0 || expenses.length > 0) {
    const [prevYear, prevMonth] = month === 1 ? [year - 1, 12] : [year, month - 1];
    
    // Находим самый ранний месяц с данными
    const allDates: Date[] = [];
    income.forEach(inc => allDates.push(new Date(inc.createdAt)));
    expenses.forEach(exp => allDates.push(new Date(exp.createdAt)));
    
    if (allDates.length > 0) {
      const earliestDate = allDates.reduce((earliest, date) => 
        date < earliest ? date : earliest
      );
      const earliestYear = earliestDate.getFullYear();
      const earliestMonth = earliestDate.getMonth() + 1;
      
      // Если предыдущий месяц раньше самого раннего месяца с данными, используем initialBalance
      if (prevYear < earliestYear || (prevYear === earliestYear && prevMonth < earliestMonth)) {
        startingBalance = settings.initialBalance || 0;
      } else {
        // Рассчитываем баланс от самого раннего месяца до предыдущего
        let calcYear = earliestYear;
        let calcMonth = earliestMonth;
        let calcBalance = settings.initialBalance || 0;
        
        // Рассчитываем все месяцы от самого раннего до предыдущего включительно
        while (calcYear < prevYear || (calcYear === prevYear && calcMonth <= prevMonth)) {
          const forecast = getMonthlyForecast(calcYear, calcMonth, calcBalance);
          calcBalance = forecast.endingBalance;
          
          // Переходим к следующему месяцу
          if (calcMonth === 12) {
            calcYear++;
            calcMonth = 1;
          } else {
            calcMonth++;
          }
        }
        
        // startingBalance для текущего месяца = endingBalance предыдущего месяца
        startingBalance = calcBalance;
      }
    }
  }
  
  // Получаем прогноз для текущего месяца с правильным начальным балансом
  const forecast = getMonthlyForecast(year, month, startingBalance);
  
  // Рассчитываем полный баланс за всё время
  const totalIncomeAll = (store.income || []).reduce((sum, inc) => sum + inc.amount, 0);
  const currentBalance = totalIncomeAll - getTotalExpenses(year, month);

  const handleDayClick = (day: number) => {
    const dayData = forecast.dailyBalances.find(d => d.day === day);
    if (!dayData) return;

    setSelectedDay({
      ...dayData,
      income: dayData.incomeTransactions || [],
      expenses: dayData.expenseTransactions || [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="neon-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-500/60">
              {t('dashboard.monthlyIncome')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-400 neon-text-green">
              {formatCurrency(forecast.totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card className="neon-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pink-500/60">
              {t('dashboard.monthlyExpenses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-pink-400 neon-text-pink">
              {formatCurrency(forecast.totalExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card className="neon-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-cyan-500/60">
              {t('dashboard.finalBalance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${forecast.endingBalance >= 0 ? 'text-green-400 neon-text-green' : 'text-pink-400 neon-text-pink'}`}>
              {formatCurrency(forecast.endingBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Gaps */}
      {forecast.cashGaps.length > 0 && (
        <Card className="neon-card border-pink-500/50">
          <CardHeader>
            <CardTitle className="text-pink-400 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              {t('dashboard.cashGapsTitle')} ({forecast.cashGaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {forecast.cashGaps.map((gap, index) => (
                <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-pink-500/10">
                  <div>
                    <p className="text-sm text-pink-300 font-medium">
                      {gap.day} {new Date(gap.date).toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-pink-400">
                      {t('dashboard.cashGapsShortage')}: {formatCurrency(gap.gapAmount)}
                    </p>
                  </div>
                  <p className={`text-lg font-bold ${gap.gapAmount > 0 ? 'text-pink-400' : 'text-green-400'}`}>
                    {formatCurrency(gap.balance)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card className="neon-card">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('dashboard.calendarTitle')}
            <span className="text-sm text-cyan-500/60 ml-2">
              {new Date(year, month - 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day} className="text-center text-sm text-cyan-500/60 font-medium p-2">
                {day}
              </div>
            ))}
            
            {Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => i + 1).map(day => {
              const dayData = forecast.dailyBalances.find(d => d.day === day);
              const isCashGap = dayData?.isCashGap;
              const hasIncome = dayData?.incomeAll > 0;
              const hasExpenses = dayData?.expensesAll > 0;
              
              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative min-h-[80px] p-2 rounded-lg cursor-pointer
                    transition-all duration-200
                    hover:scale-105
                    ${isCashGap ? 'bg-pink-500/20 border-pink-500/50' : 'bg-cyan-500/10 border-cyan-500/30'}
                  `}
                >
                  <div className="text-sm font-medium text-cyan-400 mb-1">
                    {day}
                  </div>
                  {hasIncome && (
                    <div className="text-xs text-green-400 mb-1">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatCurrency(dayData.incomeAll)}
                      </div>
                    </div>
                  )}
                  {hasExpenses && (
                    <div className="text-xs text-pink-400 mb-1">
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {formatCurrency(dayData.expensesAll)}
                      </div>
                    </div>
                  )}
                  <div className={`
                    text-sm font-bold mt-1
                    ${dayData?.balance >= 0 ? 'text-green-400' : 'text-pink-400'}
                  `}>
                    {formatCurrency(dayData.balance || 0)}
                  </div>
                  {/* Визуальные индикаторы */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {isCashGap && (
                      <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" title="Кассовый разрыв" />
                    )}
                    {hasExpenses && !isCashGap && (
                      <div className="h-2 w-2 rounded-full bg-pink-400" title={t('dashboard.expenses')} />
                    )}
                    {hasIncome && !hasExpenses && !isCashGap && (
                      <div className="h-2 w-2 rounded-full bg-green-400" title={t('dashboard.income')} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="bg-[#0d0d14] border-cyan-500/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-cyan-400">
              {selectedDay && `${selectedDay.day} ${new Date(year, month - 1, selectedDay.day).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.dayDetails')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/10">
              <div>
                <p className="text-sm text-cyan-400 font-medium">{t('dashboard.balanceAtEndOfDay')}</p>
                <p className="text-3xl font-bold text-cyan-300 neon-text-cyan">
                  {formatCurrency(selectedDay?.balance || 0)}
                </p>
              </div>
            </div>

            {selectedDay?.incomeTransactions && selectedDay.incomeTransactions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3">{t('dashboard.income')}</h3>
                <div className="space-y-2">
                  {selectedDay.incomeTransactions.map((inc, index) => (
                    <Card key={index} className="neon-card border-green-500/30">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-400 font-medium">{inc.name}</p>
                            <p className="text-xs text-green-500/60">{inc.notes}</p>
                          </div>
                          <p className="text-lg font-bold text-green-400">
                            {formatCurrency(inc.amount)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {selectedDay?.expenseTransactions && selectedDay.expenseTransactions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-pink-400 mb-3">{t('dashboard.expenses')}</h3>
                <div className="space-y-2">
                  {selectedDay.expenseTransactions.map((exp, index) => (
                    <Card key={index} className="neon-card border-pink-500/30">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-pink-400 font-medium">{exp.name}</p>
                            <p className="text-xs text-pink-500/60">{exp.category}</p>
                          </div>
                          <p className="text-lg font-bold text-pink-400">
                            {formatCurrency(exp.amount)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
