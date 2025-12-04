'use client';

import { MainLayout } from '@/app/admin/components/MainLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { Search, Edit } from 'lucide-react';
import { getApiUrl } from '@/app/admin/lib/api-config';

interface User {
  id: number;
  name: string;
  email: string;
  userType: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [userType, setUserType] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    } else {
      fetchUsers();
    }
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(getApiUrl('users'));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      setUsers(data.users);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    router.push('/admin/users/add');
  };

  const handleToggleUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleToggleAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleDeleteClick = () => {
    if (selectedUsers.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      if (selectedUsers.length === 1) {
        // Single delete
        const response = await fetch(getApiUrl(`users/${selectedUsers[0]}`), {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete user');
        }
      } else {
        // Bulk delete
        const response = await fetch(getApiUrl('users/bulk-delete'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedUsers }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete users');
        }
      }

      // Refresh users list
      await fetchUsers();
      setSelectedUsers([]);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting users');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter users based on search term and user type
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !userType || user.userType === userType;
    return matchesSearch && matchesType;
  });

  return (
    <MainLayout>
      <div className="py-12 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
          <div className="flex items-center gap-3">
            {selectedUsers.length > 0 && (
              <Button
                onClick={handleDeleteClick}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                disabled={deleting}
              >
                Delete ({selectedUsers.length})
              </Button>
            )}
            <Button
              onClick={handleAddUser}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
            >
              Add User
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
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-4">
            {/* Info Message */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
              <div className="h-5 w-5 rounded-full border-2 border-orange-400 flex items-center justify-center">
                <span className="text-orange-400 text-xs">i</span>
              </div>
              <span>{loading ? 'Loading...' : `${filteredUsers.length} Users are listed`}</span>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* User Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User Type:</label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white dark:bg-gray-900 text-sm"
              >
                <option value="">Please select</option>
                <option value="super-user">Super User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search By Title:</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm w-64"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                    onChange={handleToggleAll}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">S.N</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">User Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Updated At</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleToggleUser(user.id)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.userType === 'super-user' ? 'Super User' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                        }`}>
                        {user.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{formatDate(user.updatedAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{user.id}</td>
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => router.push(`/admin/users/edit/${user.id}`)}
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

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-gray-200 dark:border-gray-700"
                disabled
              >
                &lt;
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-primary text-white border-primary hover:bg-primary/90"
              >
                1
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-gray-200 dark:border-gray-700"
                disabled
              >
                &gt;
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">
              Are you sure you want to delete {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}?
              This action cannot be undone.
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
    </MainLayout>
  );
}
