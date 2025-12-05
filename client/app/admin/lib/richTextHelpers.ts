import { getApiUrl, getImageUrl } from './api-config';

export const extractImagePaths = (html: string): string[] => {
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  const paths: string[] = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (src.startsWith('http://localhost:3001')) {
      paths.push(src.replace('http://localhost:3001', ''));
    } else if (src.startsWith('/uploads/')) {
      paths.push(src);
    }
  }
  return paths;
};

export const uploadBase64Image = async (base64: string): Promise<string> => {
  try {
    const res = await fetch(getApiUrl('upload/image'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64 }),
    });

    if (!res.ok) throw new Error('Failed to upload image');

    const data = await res.json();
    return data.path;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const processContentImages = async (html: string): Promise<string> => {
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  let newHtml = html;
  let match;
  
  // Find all base64 images
  const base64Matches: { fullMatch: string, src: string }[] = [];
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (src.startsWith('data:image')) {
      base64Matches.push({ fullMatch: match[0], src });
    }
  }

  // Upload each base64 image and replace in HTML
  for (const { src } of base64Matches) {
    try {
      const serverPath = await uploadBase64Image(src);
      const fullUrl = getImageUrl(serverPath);
      // Replace the specific base64 src with the new server URL
      // We use replace with the exact src string to ensure we target the right one
      newHtml = newHtml.replace(src, fullUrl);
    } catch (error) {
      console.error('Failed to upload base64 image in content:', error);
      // If upload fails, we might want to leave it or strip it. 
      // For now, leaving it as base64 or throwing error? 
      // Throwing error stops submission, which is safer than saving broken content.
      throw new Error('Failed to upload one or more images in the content.');
    }
  }

  return newHtml;
};

export const cleanupUnusedImages = async (initialPaths: string[], finalHtmlContent: string[]) => {
  const finalPaths = new Set<string>();
  finalHtmlContent.forEach(html => {
    extractImagePaths(html).forEach(path => finalPaths.add(path));
  });

  const unusedPaths = initialPaths.filter(path => !finalPaths.has(path));

  for (const path of unusedPaths) {
    try {
      await fetch(getApiUrl('upload/image'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
    } catch (err) {
      console.error('Failed to delete unused image:', path, err);
    }
  }
};
