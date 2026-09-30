export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatINR } from '@/lib/utils';
import { calculateFounderAttention } from '@/lib/priorityEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Calculate Founder Attention & Priorities Engine
    const { briefing, priorities, upNext } = await calculateFounderAttention(today);

    // 2. Canonical Active Partners Count
    const activePartnersRow = (await db.prepare(`
      SELECT COUNT(*) as count FROM relationships r
      JOIN companies c ON r.company_id = c.id
      WHERE c.is_archived = 0 AND r.status IN ('Active Partner', 'Repeat Partner', 'Strategic Partner')
    `).get()) as { count: number };

    const activePartnersCount = activePartnersRow ? activePartnersRow.count : 0;

    // 3. Open Opportunities & Pipeline Value
    const oppsRow = (await db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(o.estimated_value_amount), 0) as total_val
      FROM opportunities o
      JOIN companies c ON o.company_id = c.id
      WHERE c.is_archived = 0 AND (o.is_archived IS NULL OR o.is_archived = 0) AND o.stage NOT IN ('Closed Won', 'Closed Lost')
    `).get()) as { count: number; total_val: number };

    // 4. Follow-ups Due Today
    const dueTodayRow = (await db.prepare(`
      SELECT COUNT(*) as count FROM relationships r
      JOIN companies c ON r.company_id = c.id
      WHERE c.is_archived = 0 AND r.next_action_date = ? AND (r.next_action NOT LIKE '%No further action%' OR r.next_action IS NULL)
    `).get(today)) as { count: number };

    // 5. Overdue Follow-ups
    const overdueRow = (await db.prepare(`
      SELECT COUNT(*) as count FROM relationships r
      JOIN companies c ON r.company_id = c.id
      WHERE c.is_archived = 0 AND r.next_action_date IS NOT NULL AND r.next_action_date != '' AND r.next_action_date < ? AND (r.next_action NOT LIKE '%No further action%' OR r.next_action IS NULL)
    `).get(today)) as { count: number };

    // 6. Stale Relationships (inactive >= 20 days)
    const staleRow = (await db.prepare(`
      SELECT COUNT(*) as count FROM relationships r
      JOIN companies c ON r.company_id = c.id
      WHERE c.is_archived = 0 AND r.days_inactive >= 20
    `).get()) as { count: number };

    // Format pipeline total value using formatINR
    const totalVal = oppsRow ? oppsRow.total_val : 0;
    const pipelineValueFormatted = formatINR(totalVal);

    // 7. Relationship Attention Items (Accounts requiring proactive touchpoints)
    const attentionRels = (await db.prepare(`
      SELECT r.*, c.name as company_name, c.type as company_type
      FROM relationships r
      JOIN companies c ON r.company_id = c.id
      WHERE c.is_archived = 0
      ORDER BY r.days_inactive DESC, r.next_action_date ASC
      LIMIT 4
    `).all()) as any[];

    return NextResponse.json({
      briefing,
      kpis: {
        activePartners: activePartnersCount,
        openOpportunities: oppsRow ? oppsRow.count : 0,
        pipelineValueFormatted,
        followupsDue: dueTodayRow ? dueTodayRow.count : 0,
        overdueFollowups: overdueRow ? overdueRow.count : 0,
        staleRelationships: staleRow ? staleRow.count : 0,
      },
      partnerMomentum: {
        activeCount: activePartnersCount,
        targetCount: 5,
        headline: `${activePartnersCount} / 5 Active Partners`,
        subtext: activePartnersCount === 0
          ? "Build your first five strategic partner relationships."
          : `${Math.max(0, 5 - activePartnersCount)} more to reach your 5 active partner milestone.`,
      },
      priorities,
      upNext,
      attention: attentionRels.map(r => ({
        id: r.id,
        companyId: r.company_id,
        companyName: r.company_name,
        companyType: r.company_type,
        daysInactive: r.days_inactive,
        nextAction: r.next_action || 'No next action set',
        nextActionDate: r.next_action_date,
        temperature: r.temperature,
      })),
    });
  } catch (error: any) {
    console.error('Error loading dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
