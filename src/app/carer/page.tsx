"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Bell, Activity, Users, Brain, Heart,
  MessageCircle, Settings, Menu, X,
  Volume2, VolumeX, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Reusable Components
import { VoiceInteractionPanel } from "@/components/dashboard/VoiceInteractionPanel";
import { VisionMonitorPanel } from "@/components/dashboard/VisionMonitorPanel";
import { CameraGrid } from "@/components/video/camera-grid";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { HealthPanel } from "@/components/dashboard/HealthPanel";
import { CareTeamPanel } from "@/components/dashboard/CareTeamPanel";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";

// Types
import { Patient, Message, ConversationsMap, ViewType } from "@/types/dashboard";

import { patients } from "@/lib/constants";

const navItems = [
  { id: 'dashboard' as ViewType, icon: Activity, label: "Dashboard" },
  { id: 'insights' as ViewType, icon: Brain, label: "Insights" },
  { id: 'conversations' as ViewType, icon: MessageCircle, label: "Conversations" },
  { id: 'health' as ViewType, icon: Heart, label: "Health Records" },
  { id: 'careteam' as ViewType, icon: Users, label: "Care Team" },
  { id: 'settings' as ViewType, icon: Settings, label: "Settings" },
];

export default function CarerDashboard() {
  const [selectedPatient, setSelectedPatient] = useState<Patient>(patients[0]);
  const [isMuted, setIsMuted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");

  const [conversations, setConversations] = useState<ConversationsMap>(() => ({
    maggie: [],
    bill: [],
  }));

  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{ safetyLevel: string; concerns: string[]; patientState?: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentConversation = conversations[selectedPatient.id] || [];

  const addMessage = useCallback((patientId: string, message: Message) => {
    setConversations(prev => ({
      ...prev,
      [patientId]: [...(prev[patientId] || []), message]
    }));
  }, []);

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
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio(audioUrl);
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };

  const handlePatientSwitch = (patient: Patient) => {
    setSelectedPatient(patient);
    if (audioRef.current) audioRef.current.pause();
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const openPatientDashboard = () => {
    window.open(`/patient/${selectedPatient.id}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg dark:bg-slate-900/80">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Aegis Caregiver</h1>
                <p className="text-xs text-muted-foreground">Admin Portal</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={openPatientDashboard}
              className="hidden md:flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
            >
              <ExternalLink className="h-4 w-4" />
              Launch Patient UI
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4 text-emerald-500" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">2</span>
            </Button>
            <Avatar className="h-9 w-9 border-2 border-emerald-500">
              <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-white pt-20 transition-transform duration-300 dark:bg-slate-900 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase text-muted-foreground px-3">Patients</h2>
              {patients.map((patient) => (
                <motion.button
                  key={patient.id}
                  onClick={() => handlePatientSwitch(patient)}
                  className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-all ${selectedPatient.id === patient.id ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
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
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Button key={item.id} onClick={() => setCurrentView(item.id)} variant={currentView === item.id ? "secondary" : "ghost"} className={`w-full justify-start gap-3 ${currentView === item.id ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''}`}>
                  <item.icon className="h-4 w-4" /> {item.label}
                </Button>
              ))}
            </nav>
            <div className="pt-4 mt-auto">
              <Button
                variant="default"
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={openPatientDashboard}
              >
                <ExternalLink className="h-4 w-4" />
                Patient Dashboard
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-6 space-y-6 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-emerald-500 shadow-xl">
                <AvatarImage src={selectedPatient.avatar} />
                <AvatarFallback className="text-xl">{selectedPatient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>Age {selectedPatient.age}</span><span>•</span><span className="capitalize">{selectedPatient.dementiaStage} dementia</span><span>•</span><span>{selectedPatient.occupation}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="px-3 py-1 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 dark:border-emerald-800">
              <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Monitoring
            </Badge>
          </div>

          <AnimatePresence mode="wait">
            {currentView === "dashboard" && (
              <div key="dashboard" className="space-y-6">
                <Tabs defaultValue="voice" className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
                      <TabsTrigger value="voice">Voice AI</TabsTrigger>
                      <TabsTrigger value="health">Health</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3">
                      <Link
                        href="http://localhost:3001"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all shadow-md font-medium"
                      >
                        <Brain className="h-4 w-4" />
                        Enable Camera
                      </Link>
                      <Link
                        href="http://localhost:3002"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-black text-white px-4 py-2 rounded shadow-md hover:bg-gray-800"
                      >
                        Monitoring
                      </Link>
                    </div>
                  </div>
                  <TabsContent value="voice" className="space-y-4">
                    <VoiceInteractionPanel patient={selectedPatient} conversation={currentConversation} addMessage={addMessage} isMuted={isMuted} onToggleMute={() => setIsMuted(!isMuted)} />
                  </TabsContent>
                  <TabsContent value="health"><HealthPanel patient={selectedPatient} /></TabsContent>
                </Tabs>
              </div>
            )}
            {/* Other views similarly updated */}
            {currentView === "insights" && <motion.div key="insights" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><InsightsPanel patient={selectedPatient} conversationCount={currentConversation.length} /></motion.div>}
            {currentView === "conversations" && <motion.div key="conversations" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><VoiceInteractionPanel patient={selectedPatient} conversation={currentConversation} addMessage={addMessage} isMuted={isMuted} onToggleMute={() => setIsMuted(!isMuted)} /></motion.div>}
            {currentView === "health" && <motion.div key="health" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><HealthPanel patient={selectedPatient} /></motion.div>}
            {currentView === "careteam" && <motion.div key="careteam" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><CareTeamPanel patient={selectedPatient} /></motion.div>}
            {currentView === "settings" && <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><SettingsPanel isMuted={isMuted} onToggleMute={() => setIsMuted(!isMuted)} patient={selectedPatient} /></motion.div>}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
