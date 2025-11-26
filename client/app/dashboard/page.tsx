'use client';

import { Sidebar } from '@/components/Sidebar';
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300">
        <div className="py-12 px-6 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <p className="text-gray-600">Welcome to your dashboard. This area is currently empty.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
