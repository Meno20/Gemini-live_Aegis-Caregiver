/**
 * Aegis Caregiver - Health Monitoring System (Version 2)
 * Tracks meals, hydration, medication compliance with Firebase persistence.
 */

import { addMealLog, addMedicationLog, addHealthRecord, getRecentMealLogs, getMedicationAdherence } from '@/lib/db/index';
import { MealLog, MedicationLog, HealthRecord } from '@/lib/db/types';

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
  private patientId: string;
  private patientName: string;

  constructor(patientId: string, patientName: string) {
    this.patientId = patientId;
    this.patientName = patientName;
  }

  /**
   * Record a meal to the database
   */
  async recordMeal(data: {
    type: string;
    foodItems: string[];
    portionEaten: string;
    notes?: string;
  }): Promise<string> {
    const log: Omit<MealLog, 'id'> = {
      patientId: this.patientId,
      timestamp: new Date(),
      mealType: data.type,
      foodItems: data.foodItems,
      drinkItems: [],
      portionEaten: data.portionEaten,
      source: 'Aegis System',
      // fluidMl handled in hydration
    };

    console.log(`[HealthMonitor] Persisting meal for ${this.patientName}`);
    return await addMealLog(this.patientId, log);
  }

  /**
   * Record hydration to the database
   */
  async recordHydration(data: {
    amountMl: number;
    type: string;
  }): Promise<string> {
    const log: Omit<MealLog, 'id'> = {
      patientId: this.patientId,
      timestamp: new Date(),
      mealType: 'hydration',
      foodItems: [],
      drinkItems: [data.type],
      portionEaten: 'full',
      fluidMl: data.amountMl,
      source: 'Aegis System'
    };

    console.log(`[HealthMonitor] Persisting hydration for ${this.patientName}`);
    return await addMealLog(this.patientId, log);
  }

  /**
   * Record medication administration
   */
  async recordMedication(data: {
    medicationId: string;
    status: 'taken' | 'refused' | 'missed';
    notes?: string;
  }): Promise<string> {
    const log: Omit<MedicationLog, 'id'> = {
      patientId: this.patientId,
      medicationId: data.medicationId,
      scheduledTime: new Date(),
      takenTime: data.status === 'taken' ? new Date() : undefined,
      status: data.status,
      notes: data.notes
    };

    console.log(`[HealthMonitor] Persisting medication log for ${this.patientName}`);
    return await addMedicationLog(this.patientId, log);
  }

  /**
   * Perform health status check based on recent DB records
   */
  async checkHealthStatus(): Promise<HealthStatus> {
    // Fetch last 24 hours of logs
    const recentMeals = await getRecentMealLogs(this.patientId, 1);
    const adherence = await getMedicationAdherence(this.patientId, 7);

    const mealsOnly = recentMeals.filter(m => m.mealType !== 'hydration');
    const hydrationOnly = recentMeals.filter(m => m.mealType === 'hydration');

    const lastMeal = mealsOnly[0]?.timestamp || null;
    const lastDrink = hydrationOnly[0]?.timestamp || null;

    const now = new Date().getTime();
    const hoursSinceMeal = lastMeal ? (now - lastMeal.getTime()) / (1000 * 60 * 60) : 24;
    const hoursSinceDrink = lastDrink ? (now - lastDrink.getTime()) / (1000 * 60 * 60) : 12;

    return {
      lastMealTime: lastMeal,
      lastDrinkTime: lastDrink,
      hoursSinceMeal: Math.floor(hoursSinceMeal),
      hoursSinceDrink: Math.floor(hoursSinceDrink),
      mealCompliance: mealsOnly.length >= 3 ? 100 : (mealsOnly.length / 3) * 100,
      hydrationCompliance: hydrationOnly.length >= 6 ? 100 : (hydrationOnly.length / 6) * 100,
      medicationCompliance: adherence.percentage
    };
  }
}
