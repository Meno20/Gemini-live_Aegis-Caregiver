"use client";

import { Volume2, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Patient } from "@/types/dashboard";

interface SettingsPanelProps {
  isMuted: boolean;
  onToggleMute: () => void;
  patient: Patient;
}

export function SettingsPanel({ 
  isMuted, 
  onToggleMute,
  patient 
}: SettingsPanelProps) {
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
