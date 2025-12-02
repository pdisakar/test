'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  LayoutGrid,
  FileText,
  User,
  MessageSquare,
  PenTool,
  Edit,
  ChevronLeft,
  ChevronDown,
  Menu as MenuIcon,
  Plane,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/admin/components/ui/button';
import { ScrollArea } from '@/app/admin/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/admin/components/ui/collapsible';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

type MenuItem = {
  title: string;
  icon: React.ForwardRefExoticComponent<any>;
} & (
    | { href: string; sub?: never }
    | { sub: { label: string; href: string }[]; href?: never }
  );

type MenuSection = {
  title?: string;
  items: MenuItem[];
};

export function Sidebar({ className, isCollapsed, isMobileOpen, onMobileClose }: SidebarProps) {
  const [openItem, setOpenItem] = React.useState<string | null>(null);

  const toggleItem = (title: string) => {
    setOpenItem((prev) => prev === title ? null : title);
  };

  const menuItems: MenuSection[] = [
    {
      title: "MENU",
      items: [
        {
          title: "Users",
          icon: Users,
          sub: [
            { label: "Add New", href: "/admin/users/add" },
            { label: "All Users", href: "/admin/users" }
          ]
        },
        {
          title: "Places",
          icon: LayoutGrid,
          sub: [
            { label: "Add New", href: "/admin/places/add" },
            { label: "All Places", href: "/admin/places" },
            { label: "Deleted Places", href: "/admin/places/trash" }
          ]
        },
        {
          title: "Articles",
          icon: FileText,
          sub: [
            { label: "Home Contant", href: "/admin/articles/homepagecontent" },
            { label: "Add New", href: "/admin/articles/add" },
            { label: "All Articles", href: "/admin/articles" },
            { label: "Deleted Articles", href: "/admin/articles/trash" }
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
            { label: "Add New", href: "/admin/menus/add" },
            { label: "All Menus", href: "/admin/menus" },
            { label: "Deleted Menus", href: "/admin/menus/trash" }
          ]
        },
        {
          title: "Team",
          icon: User,
          sub: [
            { label: "Add New", href: "/admin/teams/add" },
            { label: "Team Members", href: "/admin/teams" },
            { label: "Deleted Members", href: "/admin/teams/trash" }
          ]
        },
        {
          title: "Testimonials",
          icon: MessageSquare,
          sub: [
            { label: "Add New", href: "/admin/testimonials/add" },
            { label: "Testimonials List", href: "/admin/testimonials" },
            { label: "Deleted Testimonials", href: "/admin/testimonials/trash" }
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
            { label: "Add New", href: "/admin/authors/add" },
            { label: "All Authors", href: "/admin/authors" },
            { label: "Deleted Authors", href: "/admin/authors/trash" }
          ]
        },
        {
          title: "Blogs",
          icon: Edit,
          sub: [
            { label: "Add New", href: "/admin/blogs/add" },
            { label: "All Blogs", href: "/admin/blogs" },
            { label: "Deleted Blogs", href: "/admin/blogs/trash" }
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
            { label: "Add New", href: "/admin/packages/add" },
            { label: "All Packages", href: "/admin/packages" },
            { label: "Trip Facts", href: "/admin/trip-facts" },
            { label: "Deleted Packages", href: "/admin/packages/trash" }
          ]
        },

      ]
    }
  ];

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 ease-in-out md:sticky md:top-0",
        isCollapsed ? "md:w-20" : "md:w-72",
        // Mobile styles
        "w-72",
        !isMobileOpen && "-translate-x-full md:translate-x-0",
        className
      )}
    >
      {/* Close Button (Mobile only) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMobileClose}
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
            <span className="font-bold text-xl text-gray-900 dark:text-white md:block">Flup</span>
          )}
        </div>
      </div>

      {/* Menu */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="px-4 py-4 space-y-6">
          {menuItems.map((section, idx) => (
            <div key={idx}>
              {(!isCollapsed || isMobileOpen) && (
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  item.href ? (
                    // Direct link without submenu
                    <Link
                      key={item.title}
                      href={item.href}
                      className={cn(
                        "flex items-center w-full h-11 rounded-xl transition-all duration-200 group",
                        isCollapsed ? "md:justify-center md:px-0" : "px-3 justify-start",
                        "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", (!isCollapsed || isMobileOpen) && "mr-3", "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
                      {(!isCollapsed || isMobileOpen) && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </Link>
                  ) : (
                    // Collapsible item with submenu
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
                              ? "bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary"
                              : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                          )}
                        >
                          <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", (!isCollapsed || isMobileOpen) && "mr-3", openItem === item.title ? "text-primary" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
                          {(!isCollapsed || isMobileOpen) && (
                            <div className="flex-1 flex items-center justify-between">
                              <span className="font-medium">{item.title}</span>
                              <ChevronDown className={cn("h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200", openItem === item.title && "transform rotate-180")} />
                            </div>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {(!isCollapsed || isMobileOpen) && item.sub && (
                          <div className="mt-1 ml-4 pl-4 border-l border-gray-100 dark:border-gray-800 space-y-1">
                            {item.sub.map((subItem) => (
                              <Link
                                key={subItem.label}
                                href={subItem.href}
                                className="flex items-center w-full h-9 px-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

