import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this route is dynamic

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log('🌐 Proxy request for image:', imageUrl);

    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // Validate URL
    if (!decodedUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Set timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Fetch the image from the external URL
      const response = await fetch(decodedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*,*/*;q=0.8',
          'Referer': 'https://manhemdigitalsolutions.com/',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('❌ Failed to fetch image:', response.status, response.statusText);
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
        return NextResponse.json(
          { error: 'URL does not point to a valid image' },
          { status: 400 }
        );
      }

      console.log('✅ Image fetched successfully:', {
        size: imageBuffer.byteLength,
        type: contentType
      });

      // Return the image
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': imageBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('❌ Image fetch timeout');
        return NextResponse.json(
          { error: 'Image fetch timeout' },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('🔥 Error in logo proxy route:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}