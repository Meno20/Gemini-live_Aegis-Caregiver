"use client";

import { TrendingUp, Brain, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Patient } from "@/types/dashboard";

interface InsightsPanelProps {
  patient: Patient;
  conversationCount: number;
}

export function InsightsPanel({ patient, conversationCount }: InsightsPanelProps) {
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
