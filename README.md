# TravelApp - Project Structure

## Overview
This is a full-stack travel booking application with **completely separate** admin panel and public website code.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: SQLite

## Architecture

### 🔐 **Admin Panel** (`/admin`)
- **Path**: `/admin/*`
- **Protected**: Yes - requires authentication
- **Components**: Isolated in `/client/app/admin/components/`
- **Layout**: Uses `AdminLayout` with auth middleware
- **No shared components** with public site (except ui primitives)

### 🌍 **Public Website** (root)
- **Path**: `/`, `/packages`, `/blogs`, etc.
- **Protected**: No - publicly accessible
- **Components**: In `/client/components/` (PublicHeader, PublicFooter)
- **Layout**: Uses root layout
- **No admin dependencies**

## Directory Structure

```
client/
├── app/
│   ├── admin/                    # 🔒 ADMIN ONLY
│   │   ├── components/           # Admin-specific components
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── RichTextEditor.tsx
│   │   │   └── BannerImage.tsx
│   │   ├── layout.tsx            # Auth protection wrapper
│   │   ├── dashboard/
│   │   ├── packages/
│   │   ├── blogs/
│   │   ├── users/
│   │   ├── teams/
│   │   ├── articles/
│   │   ├── places/
│   │   ├── authors/
│   │   ├── testimonials/
│   │   ├── menus/
│   │   └── trip-facts/
│   │
│   ├── packages/                 # 🌍 PUBLIC
│   │   ├── page.tsx              # Public packages list
│   │   └── [slug]/page.tsx       # Public package details
│   │
│   ├── blogs/                    # 🌍 PUBLIC
│   │   ├── page.tsx              # Public blogs list
│   │   └── [slug]/page.tsx       # Public blog details
│   │
│   ├── about/page.tsx            # 🌍 PUBLIC
│   ├── contact/page.tsx          # 🌍 PUBLIC
│   ├── login/page.tsx            # Shared (redirects admin to dashboard)
│   ├── page.tsx                  # 🌍 PUBLIC - Homepage
│   └── layout.tsx                # Root layout
│
├── components/                   # 🌍 PUBLIC ONLY
│   ├── PublicHeader.tsx
│   ├── PublicFooter.tsx
│   ├── ThemeProvider.tsx         # Shared (used by root layout)
│   └── ui/                       # shadcn components (shared)
│
server/
├── index.js                      # Express server
├── db.js                         # Database connection
└── data/users.db                 # SQLite database
```

## Authentication & Protection

### How Admin Routes Are Protected

1. **Admin Layout** (`/client/app/admin/layout.tsx`):
   - Checks for `token` in localStorage
   - Redirects to `/login` if no token found
   - Shows loading state while checking
   - Wraps ALL admin routes automatically

2. **Login Flow**:
   ```
   User visits /admin/packages
      ↓
   Admin layout checks token
      ↓
   No token? → Redirect to /login
      ↓
   User logs in → Token saved to localStorage
      ↓
   Redirect to /admin/dashboard
   ```

3. **Logout**:
   - Click logout button in admin header
   - Token removed from localStorage
   - Redirect to /login

### No Auth Required

These routes are **publicly accessible**:
- `/` - Homepage
- `/packages` - Packages list
- `/packages/[slug]` - Package details
- `/blogs` - Blogs list
- `/blogs/[slug]` - Blog post
- `/about` - About page
- `/contact` - Contact page

## URL Structure

### Public Website (No Auth)
```
/                        → Homepage
/packages                → All tour packages
/packages/[slug]         → Package details
/blogs                   → All blog posts
/blogs/[slug]            → Blog post
/about                   → About us
/contact                 → Contact form
/login                   → Admin login
```

### Admin Panel (Protected)
```
/admin/dashboard         → Admin home (stats)
/admin/packages          → Manage packages
/admin/packages/add      → Add package
/admin/packages/edit/[id] → Edit package
/admin/packages/trash    → Deleted packages
/admin/blogs             → Manage blogs
/admin/blogs/add         → Add blog
/admin/users             → Manage users
... (all admin routes require authentication)
```

## API Endpoints

### Public API (No Auth)
- `GET /api/packages` - List all packages
- `GET /api/packages/:idOrSlug` - Get package by ID or slug
- `GET /api/blogs` - List all blogs
- `GET /api/blogs/:idOrSlug` - Get blog by ID or slug

### Admin API (Should Require Auth - TODO)
- `POST /api/packages` - Create package
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package
- `POST /api/blogs` - Create blog
- `PUT /api/blogs/:id` - Update blog
- `POST /api/users` - Create user
- (More endpoints...)

## Development

### Running the Application

1. **Start backend:**
   ```bash
   cd server
   npm run dev
   ```
   Server: http://localhost:3001

2. **Start frontend:**
   ```bash
   cd client
   npm run dev
   ```
   Client: http://localhost:3000

### Default Admin Credentials
- Email: `admin@mail.com`
- Password: `1234567`

### Testing Auth Protection

1. Visit http://localhost:3000/admin/dashboard without logging in
   - Should redirect to /login

2. Login with admin credentials
   - Should redirect to /admin/dashboard

3. Click logout button
   - Should redirect to /login and clear token

## Component Separation

### ✅ Admin Components (in `/client/app/admin/components/`)
- `MainLayout` - Admin page wrapper
- `Sidebar` - Admin navigation
- `Header` - Admin header with logout
- `RichTextEditor` - Content editor
- `BannerImage` - Image uploader

### ✅ Public Components (in `/client/components/`)
- `PublicHeader` - Public site navigation
- `PublicFooter` - Public site footer

### ✅ Shared Components (Minimal)
- `ThemeProvider` - Dark mode (used by root layout)
- `ui/*` - shadcn primitives (Button, Input, etc.)

## Next.js Version Upgrades

When upgrading Next.js:
```bash
cd client
npm install next@latest react@latest react-dom@latest
npm run dev  # Test both public and admin
```

**Both public and admin will upgrade together**, which is intentional and recommended.

## Security Notes

### ✅ Implemented
- Admin routes protected by layout
- Token-based authentication check
- Logout functionality
- Separate admin/public code

### ⚠️ TODO (Recommended)
- Backend API authentication middleware
- Token expiration & refresh
- CSRF protection
- Rate limiting on login
- Password hashing in database

## Features

### Public Website
- Homepage with featured content
- Package browsing & search
- Blog reading
- Contact form
- About page
- Responsive design
- Dark mode support

### Admin Panel
- Protected dashboard
- Content management (packages, blogs, articles)
- User management
- Team management
- Testimonials
- Menu builder
- Rich text editing
- Image uploads
- Trash functionality
- Bulk operations
- Dark mode support
