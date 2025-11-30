'use client';

import * as React from 'react';
import {
    LogOut,
    Menu as MenuIcon,
    Moon,
    Sun,
    ChevronLeft,
    ChevronRight,
    Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/admin/components/ui/button';
import { Switch } from '@/app/admin/components/ui/switch';
import { useTheme } from '@/app/admin/components/AdminThemeProvider';

interface HeaderProps {
    isCollapsed: boolean;
    onToggleSidebar: () => void;
    onMobileMenuOpen: () => void;
}

export function Header({ isCollapsed, onToggleSidebar, onMobileMenuOpen }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={onMobileMenuOpen}
                >
                    <MenuIcon className="h-6 w-6" />
                </Button>

                {/* Desktop Sidebar Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    className="hidden md:flex h-9 w-9"
                >
                    {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </Button>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                {/* Theme Toggle */}
                <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                    <Moon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>

                {/* Settings Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.location.href = '/admin/settings'}
                    className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
                    title="Global Settings"
                >
                    <Settings className="h-5 w-5" />
                </Button>

                <div className="h-8 w-px bg-gray-100 dark:bg-gray-800" />

                {/* User Info */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Harper Nelson</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Admin Manager</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-gray-200 overflow-hidden shrink-0">
                        <img src="https://github.com/shadcn.png" alt="User" className="h-full w-full object-cover" />
                    </div>
                </div>

                {/* Logout */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }}
                    className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    title="Logout"
                >
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}
