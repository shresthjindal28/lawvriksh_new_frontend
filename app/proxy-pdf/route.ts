import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return new NextResponse('Invalid url parameter', { status: 400 });
  }

  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    return new NextResponse('Invalid url protocol', { status: 400 });
  }

  try {
    const forwardHeaders = new Headers();
    const range = req.headers.get('range');
    const ifRange = req.headers.get('if-range');
    if (range) forwardHeaders.set('range', range);
    if (ifRange) forwardHeaders.set('if-range', ifRange);

    const response = await fetch(targetUrl.toString(), {
      headers: forwardHeaders,
    });

    if (!response.ok) {
      console.error(`Proxy failed to fetch PDF: ${response.status} ${response.statusText}`);
      return new NextResponse(`Failed to fetch PDF: ${response.statusText}`, {
        status: response.status,
      });
    }

    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/pdf');
    if (response.headers.has('Content-Length')) {
      headers.set('Content-Length', response.headers.get('Content-Length')!);
    }
    if (response.headers.has('Accept-Ranges')) {
      headers.set('Accept-Ranges', response.headers.get('Accept-Ranges')!);
    }
    if (response.headers.has('Content-Range')) {
      headers.set('Content-Range', response.headers.get('Content-Range')!);
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
