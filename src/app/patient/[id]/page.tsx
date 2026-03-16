"use client";

import { useState, useRef, useEffect, useCallback, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Volume2, VolumeX, Brain, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceInteractionPanel } from "@/components/dashboard/VoiceInteractionPanel";
import CameraViewer from "@/components/video/camera-viewer";
import { Patient, Message, ConversationsMap } from "@/types/dashboard";
import { patients } from "@/lib/constants";
import Link from "next/link";

export default function PatientDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const patient = patients.find(p => p.id === id);

  const [isMuted, setIsMuted] = useState(false);
  const [conversations, setConversations] = useState<ConversationsMap>(() => ({
    maggie: [],
    bill: [],
  }));

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addMessage = useCallback((message: Message) => {
    setConversations(prev => ({
      ...prev,
      [patient.id]: [...(prev[patient.id] || []), { ...message, id: Date.now().toString() }]
    }));
  }, [patient.id]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-rose-500 mx-auto" />
          <h1 className="text-2xl font-bold">Patient Not Found</h1>
          <p className="text-slate-400">The patient ID "{id}" does not exist in our records.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/carer">Return to Carer Portal</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentConversation = conversations[patient.id] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Aegis Patient Dashboard</h1>
              <p className="text-slate-400">Assisting {patient.name}</p>
            </div>
          </div>
          <Button
            size="lg"
            variant="ghost"
            className="rounded-full h-12 w-12 p-0"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="h-6 w-6 text-rose-500" /> : <Volume2 className="h-6 w-6 text-emerald-500" />}
          </Button>
        </div>

        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900 border-slate-800">
            <TabsTrigger value="voice" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white h-12 text-lg">
              Voice Assistant
            </TabsTrigger>
            <TabsTrigger value="vision" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white h-12 text-lg">
              Smart Vision
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="voice">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-6"
              >
                <VoiceInteractionPanel
                  patient={patient}
                  conversation={currentConversation}
                  addMessage={addMessage}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted(!isMuted)}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="vision">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-6"
              >
                <CameraViewer />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
