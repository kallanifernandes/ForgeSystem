import {
  UserProfile,
  ActivityLevel,
  GoalDirection,
  DailyRecord,
  HabitItem,
  FortnightStats,
  PillarType,
  FoodItem,
  MealFoodEntry,
  DailyMealPlan,
  DailyWorkoutLog
} from '../types';

/**
 * Activity Level Multipliers
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { label: string; multiplier: number; description: string }> = {
  sedentary: {
    label: 'Sedentário',
    multiplier: 1.2,
    description: 'Pouco ou nenhum exercício físico programado',
  },
  light: {
    label: 'Levemente Ativo',
    multiplier: 1.375,
    description: 'Treinos leves 1 a 3 dias na semana',
  },
  moderate: {
    label: 'Moderadamente Ativo',
    multiplier: 1.55,
    description: 'Treinos intensos de musculação/cardio 3 a 5 dias',
  },
  intense: {
    label: 'Muito Ativo',
    multiplier: 1.725,
    description: 'Treinos pesados e intensos 6 a 7 dias na semana',
  },
  very_intense: {
    label: 'Extremamente Ativo',
    multiplier: 1.9,
    description: 'Atleta de alta performance ou rotina de trabalho físico extremo',
  },
};

/**
 * Calcula a Taxa Metabólica Basal (TMB) usando a fórmula de Mifflin-St Jeor
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female'
): number {
  if (!weight || !height || !age) return 0;
  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = gender === 'male' ? base + 5 : base - 161;
  return Math.round(bmr);
}

/**
 * Calcula o Gasto Energético Total Diário (GETD / TDEE)
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const mult = ACTIVITY_MULTIPLIERS[activityLevel]?.multiplier || 1.2;
  return Math.round(bmr * mult);
}

export interface MacroDistribution {
  targetCalories: number;
  caloriesDelta: number;
  proteinGrams: number;
  proteinCalories: number;
  carbsGrams: number;
  carbsCalories: number;
  fatGrams: number;
  fatCalories: number;
}

/**
 * Calcula as calorias alvo e distribuição de macronutrientes com base no objetivo
 */
export function calculateMacros(
  tdee: number,
  weight: number,
  goal: GoalDirection
): MacroDistribution {
  let targetCalories = tdee;
  let caloriesDelta = 0;

  if (goal === 'cut') {
    caloriesDelta = -450;
    targetCalories = Math.max(1200, tdee - 450);
  } else if (goal === 'bulk') {
    caloriesDelta = 350;
    targetCalories = tdee + 350;
  }

  // Proteína: 2.2g/kg para cut ou 2.0g/kg para bulk/manutenção
  const proteinPerKg = goal === 'cut' ? 2.2 : goal === 'bulk' ? 2.0 : 1.8;
  const proteinGrams = Math.round(weight * proteinPerKg);
  const proteinCalories = proteinGrams * 4;

  // Gorduras: ~0.85g/kg
  const fatPerKg = 0.85;
  const fatGrams = Math.round(weight * fatPerKg);
  const fatCalories = fatGrams * 9;

  // Carboidratos: restante
  const remainingCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
  const carbsGrams = Math.round(remainingCalories / 4);
  const carbsCalories = carbsGrams * 4;

  return {
    targetCalories,
    caloriesDelta,
    proteinGrams,
    proteinCalories,
    carbsGrams,
    carbsCalories,
    fatGrams,
    fatCalories,
  };
}

/**
 * Calcula os macronutrientes proporcionais de um alimento consumido
 */
export function calculateFoodNutrients(food: FoodItem, consumedQuantity: number) {
  const ratio = (food.servingSize > 0) ? (consumedQuantity / food.servingSize) : 0;
  return {
    calories: Math.round(food.calories * ratio),
    protein: +(food.protein * ratio).toFixed(1),
    carbs: +(food.carbs * ratio).toFixed(1),
    fat: +(food.fat * ratio).toFixed(1),
  };
}

/**
 * Calcula totais de uma lista de itens de refeição
 */
export function calculateMealTotals(entries: MealFoodEntry[] = []) {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  entries.forEach((e) => {
    calories += e.calculatedCalories || 0;
    protein += e.calculatedProtein || 0;
    carbs += e.calculatedCarbs || 0;
    fat += e.calculatedFat || 0;
  });

  return {
    calories: Math.round(calories),
    protein: +protein.toFixed(1),
    carbs: +carbs.toFixed(1),
    fat: +fat.toFixed(1),
  };
}

/**
 * Calcula totais do dia completo no diário alimentar (suporta refeições dinâmicas)
 */
export function calculateDailyMealPlanTotals(plan?: DailyMealPlan) {
  if (!plan || !plan.meals) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  const allEntries: MealFoodEntry[] = Object.values(plan.meals).flat().filter(Boolean);

  return calculateMealTotals(allEntries);
}

/**
 * Utilitário de formatação de data para YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Retorna os últimos N dias no formato YYYY-MM-DD
 */
export function getLastNDays(n: number, endDate: Date = new Date()): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    days.push(formatDateKey(d));
  }
  return days;
}

/**
 * Calcula estatísticas do ciclo quinzenal (14 dias)
 */
export function computeFortnightAnalysis(
  startDateStr: string,
  endDateStr: string,
  records: Record<string, DailyRecord>,
  habits: HabitItem[],
  weightHistory: Array<{ date: string; weight: number; tmb: number }>,
  profile: UserProfile,
  workoutLogs?: Record<string, DailyWorkoutLog>,
  mealPlans?: Record<string, DailyMealPlan>
): FortnightStats {
  const start = parseDateKey(startDateStr);
  const end = parseDateKey(endDateStr);
  
  const daysList: string[] = [];
  const curr = new Date(start);
  while (curr <= end) {
    daysList.push(formatDateKey(curr));
    curr.setDate(curr.getDate() + 1);
  }

  let totalPlanned = 0;
  let totalCompleted = 0;

  const pillarCounts: Record<PillarType, { planned: number; completed: number }> = {
    corpo: { planned: 0, completed: 0 },
    mente: { planned: 0, completed: 0 },
    alma: { planned: 0, completed: 0 },
  };

  let alcoholNoCount = 0;
  let alcoholRecordedDays = 0;
  let dietCleanCount = 0;
  let dietRecordedDays = 0;
  let workoutsCompletedCount = 0;
  let totalCaloriesSum = 0;
  let totalProteinSum = 0;
  let calorieDaysCount = 0;

  daysList.forEach((dayKey) => {
    const record = records[dayKey];

    habits.forEach((habit) => {
      totalPlanned++;
      pillarCounts[habit.pillar].planned++;

      if (record && record.habitsCompleted && record.habitsCompleted[habit.id]) {
        totalCompleted++;
        pillarCounts[habit.pillar].completed++;
      }
    });

    if (record) {
      if (record.consumedAlcohol !== null && record.consumedAlcohol !== undefined) {
        alcoholRecordedDays++;
        if (record.consumedAlcohol === false) {
          alcoholNoCount++;
        }
      }

      if (record.brokeDiet !== null && record.brokeDiet !== undefined) {
        dietRecordedDays++;
        if (record.brokeDiet === false) {
          dietCleanCount++;
        }
      }
    }

    if (workoutLogs && workoutLogs[dayKey]?.completed) {
      workoutsCompletedCount++;
    }

    if (mealPlans && mealPlans[dayKey]) {
      const dayTotals = calculateDailyMealPlanTotals(mealPlans[dayKey]);
      if (dayTotals.calories > 0) {
        totalCaloriesSum += dayTotals.calories;
        totalProteinSum += dayTotals.protein;
        calorieDaysCount++;
      }
    }
  });

  const executionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  const pillarExecution = {
    corpo: pillarCounts.corpo.planned > 0
      ? Math.round((pillarCounts.corpo.completed / pillarCounts.corpo.planned) * 100)
      : 0,
    mente: pillarCounts.mente.planned > 0
      ? Math.round((pillarCounts.mente.completed / pillarCounts.mente.planned) * 100)
      : 0,
    alma: pillarCounts.alma.planned > 0
      ? Math.round((pillarCounts.alma.completed / pillarCounts.alma.planned) * 100)
      : 0,
  };

  const alcoholFreeRate = alcoholRecordedDays > 0 ? Math.round((alcoholNoCount / alcoholRecordedDays) * 100) : 100;
  const cleanDietRate = dietRecordedDays > 0 ? Math.round((dietCleanCount / dietRecordedDays) * 100) : 100;

  // Pesagem no ciclo
  const sortedWeights = [...weightHistory].sort((a, b) => a.date.localeCompare(b.date));
  let weightStart = profile.currentWeight;
  let weightEnd = profile.currentWeight;

  if (sortedWeights.length > 0) {
    const inRange = sortedWeights.filter((w) => w.date >= startDateStr && w.date <= endDateStr);
    if (inRange.length > 0) {
      weightStart = inRange[0].weight;
      weightEnd = inRange[inRange.length - 1].weight;
    } else {
      weightStart = sortedWeights[0].weight;
      weightEnd = sortedWeights[sortedWeights.length - 1].weight;
    }
  }

  const weightDelta = +(weightEnd - weightStart).toFixed(1);
  const tmbStart = calculateBMR(weightStart, profile.height, profile.age, profile.gender);
  const tmbEnd = calculateBMR(weightEnd, profile.height, profile.age, profile.gender);

  const targetMacros = calculateMacros(calculateTDEE(tmbEnd, profile.activityLevel), weightEnd, profile.goalType);
  const averageCalories = calorieDaysCount > 0 ? Math.round(totalCaloriesSum / calorieDaysCount) : targetMacros.targetCalories;
  const averageProtein = calorieDaysCount > 0 ? Math.round(totalProteinSum / calorieDaysCount) : targetMacros.proteinGrams;

  // Determinar pilar dominante e pilar fraco
  const pillars: PillarType[] = ['corpo', 'mente', 'alma'];
  const sortedPillars = [...pillars].sort((a, b) => pillarExecution[b] - pillarExecution[a]);
  const dominantPillar = sortedPillars[0];
  const growthAreaPillar = sortedPillars[sortedPillars.length - 1];

  let disciplineGrade = 'RESISTÊNCIA EM PROGRESSO (B)';
  if (executionRate >= 88 && alcoholFreeRate >= 90 && cleanDietRate >= 85) {
    disciplineGrade = 'FORJA DE AÇO / DISICIPLINA TOTAL (A+)';
  } else if (executionRate >= 75 && cleanDietRate >= 75) {
    disciplineGrade = 'INTENSIDADE PESADA (A)';
  } else if (executionRate >= 60) {
    disciplineGrade = 'CONSTÂNCIA BRUTA (B)';
  } else {
    disciplineGrade = 'REINICIALIZAÇÃO TÁTICA (C)';
  }

  const actionDirectives: string[] = [];

  if (growthAreaPillar === 'alma') {
    actionDirectives.push('Blindar sono e corte total de luzes azuis às 22h30 para máxima regeneração de cortisol e GH.');
  } else if (growthAreaPillar === 'mente') {
    actionDirectives.push('Inserir 45 min inegociáveis de leitura ou estudos técnicos antes das notificações sociais.');
  } else {
    actionDirectives.push('Executar o plano de treinos sem quebra de volume e monitorar carga progressiva.');
  }

  if (cleanDietRate < 85) {
    actionDirectives.push('Alimentos pesados e registrados no diário com antecedência eliminam a brecha do erro calórico.');
  } else {
    actionDirectives.push('Precisão nutricional máxima: mantenha o aporte proteico de 2.0g/kg para densidade muscular.');
  }

  if (alcoholFreeRate < 90) {
    actionDirectives.push('Corte absoluto de álcool: preserve sua testosterona, síntese proteica e clareza mental.');
  } else {
    actionDirectives.push('Sequência limpa inabalável: o corpo está desinflamado e respondendo com máxima força.');
  }

  const summary = `Neste ciclo de 14 dias, você cravou ${executionRate}% de execução global. O pilar com maior impacto foi ${dominantPillar.toUpperCase()} (${pillarExecution[dominantPillar]}%), enquanto ${growthAreaPillar.toUpperCase()} (${pillarExecution[growthAreaPillar]}%) é seu ponto de reforço imediato para a próxima quinzena.`;

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    totalPlannedHabits: totalPlanned,
    totalCompletedHabits: totalCompleted,
    executionRate,
    pillarExecution,
    alcoholFreeRate,
    cleanDietRate,
    workoutsCompleted: workoutsCompletedCount,
    totalWorkoutsPlanned: 14, // 14 dias no ciclo
    averageCaloriesConsumed: averageCalories,
    targetCalories: targetMacros.targetCalories,
    averageProteinConsumed: averageProtein,
    targetProtein: targetMacros.proteinGrams,
    weightStart,
    weightEnd,
    weightDelta,
    tmbStart,
    tmbEnd,
    diagnostic: {
      dominantPillar,
      growthAreaPillar,
      disciplineGrade,
      summary,
      actionDirectives,
    },
  };
}
