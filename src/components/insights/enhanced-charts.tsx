'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Moon,
  Sun,
  AlertTriangle,
  Brain,
  Target,
  BarChart3
} from 'lucide-react'

interface ChartData {
  hourly: Array<{ hour: string; agitation: number; alerts: number }>
  daily: Array<{ day: string; agitation: number; wandering: number }>
  weekly: Array<{ name: string; value: number; color: string }>
}

interface EnhancedChartsProps {
  data?: ChartData
  showDemo?: boolean
}

const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444']

export function EnhancedCharts({ data, showDemo = true }: EnhancedChartsProps) {
  // Generate demo data if not provided
  const chartData = useMemo(() => {
    if (data) return data
    
    // Generate hourly agitation pattern (showing sundowning)
    const hourly = Array.from({ length: 24 }, (_, i) => {
      const hour = i
      let agitation = 0.15 + Math.random() * 0.1
      
      // Sundowning effect (4 PM - 7 PM)
      if (hour >= 16 && hour <= 19) {
        agitation += 0.25 + Math.random() * 0.35
      }
      
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        agitation: Math.min(1, agitation),
        alerts: agitation > 0.5 ? Math.floor(Math.random() * 3) : 0
      }
    })
    
    // Generate daily comparison
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const daily = days.map(day => ({
      day,
      agitation: 0.2 + Math.random() * 0.4,
      wandering: Math.floor(Math.random() * 3)
    }))
    
    // Alert distribution
    const weekly = [
      { name: 'Wandering', value: 35, color: '#f97316' },
      { name: 'Agitation', value: 28, color: '#eab308' },
      { name: 'Health', value: 22, color: '#3b82f6' },
      { name: 'Medication', value: 15, color: '#8b5cf6' }
    ]
    
    return { hourly, daily, weekly }
  }, [data])

  return (
    <div className="space-y-4">
      {/* Hourly Agitation Pattern */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Agitation Pattern (24h)
            </CardTitle>
            <div className="flex items-center gap-2">
              {showDemo && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <Sun className="h-3 w-3 mr-1" />
                  Sundowning Detected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.hourly}>
                <defs>
                  <linearGradient id="agitationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 1]}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Agitation']}
                />
                <Area 
                  type="monotone" 
                  dataKey="agitation" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fill="url(#agitationGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Sundowning highlight */}
          <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-800">
              <strong>Pattern:</strong> Agitation increases significantly between 4 PM - 7 PM, 
              consistent with sundowning behavior. Recommend starting calming activities at 3:30 PM.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Weekly Agitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.daily}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 1]}
                    tickFormatter={(v) => `${Math.round(v * 100)}%`}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Avg Agitation']}
                  />
                  <Bar 
                    dataKey="agitation" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Alert Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.weekly}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.weekly.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Wandering Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="wandering" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ fill: '#f97316', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Stats card component
export function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  positive = true 
}: { 
  title: string
  value: string
  change?: string
  icon: React.ElementType
  positive?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${positive ? 'text-green-600' : 'text-red-600'}`}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ROI Calculator
export function ROICalculator() {
  const stats = {
    erVisitsPrevented: 1,
    erCostPerVisit: 15000,
    caregiverHoursSaved: 40,
    hourlyCaregiverRate: 25,
    monthlySubscription: 50
  }
  
  const savings = (stats.erVisitsPrevented * stats.erCostPerVisit) + (stats.caregiverHoursSaved * stats.hourlyCaregiverRate)
  const roi = ((savings - stats.monthlySubscription) / stats.monthlySubscription * 100).toFixed(0)
  
  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-green-800">
          ROI This Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-green-700">Cost Savings</p>
            <p className="text-xl font-bold text-green-900">${savings.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-green-700">Return on Investment</p>
            <p className="text-xl font-bold text-green-900">{roi}x</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center justify-between text-xs text-green-700">
            <span>ER visit prevented</span>
            <span>-${stats.erCostPerVisit.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-green-700 mt-1">
            <span>Caregiver hours saved</span>
            <span>-${(stats.caregiverHoursSaved * stats.hourlyCaregiverRate).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
