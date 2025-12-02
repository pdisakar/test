'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { Switch } from '@/app/admin/components/ui/switch';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ImageCrop, ImageCropContent, ImageCropApply, ImageCropReset } from '@/app/admin/components/ImageCrop';
import { FeaturedImage } from '@/app/admin/components/FeaturedImage';
import { BannerImage } from '@/app/admin/components/BannerImage';

const RichTextEditor = dynamic(() => import('@/app/admin/components/RichTextEditor'), { ssr: false });

const slugify = (text: string) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export default function AddTeamPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        urlTitle: '',
        slug: '',
        email: '',
        description: '',
        status: false,
        avatar: '',
        avatarAlt: '',
        avatarCaption: '',
        bannerImage: '',
        bannerImageAlt: '',
        bannerImageCaption: '',
        metaTitle: '',
        metaKeywords: '',
        metaDescription: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [showImageCrop, setShowImageCrop] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) router.push('/login');
    }, [router]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            fullName: e.target.value
        }));
    };

    const handleUrlTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const urlTitle = e.target.value;
        setFormData(prev => ({
            ...prev,
            urlTitle: urlTitle,
            slug: slugify(urlTitle)
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Function to delete image from backend
    const deleteImage = async (imagePath: string) => {
        if (!imagePath) return;
        // Don't delete if it's a base64 image (not yet uploaded)
        if (imagePath.startsWith('data:')) return;
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

    // Update slug when URL Title changes manually
    useEffect(() => {
        if (formData.urlTitle) {
            setFormData(prev => ({ ...prev, slug: slugify(formData.urlTitle) }));
        }
    }, [formData.urlTitle]);

    const handleClearForm = () => {
        setFormData({
            fullName: '',
            urlTitle: '',
            slug: '',
            email: '',
            description: '',
            status: false,
            avatar: '',
            avatarAlt: '',
            avatarCaption: '',
            bannerImage: '',
            bannerImageAlt: '',
            bannerImageCaption: '',
            metaTitle: '',
            metaKeywords: '',
            metaDescription: '',
        });
        setError('');
        setSuccess('');
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const uploadImage = async (file: File): Promise<string> => {
        const base64 = await fileToBase64(file);
        const res = await fetch('http://localhost:3001/api/upload/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
        });
        if (!res.ok) throw new Error('Image upload failed');
        const data = await res.json();
        return data.path;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const uploadedImagePaths: string[] = [];

        try {
            if (!formData.fullName || !formData.urlTitle || !formData.slug || !formData.email) {
                setError('Full Name, URL Title, Slug, and Email are required');
                setLoading(false);
                return;
            }

            let avatarUrl = formData.avatar;
            if (formData.avatar && formData.avatar.startsWith('data:')) {
                const blob = await fetch(formData.avatar).then(r => r.blob());
                const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
                avatarUrl = await uploadImage(file);
                uploadedImagePaths.push(avatarUrl);
            }

            let bannerUrl = formData.bannerImage;
            if (formData.bannerImage && formData.bannerImage.startsWith('data:')) {
                const blob = await fetch(formData.bannerImage).then(r => r.blob());
                const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
                bannerUrl = await uploadImage(file);
                uploadedImagePaths.push(bannerUrl);
            }

            const payload = {
                fullName: formData.fullName,
                urlTitle: formData.urlTitle,
                slug: formData.slug,
                email: formData.email,
                description: formData.description,
                avatar: avatarUrl,
                avatarAlt: formData.avatarAlt,
                avatarCaption: formData.avatarCaption,
                bannerImage: bannerUrl,
                bannerImageAlt: formData.bannerImageAlt,
                bannerImageCaption: formData.bannerImageCaption,
                meta: {
                  title: formData.metaTitle,
                  keywords: formData.metaKeywords,
                  description: formData.metaDescription
                },
                status: formData.status ? 1 : 0,
            };

            const res = await fetch('http://localhost:3001/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                // Cleanup uploaded images if server validation failed
                if (uploadedImagePaths.length > 0) {
                    console.log('Cleaning up uploaded images due to server error...');
                    await Promise.all(uploadedImagePaths.map(async (path: string) => {
                        try {
                            await deleteImage(path);
                        } catch (cleanupErr) {
                            console.error('Failed to cleanup image:', path, cleanupErr);
                        }
                    }));
                }
                setError(data.message || 'Failed to create team member');
                setLoading(false);
                return;
            }

            setShowSuccessModal(true);
            setTimeout(() => {
                setShowSuccessModal(false);
                router.push('/admin/teams');
            }, 1500);
        } catch (err: any) {
            console.error('Error:', err);
            setError('An error occurred while creating the team member');

            // Cleanup uploaded images if an exception occurred
            if (uploadedImagePaths.length > 0) {
                console.log('Cleaning up uploaded images due to exception...');
                await Promise.all(uploadedImagePaths.map(async (path: string) => {
                    try {
                        await deleteImage(path);
                    } catch (cleanupErr) {
                        console.error('Failed to cleanup image:', path, cleanupErr);
                    }
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        router.push('/admin/teams');
    };

    const handleDiscard = () => router.push('/admin/teams');

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Team Member</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <Button onClick={handleClearForm} variant="outline" className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" disabled={loading}>Clear Form</Button>
                            <Button onClick={handleDiscard} variant="outline" className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" disabled={loading}>Discard</Button>
                            <Button onClick={handleSubmit} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white" disabled={loading}>
                                {loading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="space-y-8">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Full Name */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleNameChange}
                                            placeholder="e.g. John Doe"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* URL Title */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL Title <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="urlTitle"
                                            value={formData.urlTitle}
                                            onChange={handleUrlTitleChange}
                                            placeholder="e.g. john-doe-profile"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Slug (auto) */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slug</label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            readOnly
                                            placeholder="Auto-generated from URL Title"
                                            className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            disabled
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="e.g. john@example.com"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                                        <div className="flex items-center gap-3 h-[42px]">
                                            <Switch
                                                checked={formData.status}
                                                onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                                                {formData.status ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Meta Information */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Meta Information</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meta Title</label>
                                            <input
                                                type="text"
                                                name="metaTitle"
                                                value={formData.metaTitle}
                                                onChange={handleChange}
                                                placeholder="SEO Title"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meta Keywords</label>
                                            <input
                                                type="text"
                                                name="metaKeywords"
                                                value={formData.metaKeywords}
                                                onChange={handleChange}
                                                placeholder="keyword1, keyword2, keyword3"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meta Description</label>
                                            <textarea
                                                name="metaDescription"
                                                value={formData.metaDescription}
                                                onChange={handleChange}
                                                rows={3}
                                                placeholder="Brief description for search engines..."
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                    <RichTextEditor
                                        content={formData.description}
                                        onChange={(content) => setFormData({ ...formData, description: content })}
                                    />
                                </div>

                                {/* Avatar */}
                                <FeaturedImage
                                    label="Avatar"
                                    imageUrl={formData.avatar}
                                    imageAlt={formData.avatarAlt}
                                    imageCaption={formData.avatarCaption}
                                    onImageSelect={(file) => {
                                        setSelectedImageFile(file);
                                        setShowImageCrop(true);
                                    }}
                                    onImageRemove={async () => {
                                        await deleteImage(formData.avatar);
                                        setFormData(prev => ({ ...prev, avatar: '' }));
                                    }}
                                    onAltChange={(alt) => setFormData(prev => ({ ...prev, avatarAlt: alt }))}
                                    onCaptionChange={(cap) => setFormData(prev => ({ ...prev, avatarCaption: cap }))}
                                />

                                {/* Banner Image */}
                                <BannerImage
                                    label="Banner Image"
                                    imageUrl={formData.bannerImage}
                                    imageAlt={formData.bannerImageAlt}
                                    imageCaption={formData.bannerImageCaption}
                                    onImageSelect={(file) => {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setFormData(prev => ({ ...prev, bannerImage: reader.result as string }));
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                    onImageRemove={async () => {
                                        await deleteImage(formData.bannerImage);
                                        setFormData(prev => ({ ...prev, bannerImage: '' }));
                                    }}
                                    onAltChange={(alt) => setFormData(prev => ({ ...prev, bannerImageAlt: alt }))}
                                    onCaptionChange={(cap) => setFormData(prev => ({ ...prev, bannerImageCaption: cap }))}
                                />

                            </div>
                        </form>
                    </div>
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
                                Team member has been created successfully.
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

            {/* Image Crop Modal */}
            {showImageCrop && selectedImageFile && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Crop Avatar</h3>
                            <button
                                onClick={() => {
                                    setShowImageCrop(false);
                                    setSelectedImageFile(null);
                                }}
                                className="p-1 hover:bg-gray-100 dark:bg-gray-800 rounded"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <ImageCrop
                            file={selectedImageFile}
                            onCrop={async (croppedImage) => {
                                try {
                                    setFormData({ ...formData, avatar: croppedImage });
                                    setShowImageCrop(false);
                                    setSelectedImageFile(null);
                                } catch (err) {
                                    setError('Failed to process image. Please try again.');
                                    setShowImageCrop(false);
                                    setSelectedImageFile(null);
                                }
                            }}
                        >
                            <div className="space-y-4">
                                <ImageCropContent className="border border-gray-200 dark:border-gray-700 rounded" />
                                <div className="flex gap-2 justify-end">
                                    <ImageCropReset asChild>
                                        <Button variant="outline" type="button">
                                            Reset
                                        </Button>
                                    </ImageCropReset>
                                    <ImageCropApply asChild>
                                        <Button type="button">Apply Crop</Button>
                                    </ImageCropApply>
                                </div>
                            </div>
                        </ImageCrop>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
