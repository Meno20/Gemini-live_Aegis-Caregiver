/**
 * Aegis Caregiver Dashboard - Complete Enhanced Version
 * Features: Multi-patient support, Audio alerts, Dark mode, Export, Mobile responsive
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useTheme } from 'next-themes'
import { 
  AlertTriangle, Activity, Heart, Home, User, Bell, Settings, Play, Square, Mic, MicOff,
  Video, VideoOff, Volume2, VolumeX, Clock, MapPin, Brain, TrendingUp, Shield,
  MessageCircle, CheckCircle, XCircle, Zap, Moon, Sun, Utensils, Pill, Droplets,
  DoorOpen, BookOpen, Calendar, BarChart3, Target, Info, Menu, Download, FileText,
  Users, LogOut, ChevronDown, Volume1
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import { CameraMonitor } from '@/components/camera-monitor'
import { useAudioAlerts } from '@/hooks/use-audio-alerts'
import { exportCSV, exportTextReport, generateDemoReportData, type ReportData } from '@/lib/export-utils'
import {
  analyzeHourlyPatterns, 
  analyzeDailyPatterns, 
  detectSundowningPattern,
  detectWanderingPattern,
  calculateRiskScore,
  generateHealthTrend,
  isSundowningWindow,
  getTimeBasedGreeting
} from '@/lib/behavior-analysis'

// Types
interface PatientState {
  patientId: string
  currentRoom: string
  isNearExit: boolean
  isSitting: boolean
  agitationLevel: number
  confusionLevel: number
  distressLevel: number
  lastMealTime: string | null
  lastHydrationTime: string | null
  lastMedicationTime: string | null
  repeatedQuestions: Record<string, number>
  currentTopic: string | null
  lastActivityTime: string
}

interface AlertData {
  id: string
  type: 'wandering' | 'agitation' | 'health' | 'safety' | 'medication' | 'meal'
  message: string
  urgency: 'low' | 'normal' | 'high' | 'emergency'
  timestamp: string
  patientId: string
  metadata: Record<string, unknown>
  status: 'pending' | 'acknowledged' | 'resolved'
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface Patient {
  id: string
  fullName: string
  preferredName: string
  diagnosisStage: string
  primaryCaregiverName: string
  dateOfBirth?: string
  spouseName?: string
  occupation?: string
}

// Room names
const ROOM_NAMES: Record<string, string> = {
  living_room: 'Living Room',
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  hallway: 'Hallway',
  exit: 'Near Exit',
  unknown: 'Unknown'
}

// Alert icons
const ALERT_ICONS: Record<string, React.ReactNode> = {
  wandering: <DoorOpen className="h-4 w-4" />,
  agitation: <AlertTriangle className="h-4 w-4" />,
  health: <Heart className="h-4 w-4" />,
  safety: <Shield className="h-4 w-4" />,
  medication: <Pill className="h-4 w-4" />,
  meal: <Utensils className="h-4 w-4" />
}

// Urgency colors
const URGENCY_COLORS: Record<string, string> = {
  emergency: 'bg-red-500 text-white dark:bg-red-600',
  high: 'bg-orange-500 text-white dark:bg-orange-600',
  normal: 'bg-yellow-500 text-black dark:bg-yellow-600 dark:text-white',
  low: 'bg-blue-500 text-white dark:bg-blue-600'
}

export default function AegisDashboard() {
  const { data: session, status } = useSession()
  const { theme } = useTheme()
  
  // Connection state - always connected via HTTP
  const [isConnected, setIsConnected] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  // Patient state
  const [patients, setPatients] = useState<Patient[]>([
    { 
      id: 'patient_001', 
      fullName: 'Margaret Anne Johnson', 
      preferredName: 'Maggie', 
      diagnosisStage: 'moderate', 
      primaryCaregiverName: 'Susan Martinez',
      dateOfBirth: '1942-03-15',
      spouseName: "Robert 'Bob' Johnson (deceased 2014)",
      occupation: 'Elementary school teacher'
    },
    { 
      id: 'patient_002', 
      fullName: 'William Thompson', 
      preferredName: 'Bill', 
      diagnosisStage: 'mild', 
      primaryCaregiverName: 'Jennifer Thompson-White',
      dateOfBirth: '1948-07-22',
      spouseName: 'Jennifer Thompson-White',
      occupation: 'Retired engineer'
    }
  ])
  const [selectedPatientId, setSelectedPatientId] = useState('patient_001')
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0]
  
  // Session state
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [patientState, setPatientState] = useState<PatientState | null>(null)
  
  // Alerts and conversation
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  
  // UI state
  const [activeTab, setActiveTab] = useState('monitor')
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMuted, setIsMuted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  
  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  // Audio alerts hook
  const { playAlert, playNotification, setMuted } = useAudioAlerts()
  
  // Hydration tracking
  const [hydrationCount, setHydrationCount] = useState(0)

  // Clear conversation when patient changes
  useEffect(() => {
    setConversation([])
    setAlerts([])
    setIsSessionActive(false)
    setPatientState(null)
  }, [selectedPatientId])

  // For demo purposes, skip authentication redirect
  // useEffect(() => {
  //   if (status === 'unauthenticated') {
  //     window.location.href = '/login'
  //   }
  // }, [status])

  // Play audio response
  const playAudio = useCallback((base64Audio: string) => {
    if (audioRef.current) {
      audioRef.current.src = `data:audio/wav;base64,${base64Audio}`
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [])

  // Check API connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/monitor?action=status')
        const data = await response.json()
        setIsConnected(data.connected ?? true)
      } catch (error) {
        console.error('Connection check failed:', error)
        setIsConnected(true) // Default to connected for demo
      }
    }
    checkConnection()
  }, [])

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Update mute state
  useEffect(() => {
    setMuted(isMuted)
  }, [isMuted, setMuted])

  // Session controls using HTTP API
  const startSession = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-session', patientId: selectedPatientId })
      })
      const data = await response.json()
      if (data.success) {
        setIsSessionActive(true)
        setPatientState(data.state)
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedPatientId])

  const stopSession = useCallback(async () => {
    try {
      await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop-session', patientId: selectedPatientId })
      })
      setIsSessionActive(false)
      setPatientState(null)
    } catch (error) {
      console.error('Failed to stop session:', error)
    }
  }, [selectedPatientId])

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge-alert', alertId, patientId: selectedPatientId })
      })
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, status: 'acknowledged' as const } : a
      ))
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }, [selectedPatientId])

  // Voice recording using HTTP API
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result as string
          const base64Data = base64.split(',')[1]
          
          try {
            const response = await fetch('/api/monitor', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'send-audio', patientId: selectedPatientId, audioBase64: base64Data })
            })
            const data = await response.json()
            if (data.success) {
              setConversation(data.conversation || [])
              if (data.audioBase64 && !isMuted) {
                playAudio(data.audioBase64)
              }
            }
          } catch (error) {
            console.error('Failed to process audio:', error)
          }
        }
        reader.readAsDataURL(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }, [selectedPatientId, isMuted, playAudio])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  // Send message using HTTP API
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !isConnected || !isSessionActive) return
    
    const userMessage = inputMessage
    setConversation(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }])
    setInputMessage('')
    
    try {
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-message', patientId: selectedPatientId, message: userMessage })
      })
      const data = await response.json()
      if (data.success) {
        setConversation(data.conversation || [])
        if (data.audioBase64 && !isMuted) {
          playAudio(data.audioBase64)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [inputMessage, isConnected, isSessionActive, selectedPatientId, isMuted, playAudio])

  // Format time ago
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hr ago`
    return date.toLocaleDateString()
  }

  // Get agitation color
  const getAgitationColor = (level: number) => {
    if (level < 0.3) return 'text-green-500'
    if (level < 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  // Pending alerts
  const pendingAlerts = alerts.filter(a => a.status === 'pending')

  // Generate insights data
  const hourlyPatterns = analyzeHourlyPatterns(
    alerts.map(a => ({ timestamp: new Date(a.timestamp), type: a.type, metadata: a.metadata }))
  )
  
  const dailyPatterns = analyzeDailyPatterns(
    alerts.map(a => ({ timestamp: new Date(a.timestamp), type: a.type })),
    []
  )

  const healthTrend = generateHealthTrend(7)

  const behavioralInsights = []
  const sundowning = detectSundowningPattern(hourlyPatterns)
  if (sundowning) behavioralInsights.push(sundowning)
  
  const wandering = detectWanderingPattern(hourlyPatterns)
  if (wandering) behavioralInsights.push(wandering)

  const riskAssessment = calculateRiskScore(
    patientState?.agitationLevel || 0.1,
    alerts.filter(a => a.type === 'wandering').length,
    0.85,
    pendingAlerts.length
  )

  // Daily schedule
  const dailySchedule = [
    { time: '8:00 AM', activity: 'Breakfast', type: 'meal' as const, completed: true },
    { time: '8:30 AM', activity: 'Morning Medication', type: 'medication' as const, completed: true },
    { time: '10:00 AM', activity: 'Light Exercise', type: 'activity' as const, completed: true },
    { time: '12:00 PM', activity: 'Lunch', type: 'meal' as const, completed: true },
    { time: '2:00 PM', activity: 'Afternoon Medication', type: 'medication' as const, completed: false },
    { time: '3:30 PM', activity: 'Calm Time', type: 'activity' as const, completed: false },
    { time: '6:00 PM', activity: 'Dinner', type: 'meal' as const, completed: false },
    { time: '8:00 PM', activity: 'Evening Medication', type: 'medication' as const, completed: false },
    { time: '9:00 PM', activity: 'Bedtime Routine', type: 'sleep' as const, completed: false },
  ]

  // Export handlers
  const handleExportCSV = () => {
    const reportData = generateDemoReportData(selectedPatient.fullName, selectedPatient.id)
    exportCSV(reportData)
    setIsExportDialogOpen(false)
  }

  const handleExportText = () => {
    const reportData = generateDemoReportData(selectedPatient.fullName, selectedPatient.id)
    exportTextReport(reportData)
    setIsExportDialogOpen(false)
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
      
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Aegis Caregiver
                  </SheetTitle>
                  <SheetDescription>
                    Dementia care assistant
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.preferredName} - {p.diagnosisStage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full justify-start" onClick={() => setIsExportDialogOpen(true)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume1 className="h-4 w-4 mr-2" />}
                    {isMuted ? 'Unmute Alerts' : 'Mute Alerts'}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold">Aegis Caregiver</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {getTimeBasedGreeting()}, {session?.user?.name?.split(' ')[0] || 'Caregiver'}
              </p>
            </div>
          </div>
          
          {/* Desktop controls */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Patient selector */}
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger className="w-[200px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {patients.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.preferredName} - {p.diagnosisStage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground hidden xl:inline">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="text-sm font-medium">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            
            {isSundowningWindow() && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700">
                <Sun className="h-3 w-3 mr-1" />
                Sundowning Window
              </Badge>
            )}
            
            {/* Audio toggle */}
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            {/* Theme toggle */}
            <ThemeToggle />
            
            {/* Export */}
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Report</DialogTitle>
                  <DialogDescription>
                    Download a report for {selectedPatient.fullName}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Button onClick={handleExportCSV} className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                  <Button onClick={handleExportText} variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Export as Text
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            {isSessionActive ? (
              <Button variant="destructive" size="sm" onClick={stopSession}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={startSession} disabled={!isConnected}>
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            )}
            
            <UserMenu />
          </div>
          
          {/* Mobile controls */}
          <div className="flex lg:hidden items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isSessionActive ? (
              <Button variant="destructive" size="sm" onClick={stopSession}>
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={startSession} disabled={!isConnected}>
                <Play className="h-4 w-4" />
              </Button>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Mobile patient info card */}
        <div className="lg:hidden mb-4">
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {selectedPatient.preferredName[0]}
                  </div>
                  <div>
                    <p className="font-medium">{selectedPatient.fullName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedPatient.diagnosisStage} Dementia</p>
                  </div>
                </div>
                {patientState && (
                  <Badge variant={patientState.isNearExit ? 'destructive' : 'secondary'}>
                    {ROOM_NAMES[patientState.currentRoom]}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column - Patient Info & State (Desktop) */}
          <div className="hidden lg:block lg:col-span-3 space-y-4">
            {/* Patient Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {selectedPatient.preferredName[0]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedPatient.fullName}</CardTitle>
                    <CardDescription>
                      {selectedPatient.diagnosisStage.charAt(0).toUpperCase() + selectedPatient.diagnosisStage.slice(1)} Dementia
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Caregiver</span>
                  <span>{selectedPatient.primaryCaregiverName}</span>
                </div>
                <Separator />
                
                {patientState && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </span>
                      <Badge variant={patientState.isNearExit ? 'destructive' : 'secondary'}>
                        {ROOM_NAMES[patientState.currentRoom] || patientState.currentRoom}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Agitation
                        </span>
                        <span className={`font-medium ${getAgitationColor(patientState.agitationLevel)}`}>
                          {Math.round(patientState.agitationLevel * 100)}%
                        </span>
                      </div>
                      <Progress value={patientState.agitationLevel * 100} className="h-2" />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Utensils className="h-4 w-4" />
                          Last Meal
                        </span>
                        <span className="text-xs">{formatTimeAgo(patientState.lastMealTime)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Droplets className="h-4 w-4" />
                          Last Water
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          {formatTimeAgo(patientState.lastHydrationTime)}
                          {hydrationCount > 0 && (
                            <Badge variant="outline" className="text-xs ml-1 bg-blue-50 dark:bg-blue-900/30">
                              {hydrationCount}x
                            </Badge>
                          )}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    riskAssessment.level === 'low' ? 'bg-green-500' :
                    riskAssessment.level === 'medium' ? 'bg-yellow-500' :
                    riskAssessment.level === 'high' ? 'bg-orange-500' : 'bg-red-500'
                  }`}>
                    <span className="text-2xl font-bold text-white">{riskAssessment.score}</span>
                  </div>
                  <div>
                    <p className="font-medium capitalize">{riskAssessment.level} Risk</p>
                    <p className="text-xs text-muted-foreground">Overall safety score</p>
                  </div>
                </div>
                {riskAssessment.factors.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Contributing Factors</p>
                    <ul className="space-y-1">
                      {riskAssessment.factors.map((factor, i) => (
                        <li key={i} className="text-xs flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Progress value={riskAssessment.score} className="h-2" />
              </CardContent>
            </Card>

            {/* Session Status */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-sm">
                    {isSessionActive ? 'Monitoring Active' : 'Session Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Main View */}
          <div className="lg:col-span-6 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 h-9">
                <TabsTrigger value="monitor" className="text-xs sm:text-sm">Monitor</TabsTrigger>
                <TabsTrigger value="insights" className="text-xs sm:text-sm">Insights</TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs sm:text-sm">Timeline</TabsTrigger>
                <TabsTrigger value="stories" className="text-xs sm:text-sm">Stories</TabsTrigger>
                <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
              </TabsList>

              {/* Monitor Tab */}
              <TabsContent value="monitor" className="space-y-4 mt-4">
                {/* Camera View - Real webcam with AI analysis */}
                <CameraMonitor
                  isSessionActive={isSessionActive}
                  selectedPatientName={selectedPatient.preferredName}
                  onAnalysis={(analysis) => {
                    // Update patient state based on vision analysis
                    setPatientState(prev => prev ? {
                      ...prev,
                      currentRoom: analysis.room,
                      isNearExit: analysis.isNearExit,
                      isSitting: analysis.isSitting,
                      agitationLevel: analysis.agitationLevel,
                      lastActivityTime: new Date().toISOString()
                    } : null)
                    
                    // Update hydration if detected in analysis
                    if (analysis.activity?.includes('drinking') || analysis.activity?.includes('water')) {
                      setHydrationCount(prev => prev + 1)
                      setPatientState(prev => prev ? {
                        ...prev,
                        lastHydrationTime: new Date().toISOString()
                      } : null)
                    }
                    
                    // Generate alerts for concerning behavior
                    if (analysis.isNearExit && analysis.patientVisible) {
                      const newAlert: AlertData = {
                        id: `alert_${Date.now()}`,
                        type: 'wandering',
                        message: `${selectedPatient.preferredName} detected near exit in ${ROOM_NAMES[analysis.room] || analysis.room}`,
                        urgency: 'high',
                        timestamp: new Date().toISOString(),
                        patientId: selectedPatientId,
                        metadata: { room: analysis.room },
                        status: 'pending'
                      }
                      setAlerts(prev => [newAlert, ...prev.slice(0, 19)])
                      playAlert()
                    }
                    
                    if (analysis.agitationLevel > 0.5 && analysis.patientVisible) {
                      const newAlert: AlertData = {
                        id: `alert_${Date.now()}_agitation`,
                        type: 'agitation',
                        message: `${selectedPatient.preferredName} showing elevated agitation (${Math.round(analysis.agitationLevel * 100)}%)`,
                        urgency: analysis.agitationLevel > 0.7 ? 'high' : 'normal',
                        timestamp: new Date().toISOString(),
                        patientId: selectedPatientId,
                        metadata: { agitationLevel: analysis.agitationLevel },
                        status: 'pending'
                      }
                      setAlerts(prev => [newAlert, ...prev.slice(0, 19)])
                    }
                  }}
                />

                {/* Voice Interaction */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      Voice Interaction
                      {isPlaying && (
                        <Badge variant="secondary" className="animate-pulse">
                          <Volume2 className="h-3 w-3 mr-1" />
                          Speaking...
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!isSessionActive || isPlaying}
                    >
                      {isRecording ? (
                        <><MicOff className="h-4 w-4 mr-2" />Stop Recording</>
                      ) : (
                        <><Mic className="h-4 w-4 mr-2" />Talk to {selectedPatient.preferredName}</>
                      )}
                    </Button>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background"
                        disabled={!isSessionActive || isPlaying}
                      />
                      <Button onClick={sendMessage} disabled={!isSessionActive || !inputMessage.trim() || isPlaying}>
                        Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Schedule */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Daily Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {dailySchedule.map((item, i) => (
                          <div 
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              item.completed 
                                ? 'bg-muted/50 border-muted' 
                                : 'bg-background border-border'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              item.type === 'meal' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              item.type === 'medication' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              item.type === 'sleep' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {item.type === 'meal' && <Utensils className="h-4 w-4" />}
                              {item.type === 'medication' && <Pill className="h-4 w-4" />}
                              {item.type === 'sleep' && <Moon className="h-4 w-4" />}
                              {item.type === 'activity' && <Activity className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{item.time}</span>
                                {item.completed && (
                                  <Badge variant="outline" className="text-xs">Completed</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{item.activity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{alerts.length}</p>
                        <p className="text-xs text-muted-foreground">Total Alerts</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-500">{pendingAlerts.length}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-500">{Math.round((1 - patientState?.agitationLevel || 0) * 100)}%</p>
                        <p className="text-xs text-muted-foreground">Calm Score</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{riskAssessment.score}</p>
                        <p className="text-xs text-muted-foreground">Risk Score</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Detected Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {behavioralInsights.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No patterns detected yet. More data needed.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {behavioralInsights.map((insight, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-muted/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium capitalize text-sm">{insight.type.replace('_', ' ')}</span>
                              <Badge variant="outline">{Math.round(insight.confidence * 100)}%</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{insight.description}</p>
                            <p className="text-xs text-primary mt-2">{insight.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Today&apos;s Activity</CardTitle>
                    <CardDescription>Chronological view of events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {alerts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No events recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {alerts.map((alert) => (
                            <div key={alert.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  URGENCY_COLORS[alert.urgency]
                                }`}>
                                  {ALERT_ICONS[alert.type]}
                                </div>
                                <div className="w-px h-full bg-border" />
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium capitalize text-sm">{alert.type}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Stories Tab */}
              <TabsContent value="stories" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Life Story Bank</CardTitle>
                    <CardDescription>Memories for reminiscence therapy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {[
                          { title: 'First Day of Teaching', content: 'In 1965, I walked into Lincoln Elementary for my first day as a teacher...', category: 'career' },
                          { title: 'Wedding Day', content: "Bob and I got married on June 12, 1962, at St. Mary's Church...", category: 'family' },
                          { title: 'Teacher of the Year 1985', content: 'The whole school gathered in the auditorium. Principal Henderson called my name...', category: 'career' },
                          { title: 'The Garden Behind the House', content: 'Every spring, Bob and I would plant tomatoes, zucchini, and marigolds...', category: 'hobbies' },
                        ].map((story, i) => (
                          <div key={i} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{story.title}</span>
                              <Badge variant="outline" className="capitalize">{story.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{story.content}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Patient Profile</CardTitle>
                    <CardDescription>Manage patient information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={selectedPatient.fullName} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Preferred Name</Label>
                        <Input value={selectedPatient.preferredName} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Diagnosis Stage</Label>
                        <Input value={selectedPatient.diagnosisStage} disabled className="capitalize" />
                      </div>
                      <div className="space-y-2">
                        <Label>Primary Caregiver</Label>
                        <Input value={selectedPatient.primaryCaregiverName} disabled />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Profile editing requires admin permissions.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Alerts */}
          <div className="lg:col-span-3 space-y-4">
            {/* Alerts Panel */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Alerts
                  </CardTitle>
                  {pendingAlerts.length > 0 && (
                    <Badge variant="destructive">{pendingAlerts.length}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px] lg:h-[400px] pr-2">
                  {alerts.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>No alerts</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div 
                          key={alert.id}
                          className={`p-3 rounded-lg border ${
                            alert.status === 'pending' 
                              ? 'border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/20' 
                              : 'opacity-60 bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded ${URGENCY_COLORS[alert.urgency]}`}>
                              {ALERT_ICONS[alert.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium capitalize">{alert.type}</span>
                                <Badge variant="outline" className="text-xs">
                                  {alert.urgency}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {alert.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(alert.timestamp).toLocaleTimeString()}
                                </span>
                                {alert.status === 'pending' && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => acknowledgeAlert(alert.id)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Ack
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Conversation History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Recent Conversation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {conversation.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No conversation yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {conversation.slice(-10).map((msg, i) => (
                        <div 
                          key={i}
                          className={`text-sm p-2 rounded ${
                            msg.role === 'assistant' 
                              ? 'bg-muted' 
                              : 'bg-primary/10'
                          }`}
                        >
                          <p className="font-medium text-xs text-muted-foreground mb-1">
                            {msg.role === 'assistant' ? 'Aegis' : selectedPatient.preferredName}
                          </p>
                          <p className="line-clamp-2">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-3 mt-auto">
        <div className="container mx-auto px-2 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Aegis Caregiver v1.0.0</span>
          </div>
          <div className="text-center sm:text-right">
            Powered by Gemini Live API • It remembers when they can&apos;t
          </div>
        </div>
      </footer>
    </div>
  )
}
