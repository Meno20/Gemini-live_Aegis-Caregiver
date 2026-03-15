import { NextRequest, NextResponse } from 'next/server';
import { getActiveAlerts, createAlert, acknowledgeAlert } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status') || 'active';

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      );
    }

    if (status === 'active') {
      const alerts = await getActiveAlerts(patientId);
      return NextResponse.json({ success: true, alerts });
    }

    // All statuses
    const snapshot = await adminDb
      .collection('alerts')
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const alerts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, alerts });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const { alertId, action } = body;

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'Alert ID and action are required' },
        { status: 400 }
      );
    }

    if (action === 'acknowledge') {
      await acknowledgeAlert(alertId, auth.user!.uid);
    } else if (action === 'resolve') {
      await adminDb.collection('alerts').doc(alertId).update({
        status: 'RESOLVED',
        resolvedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const { patientId, category, severity, title, message } = body;

    if (!patientId || !severity || !title || !message) {
      return NextResponse.json(
        { error: 'patientId, severity, title, and message are required' },
        { status: 400 }
      );
    }

    const alertId = await createAlert(patientId, {
      category: category || 'GENERAL',
      severity,
      title,
      message,
      patientId,
    });

    return NextResponse.json({ success: true, alertId });

  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}
