import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: GET /api/projects/[projectId]
 *
 * This endpoint fetches project data from the backend.
 * Returns project data if found, or a graceful error if not.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const authHeader = request.headers.get('Authorization') || '';

    console.log('🔍 Fetching project:', projectId);
    console.log('🔑 Auth header present:', !!authHeader);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dms/workspaces/${projectId}`,
      {
        headers: {
          Authorization: authHeader,
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('📡 Backend response status:', response.status);

    if (!response.ok) {
      // For 404, log but still return a proper error response
      if (response.status === 404) {
        console.log(
          '⚠️ Project not found in backend (404) - this may be expected for newly created projects'
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Backend error:', errorData);
      }

      return NextResponse.json(
        { error: 'Project not found', success: false },
        { status: response.status }
      );
    }

    const projectData = await response.json();
    console.log('✅ Project data fetched successfully');

    // Extract workspace data
    const workspace = projectData.data?.workspace;

    if (!workspace) {
      console.error('⚠️ No workspace data in response');
      return NextResponse.json({ error: 'Invalid project data', success: false }, { status: 500 });
    }

    // Return data in the format expected by the frontend
    // Match the format that TitleHeader expects
    return NextResponse.json({
      id: workspace.id,
      project_name: workspace.title, // Map title to project_name
      title: workspace.title,
      updated_at: workspace.updated_at,
      created_at: workspace.created_at,
      category: workspace.category,
      access_type: workspace.access_type,
    });
  } catch (error) {
    console.error('❌ Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project data', success: false },
      { status: 500 }
    );
  }
}
