/**
 * Aegis Caregiver - Alerts API
 * Manage alerts and notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/alerts - List alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const urgency = searchParams.get('urgency')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status
    if (urgency) where.urgency = urgency

    const alerts = await db.alert.findMany({
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
      take: limit,
    })

    return NextResponse.json({
      success: true,
      alerts: alerts.map(a => ({
        ...a,
        metadata: a.metadata ? JSON.parse(a.metadata) : {},
      })),
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

// POST /api/alerts - Create new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const alert = await db.alert.create({
      data: {
        patientId: body.patientId,
        type: body.type,
        message: body.message,
        urgency: body.urgency || 'normal',
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        sessionId: body.sessionId || null,
        status: 'pending',
      },
    })

    return NextResponse.json({ success: true, alert })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create alert' },
      { status: 500 }
    )
  }
}

// PUT /api/alerts - Update alert status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, status, acknowledgedBy, resolution } = body

    const updateData: Record<string, unknown> = { status }
    if (status === 'acknowledged') {
      updateData.acknowledgedAt = new Date()
      updateData.acknowledgedBy = acknowledgedBy
    }
    if (resolution) {
      updateData.resolution = resolution
    }

    const alert = await db.alert.update({
      where: { id: alertId },
      data: updateData,
    })

    return NextResponse.json({ success: true, alert })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}
