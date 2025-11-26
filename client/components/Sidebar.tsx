'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  LayoutGrid,
  FileText,
  CreditCard,
  User,
  MessageSquare,
  HelpCircle,
  PenTool,
  Edit,
  MessageCircle,
  Compass,
  Info,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  ChevronDown,
  Menu as MenuIcon,
  Plane,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [openItem, setOpenItem] = React.useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const toggleItem = (title: string) => {
    setOpenItem((prev) => prev === title ? null : title);
  };

  const menuItems = [
    {
      title: "MENU",
      items: [
        {
          title: "Users",
          icon: Users,
          sub: [
            { label: "Add New", href: "/users/add" },
            { label: "All Users", href: "/users" }
          ]
        },
        {
          title: "Categories",
          icon: LayoutGrid,
          sub: [
            { label: "Add New", href: "/categories/add" },
            { label: "All Categories", href: "/categories" },
            { label: "Deleted Categories", href: "/categories/deleted" }
          ]
        },
        {
          title: "Articles",
          icon: FileText,
          sub: [
            { label: "Add New", href: "/articles/add" },
            { label: "All Articles", href: "/articles" },
            { label: "Deleted Articles", href: "/articles/trash" }
          ]
        },
      ]
    },
    {
      title: "MANAGEMENT",
      items: [
        {
          title: "Manage Menu",
          icon: MenuIcon,
          sub: [
            { label: "Add New", href: "/menu/add" },
            { label: "Deleted Menu", href: "/menu/deleted" }
          ]
        },
        {
          title: "Team",
          icon: User,
          sub: [
            { label: "Add New", href: "/team/add" },
            { label: "Team Members", href: "/team" },
            { label: "Deleted Members", href: "/team/deleted" }
          ]
        },
        {
          title: "Testimonials",
          icon: MessageSquare,
          sub: [
            { label: "Add New", href: "/testimonials/add" },
            { label: "Testimonials List", href: "/testimonials" },
            { label: "Deleted Testimonials", href: "/testimonials/deleted" }
          ]
        },
       
      ]
    },
    {
      title: "BLOGS",
      items: [
        {
          title: "Authors",
          icon: PenTool,
          sub: [
            { label: "Add New", href: "/authors/add" },
            { label: "All Authors", href: "/authors" },
            { label: "Deleted Authors", href: "/authors/deleted" }
          ]
        },
        {
          title: "Blogs",
          icon: Edit,
          sub: [
            { label: "Add New", href: "/blogs/add" },
            { label: "All Blogs", href: "/blogs" },
            { label: "Deleted Blogs", href: "/blogs/deleted" }
          ]
        },       
      ]
    },
    {
      title: "TRAVEL",
      items: [
        {
          title: "Package",
          icon: Plane,
          sub: [
            { label: "Add New", href: "/packages/add" },
            { label: "All Packages", href: "/packages" },
            { label: "Deleted Packages", href: "/packages/deleted" }
          ]
        },
       
      ]
    }
  ];

  return (
    <>
      {/* Mobile Menu Trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-40 md:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <MenuIcon className="h-6 w-6" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-300 ease-in-out md:sticky md:top-0",
          isCollapsed ? "md:w-20" : "md:w-72",
          // Mobile styles
          "w-72",
          !isMobileOpen && "-translate-x-full md:translate-x-0",
          className
        )}
      >
        {/* Toggle Button (Desktop only) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-8 h-6 w-6 rounded-full bg-white border border-gray-100 shadow-sm hover:bg-gray-50 z-50"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>

        {/* Close Button (Mobile only) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-4 top-4 md:hidden"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* Header */}
        <div className={cn("h-20 flex items-center px-6", isCollapsed ? "md:justify-center md:px-0" : "")}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
               <div className="h-4 w-4 rounded-full border-2 border-primary"></div>
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <span className="font-bold text-xl text-gray-900 md:block">Flup</span>
            )}
          </div>
        </div>

        {/* Menu */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="px-4 py-4 space-y-6">
            {menuItems.map((section, idx) => (
              <div key={idx}>
                {(!isCollapsed || isMobileOpen) && (
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Collapsible
                      key={item.title}
                      open={(!isCollapsed || isMobileOpen) && openItem === item.title}
                      onOpenChange={() => toggleItem(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start h-11 rounded-xl transition-all duration-200 group",
                            isCollapsed ? "md:justify-center md:px-0" : "px-3",
                            openItem === item.title 
                              ? "bg-primary/5 text-primary" 
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", (!isCollapsed || isMobileOpen) && "mr-3", openItem === item.title ? "text-primary" : "text-gray-400 group-hover:text-gray-600")} />
                          {(!isCollapsed || isMobileOpen) && (
                            <div className="flex-1 flex items-center justify-between">
                              <span className="font-medium">{item.title}</span>
                              <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", openItem === item.title && "transform rotate-180")} />
                            </div>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {(!isCollapsed || isMobileOpen) && (
                          <div className="mt-1 ml-4 pl-4 border-l border-gray-100 space-y-1">
                            {item.sub.map((subItem) => (
                              <Link
                                key={subItem.label}
                                href={subItem.href}
                                className="flex items-center w-full h-9 px-3 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            ))}

            {/* Dark Mode Toggle */}
            <div className={cn("flex items-center mt-4", isCollapsed ? "md:justify-center" : "justify-between px-2")}>
              {(!isCollapsed || isMobileOpen) && (
                <div className="flex items-center gap-3 text-gray-500 font-medium">
                  <Moon className="h-5 w-5" />
                  <span>Dark mode</span>
                </div>
              )}
              {isCollapsed && !isMobileOpen ? <Moon className="h-5 w-5 text-gray-400" /> : <Switch />}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-gray-50 space-y-4">
          <div className={cn("flex items-center gap-3", isCollapsed ? "md:justify-center" : "")}>
            <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
               <img src="https://github.com/shadcn.png" alt="User" className="h-full w-full object-cover" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">Harper Nelson</p>
                <p className="text-xs text-gray-500 truncate">Admin Manager</p>
              </div>
            )}
          </div>

          <Button 
            variant="ghost" 
            onClick={() => {
              localStorage.removeItem('authToken');
              window.location.href = '/login';
            }}
            className={cn(
              "w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50",
               isCollapsed ? "md:justify-center md:px-0" : ""
            )}
          >
            <LogOut className={cn("h-5 w-5 shrink-0", (!isCollapsed || isMobileOpen) && "mr-3")} />
            {(!isCollapsed || isMobileOpen) && <span>Log out</span>}
          </Button>
        </div>
      </div>
    </>
  );
}
