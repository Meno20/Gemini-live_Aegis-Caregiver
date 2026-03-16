"use client";

import { Heart, Activity, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/types/dashboard";

interface HealthPanelProps {
  patient: Patient;
}

export function HealthPanel({ patient }: HealthPanelProps) {
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
