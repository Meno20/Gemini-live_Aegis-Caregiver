import { adminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp, DocumentSnapshot } from 'firebase-admin/firestore';
import type {
  Patient, LifeStory, PatientPreferences, Medication,
  CareTeamMember, HealthRecord, BehavioralLog, MealLog,
  MedicationLog, Alert, DailySummary, Caregiver,
} from './types';

// ============================================
// HELPERS
// ============================================

function toDate(ts: any): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string') return new Date(ts);
  return new Date();
}

function docToData<T>(doc: DocumentSnapshot): T | null {
  if (!doc.exists) return null;
  const data = doc.data()!;
  return { id: doc.id, ...data } as T;
}

// ============================================
// PATIENTS — READ
// ============================================

export async function getPatient(patientId: string): Promise<Patient | null> {
  const doc = await adminDb.collection('patients').doc(patientId).get();
  return docToData<Patient>(doc);
}

export async function getPatientsByCaregiver(caregiverId: string): Promise<Patient[]> {
  const assignments = await adminDb
    .collection('caregiver_patients')
    .where('caregiverId', '==', caregiverId)
    .get();

  const patientIds = assignments.docs.map((d) => d.data().patientId);
  if (patientIds.length === 0) return [];

  const patients = await Promise.all(
    patientIds.map((id) => getPatient(id))
  );
  return patients.filter(Boolean) as Patient[];
}

// ============================================
// LIFE STORY — READ & WRITE
// ============================================

export async function getLifeStory(patientId: string): Promise<LifeStory | null> {
  const doc = await adminDb
    .collection('patients').doc(patientId)
    .collection('details').doc('life_story')
    .get();
  return docToData<LifeStory>(doc);
}

export async function updateLifeStory(
  patientId: string,
  data: Partial<LifeStory>
): Promise<void> {
  await adminDb
    .collection('patients').doc(patientId)
    .collection('details').doc('life_story')
    .set({ ...data, patientId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

// ============================================
// PREFERENCES — READ & WRITE
// ============================================

export async function getPreferences(patientId: string): Promise<PatientPreferences | null> {
  const doc = await adminDb
    .collection('patients').doc(patientId)
    .collection('details').doc('preferences')
    .get();
  return docToData<PatientPreferences>(doc);
}

export async function updatePreferences(
  patientId: string,
  data: Partial<PatientPreferences>
): Promise<void> {
  await adminDb
    .collection('patients').doc(patientId)
    .collection('details').doc('preferences')
    .set({ ...data, patientId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

// ============================================
// MEDICATIONS — READ & WRITE
// ============================================

export async function getMedications(patientId: string, activeOnly = true): Promise<Medication[]> {
  let query = adminDb
    .collection('patients').doc(patientId)
    .collection('medications')
    .orderBy('name');

  if (activeOnly) {
    query = query.where('isActive', '==', true) as any;
  }

  const snapshot = await query.get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Medication);
}

export async function addMedication(patientId: string, data: Omit<Medication, 'id'>): Promise<string> {
  const ref = await adminDb
    .collection('patients').doc(patientId)
    .collection('medications')
    .add({ ...data, patientId, createdAt: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function updateMedication(
  patientId: string,
  medicationId: string,
  data: Partial<Medication>
): Promise<void> {
  await adminDb
    .collection('patients').doc(patientId)
    .collection('medications').doc(medicationId)
    .update({ ...data, updatedAt: FieldValue.serverTimestamp() });
}

// ============================================
// CARE TEAM — READ & WRITE
// ============================================

export async function getCareTeam(patientId: string): Promise<CareTeamMember[]> {
  const snapshot = await adminDb
    .collection('patients').doc(patientId)
    .collection('care_team')
    .where('isActive', '==', true)
    .get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CareTeamMember);
}

export async function addCareTeamMember(
  patientId: string,
  data: Omit<CareTeamMember, 'id'>
): Promise<string> {
  const ref = await adminDb
    .collection('patients').doc(patientId)
    .collection('care_team')
    .add({ ...data, patientId, isActive: true });
  return ref.id;
}

// ============================================
// HEALTH RECORDS — READ & WRITE
// ============================================

export async function getLatestHealthRecord(patientId: string): Promise<HealthRecord | null> {
  const snapshot = await adminDb
    .collection('patients').doc(patientId)
    .collection('health_records')
    .orderBy('recordDate', 'desc')
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as HealthRecord;
}

export async function addHealthRecord(
  patientId: string,
  data: Omit<HealthRecord, 'id'>
): Promise<string> {
  const ref = await adminDb
    .collection('patients').doc(patientId)
    .collection('health_records')
    .add({ ...data, patientId, recordDate: FieldValue.serverTimestamp() });
  return ref.id;
}

// ============================================
// BEHAVIORAL LOGS — WRITE (AI) + READ
// ============================================

export async function addBehavioralLog(
  patientId: string,
  data: Omit<BehavioralLog, 'id'>
): Promise<string> {
  const ref = await adminDb
    .collection('patients').doc(patientId)
    .collection('behavioral_logs')
    .add({ ...data, patientId, timestamp: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function getRecentBehavioralLogs(
  patientId: string,
  days: number = 14,
  limit: number = 200
): Promise<BehavioralLog[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshot = await adminDb
    .collection('patients').doc(patientId)
    .collection('behavioral_logs')
    .where('timestamp', '>=', Timestamp.fromDate(since))
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    timestamp: toDate(d.data().timestamp),
  }) as BehavioralLog);
}

// ============================================
// MEAL LOGS — WRITE (AI) + READ
// ============================================

export async function addMealLog(
  patientId: string,
  data: Omit<MealLog, 'id'>
): Promise<string> {
  const ref = await adminDb
    .collection('patients').doc(patientId)
    .collection('meal_logs')
    .add({ ...data, patientId, timestamp: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function getRecentMealLogs(
  patientId: string,
  days: number = 7
): Promise<MealLog[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshot = await adminDb
    .collection('patients').doc(patientId)
    .collection('meal_logs')
    .where('timestamp', '>=', Timestamp.fromDate(since))
    .orderBy('timestamp', 'desc')
    .get();

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    timestamp: toDate(d.data().timestamp),
  }) as MealLog);
}

// ============================================
// MEDICATION LOGS — WRITE (AI) + READ
// ============================================

export async function addMedicationLog(
  patientId: string,
  data: Omit<MedicationLog, 'id'>
): Promise<string> {
  const ref = await adminDb
    .collection('patients').doc(patientId)
    .collection('medication_logs')
    .add({ ...data, patientId, createdAt: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function getMedicationAdherence(
  patientId: string,
  days: number = 7
): Promise<{ total: number; taken: number; percentage: number }> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshot = await adminDb
    .collection('patients').doc(patientId)
    .collection('medication_logs')
    .where('scheduledTime', '>=', Timestamp.fromDate(since))
    .get();

  const total = snapshot.size;
  const taken = snapshot.docs.filter((d) => d.data().status === 'taken').length;

  return {
    total,
    taken,
    percentage: total > 0 ? Math.round((taken / total) * 100) : 0,
  };
}

// ============================================
// ALERTS — WRITE (AI) + READ/UPDATE (Caregiver)
// ============================================

export async function createAlert(
  patientId: string,
  data: Omit<Alert, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const ref = await adminDb.collection('alerts').add({
    ...data,
    patientId,
    status: 'ACTIVE',
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getActiveAlerts(patientId: string): Promise<Alert[]> {
  const snapshot = await adminDb
    .collection('alerts')
    .where('patientId', '==', patientId)
    .where('status', 'in', ['ACTIVE', 'ACKNOWLEDGED'])
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: toDate(d.data().createdAt),
  }) as Alert);
}

export async function acknowledgeAlert(
  alertId: string,
  caregiverId: string
): Promise<void> {
  await adminDb.collection('alerts').doc(alertId).update({
    status: 'ACKNOWLEDGED',
    acknowledgedBy: caregiverId,
    acknowledgedAt: FieldValue.serverTimestamp(),
  });
}

// ============================================
// DAILY SUMMARIES — WRITE (AI nightly) + READ
// ============================================

export async function saveDailySummary(
  patientId: string,
  data: Omit<DailySummary, 'id'>
): Promise<string> {
  const dateKey = data.date.toISOString().split('T')[0]; // "2024-03-15"
  await adminDb
    .collection('patients').doc(patientId)
    .collection('daily_summaries').doc(dateKey)
    .set({ ...data, patientId, generatedAt: FieldValue.serverTimestamp() });
  return dateKey;
}

export async function getDailySummaries(
  patientId: string,
  days: number = 7
): Promise<DailySummary[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshot = await adminDb
    .collection('patients').doc(patientId)
    .collection('daily_summaries')
    .where('date', '>=', Timestamp.fromDate(since))
    .orderBy('date', 'desc')
    .get();

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    date: toDate(d.data().date),
  }) as DailySummary);
}
