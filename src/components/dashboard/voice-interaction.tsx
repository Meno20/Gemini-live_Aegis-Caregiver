"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Mic, 
  MicOff, 
  Volume2,
  VolumeX,
  Send,
  Brain,
  Heart,
  Clock,
  MessageCircle,
  Sparkles,
  Loader2,
  AudioWaveform
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceInteractionProps {
  patient: {
    id: string;
    name: string;
    avatar: string;
  };
  isActive: boolean;
  isMuted: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  conversation: Message[];
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSendMessage: (message: string) => void;
  onToggleMute: () => void;
}

interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  emotion?: string;
}

const suggestedTopics = [
  { icon: Heart, label: "Family Memories", prompt: "Tell me about your family" },
  { icon: Clock, label: "Today's Schedule", prompt: "What's on my schedule today?" },
  { icon: Sparkles, label: "Happy Moments", prompt: "Share a happy memory" },
  { icon: MessageCircle, label: "How are you feeling?", prompt: "How am I feeling right now?" },
];

export function VoiceInteraction({ 
  patient, 
  isActive, 
  isMuted,
  isRecording,
  isProcessing,
  conversation,
  onStartRecording,
  onStopRecording,
  onSendMessage,
  onToggleMute
}: VoiceInteractionProps) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleSend = () => {
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleTopicClick = (prompt: string) => {
    setInputText(prompt);
  };

  const handleMicClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Companion Status */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                  <Brain className="h-7 w-7" />
                </div>
                {isActive && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">Memory Prosthetic AI</h3>
                <p className="text-sm text-muted-foreground">
                  {isActive ? "Active • Ready to assist" : "Click mic to start"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white dark:bg-slate-800">
                <Heart className="h-3 w-3 mr-1 text-rose-500" />
                Compassionate Mode
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Area - Patient Specific */}
      <Card className="h-[400px] flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              Conversation with {patient.name.split(' ')[0]}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {conversation.length} messages
            </Badge>
          </div>
          <CardDescription>Patient-specific AI companion - isolated conversation history</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {conversation.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 mb-4">
                    <Brain className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="font-medium">Start a conversation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the microphone or type a message to begin
                  </p>
                </div>
              )}
              <AnimatePresence>
                {conversation.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.type === "user" ? "justify-end" : ""}`}
                  >
                    {message.type === "ai" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                        <Brain className="h-4 w-4" />
                      </div>
                    )}
                    <div className={`
                      max-w-[80%] rounded-2xl px-4 py-2
                      ${message.type === "ai" 
                        ? "bg-slate-100 dark:bg-slate-800 rounded-tl-none" 
                        : "bg-emerald-500 text-white rounded-tr-none"}
                    `}>
                      <p className="text-sm">{message.content}</p>
                      {message.emotion && (
                        <Badge variant="outline" className="mt-2 text-xs bg-white/50 dark:bg-black/20">
                          {message.emotion} tone
                        </Badge>
                      )}
                    </div>
                    {message.type === "user" && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={patient.avatar} />
                        <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                      <Brain className="h-4 w-4" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Suggested Topics */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground mb-3">Suggested conversation starters:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedTopics.map((topic) => (
              <Button
                key={topic.label}
                variant="outline"
                size="sm"
                onClick={() => handleTopicClick(topic.prompt)}
                className="flex items-center gap-2"
              >
                <topic.icon className="h-4 w-4" />
                {topic.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice and Text Input */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4">
            {/* Voice Recording Section */}
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                className={`h-16 w-16 rounded-full ${!isRecording ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                onClick={handleMicClick}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <div className="flex flex-col items-center">
                    <AudioWaveform className="h-6 w-6 animate-pulse" />
                  </div>
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-12 rounded-full"
                onClick={onToggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>

            {isRecording && (
              <div className="flex items-center justify-center gap-2 text-red-500">
                <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">Listening... Speak now</span>
              </div>
            )}

            {/* Text Input Alternative */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={isProcessing || isRecording}
              />
              <Button size="icon" onClick={handleSend} disabled={!inputText.trim() || isProcessing || isRecording}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Capabilities */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Memory Support", description: "Answers repeated questions with patience", icon: Brain },
          { title: "Emotional Support", description: "Detects mood and adjusts responses", icon: Heart },
          { title: "Safety Alerts", description: "Monitors for wandering or distress", icon: MessageCircle },
        ].map((feature) => (
          <Card key={feature.title} className="text-center">
            <CardContent className="pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 mx-auto mb-3">
                <feature.icon className="h-5 w-5" />
              </div>
              <p className="font-medium text-sm">{feature.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
