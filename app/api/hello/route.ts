import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await db.query('SELECT NOW() AS now, DATABASE() AS databaseName');
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    console.error('MySQL query failed:', error);
    return NextResponse.json({ ok: false, error: 'DB query failed' }, { status: 500 });
  }
}
