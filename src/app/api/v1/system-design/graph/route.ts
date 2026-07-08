import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/systemDesignV2';

export const runtime = 'edge';

export async function GET() {
  try {
    // 1. Fetch Modules
    const { data: modules, error: modErr } = await supabaseAdmin
      .from("sd_modules")
      .select("id, title, level_order")
      .order("level_order", { ascending: true });

    if (modErr) throw modErr;

    // 2. Fetch Lessons
    const { data: lessons, error: lesErr } = await supabaseAdmin
      .from("sd_lessons")
      .select("id, module_id, title, difficulty, content");

    if (lesErr) throw lesErr;

    const nodes: any[] = [];
    const edges: any[] = [];

    // Map modules for quick lookup
    const moduleMap = new Map();
    modules.forEach((m: any, idx: number) => {
      moduleMap.set(m.id, { ...m, index: idx });
      
      // Add Module Node
      nodes.push({
        id: `mod-${m.id}`,
        position: { x: 300, y: idx * 250 },
        data: { label: m.title },
        type: 'input',
        style: {
          background: 'rgba(99, 102, 241, 0.15)',
          border: '2px solid rgba(99, 102, 241, 0.5)',
          color: '#818cf8',
          fontWeight: 'bold',
          borderRadius: '12px',
          padding: '10px 15px',
          width: 220,
          textAlign: 'center'
        }
      });
    });

    // Track lesson node positions
    const moduleLessonsCount: Record<string, number> = {};

    lessons.forEach((lesson: any) => {
      const modId = lesson.module_id;
      const modInfo = moduleMap.get(modId);
      if (!modInfo) return;

      if (!moduleLessonsCount[modId]) {
        moduleLessonsCount[modId] = 0;
      }
      const count = moduleLessonsCount[modId];
      moduleLessonsCount[modId]++;

      // Calculate horizontal layout: alternate left and right of the module center node
      const offset = 260;
      const isEven = count % 2 === 0;
      const step = Math.floor(count / 2) + 1;
      const xPos = 300 + (isEven ? -offset * step : offset * step);
      const yPos = modInfo.index * 250 + 60 + (count > 1 ? 50 : 0);

      // Parse JSON content if string
      const content = typeof lesson.content === 'string' ? JSON.parse(lesson.content) : lesson.content;

      // Add Lesson Node
      nodes.push({
        id: lesson.id,
        position: { x: xPos, y: yPos },
        data: { label: lesson.title },
        style: {
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          width: 200,
          textAlign: 'center'
        }
      });

      // Edge from Module Node to Lesson Node
      edges.push({
        id: `e-mod-${modId}-${lesson.id}`,
        source: `mod-${modId}`,
        target: lesson.id,
        style: { stroke: 'rgba(99, 102, 241, 0.2)', strokeWidth: 1.5 },
        animated: false
      });

      // Prerequisites Edges
      if (content.prerequisites && Array.isArray(content.prerequisites)) {
        content.prerequisites.forEach((prereqId: string) => {
          // Connect prerequisite lesson to current lesson
          const exists = lessons.some((l: any) => l.id === prereqId);
          if (exists) {
            edges.push({
              id: `e-prereq-${prereqId}-${lesson.id}`,
              source: prereqId,
              target: lesson.id,
              label: 'requires',
              style: { stroke: 'rgba(239, 68, 68, 0.4)', strokeWidth: 1.5, strokeDasharray: '5,5' },
              labelStyle: { fill: '#ef4444', fontSize: '9px', fontWeight: 'bold' }
            });
          }
        });
      }

      // Related Lessons Edges
      if (content.related_lessons && Array.isArray(content.related_lessons)) {
        content.related_lessons.forEach((relatedId: string) => {
          const exists = lessons.some((l: any) => l.id === relatedId);
          if (exists) {
            edges.push({
              id: `e-related-${lesson.id}-${relatedId}`,
              source: lesson.id,
              target: relatedId,
              label: 'related',
              style: { stroke: 'rgba(16, 185, 129, 0.4)', strokeWidth: 1.5 },
              labelStyle: { fill: '#10b981', fontSize: '9px' }
            });
          }
        });
      }
    });

    return NextResponse.json({ nodes, edges });
  } catch (error: any) {
    console.error("Failed to build Knowledge Graph dynamic relations:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
