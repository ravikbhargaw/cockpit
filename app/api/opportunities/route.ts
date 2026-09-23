export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DAL } from '@/lib/db/dal';
import { formatINR } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    let query = `
      SELECT o.*, c.name as company_name
      FROM opportunities o
      JOIN companies c ON o.company_id = c.id
      WHERE c.is_archived = 0 AND (o.is_archived IS NULL OR o.is_archived = 0)
    `;
    const params: any[] = [];

    if (companyId) {
      query += ` AND o.company_id = ?`;
      params.push(companyId);
    }

    query += ` ORDER BY o.created_at DESC`;
    const rows = db.prepare(query).all(...params) as any[];

    const opportunities = rows.map((o) => {
      const numericAmount = o.estimated_value_amount || 0;
      return {
        id: o.id,
        companyId: o.company_id,
        companyName: o.company_name,
        title: o.title,
        stage: o.stage,
        estimatedValueFormatted: formatINR(numericAmount),
        estimatedValueAmount: numericAmount,
        nextAction: o.next_action,
        nextActionDate: o.next_action_date,
        createdDate: o.created_at.split('T')[0],
      };
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.companyId || !body.title) {
      return NextResponse.json({ error: 'Company ID and opportunity title are required' }, { status: 400 });
    }

    const result = DAL.createOpportunity(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create opportunity' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    const result = DAL.updateOpportunity(id, body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update opportunity' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    const result = DAL.archiveOpportunity(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to archive opportunity' }, { status: 500 });
  }
}
