'use client';

import * as React from 'react';
import { Sidebar } from '@/app/admin/components/Sidebar';
import { Header } from '@/app/admin/components/Header';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
            {/* Sidebar */}
            <Sidebar
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                onMobileClose={() => setIsMobileOpen(false)}
            />

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                // Adjust margin based on sidebar state for desktop
                // We don't need margin-left here because flex layout handles it, 
                // but we might need to ensure the width is correct if Sidebar is fixed.
                // In the original Sidebar, it was sticky/fixed. Let's check Sidebar implementation again.
                // For now, assuming flex layout works as intended with the Sidebar component.
            )}>
                <Header
                    isCollapsed={isCollapsed}
                    onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
                    onMobileMenuOpen={() => setIsMobileOpen(true)}
                />

                <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
