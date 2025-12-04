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
import { ASPECT_RATIOS, DISPLAY_ASPECT_RATIOS } from '@/app/admin/lib/aspect-ratios';
import { COUNTRIES } from '@/app/admin/lib/countries';
import { Star } from 'lucide-react';
import { getApiUrl, getImageUrl } from '@/app/admin/lib/api-config';

const RichTextEditor = dynamic(() => import('@/app/admin/components/RichTextEditor'), { ssr: false });

const slugify = (text: string) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const CREDITS = [
    "Facebook", "TripAdvisor", "Google", "Trustpilot", "Direct", "Other"
];

export default function AddTestimonialPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        reviewTitle: '',
        urlTitle: '',
        slug: '',
        fullName: '',
        address: '',
        packageId: '',
        teamId: '',
        date: new Date().toISOString().split('T')[0],
        credit: 'Google',
        rating: 5,
        status: false,
        isFeatured: false,
        description: '',
        metaTitle: '',
        metaKeywords: '',
        metaDescription: '',
        avatar: '',
        avatarAlt: '',
        avatarCaption: '',
    });

    const [packages, setPackages] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [showImageCrop, setShowImageCrop] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) router.push('/login');

        // Fetch packages and teams
        const fetchData = async () => {
            try {
                const [packagesRes, teamsRes] = await Promise.all([
                    fetch(getApiUrl('packages?limit=100')),
                    fetch(getApiUrl('teams'))
                ]);

                if (packagesRes.ok) {
                    const packagesData = await packagesRes.json();
                    // Handle the response structure { success: true, packages: [...] }
                    if (packagesData.success && Array.isArray(packagesData.packages)) {
                        setPackages(packagesData.packages);
                    } else if (Array.isArray(packagesData)) {
                        setPackages(packagesData);
                    } else {
                        setPackages([]);
                    }
                }

                if (teamsRes.ok) {
                    const teamsData = await teamsRes.json();
                    setTeams(Array.isArray(teamsData) ? teamsData : []);
                }
            } catch (err) {
                console.error('Error fetching dropdown data:', err);
            }
        };

        fetchData();
    }, [router]);

    // Update slug when URL Title changes
    useEffect(() => {
        if (formData.urlTitle) {
            setFormData(prev => ({ ...prev, slug: slugify(formData.urlTitle) }));
        }
    }, [formData.urlTitle]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRatingClick = (rating: number) => {
        setFormData(prev => ({ ...prev, rating }));
    };

    const handleClearForm = () => {
        setFormData({
            reviewTitle: '',
            urlTitle: '',
            slug: '',
            fullName: '',
            address: '',
            packageId: '',
            teamId: '',
            date: new Date().toISOString().split('T')[0],
            credit: 'Google',
            rating: 5,
            status: false,
            isFeatured: false,
            description: '',
            metaTitle: '',
            metaKeywords: '',
            metaDescription: '',
            avatar: '',
            avatarAlt: '',
            avatarCaption: '',
        });
        setError('');
    };

    const deleteImage = async (imagePath: string) => {
        if (!imagePath || imagePath.startsWith('data:')) return;
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

    const uploadImage = async (base64Image: string): Promise<string> => {
        const res = await fetch('http://localhost:3001/api/upload/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, type: 'avatar' }),
        });
        if (!res.ok) throw new Error('Image upload failed');
        const data = await res.json();
        return data.path;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const uploadedImagePaths: string[] = [];

        try {
            if (!formData.reviewTitle || !formData.urlTitle || !formData.slug || !formData.fullName || !formData.date || !formData.metaTitle) {
                setError('Please fill in all required fields');
                setLoading(false);
                return;
            }

            let avatarUrl = formData.avatar;
            if (formData.avatar && formData.avatar.startsWith('data:')) {
                avatarUrl = await uploadImage(formData.avatar);
                uploadedImagePaths.push(avatarUrl);
            }

            const payload = {
                ...formData,
                avatar: avatarUrl,
                packageId: formData.packageId ? parseInt(formData.packageId) : null,
                teamId: formData.teamId ? parseInt(formData.teamId) : null,
                rating: parseInt(formData.rating.toString()),
                status: formData.status ? 1 : 0,
                isFeatured: formData.isFeatured ? 1 : 0,
            };

            const res = await fetch('http://localhost:3001/api/testimonials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                if (uploadedImagePaths.length > 0) {
                    await Promise.all(uploadedImagePaths.map(path => deleteImage(path)));
                }
                throw new Error(data.message || 'Failed to create testimonial');
            }

            setShowSuccessModal(true);
            setTimeout(() => {
                setShowSuccessModal(false);
                router.push('/admin/testimonials');
            }, 1500);
        } catch (err: any) {
            console.error('Error:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDiscard = () => router.push('/admin/testimonials');

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Testimonial</h1>
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
                                    {/* Review Title */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Review Title <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="reviewTitle"
                                            value={formData.reviewTitle}
                                            onChange={handleChange}
                                            placeholder="e.g. Amazing Experience!"
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
                                            onChange={handleChange}
                                            placeholder="e.g. amazing-experience"
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
                                            className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            disabled
                                        />
                                    </div>

                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            placeholder="e.g. John Doe"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Address (Country) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address (Country)</label>
                                        <select
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white dark:bg-gray-900"
                                            disabled={loading}
                                        >
                                            <option value="">Select Country</option>
                                            {COUNTRIES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Select Package */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Package</label>
                                        <select
                                            name="packageId"
                                            value={formData.packageId}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white dark:bg-gray-900"
                                            disabled={loading}
                                        >
                                            <option value="">Select Package</option>
                                            {packages.map((pkg: any) => (
                                                <option key={pkg.id} value={pkg.id}>{pkg.title || pkg.packageTitle || pkg.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Select Team */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Team Member</label>
                                        <select
                                            name="teamId"
                                            value={formData.teamId}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white dark:bg-gray-900"
                                            disabled={loading}
                                        >
                                            <option value="">Select Team Member</option>
                                            {teams.map((t: any) => (
                                                <option key={t.id} value={t.id}>{t.fullName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Credit */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Credit</label>
                                        <select
                                            name="credit"
                                            value={formData.credit}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white dark:bg-gray-900"
                                            disabled={loading}
                                        >
                                            {CREDITS.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => handleRatingClick(star)}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    className="focus:outline-none transition-colors"
                                                    disabled={loading}
                                                >
                                                    <Star
                                                        className={`h-6 w-6 ${star <= (hoverRating || formData.rating)
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300 dark:text-gray-600'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                                ({formData.rating} out of 5)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status & Featured */}
                                    <div className="flex flex-row gap-8">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                                            <div className="flex items-center gap-3 h-[42px]">
                                                <Switch
                                                    checked={formData.status}
                                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked }))}
                                                    disabled={loading}
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                                                    {formData.status ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Featured</label>
                                            <div className="flex items-center gap-3 h-[42px]">
                                                <Switch
                                                    checked={formData.isFeatured}
                                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                                                    disabled={loading}
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                                                    {formData.isFeatured ? 'Featured' : 'Not Featured'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Meta Information */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Meta Information</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meta Title <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="metaTitle"
                                                value={formData.metaTitle}
                                                onChange={handleChange}
                                                placeholder="SEO Title"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                required
                                                disabled={loading}
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
                                                disabled={loading}
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
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                    <RichTextEditor
                                        content={formData.description}
                                        onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
                                    />
                                </div>

                                {/* Avatar */}
                                <FeaturedImage
                                    label="Avatar"
                                    aspectRatio={ASPECT_RATIOS.TESTIMONIAL}
                                    displayAspectRatio={DISPLAY_ASPECT_RATIOS.TESTIMONIAL}
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
                                Testimonial created successfully.
                            </p>
                            <Button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    router.push('/admin/testimonials');
                                }}
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
                            aspect={ASPECT_RATIOS.TESTIMONIAL}
                            onCrop={async (croppedImage) => {
                                try {
                                    setFormData(prev => ({ ...prev, avatar: croppedImage }));
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