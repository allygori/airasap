import { NextResponse } from 'next/server';
import { getTenantBoundModel } from '@/lib/api/scoped-by-organization';
import { Project } from '@/models/Project';

export async function GET() {
  try {
    const ScopedProject =
      await getTenantBoundModel(Project);

    // Automatically appends target org filter securely behind the scenes
    const projects = await ScopedProject.find({});

    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    );
  }
}
