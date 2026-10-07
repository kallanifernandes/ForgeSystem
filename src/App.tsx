/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  loadAppState,
  saveAppState,
  generateSeedData,
  INITIAL_FOODS,
  KairosAppState
} from './utils/storage';
import {
  DailyRecord,
  Goal,
  HabitItem,
  UserProfile,
  WeightRecord,
  FoodItem,
  DailyMealPlan,
  WorkoutDivision,
  WorkoutExercise,
  DailyWorkoutLog,
  MindSoulPractice,
  DailyMindSoulLog
} from './types';
import {
  formatDateKey,
  computeFortnightAnalysis
} from './utils/calculations';
import { fireDisciplineConfetti } from './utils/confetti';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { FoodDatabaseView } from './components/FoodDatabaseView';
import { NutritionTrackerView } from './components/NutritionTrackerView';
import { WorkoutLogView } from './components/WorkoutLogView';
import { MindSoulView } from './components/MindSoulView';
import { AnalyticsProfileView } from './components/AnalyticsProfileView';
import { ResetStreakModal } from './components/ResetStreakModal';
import { QuickWeightModal } from './components/QuickWeightModal';
import { authService, AuthUser } from './services/auth';
import { AuthView } from './components/AuthView';
import { FirstAccessOnboardingModal } from './components/FirstAccessOnboardingModal';
import { supabaseService } from './services/supabaseService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [appState, setAppState] = useState<KairosAppState>(() => {
    const user = authService.getCurrentUser();
    return loadAppState(user?.id, user?.name);
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [analyticsInitialSubTab, setAnalyticsInitialSubTab] = useState<'analytics' | 'discipline_history' | 'profile' | undefined>(undefined);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [isRefreshingDb, setIsRefreshingDb] = useState<boolean>(false);

  // Modals state
  const [resetModalState, setResetModalState] = useState<{
    isOpen: boolean;
    type: 'alcohol' | 'diet';
    dateStr?: string;
  }>({
    isOpen: false,
    type: 'alcohol',
  });
  const [isQuickWeightOpen, setIsQuickWeightOpen] = useState(false);

  // Sync state changes to user-specific localStorage key and Supabase in background
  useEffect(() => {
    if (currentUser) {
      saveAppState(appState, currentUser.id);

      // Sincronização automática com as tabelas do Supabase
      if (supabaseService.isAvailable()) {
        const timer = setTimeout(() => {
          supabaseService.syncState(currentUser.id, appState).then((ok) => {
            if (ok) setIsDbConnected(true);
          });
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [appState, currentUser?.id]);

  // Load cloud data directly from Supabase database tables when user is logged in
  useEffect(() => {
    if (currentUser && supabaseService.isAvailable()) {
      setIsRefreshingDb(true);
      supabaseService.loadState(currentUser.id).then((cloudState) => {
        if (cloudState && Object.keys(cloudState).length > 0) {
          setAppState((prev) => ({
            ...prev,
            ...cloudState,
            profile: { ...prev.profile, ...(cloudState.profile || {}) },
            activeWorkoutDivisionId: cloudState.activeWorkoutDivisionId || prev.activeWorkoutDivisionId,
          }));
          setIsDbConnected(true);
        }
      }).finally(() => {
        setIsRefreshingDb(false);
      });
    }
  }, [currentUser?.id]);

  const handleRefreshFromDb = async () => {
    if (!currentUser || !supabaseService.isAvailable()) return;
    setIsRefreshingDb(true);
    try {
      const cloudState = await supabaseService.loadState(currentUser.id);
      if (cloudState && Object.keys(cloudState).length > 0) {
        setAppState((prev) => ({
          ...prev,
          ...cloudState,
          profile: { ...prev.profile, ...(cloudState.profile || {}) },
          activeWorkoutDivisionId: cloudState.activeWorkoutDivisionId || prev.activeWorkoutDivisionId,
        }));
        setIsDbConnected(true);
      }
    } catch (err) {
      console.error('Erro ao atualizar do banco:', err);
    } finally {
      setIsRefreshingDb(false);
    }
  };

  // Load user data when switching authenticated user
  const handleAuthSuccess = async (user: AuthUser) => {
    setCurrentUser(user);
    setIsRefreshingDb(true);
    try {
      const cloudState = await supabaseService.loadState(user.id);
      if (cloudState && Object.keys(cloudState).length > 0) {
        setAppState((prev) => ({
          ...prev,
          ...cloudState,
          profile: { ...prev.profile, ...(cloudState.profile || {}) },
        }));
        setIsDbConnected(true);
      } else {
        const userState = loadAppState(user.id, user.name);
        setAppState(userState);
      }
    } catch {
      const userState = loadAppState(user.id, user.name);
      setAppState(userState);
    } finally {
      setIsRefreshingDb(false);
      setActiveTab('dashboard');
    }
  };

  const handleLogout = async () => {
    await authService.logoutUser();
    setCurrentUser(null);
  };

  const handleOpenProfileSettings = () => {
    setAnalyticsInitialSubTab('profile');
    setActiveTab('analytics');
  };

  const todayKey = formatDateKey(new Date());

  const todayRecord: DailyRecord = appState.dailyRecords[todayKey] || {
    date: todayKey,
    habitsCompleted: {},
    consumedAlcohol: null,
    brokeDiet: null,
    journalNotes: '',
  };

  const todayMealPlan: DailyMealPlan = appState.mealPlans[todayKey] || {
    date: todayKey,
    waterConsumedMl: 3500,
    meals: {
      cafe: [],
      almoco: [],
      lanche: [],
      jantar: [],
      ceia: [],
    },
  };

  const todayWorkoutLog: DailyWorkoutLog = appState.workoutLogs[todayKey] || {
    date: todayKey,
    divisionId: appState.activeWorkoutDivisionId || 'div-a',
    completed: false,
    completedExercises: {},
    exerciseLoads: {},
    notes: '',
  };

  const todayMindSoulLog: DailyMindSoulLog = appState.mindSoulLogs?.[todayKey] || {
    date: todayKey,
    practices: {},
    dailyReflection: '',
  };

  const activeWorkoutDivision = appState.workoutDivisions.find(
    (d) => d.id === appState.activeWorkoutDivisionId
  ) || appState.workoutDivisions[0];

  // 14-day Fortnight review stats
  const fortnightStats = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 13);
    const startStr = formatDateKey(start);
    const endStr = formatDateKey(end);

    return computeFortnightAnalysis(
      startStr,
      endStr,
      appState.dailyRecords,
      appState.habits,
      appState.weightHistory,
      appState.profile,
      appState.workoutLogs,
      appState.mealPlans
    );
  }, [
    appState.dailyRecords,
    appState.habits,
    appState.weightHistory,
    appState.profile,
    appState.workoutLogs,
    appState.mealPlans,
  ]);

  // Handler: Toggle habit completion
  const handleToggleHabit = (habitId: string, status: boolean, dateStr: string = todayKey) => {
    setAppState((prev) => {
      const prevRec = prev.dailyRecords[dateStr] || {
        date: dateStr,
        habitsCompleted: {},
        consumedAlcohol: null,
        brokeDiet: null,
      };

      const updatedHabits = {
        ...prevRec.habitsCompleted,
        [habitId]: status,
      };

      const updatedRecord: DailyRecord = {
        ...prevRec,
        habitsCompleted: updatedHabits,
        updatedAt: new Date().toISOString(),
      };

      // Recalculate general consistency streak if all habits were hit today
      let newGeneralStreak = prev.streaks.generalStreak;
      const allDone = prev.habits.every((h) => updatedHabits[h.id] === true);
      if (allDone && dateStr === todayKey) {
        newGeneralStreak = Math.max(prev.streaks.generalStreak, prev.streaks.generalStreak + 1);
        fireDisciplineConfetti();
      }

      return {
        ...prev,
        dailyRecords: {
          ...prev.dailyRecords,
          [dateStr]: updatedRecord,
        },
        streaks: {
          ...prev.streaks,
          generalStreak: newGeneralStreak,
        },
      };
    });
  };

  // Handler: Update full day habit record
  const handleUpdateDayRecord = (dateStr: string, updates: Partial<DailyRecord>) => {
    setAppState((prev) => {
      const current = prev.dailyRecords[dateStr] || {
        date: dateStr,
        habitsCompleted: {},
        consumedAlcohol: null,
        brokeDiet: null,
      };

      const updatedRecord: DailyRecord = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        dailyRecords: {
          ...prev.dailyRecords,
          [dateStr]: updatedRecord,
        },
      };
    });
  };

  // Handler: Answer Alcohol question
  const handleAnswerAlcohol = (consumed: boolean, dateStr: string = todayKey) => {
    if (consumed) {
      setResetModalState({ isOpen: true, type: 'alcohol', dateStr });
    } else {
      fireDisciplineConfetti();
      setAppState((prev) => {
        const prevRec = prev.dailyRecords[dateStr] || {
          date: dateStr,
          habitsCompleted: {},
          consumedAlcohol: null,
          brokeDiet: null,
        };

        const wasAlreadyClean = prevRec.consumedAlcohol === false;
        const newStreak = wasAlreadyClean
          ? prev.streaks.alcoholFreeDays
          : prev.streaks.alcoholFreeDays + 1;

        return {
          ...prev,
          dailyRecords: {
            ...prev.dailyRecords,
            [dateStr]: {
              ...prevRec,
              consumedAlcohol: false,
              updatedAt: new Date().toISOString(),
            },
          },
          streaks: {
            ...prev.streaks,
            alcoholFreeDays: newStreak,
            lastRecordedDate: dateStr,
          },
        };
      });
    }
  };

  // Handler: Answer Diet question
  const handleAnswerDiet = (broke: boolean, dateStr: string = todayKey) => {
    if (broke) {
      setResetModalState({ isOpen: true, type: 'diet', dateStr });
    } else {
      fireDisciplineConfetti();
      setAppState((prev) => {
        const prevRec = prev.dailyRecords[dateStr] || {
          date: dateStr,
          habitsCompleted: {},
          consumedAlcohol: null,
          brokeDiet: null,
        };

        const wasAlreadyClean = prevRec.brokeDiet === false;
        const newStreak = wasAlreadyClean
          ? prev.streaks.cleanDietDays
          : prev.streaks.cleanDietDays + 1;

        return {
          ...prev,
          dailyRecords: {
            ...prev.dailyRecords,
            [dateStr]: {
              ...prevRec,
              brokeDiet: false,
              updatedAt: new Date().toISOString(),
            },
          },
          streaks: {
            ...prev.streaks,
            cleanDietDays: newStreak,
            lastRecordedDate: dateStr,
          },
        };
      });
    }
  };

  // Handler: Confirm Streak Reset
  const handleConfirmResetStreak = (note?: string) => {
    const isAlcohol = resetModalState.type === 'alcohol';
    const targetDate = resetModalState.dateStr || todayKey;

    setAppState((prev) => {
      const prevRec = prev.dailyRecords[targetDate] || {
        date: targetDate,
        habitsCompleted: {},
        consumedAlcohol: null,
        brokeDiet: null,
      };

      if (isAlcohol) {
        return {
          ...prev,
          dailyRecords: {
            ...prev.dailyRecords,
            [targetDate]: {
              ...prevRec,
              consumedAlcohol: true,
              alcoholNotes: note?.trim() || undefined,
              updatedAt: new Date().toISOString(),
            },
          },
          streaks: {
            ...prev.streaks,
            alcoholFreeDays: 0,
            lastAlcoholDate: targetDate,
          },
        };
      } else {
        return {
          ...prev,
          dailyRecords: {
            ...prev.dailyRecords,
            [targetDate]: {
              ...prevRec,
              brokeDiet: true,
              dietNotes: note?.trim() || undefined,
              updatedAt: new Date().toISOString(),
            },
          },
          streaks: {
            ...prev.streaks,
            cleanDietDays: 0,
            lastBrokeDietDate: targetDate,
          },
        };
      }
    });

    setResetModalState({ isOpen: false, type: 'alcohol' });
  };

  // Food Database Handlers
  const handleAddFood = (newFood: Omit<FoodItem, 'id'>) => {
    const id = `food-${Date.now()}`;
    setAppState((prev) => ({
      ...prev,
      foods: [
        { ...newFood, id },
        ...prev.foods,
      ],
    }));
  };

  const handleUpdateFood = (id: string, updates: Partial<FoodItem>) => {
    setAppState((prev) => ({
      ...prev,
      foods: prev.foods.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  };

  const handleDeleteFood = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      foods: prev.foods.filter((f) => f.id !== id),
    }));
  };

  const handleResetDefaultFoods = () => {
    if (confirm('Restaurar tabela padrão de alimentos limpos? Alimentos personalizados serão mantidos.')) {
      setAppState((prev) => {
        const customFoods = prev.foods.filter((f) => f.isCustom);
        return {
          ...prev,
          foods: [...INITIAL_FOODS, ...customFoods],
        };
      });
    }
  };

  // Meal Plan Handlers
  const handleUpdateDailyMealPlan = (dateStr: string, plan: DailyMealPlan) => {
    setAppState((prev) => ({
      ...prev,
      mealPlans: {
        ...prev.mealPlans,
        [dateStr]: plan,
      },
    }));
  };

  const handleBatchUpdateDailyMealPlans = (plans: Record<string, DailyMealPlan>) => {
    setAppState((prev) => ({
      ...prev,
      mealPlans: {
        ...prev.mealPlans,
        ...plans,
      },
    }));
  };

  // Workout Log Handlers
  const handleSelectDivision = (divisionId: string) => {
    setAppState((prev) => ({
      ...prev,
      activeWorkoutDivisionId: divisionId,
    }));
  };

  const handleAddDivision = (division: Omit<WorkoutDivision, 'id'>) => {
    const id = `div-${Date.now()}`;
    setAppState((prev) => ({
      ...prev,
      workoutDivisions: [...prev.workoutDivisions, { ...division, id }],
      activeWorkoutDivisionId: id,
    }));
  };

  const handleUpdateDivision = (divisionId: string, updates: Partial<WorkoutDivision>) => {
    setAppState((prev) => ({
      ...prev,
      workoutDivisions: prev.workoutDivisions.map((d) => (d.id === divisionId ? { ...d, ...updates } : d)),
    }));
  };

  const handleDeleteDivision = (divisionId: string) => {
    setAppState((prev) => {
      const filtered = prev.workoutDivisions.filter((d) => d.id !== divisionId);
      const nextActiveId = prev.activeWorkoutDivisionId === divisionId
        ? (filtered[0]?.id || '')
        : prev.activeWorkoutDivisionId;
      return {
        ...prev,
        workoutDivisions: filtered,
        activeWorkoutDivisionId: nextActiveId,
      };
    });
  };

  const handleAddExercise = (divisionId: string, exercise: Omit<WorkoutExercise, 'id'>) => {
    const id = `ex-${Date.now()}`;
    setAppState((prev) => ({
      ...prev,
      workoutDivisions: prev.workoutDivisions.map((d) => {
        if (d.id !== divisionId) return d;
        return {
          ...d,
          exercises: [...d.exercises, { ...exercise, id }],
        };
      }),
    }));
  };

  const handleUpdateExercise = (divisionId: string, exerciseId: string, updates: Partial<WorkoutExercise>) => {
    setAppState((prev) => ({
      ...prev,
      workoutDivisions: prev.workoutDivisions.map((d) => {
        if (d.id !== divisionId) return d;
        return {
          ...d,
          exercises: d.exercises.map((ex) => (ex.id === exerciseId ? { ...ex, ...updates } : ex)),
        };
      }),
    }));
  };

  const handleDeleteExercise = (divisionId: string, exerciseId: string) => {
    setAppState((prev) => ({
      ...prev,
      workoutDivisions: prev.workoutDivisions.map((d) => {
        if (d.id !== divisionId) return d;
        return {
          ...d,
          exercises: d.exercises.filter((ex) => ex.id !== exerciseId),
        };
      }),
    }));
  };

  const handleUpdateTodayWorkoutLog = (log: DailyWorkoutLog) => {
    setAppState((prev) => ({
      ...prev,
      workoutLogs: {
        ...prev.workoutLogs,
        [log.date]: log,
      },
    }));
  };

  const handleToggleTodayWorkout = () => {
    const nextCompleted = !todayWorkoutLog.completed;
    const updatedExercises: Record<string, boolean> = {};

    activeWorkoutDivision.exercises.forEach((ex) => {
      updatedExercises[ex.id] = nextCompleted;
    });

    if (nextCompleted) {
      fireDisciplineConfetti();
    }

    handleUpdateTodayWorkoutLog({
      ...todayWorkoutLog,
      divisionId: activeWorkoutDivision.id,
      completed: nextCompleted,
      completedExercises: updatedExercises,
    });
  };

  // Habit Management
  const handleAddHabit = (newHabit: Omit<HabitItem, 'id'>) => {
    const id = `habit-${Date.now()}`;
    setAppState((prev) => ({
      ...prev,
      habits: [...prev.habits, { ...newHabit, id }],
    }));
  };

  const handleDeleteHabit = (habitId: string) => {
    setAppState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== habitId),
    }));
  };

  // Profile & Weight
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setAppState((prev) => ({
      ...prev,
      profile: updatedProfile,
    }));
  };

  const handleAddWeightRecord = (record: Omit<WeightRecord, 'id'>) => {
    const id = `weight-${Date.now()}`;
    setAppState((prev) => ({
      ...prev,
      weightHistory: [...prev.weightHistory, { ...record, id }],
    }));
  };

  const handleDeleteWeightRecord = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      weightHistory: prev.weightHistory.filter((w) => w.id !== id),
    }));
  };

  const handleQuickWeightSave = (newWeight: number, note?: string) => {
    handleAddWeightRecord({
      date: todayKey,
      weight: newWeight,
      tmb: fortnightStats.tmbEnd,
      note,
    });
    handleUpdateProfile({
      ...appState.profile,
      currentWeight: newWeight,
      updatedAt: new Date().toISOString(),
    });
  };

  // Mind & Soul Handlers
  const handleAddPractice = (practice: Omit<MindSoulPractice, 'id' | 'createdAt'>) => {
    const id = `msp-${Date.now()}`;
    const newPractice: MindSoulPractice = {
      ...practice,
      id,
      createdAt: new Date().toISOString(),
    };
    setAppState((prev) => ({
      ...prev,
      mindSoulPractices: [newPractice, ...(prev.mindSoulPractices || [])],
    }));
  };

  const handleUpdatePractice = (id: string, updates: Partial<MindSoulPractice>) => {
    setAppState((prev) => ({
      ...prev,
      mindSoulPractices: (prev.mindSoulPractices || []).map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  };

  const handleDeletePractice = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      mindSoulPractices: (prev.mindSoulPractices || []).filter((p) => p.id !== id),
    }));
  };

  const handleUpdateDailyMindSoulLog = (dateStr: string, updates: Partial<DailyMindSoulLog>) => {
    setAppState((prev) => {
      const currentLog = prev.mindSoulLogs?.[dateStr] || {
        date: dateStr,
        practices: {},
        dailyReflection: '',
      };
      return {
        ...prev,
        mindSoulLogs: {
          ...(prev.mindSoulLogs || {}),
          [dateStr]: {
            ...currentLog,
            ...updates,
          },
        },
      };
    });
  };

  const handleTogglePracticeCompletion = (dateStr: string, practiceId: string, durationMinutes?: number) => {
    setAppState((prev) => {
      const currentLog = prev.mindSoulLogs?.[dateStr] || {
        date: dateStr,
        practices: {},
        dailyReflection: '',
      };
      const currentEntry = currentLog.practices[practiceId] || { completed: false };
      const nextCompleted = !currentEntry.completed;

      return {
        ...prev,
        mindSoulLogs: {
          ...(prev.mindSoulLogs || {}),
          [dateStr]: {
            ...currentLog,
            practices: {
              ...currentLog.practices,
              [practiceId]: {
                ...currentEntry,
                completed: nextCompleted,
                durationMinutes: currentEntry.durationMinutes || durationMinutes || 15,
                completedAt: nextCompleted ? new Date().toISOString() : undefined,
              },
            },
          },
        },
      };
    });
  };

  const handleUpdatePracticeNotes = (dateStr: string, practiceId: string, notes: string) => {
    setAppState((prev) => {
      const currentLog = prev.mindSoulLogs?.[dateStr] || {
        date: dateStr,
        practices: {},
        dailyReflection: '',
      };
      const currentEntry = currentLog.practices[practiceId] || { completed: false };

      return {
        ...prev,
        mindSoulLogs: {
          ...(prev.mindSoulLogs || {}),
          [dateStr]: {
            ...currentLog,
            practices: {
              ...currentLog.practices,
              [practiceId]: {
                ...currentEntry,
                notes,
              },
            },
          },
        },
      };
    });
  };

  const handleUpdatePracticeDuration = (dateStr: string, practiceId: string, minutes: number) => {
    setAppState((prev) => {
      const currentLog = prev.mindSoulLogs?.[dateStr] || {
        date: dateStr,
        practices: {},
        dailyReflection: '',
      };
      const currentEntry = currentLog.practices[practiceId] || { completed: false };

      return {
        ...prev,
        mindSoulLogs: {
          ...(prev.mindSoulLogs || {}),
          [dateStr]: {
            ...currentLog,
            practices: {
              ...currentLog.practices,
              [practiceId]: {
                ...currentEntry,
                durationMinutes: minutes,
              },
            },
          },
        },
      };
    });
  };

  // Backup & Restore
  const handleExportData = () => {
    const jsonString = JSON.stringify(appState, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forge-backup-${formatDateKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr) as KairosAppState;
      if (parsed.profile && parsed.foods && parsed.workoutDivisions) {
        setAppState(parsed);
        alert('Dados importados com sucesso!');
      } else {
        alert('Arquivo de backup inválido.');
      }
    } catch (err) {
      alert('Erro ao processar o arquivo de importação.');
    }
  };

  const handleResetDemoData = () => {
    const seed = generateSeedData();
    setAppState(seed);
  };

  // If user is not authenticated, display the login & signup authentication screen
  if (!currentUser) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F3F4F6] flex flex-col font-sans selection:bg-amber-600 selection:text-white">
      {/* Top Header with Navigation Menu & User Dropdown */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setAnalyticsInitialSubTab(undefined);
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProfile={handleOpenProfileSettings}
        isDbConnected={isDbConnected}
        onRefreshFromDb={handleRefreshFromDb}
        isRefreshing={isRefreshingDb}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 md:py-8">
        {/* TAB 1: PLANNER DIÁRIO (DASHBOARD INICIAL - O DIA DE HOJE) */}
        {activeTab === 'dashboard' && (
          <DashboardView
            profile={appState.profile}
            streaks={appState.streaks}
            habits={appState.habits}
            todayRecord={todayRecord}
            todayMealPlan={todayMealPlan}
            todayWorkoutLog={todayWorkoutLog}
            activeWorkoutDivision={activeWorkoutDivision}
            workoutDivisions={appState.workoutDivisions}
            fortnightStats={fortnightStats}
            mindSoulPractices={appState.mindSoulPractices || []}
            todayMindSoulLog={todayMindSoulLog}
            onToggleHabit={(habitId, status) => handleToggleHabit(habitId, status)}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onAnswerAlcohol={(consumed) => handleAnswerAlcohol(consumed)}
            onAnswerDiet={(broke) => handleAnswerDiet(broke)}
            onToggleTodayWorkout={handleToggleTodayWorkout}
            onUpdateTodayWorkoutLog={handleUpdateTodayWorkoutLog}
            onUpdateDayRecord={handleUpdateDayRecord}
            setActiveTab={setActiveTab}
            onOpenQuickWeightModal={() => setIsQuickWeightOpen(true)}
          />
        )}

        {/* TAB 2: BANCO DE ALIMENTOS */}
        {activeTab === 'foods' && (
          <FoodDatabaseView
            foods={appState.foods}
            onAddFood={handleAddFood}
            onUpdateFood={handleUpdateFood}
            onDeleteFood={handleDeleteFood}
            onResetDefaultFoods={handleResetDefaultFoods}
          />
        )}

        {/* TAB 3: DIÁRIO ALIMENTAR */}
        {activeTab === 'nutrition' && (
          <NutritionTrackerView
            profile={appState.profile}
            foods={appState.foods}
            mealPlans={appState.mealPlans}
            onUpdateDailyMealPlan={handleUpdateDailyMealPlan}
            onBatchUpdateDailyMealPlans={handleBatchUpdateDailyMealPlans}
            onNavigateToFoodDatabase={() => setActiveTab('foods')}
          />
        )}

        {/* TAB 4: PLANILHA DE TREINO */}
        {activeTab === 'workouts' && (
          <WorkoutLogView
            workoutDivisions={appState.workoutDivisions}
            activeDivisionId={appState.activeWorkoutDivisionId}
            onSelectDivision={handleSelectDivision}
            onAddDivision={handleAddDivision}
            onUpdateDivision={handleUpdateDivision}
            onDeleteDivision={handleDeleteDivision}
            onAddExercise={handleAddExercise}
            onUpdateExercise={handleUpdateExercise}
            onDeleteExercise={handleDeleteExercise}
            todayWorkoutLog={todayWorkoutLog}
            onUpdateTodayWorkoutLog={handleUpdateTodayWorkoutLog}
          />
        )}

        {/* TAB 5: MINDSET (PRÁTICAS & DESENVOLVIMENTO) */}
        {activeTab === 'mindsoul' && (
          <MindSoulView
            practices={appState.mindSoulPractices || []}
            logs={appState.mindSoulLogs || {}}
            onAddPractice={handleAddPractice}
            onUpdatePractice={handleUpdatePractice}
            onDeletePractice={handleDeletePractice}
            onUpdateDailyLog={handleUpdateDailyMindSoulLog}
            onTogglePracticeCompletion={handleTogglePracticeCompletion}
            onUpdatePracticeNotes={handleUpdatePracticeNotes}
            onUpdatePracticeDuration={handleUpdatePracticeDuration}
          />
        )}

        {/* TAB 6: ANÁLISE QUINZENAL & PERFIL */}
        {activeTab === 'analytics' && (
          <AnalyticsProfileView
            profile={appState.profile}
            weightHistory={appState.weightHistory}
            habits={appState.habits}
            dailyRecords={appState.dailyRecords}
            workoutLogs={appState.workoutLogs}
            mealPlans={appState.mealPlans}
            streaks={appState.streaks}
            workoutDivisions={appState.workoutDivisions}
            mindSoulPractices={appState.mindSoulPractices || []}
            mindSoulLogs={appState.mindSoulLogs || {}}
            onUpdateProfile={handleUpdateProfile}
            onUpdateDayRecord={handleUpdateDayRecord}
            onUpdateWorkoutLog={handleUpdateTodayWorkoutLog}
            onAddWeightRecord={handleAddWeightRecord}
            onDeleteWeightRecord={handleDeleteWeightRecord}
            onOpenQuickWeightModal={() => setIsQuickWeightOpen(true)}
            onResetDemoData={handleResetDemoData}
            onExportData={handleExportData}
            onImportData={handleImportData}
            initialSubTab={analyticsInitialSubTab}
          />
        )}
      </main>

      {/* FORGE Stealth Industrial Footer */}
      <footer className="w-full border-t border-[#1F2430] py-4 px-4 sm:px-6 text-center text-xs text-[#9CA3AF] bg-[#090A0C]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="font-extrabold tracking-[0.15em] text-[#F3F4F6]">FORGE</span>
            <span className="text-[#6B7280]">·</span>
            <span className="tracking-wider uppercase text-[10px] text-[#9CA3AF]">BUILD YOURSELF</span>
          </span>
          <span className="text-[#6B7280]">Plataforma Industrial de Alta Performance</span>
        </div>
      </footer>

      {/* First Access / Metric Calibration Onboarding Modal */}
      {currentUser?.isFirstAccess && (
        <FirstAccessOnboardingModal
          initialProfile={appState.profile}
          userName={currentUser.name}
          onComplete={(updatedProfile) => {
            handleUpdateProfile(updatedProfile);
            authService.markFirstAccessCompleted(currentUser.id);
            setCurrentUser((prev) => (prev ? { ...prev, isFirstAccess: false } : null));
            fireDisciplineConfetti();
          }}
        />
      )}

      {/* Stoic Reset Streak Modal */}
      <ResetStreakModal
        isOpen={resetModalState.isOpen}
        type={resetModalState.type}
        targetDate={resetModalState.dateStr}
        onClose={() => setResetModalState({ isOpen: false, type: 'alcohol' })}
        onConfirmReset={handleConfirmResetStreak}
      />

      {/* Quick Weight Record Modal */}
      <QuickWeightModal
        isOpen={isQuickWeightOpen}
        onClose={() => setIsQuickWeightOpen(false)}
        profile={appState.profile}
        onSaveWeight={handleQuickWeightSave}
      />
    </div>
  );
}
