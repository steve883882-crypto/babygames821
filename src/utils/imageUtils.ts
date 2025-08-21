// Utility functions for image processing

export function resizeImageForAPI(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw and resize
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.src = URL.createObjectURL(file);
  });
}

export function validateImageFile(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  return allowedTypes.includes(file.type) && file.size <= maxSize;
}

export function getImageOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const dataView = new DataView(arrayBuffer);
      
      // Check for EXIF data
      if (dataView.getUint16(0) !== 0xFFD8) {
        resolve(1); // Not a JPEG, assume normal orientation
        return;
      }

      let offset = 2;
      let orientation = 1;

      while (offset < dataView.byteLength) {
        const marker = dataView.getUint16(offset);
        offset += 2;

        if (marker === 0xFFE1) { // EXIF marker
          const exifLength = dataView.getUint16(offset);
          offset += 2;
          
          // Look for orientation tag
          const exifData = new DataView(arrayBuffer, offset, exifLength - 2);
          // Simplified EXIF parsing - in production, use a proper EXIF library
          resolve(orientation);
          return;
        }
        
        offset += dataView.getUint16(offset);
      }

      resolve(orientation);
    };
    
    reader.readAsArrayBuffer(file);
  });
}