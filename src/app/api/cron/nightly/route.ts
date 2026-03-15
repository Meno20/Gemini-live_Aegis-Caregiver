import { NextRequest, NextResponse } from 'next/server';
import { nightlyAnalysis } from '@/lib/background-jobs';

export async function POST(req: NextRequest) {
  // Verify cron secret (prevent unauthorized triggers)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const patients = ['maggie', 'bill']; // In production, fetch from DB

  const results = await Promise.allSettled(
    patients.map((id) => nightlyAnalysis(id))
  );

  return NextResponse.json({
    success: true,
    completed: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
    results: results.map((r, i) => ({
      patient: patients[i],
      status: r.status,
      ...(r.status === 'fulfilled'
        ? { data: r.value }
        : { error: String((r as PromiseRejectedResult).reason) }),
    })),
  });
}
