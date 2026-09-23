export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const status = searchParams.get('status');

    let query = `
      SELECT c.*, r.status as rel_status, r.temperature as rel_temperature,
             r.owner as rel_owner, r.first_contact_date, r.last_meaningful_interaction_date,
             r.days_inactive, r.next_action, r.next_action_date, r.partner_since, r.relationship_notes, r.services_discussed
      FROM companies c
      LEFT JOIN relationships r ON c.id = r.company_id
      WHERE c.is_archived = 0
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (LOWER(c.name) LIKE ? OR LOWER(c.city) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status && status !== 'All') {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY c.created_at DESC`;

    const rows = await db.prepare(query).all(...params) as any[];

    const companies = rows.map((r) => ({
      id: r.id,
      name: r.name,
      domain: r.domain,
      type: r.type,
      city: r.city,
      employeeCount: r.employee_count,
      website: r.website,
      logoInitials: r.logo_initials,
      yearEstablished: r.year_established,
      relationship: {
        id: r.id ? `rel-${r.id}` : '',
        companyId: r.id,
        status: r.rel_status || 'Prospect',
        temperature: r.rel_temperature || 'Warm',
        owner: r.rel_owner || 'Ravi',
        firstContactDate: r.first_contact_date || new Date().toISOString().split('T')[0],
        lastMeaningfulInteractionDate: r.last_meaningful_interaction_date || new Date().toISOString().split('T')[0],
        daysInactive: r.days_inactive || 0,
        nextAction: r.next_action || '',
        nextActionDate: r.next_action_date || '',
        partnerSince: r.partner_since || undefined,
        relationshipNotes: r.relationship_notes || '',
        servicesDiscussed: r.services_discussed ? JSON.parse(r.services_discussed) : [],
      },
    }));

    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { getCurrentUserFromRequest } = require('@/lib/auth');
    const currentUser = await getCurrentUserFromRequest(request);

    const body = await request.json();
    if (!body.name && !body.companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const { DAL } = require('@/lib/db/dal');
    const result = await DAL.createCompany(body, currentUser);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create company' }, { status: 500 });
  }
}
