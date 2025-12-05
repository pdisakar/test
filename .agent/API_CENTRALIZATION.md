# API Centralization Summary

## Overview
Found 92+ instances of hardcoded `http://localhost:3001` URLs across admin pages.
All should use the centralized `api-config.ts` helpers.

## Centralized Helper Functions (in `api-config.ts`)

```typescript
// Build API URLs
getApiUrl(path: string) => string
// Example: getApiUrl('testimonials') => 'http://localhost:3001/api/testimonials'

// Get image URLs
getImageUrl(path: string) => string  
// Example: getImageUrl('/uploads/image.jpg') => 'http://localhost:3001/uploads/image.jpg'

// Upload images
uploadImage(base64Image: string, type?: string) => Promise<string>
// Returns the uploaded image path

// Delete images
deleteImage(imagePath: string) => Promise<void>

// Normalize image paths (remove localhost if present)
normalizeImagePath(url: string) => string
```

## Files Requiring Updates

### High Priority (Most Occurrences)
1. **packages/add/page.tsx** - 7 occurrences
2. **packages/edit/[id]/page.tsx** - 7 occurrences  
3. **places/add/page.tsx** - 4 occurrences
4. **places/edit/[id]/page.tsx** - 4 occurrences
5. **testimonials/add/page.tsx** - 3 occurrences
6. **testimonials/edit/[id]/page.tsx** - 3 occurrences
7. **teams/add/page.tsx** - 3 occurrences
8. **teams/edit/[id]/page.tsx** - 3 occurrences

### Medium Priority
- articles/add/page.tsx
- articles/edit/[id]/page.tsx  
- blogs/add/page.tsx
- blogs/edit/[id]/page.tsx
- authors/add/page.tsx
- authors/edit/[id]/page.tsx
- menus/page.tsx
- trip-facts/page.tsx

### Low Priority (Trash/Bulk Operations)
- */trash/page.tsx files
- */page.tsx (list pages with bulk delete)

## Replacement Patterns

### Pattern 1: Image Upload
**Before:**
```typescript
const res = await fetch('http://localhost:3001/api/upload/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: base64Image, type: 'avatar' }),
});
const data = await res.json();
return data.path;
```

**After:**
```typescript
import { uploadImage } from '@/app/admin/lib/api-config';
return await uploadImage(base64Image, 'avatar');
```

### Pattern 2: Image Delete
**Before:**
```typescript
await fetch('http://localhost:3001/api/upload/image', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ path: imagePath }),
});
```

**After:**
```typescript
import { deleteImage } from '@/app/admin/lib/api-config';
await deleteImage(imagePath);
```

### Pattern 3: API Calls
**Before:**
```typescript
const res = await fetch(`http://localhost:3001/api/testimonials/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

**After:**
```typescript
import { getApiUrl } from '@/app/admin/lib/api-config';
const res = await fetch(getApiUrl(`testimonials/${id}`), {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

### Pattern 4: URL Normalization
**Before:**
```typescript
if (url.startsWith('http://localhost:3001')) {
  return url.replace('http://localhost:3001', '');
}
```

**After:**
```typescript
import { normalizeImagePath } from '@/app/admin/lib/api-config';
return normalizeImagePath(url);
```

## Benefits
1. ✅ Single source of truth for API URL
2. ✅ Easy to switch environments (dev/staging/prod)
3. ✅ Cleaner, more maintainable code
4. ✅ Reduced code duplication
5. ✅ Type-safe helper functions

## Status
- [x] Created centralized helper functions in api-config.ts
- [ ] Update testimonials pages (in progress)
- [ ] Update teams pages
- [ ] Update packages pages
- [ ] Update places pages
- [ ] Update articles pages
- [ ] Update blogs pages
- [ ] Update authors pages
- [ ] Update other admin pages
