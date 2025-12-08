import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    console.log('📥 Logo proxy request for URL:', url);
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Decode the URL (it comes encoded)
    const decodedUrl = decodeURIComponent(url);
    console.log('🔗 Decoded URL:', decodedUrl);

    // Fetch the image from the vendor server
    const response = await fetch(decodedUrl, {
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error('❌ Image fetch failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    const contentLength = response.headers.get('content-length') || imageBuffer.byteLength;

    console.log('✅ Image fetched successfully:', {
      contentType,
      contentLength,
      bufferSize: imageBuffer.byteLength,
    });

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error: any) {
    console.error('🔥 Error in logo proxy:', error);
    
    if (error.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
    }
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request aborted' }, { status: 500 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Also handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}