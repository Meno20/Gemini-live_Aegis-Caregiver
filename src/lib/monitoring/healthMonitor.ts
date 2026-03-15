/**
 * Aegis Caregiver - Health Monitoring System
 * Tracks meals, hydration, medication compliance
 */

// Types
export interface MealEntry {
  timestamp: Date;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  consumed: 'full' | 'partial' | 'minimal' | 'unknown';
  notes?: string;
}

export interface HydrationEntry {
  timestamp: Date;
  amount: string;
  type: 'water' | 'juice' | 'tea' | 'other';
}

export interface MedicationEntry {
  timestamp: Date;
  name: string;
  taken: boolean;
  refused?: boolean;
  notes?: string;
}

export interface HealthStatus {
  lastMealTime: Date | null;
  lastDrinkTime: Date | null;
  hoursSinceMeal: number;
  hoursSinceDrink: number;
  mealCompliance: number;
  hydrationCompliance: number;
  medicationCompliance: number;
}

export class HealthMonitor {
  private patient: { id: string; name: string; preferredName: string };
  private lastMealTime: Date | null = null;
  private lastDrinkTime: Date | null = null;
  private lastMedicationTime: Date | null = null;
  
  private mealLog: MealEntry[] = [];
  private hydrationLog: HydrationEntry[] = [];
  private medicationLog: MedicationEntry[] = [];
  
  private medicationSchedule: Array<{
    name: string;
    dosage: string;
    time: string;
    taken: boolean;
    takenAt?: Date;
  }>;

  constructor(patient: { id: string; name: string; preferredName: string; medications?: Array<{ name: string; dosage: string; schedule: string }> }) {
    this.patient = patient;
    
    // Initialize medication schedule
    this.medicationSchedule = (patient.medications || [
      { name: 'Donepezil', dosage: '10mg', time: '08:00' },
      { name: 'Lisinopril', dosage: '5mg', time: '08:00' },
      { name: 'Melatonin', dosage: '3mg', time: '21:00' }
    ]).map(med => ({
      name: med.name,
      dosage: med.dosage,
      time: med.schedule || '08:00',
      taken: false
    }));
  }

  // Record a meal
  recordMeal(entry: Partial<MealEntry>): MealEntry {
    const meal: MealEntry = {
      timestamp: entry.timestamp || new Date(),
      type: entry.type || 'meal',
      consumed: entry.consumed || 'unknown',
      notes: entry.notes
    };

    this.mealLog.push(meal);
    this.lastMealTime = meal.timestamp;

    console.log(`[HealthMonitor] Meal recorded:`, meal);
    return meal;
  }

  // Record hydration
  recordHydration(entry: Partial<HydrationEntry>): HydrationEntry {
    const hydration: HydrationEntry = {
      timestamp: entry.timestamp || new Date(),
      amount: entry.amount || 'unknown',
      type: entry.type || 'water'
    };

    this.hydrationLog.push(hydration);
    this.lastDrinkTime = hydration.timestamp;

    console.log(`[HealthMonitor] Hydration recorded:`, hydration);
    return hydration;
  }

  // Record medication
  recordMedication(name: string, taken: boolean, notes?: string): MedicationEntry {
    const entry: MedicationEntry = {
      timestamp: new Date(),
      name,
      taken,
      refused: !taken,
      notes
    };

    this.medicationLog.push(entry);
    
    if (taken) {
      this.lastMedicationTime = entry.timestamp;
    }

    // Update schedule
    const scheduled = this.medicationSchedule.find(m => m.name === name);
    if (scheduled) {
      scheduled.taken = taken;
      scheduled.takenAt = entry.timestamp;
    }

    console.log(`[HealthMonitor] Medication ${taken ? 'taken' : 'refused'}:`, name);
    return entry;
  }

  // Check meal status
  checkMealStatus(): {
    alert: boolean;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    hoursSinceLastMeal: number;
    message: string;
    recommendation: string;
  } {
    const hoursSinceLastMeal = this.lastMealTime
      ? (Date.now() - this.lastMealTime.getTime()) / (1000 * 60 * 60)
      : 24; // Default to 24 if unknown

    const alertThreshold = 6; // Alert if more than 6 hours

    if (hoursSinceLastMeal >= alertThreshold) {
      return {
        alert: true,
        severity: hoursSinceLastMeal >= 8 ? 'HIGH' : 'MEDIUM',
        hoursSinceLastMeal: Math.floor(hoursSinceLastMeal),
        message: `${this.patient.preferredName} hasn't eaten in ${Math.floor(hoursSinceLastMeal)} hours`,
        recommendation: 'Offer favorite foods or meal assistance'
      };
    }

    return {
      alert: false,
      severity: 'LOW',
      hoursSinceLastMeal: Math.floor(hoursSinceLastMeal),
      message: 'Meal status OK',
      recommendation: 'Continue regular meal schedule'
    };
  }

  // Check hydration status
  checkHydrationStatus(): {
    alert: boolean;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    hoursSinceLastDrink: number;
    message: string;
    recommendation: string;
    dehydrationRisk: boolean;
  } {
    const hoursSinceLastDrink = this.lastDrinkTime
      ? (Date.now() - this.lastDrinkTime.getTime()) / (1000 * 60 * 60)
      : 12;

    const alertThreshold = 4;

    if (hoursSinceLastDrink >= alertThreshold) {
      return {
        alert: true,
        severity: hoursSinceLastDrink >= 6 ? 'HIGH' : 'MEDIUM',
        hoursSinceLastDrink: Math.floor(hoursSinceLastDrink),
        message: `${this.patient.preferredName} hasn't had fluids in ${Math.floor(hoursSinceLastDrink)} hours`,
        recommendation: 'Offer water, juice, or tea immediately',
        dehydrationRisk: hoursSinceLastDrink >= 6
      };
    }

    return {
      alert: false,
      severity: 'LOW',
      hoursSinceLastDrink: Math.floor(hoursSinceLastDrink),
      message: 'Hydration status OK',
      recommendation: 'Continue regular fluid intake',
      dehydrationRisk: false
    };
  }

  // Check medication compliance
  checkMedicationCompliance(): {
    alerts: Array<{
      medication: string;
      scheduledTime: string;
      minutesOverdue: number;
      severity: 'MEDIUM' | 'HIGH';
      message: string;
    }>;
    complianceRate: number;
  } {
    const alerts: Array<{
      medication: string;
      scheduledTime: string;
      minutesOverdue: number;
      severity: 'MEDIUM' | 'HIGH';
      message: string;
    }> = [];

    const now = new Date();

    for (const med of this.medicationSchedule) {
      if (med.taken) continue;

      const [hour, minute] = med.time.split(':').map(Number);
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);

      const minutesOverdue = (now.getTime() - scheduledTime.getTime()) / (1000 * 60);

      if (minutesOverdue > 30) {
        alerts.push({
          medication: med.name,
          scheduledTime: med.time,
          minutesOverdue: Math.floor(minutesOverdue),
          severity: minutesOverdue > 120 ? 'HIGH' : 'MEDIUM',
          message: `${med.name} is ${Math.floor(minutesOverdue)} minutes overdue`
        });
      }
    }

    return {
      alerts,
      complianceRate: this.calculateComplianceRate()
    };
  }

  private calculateComplianceRate(): number {
    const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const taken = this.medicationLog.filter(
      log => log.timestamp.getTime() >= last7Days && log.taken
    ).length;
    
    const total = this.medicationLog.filter(
      log => log.timestamp.getTime() >= last7Days
    ).length;

    return total > 0 ? Math.round((taken / total) * 100) : 100;
  }

  // Get daily summary
  getDailySummary(): {
    date: string;
    meals: { count: number; lastMeal: string; hoursSinceLastMeal: number };
    hydration: { count: number; lastDrink: string; hoursSinceLastDrink: number };
    medications: { taken: number; missed: number; complianceRate: number };
    alerts: {
      meal: ReturnType<HealthMonitor['checkMealStatus']>;
      hydration: ReturnType<HealthMonitor['checkHydrationStatus']>;
      medications: ReturnType<HealthMonitor['checkMedicationCompliance']>;
    };
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysMeals = this.mealLog.filter(m => m.timestamp >= today);
    const todaysHydration = this.hydrationLog.filter(h => h.timestamp >= today);
    const todaysMeds = this.medicationLog.filter(m => m.timestamp >= today);

    return {
      date: today.toLocaleDateString(),
      meals: {
        count: todaysMeals.length,
        lastMeal: this.lastMealTime ? this.lastMealTime.toLocaleTimeString() : 'None recorded',
        hoursSinceLastMeal: this.checkMealStatus().hoursSinceLastMeal
      },
      hydration: {
        count: todaysHydration.length,
        lastDrink: this.lastDrinkTime ? this.lastDrinkTime.toLocaleTimeString() : 'None recorded',
        hoursSinceLastDrink: this.checkHydrationStatus().hoursSinceLastDrink
      },
      medications: {
        taken: todaysMeds.filter(m => m.taken).length,
        missed: todaysMeds.filter(m => !m.taken).length,
        complianceRate: this.calculateComplianceRate()
      },
      alerts: {
        meal: this.checkMealStatus(),
        hydration: this.checkHydrationStatus(),
        medications: this.checkMedicationCompliance()
      }
    };
  }

  // Get current health status
  getHealthStatus(): HealthStatus {
    return {
      lastMealTime: this.lastMealTime,
      lastDrinkTime: this.lastDrinkTime,
      hoursSinceMeal: this.checkMealStatus().hoursSinceLastMeal,
      hoursSinceDrink: this.checkHydrationStatus().hoursSinceLastDrink,
      mealCompliance: this.mealLog.length > 0 ? 
        (this.mealLog.filter(m => m.consumed === 'full' || m.consumed === 'partial').length / this.mealLog.length) * 100 : 100,
      hydrationCompliance: this.hydrationLog.length >= 6 ? 100 : (this.hydrationLog.length / 6) * 100,
      medicationCompliance: this.calculateComplianceRate()
    };
  }

  // Get last meal time
  getLastMealTime(): Date | null {
    return this.lastMealTime;
  }

  // Get last drink time
  getLastDrinkTime(): Date | null {
    return this.lastDrinkTime;
  }

  // Get weekly summary
  getWeeklySummary(): {
    mealsPerDay: number;
    hydrationPerDay: number;
    medicationCompliance: number;
    trends: { nutritionTrend: string; alert: string | null };
  } {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const mealsPerDay = this.mealLog.filter(m => m.timestamp.getTime() >= weekAgo).length / 7;
    const hydrationPerDay = this.hydrationLog.filter(h => h.timestamp.getTime() >= weekAgo).length / 7;

    // Simple trend analysis
    const midpoint = weekAgo + (Date.now() - weekAgo) / 2;
    const firstHalfMeals = this.mealLog.filter(m => m.timestamp.getTime() < midpoint).length;
    const secondHalfMeals = this.mealLog.filter(m => m.timestamp.getTime() >= midpoint).length;

    const nutritionTrend = secondHalfMeals > firstHalfMeals * 1.2 ? 'improving' :
                          secondHalfMeals < firstHalfMeals * 0.8 ? 'declining' : 'stable';

    return {
      mealsPerDay,
      hydrationPerDay,
      medicationCompliance: this.calculateComplianceRate(),
      trends: {
        nutritionTrend,
        alert: nutritionTrend === 'declining' ? 'Patient eating less than earlier in week' : null
      }
    };
  }

  // Reset daily schedule (call at midnight)
  resetDailySchedule(): void {
    this.medicationSchedule.forEach(med => {
      med.taken = false;
      med.takenAt = undefined;
    });
  }
}
