'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { BannerImage } from '@/app/admin/components/BannerImage';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/app/admin/components/RichTextEditor'), { ssr: false });

export default function HomeContentPage() {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [bannerImage, setBannerImage] = useState('');
    const [bannerImageAlt, setBannerImageAlt] = useState('');
    const [bannerImageCaption, setBannerImageCaption] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

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
            const response = await fetch('http://localhost:3001/api/homecontent');
            const data = await response.json();

            if (data) {
                setContent(data.content || '');
                setBannerImage(data.bannerImage || '');
                // Assuming backend stores alt/caption if we added columns, but for now just image
            }
        } catch (err) {
            console.error('Error fetching home content:', err);
        } finally {
            setLoading(false);
        }
    };

    // Function to delete image from backend
    const deleteImage = async (imagePath: string) => {
        if (!imagePath) return;
        try {
            await fetch('http://localhost:3001/api/upload/image', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: imagePath }),
            });
        } catch (err) {
            console.error('Failed to delete image:', err);
        }
    };

    // Function to upload image to backend
    const uploadImage = async (base64Image: string, type: string = 'banner'): Promise<string> => {
        try {
            const response = await fetch('http://localhost:3001/api/upload/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image, type }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to upload image');
            return data.path;
        } catch (err: any) {
            console.error('Image upload error:', err);
            throw err;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let bannerImageUrl = bannerImage;
            if (bannerImage && bannerImage.startsWith('data:')) {
                bannerImageUrl = await uploadImage(bannerImage, 'banner');
            }

            const response = await fetch('http://localhost:3001/api/homecontent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, bannerImage: bannerImageUrl })
            });

            if (response.ok) {
                alert('Home content updated successfully');
                // Update local state with new URL if uploaded
                if (bannerImageUrl !== bannerImage) {
                    setBannerImage(bannerImageUrl);
                }
            } else {
                alert('Failed to update home content');
            }
        } catch (err) {
            console.error('Error updating home content:', err);
            alert('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-screen">Loading...</div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Manage Home Content</h1>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-6">

                        {/* Banner Image */}
                        <BannerImage
                            label="Banner Image"
                            imageUrl={bannerImage}
                            imageAlt={bannerImageAlt}
                            imageCaption={bannerImageCaption}
                            onImageSelect={(file) => {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    const base64 = event.target?.result as string;
                                    setBannerImage(base64);
                                };
                                reader.readAsDataURL(file);
                            }}
                            onImageRemove={async () => {
                                await deleteImage(bannerImage);
                                setBannerImage('');
                            }}
                            onAltChange={setBannerImageAlt}
                            onCaptionChange={setBannerImageCaption}
                            helperText="PNG, JPG up to 5MB"
                            disabled={saving}
                        />

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Content
                            </label>
                            <RichTextEditor
                                content={content}
                                onChange={setContent}
                                placeholder="Enter home page content..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-primary hover:bg-primary/90 text-white"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
