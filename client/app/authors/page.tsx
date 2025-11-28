'use client';

import { Sidebar } from '@/components/Sidebar';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Edit } from 'lucide-react';

interface Author {
    id: number;
    fullName: string;
    email: string;
    urlTitle: string;
    slug: string;
    avatar: string;
    status: number;
    createdAt: string;
    updatedAt: string;
}

export default function AuthorsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [selectedAuthors, setSelectedAuthors] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/login');
        } else {
            fetchAuthors();
        }
    }, [router]);

    const fetchAuthors = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:3001/api/authors');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch authors');
            }

            if (Array.isArray(data)) {
                setAuthors(data);
            } else {
                setAuthors([]);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching authors');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAuthor = () => {
        router.push('/authors/add');
    };

    const handleEdit = (id: number) => {
        router.push(`/authors/edit/${id}`);
    };

    const handleConfirmDelete = async () => {
        if (selectedAuthors.length === 0) return;

        setDeleting(true);
        setError('');

        try {
            // Delete each selected author
            await Promise.all(
                selectedAuthors.map(id =>
                    fetch(`http://localhost:3001/api/authors/${id}`, { method: 'DELETE' })
                )
            );

            await fetchAuthors();
            setSelectedAuthors([]);
            setShowDeleteConfirm(false);
        } catch (err: any) {
            setError(err.message || 'An error occurred while deleting');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleToggleAuthor = (id: number) => {
        setSelectedAuthors(prev =>
            prev.includes(id)
                ? prev.filter(authorId => authorId !== id)
                : [...prev, id]
        );
    };

    const handleToggleAll = () => {
        if (selectedAuthors.length === authors.length) {
            setSelectedAuthors([]);
        } else {
            setSelectedAuthors(authors.map(a => a.id));
        }
    };

    const handleBulkDeleteClick = () => {
        if (selectedAuthors.length > 0) {
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

    const getSrc = (url: string) => {
        if (!url) return '';
        if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) {
            return url;
        }
        return `http://localhost:3001${url}`;
    };

    // Filter authors
    const filteredAuthors = authors.filter(author => {
        return author.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            author.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            author.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <h1 className="text-3xl font-bold text-gray-900">Authors</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {selectedAuthors.length > 0 && (
                                <Button
                                    onClick={handleBulkDeleteClick}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={deleting}
                                >
                                    Delete ({selectedAuthors.length})
                                </Button>
                            )}
                            <Button
                                onClick={() => router.push('/authors/trash')}
                                variant="outline"
                                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Trash
                            </Button>
                            <Button
                                onClick={handleAddAuthor}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
                            >
                                Add Author
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Info Message */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="h-5 w-5 rounded-full border-2 border-orange-400 flex items-center justify-center">
                                    <span className="text-orange-400 text-xs">i</span>
                                </div>
                                <span>{loading ? 'Loading...' : `${authors.length} Authors listed`}</span>
                            </div>

                            {/* Spacer */}
                            <div className="flex-1"></div>

                            {/* Search */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Search:</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search..."
                                        className="pl-4 pr-10 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm w-full md:w-64"
                                    />
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left w-12">
                                        <input
                                            type="checkbox"
                                            checked={authors.length > 0 && selectedAuthors.length === authors.length}
                                            onChange={handleToggleAll}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">S.N</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Image</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Updated At</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                            Loading authors...
                                        </td>
                                    </tr>
                                ) : filteredAuthors.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                            No authors found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAuthors.map((author, index) => (
                                        <tr key={author.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAuthors.includes(author.id)}
                                                    onChange={() => handleToggleAuthor(author.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
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
                                                        <span className="text-gray-500 text-sm font-medium">
                                                            {author.fullName.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {author.fullName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {author.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${author.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {author.status === 1 ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(author.updatedAt)}</td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    onClick={() => handleEdit(author.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-100"
                                                >
                                                    <Edit className="h-4 w-4 text-gray-600" />
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
                        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
                            <p className="text-gray-600 mb-6">
                                {`Are you sure you want to delete ${selectedAuthors.length} author${selectedAuthors.length > 1 ? 's' : ''}? This action cannot be undone.`}
                            </p>
                            <div className="flex items-center gap-3 justify-end">
                                <Button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    variant="outline"
                                    className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
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
        </div>
    );
}
