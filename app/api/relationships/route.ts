
function parseJsonField(val: any): any {
  if (val === null || val === undefined) return [];
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    let query = `SELECT r.*, c.name as company_name FROM relationships r JOIN companies c ON r.company_id = c.id WHERE c.is_archived = 0`;
    const params: any[] = [];

    if (companyId) {
      query += ` AND r.company_id = ?`;
      params.push(companyId);
    }

    const rows = await db.prepare(query).all(...params) as any[];

    const relationships = rows.map((r) => ({
      id: r.id,
      companyId: r.company_id,
      companyName: r.company_name,
      status: r.status,
      temperature: r.temperature,
      owner: r.owner,
      firstContactDate: r.first_contact_date,
      lastMeaningfulInteractionDate: r.last_meaningful_interaction_date,
      daysInactive: r.days_inactive,
      nextAction: r.next_action,
      nextActionDate: r.next_action_date,
      partnerSince: r.partner_since || undefined,
      relationshipNotes: r.relationship_notes,
      servicesDiscussed: r.services_discussed ? parseJsonField(r.services_discussed) : [],
    }));

    return NextResponse.json(relationships);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { companyId, owner } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    if (owner !== undefined) {
      const { getCurrentUserFromRequest } = require('@/lib/auth');
      const currentUser = await getCurrentUserFromRequest(request);
      const existing = await db.prepare('SELECT owner FROM relationships WHERE company_id = ?').get(companyId) as any;
      if (existing && existing.owner !== owner) {
        if (!currentUser || currentUser.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden: Only administrators can reassign company owner' }, { status: 403 });
        }
      }
    }

    const { DAL } = require('@/lib/db/dal');
    const updated = await DAL.updateRelationship(companyId, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update relationship' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { companyId, owner } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    if (owner !== undefined) {
      const { getCurrentUserFromRequest } = require('@/lib/auth');
      const currentUser = await getCurrentUserFromRequest(request);
      const existing = await db.prepare('SELECT owner FROM relationships WHERE company_id = ?').get(companyId) as any;
      if (existing && existing.owner !== owner) {
        if (!currentUser || currentUser.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden: Only administrators can reassign company owner' }, { status: 403 });
        }
      }
    }

    const { DAL } = require('@/lib/db/dal');
    const updated = await DAL.updateRelationship(companyId, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update relationship' }, { status: 500 });
  }
}
