import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ ok: false, error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const contentType = request.headers.get('content-type') || 'application/octet-stream';

    const body = await request.arrayBuffer();

    const upstreamResponse = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body,
    });

    const ok = upstreamResponse.ok;
    const status = upstreamResponse.status;
    const statusText = upstreamResponse.statusText;

    if (!ok) {
      return NextResponse.json(
        {
          ok: false,
          status,
          statusText,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status,
        statusText,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Upload proxy error',
      },
      { status: 500 }
    );
  }
}
