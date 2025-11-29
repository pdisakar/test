'use client';

import { MainLayout } from '@/components/MainLayout';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Edit } from 'lucide-react';

interface TeamMember {
    id: number;
    fullName: string;
    email: string;
    urlTitle: string;
    slug: string;
    avatar: string;
    status: number;
    createdAt: string;
    updatedAt: string;
}

export default function TeamsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [teams, setTeams] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/login');
        } else {
            fetchTeams();
        }
    }, [router]);

    const fetchTeams = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:3001/api/teams');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch team members');
            }

            if (Array.isArray(data)) {
                setTeams(data);
            } else {
                setTeams([]);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching team members');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeam = () => {
        router.push('/teams/add');
    };

    const handleEdit = (id: number) => {
        router.push(`/teams/edit/${id}`);
    };

    const handleConfirmDelete = async () => {
        if (selectedTeams.length === 0) return;

        setDeleting(true);
        setError('');

        try {
            // Delete each selected team member
            await Promise.all(
                selectedTeams.map(id =>
                    fetch(`http://localhost:3001/api/teams/${id}`, { method: 'DELETE' })
                )
            );

            await fetchTeams();
            setSelectedTeams([]);
            setShowDeleteConfirm(false);
        } catch (err: any) {
            setError(err.message || 'An error occurred while deleting');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleToggleTeam = (id: number) => {
        setSelectedTeams(prev =>
            prev.includes(id)
                ? prev.filter(teamId => teamId !== id)
                : [...prev, id]
        );
    };

    const handleToggleAll = () => {
        if (selectedTeams.length === teams.length) {
            setSelectedTeams([]);
        } else {
            setSelectedTeams(teams.map(t => t.id));
        }
    };

    const handleBulkDeleteClick = () => {
        if (selectedTeams.length > 0) {
            setShowDeleteConfirm(true);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getSrc = (url: string) => {
        if (!url) return '';
        if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) {
            return url;
        }
        return `http://localhost:3001${url}`;
    };

    // Filter teams
    const filteredTeams = teams.filter(team => {
        return team.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <MainLayout>
            <div className="flex-1 transition-all duration-300 w-full">
                <div className="pt-16 pb-6 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teams</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {selectedTeams.length > 0 && (
                                <Button
                                    onClick={handleBulkDeleteClick}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={deleting}
                                >
                                    Delete ({selectedTeams.length})
                                </Button>
                            )}
                            <Button
                                onClick={() => router.push('/teams/trash')}
                                variant="outline"
                                className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Trash
                            </Button>
                            <Button
                                onClick={handleAddTeam}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
                            >
                                Add Team Member
                            </Button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Info Message */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                                <div className="h-5 w-5 rounded-full border-2 border-orange-400 flex items-center justify-center">
                                    <span className="text-orange-400 text-xs">i</span>
                                </div>
                                <span>{loading ? 'Loading...' : `${teams.length} Team Members listed`}</span>
                            </div>

                            {/* Spacer */}
                            <div className="flex-1"></div>

                            {/* Search */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search:</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search..."
                                        className="pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm w-full md:w-64"
                                    />
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-left w-12">
                                        <input
                                            type="checkbox"
                                            checked={teams.length > 0 && selectedTeams.length === teams.length}
                                            onChange={handleToggleAll}
                                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">S.N</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Image</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Updated At</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                            Loading team members...
                                        </td>
                                    </tr>
                                ) : filteredTeams.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                            No team members found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTeams.map((team, index) => (
                                        <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTeams.includes(team.id)}
                                                    onChange={() => handleToggleTeam(team.id)}
                                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                {team.avatar ? (
                                                    <img
                                                        src={getSrc(team.avatar)}
                                                        alt={team.fullName}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm font-medium">
                                                            {team.fullName.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {team.fullName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {team.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${team.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                                    }`}>
                                                    {team.status === 1 ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{formatDate(team.updatedAt)}</td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    onClick={() => handleEdit(team.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:bg-gray-800"
                                                >
                                                    <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400 dark:text-gray-500" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
                            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">
                                {`Are you sure you want to delete ${selectedTeams.length} team member${selectedTeams.length > 1 ? 's' : ''}? This action cannot be undone.`}
                            </p>
                            <div className="flex items-center gap-3 justify-end">
                                <Button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    variant="outline"
                                    className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    disabled={deleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmDelete}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
