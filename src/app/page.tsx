"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Bell, Activity, Users, Brain, Heart,
  MessageCircle, Settings, Menu, X, Mic, MicOff, 
  Volume2, VolumeX, Camera, CameraOff, Image as ImageIcon,
  TrendingUp, Clock, AlertTriangle, CheckCircle, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// ============================================
// TYPE DEFINITIONS
// ============================================

interface Patient {
  id: string;
  name: string;
  age: number;
  dementiaStage: string;
  avatar: string;
  status: string;
  mood: string;
  occupation: string;
}

interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface ConversationsMap {
  [patientId: string]: Message[];
}

type ViewType = "dashboard" | "insights" | "conversations" | "health" | "careteam" | "settings";

// ============================================
// DEMO DATA
// ============================================

const patients: Patient[] = [
  {
    id: "maggie",
    name: "Maggie Thompson",
    age: 78,
    dementiaStage: "moderate",
    avatar: "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=150&h=150&fit=crop&crop=face",
    status: "active",
    mood: "calm",
    occupation: "Former Teacher",
  },
  {
    id: "bill",
    name: "Bill Martinez",
    age: 82,
    dementiaStage: "early-moderate",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    status: "resting",
    mood: "content",
    occupation: "Former Carpenter",
  },
];

const navItems = [
  { id: 'dashboard' as ViewType, icon: Activity, label: "Dashboard" },
  { id: 'insights' as ViewType, icon: Brain, label: "Insights" },
  { id: 'conversations' as ViewType, icon: MessageCircle, label: "Conversations" },
  { id: 'health' as ViewType, icon: Heart, label: "Health Records" },
  { id: 'careteam' as ViewType, icon: Users, label: "Care Team" },
  { id: 'settings' as ViewType, icon: Settings, label: "Settings" },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function AegisDashboard() {
  // State
  const [selectedPatient, setSelectedPatient] = useState<Patient>(patients[0]);
  const [isMuted, setIsMuted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  
  // Separate conversations per patient - CRITICAL FOR ISOLATION
  const [conversations, setConversations] = useState<ConversationsMap>(() => ({
    maggie: [],
    bill: [],
  }));

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Vision state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{safetyLevel: string; concerns: string[]; patientState?: string} | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get current patient's conversation - ISOLATED BY PATIENT ID
  const currentConversation = conversations[selectedPatient.id] || [];

  // Add message to SPECIFIC patient's conversation - CRITICAL FOR ISOLATION
  const addMessage = useCallback((patientId: string, message: Message) => {
    setConversations(prev => ({
      ...prev,
      [patientId]: [...(prev[patientId] || []), message]
    }));
  }, []);

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process audio with ASR
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/asr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success && data.transcription) {
        // Add user message to CURRENT patient's conversation
        addMessage(selectedPatient.id, {
          id: Date.now(),
          type: 'user',
          content: data.transcription,
          timestamp: new Date(),
        });
        await getAIResponse(data.transcription);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    }
    setIsProcessing(false);
  };

  // Get AI response and speak it
  const getAIResponse = async (userMessage: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          message: userMessage,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.response) {
        // Add AI response to CURRENT patient's conversation
        addMessage(selectedPatient.id, {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response.message,
          timestamp: new Date(),
        });

        // Speak the response if not muted
        if (!isMuted) {
          await speakText(data.response.message);
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
    setIsProcessing(false);
  };

  // Text-to-speech
  const speakText = async (text: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'tongtong', speed: 0.9 }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        audioRef.current = new Audio(audioUrl);
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };

  // Vision functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsStreaming(false);
    setAnalysis(null);
  };

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          patientContext: selectedPatient,
          analysisType: 'safety',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
        
        // Speak the analysis if not muted
        if (!isMuted && data.analysis.concerns?.length > 0) {
          const concernText = `Safety analysis: ${data.analysis.safetyLevel}. ${data.analysis.concerns.join('. ')}`;
          await speakText(concernText);
        }
      }
    } catch (error) {
      console.error("Vision analysis error:", error);
    }
    setIsAnalyzing(false);
  };

  // Switch patient - IMPORTANT: This ensures conversation isolation
  const handlePatientSwitch = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsRecording(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg dark:bg-slate-900/80">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Aegis Caregiver
                </h1>
                <p className="text-xs text-muted-foreground">AI Guardian for Dementia Care</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Voice Mute Control */}
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute AI voice" : "Mute AI voice"}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4 text-emerald-500" />}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                2
              </span>
            </Button>

            {/* User Avatar */}
            <Avatar className="h-9 w-9 border-2 border-emerald-500">
              <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-white pt-20 transition-transform duration-300 dark:bg-slate-900
          lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 space-y-4">
            {/* Patients List */}
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase text-muted-foreground px-3">
                Patients
              </h2>
              {patients.map((patient) => (
                <motion.button
                  key={patient.id}
                  onClick={() => handlePatientSwitch(patient)}
                  className={`
                    w-full flex items-center gap-3 rounded-lg p-3 text-left transition-all
                    ${selectedPatient.id === patient.id 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
                  `}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={patient.avatar} />
                    <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{patient.name.split(' ')[0]}</span>
                      <span className={`h-2 w-2 rounded-full ${patient.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{patient.occupation}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <Separator />

            {/* Navigation - ALL BUTTONS NOW WORK */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  variant={currentView === item.id ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${currentView === item.id ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 space-y-6 pb-8">
          {/* Patient Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-emerald-500 shadow-xl">
                <AvatarImage src={selectedPatient.avatar} />
                <AvatarFallback className="text-xl">
                  {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>Age {selectedPatient.age}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedPatient.dementiaStage} dementia</span>
                  <span>•</span>
                  <span>{selectedPatient.occupation}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 dark:border-emerald-800">
                <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Monitoring
              </Badge>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Today's Interactions", value: currentConversation.length, icon: MessageCircle, color: "emerald" },
              { label: "Health Score", value: "94%", icon: Heart, color: "rose" },
              { label: "Risk Level", value: "Low", icon: Shield, color: "amber" },
              { label: "Care Hours Today", value: "8.5h", icon: Clock, color: "blue" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg
                      ${stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : ''}
                      ${stat.color === 'rose' ? 'bg-rose-100 text-rose-600' : ''}
                      ${stat.color === 'amber' ? 'bg-amber-100 text-amber-600' : ''}
                      ${stat.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Views - ALL VIEWS NOW IMPLEMENTED */}
          <AnimatePresence mode="wait">
            {currentView === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Tabs defaultValue="voice" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="voice">Voice AI</TabsTrigger>
                    <TabsTrigger value="vision">Vision</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="health">Health</TabsTrigger>
                  </TabsList>

                  <TabsContent value="voice" className="space-y-4">
                    <VoiceInteractionPanel
                      patient={selectedPatient}
                      conversation={currentConversation}
                      addMessage={addMessage}
                      isMuted={isMuted}
                      onToggleMute={() => setIsMuted(!isMuted)}
                    />
                  </TabsContent>

                  <TabsContent value="vision" className="space-y-4">
                    <VisionMonitorPanel 
                      patient={selectedPatient}
                      isStreaming={isStreaming}
                      isAnalyzing={isAnalyzing}
                      analysis={analysis}
                      videoRef={videoRef}
                      canvasRef={canvasRef}
                      onStartCamera={startCamera}
                      onStopCamera={stopCamera}
                      onAnalyze={analyzeFrame}
                    />
                  </TabsContent>

                  <TabsContent value="insights">
                    <InsightsPanel patient={selectedPatient} conversationCount={currentConversation.length} />
                  </TabsContent>

                  <TabsContent value="health">
                    <HealthPanel patient={selectedPatient} />
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}

            {currentView === "insights" && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <InsightsPanel patient={selectedPatient} conversationCount={currentConversation.length} />
              </motion.div>
            )}

            {currentView === "conversations" && (
              <motion.div
                key="conversations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <VoiceInteractionPanel
                  patient={selectedPatient}
                  conversation={currentConversation}
                  addMessage={addMessage}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted(!isMuted)}
                />
              </motion.div>
            )}

            {currentView === "health" && (
              <motion.div
                key="health"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <HealthPanel patient={selectedPatient} />
              </motion.div>
            )}

            {currentView === "careteam" && (
              <motion.div
                key="careteam"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <CareTeamPanel patient={selectedPatient} />
              </motion.div>
            )}

            {currentView === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <SettingsPanel 
                  isMuted={isMuted} 
                  onToggleMute={() => setIsMuted(!isMuted)}
                  patient={selectedPatient}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ============================================
// VOICE INTERACTION PANEL COMPONENT
// ============================================

import { useGeminiLive } from "@/hooks/use-gemini-live";

function VoiceInteractionPanel({
  patient,
  conversation,
  addMessage,
  isMuted,
  onToggleMute,
}: {
  patient: Patient;
  conversation: Message[];
  addMessage: (patientId: string, message: Message) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    connect, 
    disconnect, 
    sendText, 
    sendAudio, 
    startRecording, 
    stopRecording, 
    isConnected, 
    isConnecting, 
    isRecording,
    messages, 
    clearMessages 
  } = useGeminiLive();

  // Auto-connect when changing patients
  useEffect(() => {
    disconnect();
    clearMessages();
    setTimeout(() => {
      connect(patient.id, 'patient-voice');
    }, 100);
    return () => disconnect();
  }, [patient.id, connect, disconnect, clearMessages]);

  // Combine historical REST conversation with active WebSocket messages
  const displayMessages = [
    ...conversation,
    ...messages
      .filter(m => m.type === 'text' && m.content)
      .map((m, i) => ({
        id: Date.now() + i,
        type: m.role === 'user' ? 'user' : 'ai',
        content: m.content || '',
        timestamp: new Date(),
      } as Message))
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages.length]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendText(inputText);
      
      // Also log to the central dashboard conversation list
      addMessage(patient.id, {
        id: Date.now(),
        type: 'user',
        content: inputText,
        timestamp: new Date(),
      });
      
      setInputText("");
    }
  };

  const handleStartRecording = async () => {
    if (!isConnected) connect(patient.id, 'patient-voice');
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  return (
    <div className="space-y-4">
      {/* AI Status */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
              <Brain className={`h-6 w-6 ${isConnected && !isMuted ? 'animate-pulse' : ''}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Gemini Live Session
                {isConnected && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Connected" />}
                {isConnecting && <span className="text-xs text-muted-foreground animate-pulse">Connecting...</span>}
              </h3>
              <p className="text-sm text-muted-foreground">
                Real-time voice with <span className="font-medium text-emerald-600">{patient.name.split(' ')[0]}</span>
              </p>
            </div>
            {!isConnected && !isConnecting && (
              <Button size="sm" variant="outline" onClick={() => connect(patient.id, 'patient-voice')}>
                Reconnect
              </Button>
            )}
            <Badge variant="outline" className="bg-white dark:bg-slate-900">
              {displayMessages.length} messages
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card className="h-[400px] flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Live Event Stream - {patient.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-[320px] px-4 pb-4">
            {displayMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[280px] text-center">
                <Brain className="h-12 w-12 text-emerald-500 mb-4" />
                <p className="font-medium">Start speaking naturally</p>
                <p className="text-sm text-muted-foreground">Audio and text stream in real-time</p>
              </div>
            )}
            <div className="space-y-4">
              {displayMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.type === "ai" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white mr-2">
                      <Brain className="h-4 w-4" />
                    </div>
                  ) : null}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.type === "ai"
                      ? "bg-slate-100 dark:bg-slate-800" 
                      : "bg-emerald-500 text-white"
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.type === "ai" ? "text-muted-foreground" : "text-emerald-100"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.type === "user" && (
                    <Avatar className="h-8 w-8 ml-2 shrink-0">
                      <AvatarImage src={patient.avatar} />
                      <AvatarFallback>{patient.name[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4">
            {/* Voice Buttons */}
            <div className="flex items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  className={`h-16 w-16 rounded-full ${!isRecording ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={!isConnected && !isConnecting}
                >
                  {isRecording ? <MicOff className="h-6 w-6 animate-pulse" /> : <Mic className="h-6 w-6" />}
                </Button>
              </motion.div>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-12 rounded-full"
                onClick={onToggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5 text-red-500" /> : <Volume2 className="h-5 w-5 text-emerald-500" />}
              </Button>
            </div>

            {isRecording && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-red-500 text-sm flex items-center justify-center gap-2"
              >
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Listening... Speak now
              </motion.p>
            )}

            {/* Text Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message to Gemini Live..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button onClick={handleSend} disabled={!inputText.trim() || (!isConnected && !isConnecting)}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// ============================================
// VISION MONITOR PANEL COMPONENT
// ============================================

function VisionMonitorPanel({ 
  patient, 
  isStreaming, 
  isAnalyzing, 
  analysis, 
  videoRef, 
  canvasRef,
  onStartCamera,
  onStopCamera,
  onAnalyze 
}: { 
  patient: Patient;
  isStreaming: boolean;
  isAnalyzing: boolean;
  analysis: {safetyLevel: string; concerns: string[]; patientState?: string} | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onAnalyze: () => void;
}) {
  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:border-purple-800 dark:from-purple-950/50 dark:to-indigo-950/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 text-white">
            <Camera className="h-4 w-4" />
          </div>
          Vision Monitor - {patient.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`} 
          />
          <canvas ref={canvasRef} className="hidden" />
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <CameraOff className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                <p>Camera not active</p>
                <p className="text-sm text-slate-400">Click "Start Camera" to begin monitoring</p>
              </div>
            </div>
          )}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
              <div className="text-center">
                <Brain className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p>Analyzing...</p>
              </div>
            </div>
          )}
          {isStreaming && !isAnalyzing && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-red-500 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-white mr-2" />
                LIVE
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isStreaming ? (
            <Button onClick={onStartCamera} className="flex-1 bg-purple-500 hover:bg-purple-600">
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <>
              <Button onClick={onStopCamera} variant="outline" className="flex-1">
                <CameraOff className="h-4 w-4 mr-2" />
                Stop
              </Button>
              <Button onClick={onAnalyze} disabled={isAnalyzing} className="flex-1 bg-purple-500 hover:bg-purple-600">
                <ImageIcon className="h-4 w-4 mr-2" />
                Analyze Frame
              </Button>
            </>
          )}
        </div>

        {analysis && (
          <Card className="bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {analysis.safetyLevel === 'safe' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                Safety Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={analysis.safetyLevel === 'safe' ? 'default' : analysis.safetyLevel === 'caution' ? 'secondary' : 'destructive'}>
                  {analysis.safetyLevel?.toUpperCase()}
                </Badge>
                {analysis.patientState && (
                  <Badge variant="outline">
                    Patient: {analysis.patientState}
                  </Badge>
                )}
              </div>
              {analysis.concerns && analysis.concerns.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Concerns:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {analysis.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 mt-1 shrink-0 text-amber-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// INSIGHTS PANEL COMPONENT
// ============================================

function InsightsPanel({ patient, conversationCount }: { patient: Patient; conversationCount: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Behavioral Patterns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Mood Stability</span>
              <span className="font-medium">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sleep Quality</span>
              <span className="font-medium">72%</span>
            </div>
            <Progress value={72} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Social Engagement</span>
              <span className="font-medium">{Math.min(conversationCount * 10, 100)}%</span>
            </div>
            <Progress value={Math.min(conversationCount * 10, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Cognitive Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Memory Recall</p>
            <p className="text-xs text-muted-foreground mt-1">
              {patient.name.split(' ')[0]} responds well to reminiscence about their {patient.occupation === 'Former Teacher' ? 'teaching days' : 'engineering career'}.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Best Time for Activities</p>
            <p className="text-xs text-muted-foreground mt-1">
              Morning hours (9 AM - 12 PM) show highest engagement levels.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Communication Tips</p>
            <p className="text-xs text-muted-foreground mt-1">
              Speak slowly and maintain eye contact. Use familiar topics.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-500" />
            Recent Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: "2:30 PM", event: "Voice interaction completed", status: "success" },
              { time: "1:00 PM", event: "Lunch meal recorded", status: "success" },
              { time: "11:30 AM", event: "Morning walk activity", status: "success" },
              { time: "9:00 AM", event: "Medication taken", status: "success" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`h-2 w-2 rounded-full ${activity.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-sm text-muted-foreground w-20">{activity.time}</span>
                <span className="text-sm">{activity.event}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// HEALTH PANEL COMPONENT
// ============================================

function HealthPanel({ patient }: { patient: Patient }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            Vitals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Blood Pressure</span>
            <span className="text-sm font-medium">120/80</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Heart Rate</span>
            <span className="text-sm font-medium">72 bpm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Temperature</span>
            <span className="text-sm font-medium">98.6°F</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Oxygen Level</span>
            <span className="text-sm font-medium">98%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Medications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-between">
            <span className="text-sm">Donepezil 10mg</span>
            <Badge variant="outline" className="text-xs">8:00 AM</Badge>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-between">
            <span className="text-sm">Memantine 5mg</span>
            <Badge variant="outline" className="text-xs">8:00 PM</Badge>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-between">
            <span className="text-sm">Vitamin D</span>
            <Badge variant="outline" className="text-xs">12:00 PM</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-sm">Morning medication (8:00 AM)</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-sm">Breakfast (9:00 AM)</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-sm">Physical therapy (10:00 AM)</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm">Afternoon walk (3:00 PM)</span>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm">Sleep Quality This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {[65, 78, 72, 85, 70, 82, 75].map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-emerald-500 rounded-t transition-all" 
                  style={{ height: `${value}%` }}
                />
                <span className="text-xs text-muted-foreground">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// CARE TEAM PANEL COMPONENT
// ============================================

function CareTeamPanel({ patient }: { patient: Patient }) {
  const caregivers = [
    { name: "Susan Thompson", relation: "Daughter", role: "Primary Caregiver", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
    { name: "Dr. Sarah Chen", relation: "Physician", role: "Geriatric Specialist", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face" },
    { name: "Maria Garcia", relation: "Nurse", role: "Home Health Aide", avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop&crop=face" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Care Team for {patient.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {caregivers.map((caregiver, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={caregiver.avatar} />
                  <AvatarFallback>{caregiver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{caregiver.name}</p>
                  <p className="text-sm text-muted-foreground">{caregiver.role}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{caregiver.relation}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={caregivers[0].avatar} />
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{caregivers[0].name}</p>
              <p className="text-sm text-muted-foreground">(555) 123-4567</p>
            </div>
            <Button size="sm" variant="outline">Contact</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// SETTINGS PANEL COMPONENT
// ============================================

function SettingsPanel({ 
  isMuted, 
  onToggleMute,
  patient 
}: { 
  isMuted: boolean; 
  onToggleMute: () => void;
  patient: Patient;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Voice Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">AI Voice Output</p>
              <p className="text-sm text-muted-foreground">
                {isMuted ? "AI responses will not be spoken" : "AI responses will be spoken aloud"}
              </p>
            </div>
            <Button 
              onClick={onToggleMute}
              variant={isMuted ? "destructive" : "default"}
              size="sm"
            >
              {isMuted ? "Unmute" : "Mute"}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Voice Speed</p>
              <p className="text-sm text-muted-foreground">Normal (0.9x)</p>
            </div>
            <Badge variant="outline">Default</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Conversation Storage</p>
              <p className="text-sm text-muted-foreground">Store conversations for {patient.name}</p>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data Isolation</p>
              <p className="text-sm text-muted-foreground">Patient conversations are isolated</p>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <p className="text-sm font-medium">AI Model</p>
              <p className="text-xs text-muted-foreground">Memory Prosthetic v2.0</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <p className="text-sm font-medium">Speech Recognition</p>
              <p className="text-xs text-muted-foreground">ASR Enabled</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <p className="text-sm font-medium">Vision Analysis</p>
              <p className="text-xs text-muted-foreground">VLM Enabled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
