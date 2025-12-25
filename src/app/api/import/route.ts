import { NextResponse } from 'next/server';
import type { BudgetData } from '@/types/budget';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data: BudgetData = body;

    // Validate basic structure
    if (!data.version || !data.lastUpdated) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data imported successfully',
      data,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
