'use client';

import { MainLayout } from '@/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Edit, ChevronRight, ChevronDown } from 'lucide-react';

interface place {
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

interface placeWithChildren extends place {
  children?: place[];
}

export default function placesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [places, setplaces] = useState<place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleting, setDeleting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedplaces, setSelectedplaces] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    } else {
      fetchplaces();
    }
  }, [router]);

  const fetchplaces = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/places');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch places');
      }

      if (Array.isArray(data)) {
        setplaces(data);
      } else if (data.places) {
        setplaces(data.places);
      } else {
        setplaces([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching places');
    } finally {
      setLoading(false);
    }
  };

  const handleAddplace = () => {
    router.push('/places/add');
  };

  const handleEdit = (id: number) => {
    router.push(`/places/edit/${id}`);
  };



  const handleConfirmDelete = async () => {
    if (selectedplaces.length === 0) return;

    setDeleting(true);
    setError('');

    try {
      // Bulk delete
      const response = await fetch('http://localhost:3001/api/places/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedplaces }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete places');
      }

      await fetchplaces();
      setSelectedplaces([]);
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

  const handleToggleplace = (id: number) => {
    setSelectedplaces(prev =>
      prev.includes(id)
        ? prev.filter(placeId => placeId !== id)
        : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedplaces.length === places.length) {
      setSelectedplaces([]);
    } else {
      setSelectedplaces(places.map(a => a.id));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedplaces.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const organizeplaces = (places: place[]): placeWithChildren[] => {
    const placeMap = new Map<number, placeWithChildren>();
    const roots: placeWithChildren[] = [];

    // First pass: create objects and map
    places.forEach(place => {
      placeMap.set(place.id, { ...place, children: [] });
    });

    // Second pass: link children to parents
    places.forEach(place => {
      const node = placeMap.get(place.id)!;
      if (place.parentId && placeMap.has(place.parentId)) {
        const parent = placeMap.get(place.parentId)!;
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

  // Filter and organize places
  const filteredplaces = places.filter(place => {
    return place.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.slug?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const organizedplaces = organizeplaces(filteredplaces);

  const renderplaceRow = (place: placeWithChildren, index: number, depth: number = 0): React.JSX.Element => {
    const hasChildren = place.children && place.children.length > 0;
    const isExpanded = expandedRows.has(place.id);

    return (
      <React.Fragment key={place.id}>
        <tr className={`hover:bg-gray-50 transition-colors ${depth > 0 ? 'bg-gray-50/50' : ''}`}>
          <td className="px-6 py-4">
            <input
              type="checkbox"
              checked={selectedplaces.includes(place.id)}
              onChange={() => handleToggleplace(place.id)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {depth === 0 ? index + 1 : ''}
          </td>
          <td className="px-6 py-4">
            {hasChildren && (
              <button
                onClick={() => toggleRow(place.id)}
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
              {place.title}
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${place.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
              {place.status === 1 ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(place.updatedAt)}</td>
          <td className="px-6 py-4">
            <Button
              onClick={() => handleEdit(place.id)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-100"
            >
              <Edit className="h-4 w-4 text-gray-600" />
            </Button>
          </td>
        </tr>
        {isExpanded && place.children?.map((child, childIndex) => (
          <React.Fragment key={child.id}>
            {renderplaceRow(child, childIndex, depth + 1)}
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <h1 className="text-3xl font-bold text-gray-900">places</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {selectedplaces.length > 0 && (
            <Button
              onClick={handleBulkDeleteClick}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
            >
              Delete ({selectedplaces.length})
            </Button>
          )}
          <Button
            onClick={() => router.push('/places/trash')}
            variant="outline"
            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Trash
          </Button>
          <Button
            onClick={handleAddplace}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
          >
            Add place
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
            <span>{loading ? 'Loading...' : `${places.length} places listed`}</span>
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
                  checked={places.length > 0 && selectedplaces.length === places.length}
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
                  Loading places...
                </td>
              </tr>
            ) : organizedplaces.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No places found
                </td>
              </tr>
            ) : (
              organizedplaces.map((place, index) => renderplaceRow(place, index))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              {`Are you sure you want to delete ${selectedplaces.length} place${selectedplaces.length > 1 ? 's' : ''}? This action cannot be undone.`}
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
    </MainLayout>
  );
}
