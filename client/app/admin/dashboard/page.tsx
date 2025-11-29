'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';

export default function DashboardPage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Packages</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">24</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Blogs</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">18</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Users</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">5</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Testimonials</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">42</div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Welcome to Admin Panel</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your travel website content from here. Use the sidebar to navigate between different sections.
        </p>
      </div>
    </MainLayout>
  );
}
