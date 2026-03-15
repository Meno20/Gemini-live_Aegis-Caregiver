"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Pill,
  Footprints,
  Heart,
  Bell
} from "lucide-react";

interface Alert {
  id: number;
  patient: string;
  type: string;
  severity: string;
  message: string;
  time: string;
  resolved: boolean;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const severityColors: Record<string, string> = {
  low: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50",
  medium: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30",
  high: "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/30",
  critical: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30",
};

const severityBadges: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

const typeIcons: Record<string, typeof AlertCircle> = {
  wandering: Footprints,
  medication: Pill,
  health: Heart,
  agitation: AlertTriangle,
  emergency: AlertCircle,
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-rose-500" />
            Smart Alerts
          </CardTitle>
          {activeAlerts.length > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {activeAlerts.length} Active
            </Badge>
          )}
        </div>
        <CardDescription>Real-time notifications and warnings</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {activeAlerts.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Active Alerts
                </p>
                {activeAlerts.map((alert) => {
                  const Icon = typeIcons[alert.type] || AlertCircle;
                  return (
                    <div 
                      key={alert.id}
                      className={`rounded-lg border p-3 ${severityColors[alert.severity]}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{alert.patient}</span>
                            <Badge variant="outline" className={`text-xs ${severityBadges[alert.severity]}`}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{alert.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="default" className="flex-1">
                          Take Action
                        </Button>
                        <Button size="sm" variant="outline">
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {resolvedAlerts.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase text-muted-foreground mt-4">
                  Recently Resolved
                </p>
                {resolvedAlerts.map((alert) => {
                  const Icon = typeIcons[alert.type] || AlertCircle;
                  return (
                    <div 
                      key={alert.id}
                      className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-muted-foreground">{alert.patient}</span>
                            <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700">
                              Resolved
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{alert.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {alerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="mt-3 font-medium">All Clear</p>
                <p className="text-sm text-muted-foreground">No active alerts at this time</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
