'use client';

import { Sidebar } from '@/components/Sidebar';
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

// Simple slug generator
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

interface Article {
  id: number;
  title: string;
  parentId: number | null;
  children?: Article[];
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

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
  const [parentOptions, setParentOptions] = useState<Article[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) router.push('/login');
  }, [router]);

  // Fetch parent articles
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/articles');
        const data = await res.json();
        if (Array.isArray(data)) {
          // Get all descendant IDs of current article to prevent circular dependencies
          const getDescendantIds = (articles: Article[], parentId: number): number[] => {
            const descendants: number[] = [];
            const children = articles.filter(a => a.parentId === parentId);
            children.forEach(child => {
              descendants.push(child.id);
              descendants.push(...getDescendantIds(articles, child.id));
            });
            return descendants;
          };

          const currentId = parseInt(articleId);
          const descendantIds = getDescendantIds(data, currentId);

          // Filter out current article AND all its descendants from parent options
          setParentOptions(data.filter((a: Article) =>
            a.id !== currentId && !descendantIds.includes(a.id)
          ));
        }
      } catch (e) {
        console.error('Failed to fetch parent articles', e);
      }
    };
    fetchParents();
  }, [articleId]);

  // Fetch article data
  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const fetchArticle = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3001/api/articles/${articleId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch article');
      }

      setFormData({
        title: data.article.title || '',
        urlTitle: data.article.urlTitle || '',
        slug: data.article.slug || '',
        description: data.article.description || '',
        status: Boolean(data.article.status === 1 || data.article.status === true),
        parentId: data.article.parentId ? [String(data.article.parentId)] : [],
        metaTitle: data.article.metaTitle || '',
        metaInfo: data.article.metaInfo || '',
        metaKeywords: data.article.metaKeywords || '',
        metaDescription: data.article.metaDescription || '',
        featuredImage: data.article.featuredImage || '',
        featuredImageAlt: data.article.featuredImageAlt || '',
        featuredImageCaption: data.article.featuredImageCaption || '',
        bannerImageUrl: data.article.bannerImage || '',
        bannerImageAlt: data.article.bannerImageAlt || '',
        bannerImageCaption: data.article.bannerImageCaption || '',
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching article data');
    } finally {
      setLoading(false);
    }
  };

  // Organize articles into tree structure
  const organizeArticles = (articles: Article[]): Article[] => {
    const articleMap = new Map<number, Article>();
    const roots: Article[] = [];

    articles.forEach(article => {
      articleMap.set(article.id, { ...article, children: [] });
    });

    articles.forEach(article => {
      const node = articleMap.get(article.id)!;
      if (article.parentId && articleMap.has(article.parentId)) {
        const parent = articleMap.get(article.parentId)!;
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

  const renderParentOption = (article: Article, depth: number = 0): React.JSX.Element => {
    const hasChildren = article.children && article.children.length > 0;
    const isExpanded = expandedParents.has(article.id);
    const isSelected = formData.parentId.includes(String(article.id));

    return (
      <React.Fragment key={article.id}>
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
                toggleParent(article.id);
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
              const articleIdStr = String(article.id);
              if (formData.parentId.includes(articleIdStr)) {
                setFormData({ ...formData, parentId: formData.parentId.filter((id: string) => id !== articleIdStr) });
              } else {
                setFormData({ ...formData, parentId: [...formData.parentId, articleIdStr] });
              }
            }}
          >
            <span className="text-sm text-gray-900">{article.title}</span>
          </div>
        </div>
        {isExpanded && article.children?.map((child) => renderParentOption(child, depth + 1))}
      </React.Fragment>
    );
  };

  // Generate slug when URL title changes
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

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    return true;
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push('/articles');
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

      const response = await fetch(`http://localhost:3001/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update article');
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the article');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    router.push('/articles');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 transition-all duration-300 flex items-center justify-center">
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300 w-full">
        <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <h1 className="text-3xl font-bold text-gray-900">Edit Article</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button onClick={handleDiscard} variant="outline" className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50" disabled={saving}>Discard</Button>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-8">
                {/* Main Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Article Title" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required disabled={saving} />
                  </div>
                  {/* URL Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Title</label>
                    <input type="text" value={formData.urlTitle} onChange={e => setFormData({ ...formData, urlTitle: e.target.value })} placeholder="url-friendly-title" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled={saving} />
                  </div>
                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slug (Auto-generated)</label>
                    <input type="text" value={formData.slug} readOnly className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 outline-none transition-all cursor-not-allowed" disabled />
                  </div>
                  {/* Parent Article */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parent Article(s)</label>
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
                                const findArticle = (articles: any[]): any => {
                                  for (const article of articles) {
                                    if (String(article.id) === id) return article;
                                    if (article.children) {
                                      const found = findArticle(article.children);
                                      if (found) return found;
                                    }
                                  }
                                  return null;
                                };
                                const article = findArticle(organizeArticles(parentOptions));
                                return article?.title || id;
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
                          {organizeArticles(parentOptions).map((article) => renderParentOption(article))}
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
                        disabled={saving}
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
                      <input type="text" value={formData.metaTitle} onChange={e => setFormData({ ...formData, metaTitle: e.target.value })} placeholder="Meta title for SEO" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled={saving} />
                    </div>
                    {/* Meta Keywords */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords</label>
                      <input type="text" value={formData.metaKeywords} onChange={e => setFormData({ ...formData, metaKeywords: e.target.value })} placeholder="keyword1, keyword2, keyword3" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" disabled={saving} />
                    </div>
                    {/* Meta Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                      <textarea value={formData.metaDescription} onChange={e => setFormData({ ...formData, metaDescription: e.target.value })} placeholder="Meta description for SEO..." rows={3} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" disabled={saving} />
                    </div>
                  </div>
                </div>
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <RichTextEditor
                    content={formData.description}
                    onChange={(content) => setFormData({ ...formData, description: content })}
                    placeholder="Article content..."
                  />
                </div>
                {/* Featured Image */}
                <FeaturedImage
                  label="Featured Image"
                  imageUrl={formData.featuredImage}
                  imageAlt={formData.featuredImageAlt}
                  imageCaption={formData.featuredImageCaption}
                  onImageSelect={(file) => {
                    setSelectedImageFile(file);
                    setShowImageCrop(true);
                  }}
                  onImageRemove={() => {
                    setFormData({ ...formData, featuredImage: '' });
                  }}
                  onAltChange={(value) => setFormData({ ...formData, featuredImageAlt: value })}
                  onCaptionChange={(value) => setFormData({ ...formData, featuredImageCaption: value })}
                  helperText="PNG, JPG up to 5MB"
                  disabled={saving}
                />

                {/* Banner Image */}
                <BannerImage
                  label="Banner Image"
                  imageUrl={formData.bannerImageUrl}
                  imageAlt={formData.bannerImageAlt}
                  imageCaption={formData.bannerImageCaption}
                  onImageSelect={(file) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const base64 = event.target?.result as string;
                      // Store base64, will upload on submit
                      setFormData({ ...formData, bannerImageUrl: base64 });
                    };
                    reader.readAsDataURL(file);
                  }}
                  onImageRemove={() => {
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

              onCrop={async (croppedImage) => {
                try {
                  // Store base64 image, will upload on submit
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


      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">
                Article has been updated successfully.
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
    </div>
  );
}
