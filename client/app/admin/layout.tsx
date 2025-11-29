'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminThemeProvider } from '@/app/admin/components/AdminThemeProvider';
import './globals.css';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');

        if (!token) {
            // Redirect to login if no token
            router.push('/login');
        } else {
            // Optionally verify token with backend
            setIsAuthenticated(true);
        }

        setIsLoading(false);
    }, [pathname, router]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If not authenticated, don't render anything (will redirect)
    if (!isAuthenticated) {
        return null;
    }

    // Render admin content if authenticated
    return (
        <AdminThemeProvider>
            {children}
        </AdminThemeProvider>
    );
}
