'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertTriangle,
  Moon,
  Sun,
  Brain,
  Zap
} from 'lucide-react'

interface PatternChartsProps {
  hourlyData: Array<{ hour: number; alertCount: number; avgAgitation: number; wanderingEvents: number }>
  dailyData: Array<{ day: string; totalAlerts: number; avgAgitation: number }>
  healthTrend: Array<{ date: string; agitationAvg: number; sleepHours: number }>
}

export function PatternCharts({ hourlyData, dailyData, healthTrend }: PatternChartsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Simple canvas-based chart rendering
  useEffect(() => {
    if (!canvasRef.current || hourlyData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const width = canvas.width
    const height = canvas.height
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Find max values
    const maxAlerts = Math.max(...hourlyData.map(d => d.alertCount), 1)
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Draw bars
    const barWidth = chartWidth / hourlyData.length - 2
    
    hourlyData.forEach((data, i) => {
      const barHeight = (data.alertCount / maxAlerts) * chartHeight
      const x = padding + i * (chartWidth / hourlyData.length) + 1
      const y = height - padding - barHeight

      // Color based on agitation
      const hue = 220 - (data.avgAgitation * 60)
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`
      
      ctx.fillRect(x, y, barWidth, barHeight)

      // Hour labels (every 3 hours)
      if (data.hour % 3 === 0) {
        ctx.fillStyle = '#6b7280'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${data.hour}:00`, x + barWidth / 2, height - padding + 15)
      }
    })

    // Y-axis label
    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Alerts', 0, 0)
    ctx.restore()

  }, [hourlyData])

  return (
    <div className="space-y-4">
      {/* Hourly Alert Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Hourly Alert Distribution
            </CardTitle>
            <Badge variant="outline">24h</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <canvas 
            ref={canvasRef} 
            width={500} 
            height={200}
            className="w-full h-auto"
          />
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Low agitation</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>High agitation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Weekly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dailyData.map((day, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-12 text-xs text-muted-foreground">{day.day.slice(0, 3)}</span>
                <div className="flex-1">
                  <Progress 
                    value={day.totalAlerts * 10} 
                    className="h-2"
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">
                  {day.totalAlerts}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            7-Day Agitation Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-20">
            {healthTrend.map((day, i) => {
              const height = day.agitationAvg * 100
              const isHigh = day.agitationAvg > 0.5
              return (
                <div 
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div 
                    className={`w-full rounded-t transition-all ${
                      isHigh ? 'bg-red-400' : 'bg-green-400'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).charAt(0)}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function BehavioralInsights({ insights }: { insights: Array<{ type: string; confidence: number; description: string; recommendation: string }> }) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'sundowning':
        return <Sun className="h-4 w-4 text-orange-500" />
      case 'wandering_risk':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'sleep_pattern':
        return <Moon className="h-4 w-4 text-indigo-500" />
      default:
        return <Brain className="h-4 w-4 text-blue-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No patterns detected yet</p>
          <p className="text-xs">Continue monitoring to discover insights</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="flex items-start gap-3 p-4">
            <div className="mt-0.5">
              {getInsightIcon(insight.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium capitalize">
                  {insight.type.replace('_', ' ')}
                </span>
                <Badge className={getConfidenceColor(insight.confidence)}>
                  {Math.round(insight.confidence * 100)}% confidence
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {insight.description}
              </p>
              <div className="flex items-start gap-1 text-xs bg-muted/50 rounded p-2">
                <Zap className="h-3 w-3 mt-0.5 text-yellow-500" />
                <span className="text-muted-foreground">{insight.recommendation}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function RiskAssessment({ score, level, factors }: { 
  score: number
  level: 'low' | 'medium' | 'high' | 'critical'
  factors: string[]
}) {
  const levelColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500'
  }

  const levelLabels = {
    low: 'Low Risk',
    medium: 'Moderate Risk',
    high: 'High Risk',
    critical: 'Critical'
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full ${levelColors[level]} flex items-center justify-center`}>
            <span className="text-2xl font-bold text-white">{score}</span>
          </div>
          <div>
            <p className="font-medium">{levelLabels[level]}</p>
            <p className="text-xs text-muted-foreground">Overall safety score</p>
          </div>
        </div>

        {factors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Contributing Factors</p>
            <ul className="space-y-1">
              {factors.map((factor, i) => (
                <li key={i} className="text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Progress value={score} className="h-2" />
      </CardContent>
    </Card>
  )
}
