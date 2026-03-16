'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Brain, 
  Heart, 
  History, 
  BookOpen, 
  Video, 
  Mic2,
  Calendar,
  Shield,
  Bell
} from 'lucide-react';

// Aegis UI Components (Migrated)
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { BehavioralInsights } from '@/components/dashboard/behavioral-insights';
import { HealthMetrics } from '@/components/dashboard/health-metrics';
import { VisionMonitor } from '@/components/dashboard/vision-monitor';
import { VoiceInteraction } from '@/components/dashboard/voice-interaction';
import { LifeStoryBank } from '@/components/dashboard/life-story-bank';
import { PatientOverview } from '@/components/dashboard/patient-overview';
import { TimelineView, generateMockTimelineEvents } from '@/components/dashboard/timeline-view';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock Data for Demo
const DEMO_PATIENT = {
  id: 'patient-123',
  name: 'Margaret Thatcher',
  preferredName: 'Maggie',
  age: 82,
  dementiaStage: 'MODERATE',
  status: 'active' as const,
  mood: 'Calm',
  occupation: 'Retired Teacher'
};

export default function AegisDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLive, setIsLive] = useState(true);

  // Mock State for Voice Interaction
  const [conversation, setConversation] = useState<any[]>([
    {
      id: 1,
      type: "ai",
      content: `Hello ${DEMO_PATIENT.preferredName}, I'm Aegis, your personal assistant. How are you feeling today?`,
      timestamp: new Date(),
      emotion: "Cheerful"
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Mock Alerts
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      patient: DEMO_PATIENT.name,
      type: 'agitation',
      severity: 'medium',
      message: 'Elevated agitation detected during afternoon rest window.',
      time: '15 min ago',
      resolved: false
    }
  ]);

  const handleSendMessage = (content: string) => {
    const userMsg = {
      id: Date.now(),
      type: "user" as const,
      content,
      timestamp: new Date()
    };
    setConversation(prev => [...prev, userMsg]);
    
    setIsProcessing(true);
    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        type: "ai" as const,
        content: `I understand you're talking about "${content}". I'm here to help and listen.`,
        timestamp: new Date(),
        emotion: "Empathetic"
      };
      setConversation(prev => [...prev, aiMsg]);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 p-4 lg:p-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-800/50">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Aegis Advanced Dashboard
              </h1>
              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20 animate-pulse">
                LIVE
              </Badge>
            </div>
            <p className="text-slate-400 max-w-2xl">
              AI-Augmented caregiving interface with real-time behavioral analysis and safety monitoring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-slate-900/50 border-slate-700 hover:bg-slate-800">
              <Calendar className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <Bell className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </header>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* Left Column: Core Monitoring & Interaction */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Top Interactive Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VisionMonitor patient={DEMO_PATIENT} />
              <div className="space-y-6">
                <PatientOverview patient={{
                  ...DEMO_PATIENT,
                  lastInteraction: '2 mins ago',
                  riskLevel: 'low',
                  avatar: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=150&h=150&fit=crop&crop=face'
                }} />
                <AlertsPanel alerts={alerts} />
              </div>
            </div>

            {/* Interaction & Analysis Tabs */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-1 backdrop-blur-xl">
              <Tabs defaultValue="interaction" className="w-full">
                <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800/40">
                  <TabsList className="bg-transparent gap-4">
                    <TabsTrigger 
                      value="interaction" 
                      className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-400 border-b-2 border-transparent data-[state=active]:border-emerald-500 rounded-none h-12 gap-2"
                    >
                      <Mic2 className="w-4 h-4" /> Interaction
                    </TabsTrigger>
                    <TabsTrigger 
                      value="insights"
                      className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-400 border-b-2 border-transparent data-[state=active]:border-emerald-500 rounded-none h-12 gap-2"
                    >
                      <Brain className="w-4 h-4" /> Behavioral Insights
                    </TabsTrigger>
                    <TabsTrigger 
                      value="health"
                      className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-400 border-b-2 border-transparent data-[state=active]:border-emerald-500 rounded-none h-12 gap-2"
                    >
                      <Heart className="w-4 h-4" /> Health Metrics
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-4">
                  <TabsContent value="interaction" className="mt-0">
                    <VoiceInteraction 
                      patient={{
                        id: DEMO_PATIENT.id,
                        name: DEMO_PATIENT.name,
                        avatar: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=150&h=150&fit=crop&crop=face'
                      }}
                      isActive={true}
                      isMuted={isMuted}
                      isRecording={isRecording}
                      isProcessing={isProcessing}
                      conversation={conversation}
                      onStartRecording={() => setIsRecording(true)}
                      onStopRecording={() => setIsRecording(false)}
                      onSendMessage={handleSendMessage}
                      onToggleMute={() => setIsMuted(!isMuted)}
                    />
                  </TabsContent>
                  <TabsContent value="insights" className="mt-0">
                    <BehavioralInsights patientId={DEMO_PATIENT.id} />
                  </TabsContent>
                  <TabsContent value="health" className="mt-0">
                    <HealthMetrics patientId={DEMO_PATIENT.id} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* Right Column: Context & History */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 backdrop-blur-xl overflow-hidden flex flex-col h-[calc(100vh-280px)] sticky top-8">
              <div className="px-6 py-4 border-b border-slate-800/40 flex items-center justify-between bg-slate-900/20">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-lg">Daily Timeline</h3>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-500 border-slate-800">
                  Real-time Feed
                </Badge>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6">
                  <TimelineView events={generateMockTimelineEvents()} />
                </div>
              </ScrollArea>
              
              <div className="p-6 border-t border-slate-800/40 bg-slate-900/40">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between group hover:bg-emerald-500/5 text-slate-400 hover:text-emerald-400 border border-slate-800/60"
                  onClick={() => setActiveTab('lifestory')}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Open Life Story Bank
                  </span>
                  <Activity className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Life Story Bank Modal/Overlay (Overlayed via conditional for demo) */}
        {activeTab === 'lifestory' && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 lg:p-12">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/10"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Life Story Bank</h2>
                  <p className="text-sm text-slate-400">Memory preservation and validation aids for {DEMO_PATIENT.preferredName}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setActiveTab('overview')} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-8">
                <LifeStoryBank patientId={DEMO_PATIENT.id} patientName={DEMO_PATIENT.name} />
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
