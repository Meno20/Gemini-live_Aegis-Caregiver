import { NextRequest, NextResponse } from 'next/server';
import { getPatient, getPatientsByCaregiver } from '@/lib/db';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('id');

    if (patientId) {
      const patient = await getPatient(patientId);

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, patient });
    }

    // Get all patients for this caregiver
    const patients = await getPatientsByCaregiver(auth.user!.uid);
    return NextResponse.json({ success: true, patients });

  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const {
      firstName, lastName, dateOfBirth, dementiaStage,
      gender, address, emergencyPhone,
    } = body;

    const ref = await adminDb.collection('patients').add({
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      dementiaStage,
      gender,
      address,
      emergencyPhone,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create caregiver-patient assignment
    await adminDb
      .collection('caregiver_patients')
      .doc(`${auth.user!.uid}_${ref.id}`)
      .set({
        caregiverId: auth.user!.uid,
        patientId: ref.id,
        role: 'PRIMARY_CAREGIVER',
        isPrimary: true,
        assignedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ success: true, patientId: ref.id });

  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
