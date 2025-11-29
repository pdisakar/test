'use client';

import { MainLayout } from '@/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, ArrowLeft } from 'lucide-react';

interface Blog {
  id: number;
  title: string;
  deletedAt: string;
  updatedAt: string;
}

export default function BlogsTrashPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedBlogs, setSelectedBlogs] = useState<number[]>([]);
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
      const response = await fetch('http://localhost:3001/api/blogs/trash');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch trash');
      }

      setBlogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching trash');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: number) => {
    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:3001/api/blogs/${id}/restore`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to restore blog');
      await fetchTrash();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedBlogs.length === 0) return;
    setProcessing(true);
    try {
      const response = await fetch('http://localhost:3001/api/blogs/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBlogs }),
      });
      if (!response.ok) throw new Error('Failed to restore blogs');
      await fetchTrash();
      setSelectedBlogs([]);
      setShowRestoreConfirm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDeletePermanent = async () => {
    if (selectedBlogs.length === 0) return;
    setProcessing(true);
    try {
      const response = await fetch('http://localhost:3001/api/blogs/bulk-delete-permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBlogs }),
      });
      if (!response.ok) throw new Error('Failed to delete blogs');
      await fetchTrash();
      setSelectedBlogs([]);
      setShowDeleteConfirm(false);
      setBulkDeleteStep(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleBlog = (id: number) => {
    setSelectedBlogs(prev =>
      prev.includes(id) ? prev.filter(blogId => blogId !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedBlogs.length === blogs.length) {
      setSelectedBlogs([]);
    } else {
      setSelectedBlogs(blogs.map(b => b.id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="flex-1 transition-all duration-300 w-full">
        <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/blogs')} variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blogs Trash</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {selectedBlogs.length > 0 && (
                <>
                  <Button
                    onClick={() => setShowRestoreConfirm(true)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white"
                    disabled={processing}
                  >
                    Restore ({selectedBlogs.length})
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                    disabled={processing}
                  >
                    Delete Forever ({selectedBlogs.length})
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
                <span>{loading ? 'Loading...' : `${blogs.length} Deleted Blogs`}</span>
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
                      checked={blogs.length > 0 && selectedBlogs.length === blogs.length}
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
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">Loading trash...</td></tr>
                ) : filteredBlogs.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">Trash is empty</td></tr>
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
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {blog.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Deleted
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{formatDate(blog.deletedAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRestore(blog.id)}
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                            title="Restore"
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
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">Restore {selectedBlogs.length} blog(s)? They will appear in the main list again.</p>
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
                  ? `Permanently delete ${selectedBlogs.length} blog(s)? This action CANNOT be undone.`
                  : 'This will permanently remove these blogs and all their images. There is no going back. Confirm?'}
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
