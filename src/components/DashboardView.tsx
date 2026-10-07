import React, { useState, useEffect } from 'react';
import {
  Flame,
  Salad,
  Scale,
  Dumbbell,
  Check,
  X,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  Trash2,
  Trophy,
  CheckCircle2
} from 'lucide-react';
import {
  UserProfile,
  StreakState,
  HabitItem,
  DailyRecord,
  DailyMealPlan,
  DailyWorkoutLog,
  WorkoutDivision,
  FortnightStats,
  MindSoulPractice,
  DailyMindSoulLog,
  ExerciseSetEntry
} from '../types';
import {
  calculateDailyMealPlanTotals,
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  formatDateKey
} from '../utils/calculations';
import { fireDisciplineConfetti } from '../utils/confetti';
import { ActiveTab } from './Header';

interface DashboardViewProps {
  profile: UserProfile;
  streaks: StreakState;
  habits: HabitItem[];
  todayRecord: DailyRecord;
  todayMealPlan?: DailyMealPlan;
  todayWorkoutLog?: DailyWorkoutLog;
  activeWorkoutDivision?: WorkoutDivision;
  workoutDivisions?: WorkoutDivision[];
  fortnightStats: FortnightStats;
  mindSoulPractices?: MindSoulPractice[];
  todayMindSoulLog?: DailyMindSoulLog;
  onToggleHabit: (habitId: string, status: boolean) => void;
  onAddHabit?: (newHabit: Omit<HabitItem, 'id'>) => void;
  onDeleteHabit?: (habitId: string) => void;
  onAnswerAlcohol: (consumed: boolean) => void;
  onAnswerDiet: (broke: boolean) => void;
  onToggleTodayWorkout: () => void;
  onUpdateTodayWorkoutLog?: (log: DailyWorkoutLog) => void;
  onUpdateDayRecord?: (dateStr: string, updatedRecord: Partial<DailyRecord>) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickWeightModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  streaks,
  habits,
  todayRecord,
  todayMealPlan,
  todayWorkoutLog,
  activeWorkoutDivision,
  workoutDivisions = [],
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onAnswerAlcohol,
  onAnswerDiet,
  onToggleTodayWorkout,
  onUpdateTodayWorkoutLog,
  onUpdateDayRecord,
  setActiveTab,
  onOpenQuickWeightModal,
}) => {
  const todayKey = formatDateKey(new Date());

  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitPillar, setNewHabitPillar] = useState<'corpo' | 'mente' | 'alma'>('corpo');

  // Workout Accordion & Dynamic Sets State
  const [isWorkoutExpanded, setIsWorkoutExpanded] = useState(false);
  const [workoutSuccessFeedback, setWorkoutSuccessFeedback] = useState<{
    show: boolean;
    peakExercise: string;
    peakLoad: number;
  } | null>(null);

  const [exerciseSetsState, setExerciseSetsState] = useState<
    Record<string, Array<{ setNumber: number; reps: number | string; load: number }>>
  >({});

  // Sync / initialize exercise sets state based on active workout division and current log
  useEffect(() => {
    if (!activeWorkoutDivision?.exercises) return;

    const initial: Record<
      string,
      Array<{ setNumber: number; reps: number | string; load: number }>
    > = {};

    activeWorkoutDivision.exercises.forEach((ex) => {
      if (
        todayWorkoutLog?.exerciseSets?.[ex.id] &&
        todayWorkoutLog.exerciseSets[ex.id].length > 0
      ) {
        initial[ex.id] = todayWorkoutLog.exerciseSets[ex.id].map((s) => ({ ...s }));
      } else {
        const setCount = Math.max(1, ex.sets || 3);
        const savedLoad = todayWorkoutLog?.exerciseLoads?.[ex.id] ?? ex.load ?? 0;
        const defaultReps = ex.reps ? ex.reps.split('-')[0].trim() : '10';
        const setsArr = [];
        for (let i = 1; i <= setCount; i++) {
          setsArr.push({
            setNumber: i,
            reps: defaultReps || '10',
            load: savedLoad,
          });
        }
        initial[ex.id] = setsArr;
      }
    });

    setExerciseSetsState(initial);
  }, [activeWorkoutDivision, todayWorkoutLog]);

  const handleAddSet = (exerciseId: string) => {
    setExerciseSetsState((prev) => {
      const current = prev[exerciseId] || [];
      const nextNumber = current.length + 1;
      const lastLoad = current.length > 0 ? current[current.length - 1].load : 0;
      const lastReps = current.length > 0 ? current[current.length - 1].reps : '10';
      return {
        ...prev,
        [exerciseId]: [
          ...current,
          {
            setNumber: nextNumber,
            reps: lastReps,
            load: lastLoad,
          },
        ],
      };
    });
  };

  const handleRemoveSet = (exerciseId: string, index: number) => {
    setExerciseSetsState((prev) => {
      const current = prev[exerciseId] || [];
      const updated = current
        .filter((_, i) => i !== index)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return {
        ...prev,
        [exerciseId]: updated,
      };
    });
  };

  const handleUpdateSetField = (
    exerciseId: string,
    index: number,
    field: 'reps' | 'load',
    value: string | number
  ) => {
    setExerciseSetsState((prev) => {
      const current = prev[exerciseId] || [];
      const updated = current.map((s, idx) => {
        if (idx === index) {
          return {
            ...s,
            [field]: field === 'load' ? (value === '' ? 0 : Number(value)) : value,
          };
        }
        return s;
      });
      return {
        ...prev,
        [exerciseId]: updated,
      };
    });
  };

  const handleFinalizeWorkout = () => {
    if (!activeWorkoutDivision) return;

    const completedExercises: Record<string, boolean> = {};
    const exerciseLoads: Record<string, number> = {};
    let todayPeakLoad = 0;
    let todayPeakExerciseName = '';

    activeWorkoutDivision.exercises.forEach((ex) => {
      completedExercises[ex.id] = true;
      const sets = exerciseSetsState[ex.id] || [];
      let exMaxLoad = 0;
      sets.forEach((s) => {
        const numLoad = Number(s.load) || 0;
        if (numLoad > exMaxLoad) {
          exMaxLoad = numLoad;
        }
        if (numLoad > todayPeakLoad) {
          todayPeakLoad = numLoad;
          todayPeakExerciseName = ex.name;
        }
      });
      // Fallback if sets had 0 load
      if (exMaxLoad === 0 && ex.load) {
        exMaxLoad = ex.load;
        if (exMaxLoad > todayPeakLoad) {
          todayPeakLoad = exMaxLoad;
          todayPeakExerciseName = ex.name;
        }
      }
      exerciseLoads[ex.id] = exMaxLoad;
    });

    const updatedLog: DailyWorkoutLog = {
      date: todayKey,
      divisionId: activeWorkoutDivision.id,
      completed: true,
      completedExercises,
      exerciseLoads,
      exerciseSets: exerciseSetsState,
      notes: todayWorkoutLog?.notes || 'Treino finalizado com séries e cargas',
    };

    if (onUpdateTodayWorkoutLog) {
      onUpdateTodayWorkoutLog(updatedLog);
    } else {
      onToggleTodayWorkout();
    }

    fireDisciplineConfetti();
    setIsWorkoutExpanded(false);
    setWorkoutSuccessFeedback({
      show: true,
      peakExercise: todayPeakExerciseName || 'Exercício',
      peakLoad: todayPeakLoad,
    });

    setTimeout(() => {
      setWorkoutSuccessFeedback(null);
    }, 5000);
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || !onAddHabit) return;
    onAddHabit({
      name: newHabitName.trim(),
      pillar: newHabitPillar,
      description: 'Hábito de constância diária',
      targetPerWeek: 7,
    });
    setNewHabitName('');
    setIsAddHabitModalOpen(false);
  };

  // First name extraction (padrão: Kallani)
  const rawName = profile.name.trim().split(' ')[0] || 'Kallani';
  const firstName = (rawName.toLowerCase() === 'alexandre' || rawName.toLowerCase() === 'kallni' || !rawName) ? 'Kallani' : rawName;

  // Clean date formatted in Portuguese: "Segunda-feira, 28 de setembro"
  const rawDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const todayDateFormatted = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  // Nutritional calculations
  const bmr = calculateBMR(profile.currentWeight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const targetMacros = calculateMacros(tdee, profile.currentWeight, profile.goalType);
  const todayNutrients = calculateDailyMealPlanTotals(todayMealPlan);

  // Calorie & Protein percent calculations
  const caloriePercent = targetMacros.targetCalories > 0
    ? Math.min(100, Math.round((todayNutrients.calories / targetMacros.targetCalories) * 100))
    : 0;

  const proteinPercent = targetMacros.proteinGrams > 0
    ? Math.min(100, Math.round((todayNutrients.protein / targetMacros.proteinGrams) * 100))
    : 0;

  // Habits calculations
  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => todayRecord.habitsCompleted[h.id] === true).length;
  const habitPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Workout state
  const isWorkoutDone = todayWorkoutLog?.completed === true;
  const workoutDivisionName = activeWorkoutDivision?.name
    ? activeWorkoutDivision.name.split(' - ')[0]
    : activeWorkoutDivision?.letter
    ? `Treino ${activeWorkoutDivision.letter}`
    : 'Treino A';

  const workoutMuscles = activeWorkoutDivision?.targetMuscles || 'Peito, Tríceps & Deltoides';

  // Highest load logged today
  const maxLoggedLoadToday = React.useMemo(() => {
    let max = 0;
    if (todayWorkoutLog?.exerciseLoads) {
      Object.values(todayWorkoutLog.exerciseLoads).forEach((l) => {
        const num = Number(l) || 0;
        if (num > max) max = num;
      });
    }
    if (todayWorkoutLog?.exerciseSets) {
      Object.values(todayWorkoutLog.exerciseSets).forEach((sets) => {
        sets.forEach((s) => {
          const num = Number(s.load) || 0;
          if (num > max) max = num;
        });
      });
    }
    return max;
  }, [todayWorkoutLog]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      {/* ============================================================
          BLOCO 1: BANNER DE BEM-VINDO & MÉTRICAS ESSENCIAIS (Topo)
          ============================================================ */}
      <section className="p-4 sm:p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl space-y-4">
        {/* Cabeçalho minimalista */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F4F6]">
              Olá, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-[#9CA3AF] mt-0.5">
              {todayDateFormatted}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className="text-[11px] sm:text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>Ver histórico</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Linha de Badges Rápidas (Chips compactos) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Chip Álcool */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D0E14] border border-[#1F2430] text-xs text-[#F3F4F6] shrink-0">
            <Flame className="w-3.5 h-3.5 text-[#D97706] fill-[#D97706]/20" />
            <span className="font-semibold text-[#F3F4F6]">{streaks.alcoholFreeDays}d</span>
            <span className="text-[#9CA3AF]">sem álcool</span>
          </div>

          {/* Chip Dieta Limpa */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D0E14] border border-[#1F2430] text-xs text-[#F3F4F6] shrink-0">
            <Salad className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-[#F3F4F6]">{streaks.cleanDietDays}d</span>
            <span className="text-[#9CA3AF]">dieta limpa</span>
          </div>

          {/* Chip Peso Atual (Interativo) */}
          <button
            type="button"
            onClick={onOpenQuickWeightModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D0E14] hover:bg-[#1A1E29] border border-[#1F2430] hover:border-[#2A2F3D] text-xs text-[#F3F4F6] transition-all duration-200 cursor-pointer shrink-0"
            title="Clique para atualizar o peso de hoje"
          >
            <Scale className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="font-semibold text-[#F3F4F6]">{profile.currentWeight} kg</span>
            <span className="text-[10px] text-[#38BDF8] font-bold ml-0.5">+ Pesar</span>
          </button>
        </div>

        {/* Grid Compacto de Métricas do Dia (4 cards pequenos) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* 1. Calorias */}
          <div className="p-3 rounded-xl bg-[#0D0E14] border border-[#1F2430] flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[#9CA3AF]">Calorias</span>
            <div className="my-1.5">
              <div className="text-sm sm:text-base font-bold text-[#F3F4F6] tracking-tight">
                {todayNutrients.calories}{' '}
                <span className="text-xs font-normal text-[#9CA3AF]">
                  / {targetMacros.targetCalories} kcal
                </span>
              </div>
            </div>
            {/* Barra de progresso fina */}
            <div className="w-full bg-[#1F2430] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#D97706] h-full rounded-full transition-all duration-300"
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
          </div>

          {/* 2. Proteínas */}
          <div className="p-3 rounded-xl bg-[#0D0E14] border border-[#1F2430] flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[#9CA3AF]">Proteínas</span>
            <div className="my-1.5">
              <div className="text-sm sm:text-base font-bold text-[#F3F4F6] tracking-tight">
                {todayNutrients.protein}g{' '}
                <span className="text-xs font-normal text-[#9CA3AF]">
                  / {targetMacros.proteinGrams}g
                </span>
              </div>
            </div>
            {/* Barra de progresso fina */}
            <div className="w-full bg-[#1F2430] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#E2E8F0] h-full rounded-full transition-all duration-300"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
          </div>

          {/* 3. Treino de Hoje */}
          <div className="p-3 rounded-xl bg-[#0D0E14] border border-[#1F2430] flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[#9CA3AF]">Treino de Hoje</span>
            <div className="my-1">
              <div className="text-sm sm:text-base font-bold text-[#F3F4F6] truncate">
                {workoutDivisionName}
              </div>
            </div>
            <div className="flex items-center">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isWorkoutDone
                    ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
                    : 'bg-[#1F2430] text-[#9CA3AF]'
                }`}
              >
                {isWorkoutDone ? 'Concluído ✓' : 'Pendente'}
              </span>
            </div>
          </div>

          {/* 4. Hábitos */}
          <div className="p-3 rounded-xl bg-[#0D0E14] border border-[#1F2430] flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[#9CA3AF]">Hábitos</span>
            <div className="my-1.5">
              <div className="text-sm sm:text-base font-bold text-[#F3F4F6] tracking-tight">
                {completedHabits}/{totalHabits}{' '}
                <span className="text-xs font-normal text-[#9CA3AF]">Feitos</span>
              </div>
            </div>
            {/* Barra de progresso fina */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 bg-[#1F2430] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#D97706] h-full rounded-full transition-all duration-300"
                  style={{ width: `${habitPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-[#9CA3AF]">{habitPercent}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          BLOCO 2: VERIFICAÇÃO RÁPIDA DE DISCIPLINA (Ação Rápida de 1 Clique)
          ============================================================ */}
      <section className="p-4 sm:p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl space-y-3">
        <h2 className="text-sm font-bold text-[#F3F4F6] tracking-wide">
          Disciplina Hoje
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Toggle 1: Sem Álcool? */}
          <div className="p-3 rounded-xl bg-[#0D0E14] border border-[#1F2430] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#F3F4F6] flex items-center gap-1.5">
                <span>🍺</span>
                <span>Sem Álcool?</span>
              </span>

              <div className="inline-flex rounded-lg p-0.5 bg-[#12141A] border border-[#1F2430]">
                <button
                  type="button"
                  onClick={() => onAnswerAlcohol(false)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                    todayRecord.consumedAlcohol === false
                      ? 'bg-[#E2E8F0] text-[#090A0C] shadow-sm'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>SIM (Limpo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAnswerAlcohol(true)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                    todayRecord.consumedAlcohol === true
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  <X className="w-3 h-3 stroke-[3]" />
                  <span>NÃO</span>
                </button>
              </div>
            </div>

            {/* In-line optional note if consumed */}
            {todayRecord.consumedAlcohol === true && (
              <input
                type="text"
                placeholder="Motivo / O que bebeu (opcional)..."
                value={todayRecord.alcoholNotes || ''}
                onChange={(e) =>
                  onUpdateDayRecord &&
                  onUpdateDayRecord(todayKey, { alcoholNotes: e.target.value })
                }
                className="w-full bg-[#12141A] border border-[#1F2430] rounded-lg px-2.5 py-1 text-xs text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] transition-all duration-200"
              />
            )}
          </div>

          {/* Toggle 2: Dieta 100%? */}
          <div className="p-3 rounded-xl bg-[#0D0E14] border border-[#1F2430] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#F3F4F6] flex items-center gap-1.5">
                <span>🍔</span>
                <span>Dieta 100%?</span>
              </span>

              <div className="inline-flex rounded-lg p-0.5 bg-[#12141A] border border-[#1F2430]">
                <button
                  type="button"
                  onClick={() => onAnswerDiet(false)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                    todayRecord.brokeDiet === false
                      ? 'bg-[#E2E8F0] text-[#090A0C] shadow-sm'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>SIM (No Plano)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAnswerDiet(true)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                    todayRecord.brokeDiet === true
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  <X className="w-3 h-3 stroke-[3]" />
                  <span>NÃO</span>
                </button>
              </div>
            </div>

            {/* In-line optional note if broke diet */}
            {todayRecord.brokeDiet === true && (
              <input
                type="text"
                placeholder="Motivo / O que comeu fora do plano (opcional)..."
                value={todayRecord.dietNotes || ''}
                onChange={(e) =>
                  onUpdateDayRecord &&
                  onUpdateDayRecord(todayKey, { dietNotes: e.target.value })
                }
                className="w-full bg-[#12141A] border border-[#1F2430] rounded-lg px-2.5 py-1 text-xs text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] transition-all duration-200"
              />
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          BLOCO 3: FOCO DO DIA (Treino + Checklist Unificado)
          ============================================================ */}
      <section className="space-y-3">
        {/* Treino do Dia (Com registro dinâmico de séries & cargas em Accordion) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl space-y-3 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1F2430] flex items-center justify-center text-[#38BDF8]">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#F3F4F6]">
                    {workoutDivisionName}
                  </h3>
                  {isWorkoutDone && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span>Concluído</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#9CA3AF]">{workoutMuscles}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {maxLoggedLoadToday > 0 && (
                <span className="text-[11px] text-[#9CA3AF] hidden sm:inline-block">
                  Pico: <strong className="text-[#38BDF8]">{maxLoggedLoadToday} kg</strong>
                </span>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('workouts')}
                className="text-xs text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center gap-1 transition-colors cursor-pointer font-medium"
              >
                <span>Ver rotina</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Feedback de Treino Finalizado */}
          {workoutSuccessFeedback?.show && (
            <div className="p-3 rounded-xl bg-[#D97706]/15 border border-[#D97706]/40 text-[#F3F4F6] text-xs flex items-center justify-between animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>
                  <strong>Treino Finalizado com Sucesso!</strong> Carga máxima registrada:{' '}
                  <span className="text-white font-bold">
                    {workoutSuccessFeedback.peakExercise} — {workoutSuccessFeedback.peakLoad} kg
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWorkoutSuccessFeedback(null)}
                className="text-[#9CA3AF] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Botão Principal: REGISTRAR SÉRIES & CARGAS */}
          <button
            type="button"
            onClick={() => setIsWorkoutExpanded((prev) => !prev)}
            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
              isWorkoutExpanded
                ? 'bg-[#1F2430] text-[#F3F4F6] border border-[#2A2F3D]'
                : isWorkoutDone
                ? 'bg-[#1A1E29] hover:bg-[#242A38] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm'
                : 'bg-[#D97706] hover:bg-[#b45309] text-white border border-[#f59e0b]/20 shadow-none'
            }`}
          >
            {isWorkoutExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                <span>RECOLHER REGISTRO DE TREINO</span>
              </>
            ) : (
              <>
                <Dumbbell className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isWorkoutDone
                    ? 'REGISTRAR SÉRIES & CARGAS (✓ Treino Feito)'
                    : 'REGISTRAR SÉRIES & CARGAS'}
                </span>
                <ChevronDown className="w-4 h-4 opacity-75" />
              </>
            )}
          </button>

          {/* ACCORDION EXPANSÍVEL: REGISTRO DE SÉRIES, REPETIÇÕES E CARGAS POR EXERCÍCIO */}
          {isWorkoutExpanded && (
            <div className="pt-3 border-t border-[#1F2430] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider">
                    Exercícios Programados ({activeWorkoutDivision?.exercises.length || 0})
                  </h4>
                  <p className="text-[11px] text-[#9CA3AF]">
                    Ajuste as repetições e cargas reais executadas na academia
                  </p>
                </div>
                <span className="text-[10px] text-[#9CA3AF]">
                  {todayDateFormatted}
                </span>
              </div>

              {/* Lista de Exercícios */}
              <div className="space-y-3">
                {activeWorkoutDivision?.exercises.map((ex) => {
                  const sets = exerciseSetsState[ex.id] || [];
                  return (
                    <div
                      key={ex.id}
                      className="p-3.5 rounded-xl bg-[#0D0E14] border border-[#1F2430] space-y-2.5"
                    >
                      {/* Cabeçalho do Exercício */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="text-sm font-bold text-[#F3F4F6] flex items-center gap-1.5">
                            <span>{ex.name}</span>
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#9CA3AF]">
                            <span className="text-[#38BDF8] font-semibold text-[11px]">
                              Meta: {ex.sets}x {ex.reps}
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-[#9CA3AF] text-[11px]">
                              Carga padrão: {ex.load} kg
                            </span>
                          </div>
                        </div>

                        {/* Botão [ + Add Série ] */}
                        <button
                          type="button"
                          onClick={() => handleAddSet(ex.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#12141A] hover:bg-[#1A1E29] text-[#E2E8F0] hover:text-white border border-[#1F2430] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>+ Add Série</span>
                        </button>
                      </div>

                      {/* Tabela de Séries Dinâmicas */}
                      <div className="space-y-1.5 pt-1">
                        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-1">
                          <span className="col-span-3">Série</span>
                          <span className="col-span-4 text-center">Repetições</span>
                          <span className="col-span-4 text-center">Carga (kg)</span>
                          <span className="col-span-1 text-right"></span>
                        </div>

                        {sets.map((set, sIdx) => (
                          <div
                            key={sIdx}
                            className="grid grid-cols-12 gap-2 items-center bg-[#12141A] border border-[#1F2430] rounded-lg p-1.5"
                          >
                            {/* Série nº */}
                            <div className="col-span-3">
                              <span className="inline-block text-xs font-bold text-[#F3F4F6] bg-[#1F2430] px-2 py-1 rounded">
                                #{set.setNumber}
                              </span>
                            </div>

                            {/* Repetições */}
                            <div className="col-span-4">
                              <input
                                type="text"
                                value={set.reps}
                                onChange={(e) =>
                                  handleUpdateSetField(ex.id, sIdx, 'reps', e.target.value)
                                }
                                placeholder="10"
                                className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-md px-2 py-1 text-xs text-center text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
                              />
                            </div>

                            {/* Carga (kg) */}
                            <div className="col-span-4">
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={set.load === 0 ? '' : set.load}
                                  onChange={(e) =>
                                    handleUpdateSetField(ex.id, sIdx, 'load', e.target.value)
                                  }
                                  placeholder="0"
                                  className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-md pl-2 pr-6 py-1 text-xs text-center font-bold text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
                                />
                                <span className="absolute right-1.5 text-[10px] text-[#9CA3AF] font-semibold pointer-events-none">
                                  kg
                                </span>
                              </div>
                            </div>

                            {/* Ação: Remover série */}
                            <div className="col-span-1 flex justify-end">
                              {sets.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSet(ex.id, sIdx)}
                                  className="text-zinc-600 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                                  title="Remover série"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão de Confirmação Final */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleFinalizeWorkout}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 border border-[#f59e0b]/20 flex items-center justify-center gap-2 cursor-pointer shadow-none"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>FINALIZAR E REGISTRAR TREINO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsWorkoutExpanded(false)}
                  className="w-full py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors cursor-pointer text-center"
                >
                  Recolher sem salvar alterações
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Checklist de Hábitos Unificado (Compacto & Sem Poluição) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1F2430] flex items-center justify-center text-[#38BDF8]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#F3F4F6]">
                Checklist de Hábitos
              </h3>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs text-[#9CA3AF]">
                {completedHabits}/{totalHabits} concluídos
              </span>
              {onAddHabit && (
                <button
                  type="button"
                  onClick={() => setIsAddHabitModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#12141A] hover:bg-[#1A1E29] text-[#E2E8F0] border border-[#1F2430] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Hábito</span>
                </button>
              )}
            </div>
          </div>

          {/* Lista compacta de checkboxes */}
          <div className="space-y-1.5">
            {habits.map((habit) => {
              const isDone = todayRecord.habitsCompleted[habit.id] === true;
              const pillarLabel =
                habit.pillar === 'corpo'
                  ? 'Corpo'
                  : habit.pillar === 'mente'
                  ? 'Mente'
                  : 'Alma';

              const pillarColor =
                habit.pillar === 'corpo'
                  ? 'text-[#D97706] bg-[#D97706]/10 border border-[#D97706]/20'
                  : habit.pillar === 'mente'
                  ? 'text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20'
                  : 'text-purple-400 bg-purple-400/10 border border-purple-400/20';

              return (
                <div
                  key={habit.id}
                  onClick={() => onToggleHabit(habit.id, !isDone)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isDone
                      ? 'bg-[#0D0E14] border-[#1F2430] opacity-80'
                      : 'bg-[#0D0E14] border-[#1F2430] hover:border-[#2A2F3D] hover:bg-[#12141A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Compact Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                        isDone
                          ? 'bg-[#D97706] text-white'
                          : 'border border-[#2A2F3D] bg-[#12141A]'
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    {/* Pilar Badge */}
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${pillarColor}`}
                    >
                      {pillarLabel}
                    </span>

                    {/* Nome do Hábito */}
                    <span
                      className={`text-xs sm:text-sm font-medium truncate ${
                        isDone ? 'line-through text-[#9CA3AF]' : 'text-[#F3F4F6]'
                      }`}
                    >
                      {habit.name}
                    </span>
                  </div>

                  {/* Status Indicator & Delete Action */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={`text-[11px] font-semibold ${
                        isDone ? 'text-[#D97706]' : 'text-[#9CA3AF]'
                      }`}
                    >
                      {isDone ? 'Feito' : 'Pendente'}
                    </span>
                    {onDeleteHabit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remover hábito "${habit.name}"?`)) {
                            onDeleteHabit(habit.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                        title="Remover hábito"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          BLOCO 4: NOTAS DO DIA & REFLEXÃO
          ============================================================ */}
      <section className="p-4 sm:p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1F2430] flex items-center justify-center text-[#38BDF8]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F3F4F6] uppercase tracking-wide">
                Notas do Dia & Reflexão
              </h3>
              <p className="text-[11px] text-[#9CA3AF]">
                Diário de bordo, aprendizados, dificuldades superadas ou foco
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#0D0E14] border border-[#1F2430] text-[#9CA3AF]">
            {todayKey}
          </span>
        </div>

        <textarea
          rows={3}
          value={todayRecord.journalNotes || ''}
          onChange={(e) =>
            onUpdateDayRecord &&
            onUpdateDayRecord(todayKey, { journalNotes: e.target.value })
          }
          placeholder="Registre como foi seu foco hoje, dificuldades superadas, peso das cargas ou aprendizados mentais..."
          className="w-full bg-[#0D0E14] border border-[#1F2430] rounded-xl p-3 text-xs sm:text-sm text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] transition-all duration-200"
        />

        <div className="flex items-center justify-between text-[10px] text-[#9CA3AF]">
          <span>Salvo automaticamente no histórico e no diário de bordo.</span>
          {todayRecord.journalNotes?.trim() ? (
            <span className="text-[#38BDF8] font-bold flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" /> Gravado no histórico
            </span>
          ) : (
            <span>Sem anotação</span>
          )}
        </div>
      </section>

      {/* MODAL ADICIONAR HÁBITO */}
      {isAddHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl text-[#F3F4F6]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1F2430]">
              <h3 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <span>Novo Hábito de Disciplina</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddHabitModalOpen(false)}
                className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1E29] cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-[#9CA3AF] font-semibold mb-1.5">
                  Nome do Hábito *
                </label>
                <input
                  type="text"
                  required
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Ex: Ler 20 páginas de filosofia, 15m Respiração..."
                  className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-[#9CA3AF] font-semibold mb-1.5">
                  Pilar Integral *
                </label>
                <select
                  value={newHabitPillar}
                  onChange={(e) => setNewHabitPillar(e.target.value as any)}
                  className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
                >
                  <option value="corpo">Corpo (Físico, Treino, Nutrição)</option>
                  <option value="mente">Mente (Foco, Leitura, Deep Work)</option>
                  <option value="alma">Alma (Meditação, Oração, Gratidão)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1F2430]">
                <button
                  type="button"
                  onClick={() => setIsAddHabitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D0E14] hover:bg-[#1A1E29] border border-[#1F2430] text-xs text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold text-xs uppercase tracking-wider cursor-pointer border border-[#f59e0b]/20 transition-all duration-200 shadow-none"
                >
                  Salvar Hábito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
