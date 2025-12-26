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
  RefreshCw,
  LogIn,
  LogOut,
  Languages,
} from 'lucide-react';
import DashboardView from './views/DashboardView';
import IncomeView from './views/IncomeView';
import ExpensesView from './views/ExpensesView';
import AnalyticsView from './views/AnalyticsView';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { QuickAddDialog } from './QuickAddDialog';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase';
import { t, setLanguage, getLanguage } from '@/lib/i18n';
import { useTranslation } from '@/lib/useTranslation';

export default function DashboardLayout() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const { currentMonth, setCurrentMonth, getMonthlyForecast, settings, updateSettings } = useBudgetStore();
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);
  const { language, setLanguage: changeLanguage } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Long press handler для мобильных устройств
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = React.useRef(false);

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

  // Move navigation creation to useMemo to avoid SSR issues
  // t() is now safe for SSR (returns default 'en' language during server-side rendering)
  // Include language in dependencies to update navigation when language changes
  const navigation = React.useMemo(() => {
    return [
      { id: 'dashboard' as ViewMode, label: t('nav.dashboard'), icon: LayoutDashboard },
      { id: 'income' as ViewMode, label: t('nav.income'), icon: TrendingUp },
      { id: 'expenses' as ViewMode, label: t('nav.expenses'), icon: CreditCard },
      { id: 'analytics' as ViewMode, label: t('nav.analytics'), icon: BarChart3 },
    ];
  }, [language]);

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
        alert(t('message.dataImported'));
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert(t('message.importError'));
      }
    };
    reader.readAsText(file);
  };

  const handleManualSync = async () => {
    const { syncToSupabase, syncFromSupabase, isSyncing } = useBudgetStore.getState();
    
    if (isSyncing) {
      alert(t('message.syncInProgress'));
      return;
    }

    try {
      // Сначала загружаем данные из Supabase (чтобы получить последние изменения с других устройств)
      await syncFromSupabase();
      
      // Затем отправляем текущие данные в Supabase (чтобы сохранить локальные изменения)
      await syncToSupabase();
      
      const { income: updatedIncome, expenses: updatedExpenses } = useBudgetStore.getState();
      alert(`${t('message.syncSuccess')}\n${t('nav.income')}: ${updatedIncome.length}\n${t('nav.expenses')}: ${updatedExpenses.length}`);
      console.log('Manual sync completed successfully');
    } catch (error) {
      console.error('Sync error:', error);
      alert(`${t('message.syncError')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
      alert(t('message.syncError'));
    } else {
      setUser(null);
    }
  };

  // Initialize dark theme
  useEffect(() => {
    console.log('useEffect executed, adding dark class to document');
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('dark');
      
      // Listen for language changes
      const handleLanguageChange = () => {
        setForceUpdate(prev => prev + 1);
      };
      window.addEventListener('languagechange', handleLanguageChange);
      return () => window.removeEventListener('languagechange', handleLanguageChange);
    }
  }, []);

  // Проверка авторизации
  useEffect(() => {
    if (!supabase) return;

    // Проверка текущей сессии
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Подписка на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        setAuthDialogOpen(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Обработчики long press для мобильных устройств
  const handleTouchStart = (e: React.TouchEvent) => {
    // Только на мобильных устройствах (ширина экрана < 1024px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      isLongPressRef.current = false;
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        setQuickAddDialogOpen(true);
        // Вибрация (если поддерживается)
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 500); // 500ms для long press
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // Предотвращаем обычный клик, если был long press
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressRef.current = false;
    }
  };

  const handleTouchMove = () => {
    // Отменяем long press при движении
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
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
                settings={settings}
                handleManualSync={handleManualSync}
                user={user}
                onSignIn={() => setAuthDialogOpen(true)}
                onSignOut={handleSignOut}
                mobile
                language={language}
                changeLanguage={changeLanguage}
              />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold text-cyan-400 neon-text-cyan">
            💰 {t('dashboard.title')}
          </h1>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex flex-1 pt-16 lg:pt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-[250px] min-h-screen bg-[#0d0d14] border-r border-cyan-500/20">
          <div className="p-6 border-b border-cyan-500/20">
            <h1 className="text-2xl font-bold text-cyan-400 neon-text-cyan">
              💰 {t('dashboard.title')}
            </h1>
            <p className="text-xs text-cyan-500/60 mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <NavContent
            currentView={currentView}
            setCurrentView={setCurrentView}
            navigation={navigation}
            handleExport={handleExport}
            handleImport={handleImport}
            settings={settings}
            handleManualSync={handleManualSync}
            user={user}
            onSignIn={() => setAuthDialogOpen(true)}
            onSignOut={handleSignOut}
            language={language}
            changeLanguage={changeLanguage}
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
          <div 
            className="p-6 flex-1 lg:select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            style={{ touchAction: 'manipulation' }}
          >
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

      {/* Auth Dialog */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      
      {/* Quick Add Dialog (long press на мобильных) */}
      <QuickAddDialog open={quickAddDialogOpen} onOpenChange={setQuickAddDialogOpen} />
    </div>
  );
}

interface NavContentProps {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  navigation: Array<{ id: ViewMode; label: string; icon: any }>;
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleManualSync?: () => void;
  settings: any;
  user?: any;
  onSignIn?: () => void;
  onSignOut?: () => void;
  mobile?: boolean;
  language?: 'ru' | 'en';
  changeLanguage?: (lang: 'ru' | 'en') => void;
}

function NavContent({
  currentView,
  setCurrentView,
  navigation,
  handleExport,
  handleImport,
  handleManualSync,
  settings,
  user,
  onSignIn,
  onSignOut,
  mobile = false,
  language: languageProp,
  changeLanguage: changeLanguageProp
}: NavContentProps) {
  // Use useTranslation hook if language is not provided as prop
  const translationHook = useTranslation();
  const language = languageProp || translationHook.language;
  const changeLanguage = changeLanguageProp || translationHook.setLanguage;
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
            {t('common.data')}
          </p>
          <Button
            variant="ghost"
            onClick={handleExport}
            className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <label className="w-full">
            <Button
              variant="ghost"
              className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
              asChild
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {t('common.import')}
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          {handleManualSync && (
            <Button
              variant="ghost"
              onClick={handleManualSync}
              className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.sync')}
            </Button>
          )}
        </div>
      )}

      {/* Language Switcher - Desktop */}
      {!mobile && (
        <div className="space-y-2 pt-4 border-t border-cyan-500/20">
          <p className="text-xs text-cyan-500/40 px-4 uppercase tracking-wider">
            {t('common.language')}
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              const newLang = language === 'ru' ? 'en' : 'ru';
              changeLanguage(newLang);
            }}
            className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            <Languages className="h-4 w-4 mr-2" />
            <span className="mr-2">{language === 'ru' ? '🇷🇺' : '🇬🇧'}</span>
            {language === 'ru' ? t('common.language.en') : t('common.language.ru')}
          </Button>
        </div>
      )}

      {/* Auth Section */}
      {!mobile && (
        <div className="space-y-2 pt-4 border-t border-cyan-500/20">
          <p className="text-xs text-cyan-500/40 px-4 uppercase tracking-wider">
            {t('common.account')}
          </p>
          {user ? (
            <>
              <div className="px-4 py-2 text-sm text-cyan-400">
                {user.email || t('common.user')}
              </div>
              {onSignOut && (
                <Button
                  variant="ghost"
                  onClick={onSignOut}
                  className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('common.signOut')}
                </Button>
              )}
            </>
          ) : (
            onSignIn && (
              <Button
                variant="ghost"
                onClick={onSignIn}
                className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t('common.signIn')}
              </Button>
            )
          )}
        </div>
      )}

      {/* Mobile Language Switcher */}
      {mobile && (
        <div className="pt-4 border-t border-cyan-500/20">
          <p className="text-xs text-cyan-500/40 px-4 uppercase tracking-wider mb-2">
            {t('common.language')}
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              const newLang = language === 'ru' ? 'en' : 'ru';
              changeLanguage(newLang);
            }}
            className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            <Languages className="h-4 w-4 mr-2" />
            <span className="mr-2">{language === 'ru' ? '🇷🇺' : '🇬🇧'}</span>
            {language === 'ru' ? t('common.language.en') : t('common.language.ru')}
          </Button>
        </div>
      )}

      {/* Mobile Data Management */}
      {mobile && (
        <div className="space-y-2 pt-4 border-t border-cyan-500/20">
          <p className="text-xs text-cyan-500/40 px-4 uppercase tracking-wider">
            {t('common.data')}
          </p>
          <Button
            variant="ghost"
            onClick={handleExport}
            className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <label className="w-full">
            <Button
              variant="ghost"
              className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
              asChild
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {t('common.import')}
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          {handleManualSync && (
            <Button
              variant="ghost"
              onClick={handleManualSync}
              className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.sync')}
            </Button>
          )}
        </div>
      )}

      {/* Mobile Auth Section */}
      {mobile && (
        <div className="space-y-2 pt-4 border-t border-cyan-500/20">
          <p className="text-xs text-cyan-500/40 px-4 uppercase tracking-wider">
            {t('common.account')}
          </p>
          {user ? (
            <>
              <div className="px-4 py-2 text-sm text-cyan-400">
                {user.email || t('common.user')}
              </div>
              {onSignOut && (
                <Button
                  variant="ghost"
                  onClick={onSignOut}
                  className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('common.signOut')}
                </Button>
              )}
            </>
          ) : (
            onSignIn && (
              <Button
                variant="ghost"
                onClick={onSignIn}
                className="w-full justify-start text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/10"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t('common.signIn')}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
