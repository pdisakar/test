'use client';

import { Sidebar } from '@/components/Sidebar';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, ChevronDown, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ImageCrop, ImageCropContent, ImageCropApply, ImageCropReset } from '@/components/ImageCrop';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

// Simple slug generator
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

interface place {
  id: number;
  title: string;
  parentId: number | null;
  children?: place[];
}

export default function AddplacePage() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [showAccordion, setShowAccordion] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());
  const [parentOptions, setParentOptions] = useState<place[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) router.push('/login');
  }, [router]);

  // Fetch parent places
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/places');
        const data = await res.json();
        if (Array.isArray(data)) {
          setParentOptions(data);
        }
      } catch (e) {
        console.error('Failed to fetch parent places', e);
      }
    };
    fetchParents();
  }, []);

  // Organize places into tree structure
  const organizeplaces = (places: place[]): place[] => {
    const placeMap = new Map<number, place>();
    const roots: place[] = [];

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

  const renderParentOption = (place: place, depth: number = 0): React.JSX.Element => {
    const hasChildren = place.children && place.children.length > 0;
    const isExpanded = expandedParents.has(place.id);
    const isSelected = formData.parentId.includes(String(place.id));

    return (
      <React.Fragment key={place.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-gray-50'
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
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
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
            <span className="text-sm text-gray-900">{place.title}</span>
          </div>
        </div>
        {isExpanded && place.children?.map((child) => renderParentOption(child, depth + 1))}
      </React.Fragment>
    );
  };

  // Generate slug when URL title changes
  useEffect(() => {
    if (formData.urlTitle) {
      setFormData((prev) => ({ ...prev, slug: slugify(formData.urlTitle) }));
    }
  }, [formData.urlTitle]);

  const handleClearForm = () => {
    setFormData({
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
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.title.trim()) { setError('Title is required'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Prepare payload with correct field names
      const payload = {
        title: formData.title,
        urlTitle: formData.urlTitle,
        slug: formData.slug,
        parentId: formData.parentId.length > 0 ? parseInt(formData.parentId[0]) : null,
        metaTitle: formData.metaTitle,
        metaKeywords: formData.metaKeywords,
        metaDescription: formData.metaDescription,
        description: formData.description,
        featuredImage: formData.featuredImage,
        featuredImageAlt: formData.featuredImageAlt,
        featuredImageCaption: formData.featuredImageCaption,
        bannerImage: formData.bannerImageUrl,
        bannerImageAlt: formData.bannerImageAlt,
        bannerImageCaption: formData.bannerImageCaption,
        status: formData.status ? 1 : 0,
      };
      const response = await fetch('http://localhost:3001/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create place');
      setSuccess('place created successfully!');
      setTimeout(() => router.push('/places'), 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the place');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (base64Image: string): Promise<string> => {
    try {
      const response = await fetch('http://localhost:3001/api/upload/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, type: 'featured' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to upload image');
      return data.path; // Returns /uploads/featured-123456.png
    } catch (err: any) {
      console.error('Image upload error:', err);
      throw err;
    }
  };

  const handleDiscard = () => router.push('/places');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300 w-full">
        <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <h1 className="text-3xl font-bold text-gray-900">Add place</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button onClick={handleClearForm} variant="outline" className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50" disabled={loading}>Clear Form</Button>
              <Button onClick={handleDiscard} variant="outline" className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50" disabled={loading}>Discard</Button>
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
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="place Title" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required disabled={loading} />
                  </div>
                  {/* URL Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Title <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.urlTitle} onChange={e => setFormData({ ...formData, urlTitle: e.target.value })} placeholder="place URL Title" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required disabled={loading} />
                  </div>
                  {/* Slug (auto) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                    <input type="text" value={formData.slug} readOnly className="w-full px-4 py-2.5 rounded-lg bg-gray-100 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled />
                  </div>
                  {/* Parent place */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parent place(s)</label>
                    <div
                      className="border border-gray-200 rounded-lg bg-white cursor-pointer"
                      onClick={() => setShowAccordion(!showAccordion)}
                    >
                      <div className="py-2.5 px-4 flex items-center justify-between">
                        <span className="text-sm text-gray-900">
                          {formData.parentId.length === 0 ? (
                            <span className="text-gray-500">None (Top Level)</span>
                          ) : (
                            <span>
                              {formData.parentId.map((id) => {
                                const findplace = (places: any[]): any => {
                                  for (const place of places) {
                                    if (String(place.id) === id) return place;
                                    if (place.children) {
                                      const found = findplace(place.children);
                                      if (found) return found;
                                    }
                                  }
                                  return null;
                                };
                                const place = findplace(organizeplaces(parentOptions));
                                return place?.title || id;
                              }).join(', ')}
                            </span>
                          )}
                        </span>
                        {showAccordion ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      {showAccordion && (
                        <div className="border-t border-gray-200 max-h-64 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          <div
                            className={`py-2 px-3 cursor-pointer transition-colors ${formData.parentId.length === 0 ? 'bg-primary/10 border-t border-b border-primary' : 'hover:bg-gray-50'
                              }`}
                            onClick={() => setFormData({ ...formData, parentId: [] })}
                          >
                            <span className="text-sm text-gray-900 font-medium">None (Top Level)</span>
                          </div>
                          {organizeplaces(parentOptions).map((place) => renderParentOption(place))}
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="flex items-center gap-3 h-[42px]">
                      <Switch
                        checked={formData.status}
                        onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-600">
                        {formData.status ? 'Active' : 'Not Active'}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Meta Information */}
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Meta Information</h3>
                  <div className="space-y-6">
                    {/* Meta Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                      <input type="text" value={formData.metaTitle} onChange={e => setFormData({ ...formData, metaTitle: e.target.value })} placeholder="Meta title for SEO" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled={loading} />
                    </div>
                    {/* Meta Keywords */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords</label>
                      <input type="text" value={formData.metaKeywords} onChange={e => setFormData({ ...formData, metaKeywords: e.target.value })} placeholder="keyword1, keyword2, keyword3" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled={loading} />
                    </div>
                    {/* Meta Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                      <textarea value={formData.metaDescription} onChange={e => setFormData({ ...formData, metaDescription: e.target.value })} placeholder="Meta description for SEO..." rows={3} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" disabled={loading} />
                    </div>
                  </div>
                </div>
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <RichTextEditor
                    content={formData.description}
                    onChange={(content) => setFormData({ ...formData, description: content })}
                    placeholder="place content..."
                  />
                </div>
                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
                  <div className="space-y-3">
                    {formData.featuredImage ? (
                      <div className="relative">
                        <img
                          src={`http://localhost:3001${formData.featuredImage}`}
                          alt="Featured preview"
                          className="max-w-full h-auto rounded-lg border border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, featuredImage: '' })}
                          className="mt-2"
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <input
                          type="file"
                          id="featured-image-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedImageFile(file);
                              setShowImageCrop(true);
                            }
                          }}
                          disabled={loading}
                        />
                        <label
                          htmlFor="featured-image-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Click to upload image</span>
                          <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image Alt Text</label>
                  <input type="text" value={formData.featuredImageAlt} onChange={e => setFormData({ ...formData, featuredImageAlt: e.target.value })} placeholder="Alt text for image" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image Caption</label>
                  <input type="text" value={formData.featuredImageCaption} onChange={e => setFormData({ ...formData, featuredImageCaption: e.target.value })} placeholder="Caption for image" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" disabled={loading} />
                </div>

                {/* Banner Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                  <div className="space-y-3">
                    {formData.bannerImageUrl ? (
                      <div className="relative">
                        <img
                          src={`http://localhost:3001${formData.bannerImageUrl}`}
                          alt="Banner preview"
                          className="max-w-full h-auto rounded-lg border border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, bannerImageUrl: '' })}
                          className="mt-2"
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <input
                          type="file"
                          id="banner-image-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                // Convert to base64
                                const reader = new FileReader();
                                reader.onload = async (event) => {
                                  const base64 = event.target?.result as string;
                                  try {
                                    // Upload to server
                                    const response = await fetch('http://localhost:3001/api/upload/image', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ image: base64, type: 'banner' }),
                                    });
                                    const data = await response.json();
                                    if (response.ok) {
                                      setFormData({ ...formData, bannerImageUrl: data.path });
                                    } else {
                                      setError('Failed to upload banner image');
                                    }
                                  } catch (err) {
                                    setError('Failed to upload banner image');
                                  }
                                };
                                reader.readAsDataURL(file);
                              } catch (err) {
                                setError('Failed to process banner image');
                              }
                            }
                          }}
                          disabled={loading}
                        />
                        <label
                          htmlFor="banner-image-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Click to upload banner image</span>
                          <span className="text-xs text-gray-500">PNG, JPG up to 5MB (no cropping)</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image Alt Text</label>
                  <input type="text" value={formData.bannerImageAlt} onChange={e => setFormData({ ...formData, bannerImageAlt: e.target.value })} placeholder="Alt text for banner image" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image Caption</label>
                  <input type="text" value={formData.bannerImageCaption} onChange={e => setFormData({ ...formData, bannerImageCaption: e.target.value })} placeholder="Caption for banner image" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled={loading} />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      {showImageCrop && selectedImageFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Crop Image</h3>
              <button
                onClick={() => {
                  setShowImageCrop(false);
                  setSelectedImageFile(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ImageCrop
              file={selectedImageFile}
              aspect={9 / 12}
              onCrop={async (croppedImage) => {
                try {
                  // Upload image to server
                  const imagePath = await uploadImage(croppedImage);
                  setFormData({ ...formData, featuredImage: imagePath });
                  setShowImageCrop(false);
                  setSelectedImageFile(null);
                } catch (err) {
                  setError('Failed to upload image. Please try again.');
                  setShowImageCrop(false);
                  setSelectedImageFile(null);
                }
              }}
            >
              <div className="space-y-4">
                <ImageCropContent className="border border-gray-200 rounded" />
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
    </div>
  );
}
