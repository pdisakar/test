'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Trash2, Plus, Pencil, Check, X, FolderPlus } from 'lucide-react';

interface Attribute {
  id: number;
  name: string;
  type: string;
}

interface Category {
  id: number;
  label: string;
  slug: string;
  isDefault?: number;
}

export default function TripFactsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttribute, setNewAttribute] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number, label: string } | null>(null);
  const [deleteStep, setDeleteStep] = useState(1);
  const [attributeToDelete, setAttributeToDelete] = useState<{ id: number, name: string } | null>(null);
  const [attributeDeleteStep, setAttributeDeleteStep] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab) {
      fetchAttributes();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/fact-categories');
      const data = await res.json();
      setCategories(data);
      if (data.length > 0 && !activeTab) {
        setActiveTab(data[0].slug);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/attributes/${activeTab}`);
      const data = await res.json();
      setAttributes(data);
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const res = await fetch('http://localhost:3001/api/fact-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newCategory }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewCategory('');
        setShowAddCategory(false);
        await fetchCategories();
        setActiveTab(data.category.slug);
      } else {
        alert('Failed to add category. It might already exist.');
      }
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const handleDeleteCategory = (id: number, label: string) => {
    setCategoryToDelete({ id, label });
    setDeleteStep(1);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const res = await fetch(`http://localhost:3001/api/fact-categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const newCategories = categories.filter(c => c.id !== categoryToDelete.id);
        setCategories(newCategories);
        if (newCategories.length > 0) {
          setActiveTab(newCategories[0].slug);
        } else {
          setActiveTab('');
          setAttributes([]);
        }
        setCategoryToDelete(null);
        setDeleteStep(1);
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to delete category');
        setCategoryToDelete(null);
        setDeleteStep(1);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttribute.trim()) return;

    try {
      const res = await fetch('http://localhost:3001/api/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAttribute, type: activeTab }),
      });
      if (res.ok) {
        setNewAttribute('');
        fetchAttributes();
      }
    } catch (error) {
      console.error('Failed to add attribute:', error);
    }
  };

  const handleDeleteAttribute = (id: number, name: string) => {
    setAttributeToDelete({ id, name });
    setAttributeDeleteStep(1);
  };

  const confirmDeleteAttribute = async () => {
    if (!attributeToDelete) return;

    try {
      const res = await fetch(`http://localhost:3001/api/attributes/${attributeToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAttributes();
        setAttributeToDelete(null);
        setAttributeDeleteStep(1);
      }
    } catch (error) {
      console.error('Failed to delete attribute:', error);
    }
  };

  const startEdit = (attr: Attribute) => {
    setEditingId(attr.id);
    setEditValue(attr.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (id: number) => {
    if (!editValue.trim()) return;
    try {
      const res = await fetch(`http://localhost:3001/api/attributes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchAttributes();
      }
    } catch (error) {
      console.error('Failed to update attribute:', error);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trip Facts Management</h1>
            <Button onClick={() => setShowAddCategory(!showAddCategory)} variant="outline">
              <FolderPlus className="h-4 w-4 mr-2" />
              {showAddCategory ? 'Cancel' : 'New Category'}
            </Button>
          </div>

          {showAddCategory && (
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6 animate-in slide-in-from-top-2">
              <form onSubmit={handleAddCategory} className="flex gap-4">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category Name (e.g. Best Season)"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  autoFocus
                />
                <Button type="submit">Create</Button>
              </form>
            </div>
          )}

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <div key={cat.id} className="relative group">
                <button
                  onClick={() => setActiveTab(cat.slug)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${cat.isDefault ? 'pr-4' : 'pr-8'} ${activeTab === cat.slug
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                >
                  {cat.label}
                </button>
                {!cat.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat.id, cat.label);
                    }}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors ${activeTab === cat.slug ? 'text-white/80 hover:text-white hover:bg-white dark:bg-gray-900/20' : 'text-gray-400 dark:text-gray-500'
                      }`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {categories.length === 0 && !loading && (
              <div className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm py-2">No categories yet. Create one!</div>
            )}
          </div>

          {activeTab && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Manage {categories.find(c => c.slug === activeTab)?.label} Options
              </h2>

              <form onSubmit={handleAddAttribute} className="flex gap-4 mb-8">
                <input
                  type="text"
                  value={newAttribute}
                  onChange={(e) => setNewAttribute(e.target.value)}
                  placeholder="Add new option..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <Button type="submit" disabled={!newAttribute.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </form>

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 dark:text-gray-500">Loading...</div>
                ) : attributes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-950 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                    No options found. Add one above.
                  </div>
                ) : (
                  attributes.map((attr) => (
                    <div key={attr.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800 group hover:border-primary/20 transition-colors">
                      {editingId === attr.id ? (
                        <div className="flex-1 flex items-center gap-3 mr-4">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded border border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                            autoFocus
                          />
                          <button onClick={() => saveEdit(attr.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-200 rounded">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-700 dark:text-gray-300">{attr.name}</span>
                      )}

                      {editingId !== attr.id && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(attr)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteAttribute(attr.id, attr.name)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {deleteStep === 1 ? 'Confirm Delete Category' : 'Are you absolutely sure?'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">
              {deleteStep === 1
                ? `Delete "${categoryToDelete.label}" and all its options? This action CANNOT be undone.`
                : `This will permanently remove "${categoryToDelete.label}" category and all associated options from packages. There is no going back. Confirm?`}
            </p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => { setCategoryToDelete(null); setDeleteStep(1); }} variant="outline">Cancel</Button>
              {deleteStep === 1 ? (
                <Button onClick={() => setDeleteStep(2)} className="bg-red-600 hover:bg-red-700 text-white">Delete Category</Button>
              ) : (
                <Button onClick={confirmDeleteCategory} className="bg-red-900 hover:bg-red-950 text-white">Yes, Delete Everything</Button>
              )}
            </div>
          </div>
        </div>
      )}

      {attributeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {attributeDeleteStep === 1 ? 'Confirm Delete Option' : 'Are you absolutely sure?'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">
              {attributeDeleteStep === 1
                ? `Delete "${attributeToDelete.name}" option? This action CANNOT be undone.`
                : `This will permanently remove "${attributeToDelete.name}" from all packages using it. There is no going back. Confirm?`}
            </p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => { setAttributeToDelete(null); setAttributeDeleteStep(1); }} variant="outline">Cancel</Button>
              {attributeDeleteStep === 1 ? (
                <Button onClick={() => setAttributeDeleteStep(2)} className="bg-red-600 hover:bg-red-700 text-white">Delete Option</Button>
              ) : (
                <Button onClick={confirmDeleteAttribute} className="bg-red-900 hover:bg-red-950 text-white">Yes, Delete Everything</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
