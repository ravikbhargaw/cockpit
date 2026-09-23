import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Active Partners Count
    const activePartnersRow = db.prepare(`
      SELECT COUNT(*) as count FROM relationships r
      JOIN companies c ON r.company_id = c.id
      WHERE c.is_archived = 0 AND r.status IN ('Active Partner', 'Repeat Partner', 'Strategic Partner')
    `).get() as { count: number };

    // Open Opportunities & Pipeline Value
    const oppsRow = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(o.estimated_value_amount), 0) as total_val
      FROM opportunities o
      JOIN companies c ON o.company_id = c.id
      WHERE c.is_archived = 0 AND (o.is_archived IS NULL OR o.is_archived = 0) AND o.stage NOT IN ('Closed Won', 'Closed Lost')
    `).get() as { count: number; total_val: number };

    // Follow-ups Due Today
    const dueTodayRow = db.prepare(`
      SELECT COUNT(*) as count FROM relationships r
      JOIN companies c ON r.company_id = c.id
      WHERE c.is_archived = 0 AND r.next_action_date = ? AND (r.next_action NOT LIKE '%No further action%' OR r.next_action IS NULL)
    `).get(today) as { count: number };

    // Overdue Follow-ups
    const overdueRow = db.prepare(`
      SELECT COUNT(*) as count FROM relationships r
      JOIN companies c ON r.company_id = c.id
      WHERE c.is_archived = 0 AND r.next_action_date IS NOT NULL AND r.next_action_date != '' AND r.next_action_date < ? AND (r.next_action NOT LIKE '%No further action%' OR r.next_action IS NULL)
    `).get(today) as { count: number };

    // Stale Relationships (inactive >= 20 days)
    const staleRow = db.prepare(`
      SELECT COUNT(*) as count FROM relationships r
      JOIN companies c ON r.company_id = c.id
      WHERE c.is_archived = 0 AND r.days_inactive >= 20
    `).get() as { count: number };

    // Format pipeline total value using formatINR
    const totalVal = oppsRow.total_val;
    const pipelineValueFormatted = formatINR(totalVal);

    // Today's Priorities (Relationship follow-ups with valid dates)
    const priorityRels = db.prepare(`
      SELECT r.*, c.name as company_name
      FROM relationships r
      JOIN companies c ON r.company_id = c.id
      WHERE c.is_archived = 0
        AND r.next_action_date IS NOT NULL
        AND r.next_action_date != ''
        AND r.next_action_date <= ?
        AND (r.next_action NOT LIKE '%No further action%' OR r.next_action IS NULL)
      ORDER BY r.next_action_date ASC
      LIMIT 5
    `).all(today) as any[];

    const priorities = priorityRels.map((p) => ({
      id: `prio-rel-${p.id}`,
      companyId: p.company_id,
      companyName: p.company_name,
      reason: p.days_inactive >= 20
        ? `${p.days_inactive} days since last interaction. Follow-up required.`
        : `Action scheduled for ${p.next_action_date}`,
      priority: p.next_action_date < today ? 'High' : 'Medium',
      suggestedAction: p.next_action || 'Review Account',
      dueText: p.next_action_date === today ? 'Due Today' : p.next_action_date < today ? 'Overdue' : p.next_action_date,
    }));

    // Add Opportunity Next Actions to Today Priorities
    const oppPriorities = db.prepare(`
      SELECT o.*, c.name as company_name
      FROM opportunities o
      JOIN companies c ON o.company_id = c.id
      WHERE c.is_archived = 0
        AND (o.is_archived IS NULL OR o.is_archived = 0)
        AND o.stage NOT IN ('Closed Won', 'Closed Lost')
        AND o.next_action_date IS NOT NULL
        AND o.next_action_date != ''
        AND o.next_action_date <= ?
      ORDER BY o.next_action_date ASC
      LIMIT 5
    `).all(today) as any[];

    for (const opp of oppPriorities) {
      priorities.push({
        id: `prio-opp-${opp.id}`,
        companyId: opp.company_id,
        companyName: `${opp.company_name} — ${opp.title}`,
        reason: `Opportunity stage: ${opp.stage} (${formatINR(opp.estimated_value_amount || 0)})`,
        priority: opp.next_action_date < today ? 'High' : 'Medium',
        suggestedAction: opp.next_action || 'Progress Opportunity',
        dueText: opp.next_action_date === today ? 'Due Today' : opp.next_action_date < today ? 'Overdue' : opp.next_action_date,
      });
    }

    // Check for Research Candidates READY_FOR_REVIEW
    const readyCandidateRow = db.prepare("SELECT COUNT(*) as count FROM research_candidates WHERE research_status = 'READY_FOR_REVIEW'").get() as { count: number };
    if (readyCandidateRow && readyCandidateRow.count > 0) {
      priorities.unshift({
        id: 'prio-ready-candidates',
        companyId: '',
        companyName: 'Discover Research Workbench',
        reason: `Review ${readyCandidateRow.count} candidate(s) ready for founder qualification & approval`,
        priority: 'High',
        suggestedAction: 'Review Candidates',
        dueText: 'Action Required',
      });
    }

    // Relationship Attention Items
    const attentionRels = db.prepare(`
      SELECT r.*, c.name as company_name, c.type as company_type
      FROM relationships r
      JOIN companies c ON r.company_id = c.id
      WHERE c.is_archived = 0
      ORDER BY r.days_inactive DESC, r.next_action_date ASC
      LIMIT 3
    `).all() as any[];

    return NextResponse.json({
      kpis: {
        activePartners: activePartnersRow.count,
        openOpportunities: oppsRow.count,
        pipelineValueFormatted,
        followupsDue: dueTodayRow.count,
        overdueFollowups: overdueRow.count,
        staleRelationships: staleRow.count,
      },
      partnerMomentum: {
        activeCount: activePartnersRow.count,
        targetCount: 5,
        headline: `${activePartnersRow.count} / 5 Active Partners`,
        subtext: "Build your first five strategic partner relationships.",
      },
      priorities,
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
