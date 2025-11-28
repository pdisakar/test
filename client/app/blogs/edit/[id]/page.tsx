'use client';

import { Sidebar } from '@/components/Sidebar';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X, CalendarIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ImageCrop, ImageCropContent, ImageCropApply, ImageCropReset } from '@/components/ImageCrop';
import { FeaturedImage } from '@/components/FeaturedImage';
import { BannerImage } from '@/components/BannerImage';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;

  const [formData, setFormData] = useState({
    title: '',
    urlTitle: '',
    slug: '',
    authorId: '',
    publishedDate: new Date(),
    status: false,
    isFeatured: false,
    abstract: '',
    description: '',
    metaTitle: '',
    metaKeywords: '',
    metaDescription: '',
    featuredImage: '',
    featuredImageAlt: '',
    featuredImageCaption: '',
    bannerImage: '',
    bannerImageAlt: '',
    bannerImageCaption: '',
  });

  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) router.push('/login');
    else {
      fetchAuthors();
      if (blogId) {
        fetchBlog();
      }
    }
  }, [router, blogId]);

  const fetchAuthors = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/authors');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAuthors(data);
      }
    } catch (e) {
      console.error('Failed to fetch authors', e);
    }
  };

  const fetchBlog = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/api/blogs/${blogId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch blog');
      }

      const blog = data.blog;
      setFormData({
        title: blog.title || '',
        urlTitle: blog.urlTitle || '',
        slug: blog.slug || '',
        authorId: blog.authorId ? String(blog.authorId) : '',
        publishedDate: blog.publishedDate ? new Date(blog.publishedDate) : new Date(),
        status: Boolean(blog.status === 1 || blog.status === true),
        isFeatured: Boolean(blog.isFeatured === 1 || blog.isFeatured === true),
        abstract: blog.abstract || '',
        description: blog.description || '',
        metaTitle: blog.metaTitle || '',
        metaKeywords: blog.metaKeywords || '',
        metaDescription: blog.metaDescription || '',
        featuredImage: blog.featuredImage || '',
        featuredImageAlt: blog.featuredImageAlt || '',
        featuredImageCaption: blog.featuredImageCaption || '',
        bannerImage: blog.bannerImage || '',
        bannerImageAlt: blog.bannerImageAlt || '',
        bannerImageCaption: blog.bannerImageCaption || '',
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching blog data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.urlTitle) {
      setFormData(prev => ({ ...prev, slug: slugify(formData.urlTitle) }));
    }
  }, [formData.urlTitle]);

  const deleteImage = async (imagePath: string) => {
    if (!imagePath) return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    if (!formData.title || !formData.urlTitle || !formData.slug || !formData.authorId || !formData.publishedDate || !formData.metaTitle) {
      setError('Title, URL Title, Slug, Author, Date, and Meta Title are required');
      setSaving(false);
      return;
    }

    try {
      let featuredImageUrl = formData.featuredImage;
      if (formData.featuredImage && formData.featuredImage.startsWith('data:')) {
        featuredImageUrl = await uploadImage(formData.featuredImage, 'featured');
      }

      let bannerImageUrl = formData.bannerImage;
      if (formData.bannerImage && formData.bannerImage.startsWith('data:')) {
        bannerImageUrl = await uploadImage(formData.bannerImage, 'banner');
      }

      const payload = {
        ...formData,
        featuredImage: featuredImageUrl,
        bannerImage: bannerImageUrl,
        status: formData.status ? 1 : 0,
        isFeatured: formData.isFeatured ? 1 : 0,
        publishedDate: formData.publishedDate ? formData.publishedDate.toISOString() : null,
      };

      const res = await fetch(`http://localhost:3001/api/blogs/${blogId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update blog');
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push('/blogs');
  };

  const handleDiscard = () => router.push('/blogs');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 transition-all duration-300 flex items-center justify-center">
          <p className="text-gray-600">Loading blog...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Blog</h1>
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Blog Title"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                      disabled={saving}
                    />
                  </div>

                  {/* URL Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.urlTitle}
                      onChange={e => setFormData({ ...formData, urlTitle: e.target.value })}
                      placeholder="Blog URL Title"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                      disabled={saving}
                    />
                  </div>

                  {/* Slug */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-lg bg-gray-100 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      disabled
                    />
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Author <span className="text-red-500">*</span></label>
                    <select
                      value={formData.authorId}
                      onChange={e => setFormData({ ...formData, authorId: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                      disabled={saving}
                    >
                      <option value="">Select Author</option>
                      {authors.map(author => (
                        <option key={author.id} value={author.id}>{author.fullName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal h-[42px]",
                            !formData.publishedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.publishedDate ? format(formData.publishedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.publishedDate}
                          onSelect={(date) => date && setFormData({ ...formData, publishedDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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

                  {/* Is Featured */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Is Featured?</label>
                    <div className="flex items-center gap-3 h-[42px]">
                      <Switch
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                        disabled={saving}
                      />
                      <span className="text-sm text-gray-600">
                        {formData.isFeatured ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Abstract */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Abstract</label>
                    <textarea
                      value={formData.abstract}
                      onChange={e => setFormData({ ...formData, abstract: e.target.value })}
                      placeholder="Short summary..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Meta Information */}
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Meta Information</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={e => setFormData({ ...formData, metaTitle: e.target.value })}
                        placeholder="Meta title for SEO"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords</label>
                      <input
                        type="text"
                        value={formData.metaKeywords}
                        onChange={e => setFormData({ ...formData, metaKeywords: e.target.value })}
                        placeholder="keyword1, keyword2, keyword3"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                      <textarea
                        value={formData.metaDescription}
                        onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                        placeholder="Meta description for SEO..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <RichTextEditor
                    content={formData.description}
                    onChange={(content) => setFormData({ ...formData, description: content })}
                    placeholder="Blog content..."
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
                  onImageRemove={async () => {
                    await deleteImage(formData.featuredImage);
                    setFormData(prev => ({ ...prev, featuredImage: '' }));
                  }}
                  onAltChange={(val) => setFormData(prev => ({ ...prev, featuredImageAlt: val }))}
                  onCaptionChange={(val) => setFormData(prev => ({ ...prev, featuredImageCaption: val }))}
                  helperText="PNG, JPG up to 5MB"
                  disabled={saving}
                />

                {/* Banner Image */}
                <BannerImage
                  label="Banner Image"
                  imageUrl={formData.bannerImage}
                  imageAlt={formData.bannerImageAlt}
                  imageCaption={formData.bannerImageCaption}
                  onImageSelect={(file) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setFormData(prev => ({ ...prev, bannerImage: e.target?.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  onImageRemove={async () => {
                    await deleteImage(formData.bannerImage);
                    setFormData(prev => ({ ...prev, bannerImage: '' }));
                  }}
                  onAltChange={(val) => setFormData(prev => ({ ...prev, bannerImageAlt: val }))}
                  onCaptionChange={(val) => setFormData(prev => ({ ...prev, bannerImageCaption: val }))}
                  helperText="PNG, JPG up to 5MB (no aspect ratio)"
                  disabled={saving}
                />
              </div>
            </form>
          </div>
        </div>
      </div>

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
                Blog has been updated successfully.
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
                  setFormData(prev => ({ ...prev, featuredImage: croppedImage }));
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
    </div>
  );
}
