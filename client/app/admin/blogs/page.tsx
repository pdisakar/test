'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { Search, Edit } from 'lucide-react';

interface Blog {
    id: number;
    title: string;
    urlTitle: string;
    slug: string;
    authorId: number;
    publishedDate: string;
    status: number;
    isFeatured: number;
    createdAt: string;
    updatedAt: string;
}

export default function BlogsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [deleting, setDeleting] = useState(false);
    const [selectedBlogs, setSelectedBlogs] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/login');
        } else {
            fetchBlogs();
        }
    }, [router]);

    const fetchBlogs = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:3001/api/blogs');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch blogs');
            }

            if (Array.isArray(data)) {
                setBlogs(data);
            } else {
                setBlogs([]);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching blogs');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBlog = () => {
        router.push('/admin/blogs/add');
    };

    const handleEdit = (id: number) => {
        router.push(`/admin/blogs/edit/${id}`);
    };

    const handleConfirmDelete = async () => {
        if (selectedBlogs.length === 0) return;

        setDeleting(true);
        setError('');

        try {
            // Bulk delete
            const response = await fetch('http://localhost:3001/api/blogs/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedBlogs }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete blogs');
            }

            await fetchBlogs();
            setSelectedBlogs([]);
            setShowDeleteConfirm(false);
        } catch (err: any) {
            setError(err.message || 'An error occurred while deleting');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleToggleBlog = (id: number) => {
        setSelectedBlogs(prev =>
            prev.includes(id)
                ? prev.filter(blogId => blogId !== id)
                : [...prev, id]
        );
    };

    const handleToggleAll = () => {
        if (selectedBlogs.length === blogs.length) {
            setSelectedBlogs([]);
        } else {
            setSelectedBlogs(blogs.map(b => b.id));
        }
    };

    const handleBulkDeleteClick = () => {
        if (selectedBlogs.length > 0) {
            setShowDeleteConfirm(true);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Filter blogs
    const filteredBlogs = blogs.filter(blog => {
        return blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            blog.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blogs</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {selectedBlogs.length > 0 && (
                                <Button
                                    onClick={handleBulkDeleteClick}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={deleting}
                                >
                                    Delete ({selectedBlogs.length})
                                </Button>
                            )}
                            <Button
                                onClick={() => router.push('/admin/blogs/trash')}
                                variant="outline"
                                className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Trash
                            </Button>
                            <Button
                                onClick={handleAddBlog}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
                            >
                                Add Blog
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
                                <span>{loading ? 'Loading...' : `${blogs.length} Blogs listed`}</span>
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
                                            checked={blogs.length > 0 && selectedBlogs.length === blogs.length}
                                            onChange={handleToggleAll}
                                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">S.N</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Published Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Updated At</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                            Loading blogs...
                                        </td>
                                    </tr>
                                ) : filteredBlogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                            No blogs found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBlogs.map((blog, index) => (
                                        <tr key={blog.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBlogs.includes(blog.id)}
                                                    onChange={() => handleToggleBlog(blog.id)}
                                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {blog.title}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                                                {formatDate(blog.publishedDate)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${blog.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                                    }`}>
                                                    {blog.status === 1 ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{formatDate(blog.updatedAt)}</td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    onClick={() => handleEdit(blog.id)}
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
                                {`Are you sure you want to delete ${selectedBlogs.length} blog${selectedBlogs.length > 1 ? 's' : ''}? This action cannot be undone.`}
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
