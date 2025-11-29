'use client';

import { MainLayout } from '@/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, ArrowLeft } from 'lucide-react';

interface Package {
    id: number;
    title: string;
    slug: string;
    deletedAt: string;
}

export default function TrashPackagesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [processing, setProcessing] = useState(false);
    const [selectedPackages, setSelectedPackages] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [bulkDeleteStep, setBulkDeleteStep] = useState(1);

    useEffect(() => {
        fetchTrashPackages();
    }, []);

    const fetchTrashPackages = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:3001/api/packages/trash/all');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch trash packages');
            }

            if (Array.isArray(data)) {
                setPackages(data);
            } else {
                setPackages([]);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching trash packages');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: number) => {
        if (!confirm('Are you sure you want to restore this package?')) return;

        setProcessing(true);
        try {
            const res = await fetch(`http://localhost:3001/api/packages/${id}/restore`, {
                method: 'PUT'
            });

            if (res.ok) {
                await fetchTrashPackages();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to restore package');
            }
        } catch (err) {
            console.error('Error restoring package:', err);
            alert('Failed to restore package');
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkDeletePermanent = async () => {
        if (selectedPackages.length === 0) return;

        setProcessing(true);
        setError('');

        try {
            await Promise.all(
                selectedPackages.map(id =>
                    fetch(`http://localhost:3001/api/packages/${id}/permanent`, {
                        method: 'DELETE',
                    })
                )
            );

            await fetchTrashPackages();
            setSelectedPackages([]);
            setShowDeleteConfirm(false);
            setBulkDeleteStep(1);
        } catch (err: any) {
            setError(err.message || 'An error occurred while deleting permanently');
        } finally {
            setProcessing(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleTogglePackage = (id: number) => {
        setSelectedPackages(prev =>
            prev.includes(id)
                ? prev.filter(packageId => packageId !== id)
                : [...prev, id]
        );
    };

    const handleToggleAll = () => {
        if (selectedPackages.length === filteredPackages.length) {
            setSelectedPackages([]);
        } else {
            setSelectedPackages(filteredPackages.map(p => p.id));
        }
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

    // Filter packages
    const filteredPackages = packages.filter(pkg => {
        return pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={() => router.push('/packages')}
                                variant="ghost"
                                className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-full"
                            >
                                <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400 dark:text-gray-500" />
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trash Packages</h1>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {selectedPackages.length > 0 && (
                                <Button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={processing}
                                >
                                    Delete Permanently ({selectedPackages.length})
                                </Button>
                            )}
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
                            {/* Info Message */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                                <div className="h-5 w-5 rounded-full border-2 border-orange-400 flex items-center justify-center">
                                    <span className="text-orange-400 text-xs">i</span>
                                </div>
                                <span>{loading ? 'Loading...' : `${packages.length} Deleted Packages`}</span>
                            </div>

                            {/* Spacer */}
                            <div className="flex-1"></div>

                            {/* Search */}
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
                                            checked={filteredPackages.length > 0 && selectedPackages.length === filteredPackages.length}
                                            onChange={handleToggleAll}
                                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">S.N</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Deleted At</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                            Loading trash...
                                        </td>
                                    </tr>
                                ) : filteredPackages.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                            No deleted packages found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPackages.map((pkg, index) => (
                                        <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPackages.includes(pkg.id)}
                                                    onChange={() => handleTogglePackage(pkg.id)}
                                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {pkg.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Deleted
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{formatDate(pkg.deletedAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => handleRestore(pkg.id)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                                        title="Restore"
                                                        disabled={processing}
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

                {/* Bulk Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {bulkDeleteStep === 1 ? 'Confirm Permanent Delete' : 'Are you absolutely sure?'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">
                                {bulkDeleteStep === 1
                                    ? `Permanently delete ${selectedPackages.length} package(s)? This action CANNOT be undone.`
                                    : 'This will permanently remove these packages and all their images. There is no going back. Confirm?'}
                            </p>
                            <div className="flex items-center gap-3 justify-end">
                                <Button
                                    onClick={() => { setShowDeleteConfirm(false); setBulkDeleteStep(1); }}
                                    variant="outline"
                                    className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                {bulkDeleteStep === 1 ? (
                                    <Button
                                        onClick={() => setBulkDeleteStep(2)}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                                        disabled={processing}
                                    >
                                        Delete Forever
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleBulkDeletePermanent}
                                        className="px-6 py-2 bg-red-900 hover:bg-red-950 text-white"
                                        disabled={processing}
                                    >
                                        {processing ? 'Deleting...' : 'Yes, Delete Everything'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
