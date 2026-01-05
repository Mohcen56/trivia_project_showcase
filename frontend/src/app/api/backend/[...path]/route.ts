import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Catch-all API proxy route.
 * All client API calls go through here, and we attach the auth token from HttpOnly cookies.
 * This keeps tokens secure and never exposed to the browser.
 */

async function proxyRequest(
  request: Request,
  method: string,
  pathSegments: string[]
) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: 'API base URL not configured' },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;

  // Reconstruct the path with trailing slash (Django requires it for POST)
  const path = '/' + pathSegments.join('/') + '/';
  
  // Get query string from original request
  const url = new URL(request.url);
  const queryString = url.search;
  
  // Remove trailing slash from API_BASE_URL if present to avoid double slashes
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const upstreamUrl = `${baseUrl}${path}${queryString}`;

  // Prepare headers
  const headers: HeadersInit = {};
  
  if (authToken) {
    headers['Authorization'] = `Token ${authToken}`;
  }

  // Handle content type and body
  const contentType = request.headers.get('content-type');
  let body: BodyInit | undefined;

  if (method !== 'GET' && method !== 'HEAD') {
    if (contentType?.includes('multipart/form-data')) {
      // For file uploads, pass through the FormData
      body = await request.formData();
    } else if (contentType?.includes('application/json')) {
      headers['Content-Type'] = 'application/json';
      body = await request.text();
    } else if (contentType) {
      headers['Content-Type'] = contentType;
      body = await request.text();
    }
  }

  try {
    const response = await fetch(upstreamUrl, {
      method,
      headers,
      body,
      cache: 'no-store', // Don't cache authenticated requests
    });

    // Get response data
    const responseContentType = response.headers.get('content-type');
    let data: unknown;

    if (responseContentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return response with same status code
    if (typeof data === 'string') {
      return new NextResponse(data, {
        status: response.status,
        headers: { 'Content-Type': responseContentType || 'text/plain' },
      });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', detail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, 'GET', (await params).path);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, 'POST', (await params).path);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, 'PUT', (await params).path);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, 'PATCH', (await params).path);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, 'DELETE', (await params).path);
}
