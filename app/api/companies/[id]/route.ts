import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const accountData = DAL.getCompanyById(id);

    if (!accountData) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(accountData);
  } catch (error: any) {
    console.error('Error in GET /api/companies/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch company details', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    if (body.owner !== undefined) {
      const { getCurrentUserFromRequest } = require('@/lib/auth');
      const currentUser = await getCurrentUserFromRequest(request);
      const existing = db.prepare('SELECT owner FROM relationships WHERE company_id = ?').get(id) as any;
      if (existing && existing.owner !== body.owner) {
        if (!currentUser || currentUser.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden: Only administrators can reassign company owner' }, { status: 403 });
        }
      }
    }
    const updated = DAL.updateCompany(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update company' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    if (body.owner !== undefined) {
      const { getCurrentUserFromRequest } = require('@/lib/auth');
      const currentUser = await getCurrentUserFromRequest(request);
      const existing = db.prepare('SELECT owner FROM relationships WHERE company_id = ?').get(id) as any;
      if (existing && existing.owner !== body.owner) {
        if (!currentUser || currentUser.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden: Only administrators can reassign company owner' }, { status: 403 });
        }
      }
    }
    const updated = DAL.updateCompany(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update company' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE companies SET is_archived = 1, updated_at = ? WHERE id = ?
    `).run(now, id);

    return NextResponse.json({ success: true, archivedId: id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to archive company' }, { status: 500 });
  }
}
