'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { Search, Edit, ChevronRight, ChevronDown } from 'lucide-react';
import { getApiUrl, getImageUrl } from '@/app/admin/lib/api-config';

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
    children?: Menu[];
}

export default function MenusPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [deleting, setDeleting] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [selectedMenus, setSelectedMenus] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        setError('');
        try {
            const response = await fetch(getApiUrl('menus'));
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch menus');
            }

            setMenus(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching menus');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id: number) => {
        router.push(`/admin/menus/edit/${id}`);
    };

    const handleConfirmDelete = async () => {
        if (selectedMenus.length === 0) return;

        setDeleting(true);
        setError('');

        try {
            const response = await fetch(getApiUrl('menus/bulk-delete'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedMenus }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete menus');
            }

            await fetchMenus();
            setSelectedMenus([]);
            setShowDeleteConfirm(false);
        } catch (err: any) {
            setError(err.message || 'An error occurred while deleting');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const toggleRow = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const handleToggleMenu = (id: number) => {
        setSelectedMenus(prev =>
            prev.includes(id)
                ? prev.filter(menuId => menuId !== id)
                : [...prev, id]
        );
    };

    const handleToggleAll = () => {
        if (selectedMenus.length === menus.length) {
            setSelectedMenus([]);
        } else {
            setSelectedMenus(menus.map(m => m.id));
        }
    };

    const handleBulkDeleteClick = () => {
        if (selectedMenus.length > 0) {
            setShowDeleteConfirm(true);
        }
    };

    const buildTree = (items: Menu[]) => {
        const itemMap = new Map<number, Menu>();
        const roots: Menu[] = [];

        const itemsWithChildren = items.map(item => ({ ...item, children: [] as Menu[] }));

        itemsWithChildren.forEach(item => {
            itemMap.set(item.id, item);
        });

        itemsWithChildren.forEach(item => {
            if (item.parentId && itemMap.has(item.parentId)) {
                const parent = itemMap.get(item.parentId)!;
                parent.children!.push(item);
            } else {
                roots.push(item);
            }
        });

        return roots;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const filteredMenus = menus.filter(menu => {
        return menu.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            menu.url?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const renderMenuRow = (menu: Menu, index: number, depth: number = 0): React.JSX.Element => {
        const hasChildren = menu.children && menu.children.length > 0;
        const isExpanded = expandedRows.has(menu.id);

        return (
            <React.Fragment key={menu.id}>
                <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${depth > 0 ? 'bg-gray-50 dark:bg-gray-950/50' : ''}`}>
                    <td className="px-6 py-4">
                        <input
                            type="checkbox"
                            checked={selectedMenus.includes(menu.id)}
                            onChange={() => handleToggleMenu(menu.id)}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                        />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {depth === 0 ? index + 1 : ''}
                    </td>
                    <td className="px-6 py-4">
                        {hasChildren && (
                            <button
                                onClick={() => toggleRow(menu.id)}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                )}
                            </button>
                        )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        <div style={{ paddingLeft: `${depth * 24}px` }} className="flex items-center gap-2">
                            {menu.title}
                            {hasChildren && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    {menu.children?.length} {menu.children?.length === 1 ? 'child' : 'children'}
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{menu.url || '-'}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${menu.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                            }`}>
                            {menu.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(menu.updatedAt)}</td>
                    <td className="px-6 py-4">
                        <Button
                            onClick={() => handleEdit(menu.id)}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:bg-gray-800"
                        >
                            <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </Button>
                    </td>
                </tr>
                {isExpanded && menu.children?.map((child, childIndex) => (
                    <React.Fragment key={child.id}>
                        {renderMenuRow(child, childIndex, depth + 1)}
                    </React.Fragment>
                ))}
            </React.Fragment>
        );
    };

    const headerMenus = buildTree(filteredMenus.filter(m => m.type === 'header'));
    const footerMenus = buildTree(filteredMenus.filter(m => m.type === 'footer'));

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Menus</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {selectedMenus.length > 0 && (
                                <Button
                                    onClick={handleBulkDeleteClick}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={deleting}
                                >
                                    Delete ({selectedMenus.length})
                                </Button>
                            )}
                            <Button
                                onClick={() => router.push('/admin/menus/trash')}
                                variant="outline"
                                className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Trash
                            </Button>
                            <Button
                                onClick={() => router.push('/admin/menus/add')}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
                            >
                                Add Menu
                            </Button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="h-5 w-5 rounded-full border-2 border-orange-400 flex items-center justify-center">
                                    <span className="text-orange-400 text-xs">i</span>
                                </div>
                                <span>{loading ? 'Loading...' : `${menus.length} Menus listed`}</span>
                            </div>
                            <div className="flex-1"></div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search:</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search..."
                                        className="pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm w-full md:w-64"
                                    />
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Header Menus Table */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Header Menus</h2>
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left w-12">
                                            <input
                                                type="checkbox"
                                                checked={menus.length > 0 && selectedMenus.length === menus.length}
                                                onChange={handleToggleAll}
                                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">S.N</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-12"></th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">URL</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Updated At</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                Loading menus...
                                            </td>
                                        </tr>
                                    ) : headerMenus.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                No header menus found
                                            </td>
                                        </tr>
                                    ) : (
                                        headerMenus.map((menu, index) => renderMenuRow(menu, index))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Menus Table */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Footer Menus</h2>
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left w-12">
                                            <input
                                                type="checkbox"
                                                checked={menus.length > 0 && selectedMenus.length === menus.length}
                                                onChange={handleToggleAll}
                                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">S.N</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-12"></th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">URL</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Updated At</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                Loading menus...
                                            </td>
                                        </tr>
                                    ) : footerMenus.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                No footer menus found
                                            </td>
                                        </tr>
                                    ) : (
                                        footerMenus.map((menu, index) => renderMenuRow(menu, index))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {`Are you sure you want to delete ${selectedMenus.length} menu${selectedMenus.length > 1 ? 's' : ''}? This action cannot be undone.`}
                            </p>
                            <div className="flex items-center gap-3 justify-end">
                                <Button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    variant="outline"
                                    className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    disabled={deleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmDelete}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}