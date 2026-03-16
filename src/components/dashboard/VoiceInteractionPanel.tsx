"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, MessageCircle, Mic, MicOff, Volume2, VolumeX, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGeminiLive } from "@/hooks/use-gemini-live";
import { Patient, Message } from "@/types/dashboard";

interface VoiceInteractionPanelProps {
  patient: Patient;
  conversation: Message[];
  addMessage: (patientId: string, message: Message) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function VoiceInteractionPanel({
  patient,
  conversation,
  addMessage,
  isMuted,
  onToggleMute,
}: VoiceInteractionPanelProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    connect, 
    disconnect, 
    sendText, 
    startRecording, 
    stopRecording, 
    isConnected, 
    isConnecting, 
    isRecording,
    messages, 
    clearMessages 
  } = useGeminiLive();

  const hasConnectedRef = useRef(false);

  // Auto-connect when changing patients
  useEffect(() => {
    disconnect();
    clearMessages();
    hasConnectedRef.current = false;
    
    const timer = setTimeout(() => {
      if (!hasConnectedRef.current) {
        hasConnectedRef.current = true;
        connect(patient.id, 'patient-voice');
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      disconnect();
    };
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
