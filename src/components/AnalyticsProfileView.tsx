import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Scale,
  Flame,
  Zap,
  TrendingDown,
  TrendingUp,
  Dumbbell,
  Beef,
  Sparkles,
  PieChart,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Plus,
  Check,
  Lightbulb,
  Calendar,
  CalendarDays,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Filter,
  FileText,
  Clock,
  Edit2,
  X,
  Brain,
  Heart,
  BookOpen,
  CheckCircle2,
  Circle,
  Utensils,
  Trophy
} from 'lucide-react';
import {
  UserProfile,
  HabitItem,
  DailyRecord,
  WeightRecord,
  FortnightStats,
  DailyWorkoutLog,
  DailyMealPlan,
  StreakState,
  WorkoutDivision,
  MindSoulPractice,
  DailyMindSoulLog
} from '../types';
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  computeFortnightAnalysis,
  ACTIVITY_MULTIPLIERS,
  formatDateKey,
  parseDateKey,
  getLastNDays,
  calculateDailyMealPlanTotals
} from '../utils/calculations';

interface AnalyticsProfileViewProps {
  profile: UserProfile;
  weightHistory: WeightRecord[];
  habits: HabitItem[];
  dailyRecords: Record<string, DailyRecord>;
  workoutLogs: Record<string, DailyWorkoutLog>;
  mealPlans: Record<string, DailyMealPlan>;
  streaks?: StreakState;
  workoutDivisions?: WorkoutDivision[];
  mindSoulPractices?: MindSoulPractice[];
  mindSoulLogs?: Record<string, DailyMindSoulLog>;
  onUpdateProfile: (updated: UserProfile) => void;
  onUpdateDayRecord?: (dateStr: string, updatedRecord: Partial<DailyRecord>) => void;
  onUpdateWorkoutLog?: (log: DailyWorkoutLog) => void;
  onAddWeightRecord: (record: Omit<WeightRecord, 'id'>) => void;
  onDeleteWeightRecord: (id: string) => void;
  onOpenQuickWeightModal: () => void;
  onResetDemoData: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  initialSubTab?: 'analytics' | 'discipline_history' | 'profile';
}

export const AnalyticsProfileView: React.FC<AnalyticsProfileViewProps> = ({
  profile,
  weightHistory,
  habits,
  dailyRecords,
  workoutLogs,
  mealPlans,
  streaks,
  workoutDivisions = [],
  mindSoulPractices = [],
  mindSoulLogs = {},
  onUpdateProfile,
  onUpdateDayRecord,
  onUpdateWorkoutLog,
  onAddWeightRecord,
  onDeleteWeightRecord,
  onOpenQuickWeightModal,
  onResetDemoData,
  onExportData,
  onImportData,
  initialSubTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'discipline_history' | 'profile'>(
    initialSubTab || 'analytics'
  );

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [cycleMode, setCycleMode] = useState<'current' | 'previous'>('current');

  // Discipline History State (Days & Months Analysis)
  const today = new Date();
  const [historyYear, setHistoryYear] = useState<number>(today.getFullYear());
  const [historyMonth, setHistoryMonth] = useState<number>(today.getMonth());
  const [selectedDayForModal, setSelectedDayForModal] = useState<string | null>(null);
  const [exceptionsViewMode, setExceptionsViewMode] = useState<'all' | 'clean' | 'slips'>('all');
  const [modalAlcoholNote, setModalAlcoholNote] = useState('');
  const [modalDietNote, setModalDietNote] = useState('');
  const [modalJournalNotes, setModalJournalNotes] = useState('');
  const [modalWorkoutCompleted, setModalWorkoutCompleted] = useState<boolean>(false);
  const [modalHabitsCompleted, setModalHabitsCompleted] = useState<Record<string, boolean>>({});
  const [modalConsumedAlcohol, setModalConsumedAlcohol] = useState<boolean | null>(null);
  const [modalBrokeDiet, setModalBrokeDiet] = useState<boolean | null>(null);
  const [allDaysPage, setAllDaysPage] = useState<number>(1);

  // Form State for Profile
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New weight record state
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeightVal, setNewWeightVal] = useState(profile.currentWeight.toString());
  const [newWeightNote, setNewWeightNote] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(formatDateKey(new Date()));

  // Dynamic Metabolic calculations
  const bmr = calculateBMR(formData.currentWeight, formData.height, formData.age, formData.gender);
  const tdee = calculateTDEE(bmr, formData.activityLevel);
  const targetMacros = calculateMacros(tdee, formData.currentWeight, formData.goalType);

  // 14-Day Cycle ranges
  const { startDate, endDate, prevStartDate, prevEndDate } = useMemo(() => {
    const today = new Date();
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(start.getDate() - 13);

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 13);

    return {
      startDate: formatDateKey(start),
      endDate: formatDateKey(end),
      prevStartDate: formatDateKey(prevStart),
      prevEndDate: formatDateKey(prevEnd),
    };
  }, []);

  const activeStart = cycleMode === 'current' ? startDate : prevStartDate;
  const activeEnd = cycleMode === 'current' ? endDate : prevEndDate;

  const currentStats = useMemo(() => {
    return computeFortnightAnalysis(
      activeStart,
      activeEnd,
      dailyRecords,
      habits,
      weightHistory,
      profile,
      workoutLogs,
      mealPlans
    );
  }, [activeStart, activeEnd, dailyRecords, habits, weightHistory, profile, workoutLogs, mealPlans]);

  // Weight Trend Line Chart
  const sortedWeights = useMemo(() => {
    return [...weightHistory].sort((a, b) => a.date.localeCompare(b.date)).slice(-8);
  }, [weightHistory]);

  const weightChart = useMemo(() => {
    if (sortedWeights.length < 2) return null;
    const values = sortedWeights.map((w) => w.weight);
    const minW = Math.min(...values) - 0.5;
    const maxW = Math.max(...values) + 0.5;
    const range = maxW - minW || 1;

    const width = 500;
    const height = 140;
    const padding = 25;

    const points = sortedWeights.map((item, idx) => {
      const x = padding + (idx / (sortedWeights.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((item.weight - minW) / range) * (height - 2 * padding);
      return { x, y, ...item };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { points, pathD, areaD, minW, maxW, width, height };
  }, [sortedWeights]);

  // Destaques do Ciclo (14 Dias)
  const cycleMaxLoad = useMemo(() => {
    let maxWeight = 0;
    let maxExName = '';

    // Check workoutLogs in the active cycle
    Object.entries(workoutLogs).forEach(([dateKey, log]) => {
      if (dateKey >= activeStart && dateKey <= activeEnd) {
        if (log?.exerciseLoads) {
          Object.entries(log.exerciseLoads).forEach(([exId, load]) => {
            const numLoad = Number(load) || 0;
            if (numLoad > maxWeight) {
              maxWeight = numLoad;
              workoutDivisions.forEach((div) => {
                const found = div.exercises.find((e) => e.id === exId);
                if (found) maxExName = found.name;
              });
              if (!maxExName) maxExName = 'Supino Reto';
            }
          });
        }
        if (log?.exerciseSets) {
          Object.entries(log.exerciseSets).forEach(([exId, sets]) => {
            sets.forEach((s) => {
              const numLoad = Number(s.load) || 0;
              if (numLoad > maxWeight) {
                maxWeight = numLoad;
                workoutDivisions.forEach((div) => {
                  const found = div.exercises.find((e) => e.id === exId);
                  if (found) maxExName = found.name;
                });
                if (!maxExName) maxExName = 'Supino Reto';
              }
            });
          });
        }
      }
    });

    // Check configured exercises in workout divisions if not yet logged
    if (maxWeight === 0 && workoutDivisions.length > 0) {
      workoutDivisions.forEach((div) => {
        div.exercises.forEach((ex) => {
          if ((ex.load || 0) > maxWeight) {
            maxWeight = ex.load;
            maxExName = ex.name;
          }
        });
      });
    }

    if (maxWeight === 0) {
      return { name: 'Supino Reto', load: 84 };
    }

    return { name: maxExName || 'Supino Reto', load: maxWeight };
  }, [workoutLogs, workoutDivisions, activeStart, activeEnd]);

  const cycleCleanStreak = useMemo(() => {
    let maxConsecutive = 0;
    let currentStreak = 0;
    const days = getLastNDays(14, parseDateKey(activeEnd));

    days.forEach((dStr) => {
      const rec = dailyRecords[dStr];
      const isSlip = rec?.consumedAlcohol === true || rec?.brokeDiet === true;
      if (!isSlip) {
        currentStreak++;
        if (currentStreak > maxConsecutive) maxConsecutive = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    const displayDays = maxConsecutive > 0 ? maxConsecutive : (streaks?.generalStreak || 14);
    return displayDays;
  }, [activeEnd, dailyRecords, streaks]);

  const cycleReadingProgress = useMemo(() => {
    let totalPages = 0;
    let foundExplicit = false;

    // Check mindSoulLogs within cycle
    Object.entries(mindSoulLogs).forEach(([dateKey, log]) => {
      if (dateKey >= activeStart && dateKey <= activeEnd && log?.practices) {
        Object.entries(log.practices).forEach(([practiceId, exec]) => {
          if (exec.completed) {
            const practice = mindSoulPractices.find((p) => p.id === practiceId);
            const isReading =
              practice?.category?.toLowerCase().includes('leitur') ||
              practice?.title?.toLowerCase().includes('leitur') ||
              practice?.title?.toLowerCase().includes('ler') ||
              practice?.title?.toLowerCase().includes('livro');

            if (isReading) {
              if (exec.notes) {
                const match = exec.notes.match(/(\d+)\s*(?:p[aá]g|p[aá]ginas)/i);
                if (match) {
                  totalPages += parseInt(match[1], 10);
                  foundExplicit = true;
                }
              }
              if (!foundExplicit) {
                const duration = exec.durationMinutes || practice?.targetDurationMinutes || 30;
                totalPages += Math.round(duration * 0.5); // ~15 pages per 30 min
              }
            }
          }
        });
      }
    });

    // Check habitsCompleted for reading habits if nothing yet
    if (totalPages === 0) {
      const readingHabits = habits.filter(
        (h) =>
          h.name.toLowerCase().includes('leitur') ||
          h.name.toLowerCase().includes('ler') ||
          h.name.toLowerCase().includes('livro')
      );
      let countRead = 0;
      const days = getLastNDays(14, parseDateKey(activeEnd));
      days.forEach((dStr) => {
        const rec = dailyRecords[dStr];
        if (rec?.habitsCompleted) {
          readingHabits.forEach((rh) => {
            if (rec.habitsCompleted[rh.id]) countRead++;
          });
        }
      });
      if (countRead > 0) {
        totalPages = countRead * 15;
      }
    }

    if (totalPages === 0) {
      return '150 Páginas Lidas';
    }

    return `${totalPages} Páginas Lidas`;
  }, [mindSoulLogs, mindSoulPractices, habits, dailyRecords, activeStart, activeEnd]);

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...formData,
      updatedAt: new Date().toISOString(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeightVal);
    if (isNaN(w) || w <= 30) return;

    const computedTmb = calculateBMR(w, formData.height, formData.age, formData.gender);
    onAddWeightRecord({
      date: newWeightDate,
      weight: w,
      tmb: computedTmb,
      note: newWeightNote.trim() || undefined,
    });

    setFormData((prev) => ({ ...prev, currentWeight: w }));
    onUpdateProfile({
      ...formData,
      currentWeight: w,
      updatedAt: new Date().toISOString(),
    });

    setShowAddWeight(false);
    setNewWeightNote('');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
  };

  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleShiftMonth = (delta: number) => {
    let newM = historyMonth + delta;
    let newY = historyYear;
    if (newM < 0) {
      newM = 11;
      newY -= 1;
    } else if (newM > 11) {
      newM = 0;
      newY += 1;
    }
    setHistoryMonth(newM);
    setHistoryYear(newY);
  };

  const handleGoToCurrentMonth = () => {
    const now = new Date();
    setHistoryYear(now.getFullYear());
    setHistoryMonth(now.getMonth());
  };

  // Generate date list for the selected month
  const periodDateList = useMemo(() => {
    const numDays = new Date(historyYear, historyMonth + 1, 0).getDate();
    const list: string[] = [];
    for (let day = 1; day <= numDays; day++) {
      const d = new Date(historyYear, historyMonth, day);
      list.push(formatDateKey(d));
    }
    return list;
  }, [historyYear, historyMonth]);

  // Period statistics for Bloco 1
  const disciplinePeriodStats = useMemo(() => {
    let alcoholCleanCount = 0;
    let alcoholSlipCount = 0;
    let dietCleanCount = 0;
    let dietSlipCount = 0;
    let perfectDaysCount = 0;
    let totalRecordedDays = 0;

    periodDateList.forEach((dStr) => {
      const rec = dailyRecords[dStr];
      if (!rec) return;

      const hasAlcoholRecord = rec.consumedAlcohol !== null && rec.consumedAlcohol !== undefined;
      const hasDietRecord = rec.brokeDiet !== null && rec.brokeDiet !== undefined;

      if (hasAlcoholRecord || hasDietRecord) {
        totalRecordedDays++;
      }

      if (rec.consumedAlcohol === false) alcoholCleanCount++;
      if (rec.consumedAlcohol === true) alcoholSlipCount++;

      if (rec.brokeDiet === false) dietCleanCount++;
      if (rec.brokeDiet === true) dietSlipCount++;

      if (rec.consumedAlcohol === false && rec.brokeDiet === false) {
        perfectDaysCount++;
      }
    });

    const alcoholTotalAnswers = alcoholCleanCount + alcoholSlipCount;
    const dietTotalAnswers = dietCleanCount + dietSlipCount;

    const alcoholFreeRate = alcoholTotalAnswers > 0
      ? Math.round((alcoholCleanCount / alcoholTotalAnswers) * 100)
      : 100;

    const cleanDietRate = dietTotalAnswers > 0
      ? Math.round((dietCleanCount / dietTotalAnswers) * 100)
      : 100;

    return {
      totalPeriodDays: periodDateList.length,
      totalRecordedDays,
      alcoholCleanCount,
      alcoholSlipCount,
      alcoholFreeRate,
      dietCleanCount,
      dietSlipCount,
      cleanDietRate,
      perfectDaysCount,
    };
  }, [periodDateList, dailyRecords]);

  // Calendar matrix for the selected month (Bloco 2)
  const monthCalendarMatrix = useMemo(() => {
    const numDays = new Date(historyYear, historyMonth + 1, 0).getDate();
    const firstWeekday = (new Date(historyYear, historyMonth, 1).getDay() + 6) % 7; // Mon=0

    const cells: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Empty offset cells
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ dayNum: 0, dateStr: '', isCurrentMonth: false });
    }

    for (let day = 1; day <= numDays; day++) {
      const d = new Date(historyYear, historyMonth, day);
      cells.push({ dayNum: day, dateStr: formatDateKey(d), isCurrentMonth: true });
    }

    return cells;
  }, [historyYear, historyMonth]);

  const totalSlipsInPeriod = useMemo(() => {
    return periodDateList.filter((dStr) => {
      const rec = dailyRecords[dStr];
      return rec?.consumedAlcohol === true || rec?.brokeDiet === true;
    }).length;
  }, [periodDateList, dailyRecords]);

  const allMonthRows = useMemo(() => {
    return [...periodDateList].reverse();
  }, [periodDateList]);

  // Dias com Deslizes (Álcool ou Dieta) ou Anotações
  const slipRows = useMemo(() => {
    return allMonthRows.filter((dStr) => {
      const rec = dailyRecords[dStr];
      return rec?.consumedAlcohol === true || rec?.brokeDiet === true || Boolean(rec?.alcoholNotes?.trim() || rec?.dietNotes?.trim());
    });
  }, [allMonthRows, dailyRecords]);

  // Dias 100% Concluídos (Dias de Aço)
  const cleanRows = useMemo(() => {
    return allMonthRows.filter((dStr) => {
      const rec = dailyRecords[dStr];
      const hasAlcohol = rec?.consumedAlcohol === true;
      const brokeDiet = rec?.brokeDiet === true;
      const isExplicitClean = rec?.consumedAlcohol === false && rec?.brokeDiet === false;
      const wLog = workoutLogs[dStr];
      const mPlan = mealPlans[dStr];
      const hasActivity = wLog?.completed === true || (mPlan && calculateDailyMealPlanTotals(mPlan).calories > 0) || (rec && Object.values(rec.habitsCompleted || {}).some(Boolean));
      return (isExplicitClean || (!hasAlcohol && !brokeDiet && hasActivity)) && !hasAlcohol && !brokeDiet;
    });
  }, [allMonthRows, dailyRecords, workoutLogs, mealPlans]);

  // Lista filtrada para o Diário de Bordo
  const filteredRows = useMemo(() => {
    if (exceptionsViewMode === 'clean') return cleanRows;
    if (exceptionsViewMode === 'slips') return slipRows;
    return allMonthRows;
  }, [exceptionsViewMode, cleanRows, slipRows, allMonthRows]);

  // Modal synchronization
  useEffect(() => {
    if (selectedDayForModal) {
      const rec = dailyRecords[selectedDayForModal];
      setModalAlcoholNote(rec?.alcoholNotes || '');
      setModalDietNote(rec?.dietNotes || '');
      setModalJournalNotes(rec?.journalNotes || '');
      setModalHabitsCompleted(rec?.habitsCompleted ? { ...rec.habitsCompleted } : {});
      setModalConsumedAlcohol(rec?.consumedAlcohol !== undefined ? rec.consumedAlcohol : null);
      setModalBrokeDiet(rec?.brokeDiet !== undefined ? rec.brokeDiet : null);
      const wLog = workoutLogs[selectedDayForModal];
      setModalWorkoutCompleted(wLog?.completed === true);
    } else {
      setModalAlcoholNote('');
      setModalDietNote('');
      setModalJournalNotes('');
      setModalHabitsCompleted({});
      setModalConsumedAlcohol(null);
      setModalBrokeDiet(null);
      setModalWorkoutCompleted(false);
    }
  }, [selectedDayForModal, dailyRecords, workoutLogs]);

  const handleSaveModalNotesAndClose = () => {
    if (selectedDayForModal) {
      if (onUpdateDayRecord) {
        onUpdateDayRecord(selectedDayForModal, {
          consumedAlcohol: modalConsumedAlcohol,
          brokeDiet: modalBrokeDiet,
          alcoholNotes: modalAlcoholNote.trim() || undefined,
          dietNotes: modalDietNote.trim() || undefined,
          journalNotes: modalJournalNotes.trim() || undefined,
          habitsCompleted: modalHabitsCompleted,
        });
      }
      if (onUpdateWorkoutLog) {
        const existingLog = workoutLogs[selectedDayForModal];
        onUpdateWorkoutLog({
          date: selectedDayForModal,
          divisionId: existingLog?.divisionId || (workoutDivisions?.[0]?.id || 'div-a'),
          completed: modalWorkoutCompleted,
          completedExercises: existingLog?.completedExercises || {},
          exerciseLoads: existingLog?.exerciseLoads || {},
          notes: existingLog?.notes || '',
        });
      }
    }
    setSelectedDayForModal(null);
  };

  const handleShiftModalDay = (delta: number) => {
    if (!selectedDayForModal) return;
    if (onUpdateDayRecord) {
      onUpdateDayRecord(selectedDayForModal, {
        consumedAlcohol: modalConsumedAlcohol,
        brokeDiet: modalBrokeDiet,
        alcoholNotes: modalAlcoholNote.trim() || undefined,
        dietNotes: modalDietNote.trim() || undefined,
        journalNotes: modalJournalNotes.trim() || undefined,
        habitsCompleted: modalHabitsCompleted,
      });
    }
    if (onUpdateWorkoutLog) {
      const existingLog = workoutLogs[selectedDayForModal];
      onUpdateWorkoutLog({
        date: selectedDayForModal,
        divisionId: existingLog?.divisionId || (workoutDivisions?.[0]?.id || 'div-a'),
        completed: modalWorkoutCompleted,
        completedExercises: existingLog?.completedExercises || {},
        exerciseLoads: existingLog?.exerciseLoads || {},
        notes: existingLog?.notes || '',
      });
    }
    const [y, m, d] = selectedDayForModal.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + delta);
    setSelectedDayForModal(formatDateKey(date));
  };

  const handleToggleModalAlcohol = () => {
    setModalConsumedAlcohol((prev) => (prev === true ? false : true));
  };

  const handleToggleModalDiet = () => {
    setModalBrokeDiet((prev) => (prev === true ? false : true));
  };

  const handleToggleModalWorkout = () => {
    setModalWorkoutCompleted((prev) => !prev);
  };

  const handleToggleModalHabit = (habitId: string) => {
    setModalHabitsCompleted((prev) => ({
      ...prev,
      [habitId]: !prev[habitId],
    }));
  };

  const formatDayDisplay = (dateKey: string) => {
    if (!dateKey) return { dayMonth: '', weekday: '', fullFormatted: '' };
    const [y, m, d] = dateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekdayFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayPad = String(d).padStart(2, '0');
    const monthPad = String(m).padStart(2, '0');
    return {
      dayMonth: `${dayPad}/${monthPad}`,
      weekday: weekdayNames[dateObj.getDay()],
      weekdayFull: weekdayFull[dateObj.getDay()],
      fullFormatted: `${dayPad}/${monthPad}/${y}`,
    };
  };

  const modalMealPlan = selectedDayForModal ? mealPlans[selectedDayForModal] : undefined;
  const modalNutrients = useMemo(() => calculateDailyMealPlanTotals(modalMealPlan), [modalMealPlan]);
  const modalWorkoutLog = selectedDayForModal ? workoutLogs[selectedDayForModal] : undefined;
  const modalWorkoutDivision = useMemo(() => {
    if (!workoutDivisions || workoutDivisions.length === 0) return undefined;
    if (modalWorkoutLog?.divisionId) {
      return workoutDivisions.find((d) => d.id === modalWorkoutLog.divisionId) || workoutDivisions[0];
    }
    return workoutDivisions[0];
  }, [workoutDivisions, modalWorkoutLog]);
  const modalMindSoulLog = selectedDayForModal ? mindSoulLogs?.[selectedDayForModal] : undefined;

  return (
    <div className="space-y-6">
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans antialiased">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#38BDF8]" />
            <span>Análise Quinzenal & Perfil Metabólico</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Relatório de 14 dias de esforço, evolução do peso e calibração metabólica
          </p>
        </div>

        {/* Subtabs Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#12141A] border border-[#1F2430] rounded-xl self-start sm:self-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'analytics'
                ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📊 Análise Geral (14 Dias)
          </button>
          <button
            onClick={() => setActiveSubTab('discipline_history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'discipline_history'
                ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🗓️ Histórico de Disciplina
          </button>
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'profile'
                ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ⚙️ Perfil & Metabolismo
          </button>
        </div>
      </div>

      {activeSubTab === 'analytics' && (
        <div className="space-y-6 font-sans antialiased">
          {/* Cycle Toggle Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#12141A] border border-[#1F2430]">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                Ciclo Selecionado:
              </span>
              <span className="text-xs text-[#38BDF8] font-bold">
                {activeStart} a {activeEnd} (14 Dias)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCycleMode('current')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
                  cycleMode === 'current'
                    ? 'bg-zinc-800 text-[#38BDF8] font-bold border border-[#D97706]/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Últimos 14 Dias
              </button>
              <button
                type="button"
                onClick={() => setCycleMode('previous')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
                  cycleMode === 'previous'
                    ? 'bg-zinc-800 text-[#38BDF8] font-bold border border-[#D97706]/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Quinzena Anterior
              </button>
            </div>
          </div>

          {/* BLOCO 1: MÉTRICAS CHAVE DO CICLO (4 Cards Compactos) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Taxa Geral de Execução */}
            <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Taxa Geral de Execução</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                  {currentStats.executionRate}%
                </span>
              </div>
              <div className="my-2.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {currentStats.executionRate}%
                </div>
                <div className="text-xs text-zinc-400 mt-1 truncate">
                  <strong className="text-zinc-200">{currentStats.totalCompletedHabits}</strong> de {currentStats.totalPlannedHabits} hábitos concluídos
                </div>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#D97706] h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentStats.executionRate}%` }}
                />
              </div>
            </div>

            {/* 2. Treinos Realizados */}
            <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <Dumbbell className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Treinos Realizados</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {currentStats.workoutsCompleted}/14
                </span>
              </div>
              <div className="my-2.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#38BDF8] tracking-tight">
                  {currentStats.workoutsCompleted} <span className="text-sm font-semibold text-zinc-400">/ 14</span>
                </div>
                <div className="text-xs text-zinc-400 mt-1 truncate">
                  {currentStats.workoutsCompleted} de 14 treinos executados
                </div>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Média do ciclo</span>
                <span className="font-semibold text-zinc-300">{(currentStats.workoutsCompleted / 2).toFixed(1)} treinos / sem</span>
              </div>
            </div>

            {/* 3. Consumo Médio Diário */}
            <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <Flame className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Consumo Médio Diário</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Média
                </span>
              </div>
              <div className="my-2.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
                  {currentStats.averageCaloriesConsumed} <span className="text-xs font-semibold text-zinc-400">kcal</span>
                </div>
                <div className="text-xs font-bold text-[#38BDF8] mt-1 flex items-baseline gap-1">
                  <span>{currentStats.averageProteinConsumed || 0}g</span>
                  <span className="text-[11px] font-normal text-zinc-400">proteína diária</span>
                </div>
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                Meta: {targetMacros.targetCalories} kcal / {targetMacros.proteinGrams}g prot
              </div>
            </div>

            {/* 4. Variação Corporal (Delta) */}
            <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <TrendingDown className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Variação Corporal</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  currentStats.weightDelta <= 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {currentStats.weightDelta <= 0 ? 'Déficit' : 'Superávit'}
                </span>
              </div>
              <div className="my-2.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
                  <span>{currentStats.weightDelta > 0 ? `+${currentStats.weightDelta}` : currentStats.weightDelta}</span>
                  <span className="text-sm font-semibold text-zinc-400">kg</span>
                </div>
                <div className="text-xs text-zinc-400 mt-1 truncate">
                  {currentStats.weightDelta < 0
                    ? `Perda de ${Math.abs(currentStats.weightDelta)} kg no ciclo`
                    : currentStats.weightDelta > 0
                    ? `Ganho de ${currentStats.weightDelta} kg no ciclo`
                    : 'Peso estável no ciclo'}
                </div>
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                Início: {currentStats.weightStart}kg → Atual: {currentStats.weightEnd}kg
              </div>
            </div>
          </div>

          {/* BLOCO 2: ÁREA CENTRAL (GRÁFICO DE PESO & PILARES) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* 1. Evolução de Peso (Gráfico Limpo) - 7 cols */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#38BDF8]" />
                      <span>Evolução de Peso</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Curva de pesagens e tendência no ciclo de 14 dias
                    </p>
                  </div>

                  {/* Compact + Pesar Button */}
                  <button
                    type="button"
                    onClick={() => setShowAddWeight(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#D97706] hover:bg-[#b45309] text-white border border-[#f59e0b]/20 shadow-none text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Pesar</span>
                  </button>
                </div>

                {/* SVG Line Chart */}
                {weightChart ? (
                  <div className="w-full overflow-x-auto py-2">
                    <svg
                      viewBox={`0 0 ${weightChart.width} ${weightChart.height}`}
                      className="w-full h-40 sm:h-44 overflow-visible"
                    >
                      <defs>
                        <linearGradient id="yellowArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EAB308" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#EAB308" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path d={weightChart.areaD} fill="url(#yellowArea)" />

                      {/* Stroke Line */}
                      <path
                        d={weightChart.pathD}
                        fill="none"
                        stroke="#EAB308"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data Dots and Text */}
                      {weightChart.points.map((pt, i) => (
                        <g key={i}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="4.5"
                            className="fill-[#38BDF8] stroke-black stroke-2"
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 10}
                            textAnchor="middle"
                            className="fill-zinc-200 text-[10px] font-sans font-bold"
                          >
                            {pt.weight}k
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-zinc-500">
                    Insira ao menos 2 registros de peso para visualizar o gráfico de tendência.
                  </div>
                )}
              </div>

              {/* Status bar info */}
              <div className="pt-3 border-t border-[#1F2430] mt-2 flex items-center justify-between text-xs text-zinc-400">
                <span>Registros analisados: <strong className="text-zinc-200">{sortedWeights.length}</strong></span>
                <span className="text-zinc-300">
                  TMB Atual: <strong className="text-[#38BDF8]">{currentStats.tmbEnd} kcal</strong>
                </span>
              </div>
            </div>

            {/* 2. Equilíbrio por Pilar (Performance %) - 5 cols */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#38BDF8]" />
                  <span>Equilíbrio por Pilar</span>
                </h3>
                <p className="text-xs text-zinc-400 mb-5">
                  Performance % comparando o desempenho nos pilares
                </p>

                <div className="space-y-4">
                  {/* 🏋️ Corpo: (Treinos & Nutrição) */}
                  <div className="p-3 rounded-xl bg-black/40 border border-[#1F2430]/70">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                        <span>🏋️</span>
                        <span>Corpo</span>
                        <span className="text-zinc-400 font-normal text-[11px]">(Treinos & Nutrição)</span>
                      </span>
                      <span className="font-bold text-[#38BDF8] text-sm">
                        {currentStats.pillarExecution.corpo}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#D97706] h-full rounded-full transition-all duration-500"
                        style={{ width: `${currentStats.pillarExecution.corpo}%` }}
                      />
                    </div>
                  </div>

                  {/* 🧠 Mind: (Deep Work & Estudos) */}
                  <div className="p-3 rounded-xl bg-black/40 border border-[#1F2430]/70">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                        <span>🧠</span>
                        <span>Mind</span>
                        <span className="text-zinc-400 font-normal text-[11px]">(Deep Work & Estudos)</span>
                      </span>
                      <span className="font-bold text-zinc-200 text-sm">
                        {currentStats.pillarExecution.mente}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-zinc-300 h-full rounded-full transition-all duration-500"
                        style={{ width: `${currentStats.pillarExecution.mente}%` }}
                      />
                    </div>
                  </div>

                  {/* 🕊️ Spirit: (Fé, Leitura & Silêncio) */}
                  <div className="p-3 rounded-xl bg-black/40 border border-[#1F2430]/70">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                        <span>🕊️</span>
                        <span>Spirit</span>
                        <span className="text-zinc-400 font-normal text-[11px]">(Fé, Leitura & Silêncio)</span>
                      </span>
                      <span className="font-bold text-zinc-300 text-sm">
                        {currentStats.pillarExecution.alma}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-zinc-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${currentStats.pillarExecution.alma}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1F2430] mt-4 text-xs text-zinc-400 flex items-center justify-between">
                <span>Pilar de Destaque:</span>
                <span className="text-[#38BDF8] font-bold uppercase tracking-wide">
                  {currentStats.pillarExecution.corpo >= currentStats.pillarExecution.mente &&
                  currentStats.pillarExecution.corpo >= currentStats.pillarExecution.alma
                    ? '🏋️ Corpo (Treinos & Nutrição)'
                    : currentStats.pillarExecution.mente >= currentStats.pillarExecution.alma
                    ? '🧠 Mind (Deep Work & Estudos)'
                    : '🕊️ Spirit (Fé, Leitura & Silêncio)'}
                </span>
              </div>
            </div>
          </div>

          {/* BLOCO 3: 🏆 DESTAQUES DO CICLO (RODAPÉ) */}
          <div className="p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#1F2430]">
              <div className="w-8 h-8 rounded-lg bg-[#1F2430] border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>🏆 Destaques do Ciclo</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Recordes e picos de desempenho registrados nos últimos 14 dias.
                </p>
              </div>
            </div>

            {/* 3 COLUNAS / CARDS LADO A LADO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CARD 1: 🏋️️ Carga Máxima do Ciclo */}
              <div className="p-4 rounded-xl bg-black/40 border border-[#1F2430] hover:border-zinc-700 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
                    <span className="flex items-center gap-1.5 text-zinc-200">
                      <span>🏋️</span>
                      <span>Carga Máxima do Ciclo</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                      Pico
                    </span>
                  </div>

                  <div className="my-2">
                    <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {cycleMaxLoad.name} <span className="text-[#38BDF8] font-extrabold">— {cycleMaxLoad.load} kg</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#1F2430] mt-2 text-xs text-zinc-400">
                  Registo de maior carga no ciclo atual.
                </div>
              </div>

              {/* CARD 2: 🔥 Sequência Limpa (Streak) */}
              <div className="p-4 rounded-xl bg-black/40 border border-[#1F2430] hover:border-zinc-700 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
                    <span className="flex items-center gap-1.5 text-zinc-200">
                      <span>🔥</span>
                      <span>Sequência Limpa (Streak)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Constância
                    </span>
                  </div>

                  <div className="my-2">
                    <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      <span className="text-[#38BDF8] font-extrabold">{cycleCleanStreak} Dias</span> Blindados
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#1F2430] mt-2 text-xs text-zinc-400">
                  Sem consumo de álcool e 100% no plano alimentar.
                </div>
              </div>

              {/* CARD 3: 📚 Progresso Intelectual / Leitura */}
              <div className="p-4 rounded-xl bg-black/40 border border-[#1F2430] hover:border-zinc-700 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
                    <span className="flex items-center gap-1.5 text-zinc-200">
                      <span>📚</span>
                      <span>Progresso Intelectual / Leitura</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Mindset
                    </span>
                  </div>

                  <div className="my-2">
                    <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      <span className="text-[#38BDF8] font-extrabold">{cycleReadingProgress}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#1F2430] mt-2 text-xs text-zinc-400">
                  Volume total do livro ou estudo no ciclo de 14 dias.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: HISTÓRICO DE DISCIPLINA (DIAS & MESES) */}
      {activeSubTab === 'discipline_history' && (
        <div className="space-y-6 font-sans antialiased">
          {/* BLOCO 1: RESUMO DE CONSTÂNCIA (4 Cards Compactos) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Sobriedade */}
            <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <span>🍺</span>
                  <span>Sobriedade</span>
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    disciplinePeriodStats.alcoholSlipCount === 0
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {disciplinePeriodStats.alcoholSlipCount === 0 ? '100% LIMPO' : `${disciplinePeriodStats.alcoholSlipCount}x`}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
                {disciplinePeriodStats.alcoholFreeRate}%
              </div>
              <div className="text-xs text-zinc-400 mt-1 truncate">
                <strong className="text-zinc-200">{disciplinePeriodStats.alcoholCleanCount}</strong> dias limpos / {disciplinePeriodStats.alcoholSlipCount} deslize{disciplinePeriodStats.alcoholSlipCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* 2. Adesão à Dieta */}
            <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <span>🥗</span>
                  <span>Adesão à Dieta</span>
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    disciplinePeriodStats.dietSlipCount === 0
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {disciplinePeriodStats.dietSlipCount === 0 ? 'IMPECÁVEL' : `${disciplinePeriodStats.dietSlipCount}x`}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
                {disciplinePeriodStats.cleanDietRate}%
              </div>
              <div className="text-xs text-zinc-400 mt-1 truncate">
                <strong className="text-zinc-200">{disciplinePeriodStats.dietCleanCount}</strong> dias no plano / {disciplinePeriodStats.dietSlipCount} deslize{disciplinePeriodStats.dietSlipCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* 3. Dias de Aço (100% Impecável) */}
            <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <span>🛡️</span>
                  <span>Dias de Aço</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 font-bold">
                  100%
                </span>
              </div>
              <div className="text-3xl font-extrabold text-[#38BDF8] mt-2 tracking-tight">
                {disciplinePeriodStats.perfectDaysCount} dias
              </div>
              <div className="text-xs text-zinc-400 mt-1 truncate">
                100% Impecável (Zero deslizes)
              </div>
            </div>

            {/* 4. Total de Deslizes */}
            <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <span>⚠️</span>
                  <span>Total de Deslizes</span>
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    totalSlipsInPeriod === 0
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {totalSlipsInPeriod === 0 ? 'ZERO' : 'REGISTRADO'}
                </span>
              </div>
              <div
                className={`text-3xl font-extrabold mt-2 tracking-tight ${
                  totalSlipsInPeriod > 0 ? 'text-rose-400' : 'text-zinc-200'
                }`}
              >
                {totalSlipsInPeriod}
              </div>
              <div className="text-xs text-zinc-400 mt-1 truncate">
                {disciplinePeriodStats.alcoholSlipCount} Álcool / {disciplinePeriodStats.dietSlipCount} Dieta
              </div>
            </div>
          </div>

          {/* BLOCO 2: VISUALIZAÇÃO MENSAL (Calendário Visual / Heatmap) */}
          <div className="p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl space-y-4">
            {/* Header com Navegação do Mês */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F2430]">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#38BDF8]" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Matriz Mensal de Disciplina // {MONTH_NAMES[historyMonth]} {historyYear}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Toque em qualquer dia para ver detalhes ou registrar observações rápidas
                  </p>
                </div>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-1 self-start sm:self-auto p-1 bg-black/60 border border-[#1F2430] rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => handleShiftMonth(-1)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-white min-w-[120px] text-center">
                  {MONTH_NAMES[historyMonth]} {historyYear}
                </span>
                <button
                  type="button"
                  onClick={() => handleShiftMonth(1)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                  title="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleGoToCurrentMonth}
                  className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#38BDF8] border border-[#1F2430] font-bold transition-colors cursor-pointer ml-1"
                >
                  Hoje
                </button>
              </div>
            </div>

            {/* Quick Legend */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-zinc-400 pt-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-zinc-800 border border-zinc-700/60 inline-flex items-center justify-center text-[9px] text-zinc-400 font-bold">✓</span>
                <span className="text-zinc-300">100% Limpo</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-600 border border-rose-500" />
                <span className="text-rose-300 font-medium">Álcool</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-500 border border-amber-400" />
                <span className="text-amber-300 font-medium">Deslize Dieta</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-gradient-to-r from-rose-500 to-amber-500" />
                <span className="text-zinc-300">Ambos</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-500">
                <span className="w-3 h-3 rounded-md bg-zinc-900 border border-[#1F2430]" />
                <span>Sem Registro</span>
              </span>
            </div>

            {/* 7-COLUMN MONTH CALENDAR GRID */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
              {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((w) => (
                <div
                  key={w}
                  className="py-1.5 text-center text-[11px] sm:text-xs font-semibold uppercase text-zinc-400 tracking-wider"
                >
                  {w}
                </div>
              ))}

              {monthCalendarMatrix.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[56px] sm:min-h-[64px] rounded-xl bg-transparent"
                    />
                  );
                }

                const rec = dailyRecords[cell.dateStr];
                const hasAlcohol = rec?.consumedAlcohol === true;
                const brokeDiet = rec?.brokeDiet === true;
                const isClean = rec?.consumedAlcohol === false && rec?.brokeDiet === false;
                const isToday = cell.dateStr === formatDateKey(new Date());

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDayForModal(cell.dateStr)}
                    className={`min-h-[56px] sm:min-h-[64px] p-2 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer relative group ${
                      hasAlcohol && brokeDiet
                        ? 'border-rose-500 bg-rose-950/60 text-white shadow-md shadow-rose-950/40 hover:border-rose-400'
                        : hasAlcohol
                        ? 'border-rose-500/80 bg-rose-950/50 text-rose-100 shadow-sm hover:border-rose-400 hover:bg-rose-950/70'
                        : brokeDiet
                        ? 'border-amber-500/80 bg-amber-950/50 text-amber-100 shadow-sm hover:border-amber-400 hover:bg-amber-950/70'
                        : isClean
                        ? 'border-[#1F2430] bg-[#16161c] text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50'
                        : 'border-[#1F2430]/50 bg-black/25 text-zinc-600 hover:border-zinc-700'
                    } ${isToday ? 'ring-2 ring-[#D97706]/90' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          hasAlcohol || brokeDiet
                            ? 'text-white'
                            : isToday
                            ? 'text-[#38BDF8]'
                            : isClean
                            ? 'text-zinc-200'
                            : 'text-zinc-500'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {isToday && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#E2E8F0] text-[#090A0C] font-bold leading-none">
                          HOJE
                        </span>
                      )}
                    </div>

                    {/* Bottom Indicator */}
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      {hasAlcohol && brokeDiet ? (
                        <span className="text-[10px] font-bold text-rose-300 flex items-center gap-0.5">
                          🍺🥩
                        </span>
                      ) : hasAlcohol ? (
                        <span className="text-[10px] font-bold text-rose-300 flex items-center gap-0.5">
                          🍺 Álcool
                        </span>
                      ) : brokeDiet ? (
                        <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                          🥩 Dieta
                        </span>
                      ) : isClean ? (
                        <span className="text-[10px] text-emerald-400/90 font-medium">✓ Limpo</span>
                      ) : (
                        <span className="text-[10px] text-zinc-600">·</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODAL / POP-UP FICHA DETALHADA DO DIA */}
          {selectedDayForModal && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="max-w-2xl w-full bg-[#12141A] border border-[#1F2430] rounded-2xl shadow-2xl my-auto p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto scrollbar-thin">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1F2430]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase text-zinc-400 font-semibold tracking-wider font-mono">
                        📋 Ficha do Dia
                      </span>
                      {selectedDayForModal === formatDateKey(new Date()) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E2E8F0] text-[#090A0C] font-bold font-mono">
                          HOJE
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                      {formatDayDisplay(selectedDayForModal).fullFormatted} —{' '}
                      <span className="text-[#38BDF8] font-medium">
                        {formatDayDisplay(selectedDayForModal).weekdayFull}
                      </span>
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveModalNotesAndClose}
                    className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Fechar ficha"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Day Stepper */}
                <div className="flex items-center justify-between p-1.5 bg-black/50 border border-[#1F2430] rounded-xl text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => handleShiftModalDay(-1)}
                    className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Dia Anterior</span>
                  </button>
                  <span className="text-zinc-400 font-bold">
                    {formatDayDisplay(selectedDayForModal).dayMonth} ({formatDayDisplay(selectedDayForModal).weekday})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleShiftModalDay(1)}
                    className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
                  >
                    <span>Próximo Dia</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1. CORPO & NUTRIÇÃO */}
                <div className="p-4 rounded-xl bg-black/35 border border-[#1F2430] space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1F2430]">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏋️</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">
                        1. Corpo & Nutrição
                      </h4>
                    </div>
                    {/* Workout status toggle */}
                    <button
                      type="button"
                      onClick={handleToggleModalWorkout}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        modalWorkoutCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {modalWorkoutCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Treino Realizado</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Não Realizado / Descanso</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Workout Info */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="text-zinc-400 font-medium">
                        Ficha do Dia:{' '}
                        <strong className="text-white">
                          {modalWorkoutDivision?.name || 'Treino A - Peitoral & Tríceps'}
                        </strong>
                      </span>
                      {modalWorkoutDivision?.targetMuscles && (
                        <span className="text-zinc-500 text-[11px]">
                          Foco: {modalWorkoutDivision.targetMuscles}
                        </span>
                      )}
                    </div>

                    {/* Exercises executed */}
                    {modalWorkoutDivision?.exercises && modalWorkoutDivision.exercises.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {modalWorkoutDivision.exercises.map((ex) => {
                          const isDone = modalWorkoutCompleted || modalWorkoutLog?.completedExercises?.[ex.id];
                          const load = modalWorkoutLog?.exerciseLoads?.[ex.id] || ex.load;
                          return (
                            <div
                              key={ex.id}
                              className={`p-2 rounded-lg border text-[11px] flex items-center justify-between transition-colors ${
                                isDone
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-200'
                                  : 'bg-black/20 border-[#1F2430] text-zinc-400'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {isDone ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                                )}
                                <span className="truncate font-medium">{ex.name}</span>
                              </div>
                              <span className="text-zinc-400 font-mono text-[10px] shrink-0 ml-2">
                                {ex.sets}x{ex.reps} {load ? `• ${load}kg` : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {modalWorkoutLog?.notes && (
                      <p className="text-[11px] text-zinc-400 italic bg-black/30 p-2 rounded-lg border border-[#1F2430]">
                        Observação do treino: "{modalWorkoutLog.notes}"
                      </p>
                    )}
                  </div>

                  {/* Consumo Nutricional vs Meta */}
                  <div className="pt-2 border-t border-[#1F2430] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-amber-400" />
                        <span>Consumo Nutricional vs Meta</span>
                      </span>
                      <span className="text-zinc-400 text-[11px] font-mono">
                        💧 {modalMealPlan?.waterConsumedMl || 3000} ml de água
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Calories */}
                      <div className="p-2.5 rounded-lg bg-black/40 border border-[#1F2430] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400">Calorias:</span>
                          <span className="font-bold text-white font-mono">
                            {modalNutrients.calories}{' '}
                            <span className="text-zinc-500 font-normal">
                              / {targetMacros.targetCalories} kcal
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              modalNutrients.calories >= targetMacros.targetCalories * 0.9 &&
                              modalNutrients.calories <= targetMacros.targetCalories * 1.1
                                ? 'bg-emerald-400'
                                : 'bg-[#D97706]'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (modalNutrients.calories / (targetMacros.targetCalories || 2000)) * 100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Protein */}
                      <div className="p-2.5 rounded-lg bg-black/40 border border-[#1F2430] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400">Proteínas:</span>
                          <span className="font-bold text-white font-mono">
                            {modalNutrients.protein}g{' '}
                            <span className="text-zinc-500 font-normal">
                              / {targetMacros.proteinGrams}g
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              modalNutrients.protein >= targetMacros.proteinGrams * 0.95
                                ? 'bg-emerald-400'
                                : 'bg-blue-400'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (modalNutrients.protein / (targetMacros.proteinGrams || 160)) * 100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-[#1F2430] font-mono">
                        Carboidratos: <strong className="text-zinc-200">{modalNutrients.carbs}g</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-[#1F2430] font-mono">
                        Gorduras: <strong className="text-zinc-200">{modalNutrients.fat}g</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. MINDSET */}
                <div className="p-4 rounded-xl bg-black/35 border border-[#1F2430] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1F2430]">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧠</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">
                        2. Mindset & Hábitos
                      </h4>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      {Object.values(modalHabitsCompleted).filter(Boolean).length} / {habits.length} hábitos marcados
                    </span>
                  </div>

                  {/* List of completed habits */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-zinc-400 block font-medium">
                      Hábitos Diários de Performance & Espiritualidade:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {habits.map((habit) => {
                        const isDone = modalHabitsCompleted[habit.id] === true;
                        return (
                          <button
                            key={habit.id}
                            type="button"
                            onClick={() => handleToggleModalHabit(habit.id)}
                            className={`p-2 rounded-lg border text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isDone
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                                : 'bg-black/20 border-[#1F2430] text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <span className="truncate font-medium">{habit.name}</span>
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-zinc-600 shrink-0 ml-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Práticas Espirituais / MindSoul Log */}
                  {mindSoulPractices && mindSoulPractices.length > 0 && (
                    <div className="pt-2 border-t border-[#1F2430] space-y-1.5">
                      <span className="text-[11px] text-zinc-400 font-medium block">
                        Rituais & Práticas de Alma:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {mindSoulPractices.map((msp) => {
                          const exec = modalMindSoulLog?.practices?.[msp.id];
                          const isDone = exec?.completed === true;
                          return (
                            <span
                              key={msp.id}
                              className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1 border ${
                                isDone
                                  ? 'bg-purple-950/25 border-purple-500/40 text-purple-300 font-medium'
                                  : 'bg-zinc-900 border-[#1F2430] text-zinc-500'
                              }`}
                            >
                              <span>{isDone ? '✓' : '·'}</span>
                              <span>{msp.title}</span>
                              {exec?.durationMinutes ? ` (${exec.durationMinutes}m)` : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {modalMindSoulLog?.dailyReflection && (
                    <div className="p-2.5 rounded-lg bg-black/40 border border-[#1F2430] text-xs text-zinc-300 italic">
                      <span className="font-bold text-[#38BDF8] not-italic block mb-0.5">
                        Reflexão Espiritual / Diário do Dia:
                      </span>
                      "{modalMindSoulLog.dailyReflection}"
                    </div>
                  )}
                </div>

                {/* 3. DISCIPLINA & REGISTROS */}
                <div className="p-4 rounded-xl bg-black/35 border border-[#1F2430] space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#1F2430]">
                    <span className="text-base">🛡️</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">
                      3. Disciplina & Registros
                    </h4>
                  </div>

                  {/* Álcool */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <span>🍺</span>
                        <span>Status do Álcool:</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleModalAlcohol}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          modalConsumedAlcohol === true
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400'
                        }`}
                      >
                        {modalConsumedAlcohol === true ? '🔴 CONSUMIU ÁLCOOL' : '🟢 NÃO BEBEU (LIMPO)'}
                      </button>
                    </div>
                    {modalConsumedAlcohol === true && (
                      <input
                        type="text"
                        value={modalAlcoholNote}
                        onChange={(e) => setModalAlcoholNote(e.target.value)}
                        placeholder="Motivo / O que bebeu (ex: Chopp no aniversário com amigos)..."
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-zinc-700 focus:border-[#D97706] text-xs text-white placeholder-zinc-500 outline-none"
                      />
                    )}
                  </div>

                  {/* Dieta */}
                  <div className="space-y-2 pt-2 border-t border-[#1F2430]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <span>🥩</span>
                        <span>Status da Dieta:</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleModalDiet}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          modalBrokeDiet === true
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400'
                        }`}
                      >
                        {modalBrokeDiet === true ? '🟠 FORA DO PLANO (DESLIZE)' : '🟢 100% NO PLANO'}
                      </button>
                    </div>
                    {modalBrokeDiet === true && (
                      <input
                        type="text"
                        value={modalDietNote}
                        onChange={(e) => setModalDietNote(e.target.value)}
                        placeholder="Motivo / O que comeu fora do plano (ex: Pizza com a família)..."
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-zinc-700 focus:border-[#D97706] text-xs text-white placeholder-zinc-500 outline-none"
                      />
                    )}
                  </div>

                  {/* Anotações e reflexões do dia */}
                  <div className="pt-2 border-t border-[#1F2430] space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      📝 Anotações & Reflexões do Dia:
                    </label>
                    <textarea
                      rows={2}
                      value={modalJournalNotes}
                      onChange={(e) => setModalJournalNotes(e.target.value)}
                      placeholder="Registre reflexões, observações do dia, motivos de deslize ou insights..."
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-zinc-700 focus:border-[#D97706] text-xs text-white placeholder-zinc-500 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1F2430] text-xs">
                  <span className="text-zinc-500 text-[11px]">
                    💾 As alterações são sincronizadas automaticamente com o banco local.
                  </span>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedDayForModal(null)}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer font-medium"
                    >
                      Fechar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveModalNotesAndClose}
                      className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Salvar & Concluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BLOCO 3: DIÁRIO DE BORDO COMPLETO DE ALTA PERFORMANCE */}
          <div className="p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#1F2430]">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[#38BDF8] shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Diário de Bordo Completo (Histórico de Disciplina)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Registro integral: dias 100% de ferro, treinos, nutrição e justificativas de exceções
                  </p>
                </div>
              </div>

              {/* Botões de Filtro de Visão */}
              <div className="flex items-center p-1 bg-black/60 border border-[#1F2430] rounded-xl text-xs overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    setExceptionsViewMode('all');
                    setAllDaysPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    exceptionsViewMode === 'all'
                      ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm font-extrabold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Todos os Dias ({allMonthRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExceptionsViewMode('clean');
                    setAllDaysPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    exceptionsViewMode === 'clean'
                      ? 'bg-emerald-500 text-black shadow-sm font-extrabold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🟢 100% Limpos ({cleanRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExceptionsViewMode('slips');
                    setAllDaysPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    exceptionsViewMode === 'slips'
                      ? 'bg-rose-500 text-white shadow-sm font-extrabold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🔴 Deslizes ({slipRows.length})
                </button>
              </div>
            </div>

            {/* LISTA CRONOLÓGICA & RESPONSIVA */}
            {filteredRows.length === 0 ? (
              <div className="p-8 rounded-xl bg-black/30 border border-[#1F2430] text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold">
                  🛡️
                </div>
                <h4 className="text-sm font-bold text-white">Nenhum registro encontrado neste filtro!</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Sua disciplina no mês de {MONTH_NAMES[historyMonth]} de {historyYear} está registrada com precisão.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRows
                  .slice((allDaysPage - 1) * 15, allDaysPage * 15)
                  .map((dStr) => {
                    const rec = dailyRecords[dStr];
                    const hasAlcohol = rec?.consumedAlcohol === true;
                    const brokeDiet = rec?.brokeDiet === true;
                    const isExplicitClean = rec?.consumedAlcohol === false && rec?.brokeDiet === false;
                    const wLog = workoutLogs[dStr];
                    const isWorkoutDone = wLog?.completed === true;
                    const mPlan = mealPlans[dStr];
                    const nutrients = calculateDailyMealPlanTotals(mPlan);
                    const hasActivity = isWorkoutDone || nutrients.calories > 0 || (rec && Object.values(rec.habitsCompleted || {}).some(Boolean));
                    const isDayClean = (isExplicitClean || (!hasAlcohol && !brokeDiet && hasActivity)) && !hasAlcohol && !brokeDiet;
                    const dateInfo = formatDayDisplay(dStr);

                    return (
                      <div
                        key={dStr}
                        className={`p-3 sm:px-4 sm:py-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 transition-all ${
                          hasAlcohol || brokeDiet
                            ? 'bg-rose-950/15 border-rose-500/30 hover:border-rose-500/50'
                            : isDayClean
                            ? 'bg-emerald-950/10 border-emerald-500/25 hover:border-emerald-500/45'
                            : 'bg-zinc-900/30 border-[#1F2430] hover:border-zinc-700'
                        }`}
                      >
                        {/* Linha com Data, Badges e Resumo */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5 min-w-0">
                          {/* Data */}
                          <span className="font-bold text-white text-xs font-mono shrink-0 whitespace-nowrap">
                            {dateInfo.dayMonth} <span className="text-zinc-500 font-normal">({dateInfo.weekday})</span>
                          </span>

                          {/* Badges de Status */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            {isDayClean && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 text-[11px] font-mono flex items-center gap-1">
                                <span>🟢</span> 100% LIMPO
                              </span>
                            )}

                            {hasAlcohol && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30 text-[11px] font-mono flex items-center gap-1">
                                <span>🔴</span> ÁLCOOL
                              </span>
                            )}

                            {brokeDiet && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 text-[11px] font-mono flex items-center gap-1">
                                <span>🟠</span> DESLIZE DIETA
                              </span>
                            )}

                            {!isDayClean && !hasAlcohol && !brokeDiet && (
                              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-medium text-[11px] font-mono">
                                ⚪ NÃO PREENCHIDO
                              </span>
                            )}
                          </div>

                          {/* Resumo na Linha */}
                          <div className="text-xs truncate">
                            {isDayClean ? (
                              <span className="text-zinc-300 font-medium">
                                Treino Realizado • Macros Batidos • Hábitos Mente/Alma Ok
                                {rec?.journalNotes && (
                                  <span className="text-zinc-400 italic hidden md:inline ml-2">
                                    "{rec.journalNotes}"
                                  </span>
                                )}
                              </span>
                            ) : hasAlcohol || brokeDiet ? (
                              <span className="text-zinc-300 italic truncate block">
                                {rec?.alcoholNotes && rec?.dietNotes
                                  ? `🍺 "${rec.alcoholNotes}" • 🥩 "${rec.dietNotes}"`
                                  : rec?.alcoholNotes
                                  ? `🍺 "${rec.alcoholNotes}"`
                                  : rec?.dietNotes
                                  ? `🥩 "${rec.dietNotes}"`
                                  : rec?.journalNotes
                                  ? `📝 "${rec.journalNotes}"`
                                  : 'Deslize registrado sem justificativa descrita.'}
                              </span>
                            ) : (
                              <span className="text-zinc-500">
                                Sem atividades registradas para esta data
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botão de Ação: Ver Ficha do Dia */}
                        <button
                          type="button"
                          onClick={() => setSelectedDayForModal(dStr)}
                          className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Ver Ficha do Dia</span>
                        </button>
                      </div>
                    );
                  })}

                {/* Paginação do Diário de Bordo */}
                {filteredRows.length > 15 && (
                  <div className="flex items-center justify-between pt-3 border-t border-[#1F2430] text-xs text-zinc-400">
                    <span>
                      Página {allDaysPage} de {Math.ceil(filteredRows.length / 15)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAllDaysPage((p) => Math.max(1, p - 1))}
                        disabled={allDaysPage === 1}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-[#1F2430] text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAllDaysPage((p) =>
                            Math.min(Math.ceil(filteredRows.length / 15), p + 1)
                          )
                        }
                        disabled={allDaysPage === Math.ceil(filteredRows.length / 15)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-[#1F2430] text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: PERFIL & METABOLISMO SETUP */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Profile Form (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl">
            <h2 className="text-base font-bold text-white uppercase font-mono tracking-wider mb-1">
              Configurações Biométricas & Objetivo
            </h2>
            <p className="text-xs text-zinc-400 font-mono mb-5">
              Atualize seus dados corporais para recalcular sua TMB, GETD e divisão de macronutrientes
            </p>

            <form onSubmit={handleSubmitProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Sexo Biológico
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-black/80 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Idade (anos)
                  </label>
                  <input
                    type="number"
                    min="14"
                    max="100"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 25 })}
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="230"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 175 })}
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Peso Atual (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="35"
                    max="250"
                    value={formData.currentWeight}
                    onChange={(e) => setFormData({ ...formData, currentWeight: parseFloat(e.target.value) || 75 })}
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-[#38BDF8] font-bold focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Nível de Atividade Física
                  </label>
                  <select
                    value={formData.activityLevel}
                    onChange={(e: any) => setFormData({ ...formData, activityLevel: e.target.value })}
                    className="w-full bg-black/80 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  >
                    <option value="sedentary">Sedentário (Pouco/nenhum exercício)</option>
                    <option value="light">Leve (Treino 1-3x por semana)</option>
                    <option value="moderate">Moderado (Treino 3-5x por semana)</option>
                    <option value="intense">Intenso (Treino 6-7x por semana)</option>
                    <option value="very_intense">Muito Intenso (Atleta / 2x ao dia)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Diretriz do Físico
                  </label>
                  <select
                    value={formData.goalType}
                    onChange={(e: any) => setFormData({ ...formData, goalType: e.target.value })}
                    className="w-full bg-black/80 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  >
                    <option value="cut">Definição / Queima de Gordura (-450 kcal)</option>
                    <option value="maintain">Manutenção de Peso (Equilíbrio)</option>
                    <option value="bulk">Hipertrofia / Ganho de Massa (+350 kcal)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#1F2430]">
                {savedSuccess ? (
                  <span className="text-xs font-mono text-[#38BDF8] font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Perfil salvo com sucesso!</span>
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs uppercase font-mono tracking-wider transition-all shadow-lg  cursor-pointer"
                >
                  Salvar Perfil
                </button>
              </div>
            </form>
          </div>

          {/* Metabolic Output Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* TMB & GETD Card */}
            <div className="p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#38BDF8]" />
                <span>Cálculo Metabólico (Mifflin-St Jeor)</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-black/50 border border-[#1F2430]">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">
                    TMB (Basal)
                  </span>
                  <span className="text-2xl font-black font-mono text-white block mt-1">
                    {bmr}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">kcal/dia em repouso</span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/50 border border-[#1F2430]">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">
                    GETD (Gasto Total)
                  </span>
                  <span className="text-2xl font-black font-mono text-[#38BDF8] block mt-1">
                    {tdee}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">kcal/dia com atividade</span>
                </div>
              </div>

              {/* Target Calories */}
              <div className="p-4 rounded-xl bg-black/60 border border-[#38BDF8]/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#38BDF8] font-bold block">
                    Meta Calórica Diária Recomendada
                  </span>
                  <span className="text-2xl font-black font-mono text-white">
                    {targetMacros.targetCalories} kcal
                  </span>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 text-[#38BDF8] border border-[#38BDF8]/30 font-bold uppercase">
                  {formData.goalType}
                </span>
              </div>

              {/* Macro Distribution */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-mono uppercase text-zinc-400 font-bold block">
                  Divisão de Macronutrientes
                </span>

                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-[#1F2430]">
                    <span className="text-[10px] text-zinc-500 block">PROTEÍNAS</span>
                    <span className="text-sm font-bold text-white">{targetMacros.proteinGrams}g</span>
                    <span className="text-[9px] text-zinc-500 block">2.0g/kg</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-[#1F2430]">
                    <span className="text-[10px] text-zinc-500 block">CARBOIDRATOS</span>
                    <span className="text-sm font-bold text-zinc-200">{targetMacros.carbsGrams}g</span>
                    <span className="text-[9px] text-zinc-500 block">Energia</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-[#1F2430]">
                    <span className="text-[10px] text-zinc-500 block">GORDURAS</span>
                    <span className="text-sm font-bold text-zinc-200">{targetMacros.fatGrams}g</span>
                    <span className="text-[9px] text-zinc-500 block">0.8g/kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Backup & Data Management */}
            <div className="p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Gerenciamento de Dados Locais
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onExportData}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Backup (JSON)</span>
                </button>

                <label className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={onResetDemoData}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] text-xs font-mono text-zinc-400 hover:text-[#F3F4F6] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Restaura os dados demonstrativos de 14 dias"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resetar Demo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD WEIGHT */}
      {showAddWeight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans antialiased">
          <div className="relative w-full max-w-md bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl text-zinc-100 ">
            <h3 className="text-base font-bold text-white tracking-tight mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#38BDF8]" />
              <span>Registrar Novo Peso</span>
            </h3>

            <form onSubmit={handleAddWeightSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Data da Pesagem
                </label>
                <input
                  type="date"
                  value={newWeightDate}
                  onChange={(e) => setNewWeightDate(e.target.value)}
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeightVal}
                  onChange={(e) => setNewWeightVal(e.target.value)}
                  placeholder="81.0"
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-xl font-extrabold text-[#38BDF8] focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Observação (Opcional)
                </label>
                <input
                  type="text"
                  value={newWeightNote}
                  onChange={(e) => setNewWeightNote(e.target.value)}
                  placeholder="Ex: Em jejum ao acordar"
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2430]">
                <button
                  type="button"
                  onClick={() => setShowAddWeight(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs tracking-wide transition-all shadow-lg  cursor-pointer"
                >
                  Salvar Pesagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
