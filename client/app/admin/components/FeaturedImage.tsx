import React from 'react';
import { Trash2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { ASPECT_RATIOS } from '@/app/admin/lib/aspect-ratios';
import { getApiUrl, getImageUrl } from '@/app/admin/lib/api-config';

interface FeaturedImageProps {
    label: string;
    imageUrl: string;
    imageAlt: string;
    imageCaption: string;
    onImageSelect: (file: File) => void;
    onImageRemove: () => void;
    onAltChange: (value: string) => void;
    onCaptionChange: (value: string) => void;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    aspectRatio?: number;
    displayAspectRatio?: string;
}

export function FeaturedImage({
    label,
    imageUrl,
    imageAlt,
    imageCaption,
    onImageSelect,
    onImageRemove,
    onAltChange,
    onCaptionChange,
    helperText,
    disabled = false,
    required = false,
    aspectRatio = ASPECT_RATIOS.DEFAULT,
    displayAspectRatio
}: FeaturedImageProps) {
    const inputId = `${label.toLowerCase().replace(/\s+/g, '-')}-upload`;

    const getSrc = (url: string) => {
        if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) {
            return url;
        }
        return getImageUrl(url);
    };

    return (
        <div className="space-y-6 p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
            {/* Image Upload/Preview with dynamic aspect ratio */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="space-y-3">
                    {imageUrl ? (
                        <div className="group relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-[1.02]" style={{ aspectRatio }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                            <img
                                src={getSrc(imageUrl)}
                                alt={imageAlt || `${label} preview`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={onImageRemove}
                                disabled={disabled}
                                className="absolute top-4 right-4 z-20 p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-red-500/80 hover:border-red-500/50 transition-all duration-300 shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 disabled:opacity-50"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="relative group w-full max-w-md mx-auto" style={{ aspectRatio }}>
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-400/30 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500" />
                            <div className="relative h-full bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 group-hover:border-transparent transition-all duration-300 overflow-hidden">
                                <input
                                    type="file"
                                    id={inputId}
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            onImageSelect(file);
                                            e.target.value = ''; // Reset input
                                        }
                                    }}
                                    disabled={disabled}
                                />
                                <label
                                    htmlFor={inputId}
                                    className="cursor-pointer h-full flex flex-col items-center justify-center gap-4 p-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <div className="p-4 bg-primary/5 rounded-full group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                                        <UploadCloud className="w-10 h-10 text-primary/60 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
                                      Click to upload image{displayAspectRatio ? ` (Aspect Ratio: ${displayAspectRatio})` : aspectRatio ? ` (Aspect Ratio: ${aspectRatio.toFixed(2)})` : ''}
                                    </span>
                                        {helperText && <p className="text-xs text-gray-400 dark:text-gray-500">{helperText}</p>}
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Alt Text & Caption */}
            <div className="grid grid-cols-1 gap-4">
                <div className="group">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">Alt Text</label>
                    <input
                        type="text"
                        value={imageAlt}
                        onChange={e => onAltChange(e.target.value)}
                        placeholder="Describe the image for SEO..."
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-white"
                        disabled={disabled}
                    />
                </div>

                <div className="group">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">Caption</label>
                    <input
                        type="text"
                        value={imageCaption}
                        onChange={e => onCaptionChange(e.target.value)}
                        placeholder="Add a caption..."
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-white"
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
}