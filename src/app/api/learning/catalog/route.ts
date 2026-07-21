import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LearningCatalogService, CatalogSearchFilters } from '@/lib/learning/services/LearningCatalogService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    // Use a default user if not properly authenticated (following existing pattern)
    let userId = "11111111-1111-1111-1111-111111111111"; 
    
    if (!email) {
      userId = "00000000-0000-0000-0000-000000000000";
    }

    const { searchParams } = new URL(request.url);
    
    const filters: CatalogSearchFilters = {
      query: searchParams.get('q') || undefined,
      domainId: searchParams.get('domainId') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      status: (searchParams.get('status') as 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED') || undefined,
    };

    const maxDuration = searchParams.get('maxDurationMinutes');
    if (maxDuration) {
      filters.maxDurationMinutes = parseInt(maxDuration, 10);
    }
    
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      filters.tags = tagsParam.split(',').map(t => t.trim());
    }

    const catalogData = await LearningCatalogService.searchCatalog(userId, filters);
    
    return NextResponse.json({ success: true, data: catalogData });
  } catch (error: any) {
    console.error("Catalog API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
