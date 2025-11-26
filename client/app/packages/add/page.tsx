"use client";

import { Sidebar } from '@/components/Sidebar';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/RichTextEditor';
import { X, ChevronRight, ChevronDown, Check, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { ImageCrop, ImageCropContent, ImageCropApply, ImageCropReset } from '@/components/ImageCrop';

interface GroupPrice {
  id: string;
  minPerson: string;
  maxPerson: string;
  price: string;
  isDefault: boolean;
}

interface Place {
  id: number;
  title: string;
  parentId: number | null;
  children?: Place[];
}

interface GalleryImage {
  id: string;
  file: File | null;
  preview: string;
}

export default function AddPackagePage() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    packageTitle: '',
    urlTitle: '',
    slug: '',
    durationValue: '',
    durationUnit: 'days',
    placeIds: [] as string[],
    metaTitle: '',
    metaDescription: '',
    abstract: '',
    details: '',
    price: '',
    costInclude: '',
    costExclude: '',
    // Step 3 Fields
    featuredImage: null as File | null,
    featuredImagePreview: '',
    featuredImageAlt: '',
    featuredImageCaption: '',
    bannerImage: null as File | null,
    bannerImagePreview: '',
    bannerImageAlt: '',
    bannerImageCaption: '',
  });

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  const [currentStep, setCurrentStep] = useState(1);

  const [places, setPlaces] = useState<Place[]>([]);
  const [expandedPlaces, setExpandedPlaces] = useState<Set<number>>(new Set());
  const [showPlaceAccordion, setShowPlaceAccordion] = useState(false);

  // Group price state
  const [groupPriceEnabled, setGroupPriceEnabled] = useState(false);
  const [groupPrices, setGroupPrices] = useState<GroupPrice[]>([]);

  // Status toggles
  const [status, setStatus] = useState(false); // Published / Not Published
  const [featured, setFeatured] = useState(false);

  const [error, setError] = useState('');

  // Image Crop State
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Refs for file inputs
  const featuredInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Fetch places on mount
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/places');
        if (response.ok) {
          const data = await response.json();
          setPlaces(data);
        } else {
          console.error('Failed to fetch places');
        }
      } catch (err) {
        console.error('Error fetching places:', err);
      }
    };

    fetchPlaces();
  }, []);

  // Organize places into tree structure
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

  const togglePlaceExpand = (id: number) => {
    const newExpanded = new Set(expandedPlaces);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPlaces(newExpanded);
  };

  const renderPlaceOption = (place: Place, depth: number = 0): React.JSX.Element => {
    const hasChildren = place.children && place.children.length > 0;
    const isExpanded = expandedPlaces.has(place.id);
    const isSelected = formData.placeIds.includes(String(place.id));

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
                togglePlaceExpand(place.id);
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
              if (formData.placeIds.includes(placeIdStr)) {
                setFormData(prev => ({ ...prev, placeIds: prev.placeIds.filter(id => id !== placeIdStr) }));
              } else {
                setFormData(prev => ({ ...prev, placeIds: [...prev.placeIds, placeIdStr] }));
              }
            }}
          >
            <span className="text-sm text-gray-900">{place.title}</span>
          </div>
        </div>
        {isExpanded && place.children?.map((child) => renderPlaceOption(child, depth + 1))}
      </React.Fragment>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Auto-generate slug from URL Title
      if (name === 'urlTitle') {
        newData.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }

      return newData;
    });
  };

  const handleAddGroupPrice = () => {
    const newGroupPrice: GroupPrice = {
      id: Date.now().toString(),
      minPerson: '',
      maxPerson: '',
      price: '',
      isDefault: groupPrices.length === 0 // First one is default by default
    };

    setGroupPrices(prev => [...prev, newGroupPrice]);
  };

  const handleRemoveGroupPrice = (id: string) => {
    setGroupPrices(prev => {
      const newPrices = prev.filter(gp => gp.id !== id);
      // If we deleted the default one, make the first one default (if exists)
      if (prev.find(gp => gp.id === id)?.isDefault && newPrices.length > 0) {
        newPrices[0].isDefault = true;
      }
      return newPrices;
    });
  };

  const handleGroupPriceChange = (id: string, field: keyof GroupPrice, value: string) => {
    setGroupPrices(prev => prev.map(gp =>
      gp.id === id ? { ...gp, [field]: value } : gp
    ));
  };

  const handleSetDefaultPrice = (id: string) => {
    setGroupPrices(prev => prev.map(gp => ({
      ...gp,
      isDefault: gp.id === id
    })));
  };

  // Image Handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'featured' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'featured') {
        setSelectedImageFile(file);
        setShowImageCrop(true);
        // Reset input so same file can be selected again if needed
        if (featuredInputRef.current) featuredInputRef.current.value = '';
      } else {
        // Banner image (no crop for now, or maybe add later)
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            bannerImage: file,
            bannerImagePreview: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (type: 'featured' | 'banner') => {
    setFormData(prev => ({
      ...prev,
      [`${type}Image`]: null,
      [`${type}ImagePreview`]: ''
    }));
    if (type === 'featured' && featuredInputRef.current) featuredInputRef.current.value = '';
    if (type === 'banner' && bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryImages(prev => [...prev, {
          id: Date.now() + Math.random().toString(),
          file,
          preview: reader.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removeGalleryImage = (id: string) => {
    setGalleryImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.packageTitle) {
      setError('Package Title is required');
      return;
    }

    // Log form data (frontend only for now)
    const packageData = {
      ...formData,
      groupPriceEnabled,
      groupPrices,
      status,
      featured,
      galleryImages: galleryImages.map(img => ({ name: img.file?.name, size: img.file?.size }))
    };

    console.log('Package Data:', packageData);
    alert('Package data logged to console (frontend only)');
  };

  const handleNext = () => {
    // Validation for Step 1
    if (currentStep === 1 && !formData.packageTitle) {
      setError('Package Title is required');
      return;
    }
    setError('');
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleDiscard = () => {
    if (confirm('Are you sure you want to discard changes?')) {
      router.push('/packages');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300 w-full">
        <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <h1 className="text-3xl font-bold text-gray-900">Add Package</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                type="button"
                onClick={handleDiscard}
                variant="outline"
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Discard
              </Button>
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
                >
                  Next
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    form="package-form"
                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
                  >
                    Make Available Package
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form id="package-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1 Content */}
            {currentStep === 1 && (
              <>
                {/* Basic Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="packageTitle" className="block text-sm font-medium text-gray-700 mb-2">
                        Package Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="packageTitle"
                        name="packageTitle"
                        value={formData.packageTitle}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="urlTitle" className="block text-sm font-medium text-gray-700 mb-2">
                        URL Title
                      </label>
                      <input
                        type="text"
                        id="urlTitle"
                        name="urlTitle"
                        value={formData.urlTitle}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                        Slug
                      </label>
                      <input
                        type="text"
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Categorization */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Categorization</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Package Durations
                      </label>
                      <div className="flex gap-4">
                        <input
                          type="number"
                          name="durationValue"
                          value={formData.durationValue}
                          onChange={handleInputChange}
                          placeholder="Value"
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                        <select
                          name="durationUnit"
                          value={formData.durationUnit}
                          onChange={handleInputChange}
                          className="w-32 px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                        >
                          <option value="days">Days</option>
                          <option value="hours">Hours</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="placeId" className="block text-sm font-medium text-gray-700 mb-2">
                        Package Place
                      </label>
                      <div
                        className="border border-gray-200 rounded-lg bg-white cursor-pointer"
                        onClick={() => setShowPlaceAccordion(!showPlaceAccordion)}
                      >
                        <div className="py-2.5 px-4 flex items-center justify-between">
                          <span className="text-sm text-gray-900">
                            {formData.placeIds.length === 0 ? (
                              <span className="text-gray-500">Select places...</span>
                            ) : (
                              <span>
                                {formData.placeIds.map((id) => {
                                  const findPlace = (places: Place[]): Place | null => {
                                    for (const place of places) {
                                      if (String(place.id) === id) return place;
                                      if (place.children) {
                                        const found = findPlace(place.children);
                                        if (found) return found;
                                      }
                                    }
                                    return null;
                                  };
                                  const place = findPlace(organizePlaces(places));
                                  return place?.title || id;
                                }).join(', ')}
                              </span>
                            )}
                          </span>
                          {showPlaceAccordion ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        {showPlaceAccordion && (
                          <div className="border-t border-gray-200 max-h-64 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            {organizePlaces(places).map((place) => renderPlaceOption(place))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Price */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Group Price</h2>

                  {/* Group Price Toggle */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setGroupPriceEnabled(true)}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${groupPriceEnabled
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        Group
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupPriceEnabled(false)}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${!groupPriceEnabled
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        No Group
                      </button>
                    </div>
                  </div>

                  {/* Group Price Form */}
                  {groupPriceEnabled && (
                    <div className="space-y-6">
                      {groupPrices.map((gp, index) => (
                        <div key={gp.id} className="space-y-3 pb-6 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900 uppercase">Group Price #{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveGroupPrice(gp.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                              Delete
                            </button>
                          </div>

                          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="flex-1 w-full">
                              <input
                                type="number"
                                placeholder="Min Person"
                                value={gp.minPerson}
                                onChange={(e) => handleGroupPriceChange(gp.id, 'minPerson', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              />
                            </div>
                            <div className="flex-1 w-full">
                              <input
                                type="number"
                                placeholder="Max Person"
                                value={gp.maxPerson}
                                onChange={(e) => handleGroupPriceChange(gp.id, 'maxPerson', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              />
                            </div>
                            <div className="flex-1 w-full">
                              <input
                                type="number"
                                placeholder="Price"
                                value={gp.price}
                                onChange={(e) => handleGroupPriceChange(gp.id, 'price', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              />
                            </div>

                            <div className="flex items-center gap-3 min-w-[180px]">
                              <button
                                type="button"
                                onClick={() => handleSetDefaultPrice(gp.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${gp.isDefault ? 'bg-green-500' : 'bg-gray-200'
                                  }`}
                              >
                                <span
                                  className={`${gp.isDefault ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                              </button>
                              <span className={`text-sm ${gp.isDefault ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                {gp.isDefault ? 'Default Price' : 'Not Default Price'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="pt-2">
                        <Button
                          type="button"
                          onClick={handleAddGroupPrice}
                          className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg flex items-center gap-2"
                        >
                          <span className="text-xl leading-none">+</span> Add group & price
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Single Price Form (No Group) */}
                  {!groupPriceEnabled && (
                    <div className="mt-6">
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                        Price
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Enter package price"
                      />
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Meta</h2>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Title <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        id="metaTitle"
                        name="metaTitle"
                        value={formData.metaTitle}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Enter meta title..."
                      />
                    </div>
                    <div>
                      <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Description
                      </label>
                      <textarea
                        id="metaDescription"
                        name="metaDescription"
                        value={formData.metaDescription}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        placeholder="Enter meta description..."
                      />
                    </div>
                  </div>
                </div>
                {/* Introduction */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Introduction</h2>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-2">
                        Abstract
                      </label>
                      <textarea
                        id="abstract"
                        name="abstract"
                        value={formData.abstract}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        placeholder="Enter abstract..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Details
                      </label>
                      <RichTextEditor
                        content={formData.details}
                        onChange={(content) => setFormData(prev => ({ ...prev, details: content }))}
                        placeholder="Write the details..."
                      />
                    </div>
                  </div>
                </div>

                {/* Tour Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Tour Status</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Toggle */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3 uppercase">Status</label>
                      <div className="flex items-center gap-3 h-[42px]">
                        <Switch
                          checked={status}
                          onCheckedChange={setStatus}
                        />
                        <span className="text-sm text-gray-600">
                          {status ? 'Publish' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    {/* Featured Toggle */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3 uppercase">Is Featured?</label>
                      <div className="flex items-center gap-3 h-[42px]">
                        <Switch
                          checked={featured}
                          onCheckedChange={setFeatured}
                        />
                        <span className="text-sm text-gray-600">
                          {featured ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2 Content */}
            {currentStep === 2 && (
              <>
                {/* Cost Include */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 uppercase">Cost Include</h2>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                      COST INCLUDES - DEFAULT DESIGN
                    </label>
                    <RichTextEditor
                      content={formData.costInclude}
                      onChange={(content) => setFormData(prev => ({ ...prev, costInclude: content }))}
                      placeholder="Write cost includes..."
                    />
                  </div>
                </div>

                {/* Cost Exclude */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 uppercase">Cost Exclude</h2>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                      COST EXCLUDE
                    </label>
                    <RichTextEditor
                      content={formData.costExclude}
                      onChange={(content) => setFormData(prev => ({ ...prev, costExclude: content }))}
                      placeholder="Write cost excludes..."
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 3 Content: Images & Gallery */}
            {currentStep === 3 && (
              <>
                {/* Featured Image */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Featured</h2>
                  <div className="space-y-6">
                    <div className="relative">
                      {formData.featuredImagePreview ? (
                        <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={formData.featuredImagePreview}
                            alt="Featured preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('featured')}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white text-red-500 transition-colors shadow-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => featuredInputRef.current?.click()}
                          className="w-full max-w-md aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 hover:bg-gray-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-500"
                        >
                          <ImageIcon className="h-8 w-8" />
                          <span className="text-sm font-medium">Click to upload featured image</span>
                        </div>
                      )}
                      <input
                        ref={featuredInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'featured')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                          ALT TEXT
                        </label>
                        <input
                          type="text"
                          name="featuredImageAlt"
                          value={formData.featuredImageAlt}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                          CAPTION
                        </label>
                        <input
                          type="text"
                          name="featuredImageCaption"
                          value={formData.featuredImageCaption}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner Image */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Banner Image</h2>
                  <div className="space-y-6">
                    <div className="relative">
                      {formData.bannerImagePreview ? (
                        <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={formData.bannerImagePreview}
                            alt="Banner preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('banner')}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white text-red-500 transition-colors shadow-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => bannerInputRef.current?.click()}
                          className="w-full aspect-[21/9] rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 hover:bg-gray-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-500"
                        >
                          <ImageIcon className="h-8 w-8" />
                          <span className="text-sm font-medium">Click to upload banner image</span>
                        </div>
                      )}
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'banner')}
                      />
                      <p className="text-sm text-gray-500 mt-2">Size should be 1920x750</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                          BANNER ALT
                        </label>
                        <input
                          type="text"
                          name="bannerImageAlt"
                          value={formData.bannerImageAlt}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                          BANNER CAPTION
                        </label>
                        <input
                          type="text"
                          name="bannerImageCaption"
                          value={formData.bannerImageCaption}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media Gallery */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Media Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {galleryImages.map((img) => (
                      <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                        <img
                          src={img.preview}
                          alt="Gallery preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(img.id)}
                            className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div
                      onClick={() => galleryInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 hover:bg-gray-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-500"
                    >
                      <Plus className="h-8 w-8" />
                      <span className="text-sm font-medium">Add Media</span>
                    </div>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />
                  </div>
                </div>
              </>
            )}
          </form>
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
              onCrop={(croppedImage) => {
                setFormData(prev => ({
                  ...prev,
                  featuredImage: selectedImageFile, // Keep original file object for upload
                  featuredImagePreview: croppedImage // Use cropped base64 for preview
                }));
                setShowImageCrop(false);
                setSelectedImageFile(null);
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
