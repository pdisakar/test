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
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <p className="text-gray-600">Welcome to your dashboard. This area is currently empty.</p>
      </div>
    </MainLayout>
  );
}
