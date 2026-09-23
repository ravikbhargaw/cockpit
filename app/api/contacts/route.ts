export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DAL } from '@/lib/db/dal';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    let query = `SELECT * FROM contacts WHERE (is_archived IS NULL OR is_archived = 0)`;
    const params: any[] = [];

    if (companyId) {
      query += ` AND company_id = ?`;
      params.push(companyId);
    }

    query += ` ORDER BY is_decision_maker DESC, created_at DESC`;
    const rows = db.prepare(query).all(...params) as any[];

    const contacts = rows.map((c) => ({
      id: c.id,
      companyId: c.company_id,
      name: c.name,
      role: c.role,
      email: c.email,
      phone: c.phone,
      linkedin: c.linkedin || '',
      notes: c.notes || '',
      isDecisionMaker: Boolean(c.is_decision_maker),
    }));

    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.companyId || !body.name) {
      return NextResponse.json({ error: 'Company ID and contact name are required' }, { status: 400 });
    }

    const updatedAccount = DAL.createContact(body);
    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create contact' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const updatedAccount = DAL.updateContact(id, body);
    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const updatedAccount = DAL.archiveContact(id);
    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to archive contact' }, { status: 500 });
  }
}
