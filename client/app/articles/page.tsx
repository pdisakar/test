'use client';

import { Sidebar } from '@/components/Sidebar';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Edit, ChevronRight, ChevronDown } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  urlTitle: string;
  slug: string;
  parentId: number | null;
  description: string;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  featuredImage: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

interface ArticleWithChildren extends Article {
  children?: Article[];
}

export default function ArticlesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleting, setDeleting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    } else {
      fetchArticles();
    }
  }, [router]);

  const fetchArticles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/articles');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch articles');
      }

      if (Array.isArray(data)) {
        setArticles(data);
      } else if (data.articles) {
        setArticles(data.articles);
      } else {
        setArticles([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching articles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddArticle = () => {
    router.push('/articles/add');
  };

  const handleEdit = (id: number) => {
    router.push(`/articles/edit/${id}`);
  };



  const handleConfirmDelete = async () => {
    if (selectedArticles.length === 0) return;

    setDeleting(true);
    setError('');

    try {
      // Bulk delete
      const response = await fetch('http://localhost:3001/api/articles/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedArticles }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete articles');
      }

      await fetchArticles();
      setSelectedArticles([]);
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

  const handleToggleArticle = (id: number) => {
    setSelectedArticles(prev =>
      prev.includes(id)
        ? prev.filter(articleId => articleId !== id)
        : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map(a => a.id));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedArticles.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const organizeArticles = (articles: Article[]): ArticleWithChildren[] => {
    const articleMap = new Map<number, ArticleWithChildren>();
    const roots: ArticleWithChildren[] = [];

    // First pass: create objects and map
    articles.forEach(article => {
      articleMap.set(article.id, { ...article, children: [] });
    });

    // Second pass: link children to parents
    articles.forEach(article => {
      const node = articleMap.get(article.id)!;
      if (article.parentId && articleMap.has(article.parentId)) {
        const parent = articleMap.get(article.parentId)!;
        parent.children?.push(node);
      } else {
        roots.push(node);
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

  // Filter and organize articles
  const filteredArticles = articles.filter(article => {
    return article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.slug?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const organizedArticles = organizeArticles(filteredArticles);

  const renderArticleRow = (article: ArticleWithChildren, index: number, depth: number = 0): React.JSX.Element => {
    const hasChildren = article.children && article.children.length > 0;
    const isExpanded = expandedRows.has(article.id);

    return (
      <React.Fragment key={article.id}>
        <tr className={`hover:bg-gray-50 transition-colors ${depth > 0 ? 'bg-gray-50/50' : ''}`}>
          <td className="px-6 py-4">
            <input
              type="checkbox"
              checked={selectedArticles.includes(article.id)}
              onChange={() => handleToggleArticle(article.id)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {depth === 0 ? index + 1 : ''}
          </td>
          <td className="px-6 py-4">
            {hasChildren && (
              <button
                onClick={() => toggleRow(article.id)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
          </td>
          <td className="px-6 py-4 text-sm font-medium text-gray-900">
            <div style={{ paddingLeft: `${depth * 24}px` }} className="flex items-center gap-2">
              {article.title}
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${article.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
              {article.status === 1 ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(article.updatedAt)}</td>
          <td className="px-6 py-4">
            <Button
              onClick={() => handleEdit(article.id)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-100"
            >
              <Edit className="h-4 w-4 text-gray-600" />
            </Button>
          </td>
        </tr>
        {isExpanded && article.children?.map((child, childIndex) => (
          <React.Fragment key={child.id}>
            {renderArticleRow(child, childIndex, depth + 1)}
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
            <div className="flex items-center gap-3">
              {selectedArticles.length > 0 && (
                <Button
                  onClick={handleBulkDeleteClick}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                  disabled={deleting}
                >
                  Delete ({selectedArticles.length})
                </Button>
              )}
              <Button
                onClick={handleAddArticle}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
              >
                Add Article
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-4">
              {/* Info Message */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="h-5 w-5 rounded-full border-2 border-orange-400 flex items-center justify-center">
                  <span className="text-orange-400 text-xs">i</span>
                </div>
                <span>{loading ? 'Loading...' : `${articles.length} Articles listed`}</span>
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
                    className="pl-4 pr-10 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm w-64"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left w-12">
                    <input
                      type="checkbox"
                      checked={articles.length > 0 && selectedArticles.length === articles.length}
                      onChange={handleToggleAll}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">S.N</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-12"></th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Updated At</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading articles...
                    </td>
                  </tr>
                ) : organizedArticles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No articles found
                    </td>
                  </tr>
                ) : (
                  organizedArticles.map((article, index) => renderArticleRow(article, index))
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
                {`Are you sure you want to delete ${selectedArticles.length} article${selectedArticles.length > 1 ? 's' : ''}? This action cannot be undone.`}
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
