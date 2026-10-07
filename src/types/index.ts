export type PillarType = 'corpo' | 'mente' | 'alma';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'intense' | 'very_intense';

export type GoalDirection = 'cut' | 'maintain' | 'bulk';

export type BiologicalSex = 'male' | 'female';

export interface UserProfile {
  name: string;
  age: number;
  gender: BiologicalSex;
  height: number; // cm
  currentWeight: number; // kg
  targetWeight: number; // kg
  activityLevel: ActivityLevel;
  goalType: GoalDirection;
  updatedAt: string;
}

export interface WeightRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg
  tmb: number; // calculated TMB at that moment
  note?: string;
}

export interface Goal {
  id: string;
  pillar: PillarType;
  title: string;
  description?: string;
  current: number;
  target: number;
  unit: string;
  deadline: string; // YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  createdAt: string;
}

export interface HabitItem {
  id: string;
  pillar: PillarType;
  name: string;
  description: string;
  targetPerWeek?: number;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  habitsCompleted: Record<string, boolean>; // habitId -> true/false
  consumedAlcohol: boolean | null; // Sim / Não / null
  brokeDiet: boolean | null; // Sim / Não / null
  alcoholNotes?: string; // Detalhe / motivo do consumo de álcool (ex: "2 chopes com amigos")
  dietNotes?: string; // Detalhe / o que comeu fora do plano (ex: "Pizza com a família")
  journalNotes?: string;
  updatedAt?: string;
}

export interface StreakState {
  alcoholFreeDays: number;
  cleanDietDays: number;
  lastAlcoholDate: string | null;
  lastBrokeDietDate: string | null;
  generalStreak: number;
  lastRecordedDate: string | null;
}

/* ============================================================
   MENTE & ALMA (ESPIRITUAL) - PRÁTICAS, RITUAIS & ROTINA
   ============================================================ */
export type MindSoulPillar = 'mente' | 'alma';

export type RoutinePeriod = 'morning' | 'afternoon' | 'night' | 'anytime';

export interface MindSoulPractice {
  id: string;
  pillar: MindSoulPillar; // 'mente' (intelecto/estudo/foco) ou 'alma' (espiritual/oração/meditação)
  title: string; // ex: "30min de leitura diária", "Reza diária / oração"
  category: string; // "Leitura", "Oração & Fé", "Meditação & Mindfulness", "Estudo & Foco", "Escrita & Reflexão", "Silêncio & Desconexão", "Outro"
  targetDurationMinutes: number; // minutos planejados (ex: 30)
  period: RoutinePeriod; // momento da rotina: Manhã, Tarde, Noite, ou Livre
  description?: string; // detalhe ou intenção
  targetPerWeek: number; // frequência semanal (ex: 7 para diário)
  addToDailyRoutine: boolean; // se está atrelada à rotina / planner diário
  daysOfWeek?: number[]; // [0, 1, 2, 3, 4, 5, 6] onde 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb.
  createdAt: string;
}

export interface MindSoulExecution {
  completed: boolean;
  durationMinutes?: number; // minutos efetivamente realizados
  notes?: string; // reflexão, versículo, insight lido, intenção da oração
  completedAt?: string;
}

export interface DailyMindSoulLog {
  date: string; // YYYY-MM-DD
  practices: Record<string, MindSoulExecution>; // practiceId -> execution
  dailyReflection?: string; // Diário estoico ou reflexão espiritual do dia
}

/* ============================================================
   BANCO DE ALIMENTOS & PLANO NUTRICIONAL
   ============================================================ */
export interface FoodItem {
  id: string;
  name: string;
  servingSize: number; // ex: 100 (g) ou 1 (unidade)
  servingUnit: string; // "g", "ml", "unidade", "fatia"
  calories: number; // kcal para a porção de referência
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  category?: 'Proteínas' | 'Carboidratos' | 'Gorduras' | 'Vegetais & Frutas' | 'Laticínios & Suplementos';
  isCustom?: boolean;
}

export type MealType = string;

export interface MealDefinition {
  id: string;
  name: string;
  subtitle?: string;
  icon?: string;
  time?: string;
}

export interface MealFoodEntry {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number; // quantidade consumida (ex: 150g)
  unit: string;
  calculatedCalories: number;
  calculatedProtein: number;
  calculatedCarbs: number;
  calculatedFat: number;
}

export interface DailyMealPlan {
  date: string; // YYYY-MM-DD
  mealDefinitions?: MealDefinition[];
  meals: Record<string, MealFoodEntry[]>;
  waterConsumedMl?: number;
  notes?: string;
}

/* ============================================================
   PLANILHA DE TREINOS & REGISTRO DIÁRIO
   ============================================================ */
export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string; // ex: "8-10", "12", "Falha"
  load: number; // kg
  notes?: string;
}

export interface WorkoutDivision {
  id: string;
  name: string; // ex: "Treino A - Peitoral & Tríceps"
  letter: string; // "A", "B", "C", "D", "E"
  targetMuscles: string;
  description?: string;
  exercises: WorkoutExercise[];
}

export interface ExerciseSetEntry {
  setNumber: number;
  reps: number | string;
  load: number;
}

export interface DailyWorkoutLog {
  date: string; // YYYY-MM-DD
  divisionId: string;
  completed: boolean;
  completedExercises: Record<string, boolean>; // exerciseId -> boolean
  exerciseLoads: Record<string, number>; // exerciseId -> carga realizada hoje (kg)
  exerciseSets?: Record<string, ExerciseSetEntry[]>; // exerciseId -> séries dinâmicas registradas
  notes?: string;
}

/* ============================================================
   ANÁLISE QUINZENAL (14-DAY PERFORMANCE REVIEW)
   ============================================================ */
export interface FortnightStats {
  startDate: string;
  endDate: string;
  totalPlannedHabits: number;
  totalCompletedHabits: number;
  executionRate: number; // 0 - 100
  pillarExecution: {
    corpo: number; // 0 - 100
    mente: number; // 0 - 100
    alma: number; // 0 - 100
  };
  alcoholFreeRate: number;
  cleanDietRate: number;
  workoutsCompleted: number;
  totalWorkoutsPlanned: number;
  averageCaloriesConsumed: number;
  targetCalories: number;
  averageProteinConsumed: number;
  targetProtein: number;
  weightStart: number;
  weightEnd: number;
  weightDelta: number;
  tmbStart: number;
  tmbEnd: number;
  diagnostic: {
    dominantPillar: PillarType;
    growthAreaPillar: PillarType;
    disciplineGrade: string; // ex: 'HEAVY METAL DISCIPLINE (A+)', 'A', 'B'
    summary: string;
    actionDirectives: string[];
  };
}
