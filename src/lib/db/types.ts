// ============================================
// All types match your Prisma schema exactly
// Same data model, different storage engine
// ============================================

export interface Caregiver {
  id: string;          // Firebase Auth UID
  email: string;
  name: string;
  phone?: string;
  role: 'PRIMARY_CAREGIVER' | 'FAMILY_MEMBER' | 'PHYSICIAN' | 'NURSE' | 'AIDE' | 'ADMIN';
  isVerified: boolean;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: string;
  bloodType?: string;
  profileImage?: string;
  dementiaStage: 'EARLY' | 'EARLY_MODERATE' | 'MODERATE' | 'MODERATE_SEVERE' | 'SEVERE';
  diagnosisDate?: Date;
  address?: string;
  emergencyPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LifeStory {
  patientId: string;
  birthPlace?: string;
  childhoodMemories: string[];
  education?: string;
  career?: string;
  careerDetails?: string;
  retirementYear?: number;
  spouseName?: string;
  spouseStatus?: string;
  weddingDate?: Date;
  weddingMemory?: string;
  children: { name: string; birthYear: number; notes: string }[];
  grandchildren?: { name: string; age: number; notes: string }[];
  hobbies: string[];
  skills: string[];
  favoriteMusic: string[];
  favoriteSongs?: { title: string; artist: string; memory: string }[];
  favoriteMovies: string[];
  favoriteShows: string[];
  comfortingPhrases: string[];
  triggerPhrases: string[];
  repeatedQuestions: { question: string; bestResponse: string }[];
  religiousFaith?: string;
  culturalBackground?: string;
  updatedAt: Date;
}

export interface PatientPreferences {
  patientId: string;
  dietaryRestrictions: string[];
  allergies: string[];
  favoritesFoods: string[];
  dislikedFoods: string[];
  favoriteDrinks: string[];
  preferredMealTimes?: { breakfast: string; lunch: string; dinner: string };
  eatingDifficulties: string[];
  fluidGoalMl: number;
  preferredBedtime?: string;
  preferredWakeTime?: string;
  sleepAids: string[];
  nighttimeIssues: string[];
  preferredName?: string;
  communicationNotes?: string;
  hearingAid: boolean;
  glasses: boolean;
  preferredTvShows: string[];
  bathPreference?: string;
  continenceStatus?: string;
  toiletingSchedule?: string;
  updatedAt: Date;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  scheduledTimes: string[];
  pillDescription?: string;
  purpose?: string;
  prescribedBy?: string;
  instructions?: string;
  sideEffects: string[];
  interactions: string[];
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface CareTeamMember {
  id: string;
  patientId: string;
  name: string;
  role: string;
  specialty?: string;
  phone?: string;
  email?: string;
  facility?: string;
  schedule?: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  diagnoses: string[];
  weight?: number;
  height?: number;
  bloodPressure?: string;
  heartRate?: number;
  mmseScore?: number;
  mmseDate?: Date;
  cognitiveNotes?: string;
  mobilityStatus?: string;
  fallRiskScore?: number;
  fallHistory?: { date: string; description: string; injury: string }[];
  drugAllergies: string[];
  advanceDirective: boolean;
  powerOfAttorney?: string;
  recordDate: Date;
}

export interface BehavioralLog {
  id: string;
  patientId: string;
  timestamp: Date;
  agitationScore?: number;
  confusionScore?: number;
  moodScore?: number;
  anxietyScore?: number;
  activity?: string;
  location?: string;
  wanderingAttempt: boolean;
  fallEvent: boolean;
  agitationEvent: boolean;
  sundowningEvent: boolean;
  repeatedQuestion?: string;
  repetitionCount?: number;
  interventionUsed?: string;
  interventionSuccess?: boolean;
  bathroomVisits?: number;
  source: string;
  notes?: string;
}

export interface MealLog {
  id: string;
  patientId: string;
  timestamp: Date;
  mealType: string;
  foodItems: string[];
  drinkItems: string[];
  portionEaten: string;
  fluidMl?: number;
  source: string;
}

export interface MedicationLog {
  id: string;
  patientId: string;
  medicationId: string;
  scheduledTime: Date;
  takenTime?: Date;
  status: string;
  verifiedBy?: string;
  notes?: string;
}

export interface Alert {
  id: string;
  patientId: string;
  severity: 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  category: string;
  title: string;
  message: string;
  data?: any;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface DailySummary {
  id: string;
  patientId: string;
  date: Date;
  avgAgitation?: number;
  avgConfusion?: number;
  mealsEaten?: number;
  fluidIntakeMl?: number;
  medicationAdherence?: number;
  sleepHours?: number;
  fallEvents: number;
  wanderingEvents: number;
  patternAnalysis?: string;
  medicalFlags: string[];
  recommendations: string[];
  familyReport?: string;
  clinicalReport?: string;
  generatedAt: Date;
}
