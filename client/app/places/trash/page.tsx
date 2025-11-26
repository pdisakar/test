'use client';

import { Sidebar } from '@/components/Sidebar';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, Trash2, ArrowLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface place {
  id: number;
  title: string;
  deletedAt: string;
  updatedAt: string;
  parentId?: number | null;
}

interface placeWithChildren extends place {
  children?: placeWithChildren[];
}

export default function TrashPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [places, setplaces] = useState<place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedplaces, setSelectedplaces] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [placeToDelete, setplaceToDelete] = useState<number | null>(null);
  const [deleteStep, setDeleteStep] = useState(1);
  const [bulkDeleteStep, setBulkDeleteStep] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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
      const response = await fetch('http://localhost:3001/api/places/trash');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch trash');
      }

      setplaces(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching trash');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: number) => {
    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:3001/api/places/${id}/restore`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to restore place');
      await fetchTrash();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeletePermanent = (id: number) => {
    setplaceToDelete(id);
    setDeleteStep(1);
  };

  const confirmDeletePermanent = async () => {
    if (!placeToDelete) return;
    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:3001/api/places/${placeToDelete}/permanent`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete place');
      await fetchTrash();
      setplaceToDelete(null);
      setDeleteStep(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedplaces.length === 0) return;
    setProcessing(true);
    try {
      const response = await fetch('http://localhost:3001/api/places/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedplaces }),
      });
      if (!response.ok) throw new Error('Failed to restore places');
      await fetchTrash();
      setSelectedplaces([]);
      setShowRestoreConfirm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDeletePermanent = async () => {
    if (selectedplaces.length === 0) return;
    setProcessing(true);
    try {
      const response = await fetch('http://localhost:3001/api/places/bulk-delete-permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedplaces }),
      });
      if (!response.ok) throw new Error('Failed to delete places');
      await fetchTrash();
      setSelectedplaces([]);
      setShowDeleteConfirm(false);
      setBulkDeleteStep(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleplace = (id: number) => {
    setSelectedplaces(prev =>
      prev.includes(id) ? prev.filter(placeId => placeId !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedplaces.length === places.length) {
      setSelectedplaces([]);
    } else {
      setSelectedplaces(places.map(a => a.id));
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

  const organizeplaces = (flatplaces: place[]): placeWithChildren[] => {
    const placeMap = new Map<number, placeWithChildren>();
    const roots: placeWithChildren[] = [];

    // First pass: Create objects for all places
    flatplaces.forEach(place => {
      placeMap.set(place.id, { ...place, children: [] });
    });

    // Second pass: Link children to parents
    flatplaces.forEach(place => {
      const node = placeMap.get(place.id)!;
      // Only treat as child if parent is ALSO in the trash list
      if (place.parentId && placeMap.has(place.parentId)) {
        const parent = placeMap.get(place.parentId);
        parent?.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderplaceRow = (place: placeWithChildren, index: number, depth: number = 0, parentInTrash: boolean = false): React.JSX.Element => {
    const hasChildren = place.children && place.children.length > 0;
    const isExpanded = expandedRows.has(place.id);
    const isChildOfDeletedParent = parentInTrash;

    return (
      <React.Fragment key={place.id}>
        <tr className={`hover:bg-gray-50 transition-colors ${depth > 0 ? 'bg-gray-50/50' : ''}`}>
          <td className="px-6 py-4">
            <input
              type="checkbox"
              checked={selectedplaces.includes(place.id)}
              onChange={() => handleToggleplace(place.id)}
              disabled={isChildOfDeletedParent}
              className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer ${isChildOfDeletedParent ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </td>
          <td className="px-6 py-4 text-sm text-gray-500">
            {index + 1}
          </td>
          <td className="px-6 py-4">
            {hasChildren && (
              <button
                onClick={() => toggleRow(place.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
              <span className={`text-sm font-medium ${isChildOfDeletedParent ? 'text-gray-500' : 'text-gray-900'}`}>
                {place.title}
                {isChildOfDeletedParent && <span className="ml-2 text-xs text-gray-400">(Child of deleted parent)</span>}
              </span>
            </div>
          </td>
          <td className="px-6 py-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Deleted
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(place.deletedAt)}</td>
          <td className="px-6 py-4">
            <div className="flex gap-2">
              <Button
                onClick={() => handleRestore(place.id)}
                variant="outline"
                size="sm"
                disabled={isChildOfDeletedParent}
                className={`h-8 w-8 p-0 border-green-200 hover:bg-green-50 text-green-600 ${isChildOfDeletedParent ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isChildOfDeletedParent ? "Restore parent to recover this item" : "Restore"}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleDeletePermanent(place.id)}
                variant="outline"
                size="sm"
                disabled={isChildOfDeletedParent}
                className={`h-8 w-8 p-0 border-red-200 hover:bg-red-50 text-red-600 ${isChildOfDeletedParent ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isChildOfDeletedParent ? "Delete parent to remove this item" : "Delete Permanently"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </td>
        </tr>
        {isExpanded && place.children?.map((child, childIndex) => (
          renderplaceRow(child, childIndex, depth + 1, true)
        ))}
      </React.Fragment>
    );
  };

  const filteredplaces = organizeplaces(places).filter(place =>
    place.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300 w-full">
        <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/places')} variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Trash</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {selectedplaces.length > 0 && (
                <>
                  <Button
                    onClick={() => setShowRestoreConfirm(true)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white"
                    disabled={processing}
                  >
                    Restore ({selectedplaces.length})
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                    disabled={processing}
                  >
                    Delete Forever ({selectedplaces.length})
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{loading ? 'Loading...' : `${places.length} Deleted places`}</span>
              </div>
              <div className="flex-1"></div>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Deleted At</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading trash...</td></tr>
                ) : filteredplaces.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Trash is empty</td></tr>
                ) : (
                  filteredplaces.map((place, index) => renderplaceRow(place, index))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Restore Confirmation */}
        {showRestoreConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Restore</h3>
              <p className="text-gray-600 mb-6">Restore {selectedplaces.length} place(s)? They will appear in the main list again.</p>
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
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {bulkDeleteStep === 1 ? 'Confirm Permanent Delete' : 'Are you absolutely sure?'}
              </h3>
              <p className="text-gray-600 mb-6">
                {bulkDeleteStep === 1
                  ? `Permanently delete ${selectedplaces.length} place(s)? This action CANNOT be undone.`
                  : 'This will permanently remove these places and all their images. There is no going back. Confirm?'}
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

        {/* Single Delete Confirmation */}
        {placeToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {deleteStep === 1 ? 'Confirm Permanent Delete' : 'Are you absolutely sure?'}
              </h3>
              <p className="text-gray-600 mb-6">
                {deleteStep === 1
                  ? 'Permanently delete this place? This action CANNOT be undone.'
                  : 'This will permanently remove the place and all its images. There is no going back. Confirm?'}
              </p>
              <div className="flex gap-3 justify-end">
                <Button onClick={() => { setplaceToDelete(null); setDeleteStep(1); }} variant="outline">Cancel</Button>
                {deleteStep === 1 ? (
                  <Button onClick={() => setDeleteStep(2)} className="bg-red-600 hover:bg-red-700 text-white">Delete Forever</Button>
                ) : (
                  <Button onClick={confirmDeletePermanent} className="bg-red-900 hover:bg-red-950 text-white">Yes, Delete Everything</Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
