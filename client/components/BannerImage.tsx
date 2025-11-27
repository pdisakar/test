import React from 'react';
import { Trash2 } from 'lucide-react';

interface BannerImageProps {
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
}

export function BannerImage({
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
}: BannerImageProps) {
    const inputId = `${label.toLowerCase().replace(/\s+/g, '-')}-upload`;

    return (
        <div className="space-y-4">
            {/* Image Upload/Preview - No aspect ratio constraint */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <div className="space-y-3">
                    {imageUrl ? (
                        <div className="relative w-full max-w-2xl rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={`http://localhost:3001${imageUrl}`}
                                alt={imageAlt || `${label} preview`}
                                className="w-full h-auto object-cover"
                            />
                            <button
                                type="button"
                                onClick={onImageRemove}
                                disabled={disabled}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white text-red-500 transition-colors shadow-sm disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors w-full max-w-2xl">
                            <input
                                type="file"
                                id={inputId}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        onImageSelect(file);
                                        e.target.value = '';
                                    }
                                }}
                                disabled={disabled}
                            />
                            <label
                                htmlFor={inputId}
                                className="cursor-pointer flex flex-col items-center justify-center gap-2"
                            >
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-gray-600">Click to upload banner image</span>
                                {helperText && <span className="text-xs text-gray-500">{helperText}</span>}
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Alt Text */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{label} Alt Text</label>
                <input
                    type="text"
                    value={imageAlt}
                    onChange={e => onAltChange(e.target.value)}
                    placeholder="Alt text for image"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    disabled={disabled}
                />
            </div>

            {/* Caption */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{label} Caption</label>
                <input
                    type="text"
                    value={imageCaption}
                    onChange={e => onCaptionChange(e.target.value)}
                    placeholder="Caption for image"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}
