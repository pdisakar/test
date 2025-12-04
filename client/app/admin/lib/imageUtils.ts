/**
 * Process an image file to WebP format with quality optimization
 * @param file - The image file to process
 * @param quality - Quality setting (0.0 to 1.0), default 0.92
 * @param maxSize - Maximum file size in bytes, default 5MB
 * @returns Base64 encoded WebP image string
 */
export async function processImageToWebP(
  file: File,
  quality: number = 0.92,
  maxSize: number = 1024 * 1024 * 5
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const img = new Image();
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Preserve original resolution
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to WebP
        let webpImage = canvas.toDataURL('image/webp', quality);
        let currentQuality = quality;

        // Check file size and reduce quality if needed
        const checkSize = async (dataUrl: string): Promise<number> => {
          const base64 = dataUrl.split(',')[1];
          const bytes = atob(base64).length;
          return bytes;
        };

        let size = await checkSize(webpImage);

        // Reduce quality if file is too large
        while (size > maxSize && currentQuality > 0.5) {
          currentQuality *= 0.9;
          webpImage = canvas.toDataURL('image/webp', currentQuality);
          size = await checkSize(webpImage);
        }

        if (size > maxSize) {
          reject(new Error(`Image size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`));
          return;
        }

        resolve(webpImage);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate if a base64 image exceeds the size limit
 * @param base64Image - Base64 encoded image string
 * @param maxSizeMB - Maximum size in megabytes
 * @returns Object with isValid boolean and size in MB
 */
export function validateImageSize(base64Image: string, maxSizeMB: number = 5): { isValid: boolean; sizeMB: number } {
  if (!base64Image || !base64Image.startsWith('data:')) {
    return { isValid: true, sizeMB: 0 };
  }

  const base64Data = base64Image.split(',')[1];
  const bytes = atob(base64Data).length;
  const sizeMB = bytes / (1024 * 1024);

  return {
    isValid: sizeMB <= maxSizeMB,
    sizeMB: parseFloat(sizeMB.toFixed(2))
  };
}
