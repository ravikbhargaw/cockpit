export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM settings').all() as any[];

    const settingsObj: Record<string, any> = {};
    for (const r of rows) {
      settingsObj[r.key] = JSON.parse(r.value_json);
    }

    return NextResponse.json(settingsObj);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const insertSetting = db.prepare(`
      INSERT INTO settings (key, value_json) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json
    `);

    for (const [k, v] of Object.entries(body)) {
      insertSetting.run(k, JSON.stringify(v));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
