"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Bell, Activity, Users, Brain, Heart,
  MessageCircle, Settings, Mic, MicOff, 
  Volume2, VolumeX, Camera, CameraOff, Image as ImageIcon,
  TrendingUp, Clock, AlertTriangle, CheckCircle, Send,
  BookOpen, Upload, Plus, Trash2, Pencil, Save, X, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ============================================
// TYPE DEFINITIONS
// ============================================

interface CareTeamMember {
  name: string;
  relation: string;
  role: string;
  avatar: string;
}

interface Vital {
  label: string;
  value: string;
  color?: string;
}

interface Medication {
  name: string;
  time: string;
  color?: string;
  text?: string;
}

interface ScheduleItem {
  task: string;
  time: string;
  done: boolean;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  dementiaStage: string;
  avatar: string;
  status: string;
  mood: string;
  occupation: string;
  careTeam?: CareTeamMember[];
  vitals?: Vital[];
  medications?: Medication[];
  schedule?: ScheduleItem[];
  sleepData?: number[];
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

interface Memory {
  id: string;
  title: string;
  content: string;
  date: string;
  type: string;
}

interface MemoriesMap {
  [patientId: string]: Memory[];
}

type ViewType = "dashboard" | "interactions" | "stories" | "careteam" | "settings";

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
    careTeam: [
      { name: "Susan Thompson", relation: "Daughter", role: "Primary Caregiver", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
      { name: "Dr. Sarah Chen", relation: "Physician", role: "Geriatric Specialist", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face" },
      { name: "Maria Garcia", relation: "Nurse", role: "Home Health Aide", avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop&crop=face" },
    ],
    vitals: [
      { label: "Blood Pressure", value: "128/84" },
      { label: "Heart Rate", value: "72 bpm" },
      { label: "Temperature", value: "98.6°F" },
      { label: "Oxygen Level", value: "98%" },
    ],
    medications: [
      { name: "Donepezil 10mg", time: "8:00 AM", color: "bg-emerald-50", text: "text-emerald-700" },
      { name: "Memantine 5mg", time: "8:00 PM", color: "bg-blue-50", text: "text-blue-700" },
      { name: "Vitamin D", time: "12:00 PM", color: "bg-amber-50", text: "text-amber-700" },
    ],
    schedule: [
      { task: "Morning medication", time: "8:00 AM", done: true },
      { task: "Breakfast (Oatmeal)", time: "9:00 AM", done: true },
      { task: "English Lit Read-aloud", time: "11:00 AM", done: true },
      { task: "Afternoon nap", time: "2:00 PM", done: false },
    ],
    sleepData: [65, 78, 72, 85, 70, 82, 75]
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
    careTeam: [
      { name: "David Martinez", relation: "Son", role: "Primary Caregiver", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" },
      { name: "Dr. James Wilson", relation: "Physician", role: "Neurologist", avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face" },
      { name: "Robert Taylor", relation: "Therapist", role: "Physical Therapist", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
    ],
    vitals: [
      { label: "Blood Pressure", value: "135/88", color: "text-amber-600" },
      { label: "Heart Rate", value: "68 bpm" },
      { label: "Temperature", value: "98.2°F" },
      { label: "Oxygen Level", value: "96%" },
    ],
    medications: [
      { name: "Galantamine 8mg", time: "9:00 AM", color: "bg-emerald-50", text: "text-emerald-700" },
      { name: "Aspirin 81mg", time: "9:00 AM", color: "bg-rose-50", text: "text-rose-700" },
    ],
    schedule: [
      { task: "Morning walk", time: "8:30 AM", done: true },
      { task: "Carpentry woodworking", time: "10:30 AM", done: true },
      { task: "Speech therapy", time: "3:30 PM", done: false },
    ],
    sleepData: [45, 55, 60, 48, 70, 62, 58]
  },
];

const navItems = [
  { id: 'dashboard' as ViewType, icon: Activity, label: "Dashboard" },
  { id: 'interactions' as ViewType, icon: MessageCircle, label: "Interactions" },
  { id: 'stories' as ViewType, icon: BookOpen, label: "Stories" },
  { id: 'careteam' as ViewType, icon: Users, label: "Team" },
  { id: 'settings' as ViewType, icon: Settings, label: "Settings" },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function AegisDashboard() {
  // State
  // State
  const [patientsList, setPatientsList] = useState<Patient[]>(patients);
  const [selectedPatient, setSelectedPatient] = useState<Patient>(patients[0]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  
  // New Patient Form State
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientAge, setNewPatientAge] = useState("");
  const [newPatientStage, setNewPatientStage] = useState("early");
  const [newPatientOccupation, setNewPatientOccupation] = useState("");

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

  const [memories, setMemories] = useState<MemoriesMap>(() => ({
    maggie: [
      { id: '1', title: "Wedding Day 1968", content: "Maggie often speaks about her wedding in London. She wore a lace dress and there were lilies everywhere. She counts it as her happiest day.", date: "Mar 12, 2024", type: "Reminiscence" },
      { id: '2', title: "Teaching Years", content: "Maggie was a dedicated teacher for 35 years. She specialized in English Literature and loved Dickens. Mentioning 'Great Expectations' usually triggers positive memories.", date: "Mar 14, 2024", type: "Professional" }
    ],
    bill: [
       { id: '3', title: "Carpentry Shop", content: "Bill loved working with cedar. He built the local church benches in 1995. The smell of sawdust is very grounding for him.", date: "Mar 10, 2024", type: "Professional" }
    ],
  }));

  // Vision state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{safetyLevel: string; concerns: string[]; patientState?: string} | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Memory Handlers
  const addMemory = useCallback((patientId: string, memory: Omit<Memory, 'id' | 'date'>) => {
    const newMemory: Memory = {
      ...memory,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setMemories(prev => ({
      ...prev,
      [patientId]: [newMemory, ...(prev[patientId] || [])]
    }));
  }, []);

  const deleteMemory = useCallback((patientId: string, memoryId: string) => {
    setMemories(prev => ({
      ...prev,
      [patientId]: (prev[patientId] || []).filter(m => m.id !== memoryId)
    }));
  }, []);

  const updateMemory = useCallback((patientId: string, updatedMemory: Memory) => {
    setMemories(prev => ({
      ...prev,
      [patientId]: (prev[patientId] || []).map(m => m.id === updatedMemory.id ? updatedMemory : m)
    }));
  }, []);

  // Add Patient Handler
  const handleAddPatient = () => {
    if (!newPatientName) return;
    
    const id = newPatientName.toLowerCase().replace(/\s+/g, '-');
    const newPatient: Patient = {
      id,
      name: newPatientName,
      age: parseInt(newPatientAge) || 75,
      dementiaStage: newPatientStage,
      avatar: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=150&h=150&fit=crop&crop=face`,
      status: "active",
      mood: "neutral",
      occupation: newPatientOccupation || "Retired",
      careTeam: [
        { name: "Agency Staff", relation: "Agency", role: "Primary Caregiver", avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop&crop=face" }
      ],
      vitals: [
        { label: "Blood Pressure", value: "--/--" },
        { label: "Heart Rate", value: "-- bpm" },
        { label: "Temperature", value: "--°F" },
        { label: "Oxygen Level", value: "--%" },
      ],
      medications: [],
      schedule: [],
      sleepData: [0, 0, 0, 0, 0, 0, 0]
    };

    setPatientsList(prev => [...prev, newPatient]);
    setConversations(prev => ({ ...prev, [id]: [] }));
    setMemories(prev => ({ ...prev, [id]: [] }));
    
    // Switch to new patient
    setSelectedPatient(newPatient);
    setIsAddPatientOpen(false);
    
    // Clear form
    setNewPatientName("");
    setNewPatientAge("");
    setNewPatientOccupation("");
  };

  const handleDeletePatient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger patient switch
    
    // Don't delete if it's the only patient
    if (patientsList.length <= 1) return;

    const updatedList = patientsList.filter(p => p.id !== id);
    setPatientsList(updatedList);
    
    // If deleted patient was selected, switch to another one
    if (selectedPatient.id === id) {
      setSelectedPatient(updatedList[0]);
    }

    // Clean up related state
    setConversations(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setMemories(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updatePatientData = (patientId: string, updates: Partial<Patient>) => {
    setPatientsList(prev => {
      const newList = prev.map(p => p.id === patientId ? { ...p, ...updates } : p);
      return newList;
    });
    // Sync selected patient if it matches
    if (selectedPatient.id === patientId) {
      setSelectedPatient(prev => ({ ...prev, ...updates }));
    }
  };

  // Get current patient's data
  const currentConversation = conversations[selectedPatient.id] || [];
  const currentMemories = memories[selectedPatient.id] || [];

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
    <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as ViewType)} className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg dark:bg-slate-900/80">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Patient Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative group focus:outline-none flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-emerald-500 hover:border-emerald-400 transition-colors shadow-sm">
                      <AvatarImage src={selectedPatient.avatar} />
                      <AvatarFallback>{selectedPatient.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-white dark:border-slate-800 shadow-sm">
                      <Settings className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  <div className="text-left hidden sm:block">
                    <h2 className="text-sm font-bold leading-none">{selectedPatient.name.split(' ')[0]}</h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{selectedPatient.dementiaStage} stage</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 mt-2">
                <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-semibold">Switch Patient</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {patientsList.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => handlePatientSwitch(p)} className="flex items-center gap-3 py-2 cursor-pointer">
                    <Avatar className="h-8 w-8 hover:ring-2 ring-emerald-500/20">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback>{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.occupation}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {p.id === selectedPatient.id && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                      {patientsList.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-red-500 transition-colors"
                          onClick={(e) => handleDeletePatient(p.id, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsAddPatientOpen(true)}
                  className="flex items-center gap-3 py-2 cursor-pointer text-emerald-600 font-medium hover:text-emerald-700"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span>Add New Patient</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-8 mx-2 hidden sm:block" />

            </div>

          {/* Navigation Tabs - Centered in Header */}
          <div className="hidden md:flex flex-1 justify-center max-w-md mx-4">
            <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 h-9 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/80">
              {navItems.map((item) => (
                <TabsTrigger 
                  key={item.id} 
                  value={item.id} 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm rounded-lg py-1.5 px-3 transition-all duration-200 gap-2 overflow-hidden group"
                >
                  <item.icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${currentView === item.id ? 'animate-pulse' : ''}`} />
                  <span className="text-[11px] font-medium hidden lg:inline tracking-tight">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Mute Control */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 rounded-full p-0"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute AI voice" : "Mute AI voice"}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4 text-emerald-500" />}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                2
              </span>
            </Button>

            {/* User Avatar - Caregiver Agency Manager */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 border-2 border-emerald-500 hover:ring-2 ring-emerald-500/20 transition-all cursor-pointer">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" />
                  <AvatarFallback>AM</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Agency Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Agency Profile</DropdownMenuItem>
                <DropdownMenuItem>Manage Caregivers</DropdownMenuItem>
                <DropdownMenuItem>Billing & Reports</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Add Patient Modal */}
        <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enroll New Patient</DialogTitle>
              <DialogDescription>
                Enter the profile details for the new member of the Aegis care family.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={newPatientName} onChange={e => setNewPatientName(e.target.value)} placeholder="e.g. Robert Smith" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" value={newPatientAge} onChange={e => setNewPatientAge(e.target.value)} placeholder="80" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stage">Condition Stage</Label>
                  <select 
                    id="stage" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newPatientStage}
                    onChange={e => setNewPatientStage(e.target.value)}
                  >
                    <option value="early">Early Stage</option>
                    <option value="early-moderate">Early-Moderate</option>
                    <option value="moderate">Moderate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="occupation">Former Occupation</Label>
                <Input id="occupation" value={newPatientOccupation} onChange={e => setNewPatientOccupation(e.target.value)} placeholder="e.g. Engineer" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPatientOpen(false)}>Cancel</Button>
              <Button onClick={handleAddPatient} className="bg-emerald-600 hover:bg-emerald-700">Add Patient</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 p-2 lg:p-4 space-y-3 pb-6 overflow-y-auto">
            {/* Mobile Navigation fallback or keep as is for desktop */}
            <div className="md:hidden flex justify-center sticky top-0 z-30 py-1 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm -mx-2 px-2">
              <TabsList className="bg-slate-100/80 dark:bg-slate-900/80 p-0.5 h-9">
                {navItems.map((item) => (
                  <TabsTrigger 
                    key={item.id} 
                    value={item.id} 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 text-[11px] px-2 sm:px-3 h-8 gap-1.5"
                  >
                    <item.icon className="h-3 w-3" />
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent value="dashboard" className="space-y-4 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Active Monitoring: {selectedPatient.name}</h3>
                        <p className="text-xs text-muted-foreground">All systems operational • Stable condition</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900">Live</Badge>
                  </div>
                  
                  {/* Health and Vital Stats */}
                  <HealthPanel 
                    patient={selectedPatient} 
                    onUpdate={(updates) => updatePatientData(selectedPatient.id, updates)} 
                  />
                </motion.div>
              </TabsContent>              <TabsContent value="interactions" className="space-y-4 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-1 xl:grid-cols-2 gap-4"
                >
                  <div className="space-y-4">
                    <VoiceInteractionPanel
                      patient={selectedPatient}
                      conversation={currentConversation}
                      addMessage={addMessage}
                      isMuted={isMuted}
                      onToggleMute={() => setIsMuted(!isMuted)}
                    />
                  </div>
                  <div className="space-y-4">
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
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="stories" className="space-y-4 focus-visible:outline-none">
                <StoriesPanel 
                  patient={selectedPatient} 
                  memories={currentMemories}
                  onAdd={addMemory}
                  onDelete={deleteMemory}
                  onUpdate={updateMemory}
                />
              </TabsContent>



              <TabsContent value="careteam" className="space-y-4 focus-visible:outline-none">
                <CareTeamPanel 
                  patient={selectedPatient} 
                  onUpdate={(updates) => updatePatientData(selectedPatient.id, updates)}
                />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 focus-visible:outline-none">
                <SettingsPanel 
                  isMuted={isMuted} 
                  onToggleMute={() => setIsMuted(!isMuted)}
                  patient={selectedPatient}
                />
              </TabsContent>
            </AnimatePresence>
        </main>
      </div>
    </Tabs>
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
              <h3 className="font-semibold text-base flex items-center gap-2">
                Gemini Live Session
                {isConnected && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Connected" />}
                {isConnecting && <span className="text-xs text-muted-foreground animate-pulse">Connecting...</span>}
              </h3>
              <p className="text-xs text-muted-foreground">
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
      <Card className="h-[350px] flex flex-col">
        <CardHeader className="py-2 px-4 border-b">
          <CardTitle className="text-xs flex items-center gap-2">
            <MessageCircle className="h-3 w-3" />
            Live Event Stream - {patient.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-[270px] px-3 pb-3">
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

function HealthPanel({ patient, onUpdate }: { patient: Patient, onUpdate: (updates: Partial<Patient>) => void }) {
  const [isEditVitalsOpen, setIsEditVitalsOpen] = useState(false);
  const [tempVitals, setTempVitals] = useState(patient.vitals || []);

  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [medName, setMedName] = useState("");
  const [medTime, setMedTime] = useState("");

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskTime, setTaskTime] = useState("");

  const data = {
    vitals: patient.vitals || [],
    medications: patient.medications || [],
    schedule: patient.schedule || [],
    sleep: patient.sleepData || [0, 0, 0, 0, 0, 0, 0]
  };

  const handleSaveVitals = () => {
    onUpdate({ vitals: tempVitals });
    setIsEditVitalsOpen(false);
  };

  const handleAddMed = () => {
    if (!medName || !medTime) return;
    const colors = ["bg-emerald-50", "bg-blue-50", "bg-amber-50", "bg-rose-50"];
    const texts = ["text-emerald-700", "text-blue-700", "text-amber-700", "text-rose-700"];
    const idx = data.medications.length % colors.length;
    
    const newMed: Medication = {
      name: medName,
      time: medTime,
      color: colors[idx],
      text: texts[idx]
    };
    onUpdate({ medications: [...data.medications, newMed] });
    setIsAddMedOpen(false);
    setMedName("");
    setMedTime("");
  };

  const handleAddTask = () => {
    if (!taskName || !taskTime) return;
    const newTask: ScheduleItem = {
      task: taskName,
      time: taskTime,
      done: false
    };
    onUpdate({ schedule: [...data.schedule, newTask] });
    setIsAddTaskOpen(false);
    setTaskName("");
    setTaskTime("");
  };

  const deleteMed = (index: number) => {
    onUpdate({ medications: data.medications.filter((_, i) => i !== index) });
  };

  const deleteTask = (index: number) => {
    onUpdate({ schedule: data.schedule.filter((_, i) => i !== index) });
  };

  const toggleTask = (index: number) => {
    const next = [...data.schedule];
    next[index] = { ...next[index], done: !next[index].done };
    onUpdate({ schedule: next });
  };

  const updateVitalValue = (index: number, value: string) => {
    const next = [...tempVitals];
    next[index] = { ...next[index], value };
    setTempVitals(next);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            Live Vitals
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            setTempVitals(patient.vitals || []);
            setIsEditVitalsOpen(true);
          }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {data.vitals.length > 0 ? data.vitals.map((v, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{v.label}</span>
              <span className={`font-bold ${v.color || 'text-slate-900'}`}>{v.value}</span>
            </div>
          )) : (
            <p className="text-xs text-muted-foreground italic">No vital signs recorded.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditVitalsOpen} onOpenChange={setIsEditVitalsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Health Vitals</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {tempVitals.map((v, i) => (
              <div key={i} className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">{v.label}</Label>
                <Input 
                  className="col-span-3 h-8" 
                  value={v.value} 
                  onChange={(e) => updateVitalValue(i, e.target.value)}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditVitalsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveVitals} className="bg-emerald-600">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Medications
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => setIsAddMedOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {data.medications.length > 0 ? data.medications.map((m, i) => (
            <div key={i} className={`p-2.5 rounded-xl ${m.color} dark:bg-opacity-20 flex items-center justify-between group cursor-default transition-all hover:scale-[1.01]`}>
              <span className={`text-xs font-bold ${m.text}`}>{m.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-black/20 border-none font-medium text-muted-foreground">{m.time}</Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500" onClick={() => deleteMed(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )) : (
            <p className="text-xs text-muted-foreground italic text-center py-2">No medications listed.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddMedOpen} onOpenChange={setIsAddMedOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs">Medication Name</Label>
              <Input value={medName} onChange={e => setMedName(e.target.value)} placeholder="e.g. Aspirin 81mg" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Dosage Time</Label>
              <Input value={medTime} onChange={e => setMedTime(e.target.value)} placeholder="e.g. 9:00 AM" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMedOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMed} className="bg-emerald-600">Add Medication</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            Care Schedule
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => setIsAddTaskOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.schedule.length > 0 ? data.schedule.slice(0, 6).map((s, i) => (
            <div key={i} className="flex items-center gap-3 group relative pr-8">
              <button onClick={() => toggleTask(i)} className="focus:outline-none">
                {s.done ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-slate-200 dark:border-slate-800" />
                )}
              </button>
              <div className="flex-1 flex flex-col">
                <span className={`text-xs font-semibold ${s.done ? 'line-through text-muted-foreground' : 'text-slate-900 dark:text-slate-100'}`}>
                  {s.task}
                </span>
                <span className="text-[10px] text-muted-foreground">{s.time}</span>
              </div>
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-8 w-8 opacity-0 group-hover:opacity-100 text-red-500" onClick={() => deleteTask(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )) : (
            <p className="text-xs text-muted-foreground italic text-center py-2">No tasks scheduled.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs">Task Description</Label>
              <Input value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="e.g. Afternoon walk" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Time</Label>
              <Input value={taskTime} onChange={e => setTaskTime(e.target.value)} placeholder="e.g. 3:00 PM" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTask} className="bg-emerald-600">Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="md:col-span-2 lg:col-span-3 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Sleep Intensity (Last 7 Days)</CardTitle>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5">
               <div className="h-2 w-2 rounded-full bg-emerald-500" />
               <span className="text-[10px] text-muted-foreground">Normal Sleep</span>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-28 pt-4">
            {data.sleep.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all group-hover:from-emerald-500 group-hover:to-emerald-300 relative"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {value}%
                  </div>
                </motion.div>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
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

function CareTeamPanel({ patient, onUpdate }: { patient: Patient, onUpdate: (updates: Partial<Patient>) => void }) {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newRelation, setNewRelation] = useState("");

  const caregivers = patient.careTeam || [];

  const handleAddMember = () => {
    if (!newName || !newRole) return;
    const newMember: CareTeamMember = {
      name: newName,
      role: newRole,
      relation: newRelation || "Staff",
      avatar: `https://images.unsplash.com/photo-${Math.floor(Math.random()*100000)}?w=100&h=100&fit=crop&crop=face`
    };
    onUpdate({ careTeam: [...caregivers, newMember] });
    setIsAddMemberOpen(false);
    setNewName("");
    setNewRole("");
    setNewRelation("");
  };

  const removeMember = (index: number) => {
    const next = caregivers.filter((_, i) => i !== index);
    onUpdate({ careTeam: next });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Care Team for {patient.name}
          </CardTitle>
          <Button onClick={() => setIsAddMemberOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {caregivers.map((caregiver, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-lg border bg-card group relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={caregiver.avatar} />
                  <AvatarFallback>{caregiver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{caregiver.name}</p>
                  <p className="text-sm text-muted-foreground">{caregiver.role}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{caregiver.relation}</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-8 w-8 text-red-500"
                  onClick={() => removeMember(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid gap-2">
                <Label htmlFor="c-name">Name</Label>
                <Input id="c-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Dr. Jane Smith" />
             </div>
             <div className="grid gap-2">
                <Label htmlFor="c-role">Role</Label>
                <Input id="c-role" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="e.g. Neurologist" />
             </div>
             <div className="grid gap-2">
                <Label htmlFor="c-rel">Relation</Label>
                <Input id="c-rel" value={newRelation} onChange={e => setNewRelation(e.target.value)} placeholder="e.g. Physician" />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} className="bg-emerald-600">Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

// ============================================
// STORIES PANEL COMPONENT
// ============================================

function StoriesPanel({ 
  patient, 
  memories, 
  onAdd, 
  onDelete, 
  onUpdate 
}: { 
  patient: Patient; 
  memories: Memory[];
  onAdd: (patientId: string, memory: Omit<Memory, 'id' | 'date'>) => void;
  onDelete: (patientId: string, memoryId: string) => void;
  onUpdate: (patientId: string, memory: Memory) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Memory Form State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("Reminiscence");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onAdd(patient.id, {
        title: file.name.replace(/\.[^/.]+$/, ""),
        content,
        type: "Document"
      });
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleAdd = () => {
    if (!newTitle || !newContent) return;
    onAdd(patient.id, { title: newTitle, content: newContent, type: newType });
    setNewTitle("");
    setNewContent("");
    setIsAddModalOpen(false);
  };

  const handleUpdate = () => {
    if (!editingMemory) return;
    onUpdate(patient.id, editingMemory);
    setEditingMemory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent inline-block">Memory Library</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Brain className="h-3.5 w-3.5 text-emerald-500" />
            Context files used by AI for personalized conversations with {patient.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <input 
             type="file" 
             className="hidden" 
             ref={fileInputRef} 
             onChange={handleFileUpload}
             accept=".txt,.md"
           />
           <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
             <DialogTrigger asChild>
               <Button variant="outline" size="sm" className="hidden sm:flex border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                 <Plus className="h-4 w-4 mr-2" />
                 Create Note
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Add New Memory</DialogTitle>
                 <DialogDescription>Enter a story or fact about {patient.name} for the AI to remember.</DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid gap-2">
                   <Label htmlFor="title">Title</Label>
                   <Input id="title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Favorite Music" />
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="type">Type</Label>
                   <select 
                     id="type" 
                     className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                     value={newType}
                     onChange={e => setNewType(e.target.value)}
                   >
                     <option>Reminiscence</option>
                     <option>Professional</option>
                     <option>Medical</option>
                     <option>Family</option>
                     <option>Preference</option>
                   </select>
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="content">Story Details</Label>
                   <Textarea id="content" value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Provide detailed context..." className="h-32" />
                 </div>
               </div>
               <DialogFooter>
                 <Button onClick={handleAdd} className="bg-emerald-600">Save Memory</Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>

           <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all">
             <Upload className={`h-4 w-4 mr-2 ${isUploading ? 'animate-bounce' : ''}`} />
             {isUploading ? "Reading..." : "Upload Story"}
           </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Upload Placeholder */}
        <Card 
          onClick={() => fileInputRef.current?.click()}
          className="border-dashed border-2 hover:border-emerald-500/50 hover:bg-emerald-50/10 transition-all cursor-pointer group flex flex-col items-center justify-center p-8 text-center h-[220px]"
        >
          <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
            <Plus className="h-7 w-7 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-sm">Add New Memory</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-[180px]">Upload TXT or Markdown files about the patient</p>
        </Card>

        {memories.map(story => (
          <Card key={story.id} className="group hover:shadow-lg transition-all border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[220px]">
             <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
               <div className="space-y-1 text-left">
                 <Badge variant="secondary" className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-none px-1.5 h-4 uppercase">
                   {story.type}
                 </Badge>
                 <CardTitle className="text-base font-bold line-clamp-1">{story.title}</CardTitle>
               </div>
               <div className="flex gap-1 -mt-1 -mr-2">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                   onClick={() => setEditingMemory(story)}
                 >
                   <Pencil className="h-3.5 w-3.5" />
                 </Button>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 text-muted-foreground hover:text-red-500"
                   onClick={() => onDelete(patient.id, story.id)}
                 >
                   <Trash2 className="h-3.5 w-3.5" />
                 </Button>
               </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col text-left overflow-hidden">
              <ScrollArea className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {story.content}
                </p>
              </ScrollArea>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-4 pt-3 border-t bg-white dark:bg-slate-950">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {story.date}
                </span>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                   Active Context
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingMemory} onOpenChange={open => !open && setEditingMemory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid gap-2">
               <Label htmlFor="edit-title">Title</Label>
               <Input 
                 id="edit-title" 
                 value={editingMemory?.title || ""} 
                 onChange={e => setEditingMemory(prev => prev ? {...prev, title: e.target.value} : null)} 
               />
             </div>
             <div className="grid gap-2">
               <Label htmlFor="edit-content">Content</Label>
               <Textarea 
                 id="edit-content" 
                 value={editingMemory?.content || ""} 
                 onChange={e => setEditingMemory(prev => prev ? {...prev, content: e.target.value} : null)} 
                 className="h-48"
               />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMemory(null)}>Cancel</Button>
            <Button onClick={handleUpdate} className="bg-emerald-600">Update Story</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
