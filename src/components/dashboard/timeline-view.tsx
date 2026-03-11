'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Utensils, 
  Pill, 
  Activity, 
  AlertTriangle, 
  MessageCircle, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Coffee,
  Moon,
  Heart
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export interface TimelineEvent {
  id: string
  timestamp: Date | string
  type: 'meal' | 'medication' | 'activity' | 'alert' | 'conversation' | 'location_change' | 'sleep' | 'hydration' | 'bathroom'
  title: string
  description?: string
  status?: 'completed' | 'missed' | 'pending' | 'in_progress'
  metadata?: Record<string, unknown>
}

interface TimelineViewProps {
  events: TimelineEvent[]
  title?: string
  showDate?: boolean
}

const eventIcons: Record<string, React.ReactNode> = {
  meal: <Utensils className="h-4 w-4" />,
  medication: <Pill className="h-4 w-4" />,
  activity: <Activity className="h-4 w-4" />,
  alert: <AlertTriangle className="h-4 w-4" />,
  conversation: <MessageCircle className="h-4 w-4" />,
  location_change: <MapPin className="h-4 w-4" />,
  sleep: <Moon className="h-4 w-4" />,
  hydration: <Coffee className="h-4 w-4" />,
  bathroom: <Heart className="h-4 w-4" />
}

const eventColors: Record<string, string> = {
  meal: 'bg-green-100 text-green-700 border-green-200',
  medication: 'bg-purple-100 text-purple-700 border-purple-200',
  activity: 'bg-blue-100 text-blue-700 border-blue-200',
  alert: 'bg-red-100 text-red-700 border-red-200',
  conversation: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  location_change: 'bg-amber-100 text-amber-700 border-amber-200',
  sleep: 'bg-slate-100 text-slate-700 border-slate-200',
  hydration: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  bathroom: 'bg-pink-100 text-pink-700 border-pink-200'
}

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="h-3 w-3 text-green-500" />,
  missed: <XCircle className="h-3 w-3 text-red-500" />,
  pending: <Clock className="h-3 w-3 text-yellow-500" />,
  in_progress: <Activity className="h-3 w-3 text-blue-500" />
}

export function TimelineView({ events, title = "Today's Timeline", showDate = false }: TimelineViewProps) {
  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
    return groups
  }, {} as Record<string, TimelineEvent[]>)

  // Sort events within each group
  Object.keys(groupedEvents).forEach(date => {
    groupedEvents[date].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  })

  // Sort dates descending
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  const formatEventTime = (timestamp: Date | string) => {
    const date = new Date(timestamp)
    if (isToday(date)) {
      return format(date, 'h:mm a')
    }
    return format(date, 'MMM d, h:mm a')
  }

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No events recorded yet</p>
            <p className="text-xs">Events will appear as they occur</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Badge variant="outline">{events.length} events</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6">
          {sortedDates.map((date) => (
            <div key={date} className="mb-6">
              {showDate && (
                <div className="sticky top-0 bg-background py-2 mb-2 z-10">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    {formatDateLabel(date)}
                  </p>
                </div>
              )}
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />
                
                {/* Events */}
                <div className="space-y-4">
                  {groupedEvents[date].map((event, index) => (
                    <div 
                      key={event.id} 
                      className="relative flex gap-4 pb-4"
                    >
                      {/* Event icon */}
                      <div 
                        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          eventColors[event.type] || 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {eventIcons[event.type] || <Activity className="h-4 w-4" />}
                      </div>
                      
                      {/* Event content */}
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {event.title}
                            </p>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {event.status && statusIcons[event.status]}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatEventTime(event.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Metadata tags */}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(event.metadata).slice(0, 3).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-[10px]">
                                {key}: {String(value).slice(0, 20)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Daily Schedule Component
interface ScheduleItem {
  time: string
  activity: string
  type: 'meal' | 'medication' | 'activity' | 'sleep'
  completed: boolean
  notes?: string
}

interface DailyScheduleProps {
  schedule: ScheduleItem[]
  onMarkComplete?: (index: number) => void
}

export function DailySchedule({ schedule, onMarkComplete }: DailyScheduleProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Daily Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {schedule.map((item, index) => (
            <div 
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                item.completed ? 'bg-muted/50' : 'bg-background'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                eventColors[item.type]
              }`}>
                {eventIcons[item.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.time}</span>
                  {item.completed && (
                    <Badge variant="outline" className="text-xs">Completed</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{item.activity}</p>
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                )}
              </div>
              {!item.completed && onMarkComplete && (
                <button
                  onClick={() => onMarkComplete(index)}
                  className="text-xs text-primary hover:underline"
                >
                  Mark Done
                </button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Generate mock timeline events for demo
export function generateMockTimelineEvents(): TimelineEvent[] {
  const now = new Date()
  const events: TimelineEvent[] = []
  
  // Generate events for the day
  const eventTemplates = [
    { type: 'meal' as const, title: 'Breakfast', hours: 8 },
    { type: 'medication' as const, title: 'Morning Medication', hours: 8, minutes: 30 },
    { type: 'hydration' as const, title: 'Water Reminder', hours: 10 },
    { type: 'activity' as const, title: 'Light Exercise', hours: 10, minutes: 30 },
    { type: 'location_change' as const, title: 'Moved to Living Room', hours: 11 },
    { type: 'meal' as const, title: 'Lunch', hours: 12 },
    { type: 'conversation' as const, title: 'Conversation with Aegis', hours: 13 },
    { type: 'medication' as const, title: 'Afternoon Medication', hours: 14 },
    { type: 'alert' as const, title: 'Near Exit Detected', hours: 15, minutes: 30 },
    { type: 'hydration' as const, title: 'Water Reminder', hours: 16 },
    { type: 'meal' as const, title: 'Dinner', hours: 18 },
    { type: 'activity' as const, title: 'Evening Activity', hours: 19 },
    { type: 'medication' as const, title: 'Evening Medication', hours: 20 },
    { type: 'sleep' as const, title: 'Bedtime Routine Started', hours: 21 },
  ]
  
  eventTemplates.forEach((template, i) => {
    const timestamp = new Date(now)
    timestamp.setHours(template.hours, template.minutes || 0, 0, 0)
    
    // Only include past events
    if (timestamp <= now) {
      events.push({
        id: `event-${i}`,
        timestamp,
        type: template.type,
        title: template.title,
        status: Math.random() > 0.2 ? 'completed' : 'pending',
        description: template.type === 'alert' ? 'Gentle redirection provided' : undefined,
      })
    }
  })
  
  return events
}
