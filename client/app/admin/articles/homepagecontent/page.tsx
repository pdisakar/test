'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { BannerImage } from '@/app/admin/components/BannerImage';
import { extractImagePaths, processContentImages, cleanupUnusedImages } from '@/app/admin/lib/richTextHelpers';
import dynamic from 'next/dynamic';
import { getApiUrl, getImageUrl } from '@/app/admin/lib/api-config';

const RichTextEditor = dynamic(() => import('@/app/admin/components/RichTextEditor'), { ssr: false });

export default function HomeContentPage() {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [bannerImage, setBannerImage] = useState('');
    const [bannerImageAlt, setBannerImageAlt] = useState('');
    const [bannerImageCaption, setBannerImageCaption] = useState('');
    const [metaTitle, setMetaTitle] = useState('');
    const [metaKeywords, setMetaKeywords] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [initialRichTextImages, setInitialRichTextImages] = useState<string[]>([]);

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
            const response = await fetch(getApiUrl('homecontent'));
            const data = await response.json();

            if (data) {
                setContent(data.content || '');
                setBannerImage(data.bannerImage || '');
                setMetaTitle(data.meta?.title || '');
                setMetaKeywords(data.meta?.keywords || '');
                setMetaDescription(data.meta?.description || '');

                // Extract initial images from RichTextEditor for cleanup tracking
                const initialImages = extractImagePaths(data.content || '');
                setInitialRichTextImages(initialImages);
            }
        } catch (err) {
            console.error('Error fetching home content:', err);
            setError('Failed to load content');
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

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        let newBannerPath: string | null = null;

        try {
            let bannerImageUrl = bannerImage;
            if (bannerImage && bannerImage.startsWith('data:')) {
                bannerImageUrl = await uploadImage(bannerImage, 'homecontent');
                newBannerPath = bannerImageUrl;
            }

            const processedContent = await processContentImages(content);

            const response = await fetch('http://localhost:3001/api/homecontent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: processedContent,
                    bannerImage: bannerImageUrl,
                    meta: {
                        title: metaTitle,
                        keywords: metaKeywords,
                        description: metaDescription
                    }
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (bannerImageUrl !== bannerImage) {
                    setBannerImage(bannerImageUrl);
                }

                // Perform cleanup of unused images
                const finalImages = extractImagePaths(processedContent);
                await cleanupUnusedImages(initialRichTextImages, finalImages);

                setShowSuccessModal(true);
            } else {
                // Rollback: Delete the uploaded image if the form submission failed
                if (newBannerPath) {
                    await deleteImage(newBannerPath);
                }
                setError(data.message || 'Failed to update home content');
            }
        } catch (err) {
            console.error('Error updating home content:', err);
            // Rollback: Delete the uploaded image if an error occurred
            if (newBannerPath) {
                await deleteImage(newBannerPath);
            }
            setError('An error occurred');
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

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 text-sm">{success}</p>
                        </div>
                    )}

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

                        {/* Meta Information */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO Meta Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        value={metaTitle}
                                        onChange={(e) => setMetaTitle(e.target.value)}
                                        placeholder="SEO Title for homepage"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        disabled={saving}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Meta Keywords
                                    </label>
                                    <input
                                        type="text"
                                        value={metaKeywords}
                                        onChange={(e) => setMetaKeywords(e.target.value)}
                                        placeholder="keyword1, keyword2, keyword3"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        disabled={saving}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Meta Description
                                    </label>
                                    <textarea
                                        value={metaDescription}
                                        onChange={(e) => setMetaDescription(e.target.value)}
                                        rows={3}
                                        placeholder="Brief description for search engines..."
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                        disabled={saving}
                                    />
                                </div>
                            </div>
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

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Success!</h3>
                            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">
                                Home content updated successfully.
                            </p>
                            <Button
                                onClick={handleCloseSuccessModal}
                                className="px-8 py-2 bg-primary hover:bg-primary/90 text-white w-full"
                            >
                                OK
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}