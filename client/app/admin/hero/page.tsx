'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Save, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface HeroSection {
    id?: number;
    image: string;
    title: string;
    subtitle: string;
}

const initialHero: HeroSection = {
    image: '',
    title: '',
    subtitle: '',
};

export default function HeroSectionPage() {
    const [hero, setHero] = useState<HeroSection>(initialHero);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchHero();
    }, []);

    const fetchHero = async () => {
        try {
            const data = await apiFetch<HeroSection>('/hero');
            if (data && data.image) { // Check if data is valid (at least has image)
                setHero({ ...initialHero, ...data });
            }
        } catch (error) {
            console.error('Failed to fetch hero section:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setHero(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            try {
                const res = await fetch('http://localhost:3001/api/upload/image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64String, type: 'hero' }),
                });
                const data = await res.json();
                if (data.success) {
                    setHero(prev => ({ ...prev, image: data.path }));
                } else {
                    setMessage({ type: 'error', text: 'Failed to upload image' });
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                setMessage({ type: 'error', text: 'Error uploading image' });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        if (!hero.image) {
            setMessage({ type: 'error', text: 'Banner image is required' });
            setSaving(false);
            return;
        }

        try {
            await apiFetch('/hero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hero),
            });
            setMessage({ type: 'success', text: 'Hero section saved successfully!' });
        } catch (error) {
            console.error('Failed to save hero section:', error);
            setMessage({ type: 'error', text: 'Failed to save hero section. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hero Section Management</h1>
                        <Button onClick={handleSubmit} disabled={saving} className="bg-primary hover:bg-primary/90">
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Save Changes
                                </>
                            )}
                        </Button>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Banner Image */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Banner Image</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 relative overflow-hidden group">
                                        {hero.image ? (
                                            <>
                                                <img
                                                    src={`http://localhost:3001${hero.image}`}
                                                    alt="Hero Banner"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex flex-col items-center text-white">
                                                        <Upload className="w-8 h-8 mb-2" />
                                                        <p className="text-sm font-semibold">Click to replace</p>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <ImageIcon className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> banner image</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 1920x750)</p>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Text Content</h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Main Hero Text</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={hero.title}
                                        onChange={handleChange}
                                        placeholder="e.g., Discover Your Next Adventure"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sub Title</label>
                                    <textarea
                                        name="subtitle"
                                        value={hero.subtitle}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="e.g., Explore the world with us..."
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
