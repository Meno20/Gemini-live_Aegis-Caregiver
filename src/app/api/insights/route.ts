/**
 * Aegis Caregiver - Insights API
 * Behavioral patterns and analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/insights - Get insights for a patient
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'patientId is required' },
        { status: 400 }
      )
    }

    // Get patterns
    const patterns = await db.pattern.findMany({
      where: { patientId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    // Get recent sessions stats
    const recentSessions = await db.session.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 7, // Last 7 sessions
    })

    // Get alert stats
    const alerts = await db.alert.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Calculate statistics
    const alertStats = {
      total: alerts.length,
      pending: alerts.filter(a => a.status === 'pending').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      byType: {
        wandering: alerts.filter(a => a.type === 'wandering').length,
        agitation: alerts.filter(a => a.type === 'agitation').length,
        health: alerts.filter(a => a.type === 'health').length,
        safety: alerts.filter(a => a.type === 'safety').length,
        medication: alerts.filter(a => a.type === 'medication').length,
        meal: alerts.filter(a => a.type === 'meal').length,
      },
      byUrgency: {
        emergency: alerts.filter(a => a.urgency === 'emergency').length,
        high: alerts.filter(a => a.urgency === 'high').length,
        normal: alerts.filter(a => a.urgency === 'normal').length,
        low: alerts.filter(a => a.urgency === 'low').length,
      },
    }

    // Session stats
    const sessionStats = {
      total: recentSessions.length,
      totalAlerts: recentSessions.reduce((sum, s) => sum + s.totalAlerts, 0),
      avgAgitation: recentSessions.reduce((sum, s) => sum + (s.avgAgitation || 0), 0) / Math.max(recentSessions.length, 1),
      wanderingEvents: recentSessions.reduce((sum, s) => sum + s.wanderingEvents, 0),
    }

    // Time-based patterns (hourly distribution)
    const hourlyAlerts = Array(24).fill(0)
    alerts.forEach(alert => {
      const hour = new Date(alert.createdAt).getHours()
      hourlyAlerts[hour]++
    })

    // Day of week patterns
    const dailyAlerts = Array(7).fill(0)
    alerts.forEach(alert => {
      const day = new Date(alert.createdAt).getDay()
      dailyAlerts[day]++
    })

    return NextResponse.json({
      success: true,
      insights: {
        patterns: patterns.map(p => ({
          ...p,
          triggerConditions: p.triggerConditions ? JSON.parse(p.triggerConditions) : null,
          occurrenceData: p.occurrenceData ? JSON.parse(p.occurrenceData) : null,
        })),
        alertStats,
        sessionStats,
        timePatterns: {
          hourly: hourlyAlerts,
          daily: dailyAlerts,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}

// POST /api/insights - Create new pattern
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const pattern = await db.pattern.create({
      data: {
        patientId: body.patientId,
        patternType: body.patternType,
        confidence: body.confidence || 0.5,
        description: body.description,
        recommendation: body.recommendation,
        triggerConditions: body.triggerConditions ? JSON.stringify(body.triggerConditions) : null,
        occurrenceData: body.occurrenceData ? JSON.stringify(body.occurrenceData) : null,
      },
    })

    return NextResponse.json({ success: true, pattern })
  } catch (error) {
    console.error('Error creating pattern:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create pattern' },
      { status: 500 }
    )
  }
}
