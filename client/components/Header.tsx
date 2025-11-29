'use client';

import * as React from 'react';
import {
    LogOut,
    Menu as MenuIcon,
    Moon,
    Sun,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/components/ThemeProvider';

interface HeaderProps {
    isCollapsed: boolean;
    onToggleSidebar: () => void;
    onMobileMenuOpen: () => void;
}

export function Header({ isCollapsed, onToggleSidebar, onMobileMenuOpen }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
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
                    <Sun className="h-4 w-4 text-gray-400" />
                    <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                    <Moon className="h-4 w-4 text-gray-400" />
                </div>

                <div className="h-8 w-px bg-gray-100" />

                {/* User Info */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-gray-900">Harper Nelson</p>
                        <p className="text-xs text-gray-500">Admin Manager</p>
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
                        localStorage.removeItem('authToken');
                        window.location.href = '/login';
                    }}
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                >
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}
