"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Coffee, 
  Droplets, 
  Pill, 
  Moon, 
  Sun,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  dementiaStage: string;
  avatar: string;
  status: string;
  lastInteraction: string;
  mood: string;
  occupation: string;
  riskLevel: "low" | "medium" | "high";
}

interface PatientOverviewProps {
  patient: Patient;
}

const todaySchedule = [
  { time: "7:00 AM", activity: "Morning medication", status: "completed", icon: Pill },
  { time: "8:00 AM", activity: "Breakfast", status: "completed", icon: Coffee },
  { time: "10:00 AM", activity: "Morning walk", status: "completed", icon: Activity },
  { time: "12:00 PM", activity: "Lunch", status: "completed", icon: Coffee },
  { time: "2:00 PM", activity: "Afternoon rest", status: "in_progress", icon: Moon },
  { time: "5:00 PM", activity: "Evening medication", status: "pending", icon: Pill },
  { time: "6:00 PM", activity: "Dinner", status: "pending", icon: Coffee },
];

const healthMetrics = [
  { label: "Hydration", value: 75, color: "bg-blue-500", icon: Droplets },
  { label: "Nutrition", value: 85, color: "bg-emerald-500", icon: Coffee },
  { label: "Sleep Quality", value: 70, color: "bg-purple-500", icon: Moon },
  { label: "Activity", value: 90, color: "bg-amber-500", icon: Activity },
];

export function PatientOverview({ patient }: PatientOverviewProps) {
  return (
    <div className="space-y-4">
      {/* Real-time Status */}
      <Card className="overflow-hidden border-emerald-200 dark:border-emerald-900">
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              Real-time Status
            </CardTitle>
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/50">
              <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Location</span>
                <span className="font-medium">Living Room</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Activity</span>
                <span className="font-medium">Resting</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Movement</span>
                <span className="font-medium">3 min ago</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fall Risk</span>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                  Low
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exit Proximity</span>
                <span className="font-medium text-emerald-600">Safe Zone</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Agitation Level</span>
                <span className="font-medium text-emerald-600">Calm</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Today&apos;s Schedule
          </CardTitle>
          <CardDescription>Track daily activities and routines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {todaySchedule.map((item, index) => (
              <div 
                key={index}
                className={`
                  flex items-center gap-3 rounded-lg p-2 transition-colors
                  ${item.status === 'in_progress' ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                `}
              >
                <div className={`
                  flex h-8 w-8 items-center justify-center rounded-lg
                  ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : ''}
                  ${item.status === 'in_progress' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400' : ''}
                  ${item.status === 'pending' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : ''}
                `}>
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <item.icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${item.status === 'pending' ? 'text-muted-foreground' : ''}`}>
                    {item.activity}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
                {item.status === 'in_progress' && (
                  <Badge variant="outline" className="text-amber-600 border-amber-200">
                    Now
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Today&apos;s Health Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {healthMetrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <span className="text-sm font-bold">{metric.value}%</span>
              </div>
              <Progress value={metric.value} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
