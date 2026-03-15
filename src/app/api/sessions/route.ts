/**
 * Aegis Caregiver - Sessions API
 * Manage monitoring sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sessions - List all sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const active = searchParams.get('active')

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (active === 'true') where.status = 'active'

    const sessions = await db.session.findMany({
      where,
      include: {
        patient: {
          select: {
            fullName: true,
            preferredName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// POST /api/sessions - Create new session (record in database)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const session = await db.session.create({
      data: {
        patientId: body.patientId,
        status: 'active',
        startReason: body.startReason || 'manual',
      },
    })

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

// PUT /api/sessions - End session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, endReason } = body

    const session = await db.session.update({
      where: { id: sessionId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        endReason: endReason || 'manual',
      },
    })

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error('Error ending session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to end session' },
      { status: 500 }
    )
  }
}
