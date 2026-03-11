/**
 * Aegis Caregiver - Patients API
 * Manage patient profiles
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/patients - List all patients
export async function GET() {
  try {
    const patients = await db.patient.findMany({
      include: {
        lifeStories: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      patients: patients.map(p => ({
        ...p,
        childrenNames: p.childrenNames ? JSON.parse(p.childrenNames) : [],
        grandchildrenNames: p.grandchildrenNames ? JSON.parse(p.grandchildrenNames) : [],
        hobbies: p.hobbies ? JSON.parse(p.hobbies) : [],
        calmingActivities: p.calmingActivities ? JSON.parse(p.calmingActivities) : [],
        topicsThatEngage: p.topicsThatEngage ? JSON.parse(p.topicsThatEngage) : [],
        topicsToAvoid: p.topicsToAvoid ? JSON.parse(p.topicsToAvoid) : [],
        triggersToAvoid: p.triggersToAvoid ? JSON.parse(p.triggersToAvoid) : [],
        medications: p.medications ? JSON.parse(p.medications) : [],
        medicalConditions: p.medicalConditions ? JSON.parse(p.medicalConditions) : [],
        allergies: p.allergies ? JSON.parse(p.allergies) : [],
        emergencyContacts: p.emergencyContacts ? JSON.parse(p.emergencyContacts) : [],
      })),
    })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

// POST /api/patients - Create new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const patient = await db.patient.create({
      data: {
        fullName: body.fullName,
        preferredName: body.preferredName,
        dateOfBirth: new Date(body.dateOfBirth),
        pronouns: body.pronouns || 'they/them',
        diagnosisStage: body.diagnosisStage || 'mild',
        diagnosisType: body.diagnosisType || "Alzheimer's",
        diagnosisDate: body.diagnosisDate ? new Date(body.diagnosisDate) : null,
        
        spouseName: body.spouseName || null,
        spouseStatus: body.spouseStatus || null,
        childrenNames: body.childrenNames ? JSON.stringify(body.childrenNames) : null,
        grandchildrenNames: body.grandchildrenNames ? JSON.stringify(body.grandchildrenNames) : null,
        
        occupation: body.occupation || null,
        careerHighlights: body.careerHighlights || null,
        hometown: body.hometown || null,
        
        favoriteMusic: body.favoriteMusic || null,
        favoriteMusicEra: body.favoriteMusicEra || null,
        favoriteFoods: body.favoriteFoods || null,
        hobbies: body.hobbies ? JSON.stringify(body.hobbies) : null,
        calmingActivities: body.calmingActivities ? JSON.stringify(body.calmingActivities) : null,
        
        communicationTips: body.communicationTips || null,
        topicsThatEngage: body.topicsThatEngage ? JSON.stringify(body.topicsThatEngage) : null,
        topicsToAvoid: body.topicsToAvoid ? JSON.stringify(body.topicsToAvoid) : null,
        triggersToAvoid: body.triggersToAvoid ? JSON.stringify(body.triggersToAvoid) : null,
        
        medications: body.medications ? JSON.stringify(body.medications) : null,
        medicalConditions: body.medicalConditions ? JSON.stringify(body.medicalConditions) : null,
        allergies: body.allergies ? JSON.stringify(body.allergies) : null,
        mobilityLevel: body.mobilityLevel || 'ambulatory',
        fallRisk: body.fallRisk || 'low',
        
        primaryCaregiverName: body.primaryCaregiverName,
        primaryCaregiverRelationship: body.primaryCaregiverRelationship || 'family',
        emergencyContacts: body.emergencyContacts ? JSON.stringify(body.emergencyContacts) : null,
        
        typicalWakeTime: body.typicalWakeTime || null,
        typicalSleepTime: body.typicalSleepTime || null,
        sundowningRisk: body.sundowningRisk || 'unknown',
        wanderingHistory: body.wanderingHistory || false,
        aggressionHistory: body.aggressionHistory || false,
        
        voicePreference: body.voicePreference || 'warm_female',
        volumePreference: body.volumePreference || 'normal',
      },
    })

    return NextResponse.json({ success: true, patient })
  } catch (error) {
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create patient' },
      { status: 500 }
    )
  }
}
