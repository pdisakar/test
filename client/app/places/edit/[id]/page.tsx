'use client';

import { MainLayout } from '@/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, ChevronDown, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ImageCrop, ImageCropContent, ImageCropApply, ImageCropReset } from '@/components/ImageCrop';
import { FeaturedImage } from '@/components/FeaturedImage';
import { BannerImage } from '@/components/BannerImage';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

const slugify = (text: string) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

interface Place {
    id: number;
    title: string;
    parentId: number | null;
    children?: Place[];
}

export default function EditPlacePage() {
    const router = useRouter();
    const params = useParams();
    const placeId = params.id as string;

    const [formData, setFormData] = useState({
        title: '',
        urlTitle: '',
        slug: '',
        description: '',
        status: false,
        parentId: [] as string[],
        metaTitle: '',
        metaInfo: '',
        metaKeywords: '',
        metaDescription: '',
        featuredImage: '',
        featuredImageAlt: '',
        featuredImageCaption: '',
        bannerImageUrl: '',
        bannerImageAlt: '',
        bannerImageCaption: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [showImageCrop, setShowImageCrop] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showAccordion, setShowAccordion] = useState(false);
    const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());
    const [parentOptions, setParentOptions] = useState<Place[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) router.push('/login');
    }, [router]);

    useEffect(() => {
        const fetchParents = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/places');
                const data = await res.json();
                if (Array.isArray(data)) {
                    const getDescendantIds = (places: Place[], parentId: number): number[] => {
                        const descendants: number[] = [];
                        const children = places.filter(p => p.parentId === parentId);
                        children.forEach(child => {
                            descendants.push(child.id);
                            descendants.push(...getDescendantIds(places, child.id));
                        });
                        return descendants;
                    };

                    const currentId = parseInt(placeId);
                    const descendantIds = getDescendantIds(data, currentId);

                    setParentOptions(data.filter((p: Place) =>
                        p.id !== currentId && !descendantIds.includes(p.id)
                    ));
                }
            } catch (e) {
                console.error('Failed to fetch parent places', e);
            }
        };
        fetchParents();
    }, [placeId]);

    useEffect(() => {
        if (placeId) {
            fetchPlace();
        }
    }, [placeId]);

    const fetchPlace = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`http://localhost:3001/api/places/${placeId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch place');
            }

            setFormData({
                title: data.place.title || '',
                urlTitle: data.place.urlTitle || '',
                slug: data.place.slug || '',
                description: data.place.description || '',
                status: Boolean(data.place.status === 1 || data.place.status === true),
                parentId: data.place.parentId ? [String(data.place.parentId)] : [],
                metaTitle: data.place.metaTitle || '',
                metaInfo: data.place.metaInfo || '',
                metaKeywords: data.place.metaKeywords || '',
                metaDescription: data.place.metaDescription || '',
                featuredImage: data.place.featuredImage || '',
                featuredImageAlt: data.place.featuredImageAlt || '',
                featuredImageCaption: data.place.featuredImageCaption || '',
                bannerImageUrl: data.place.bannerImage || '',
                bannerImageAlt: data.place.bannerImageAlt || '',
                bannerImageCaption: data.place.bannerImageCaption || '',
            });
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching place data');
        } finally {
            setLoading(false);
        }
    };

    const organizePlaces = (places: Place[]): Place[] => {
        const placeMap = new Map<number, Place>();
        const roots: Place[] = [];

        places.forEach(place => {
            placeMap.set(place.id, { ...place, children: [] });
        });

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

    const toggleParent = (id: number) => {
        const newExpanded = new Set(expandedParents);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedParents(newExpanded);
    };

    const renderParentOption = (place: Place, depth: number = 0): React.JSX.Element => {
        const hasChildren = place.children && place.children.length > 0;
        const isExpanded = expandedParents.has(place.id);
        const isSelected = formData.parentId.includes(String(place.id));

        return (
            <React.Fragment key={place.id}>
                <div
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    style={{ paddingLeft: `${depth * 24 + 12}px` }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleParent(place.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
                            )}
                        </button>
                    ) : (
                        <div className="w-6" />
                    )}
                    <div
                        className="flex-1"
                        onClick={() => {
                            const placeIdStr = String(place.id);
                            if (formData.parentId.includes(placeIdStr)) {
                                setFormData({ ...formData, parentId: formData.parentId.filter((id: string) => id !== placeIdStr) });
                            } else {
                                setFormData({ ...formData, parentId: [...formData.parentId, placeIdStr] });
                            }
                        }}
                    >
                        <span className="text-sm text-gray-900 dark:text-white">{place.title}</span>
                    </div>
                </div>
                {isExpanded && place.children?.map((child) => renderParentOption(child, depth + 1))}
            </React.Fragment>
        );
    };

    useEffect(() => {
        if (formData.urlTitle) {
            setFormData((prev) => ({ ...prev, slug: slugify(formData.urlTitle) }));
        }
    }, [formData.urlTitle]);

    const uploadImage = async (base64Image: string, type: string = 'featured'): Promise<string> => {
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

    const validateForm = () => {
        if (!formData.title.trim()) {
            setError('Title is required');
            return false;
        }
        return true;
    };

    const deleteImage = async (imageUrl: string) => {
        if (!imageUrl) return;
        // Don't delete if it's a base64 image (not yet uploaded)
        if (imageUrl.startsWith('data:')) return;
        try {
            await fetch('http://localhost:3001/api/upload/image', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: imageUrl }),
            });
        } catch (err) {
            console.error('Failed to delete image:', err);
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        router.push('/places');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            // Upload images if they are base64
            let featuredImageUrl = formData.featuredImage;
            if (formData.featuredImage && formData.featuredImage.startsWith('data:')) {
                featuredImageUrl = await uploadImage(formData.featuredImage, 'featured');
            }

            let bannerImageUrl = formData.bannerImageUrl;
            if (formData.bannerImageUrl && formData.bannerImageUrl.startsWith('data:')) {
                bannerImageUrl = await uploadImage(formData.bannerImageUrl, 'banner');
            }

            const payload = {
                title: formData.title,
                urlTitle: formData.urlTitle,
                slug: formData.slug,
                parentId: formData.parentId.length > 0 ? parseInt(formData.parentId[0]) : null,
                metaTitle: formData.metaTitle,
                metaKeywords: formData.metaKeywords,
                metaDescription: formData.metaDescription,
                description: formData.description,
                featuredImage: featuredImageUrl,
                featuredImageAlt: formData.featuredImageAlt,
                featuredImageCaption: formData.featuredImageCaption,
                bannerImage: bannerImageUrl,
                bannerImageAlt: formData.bannerImageAlt,
                bannerImageCaption: formData.bannerImageCaption,
                status: formData.status ? 1 : 0,
            };

            const response = await fetch(`http://localhost:3001/api/places/${placeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update place');
            }

            setShowSuccessModal(true);
        } catch (err: any) {
            setError(err.message || 'An error occurred while updating the place');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        router.push('/places');
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-1 transition-all duration-300 flex items-center justify-center h-full">
                    <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading place...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Place</h1>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <Button onClick={handleDiscard} variant="outline" className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" disabled={saving}>Discard</Button>
                        <Button onClick={handleSubmit} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white" disabled={saving}>
                            {saving ? 'Updating...' : 'Update'}
                        </Button>
                    </div>
                </div>
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
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title <span className="text-red-500">*</span></label>
                                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Place Title" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required disabled={saving} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL Title</label>
                                    <input type="text" value={formData.urlTitle} onChange={e => setFormData({ ...formData, urlTitle: e.target.value })} placeholder="url-friendly-title" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled={saving} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slug (Auto-generated)</label>
                                    <input type="text" value={formData.slug} readOnly className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 outline-none transition-all cursor-not-allowed" disabled />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Parent Place(s)</label>
                                    <div
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 cursor-pointer"
                                        onClick={() => setShowAccordion(!showAccordion)}
                                    >
                                        <div className="py-2.5 px-4 flex items-center justify-between">
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {formData.parentId.length === 0 ? (
                                                    <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">None (Top Level)</span>
                                                ) : (
                                                    <span>
                                                        {formData.parentId.map((id) => {
                                                            const findPlace = (places: any[]): any => {
                                                                for (const place of places) {
                                                                    if (String(place.id) === id) return place;
                                                                    if (place.children) {
                                                                        const found = findPlace(place.children);
                                                                        if (found) return found;
                                                                    }
                                                                }
                                                                return null;
                                                            };
                                                            const place = findPlace(organizePlaces(parentOptions));
                                                            return place?.title || id;
                                                        }).join(', ')}
                                                    </span>
                                                )}
                                            </span>
                                            {showAccordion ? (
                                                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
                                            )}
                                        </div>
                                        {showAccordion && (
                                            <div className="border-t border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                                <div
                                                    className={`py-2 px-3 cursor-pointer transition-colors ${formData.parentId.length === 0 ? 'bg-primary/10 border-t border-b border-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                        }`}
                                                    onClick={() => setFormData({ ...formData, parentId: [] })}
                                                >
                                                    <span className="text-sm text-gray-900 dark:text-white font-medium">None (Top Level)</span>
                                                </div>
                                                {organizePlaces(parentOptions).map((place) => renderParentOption(place))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                                    <div className="flex items-center gap-3 h-[42px]">
                                        <Switch
                                            checked={formData.status}
                                            onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                                            disabled={saving}
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                                            {formData.status ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Meta Information</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meta Title</label>
                                        <input type="text" value={formData.metaTitle} onChange={e => setFormData({ ...formData, metaTitle: e.target.value })} placeholder="Meta title for SEO" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled={saving} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meta Keywords</label>
                                        <input type="text" value={formData.metaKeywords} onChange={e => setFormData({ ...formData, metaKeywords: e.target.value })} placeholder="keyword1, keyword2, keyword3" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled={saving} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meta Description</label>
                                        <textarea value={formData.metaDescription} onChange={e => setFormData({ ...formData, metaDescription: e.target.value })} placeholder="Meta description for SEO..." rows={3} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" disabled={saving} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                <RichTextEditor
                                    content={formData.description}
                                    onChange={(content) => setFormData({ ...formData, description: content })}
                                    placeholder="Place content..."
                                />
                            </div>
                            <FeaturedImage
                                label="Featured Image"
                                imageUrl={formData.featuredImage}
                                imageAlt={formData.featuredImageAlt}
                                imageCaption={formData.featuredImageCaption}
                                onImageSelect={(file) => {
                                    setSelectedImageFile(file);
                                    setShowImageCrop(true);
                                }}
                                onImageRemove={async () => {
                                    await deleteImage(formData.featuredImage);
                                    setFormData({ ...formData, featuredImage: '' });
                                }}
                                onAltChange={(value) => setFormData({ ...formData, featuredImageAlt: value })}
                                onCaptionChange={(value) => setFormData({ ...formData, featuredImageCaption: value })}
                                helperText="PNG, JPG up to 5MB"
                                disabled={saving}
                            />

                            <BannerImage
                                label="Banner Image"
                                imageUrl={formData.bannerImageUrl}
                                imageAlt={formData.bannerImageAlt}
                                imageCaption={formData.bannerImageCaption}
                                onImageSelect={(file) => {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        const base64 = event.target?.result as string;
                                        setFormData({ ...formData, bannerImageUrl: base64 });
                                    };
                                    reader.readAsDataURL(file);
                                }}
                                onImageRemove={async () => {
                                    await deleteImage(formData.bannerImageUrl);
                                    setFormData({ ...formData, bannerImageUrl: '' });
                                }}
                                onAltChange={(value) => setFormData({ ...formData, bannerImageAlt: value })}
                                onCaptionChange={(value) => setFormData({ ...formData, bannerImageCaption: value })}
                                helperText="PNG, JPG up to 5MB (no aspect ratio)"
                                disabled={saving}
                            />
                        </div>
                    </form>
                </div>
            </div>


            {showImageCrop && selectedImageFile && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Crop Image</h3>
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
                                    setFormData({ ...formData, featuredImage: croppedImage });
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
                                Place has been updated successfully.
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
