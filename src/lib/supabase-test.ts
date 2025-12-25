// Утилита для тестирования подключения к Supabase
import { supabase, isSupabaseEnabled, getCurrentUserId } from './supabase';

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  // Проверка 1: Наличие переменных окружения
  if (!isSupabaseEnabled()) {
    return {
      success: false,
      message: '❌ Supabase не настроен. Проверьте .env.local файл.',
      details: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    };
  }

  if (!supabase) {
    return {
      success: false,
      message: '❌ Клиент Supabase не создан.',
    };
  }

  // Проверка 2: Подключение к Supabase
  try {
    const { data, error } = await supabase.from('income').select('count').limit(1);
    
    if (error) {
      return {
        success: false,
        message: `❌ Ошибка подключения к Supabase: ${error.message}`,
        details: {
          error: error.message,
          code: error.code,
          hint: error.hint,
        },
      };
    }

    // Проверка 3: Доступ к таблицам
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('count')
      .limit(1);

    if (expensesError) {
      return {
        success: false,
        message: `❌ Ошибка доступа к таблице expenses: ${expensesError.message}`,
        details: {
          error: expensesError.message,
        },
      };
    }

    // Проверка 4: Получение user_id
    const userId = getCurrentUserId();

    return {
      success: true,
      message: '✅ Supabase подключен корректно!',
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        userId: userId,
        tables: {
          income: 'доступна',
          expenses: 'доступна',
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `❌ Критическая ошибка: ${error.message}`,
      details: {
        error: error.message,
        stack: error.stack,
      },
    };
  }
}

// Функция для тестирования записи данных
export async function testSupabaseWrite(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  if (!isSupabaseEnabled() || !supabase) {
    return {
      success: false,
      message: '❌ Supabase не настроен.',
    };
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: '❌ Не удалось получить user_id.',
    };
  }

  try {
    // Тестовая запись в income
    const testIncome = {
      id: `test_${Date.now()}`,
      user_id: userId,
      name: 'Тестовый доход',
      amount: 1000,
      day_of_month: 1,
      frequency: 'monthly',
      received: false,
    };

    const { data, error } = await supabase.from('income').insert(testIncome).select();

    if (error) {
      return {
        success: false,
        message: `❌ Ошибка записи: ${error.message}`,
        details: { error: error.message },
      };
    }

    // Удаляем тестовую запись
    await supabase.from('income').delete().eq('id', testIncome.id);

    return {
      success: true,
      message: '✅ Запись в Supabase работает!',
      details: {
        testRecord: data,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `❌ Ошибка: ${error.message}`,
      details: { error: error.message },
    };
  }
}

