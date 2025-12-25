'use client';

import { useEffect } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import DashboardLayout from '@/components/budget/DashboardLayout';

export default function Home() {
  const { income, expenses, importData } = useBudgetStore();

  useEffect(() => {
    // Load sample data if empty
    if (income.length === 0 && expenses.length === 0) {
      loadSampleData();
    }
  }, [income.length, expenses.length]);

  const loadSampleData = async () => {
    try {
      const response = await fetch('/api/budget?type=sample');
      const data = await response.json();
      importData(data);
    } catch (error) {
      console.error('Failed to load sample data:', error);
    }
  };

  return <DashboardLayout />;
}
