'use client';

import { Sidebar } from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

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
      const response = await fetch('http://localhost:3001/api/users');
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
    router.push('/users/add');
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <Button
              onClick={handleAddUser}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
            >
              Add User
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-4">
              {/* Info Message */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="h-5 w-5 rounded-full border-2 border-orange-400 flex items-center justify-center">
                  <span className="text-orange-400 text-xs">i</span>
                </div>
                <span>{loading ? 'Loading...' : `${filteredUsers.length} Users are listed`}</span>
              </div>

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* User Type Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">User Type:</label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white text-sm"
                >
                  <option value="">Please select</option>
                  <option value="super-user">Super User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Search By Title:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="pl-4 pr-10 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm w-64"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">S.N</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Updated At</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.userType === 'super-user' ? 'Super User' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.updatedAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-gray-200"
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
                  className="h-8 w-8 p-0 border-gray-200"
                  disabled
                >
                  &gt;
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
