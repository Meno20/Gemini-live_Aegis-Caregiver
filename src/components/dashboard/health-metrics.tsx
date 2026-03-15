"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Droplets, 
  Coffee, 
  Pill, 
  Moon, 
  Activity,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar
} from "lucide-react";

interface HealthMetricsProps {
  patientId: string;
}

const weeklyData = [
  { day: "Mon", hydration: 80, meals: 3, sleep: 7.5, mood: "good" },
  { day: "Tue", hydration: 75, meals: 3, sleep: 8, mood: "calm" },
  { day: "Wed", hydration: 85, meals: 3, sleep: 6.5, mood: "good" },
  { day: "Thu", hydration: 70, meals: 2, sleep: 7, mood: "agitated" },
  { day: "Fri", hydration: 90, meals: 3, sleep: 8, mood: "good" },
  { day: "Sat", hydration: 85, meals: 3, sleep: 7.5, mood: "calm" },
  { day: "Sun", hydration: 75, meals: 3, sleep: 7, mood: "good" },
];

const medications = [
  { name: "Donepezil", dosage: "10mg", frequency: "Once daily", time: "7:00 AM", status: "taken" },
  { name: "Memantine", dosage: "20mg", frequency: "Twice daily", time: "7:00 AM, 7:00 PM", status: "partial" },
  { name: "Vitamin D", dosage: "1000 IU", frequency: "Once daily", time: "12:00 PM", status: "pending" },
];

const meals = [
  { type: "Breakfast", time: "8:00 AM", consumed: "90%", items: ["Oatmeal", "Banana", "Tea"] },
  { type: "Lunch", time: "12:30 PM", consumed: "75%", items: ["Soup", "Sandwich", "Apple"] },
  { type: "Dinner", time: "6:00 PM", consumed: "Pending", items: ["To be served"] },
];

export function HealthMetrics({ patientId }: HealthMetricsProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Health Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Heart Rate", value: "72", unit: "bpm", icon: Heart, trend: "stable", color: "rose" },
              { label: "Blood Pressure", value: "120/80", unit: "mmHg", icon: Activity, trend: "stable", color: "blue" },
              { label: "Hydration", value: "75", unit: "%", icon: Droplets, trend: "up", color: "cyan" },
              { label: "Sleep Last Night", value: "7.5", unit: "hrs", icon: Moon, trend: "down", color: "purple" },
            ].map((metric) => (
              <Card key={metric.label}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className={`
                      flex h-10 w-10 items-center justify-center rounded-lg
                      ${metric.color === 'rose' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400' : ''}
                      ${metric.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : ''}
                      ${metric.color === 'cyan' ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400' : ''}
                      ${metric.color === 'purple' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400' : ''}
                    `}>
                      <metric.icon className="h-5 w-5" />
                    </div>
                    {metric.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                    {metric.trend === "down" && <TrendingDown className="h-4 w-4 text-amber-500" />}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{metric.value}</span>
                      <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weekly Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Weekly Health Summary
              </CardTitle>
              <CardDescription>Health trends over the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyData.map((day) => (
                  <div key={day.day} className="flex items-center gap-4">
                    <span className="w-10 text-sm font-medium">{day.day}</span>
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <Progress value={day.hydration} className="h-2 flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">{day.meals}/3 meals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">{day.sleep}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className={`h-4 w-4 ${day.mood === 'agitated' ? 'text-rose-500' : 'text-emerald-500'}`} />
                        <span className="text-sm capitalize">{day.mood}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-emerald-500" />
                    Medication Schedule
                  </CardTitle>
                  <CardDescription>Track and manage daily medications</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medications.map((med, index) => (
                  <div 
                    key={index}
                    className={`
                      flex items-center justify-between rounded-lg border p-4
                      ${med.status === 'taken' ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20' : ''}
                      ${med.status === 'partial' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20' : ''}
                      ${med.status === 'pending' ? 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        flex h-10 w-10 items-center justify-center rounded-full
                        ${med.status === 'taken' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : ''}
                        ${med.status === 'partial' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400' : ''}
                        ${med.status === 'pending' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : ''}
                      `}>
                        <Pill className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {med.dosage} • {med.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{med.time}</p>
                        <Badge variant="outline" className={`
                          ${med.status === 'taken' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700' : ''}
                          ${med.status === 'partial' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700' : ''}
                          ${med.status === 'pending' ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600' : ''}
                        `}>
                          {med.status === 'taken' && 'Taken'}
                          {med.status === 'partial' && 'Partial'}
                          {med.status === 'pending' && 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-amber-500" />
                Today&apos;s Nutrition
              </CardTitle>
              <CardDescription>Meal tracking and nutritional intake</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {meals.map((meal, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                          <Coffee className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{meal.type}</p>
                          <p className="text-sm text-muted-foreground">{meal.time}</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {meal.consumed} consumed
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {meal.items.map((item, i) => (
                        <Badge key={i} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sleep" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-purple-500" />
                Sleep Analysis
              </CardTitle>
              <CardDescription>Sleep patterns and quality tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">7.5</p>
                  <p className="text-sm text-muted-foreground">Hours Last Night</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">85%</p>
                  <p className="text-sm text-muted-foreground">Sleep Efficiency</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">2</p>
                  <p className="text-sm text-muted-foreground">Wake Episodes</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Sleep quality has improved 15% compared to last week. Recommended bedtime: 9:00 PM.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
