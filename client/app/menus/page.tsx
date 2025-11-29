'use client';

import { MainLayout } from '@/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface Menu {
    id: number;
    title: string;
    type: string;
    parentId: number | null;
    urlSegmentType: string | null;
    urlSegmentId: number | null;
    url: string | null;
    status: number;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export default function MenusPage() {
    const router = useRouter();
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/login');
        } else {
            fetchMenus();
        }
    }, [router]);

    const fetchMenus = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/menus');
            const data = await response.json();
            setMenus(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching menus:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this menu? Child menus will also be deleted.')) return;

        try {
            await fetch(`http://localhost:3001/api/menus/${id}`, { method: 'DELETE' });
            fetchMenus();
        } catch (err) {
            console.error('Error deleting menu:', err);
        }
    };

    const getParentTitle = (parentId: number | null) => {
        if (!parentId) return '-';
        const parent = menus.find(m => m.id === parentId);
        return parent ? parent.title : '-';
    };

    const headerMenus = menus.filter(m => m.type === 'header');
    const footerMenus = menus.filter(m => m.type === 'footer');

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Menus</h1>
                        <Button onClick={() => router.push('/menus/add')} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white">
                            Add Menu
                        </Button>
                    </div>

                    {/* Header Menus */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Header Menus</h2>
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">S.N</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Parent Menu</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">URL</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {loading ? (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                                    ) : headerMenus.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No header menus found</td></tr>
                                    ) : (
                                        headerMenus.map((menu, index) => (
                                            <tr key={menu.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{menu.title}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{getParentTitle(menu.parentId)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{menu.url || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${menu.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {menu.status === 1 ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => router.push(`/menus/edit/${menu.id}`)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDelete(menu.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Menus */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Footer Menus</h2>
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">S.N</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Parent Menu</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">URL</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {loading ? (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                                    ) : footerMenus.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No footer menus found</td></tr>
                                    ) : (
                                        footerMenus.map((menu, index) => (
                                            <tr key={menu.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{menu.title}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{getParentTitle(menu.parentId)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{menu.url || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${menu.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {menu.status === 1 ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => router.push(`/menus/edit/${menu.id}`)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDelete(menu.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
