import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this route is dynamic

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const type = searchParams.get('type') || 'logo'; // 'logo' or 'qr'

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log(`🌐 Proxy request for ${type}:`, imageUrl);

    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // Validate URL
    if (!decodedUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Security: Validate allowed domains
    const allowedDomains = [
      'res.cloudinary.com',
      'chart.googleapis.com',
      'api.qrserver.com',
      'quickchart.io',
      'manhemdigitalsolutions.com',
      'localhost' // For development
    ];
    
    const urlObj = new URL(decodedUrl);
    const isAllowedDomain = allowedDomains.some(domain => 
      urlObj.hostname.includes(domain)
    );
    
    if (!isAllowedDomain) {
      console.warn(`🚨 Blocked request to unauthorized domain: ${urlObj.hostname}`);
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403 }
      );
    }

    // Set different timeouts based on type
    const timeout = type === 'qr' ? 15000 : 10000; // 15s for QR, 10s for logos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Fetch the image from the external URL
      const response = await fetch(decodedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*,*/*;q=0.8',
          'Referer': 'https://manhemdigitalsolutions.com/',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`❌ Failed to fetch ${type}:`, response.status, response.statusText);
        
        // If QR code fails, return a generated fallback QR code
        if (type === 'qr') {
          return generateFallbackQRCode();
        }
        
        return NextResponse.json(
          { error: `Failed to fetch image: ${response.status}` },
          { status: response.status }
        );
      }

      // Get the image data
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      // Check if the response is actually an image
      if (!contentType.startsWith('image/')) {
        console.error('❌ Response is not an image:', contentType);
        
        // If QR code returns non-image, generate a fallback
        if (type === 'qr') {
          return generateFallbackQRCode();
        }
        
        return NextResponse.json(
          { error: 'URL does not point to a valid image' },
          { status: 400 }
        );
      }

      console.log(`✅ ${type.toUpperCase()} fetched successfully:`, {
        size: imageBuffer.byteLength,
        type: contentType,
        domain: urlObj.hostname
      });

      // Set cache headers based on type
      const isQRCode = type === 'qr' || 
                      decodedUrl.includes('qr') || 
                      decodedUrl.includes('chart.googleapis.com/chart');
      
      const cacheControl = isQRCode 
        ? 'public, max-age=604800, immutable'  // 1 week for QR codes (rarely change)
        : 'public, max-age=86400, stale-while-revalidate=3600'; // 24 hours for logos

      // Return the image
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': imageBuffer.byteLength.toString(),
          'Cache-Control': cacheControl,
          'Access-Control-Allow-Origin': '*',
          'Vary': 'Accept-Encoding',
        },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`❌ ${type.toUpperCase()} fetch timeout`);
        
        // Return fallback for timeout
        if (type === 'qr') {
          return generateFallbackQRCode();
        }
        
        return NextResponse.json(
          { error: 'Image fetch timeout' },
          { status: 504 }
        );
      }
      
      console.error(`🔥 Fetch error for ${type}:`, fetchError);
      
      // Return fallback for QR codes on any error
      if (type === 'qr') {
        return generateFallbackQRCode();
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('🔥 Error in image proxy route:', error);
    
    // Even on server error, try to return a fallback QR code
    const type = new URL(request.url).searchParams.get('type') || 'logo';
    if (type === 'qr') {
      return generateFallbackQRCode();
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate fallback QR code
function generateFallbackQRCode(): NextResponse {
  console.log('🔄 Generating fallback QR code');
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#f8fafc"/>
  <rect x="20" y="20" width="160" height="160" fill="white" stroke="#e2e8f0" stroke-width="2" rx="8"/>
  <rect x="40" y="40" width="30" height="30" fill="#1e40af"/>
  <rect x="130" y="40" width="30" height="30" fill="#1e40af"/>
  <rect x="40" y="130" width="30" height="30" fill="#1e40af"/>
  <rect x="85" y="85" width="30" height="30" fill="#f1f5f9"/>
  <path d="M85 85 L115 115" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
  <path d="M115 85 L85 115" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
  <text x="100" y="175" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="12" font-weight="500">
    SCAN TO PAY
  </text>
  <text x="100" y="100" text-anchor="middle" fill="#475569" font-family="Arial, sans-serif" font-size="10">
    UPI QR
  </text>
</svg>`;

  const svgBuffer = Buffer.from(svg, 'utf-8');
  
  return new NextResponse(svgBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Length': svgBuffer.byteLength.toString(),
      'Cache-Control': 'public, max-age=300', // 5 minutes for fallback
      'Access-Control-Allow-Origin': '*',
      'X-Fallback': 'true',
    },
  });
}