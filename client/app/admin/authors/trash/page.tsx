'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { Search, RotateCcw, ArrowLeft } from 'lucide-react';
import { getApiUrl, getImageUrl } from '@/app/admin/lib/api-config';

interface Author {
    id: number;
    fullName: string;
    email: string;
    urlTitle: string;
    slug: string;
    avatar: string;
    status: number;
    deletedAt: string;
    updatedAt: string;
}

export default function TrashPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [selectedAuthors, setSelectedAuthors] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [bulkDeleteStep, setBulkDeleteStep] = useState(1);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/login');
        } else {
            fetchTrash();
        }
    }, [router]);

    const fetchTrash = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(getApiUrl('authors/trash/all'));
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch trash');
            }

            setAuthors(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching trash');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: number) => {
        setProcessing(true);
        try {
            const response = await fetch(getApiUrl(`authors/${id}/restore`), {
                method: 'PUT',
            });
            if (!response.ok) throw new Error('Failed to restore author');
            await fetchTrash();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkRestore = async () => {
        if (selectedAuthors.length === 0) return;
        setProcessing(true);
        try {
            await Promise.all(
                selectedAuthors.map(id =>
                    fetch(getApiUrl(`authors/${id}/restore`), { method: 'PUT' })
                )
            );
            await fetchTrash();
            setSelectedAuthors([]);
            setShowRestoreConfirm(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkDeletePermanent = async () => {
        if (selectedAuthors.length === 0) return;
        setProcessing(true);
        try {
            await Promise.all(
                selectedAuthors.map(id =>
                    fetch(getApiUrl(`authors/${id}/permanent`), { method: 'DELETE' })
                )
            );
            await fetchTrash();
            setSelectedAuthors([]);
            setShowDeleteConfirm(false);
            setBulkDeleteStep(1);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleToggleAuthor = (id: number) => {
        setSelectedAuthors(prev =>
            prev.includes(id) ? prev.filter(authorId => authorId !== id) : [...prev, id]
        );
    };

    const handleToggleAll = () => {
        if (selectedAuthors.length === authors.length) {
            setSelectedAuthors([]);
        } else {
            setSelectedAuthors(authors.map(a => a.id));
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getSrc = (url: string) => {
        if (!url) return '';
        if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) {
            return url;
        }
        return getImageUrl(url);
    };

    const filteredAuthors = authors.filter(author =>
        author.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <div className="flex items-center gap-4">
                            <Button onClick={() => router.push('/admin/authors')} variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Authors Trash</h1>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {selectedAuthors.length > 0 && (
                                <>
                                    <Button
                                        onClick={() => setShowRestoreConfirm(true)}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white"
                                        disabled={processing}
                                    >
                                        Restore ({selectedAuthors.length})
                                    </Button>
                                    <Button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                                        disabled={processing}
                                    >
                                        Delete Forever ({selectedAuthors.length})
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                                <div className="h-5 w-5 rounded-full border-2 border-orange-400 flex items-center justify-center">
                                    <span className="text-orange-400 text-xs">i</span>
                                </div>
                                <span>{loading ? 'Loading...' : `${authors.length} Deleted Authors`}</span>
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

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-left w-12">
                                        <input
                                            type="checkbox"
                                            checked={authors.length > 0 && selectedAuthors.length === authors.length}
                                            onChange={handleToggleAll}
                                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">S.N</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Image</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Deleted At</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">Loading trash...</td></tr>
                                ) : filteredAuthors.length === 0 ? (
                                    <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">Trash is empty</td></tr>
                                ) : (
                                    filteredAuthors.map((author, index) => (
                                        <tr key={author.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAuthors.includes(author.id)}
                                                    onChange={() => handleToggleAuthor(author.id)}
                                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                {author.avatar ? (
                                                    <img
                                                        src={getSrc(author.avatar)}
                                                        alt={author.fullName}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm font-medium">
                                                            {author.fullName.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {author.fullName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {author.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Deleted
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{formatDate(author.deletedAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleRestore(author.id)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                                    >
                                                        <RotateCcw className="h-4 w-4 mr-1" />
                                                        Restore
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

                {/* Restore Confirmation */}
                {showRestoreConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Restore</h3>
                            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">Restore {selectedAuthors.length} author(s)? They will appear in the main list again.</p>
                            <div className="flex gap-3 justify-end">
                                <Button onClick={() => setShowRestoreConfirm(false)} variant="outline">Cancel</Button>
                                <Button onClick={handleBulkRestore} className="bg-green-600 hover:bg-green-700 text-white">Restore</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {bulkDeleteStep === 1 ? 'Confirm Permanent Delete' : 'Are you absolutely sure?'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">
                                {bulkDeleteStep === 1
                                    ? `Permanently delete ${selectedAuthors.length} author(s)? This action CANNOT be undone.`
                                    : 'This will permanently remove these authors and all their images. There is no going back. Confirm?'}
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button onClick={() => { setShowDeleteConfirm(false); setBulkDeleteStep(1); }} variant="outline">Cancel</Button>
                                {bulkDeleteStep === 1 ? (
                                    <Button onClick={() => setBulkDeleteStep(2)} className="bg-red-600 hover:bg-red-700 text-white">Delete Forever</Button>
                                ) : (
                                    <Button onClick={handleBulkDeletePermanent} className="bg-red-900 hover:bg-red-950 text-white">Yes, Delete Everything</Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}