import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function verifySession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await verifySession();
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { user };
}

export async function requirePatientAccess(patientId: string) {
  const auth = await requireAuth();
  if ('error' in auth && auth.error) return auth;

  // Check caregiver-patient assignment
  const { adminDb } = await import('@/lib/firebase/admin');
  const assignment = await adminDb
    .collection('caregiver_patients')
    .where('caregiverId', '==', auth.user!.uid)
    .where('patientId', '==', patientId)
    .limit(1)
    .get();

  if (assignment.empty) {
    return {
      error: NextResponse.json(
        { error: 'No access to this patient' },
        { status: 403 }
      ),
    };
  }

  return { user: auth.user };
}
