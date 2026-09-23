import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    let query = `
      SELECT i.*, c.name as company_name
      FROM interactions i
      JOIN companies c ON i.company_id = c.id
      WHERE c.is_archived = 0
    `;
    const params: any[] = [];

    if (companyId) {
      query += ` AND i.company_id = ?`;
      params.push(companyId);
    }

    query += ` ORDER BY i.date DESC, i.created_at DESC`;
    const rows = db.prepare(query).all(...params) as any[];

    const interactions = rows.map((i) => ({
      id: i.id,
      companyId: i.company_id,
      companyName: i.company_name,
      contactId: i.contact_id,
      contactName: i.contact_name,
      date: i.date,
      channel: i.channel,
      summary: i.summary,
      whatTheyNeeded: i.what_they_needed,
      whatWeLearned: i.what_we_learned,
      opportunityId: i.opportunity_id,
      estimatedValue: i.estimated_value,
      servicesDiscussed: i.services_discussed ? JSON.parse(i.services_discussed) : [],
      isDecisionMakerInvolved: Boolean(i.is_decision_maker_involved),
      nextAction: i.next_action,
      nextActionDate: i.next_action_date,
      noFurtherActionRequired: Boolean(i.no_further_action_required),
    }));

    return NextResponse.json(interactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyId,
      contactId,
      contactName,
      date,
      channel,
      summary,
      whatTheyNeeded,
      whatWeLearned,
      opportunityId,
      estimatedValue,
      servicesDiscussed,
      isDecisionMakerInvolved,
      nextAction,
      nextActionDate,
      noFurtherActionRequired,
    } = body;

    // Strict Enforcement Rule Validation
    const isNoFurtherAction = Boolean(noFurtherActionRequired);
    const hasNextAction = Boolean(nextAction && nextAction.trim() !== '') && Boolean(nextActionDate && nextActionDate.trim() !== '');

    if (!companyId || !summary || !channel) {
      return NextResponse.json(
        { error: 'Company, interaction channel, and summary are required' },
        { status: 400 }
      );
    }

    if (!isNoFurtherAction && !hasNextAction) {
      return NextResponse.json(
        {
          error:
            "Enforcement Rule Violated: Every meaningful interaction requires either 'Next Action + Next Action Date' OR 'No Further Action Required'.",
        },
        { status: 400 }
      );
    }

    const intId = `int-${Date.now()}`;
    const now = new Date().toISOString();
    const intDate = date || now.split('T')[0];

    db.prepare(`
      INSERT INTO interactions (
        id, company_id, contact_id, contact_name, date, channel, summary,
        what_they_needed, what_we_learned, opportunity_id, estimated_value,
        services_discussed, is_decision_maker_involved, next_action, next_action_date,
        no_further_action_required, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      intId,
      companyId,
      contactId || null,
      contactName || 'Principal Contact',
      intDate,
      channel,
      summary,
      whatTheyNeeded || '',
      whatWeLearned || '',
      opportunityId || null,
      estimatedValue || null,
      JSON.stringify(servicesDiscussed || []),
      isDecisionMakerInvolved ? 1 : 0,
      isNoFurtherAction ? '' : nextAction,
      isNoFurtherAction ? '' : nextActionDate,
      isNoFurtherAction ? 1 : 0,
      now
    );

    // Update Relationship state on Company
    db.prepare(`
      UPDATE relationships
      SET last_meaningful_interaction_date = ?,
          next_action = ?,
          next_action_date = ?,
          days_inactive = 0,
          updated_at = ?
      WHERE company_id = ?
    `).run(
      intDate,
      isNoFurtherAction ? 'No further action required' : nextAction,
      isNoFurtherAction ? '' : nextActionDate,
      now,
      companyId
    );

    return NextResponse.json({ success: true, interactionId: intId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
  }
}
