import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // This is a simple API that returns sample data
    // In production, this would connect to a database
    if (type === 'sample') {
      return NextResponse.json({
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        currentMonth: new Date().toISOString().slice(0, 7),
        income: [
          {
            id: 'inc_1',
            name: 'Зарплата',
            amount: 100000,
            dayOfMonth: 10,
            frequency: 'monthly',
            received: true,
            receivedDate: new Date().toISOString(),
            notes: 'Основной доход',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'inc_2',
            name: 'Премия',
            amount: 50000,
            dayOfMonth: 25,
            frequency: 'monthly',
            received: false,
            receivedDate: null,
            notes: 'Переменная часть',
            createdAt: new Date().toISOString(),
          },
        ],
        expenses: [
          {
            id: 'exp_1',
            category: 'кредиты',
            name: 'Кредит в Сбербанке',
            amount: 15000,
            dayOfMonth: 15,
            dueDate: null,
            isPaid: false,
            isRequired: true,
            creditDetails: {
              loanNumber: '1234567890',
              remainingBalance: 250000,
              interestRate: 12.5,
            },
            notes: 'Ежемесячный платеж',
            history: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: 'exp_2',
            category: 'коммунальные',
            subcategory: 'электро',
            name: 'Электроэнергия',
            amount: 3500,
            dayOfMonth: 20,
            dueDate: null,
            isPaid: false,
            isRequired: true,
            notes: 'Счет МОСЭНЕРГО',
            history: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: 'exp_3',
            category: 'домашние_траты',
            name: 'Продукты',
            amount: 25000,
            dayOfMonth: null,
            dueDate: null,
            isPaid: false,
            isRequired: false,
            notes: 'Ежедневный бюджет',
            history: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: 'exp_4',
            category: 'прочее',
            name: 'Подписка Яндекс.Плюс',
            amount: 249,
            dayOfMonth: 5,
            dueDate: null,
            isPaid: true,
            isRequired: false,
            notes: 'Ежемесячная подписка',
            history: [],
            createdAt: new Date().toISOString(),
          },
        ],
        settings: {
          currency: 'RUB',
          locale: 'ru-RU',
          theme: 'dark-neon',
          notifications: true,
          defaultMonth: 'current',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
