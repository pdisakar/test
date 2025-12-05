'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { BannerImage } from '@/app/admin/components/BannerImage';
import { getApiUrl, getImageUrl } from '@/app/admin/lib/api-config';

interface HeroSection {
    id?: number;
    image: string;
    imageAlt: string;
    imageCaption: string;
    title: string;
    subtitle: string;
}

const initialHero: HeroSection = {
    image: '',
    imageAlt: '',
    imageCaption: '',
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
            if (data && data.image) {
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

    // Function to delete image from backend
    const deleteImage = async (imagePath: string) => {
        if (!imagePath || imagePath.startsWith('data:')) return;
        try {
            await fetch(getApiUrl('upload/image'), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: imagePath }),
            });
        } catch (err) {
            console.error('Failed to delete image:', err);
        }
    };

    const handleImageSelect = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Just set state, don't upload yet
            setHero(prev => ({ ...prev, image: base64String }));
        };
        reader.readAsDataURL(file);
    };

    const handleImageRemove = async () => {
        if (hero.image) {
            await deleteImage(hero.image);
            setHero(prev => ({ ...prev, image: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            let imagePath = hero.image;
            // Upload if it's a base64 string (new image)
            if (hero.image && hero.image.startsWith('data:')) {
                const res = await fetch(getApiUrl('upload/image'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: hero.image, type: 'hero' }),
                });
                const data = await res.json();
                if (!data.success) {
                    throw new Error(data.message || 'Failed to upload image');
                }
                imagePath = data.path;
                // Update state with new path
                setHero(prev => ({ ...prev, image: imagePath }));
            }

            await apiFetch('/hero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...hero, image: imagePath }),
            });
            setMessage({ type: 'success', text: 'Hero section saved successfully!' });
        } catch (error: any) {
            console.error('Failed to save hero section:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to save hero section. Please try again.' });
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
                        {/* Banner Image Component */}
                        <BannerImage
                            label="Banner Image"
                            imageUrl={hero.image}
                            imageAlt={hero.imageAlt}
                            imageCaption={hero.imageCaption}
                            onImageSelect={handleImageSelect}
                            onImageRemove={handleImageRemove}
                            onAltChange={(alt) => setHero(prev => ({ ...prev, imageAlt: alt }))}
                            onCaptionChange={(caption) => setHero(prev => ({ ...prev, imageCaption: caption }))}
                            helperText="SVG, PNG, JPG or GIF (MAX. 1920x750)"
                            disabled={saving}
                        />

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