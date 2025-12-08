/**
 * Utility to load vendor logos with CORS handling
 */

export async function loadLogoAsBase64(logoUrl: string): Promise<string | null> {
  try {
    console.log('🔄 Loading logo:', logoUrl);
    
    if (!logoUrl || logoUrl.trim() === '') {
      console.log('No logo URL provided');
      return null;
    }

    // Use our server-side proxy
    const encodedUrl = encodeURIComponent(logoUrl);
    const proxyUrl = `/api/vendor/logo?url=${encodedUrl}`;
    
    console.log('📤 Calling proxy:', proxyUrl);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Proxy failed:', response.status, errorText);
      return null;
    }

    const blob = await response.blob();
    console.log('✅ Blob received:', {
      size: blob.size,
      type: blob.type,
    });

    if (blob.size === 0) {
      console.error('❌ Empty blob received');
      return null;
    }

    // Convert to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        console.log('✅ Base64 conversion successful, length:', base64String.length);
        resolve(base64String);
      };
      reader.onerror = () => {
        console.error('❌ FileReader error');
        reject(new Error('Failed to convert image to base64'));
      };
      reader.readAsDataURL(blob);
    });

  } catch (error) {
    console.error('🔥 Error in loadLogoAsBase64:', error);
    return null;
  }
}

/**
 * Get a colored placeholder logo with vendor initial
 */
export function getPlaceholderLogo(vendorName: string): string {
  const initial = vendorName?.charAt(0).toUpperCase() || 'V';
  
  // Color palette
  const colors = [
    { bg: '#3B82F6', text: '#FFFFFF' }, // Blue
    { bg: '#10B981', text: '#FFFFFF' }, // Green
    { bg: '#8B5CF6', text: '#FFFFFF' }, // Purple
    { bg: '#F59E0B', text: '#FFFFFF' }, // Amber
    { bg: '#EF4444', text: '#FFFFFF' }, // Red
  ];
  
  const colorIndex = vendorName ? vendorName.charCodeAt(0) % colors.length : 0;
  const color = colors[colorIndex];
  
  // Create SVG
  const svg = `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" fill="${color.bg}" stroke="#e5e7eb" stroke-width="2"/>
    <text x="30" y="38" text-anchor="middle" fill="${color.text}" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
      ${initial}
    </text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}