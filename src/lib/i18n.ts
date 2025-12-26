// Simple i18n system for translations

export type Language = 'ru' | 'en';

let currentLanguage: Language = 'en'; // Default to English

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem('app_language', lang);
  }
}

export function getLanguage(): Language {
  // Safe for SSR: check window before accessing localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app_language') as Language;
    if (saved === 'ru' || saved === 'en') {
      return saved;
    }
  }
  // Return default language during SSR
  return currentLanguage;
}

// Initialize language from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('app_language') as Language;
  if (saved === 'ru' || saved === 'en') {
    currentLanguage = saved;
  }
}

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.income': 'Income',
    'nav.expenses': 'Expenses',
    'nav.analytics': 'Analytics',
    
    // Common
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.sync': 'Manual Sync',
    'common.account': 'Account',
    'common.signIn': 'Sign In',
    'common.signOut': 'Sign Out',
    'common.data': 'Data',
    'common.user': 'User',
    
    // Dashboard
    'dashboard.title': 'Home Accounting',
    'dashboard.subtitle': 'Finance Management',
    'dashboard.balance': 'Balance',
    'dashboard.income': 'Income',
    'dashboard.expenses': 'Expenses',
    'dashboard.savings': 'Savings',
    'dashboard.cashGaps': 'cash gaps',
    
    // Income
    'income.title': 'Income',
    'income.subtitle': 'Manage income sources',
    'income.add': 'Add Income',
    'income.edit': 'Edit Income',
    'income.name': 'Name',
    'income.amount': 'Amount (₽)',
    'income.dayOfMonth': 'Day of month',
    'income.frequency': 'Frequency',
    'income.frequency.monthly': 'Monthly',
    'income.frequency.weekly': 'Weekly',
    'income.frequency.biweekly': 'Bi-weekly',
    'income.frequency.once': 'One-time',
    'income.received': 'Received',
    'income.pending': 'Pending',
    'income.notes': 'Notes',
    'income.filter.all': 'All',
    'income.filter.received': 'Received',
    'income.filter.unreceived': 'Pending',
    'income.empty': 'No income added',
    'income.isTransfer': 'This is a transfer',
    'income.transferType': 'Transfer type',
    'income.transfer.received': 'Received transfer',
    'income.transfer.sent': 'Sent transfer',
    
    // Expenses
    'expenses.title': 'Expenses',
    'expenses.subtitle': 'Manage required and optional payments',
    'expenses.add': 'Add Expense',
    'expenses.edit': 'Edit Expense',
    'expenses.category': 'Category',
    'expenses.name': 'Name',
    'expenses.amount': 'Amount (₽)',
    'expenses.dayOfMonth': 'Payment day',
    'expenses.isRequired': 'Required payment',
    'expenses.isPaid': 'Paid',
    'expenses.notPaid': 'Not paid',
    'expenses.required': 'Required',
    'expenses.optional': 'Optional',
    'expenses.filter.all': 'All',
    'expenses.filter.required': 'Required',
    'expenses.filter.optional': 'Optional',
    'expenses.empty': 'No expenses added',
    'expenses.totalRequired': 'Required payments',
    'expenses.totalOptional': 'Optional expenses',
    'expenses.categoryFilter': 'Filter by category:',
    
    // Categories
    'category.credits': '💳 Credits',
    'category.utilities': '💧 Utilities',
    'category.home': '🏠 Home expenses',
    'category.health': '💊 Health',
    'category.car': '🚗 Car',
    'category.other': '📦 Other',
    'category.transfers': '↔️ Transfers',
    
    // Analytics
    'analytics.title': 'Analytics',
    'analytics.totalIncome': 'Total Income',
    'analytics.totalExpenses': 'Total Expenses',
    'analytics.finalBalance': 'Final Balance',
    'analytics.savingsRate': 'Savings Rate',
    'analytics.categoryDistribution': 'Expense Distribution by Category',
    'analytics.balanceDynamics': 'Balance Dynamics for the Month',
    'analytics.categoryStats': 'Statistics by Category',
    
    // Auth
    'auth.signIn': 'Sign In or Register',
    'auth.description': 'Use your account to sync data',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signInEmail': 'Sign In with Email',
    'auth.signUp': 'No account? Register',
    'auth.or': 'Or',
    'auth.signInGoogle': 'Sign In with Google',
    'auth.signInGitHub': 'Sign In with GitHub',
    'auth.signInVK': 'Sign In with VK',
    'auth.signInTelegram': 'Sign In with Telegram',
    
    // Messages
    'message.syncSuccess': '✅ Sync completed!',
    'message.syncError': '❌ Sync error',
    'message.dataExported': 'Data exported successfully',
    'message.dataImported': 'Data imported successfully',
    'message.deleteConfirm': 'Delete this item?',
  },
  ru: {
    // Navigation
    'nav.dashboard': 'Обзор',
    'nav.income': 'Доходы',
    'nav.expenses': 'Расходы',
    'nav.analytics': 'Аналитика',
    
    // Common
    'common.add': 'Добавить',
    'common.edit': 'Редактировать',
    'common.delete': 'Удалить',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.close': 'Закрыть',
    'common.export': 'Экспорт',
    'common.import': 'Импорт',
    'common.sync': 'Ручная синхронизация',
    'common.account': 'Аккаунт',
    'common.signIn': 'Войти',
    'common.signOut': 'Выйти',
    'common.data': 'Данные',
    'common.user': 'Пользователь',
    
    // Dashboard
    'dashboard.title': 'Домашняя бухгалтерия',
    'dashboard.subtitle': 'Управление финансами',
    'dashboard.balance': 'Баланс',
    'dashboard.income': 'Доходы',
    'dashboard.expenses': 'Расходы',
    'dashboard.savings': 'Сбережения',
    'dashboard.cashGaps': 'кассовых разрывов',
    
    // Income
    'income.title': 'Доходы',
    'income.subtitle': 'Управление источниками дохода',
    'income.add': 'Добавить доход',
    'income.edit': 'Редактировать доход',
    'income.name': 'Название',
    'income.amount': 'Сумма (₽)',
    'income.dayOfMonth': 'День месяца',
    'income.frequency': 'Периодичность',
    'income.frequency.monthly': 'Ежемесячно',
    'income.frequency.weekly': 'Еженедельно',
    'income.frequency.biweekly': 'Раз в две недели',
    'income.frequency.once': 'Разово',
    'income.received': 'Получено',
    'income.pending': 'Ожидается',
    'income.notes': 'Примечание',
    'income.filter.all': 'Все',
    'income.filter.received': 'Полученные',
    'income.filter.unreceived': 'Ожидающиеся',
    'income.empty': 'Нет добавленных доходов',
    'income.isTransfer': 'Это перевод',
    'income.transferType': 'Тип перевода',
    'income.transfer.received': 'Полученный перевод',
    'income.transfer.sent': 'Отправленный перевод',
    
    // Expenses
    'expenses.title': 'Расходы',
    'expenses.subtitle': 'Управление обязательными и необязательными платежами',
    'expenses.add': 'Добавить расход',
    'expenses.edit': 'Редактировать расход',
    'expenses.category': 'Категория',
    'expenses.name': 'Название',
    'expenses.amount': 'Сумма (₽)',
    'expenses.dayOfMonth': 'День платежа',
    'expenses.isRequired': 'Обязательный платеж',
    'expenses.isPaid': 'Оплачено',
    'expenses.notPaid': 'Не оплачено',
    'expenses.required': 'Обязательно',
    'expenses.optional': 'Необязательно',
    'expenses.filter.all': 'Все',
    'expenses.filter.required': 'Обязательные',
    'expenses.filter.optional': 'Необязательные',
    'expenses.empty': 'Нет добавленных расходов',
    'expenses.totalRequired': 'Обязательные платежи',
    'expenses.totalOptional': 'Необязательные расходы',
    'expenses.categoryFilter': 'Фильтр по категориям:',
    
    // Categories
    'category.credits': '💳 Кредиты',
    'category.utilities': '💧 Коммунальные',
    'category.home': '🏠 Домашние траты',
    'category.health': '💊 Здоровье',
    'category.car': '🚗 Автомобиль',
    'category.other': '📦 Прочее',
    'category.transfers': '↔️ Переводы',
    
    // Analytics
    'analytics.title': 'Аналитика',
    'analytics.totalIncome': 'Всего доходов',
    'analytics.totalExpenses': 'Всего расходов',
    'analytics.finalBalance': 'Итоговый баланс',
    'analytics.savingsRate': 'Сбережения',
    'analytics.categoryDistribution': 'Распределение расходов по категориям',
    'analytics.balanceDynamics': 'Динамика баланса за месяц',
    'analytics.categoryStats': 'Статистика по категориям',
    
    // Auth
    'auth.signIn': 'Войти или Зарегистрироваться',
    'auth.description': 'Используйте свой аккаунт для синхронизации данных',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.signInEmail': 'Войти с Email',
    'auth.signUp': 'Нет аккаунта? Зарегистрироваться',
    'auth.or': 'Или',
    'auth.signInGoogle': 'Войти через Google',
    'auth.signInGitHub': 'Войти через GitHub',
    'auth.signInVK': 'Войти через VK',
    'auth.signInTelegram': 'Войти через Telegram',
    
    // Messages
    'message.syncSuccess': '✅ Синхронизация завершена!',
    'message.syncError': '❌ Ошибка синхронизации',
    'message.dataExported': 'Данные успешно экспортированы',
    'message.dataImported': 'Данные успешно импортированы',
    'message.deleteConfirm': 'Удалить этот элемент?',
    'message.signOutError': 'Ошибка при выходе',
  },
};

export function t(key: string): string {
  // Safe for SSR: getLanguage() already handles typeof window check
  const lang = getLanguage();
  return translations[lang]?.[key] || translations['en']?.[key] || key;
}

// Hook for React components
// This hook should only be used in client components ('use client')
// Import React in the component file where you use this hook
export function useTranslation() {
  // This hook requires React to be imported in the component
  // For now, return a simple implementation that works during SSR
  // Components should import React and use useState directly if needed
  return {
    t,
    language: getLanguage(),
    setLanguage: (newLang: Language) => {
      setLanguage(newLang);
    },
  };
}

