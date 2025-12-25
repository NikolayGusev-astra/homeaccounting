import { NextResponse } from 'next/server';
import type { BudgetData } from '@/types/budget';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data: BudgetData = body;

    // Add export date
    const exportData = {
      ...data,
      exportDate: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: exportData,
      filename: `budget-${data.currentMonth}.json`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
