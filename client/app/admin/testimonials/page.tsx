'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { Search, Edit } from 'lucide-react';

interface Testimonial {
    id: number;
    reviewTitle: string;
    urlTitle: string;
    slug: string;
    fullName: string;
    address: string;
    packageId: number | null;
    teamId: number | null;
    date: string;
    credit: string;
    rating: number;
    status: number;
    isFeatured: number;
    description: string;
    avatar: string;
    createdAt: string;
    updatedAt: string;
}

export default function TestimonialsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [deleting, setDeleting] = useState(false);
    const [selectedTestimonials, setSelectedTestimonials] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/login');
        } else {
            fetchTestimonials();
        }
    }, [router]);

    const fetchTestimonials = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:3001/api/testimonials');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch testimonials');
            }

            if (Array.isArray(data)) {
                setTestimonials(data);
            } else if (data.testimonials) {
                setTestimonials(data.testimonials);
            } else {
                setTestimonials([]);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching testimonials');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTestimonial = () => {
        router.push('/admin/testimonials/add');
    };

    const handleEdit = (id: number) => {
        router.push(`/admin/testimonials/edit/${id}`);
    };

    const handleConfirmDelete = async () => {
        if (selectedTestimonials.length === 0) return;

        setDeleting(true);
        setError('');

        try {
            // Bulk delete
            const response = await fetch('http://localhost:3001/api/testimonials/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedTestimonials }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete testimonials');
            }

            await fetchTestimonials();
            setSelectedTestimonials([]);
            setShowDeleteConfirm(false);
        } catch (err: any) {
            setError(err.message || 'An error occurred while deleting');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleToggleTestimonial = (id: number) => {
        setSelectedTestimonials(prev =>
            prev.includes(id)
                ? prev.filter(testimonialId => testimonialId !== id)
                : [...prev, id]
        );
    };

    const handleToggleAll = () => {
        if (selectedTestimonials.length === testimonials.length) {
            setSelectedTestimonials([]);
        } else {
            setSelectedTestimonials(testimonials.map(t => t.id));
        }
    };

    const handleBulkDeleteClick = () => {
        if (selectedTestimonials.length > 0) {
            setShowDeleteConfirm(true);
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

    // Filter testimonials
    const filteredTestimonials = testimonials.filter(testimonial => {
        return testimonial.reviewTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            testimonial.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            testimonial.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Testimonials</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {selectedTestimonials.length > 0 && (
                                <Button
                                    onClick={handleBulkDeleteClick}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={deleting}
                                >
                                    Delete ({selectedTestimonials.length})
                                </Button>
                            )}
                            <Button
                                onClick={() => router.push('/admin/testimonials/trash')}
                                variant="outline"
                                className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Trash
                            </Button>
                            <Button
                                onClick={handleAddTestimonial}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
                            >
                                Add Testimonial
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
                            {/* Info Message */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                                <div className="h-5 w-5 rounded-full border-2 border-orange-400 flex items-center justify-center">
                                    <span className="text-orange-400 text-xs">i</span>
                                </div>
                                <span>{loading ? 'Loading...' : `${testimonials.length} Testimonials listed`}</span>
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
                                            checked={testimonials.length > 0 && selectedTestimonials.length === testimonials.length}
                                            onChange={handleToggleAll}
                                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">S.N</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Updated At</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                            Loading testimonials...
                                        </td>
                                    </tr>
                                ) : filteredTestimonials.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                            No testimonials found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTestimonials.map((testimonial, index) => (
                                        <tr key={testimonial.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTestimonials.includes(testimonial.id)}
                                                    onChange={() => handleToggleTestimonial(testimonial.id)}
                                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{testimonial.fullName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${testimonial.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                                    }`}>
                                                    {testimonial.status === 1 ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{formatDate(testimonial.updatedAt)}</td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    onClick={() => handleEdit(testimonial.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:bg-gray-800"
                                                >
                                                    <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400 dark:text-gray-500" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
                            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">
                                {`Are you sure you want to delete ${selectedTestimonials.length} testimonial${selectedTestimonials.length > 1 ? 's' : ''}? This action cannot be undone.`}
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
