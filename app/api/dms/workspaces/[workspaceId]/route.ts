import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dms/workspaces/[workspaceId]
 * Proxy endpoint to fetch workspace data from DMS backend
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await context.params;

    // Get the authorization token from cookies or headers
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Get the DMS backend URL from environment variables
    const dmsBaseUrl = process.env.NEXT_PUBLIC_DMS_API_URL || 'http://localhost:8000';

    // Make request to DMS backend
    const response = await fetch(`${dmsBaseUrl}/api/dms/workspaces/${workspaceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`DMS API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: `DMS API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching workspace data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch workspace data',
      },
      { status: 500 }
    );
  }
}
