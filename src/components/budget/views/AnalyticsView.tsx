'use client';

import React from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS = ['#FF006E', '#00D4FF', '#39FF14', '#FFFF00', '#FF1493', '#00FF41', '#FFDE00'];

export default function AnalyticsView() {
  const { currentMonth, getMonthlyForecast, getCategoryStats, expenses, income } = useBudgetStore();
  const [year, month] = currentMonth.split('-').map(Number);
  
  const forecast = getMonthlyForecast(year, month);
  const categoryStats = getCategoryStats(year, month);

  // Prepare pie chart data
  const pieData = categoryStats.map(stat => ({
    name: stat.category,
    value: stat.total,
  }));

  // Prepare balance chart data
  const balanceData = forecast.dailyBalances.map(day => ({
    day: day.day,
    balance: day.balance,
    income: day.income,
    expenses: day.expenses,
  }));

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0d0d14] border border-cyan-500/30 rounded-lg p-3">
          <p className="text-sm text-cyan-400 mb-2">{label} число</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 neon-text-cyan">
          Аналитика
        </h2>
        <p className="text-sm text-cyan-500/60 mt-1">
          Статистика и аналитика ваших финансов
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="neon-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-cyan-500/60">
              Всего доходов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-400 neon-text-green">
              {formatCurrency(forecast.totalIncome)}
            </p>
            <p className="text-xs text-cyan-500/40 mt-1">
              {income.length} источников
            </p>
          </CardContent>
        </Card>

        <Card className="neon-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-cyan-500/60">
              Всего расходов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-pink-400 neon-text-pink">
              {formatCurrency(forecast.totalExpenses)}
            </p>
            <p className="text-xs text-cyan-500/40 mt-1">
              {expenses.length} платежей
            </p>
          </CardContent>
        </Card>

        <Card className="neon-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-cyan-500/60">
              Итоговый баланс
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${forecast.endingBalance >= 0 ? 'text-green-400 neon-text-green' : 'text-red-400'}`}>
              {formatCurrency(forecast.endingBalance)}
            </p>
            <p className="text-xs text-cyan-500/40 mt-1">
              {forecast.cashGaps.length > 0 ? `${forecast.cashGaps.length} кассовых разрывов` : 'Без разрывов'}
            </p>
          </CardContent>
        </Card>

        <Card className="neon-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-cyan-500/60">
              Сбережения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${forecast.totalIncome > forecast.totalExpenses ? 'text-green-400 neon-text-green' : 'text-red-400'}`}>
              {formatCurrency(forecast.totalIncome - forecast.totalExpenses)}
            </p>
            <p className="text-xs text-cyan-500/40 mt-1">
              {((forecast.totalIncome - forecast.totalExpenses) / forecast.totalIncome * 100).toFixed(1)}% от доходов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Expense Distribution */}
        <Card className="neon-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-cyan-400">
              Распределение расходов по категориям
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-cyan-500/40">
                Нет данных для отображения
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Chart - Balance Dynamics */}
        <Card className="neon-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-cyan-400">
              Динамика баланса за месяц
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00D4FF20" />
                <XAxis
                  dataKey="day"
                  stroke="#00D4FF60"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#00D4FF60"
                  tickFormatter={(value) => `${value / 1000}k`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={customTooltip} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#00D4FF"
                  strokeWidth={2}
                  name="Баланс"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#39FF14"
                  strokeWidth={1}
                  name="Доходы"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#FF006E"
                  strokeWidth={1}
                  name="Расходы"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Statistics Table */}
      <Card className="neon-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-cyan-400">
            Статистика по категориям
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500/20">
                  <th className="text-left py-3 px-4 text-sm font-medium text-cyan-400">Категория</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cyan-400">Всего</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cyan-400">Платежей</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cyan-400">Среднее</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cyan-400">Мин</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cyan-400">Макс</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.length > 0 ? (
                  categoryStats.map((stat, index) => (
                    <tr key={stat.category} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-cyan-300">{stat.category}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-medium text-pink-400">
                        {formatCurrency(stat.total)}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-cyan-500/60">
                        {stat.count}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-cyan-400">
                        {formatCurrency(stat.average)}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-cyan-500/60">
                        {formatCurrency(stat.min)}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-cyan-400">
                        {formatCurrency(stat.max)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-cyan-500/40">
                      Нет данных для отображения
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
