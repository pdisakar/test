'use client';

import { MainLayout } from '@/components/MainLayout';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check for authentication token
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <MainLayout>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-800">
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Welcome to your dashboard. This area is currently empty.</p>
      </div>
    </MainLayout>
  );
}
