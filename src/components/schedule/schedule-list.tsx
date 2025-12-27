import React, { useState } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';

export default function ScheduleList() {
  const { schedules, loadSchedules, updateSchedule, deleteSchedule } = useScheduleStore();

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white dark:text-gray-100">
          Мои расписания
        </h2>
        
        {schedules.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-500 text-center py-8">
            У вас пока нет расписаний. Нажмите "Добавить", чтобы создать первое расписание.
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div 
                key={schedule.id}
                className="bg-gray-800/50 dark:bg-gray-900/50 border border-gray-700 dark:border-gray-600 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        schedule.direction === 'income' 
                          ? 'bg-green-500 dark:bg-green-600' 
                          : 'bg-red-500 dark:bg-red-600'
                      }`}></span>
                      <div>
                        <p className="text-lg font-semibold text-white dark:text-gray-100">
                          {schedule.name}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          {schedule.kind === 'salary' ? 'Зарплата' : 
                           schedule.kind === 'rent' ? 'Аренда' : 
                           schedule.kind === 'subscription' ? 'Подписка' : 
                           schedule.kind === 'loan' ? 'Кредит' : 
                           schedule.kind === 'custom' ? 'Разное' : 
                           'Расход'}
                        </p>
                      </div>
                    </span>
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {schedule.start_date}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        schedule.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-800' 
                          : schedule.status === 'paused' 
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-800' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-800'
                      }`}>
                        {schedule.status === 'active' ? 'Активно' : 
                         schedule.status === 'paused' ? 'Пауза' : 
                         schedule.status === 'cancelled' ? 'Отменено' : 'Неактивно'}
                      </span>
                      <button
                        onClick={() => updateSchedule(schedule.id, { status: schedule.status === 'active' ? 'paused' : 'active' })}
                        className={`ml-2 px-3 py-1 rounded text-sm ${
                          schedule.status === 'active' 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white dark:bg-gray-800 dark:text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:text-white'
                        }`}
                      >
                        {schedule.status === 'active' ? 'Пауза' : 'Возобновить'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700 dark:border-gray-600">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Следующий платёж:
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    {getScheduleNextPayment(schedule.start_date, schedule.recurrence_rule)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => loadSchedules()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>
  );
}

// Helper function to get next payment date based on recurrence rule
function getScheduleNextPayment(startDate: string, recurrenceRule: string): string {
  const start = new Date(startDate);
  
  if (recurrenceRule.includes('MONTHLY')) {
    // Next month same day
    const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
    return nextMonth.toLocaleDateString('ru-RU');
  } else if (recurrenceRule.includes('WEEKLY')) {
    // Next week
    const nextWeek = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    return nextWeek.toLocaleDateString('ru-RU');
  } else {
    // Default to monthly
    const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
    return nextMonth.toLocaleDateString('ru-RU');
  }
}
