'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { Switch } from '@/app/admin/components/ui/switch';

interface Menu {
    id: number;
    title: string;
    type: string;
}

interface Article {
    id: number;
    title: string;
    slug: string;
}

interface Place {
    id: number;
    title: string;
    slug: string;
}

export default function AddMenuPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [type, setType] = useState('header');
    const [parentId, setParentId] = useState('');
    const [urlSegmentType, setUrlSegmentType] = useState('article');
    const [urlSegmentId, setUrlSegmentId] = useState('');
    const [status, setStatus] = useState(true);
    const [saving, setSaving] = useState(false);

    const [parentMenus, setParentMenus] = useState<Menu[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [places, setPlaces] = useState<Place[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/login');
        } else {
            fetchData();
        }
    }, [router]);

    const fetchData = async () => {
        try {
            const [menusRes, articlesRes, placesRes] = await Promise.all([
                fetch('http://localhost:3001/api/menus'),
                fetch('http://localhost:3001/api/articles'),
                fetch('http://localhost:3001/api/places')
            ]);

            const menusData = await menusRes.json();
            const articlesData = await articlesRes.json();
            const placesData = await placesRes.json();

            setParentMenus(Array.isArray(menusData) ? menusData : []);
            setArticles(Array.isArray(articlesData) ? articlesData : []);
            setPlaces(Array.isArray(placesData) ? placesData : []);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title) {
            alert('Please enter a title');
            return;
        }

        setSaving(true);

        try {
            // Generate URL based on selected segment
            let url = null;
            if (urlSegmentId) {
                if (urlSegmentType === 'article') {
                    const article = articles.find(a => a.id === parseInt(urlSegmentId));
                    if (article) url = `/articles/${article.slug}`;
                } else {
                    const place = places.find(p => p.id === parseInt(urlSegmentId));
                    if (place) url = `/places/${place.slug}`;
                }
            }

            const payload = {
                title,
                type,
                parentId: parentId ? parseInt(parentId) : null,
                urlSegmentType: urlSegmentId ? urlSegmentType : null,
                urlSegmentId: urlSegmentId ? parseInt(urlSegmentId) : null,
                url,
                status,
                displayOrder: 0
            };

            const response = await fetch('http://localhost:3001/api/menus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                router.push('/admin/menus');
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to create menu');
            }
        } catch (err) {
            console.error('Error creating menu:', err);
            alert('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    const availableParents = parentMenus.filter(m => m.type === type);

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Add Menu</h1>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter menu title"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={type}
                                onChange={(e) => {
                                    setType(e.target.value);
                                    setParentId(''); // Reset parent when type changes
                                }}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white dark:bg-gray-900"
                            >
                                <option value="header">Header</option>
                                <option value="footer">Footer</option>
                            </select>
                        </div>

                        {/* Parent Menu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Parent Menu
                            </label>
                            <select
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white dark:bg-gray-900"
                            >
                                <option value="">-- None (Top Level) --</option>
                                {availableParents.map(menu => (
                                    <option key={menu.id} value={menu.id}>{menu.title}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Select a parent menu to create a sub-menu</p>
                        </div>

                        {/* URL Segment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                URL Segment
                            </label>

                            <div className="space-y-3">
                                {/* Segment Type */}
                                <select
                                    value={urlSegmentType}
                                    onChange={(e) => {
                                        setUrlSegmentType(e.target.value);
                                        setUrlSegmentId('');
                                    }}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white dark:bg-gray-900"
                                >
                                    <option value="article">Article</option>
                                    <option value="place">Place</option>
                                </select>

                                {/* Segment Selection */}
                                <select
                                    value={urlSegmentId}
                                    onChange={(e) => setUrlSegmentId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white dark:bg-gray-900"
                                >
                                    <option value="">-- Select {urlSegmentType === 'article' ? 'Article' : 'Place'} --</option>
                                    {urlSegmentType === 'article'
                                        ? articles.map(article => (
                                            <option key={article.id} value={article.id}>{article.title}</option>
                                        ))
                                        : places.map(place => (
                                            <option key={place.id} value={place.id}>{place.title}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Select an article or place to link this menu to</p>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                            <div className="flex items-center gap-3">
                                <Switch checked={status} onCheckedChange={setStatus} />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {status ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                onClick={() => router.push('/admin/menus')}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                            >
                                {saving ? 'Creating...' : 'Create Menu'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
