import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: POST /api/projects/[projectId]/save
 *
 * This endpoint mimics saving the project data.
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    // In a real application, you would save 'body' (which contains the HTML content) to your database.
    console.log(`Saving project ${projectId}:`, body);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Project saved successfully',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving project:', error);
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}
