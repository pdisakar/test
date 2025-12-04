'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface GlobalSettings {
    id?: number;
    viatorLink: string;
    tourradarLink: string;
    tripAdvisorLink: string;
    youtubeLink: string;
    pinterestLink: string;
    linkedinLink: string;
    instagramLink: string;
    twitterLink: string;
    facebookLink: string;
    contactPerson1: string;
    contactPerson2: string;
    establishedYear: string;
    shortDescription: string;
    mobileNumber1: string;
    mobileNumber2: string;
    phoneNumber: string;
    postBox: string;
    address: string;
    googleMapLocation: string;
    companyName: string;
}

const initialSettings: GlobalSettings = {
    viatorLink: '',
    tourradarLink: '',
    tripAdvisorLink: '',
    youtubeLink: '',
    pinterestLink: '',
    linkedinLink: '',
    instagramLink: '',
    twitterLink: '',
    facebookLink: '',
    contactPerson1: '',
    contactPerson2: '',
    establishedYear: '',
    shortDescription: '',
    mobileNumber1: '',
    mobileNumber2: '',
    phoneNumber: '',
    postBox: '',
    address: '',
    googleMapLocation: '',
    companyName: '',
};

export default function GlobalSettingsPage() {
    const [settings, setSettings] = useState<GlobalSettings>(initialSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await apiFetch<GlobalSettings>('/settings');
            if (data) {
                // Merge with initial to ensure all fields exist even if API returns partial
                setSettings({ ...initialSettings, ...data });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            // If 404 or error, we just keep initial empty settings
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await apiFetch('/settings', {
                method: 'POST', // Or PUT, depending on backend implementation
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (error) {
            console.error('Failed to save settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Global Settings</h1>
                        <Button onClick={handleSubmit} disabled={saving} className="bg-primary hover:bg-primary/90">
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Save Changes
                                </>
                            )}
                        </Button>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* General Information */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">General Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={settings.companyName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Established Year</label>
                                    <input
                                        type="text"
                                        name="establishedYear"
                                        value={settings.establishedYear}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Short Description</label>
                                    <textarea
                                        name="shortDescription"
                                        value={settings.shortDescription}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Contact Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person 1</label>
                                    <input
                                        type="text"
                                        name="contactPerson1"
                                        value={settings.contactPerson1}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person 2</label>
                                    <input
                                        type="text"
                                        name="contactPerson2"
                                        value={settings.contactPerson2}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number 1</label>
                                    <input
                                        type="text"
                                        name="mobileNumber1"
                                        value={settings.mobileNumber1}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number 2</label>
                                    <input
                                        type="text"
                                        name="mobileNumber2"
                                        value={settings.mobileNumber2}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={settings.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Post Box</label>
                                    <input
                                        type="text"
                                        name="postBox"
                                        value={settings.postBox}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={settings.address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Google Map Location (Embed URL)</label>
                                    <input
                                        type="text"
                                        name="googleMapLocation"
                                        value={settings.googleMapLocation}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="https://www.google.com/maps/embed?..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Social Media & External Links */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Social Media & Links</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</label>
                                    <input
                                        type="text"
                                        name="facebookLink"
                                        value={settings.facebookLink}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Instagram</label>
                                    <input
                                        type="text"
                                        name="instagramLink"
                                        value={settings.instagramLink}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Twitter (X)</label>
                                    <input
                                        type="text"
                                        name="twitterLink"
                                        value={settings.twitterLink}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</label>
                                    <input
                                        type="text"
                                        name="linkedinLink"
                                        value={settings.linkedinLink}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">YouTube</label>
                                    <input
                                        type="text"
                                        name="youtubeLink"
                                        value={settings.youtubeLink}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pinterest</label>
                                    <input
                                        type="text"
                                        name="pinterestLink"
                                        value={settings.pinterestLink}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">TripAdvisor</label>
                                    <input
                                        type="text"
                                        name="tripAdvisorLink"
                                        value={settings.tripAdvisorLink}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Viator</label>
                                    <input
                                        type="text"
                                        name="viatorLink"
                                        value={settings.viatorLink}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">TourRadar</label>
                                    <input
                                        type="text"
                                        name="tourradarLink"
                                        value={settings.tourradarLink}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
