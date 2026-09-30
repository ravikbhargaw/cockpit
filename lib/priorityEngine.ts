import { db } from '@/lib/db';
import { formatINR } from '@/lib/utils';

export interface PriorityItem {
  id: string;
  category: 'OVERDUE' | 'TODAY' | 'RESEARCH_REVIEW' | 'OPPORTUNITY' | 'RELATIONSHIP' | 'OUTREACH' | 'FOUNDER180';
  companyId?: string;
  companyName: string;
  title: string;
  reason: string;
  priority: 'High' | 'Medium';
  priorityLevel: number;
  suggestedAction: string;
  dueText: string;
  targetUrl: string;
}

export interface UpcomingItem {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  date: string;
  targetUrl: string;
}

export interface FounderAttentionResult {
  briefing: {
    headline: string;
    subtitle: string;
    totalCount: number;
    overdueCount: number;
    decisionsCount: number;
    todayCount: number;
    isClear: boolean;
  };
  priorities: PriorityItem[];
  upNext: UpcomingItem[];
}

export async function calculateFounderAttention(todayStr?: string): Promise<FounderAttentionResult> {
  const today = todayStr || new Date().toISOString().split('T')[0];
  const priorities: PriorityItem[] = [];

  // 1. OVERDUE & TODAY RELATIONSHIP ACTIONS
  const relRows = (await db.prepare(`
    SELECT r.*, c.name as company_name, c.type as company_type, c.city as company_city
    FROM relationships r
    JOIN companies c ON r.company_id = c.id
    WHERE c.is_archived = 0
      AND r.next_action_date IS NOT NULL
      AND r.next_action_date != ''
      AND r.next_action_date <= ?
      AND (r.next_action NOT LIKE '%No further action%' OR r.next_action IS NULL)
    ORDER BY r.next_action_date ASC
  `).all(today)) as any[];

  for (const r of relRows) {
    const isOverdue = r.next_action_date < today;
    const isOutreach = r.next_action && r.next_action.includes('Initial research approved. Outreach recommended');
    
    const suggestedAction = isOutreach ? 'Start Outreach' : (isOverdue ? 'Follow Up' : 'Execute Action');
    const priority = 'High';
    const priorityLevel = isOverdue ? 1 : 2;
    const dueText = isOverdue ? `Overdue (${r.next_action_date})` : 'Due Today';
    const category = isOutreach ? 'OUTREACH' : (isOverdue ? 'OVERDUE' : 'TODAY');

    priorities.push({
      id: `prio-rel-${r.id}`,
      category,
      companyId: r.company_id,
      companyName: r.company_name,
      title: isOutreach ? `Start Outreach — ${r.company_name}` : `Follow up with ${r.company_name}`,
      reason: isOverdue 
        ? `Overdue next action (${r.next_action_date}): ${r.next_action || 'Follow-up required'}`
        : `Scheduled for today: ${r.next_action || 'Follow-up required'}`,
      priority,
      priorityLevel,
      suggestedAction,
      dueText,
      targetUrl: `/relationships?companyId=${r.company_id}`,
    });
  }

  // 2. OVERDUE & TODAY OPPORTUNITY ACTIONS
  const oppRows = (await db.prepare(`
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
  `).all(today)) as any[];

  for (const o of oppRows) {
    const isOverdue = o.next_action_date < today;
    priorities.push({
      id: `prio-opp-${o.id}`,
      category: isOverdue ? 'OVERDUE' : 'TODAY',
      companyId: o.company_id,
      companyName: `${o.company_name} — ${o.title}`,
      title: `Progress Opportunity — ${o.company_name}`,
      reason: `Commercial deal in ${o.stage} stage (${formatINR(o.estimated_value_amount || 0)}) has an ${isOverdue ? 'overdue' : 'scheduled'} action: ${o.next_action}`,
      priority: 'High',
      priorityLevel: isOverdue ? 1 : 2,
      suggestedAction: 'Progress Deal',
      dueText: isOverdue ? `Overdue (${o.next_action_date})` : 'Due Today',
      targetUrl: `/relationships?companyId=${o.company_id}&tab=opportunities&opportunityId=${o.id}`,
    });
  }

  // 3. RESEARCH CANDIDATES WAITING FOR FOUNDER DECISION
  const readyCandidates = (await db.prepare(`
    SELECT * FROM research_candidates
    WHERE research_status = 'READY_FOR_REVIEW'
    ORDER BY fit_score DESC
    LIMIT 3
  `).all()) as any[];

  for (const cand of readyCandidates) {
    priorities.push({
      id: `prio-cand-${cand.id}`,
      category: 'RESEARCH_REVIEW',
      companyId: '',
      companyName: cand.name,
      title: `Review ${cand.name} (Fit ${cand.fit_score || 80}%)`,
      reason: `AI research candidate ready for founder qualification & approval.`,
      priority: 'High',
      priorityLevel: 3,
      suggestedAction: 'Review Research',
      dueText: 'Founder Review',
      targetUrl: `/discover?candidateId=${cand.id}`,
    });
  }

  // 4. OPPORTUNITIES NEEDING ATTENTION (Active deals without next action or stalled)
  const oppsWithoutNextAction = (await db.prepare(`
    SELECT o.*, c.name as company_name
    FROM opportunities o
    JOIN companies c ON o.company_id = c.id
    WHERE c.is_archived = 0
      AND (o.is_archived IS NULL OR o.is_archived = 0)
      AND o.stage NOT IN ('Closed Won', 'Closed Lost')
      AND (o.next_action_date IS NULL OR o.next_action_date = '')
    ORDER BY o.estimated_value_amount DESC
    LIMIT 2
  `).all()) as any[];

  for (const o of oppsWithoutNextAction) {
    priorities.push({
      id: `prio-opp-noaction-${o.id}`,
      category: 'OPPORTUNITY',
      companyId: o.company_id,
      companyName: `${o.company_name} — ${o.title}`,
      title: `Set Next Step — ${o.company_name}`,
      reason: `Active deal in ${o.stage} stage (${formatINR(o.estimated_value_amount || 0)}) has no next action scheduled.`,
      priority: 'Medium',
      priorityLevel: 4,
      suggestedAction: 'Update Deal',
      dueText: 'Action Missing',
      targetUrl: `/relationships?companyId=${o.company_id}&tab=opportunities&opportunityId=${o.id}`,
    });
  }

  // 5. STALE / HOT RELATIONSHIP ATTENTION
  const staleRels = (await db.prepare(`
    SELECT r.*, c.name as company_name
    FROM relationships r
    JOIN companies c ON r.company_id = c.id
    WHERE c.is_archived = 0
      AND (
        (r.temperature IN ('Hot', 'Warm') AND r.days_inactive >= 14)
        OR (r.status IN ('Active Partner', 'Strategic Partner') AND r.days_inactive >= 20)
      )
      AND (r.next_action_date IS NULL OR r.next_action_date = '' OR r.next_action_date > ?)
    ORDER BY r.days_inactive DESC
    LIMIT 2
  `).all(today)) as any[];

  for (const r of staleRels) {
    priorities.push({
      id: `prio-stale-${r.id}`,
      category: 'RELATIONSHIP',
      companyId: r.company_id,
      companyName: r.company_name,
      title: `Nurture ${r.company_name}`,
      reason: `${r.status} (${r.temperature}) has been inactive for ${r.days_inactive} days without scheduled touchpoint.`,
      priority: 'Medium',
      priorityLevel: 5,
      suggestedAction: 'Open Relationship',
      dueText: `${r.days_inactive}d Inactive`,
      targetUrl: `/relationships?companyId=${r.company_id}`,
    });
  }

  // 6. FOUNDER 180 CHECK-IN DUE
  const checkinRow = (await db.prepare(`SELECT * FROM founder_checkins WHERE date = ?`).get(today)) as any;
  if (!checkinRow) {
    priorities.push({
      id: 'prio-founder180',
      category: 'FOUNDER180',
      companyId: '',
      companyName: 'Founder 180 Consistency',
      title: "Log Today's Founder 180 Check-in",
      reason: "Daily 180-Day consistency check-in for Work, Sales, Body & Sleep is pending for today.",
      priority: 'Medium',
      priorityLevel: 7,
      suggestedAction: 'Log Check-in',
      dueText: 'Due Today',
      targetUrl: '/180-day-founder',
    });
  }

  // Sort by priorityLevel ASC
  priorities.sort((a, b) => a.priorityLevel - b.priorityLevel);

  // 7. UPCOMING ACTIONS (For empty / up-next state)
  const upcomingRows = (await db.prepare(`
    SELECT r.*, c.name as company_name
    FROM relationships r
    JOIN companies c ON r.company_id = c.id
    WHERE c.is_archived = 0
      AND r.next_action_date IS NOT NULL
      AND r.next_action_date > ?
    ORDER BY r.next_action_date ASC
    LIMIT 3
  `).all(today)) as any[];

  const upNext: UpcomingItem[] = upcomingRows.map((u) => ({
    id: `upnext-${u.id}`,
    companyId: u.company_id,
    companyName: u.company_name,
    title: u.next_action || `Scheduled action with ${u.company_name}`,
    date: u.next_action_date,
    targetUrl: `/relationships?companyId=${u.company_id}`,
  }));

  // Build Briefing Summary Text strictly derived from the generated priorities array
  const overdueCount = priorities.filter((p) => p.dueText.startsWith('Overdue') || p.category === 'OVERDUE').length;
  const decisionsCount = priorities.filter((p) => p.category === 'RESEARCH_REVIEW').length;
  const todayCount = priorities.filter((p) => (p.dueText === 'Due Today' || p.category === 'TODAY') && p.category !== 'FOUNDER180').length;
  const totalCount = priorities.length;
  const isClear = totalCount === 0;

  let subtitle = "You're clear for today. Everything is up to date.";
  if (totalCount > 0) {
    const parts: string[] = [];
    if (overdueCount > 0) parts.push(`${overdueCount} overdue action${overdueCount > 1 ? 's' : ''}`);
    if (decisionsCount > 0) parts.push(`${decisionsCount} founder decision${decisionsCount > 1 ? 's' : ''} waiting`);
    if (todayCount > 0) parts.push(`${todayCount} action${todayCount > 1 ? 's' : ''} due today`);
    
    if (parts.length > 0) {
      subtitle = `${totalCount} item${totalCount > 1 ? 's' : ''} deserve your attention today (${parts.join(', ')}).`;
    } else {
      subtitle = `${totalCount} item${totalCount > 1 ? 's' : ''} deserve your attention today.`;
    }
  }

  return {
    briefing: {
      headline: 'Good morning, Ravi.',
      subtitle,
      totalCount,
      overdueCount,
      decisionsCount,
      todayCount,
      isClear,
    },
    priorities,
    upNext,
  };
}
