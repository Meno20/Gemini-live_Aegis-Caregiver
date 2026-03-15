"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Sun,
  Moon,
  Clock,
  Lightbulb,
  Activity
} from "lucide-react";

interface BehavioralInsightsProps {
  patientId: string;
}

const hourlyMoodData = [
  { hour: "6AM", mood: 85, agitation: 10 },
  { hour: "8AM", mood: 90, agitation: 5 },
  { hour: "10AM", mood: 88, agitation: 8 },
  { hour: "12PM", mood: 75, agitation: 20 },
  { hour: "2PM", mood: 70, agitation: 25 },
  { hour: "4PM", mood: 65, agitation: 35 },
  { hour: "6PM", mood: 72, agitation: 28 },
  { hour: "8PM", mood: 80, agitation: 15 },
];

const weeklyPatterns = [
  { day: "Mon", sundowning: 20, wandering: 15, agitation: 30 },
  { day: "Tue", sundowning: 25, wandering: 10, agitation: 25 },
  { day: "Wed", sundowning: 15, wandering: 20, agitation: 35 },
  { day: "Thu", sundowning: 30, wandering: 25, agitation: 40 },
  { day: "Fri", sundowning: 20, wandering: 15, agitation: 20 },
  { day: "Sat", sundowning: 18, wandering: 12, agitation: 22 },
  { day: "Sun", sundowning: 22, wandering: 18, agitation: 28 },
];

const triggerData = [
  { name: "Fatigue", value: 35, color: "#f59e0b" },
  { name: "Hunger", value: 25, color: "#10b981" },
  { name: "Noise", value: 20, color: "#3b82f6" },
  { name: "Discomfort", value: 12, color: "#8b5cf6" },
  { name: "Other", value: 8, color: "#6b7280" },
];

const interventions = [
  { trigger: "Sundowning", intervention: "Light therapy + calming music", effectiveness: 85 },
  { trigger: "Wandering", intervention: "Redirection + memory game", effectiveness: 90 },
  { trigger: "Agitation", intervention: "Reminiscence therapy", effectiveness: 78 },
  { trigger: "Repetitive questions", intervention: "Memory prosthetic AI", effectiveness: 92 },
];

export function BehavioralInsights({ patientId }: BehavioralInsightsProps) {
  return (
    <div className="space-y-4">
      {/* AI Insights Banner */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:border-purple-800 dark:from-purple-950/30 dark:to-blue-950/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-white">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Pattern Detection</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Detected increased agitation patterns between 2-5 PM, suggesting early sundowning behavior. 
                Recommended intervention: Light therapy and calm activities during this period.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Mood Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Today&apos;s Mood & Agitation Levels
          </CardTitle>
          <CardDescription>Real-time behavioral tracking throughout the day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyMoodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: "#10b981" }}
                  name="Mood Score"
                />
                <Line 
                  type="monotone" 
                  dataKey="agitation" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b" }}
                  name="Agitation Level"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground">Mood Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-sm text-muted-foreground">Agitation Level</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Patterns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Weekly Behavioral Patterns
            </CardTitle>
            <CardDescription>Behavioral events tracked over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPatterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="sundowning" fill="#f59e0b" name="Sundowning" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="wandering" fill="#3b82f6" name="Wandering" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="agitation" fill="#ef4444" name="Agitation" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Identified Triggers
            </CardTitle>
            <CardDescription>Common causes of behavioral changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={triggerData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {triggerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {triggerData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intervention Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Intervention Effectiveness
          </CardTitle>
          <CardDescription>AI-recommended strategies based on historical data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interventions.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32">
                  <Badge variant="outline" className="w-full justify-center">
                    {item.trigger}
                  </Badge>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{item.intervention}</p>
                  <Progress value={item.effectiveness} className="h-2" />
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-bold text-emerald-600">{item.effectiveness}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sundowning Detection */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            Sundowning Watch
          </CardTitle>
          <CardDescription>Early detection and prevention of late-day confusion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Peak Risk Time</p>
                <p className="text-lg font-bold">2:00 - 5:00 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">This Week</p>
                <p className="text-lg font-bold">-15% incidents</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Moon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Recommended</p>
                <p className="text-lg font-bold">Light Therapy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
