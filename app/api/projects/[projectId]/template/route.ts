import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: GET /api/projects/[projectId]/template
 *
 * This endpoint fetches template data from project metadata.
 * If project has AI-generated template data, it returns that.
 * Otherwise, it falls back to mock data for legacy/new projects.
 */

// Mock template data for new projects or when backend data is not available
const getMockTemplateData = () => ({
  time: Date.now(),
  version: '1.0',
  content:
    '<h1 style="text-align: center; font-weight: bold; font-size: 18pt; margin-bottom: 15pt;"><strong>WRIT PETITION (CIVIL)</strong></h1><h2 style="text-align: center; font-weight: bold; font-size: 16pt; margin-bottom: 12pt; text-decoration: underline;"><strong><u>CAUSE TITLE</u></strong></h2><p style="text-align: center;">IN THE HIGH COURT OF JUDICATURE AT TELANGANA</p><p style="text-align: center;">WRIT PETITION NO. ______ of 2026</p><p style="text-align: left;">{{petitioner_name}}, S/o. {{petitioner_father_name}}, Aged about {{petitioner_age}} years, Residing at {{petitioner_address}} ... PETITIONER</p><p style="text-align: center;">VERSUS</p><p style="text-align: left;">1. The State of Telangana, Represented by its Principal Secretary, Revenue Department, Secretariat, Hyderabad.\\n2. The District Collector, {{district_name}}, {{district_address}}.\\n3. The Tahsildar, {{mandal_name}}, {{mandal_address}} ... RESPONDENTS</p><h2 style="text-align: center; font-weight: bold; font-size: 16pt; margin-bottom: 12pt; text-decoration: underline;"><strong><u>STATEMENT OF FACTS</u></strong></h2><p style="text-align: justify; margin-bottom: 12pt; line-height: 1.4;">1. The Petitioner is a law-abiding citizen of India and resides at the address mentioned above. The Petitioner belongs to {{caste_category}} community and is primarily dependent on agriculture for his livelihood.</p>',
  variables: {
    petitioner_name: {
      value: '',
      editable: true,
      type: 'text',
      label: 'Petitioner Name',
    },
    petitioner_father_name: {
      value: '',
      editable: true,
      type: 'text',
      label: 'Petitioner Father Name',
    },
    petitioner_age: {
      value: '',
      editable: true,
      type: 'text',
      label: 'Petitioner Age',
    },
    petitioner_address: {
      value: '',
      editable: true,
      type: 'text',
      label: 'Petitioner Address',
    },
    district_name: {
      value: '',
      editable: true,
      type: 'text',
      label: 'District Name',
    },
    mandal_name: {
      value: '',
      editable: true,
      type: 'text',
      label: 'Mandal Name',
    },
    district_address: {
      value: '',
      editable: true,
      type: 'text',
      label: 'District Address',
    },
    mandal_address: {
      value: '',
      editable: true,
      type: 'text',
      label: 'Mandal Address',
    },
    caste_category: {
      value: '',
      editable: true,
      type: 'text',
      label: 'Caste Category',
    },
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const authHeader = request.headers.get('Authorization') || '';

    console.log('🔍 Fetching template for project:', projectId);
    console.log('🔑 Auth header present:', !!authHeader);

    // Fetch project data from backend
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

    // Handle non-OK responses by falling back to mock data
    if (!response.ok) {
      if (response.status === 404) {
        console.log('⚠️ Project not found in backend (404), falling back to mock data');
      } else {
        const errorText = await response.text();
        console.error('❌ Backend error:', errorText);
        console.log('⚠️ Backend error, falling back to mock data');
      }
      // Return mock data for any backend error
      return NextResponse.json(getMockTemplateData());
    }

    const projectData = await response.json();
    console.log('✅ Project data fetched successfully');

    // Check if project has template data in metadata
    // Check if project has template data in metadata
    let metadata = projectData.data?.workspace?.metadata;

    // Unwrap metadata if it's wrapped in 'data' property
    // Similar to frontend logic, keep unwrapping 'data' until we find the actual payload
    while (
      metadata &&
      metadata.data &&
      typeof metadata.data === 'object' &&
      !Array.isArray(metadata.data) &&
      !metadata.templateData
    ) {
      console.log('📦 Unwrapping metadata layer...');
      metadata = metadata.data;
    }

    const templateData = metadata?.templateData;

    if (templateData) {
      console.log('📄 Template data found in metadata');
      console.log('📊 Variables count:', Object.keys(templateData.variables || {}).length);

      // Check if there's saved content in content.data.data.blocks
      const savedBlocks = projectData.data?.workspace?.content?.data?.data?.blocks;
      let savedHtmlContent = null;
      let savedVariables = null;

      if (savedBlocks && Array.isArray(savedBlocks) && savedBlocks.length > 0) {
        const draftBlock = savedBlocks.find(
          (block: any) => block.id === 'draft-content' && block.data
        );

        if (draftBlock?.data) {
          // Check for saved HTML in data.text field
          if (draftBlock.data.text) {
            console.log('💾 Found saved HTML content in blocks (data.text)');
            savedHtmlContent = draftBlock.data.text;
          }
          // Fallback: if there's TipTap JSON but no HTML, we can't use it directly
          // TiptapEditor needs HTML, not JSON
          else if (draftBlock.data.json) {
            console.log('⚠️ Found TipTap JSON but no HTML - will use original template');
          }
        }
      }

      // Check if saved metadata has updated templateData with saved variable values
      if (metadata?.templateData) {
        console.log('🔄 Checking for updated template data in metadata');
        savedVariables = metadata.templateData.variables;
      }

      // Parse variables if they are JSON strings (backend double-encodes them)
      const parsedVariables: Record<string, any> = {};

      // Use saved variables if available, otherwise use original template variables
      const variablesToParse = savedVariables || templateData.variables;

      if (variablesToParse) {
        for (const [key, value] of Object.entries(variablesToParse)) {
          try {
            // If value is a JSON string, parse it
            if (typeof value === 'string') {
              parsedVariables[key] = JSON.parse(value);
              console.log(`✅ Parsed variable: ${key}`);
            } else {
              // If already an object, use as-is
              parsedVariables[key] = value;
              console.log(`✅ Variable already parsed: ${key}`);
            }
          } catch (e) {
            console.error(`❌ Failed to parse variable ${key}:`, e);
            // Fallback: create a basic structure
            parsedVariables[key] = {
              value: value,
              editable: true,
              type: 'text',
              label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            };
          }
        }
      }

      console.log('🎉 Returning template with', Object.keys(parsedVariables).length, 'variables');

      // Return template data with:
      // 1. Saved HTML content if available (otherwise original template content)
      // 2. Parsed variables with saved values
      return NextResponse.json({
        ...templateData,
        content: savedHtmlContent || templateData.content,
        variables: parsedVariables,
      });
    }

    console.log('⚠️ No template data found in project metadata, returning mock data');
    return NextResponse.json(getMockTemplateData());
  } catch (error) {
    console.error('❌ Error fetching template:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');

    // Return mock data even on exception
    console.log('⚠️ Exception occurred, returning mock data');
    return NextResponse.json(getMockTemplateData());
  }
}
