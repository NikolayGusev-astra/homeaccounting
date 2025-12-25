'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import type { ViewMode } from '@/types/budget';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { getMonthOptions, formatCurrency } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  BarChart3,
  Menu,
  Download,
  Upload,
  Moon,
  Sun,
  Database,
} from 'lucide-react';
import DashboardView from './views/DashboardView';
import IncomeView from './views/IncomeView';
import ExpensesView from './views/ExpensesView';
import AnalyticsView from './views/AnalyticsView';
import { testSupabaseConnection, testSupabaseWrite } from '@/lib/supabase-test';

export default function DashboardLayout() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const { currentMonth, setCurrentMonth, getMonthlyForecast, settings, updateSettings } = useBudgetStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const forecast = getMonthlyForecast(
    parseInt(currentMonth.split('-')[0]),
    parseInt(currentMonth.split('-')[1])
  );

  const monthOptions = getMonthOptions();

  const navigation = [
    { id: 'dashboard' as ViewMode, label: 'Обзор', icon: LayoutDashboard },
    { id: 'income' as ViewMode, label: 'Доходы', icon: TrendingUp },
    { id: 'expenses' as ViewMode, label: 'Расходы', icon: CreditCard },
    { id: 'analytics' as ViewMode, label: 'Аналитика', icon: BarChart3 },
  ];

  const handleExport = () => {
    console.log('Export button clicked');
    const { exportData } = useBudgetStore.getState();
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-${currentMonth}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('Import file selected:', file);

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      console.log('File read complete, parsing JSON...');
      try {
        const data = JSON.parse(event.target?.result as string);
        console.log('Data parsed successfully:', data);
        useBudgetStore.getState().importData(data);
        alert('Данные успешно импортированы!');
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Ошибка при импорте данных');
      }
    };
    reader.readAsText(file);
  };

  const handleTestSupabase = async () => {
    const result = await testSupabaseConnection();
    alert(result.message);
    console.log('Результат проверки Supabase:', result);
    
    if (result.success) {
      // Дополнительная проверка записи
      const writeResult = await testSupabaseWrite();
      alert(writeResult.message);
      console.log('Результат проверки записи:', writeResult);
    }
  };

  const toggleTheme = () => {
    console.log('Theme toggle clicked, current theme:', settings.theme);
    const newTheme = settings.theme === 'dark-neon' ? 'light' : 'dark-neon';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark-neon');
  };

  // Initialize dark theme
  useEffect(() => {
    console.log('useEffect executed, adding dark class to document');
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const renderView = () => {
    console.log('renderView called, currentView:', currentView);
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'income':
        return <IncomeView />;
      case 'expenses':
        return <ExpensesView />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return <DashboardView />;
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex flex-col dark bg-[#0a0a0f] neon-grid-bg">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-cyan-500/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-cyan-400">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-[#0a0a0f] border-cyan-500/20">
              <NavContent
                currentView={currentView}
                setCurrentView={setCurrentView}
                navigation={navigation}
                handleExport={handleExport}
                handleImport={handleImport}
                toggleTheme={toggleTheme}
                settings={settings}
                mobile
              />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold text-cyan-400 neon-text-cyan">
            💰 Бухгалтерия
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-cyan-400"
          >
            {settings.theme === 'dark-neon' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex flex-1 pt-16 lg:pt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-[250px] min-h-screen bg-[#0d0d14] border-r border-cyan-500/20">
          <div className="p-6 border-b border-cyan-500/20">
            <h1 className="text-2xl font-bold text-cyan-400 neon-text-cyan">
              💰 Бухгалтерия
            </h1>
            <p className="text-xs text-cyan-500/60 mt-1">
              Управление финансами
            </p>
          </div>

          <NavContent
            currentView={currentView}
            setCurrentView={setCurrentView}
            navigation={navigation}
            handleExport={handleExport}
            handleImport={handleImport}
            toggleTheme={toggleTheme}
            settings={settings}
            handleTestSupabase={handleTestSupabase}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-sm border-b border-cyan-500/20 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-white">
                  {navigation.find(nav => nav.id === currentView)?.label}
                </h2>
                <Select value={currentMonth} onValueChange={setCurrentMonth}>
                  <SelectTrigger className="w-[200px] bg-[#0d0d14] border-cyan-500/30 text-cyan-400 focus:border-cyan-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d0d14] border-cyan-500/30">
                    {monthOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-cyan-400 focus:bg-cyan-500/10"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-cyan-500/60">Баланс</p>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      forecast.endingBalance >= 0 ? "text-green-400 neon-text-green" : "text-red-400"
                    )}
                  >
                    {formatCurrency(forecast.endingBalance)}
                  </p>
                </div>
                {forecast.cashGaps.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="cash-gap-indicator text-white border-none"
                  >
                    ⚠️ {forecast.cashGaps.length} разрывов
                  </Badge>
                )}
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-6 flex-1">
            {renderView()}
          </div>

          {/* Footer */}
          <footer className="border-t border-cyan-500/20 p-6 text-center">
            <p className="text-xs text-cyan-500/40">
              Домашняя бухгалтерия с прогнозированием кассовых разрывов
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

interface NavContentProps {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  navigation: Array<{ id: ViewMode; label: string; icon: any }>;
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleTheme: () => void;
  handleTestSupabase?: () => void;
  settings: any;
  mobile?: boolean;
}

function NavContent({
  currentView,
  setCurrentView,
  navigation,
  handleExport,
  handleImport,
  toggleTheme,
  handleTestSupabase,
  settings,
  mobile = false
}: NavContentProps) {
  return (
    <div className="flex-1 flex flex-col p-4 space-y-6 overflow-y-auto neon-scrollbar">
      {/* Navigation */}
      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          const handleNavClick = () => {
            console.log('Navigation clicked:', item.id);
            setCurrentView(item.id);
          };

          return (
            <button
              key={item.id}
              onClick={handleNavClick}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border border-cyan-500/50 text-cyan-400 neon-glow-cyan"
                  : "text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Data Management */}
      {!mobile && (
        <div className="space-y-2 pt-4 border-t border-cyan-500/20">
          <p className="text-xs text-cyan-500/40 px-4 uppercase tracking-wider">
            Данные
          </p>
          <Button
            variant="ghost"
            onClick={handleExport}
            className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <label className="w-full">
            <Button
              variant="ghost"
              className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
              asChild
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Импорт
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          {handleTestSupabase && (
            <Button
              variant="ghost"
              onClick={handleTestSupabase}
              className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
            >
              <Database className="h-4 w-4 mr-2" />
              Проверить Supabase
            </Button>
          )}
        </div>
      )}

      {/* Theme Toggle */}
      {!mobile && (
        <div className="pt-4 border-t border-cyan-500/20">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            {settings.theme === 'dark-neon' ? (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Светлая тема
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Тёмная тема
              </>
            )}
          </Button>
        </div>
      )}

      {/* Mobile Data Management */}
      {mobile && (
        <div className="space-y-2 pt-4 border-t border-cyan-500/20">
          <Button
            variant="ghost"
            onClick={handleExport}
            className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <label className="w-full">
            <Button
              variant="ghost"
              className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
              asChild
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Импорт
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}
