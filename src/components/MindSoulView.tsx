import React, { useState } from 'react';
import {
  Sparkles,
  Brain,
  Plus,
  Check,
  Calendar,
  Clock,
  BookOpen,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Compass,
  CheckCircle2,
  FileText,
  Flame,
  ArrowRight,
  Filter,
  CalendarCheck,
  CalendarRange
} from 'lucide-react';
import {
  MindSoulPractice,
  DailyMindSoulLog,
  MindSoulPillar,
  RoutinePeriod
} from '../types';
import { formatDateKey, parseDateKey } from '../utils/calculations';
import { fireDisciplineConfetti } from '../utils/confetti';

interface MindSoulViewProps {
  practices: MindSoulPractice[];
  logs: Record<string, DailyMindSoulLog>;
  onAddPractice: (practice: Omit<MindSoulPractice, 'id' | 'createdAt'>) => void;
  onUpdatePractice: (id: string, updates: Partial<MindSoulPractice>) => void;
  onDeletePractice: (id: string) => void;
  onUpdateDailyLog: (dateStr: string, updates: Partial<DailyMindSoulLog>) => void;
  onTogglePracticeCompletion: (dateStr: string, practiceId: string, durationMinutes?: number) => void;
  onUpdatePracticeNotes: (dateStr: string, practiceId: string, notes: string) => void;
  onUpdatePracticeDuration: (dateStr: string, practiceId: string, minutes: number) => void;
}

export const DAYS_OF_WEEK = [
  { day: 1, label: 'Seg', name: 'Segunda-feira' },
  { day: 2, label: 'Ter', name: 'Terça-feira' },
  { day: 3, label: 'Qua', name: 'Quarta-feira' },
  { day: 4, label: 'Qui', name: 'Quinta-feira' },
  { day: 5, label: 'Sex', name: 'Sexta-feira' },
  { day: 6, label: 'Sáb', name: 'Sábado' },
  { day: 0, label: 'Dom', name: 'Domingo' },
];

export const formatDaysLabel = (days?: number[]): string => {
  if (!days || days.length === 0 || days.length === 7) return 'Todos os dias';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'Seg a Sex (Dias úteis)';
  if (days.length === 2 && [0, 6].every((d) => days.includes(d))) return 'Sáb e Dom (Fim de semana)';
  
  const sorted = DAYS_OF_WEEK.filter((d) => days.includes(d.day)).map((d) => d.label);
  return sorted.join(', ');
};

const CATEGORIES = [
  'Leitura',
  'Oração & Fé',
  'Meditação & Mindfulness',
  'Estudo & Foco',
  'Escrita & Reflexão',
  'Silêncio & Desconexão',
  'Estudo Bíblico / Teológico',
  'Outro',
];

const PRESETS = [
  {
    title: '30min de Leitura Diária',
    pillar: 'mente' as MindSoulPillar,
    category: 'Leitura',
    targetDurationMinutes: 30,
    period: 'night' as RoutinePeriod,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    description: 'Leitura focada de filosofia estoica, liderança, tecnologia ou finanças.',
  },
  {
    title: 'Reza Diária & Oração Matinal',
    pillar: 'alma' as MindSoulPillar,
    category: 'Oração & Fé',
    targetDurationMinutes: 15,
    period: 'morning' as RoutinePeriod,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    description: 'Momento sagrado de oração, entrega do dia a Deus e gratidão pela vida.',
  },
  {
    title: 'Meditação & Retiro de Silêncio (15m)',
    pillar: 'alma' as MindSoulPillar,
    category: 'Meditação & Mindfulness',
    targetDurationMinutes: 15,
    period: 'afternoon' as RoutinePeriod,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    description: 'Pausa para desacelerar o sistema nervoso, respiração e domínio dos pensamentos.',
  },
  {
    title: 'Bloco Deep Work / Estudo Focado',
    pillar: 'mente' as MindSoulPillar,
    category: 'Estudo & Foco',
    targetDurationMinutes: 60,
    period: 'morning' as RoutinePeriod,
    daysOfWeek: [1, 2, 3, 4, 5], // Seg a Sex
    description: '60 minutos de foco absoluto sem celular, sem notificações e sem redes sociais.',
  },
  {
    title: 'Exame de Consciência & Gratidão',
    pillar: 'alma' as MindSoulPillar,
    category: 'Escrita & Reflexão',
    targetDurationMinutes: 10,
    period: 'night' as RoutinePeriod,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    description: 'Revisão das ações do dia, pontos a melhorar e 3 motivos de gratidão sincera.',
  },
  {
    title: 'Estudo Bíblico / Leitura Sagrada',
    pillar: 'alma' as MindSoulPillar,
    category: 'Estudo Bíblico / Teológico',
    targetDurationMinutes: 20,
    period: 'morning' as RoutinePeriod,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    description: 'Estudo de passagens das Escrituras para clareza moral e espiritual.',
  },
];

export const MindSoulView: React.FC<MindSoulViewProps> = ({
  practices,
  logs,
  onAddPractice,
  onUpdatePractice,
  onDeletePractice,
  onUpdateDailyLog,
  onTogglePracticeCompletion,
  onUpdatePracticeNotes,
  onUpdatePracticeDuration,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'planner' | 'manage'>('planner');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(formatDateKey(new Date()));
  const [filterPillar, setFilterPillar] = useState<'all' | 'mente' | 'alma' | 'routine'>('all');
  const [onlyScheduledForDay, setOnlyScheduledForDay] = useState(true);

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formPillar, setFormPillar] = useState<MindSoulPillar>('mente');
  const [formCategory, setFormCategory] = useState('Leitura');
  const [formDuration, setFormDuration] = useState(30);
  const [formPeriod, setFormPeriod] = useState<RoutinePeriod>('morning');
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [formDescription, setFormDescription] = useState('');
  const [formAddToRoutine, setFormAddToRoutine] = useState(true);

  // Expanded notes state for practices in planner
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const todayStr = formatDateKey(new Date());
  const selectedDate = parseDateKey(selectedDateStr);
  const isToday = selectedDateStr === todayStr;
  const currentDayOfWeek = selectedDate.getDay(); // 0 = Domingo, 1 = Segunda, etc.

  const currentLog: DailyMindSoulLog = logs[selectedDateStr] || {
    date: selectedDateStr,
    practices: {},
    dailyReflection: '',
  };

  const handleOpenAddModal = (preset?: typeof PRESETS[0]) => {
    setEditingPracticeId(null);
    if (preset) {
      setFormTitle(preset.title);
      setFormPillar(preset.pillar);
      setFormCategory(preset.category);
      setFormDuration(preset.targetDurationMinutes);
      setFormPeriod(preset.period);
      setFormDaysOfWeek(preset.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
      setFormDescription(preset.description);
    } else {
      setFormTitle('');
      setFormPillar('mente');
      setFormCategory('Leitura');
      setFormDuration(30);
      setFormPeriod('morning');
      setFormDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
      setFormDescription('');
    }
    setFormAddToRoutine(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (practice: MindSoulPractice) => {
    setEditingPracticeId(practice.id);
    setFormTitle(practice.title);
    setFormPillar(practice.pillar);
    setFormCategory(practice.category);
    setFormDuration(practice.targetDurationMinutes);
    setFormPeriod(practice.period);
    setFormDaysOfWeek(
      practice.daysOfWeek && practice.daysOfWeek.length > 0
        ? practice.daysOfWeek
        : [0, 1, 2, 3, 4, 5, 6]
    );
    setFormDescription(practice.description || '');
    setFormAddToRoutine(practice.addToDailyRoutine);
    setIsModalOpen(true);
  };

  const toggleFormDayOfWeek = (dayNumber: number) => {
    setFormDaysOfWeek((prev) => {
      if (prev.includes(dayNumber)) {
        // Prevent empty selection; must keep at least 1 day
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dayNumber);
      } else {
        return [...prev, dayNumber];
      }
    });
  };

  const setPresetDays = (preset: 'all' | 'weekdays' | 'weekend') => {
    if (preset === 'all') setFormDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    else if (preset === 'weekdays') setFormDaysOfWeek([1, 2, 3, 4, 5]);
    else if (preset === 'weekend') setFormDaysOfWeek([0, 6]);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const days = formDaysOfWeek.length > 0 ? formDaysOfWeek : [0, 1, 2, 3, 4, 5, 6];
    const targetPerWeek = days.length;

    if (editingPracticeId) {
      onUpdatePractice(editingPracticeId, {
        title: formTitle.trim(),
        pillar: formPillar,
        category: formCategory,
        targetDurationMinutes: Number(formDuration) || 15,
        period: formPeriod,
        daysOfWeek: days,
        targetPerWeek,
        description: formDescription.trim() || undefined,
        addToDailyRoutine: formAddToRoutine,
      });
    } else {
      onAddPractice({
        title: formTitle.trim(),
        pillar: formPillar,
        category: formCategory,
        targetDurationMinutes: Number(formDuration) || 15,
        period: formPeriod,
        daysOfWeek: days,
        targetPerWeek,
        description: formDescription.trim() || undefined,
        addToDailyRoutine: formAddToRoutine,
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteWithConfirm = (id: string, title: string) => {
    if (confirm(`Tem certeza que deseja excluir "${title}"? Esta ação removerá a prática e suas configurações.`)) {
      onDeletePractice(id);
      if (editingPracticeId === id) {
        setIsModalOpen(false);
      }
    }
  };

  const handleToggleRoutineAttachment = (practice: MindSoulPractice) => {
    onUpdatePractice(practice.id, {
      addToDailyRoutine: !practice.addToDailyRoutine,
    });
  };

  const handleToggleCheck = (practiceId: string, targetDuration: number) => {
    const isCompleted = currentLog.practices[practiceId]?.completed;
    onTogglePracticeCompletion(selectedDateStr, practiceId, targetDuration);
    if (!isCompleted) {
      fireDisciplineConfetti();
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDateStr(formatDateKey(d));
  };

  // Helper to check if a practice is scheduled for a specific day of week
  const isPracticeScheduledForDay = (practice: MindSoulPractice, dayOfWeek: number) => {
    if (!practice.daysOfWeek || practice.daysOfWeek.length === 0) return true;
    return practice.daysOfWeek.includes(dayOfWeek);
  };

  // Filtered practices for the Management Tab
  const filteredPractices = practices.filter((p) => {
    if (filterPillar === 'mente') return p.pillar === 'mente';
    if (filterPillar === 'alma') return p.pillar === 'alma';
    if (filterPillar === 'routine') return p.addToDailyRoutine;
    return true;
  });

  // Practices that are attached to daily routine
  const allRoutinePractices = practices.filter((p) => p.addToDailyRoutine);

  // Practices for the current planner view (filtered or not by day of week)
  const displayedRoutinePractices = allRoutinePractices.filter((p) => {
    if (!onlyScheduledForDay) return true;
    return isPracticeScheduledForDay(p, currentDayOfWeek);
  });

  // Group by routine period for the Planner
  const morningPractices = displayedRoutinePractices.filter((p) => p.period === 'morning');
  const afternoonPractices = displayedRoutinePractices.filter((p) => p.period === 'afternoon');
  const nightPractices = displayedRoutinePractices.filter((p) => p.period === 'night');
  const anytimePractices = displayedRoutinePractices.filter((p) => p.period === 'anytime');

  // Stats calculation for the selected day
  const totalRoutineCount = displayedRoutinePractices.length;
  const completedRoutineCount = displayedRoutinePractices.filter(
    (p) => currentLog.practices[p.id]?.completed
  ).length;
  const completionPercentage = totalRoutineCount > 0 ? Math.round((completedRoutineCount / totalRoutineCount) * 100) : 0;

  const totalMinutesSpent = displayedRoutinePractices.reduce((acc, p) => {
    const entry = currentLog.practices[p.id];
    if (entry?.completed) {
      return acc + (entry.durationMinutes || p.targetDurationMinutes);
    }
    return acc;
  }, 0);

  // Constância (Streak) Calculation: consecutive days with at least 1 practice completed
  const calculateStreak = () => {
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 60; i++) {
      const key = formatDateKey(checkDate);
      const log = logs[key];
      const hasCompleted = log && Object.values(log.practices).some((entry) => entry.completed);
      if (hasCompleted) {
        streak++;
      } else {
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  };

  const mindSoulStreak = calculateStreak();

  // Generate the 7 days of the week surrounding/containing selectedDate for the week bar
  const generateWeekDays = () => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    // Monday as start of week: diff to Monday
    const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diffToMonday));

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDays = generateWeekDays();

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1F2430] border border-[#1F2430] flex items-center justify-center text-[#38BDF8]">
              <Sparkles className="w-5 h-5 fill-[#38BDF8]/20" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-mono uppercase">
                <span>Mindset</span>
              </h1>
              <p className="text-xs text-zinc-400 font-mono">
                Cadastro, seleção de dias da rotina, edição/exclusão e planner de leitura e oração
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Quick Add Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p-1 bg-[#12141A] border border-[#1F2430] rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => setActiveSubTab('planner')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'planner'
                  ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Planner & Acompanhamento</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('manage')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'manage'
                  ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Cadastro de Práticas ({practices.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-lg "
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Opção</span>
          </button>
        </div>
      </div>

      {/* 2. OVERVIEW METRICS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Constância Mente & Alma */}
        <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F2430] border border-[#1F2430] flex items-center justify-center text-[#38BDF8]">
              <Flame className="w-5 h-5 fill-[#38BDF8]/20" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-400 block tracking-wider font-semibold">
                Constância Mindset
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black font-mono text-white">
                  {mindSoulStreak}
                </span>
                <span className="text-xs font-mono text-[#38BDF8] font-bold">
                  {mindSoulStreak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Execução do Dia Selecionado */}
        <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-[#38BDF8]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-400 block tracking-wider font-semibold">
                Rotina do Dia // Cumpridas
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black font-mono text-white">
                  {completedRoutineCount} / {totalRoutineCount}
                </span>
                <span className="text-xs font-mono text-zinc-400 font-bold">
                  ({completionPercentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Minutos Dedicados */}
        <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
              <Clock className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-400 block tracking-wider font-semibold">
                Tempo Dedicado
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black font-mono text-white">
                  {totalMinutesSpent}
                </span>
                <span className="text-xs font-mono text-[#38BDF8] font-bold">minutos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUBTAB 1: PLANNER & ACOMPANHAMENTO DIÁRIO */}
      {activeSubTab === 'planner' && (
        <div className="space-y-6">
          {/* WEEK DAYS SELECTOR STRIP (Selecione em qual dia quer a rotina) */}
          <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-[#38BDF8]" />
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Selecione o Dia da Semana para a Rotina
                </span>
              </div>

              {/* Toggle: Apenas agendadas para o dia vs Todas as práticas */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyScheduledForDay(!onlyScheduledForDay)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    onlyScheduledForDay
                      ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
                      : 'bg-zinc-900 text-zinc-400 border border-[#1F2430] hover:text-white'
                  }`}
                  title="Alternar entre ver somente práticas agendadas para este dia ou todas as práticas da rotina"
                >
                  <Filter className="w-3 h-3" />
                  <span>{onlyScheduledForDay ? 'Filtrando: Agendadas para o dia' : 'Mostrando: Todas as práticas'}</span>
                </button>

                {!isToday && (
                  <button
                    type="button"
                    onClick={() => setSelectedDateStr(todayStr)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[#38BDF8] text-[11px] font-mono font-bold border border-[#1F2430] transition-all cursor-pointer"
                  >
                    Hoje
                  </button>
                )}
              </div>
            </div>

            {/* Quick 7-Day Buttons */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
              {weekDays.map((d) => {
                const dateKey = formatDateKey(d);
                const isSelected = dateKey === selectedDateStr;
                const isCurrentToday = dateKey === todayStr;
                const dayNum = d.getDay();
                const dayLabel = DAYS_OF_WEEK.find((dw) => dw.day === dayNum)?.label || '';
                const dayLog = logs[dateKey];
                const hasCompletedOnDay = dayLog && Object.values(dayLog.practices).some((p) => p.completed);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`py-2.5 px-1 sm:px-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-md  scale-[1.02]'
                        : 'bg-black/50 text-zinc-300 border border-[#1F2430] hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    {isCurrentToday && (
                      <span
                        className={`text-[9px] font-black uppercase tracking-tighter ${
                          isSelected ? 'text-black' : 'text-[#38BDF8]'
                        }`}
                      >
                        Hoje
                      </span>
                    )}
                    <span className="text-[11px] font-mono uppercase">{dayLabel}</span>
                    <span className="text-sm sm:text-base font-bold font-mono">
                      {d.getDate().toString().padStart(2, '0')}
                    </span>

                    {/* Completion dot indicator */}
                    {hasCompletedOnDay && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isSelected ? 'bg-black' : 'bg-[#D97706]'
                        }`}
                        title="Hábitos concluídos neste dia"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current Selected Date Details Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-[#1F2430] text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftDate(-1)}
                  className="p-1.5 rounded-lg bg-black/40 border border-[#1F2430] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Dia anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-white capitalize">
                  {selectedDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => shiftDate(1)}
                  className="p-1.5 rounded-lg bg-black/40 border border-[#1F2430] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Próximo dia"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span>Progresso: <strong className="text-[#38BDF8]">{completionPercentage}%</strong></span>
                <div className="w-24 bg-zinc-900 h-2 rounded-full overflow-hidden border border-[#1F2430]">
                  <div
                    className="bg-[#D97706] h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* EMPTY STATE IF NO PRACTICES DISPLAYED */}
          {displayedRoutinePractices.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#12141A] border border-[#1F2430] text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1F2430] border border-[#1F2430] flex items-center justify-center text-[#38BDF8] mx-auto">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono uppercase">
                  {allRoutinePractices.length === 0
                    ? 'Nenhuma prática atrelada à rotina diária'
                    : 'Nenhuma prática agendada para este dia da semana'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  {allRoutinePractices.length === 0
                    ? 'Cadastre suas práticas de leitura, reza diária ou meditação na aba "Cadastro de Práticas" e ative a opção "Atrelar à Rotina Diária".'
                    : 'Você pode alterar os dias da rotina clicando em "Editar" na prática, ou desativar o filtro acima para ver todas as práticas.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {allRoutinePractices.length > 0 && onlyScheduledForDay && (
                  <button
                    type="button"
                    onClick={() => setOnlyScheduledForDay(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#38BDF8] font-bold text-xs font-mono uppercase tracking-wider border border-[#1F2430] transition-all cursor-pointer"
                  >
                    Ver Todas as Práticas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="px-4 py-2 rounded-xl bg-[#E2E8F0] text-[#090A0C] font-bold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer inline-flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Cadastrar Prática</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ROUTINE SECTIONS: MANHÃ, TARDE, NOITE, QUALQUER HORÁRIO */}
              {[
                { title: 'Rotina da Manhã', period: 'morning', icon: Sun, items: morningPractices, color: 'text-amber-400' },
                { title: 'Rotina da Tarde', period: 'afternoon', icon: Sunset, items: afternoonPractices, color: 'text-orange-400' },
                { title: 'Rotina da Noite', period: 'night', icon: Moon, items: nightPractices, color: 'text-indigo-400' },
                { title: 'Qualquer Horário // Flexível', period: 'anytime', icon: Clock, items: anytimePractices, color: 'text-zinc-400' },
              ]
                .filter((sec) => sec.items.length > 0)
                .map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <div
                      key={sec.period}
                      className="p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-md space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${sec.color}`} />
                          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                            {sec.title}
                          </h3>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {sec.items.filter((i) => currentLog.practices[i.id]?.completed).length}/{sec.items.length} feitas
                        </span>
                      </div>

                      <div className="space-y-3">
                        {sec.items.map((practice) => {
                          const entry = currentLog.practices[practice.id] || {
                            completed: false,
                            durationMinutes: practice.targetDurationMinutes,
                            notes: '',
                          };
                          const isDone = !!entry.completed;
                          const isNotesOpen = expandedNotes[practice.id] || !!entry.notes;
                          const isScheduledToday = isPracticeScheduledForDay(practice, currentDayOfWeek);

                          return (
                            <div
                              key={practice.id}
                              className={`p-4 rounded-xl border transition-all ${
                                isDone
                                  ? 'bg-[#38BDF8]/[0.04] border-[#38BDF8]/30 shadow-sm'
                                  : 'bg-black/40 border-[#1F2430] hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* Left Check and Title */}
                                <div className="flex items-start sm:items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCheck(practice.id, practice.targetDurationMinutes)}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer flex-shrink-0 mt-0.5 sm:mt-0 ${
                                      isDone
                                        ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-md  font-bold'
                                        : 'bg-zinc-900 border border-zinc-700 text-transparent hover:border-[#D97706]'
                                    }`}
                                    title={isDone ? 'Marcar como não concluído' : 'Marcar como concluído'}
                                  >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                  </button>

                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`text-sm font-bold font-mono ${
                                          isDone ? 'text-white line-through opacity-80' : 'text-zinc-100'
                                        }`}
                                      >
                                        {practice.title}
                                      </span>

                                      {/* Pillar Badge */}
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                          practice.pillar === 'mente'
                                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                            : 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#1F2430]'
                                        }`}
                                      >
                                        {practice.pillar === 'mente' ? 'Mente' : 'Alma & Fé'}
                                      </span>

                                      {/* Days of week badge */}
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                                          isScheduledToday
                                            ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#1F2430]'
                                            : 'bg-zinc-900 text-zinc-500 border-[#1F2430]'
                                        }`}
                                        title={`Dias programados: ${formatDaysLabel(practice.daysOfWeek)}`}
                                      >
                                        📅 {formatDaysLabel(practice.daysOfWeek)}
                                      </span>

                                      {/* Category Badge */}
                                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-[#1F2430]">
                                        {practice.category}
                                      </span>
                                    </div>

                                    {practice.description && (
                                      <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                                        {practice.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Right Controls: Duration, Notes, Edit, Delete */}
                                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                                  {/* Duration Display Badge (Read-only) */}
                                  <div className="flex items-center gap-1.5 bg-black/60 border border-[#1F2430] rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-300">
                                    <Clock className="w-3 h-3 text-[#38BDF8]" />
                                    <span className="font-bold text-[#38BDF8]">
                                      {entry.durationMinutes || practice.targetDurationMinutes}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 font-semibold">min</span>
                                  </div>

                                  {/* Expand/Collapse Reflection Note */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedNotes((prev) => ({
                                        ...prev,
                                        [practice.id]: !prev[practice.id],
                                      }))
                                    }
                                    className={`px-2 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                      entry.notes
                                        ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
                                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-[#1F2430]'
                                    }`}
                                    title="Anotar reflexão ou insight da prática"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{entry.notes ? 'Reflexão ✓' : 'Anotação'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Expandable Notes Input */}
                              {isNotesOpen && (
                                <div className="mt-3 pt-3 border-t border-[#1F2430] space-y-1">
                                  <label className="text-[10px] font-mono text-zinc-500 uppercase flex items-center justify-between">
                                    <span>Anotação da Prática (Insight lido, intenção da oração, reflexão):</span>
                                    {entry.notes && <span className="text-[#38BDF8]">Gravado ✓</span>}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Ex: Leitura de 15 páginas do capítulo 3; sensação de paz após a oração..."
                                    value={entry.notes || ''}
                                    onChange={(e) =>
                                      onUpdatePracticeNotes(selectedDateStr, practice.id, e.target.value)
                                    }
                                    className="w-full bg-black/60 border border-[#1F2430] rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#D97706]"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* REFLEXÃO DO DIA */}
              <div className="p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#38BDF8]" />
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                      Reflexão do Dia
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Registro pessoal de clareza interior
                  </span>
                </div>

                <p className="text-xs text-zinc-400">
                  Espaço para descarregar a mente, registrar orações pessoais, pensamentos de gratidão ou exame de consciência sobre as atitudes de hoje.
                </p>

                <textarea
                  rows={4}
                  value={currentLog.dailyReflection || ''}
                  onChange={(e) =>
                    onUpdateDailyLog(selectedDateStr, { dailyReflection: e.target.value })
                  }
                  placeholder="Escreva aqui sua oração, lições aprendidas, como controlou suas reações emocionais e o que pretende honrar amanhã..."
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#D97706] leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. SUBTAB 2: CADASTRO & GESTÃO DE PRÁTICAS (CRUD) */}
      {activeSubTab === 'manage' && (
        <div className="space-y-6">
          {/* TOP CONTROLS & FILTER */}
          <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono text-zinc-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filtrar:
              </span>
              <button
                type="button"
                onClick={() => setFilterPillar('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  filterPillar === 'all'
                    ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm'
                    : 'bg-black/40 text-zinc-400 hover:text-white border border-[#1F2430]'
                }`}
              >
                Todas ({practices.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterPillar('mente')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  filterPillar === 'mente'
                    ? 'bg-sky-400 text-black shadow-sm'
                    : 'bg-black/40 text-zinc-400 hover:text-white border border-[#1F2430]'
                }`}
              >
                🧠 Mente ({practices.filter((p) => p.pillar === 'mente').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterPillar('alma')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  filterPillar === 'alma'
                    ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm'
                    : 'bg-black/40 text-zinc-400 hover:text-white border border-[#1F2430]'
                }`}
              >
                ✨ Alma & Fé ({practices.filter((p) => p.pillar === 'alma').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterPillar('routine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  filterPillar === 'routine'
                    ? 'bg-emerald-400 text-black shadow-sm'
                    : 'bg-black/40 text-zinc-400 hover:text-white border border-[#1F2430]'
                }`}
              >
                📅 Na Rotina Diária ({practices.filter((p) => p.addToDailyRoutine).length})
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Sugestões rápidas:</span>
              <button
                type="button"
                onClick={() => handleOpenAddModal(PRESETS[0])}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-[#1F2430] text-[11px] font-mono text-zinc-300 hover:text-[#F3F4F6] transition-all cursor-pointer"
              >
                + 30min Leitura
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddModal(PRESETS[1])}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-[#1F2430] text-[11px] font-mono text-zinc-300 hover:text-[#F3F4F6] transition-all cursor-pointer"
              >
                + Reza Diária
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddModal(PRESETS[3])}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-[#1F2430] text-[11px] font-mono text-zinc-300 hover:text-[#F3F4F6] transition-all cursor-pointer"
              >
                + Deep Work (Seg-Sex)
              </button>
            </div>
          </div>

          {/* PRACTICES LIST CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPractices.map((practice) => {
              const isMorning = practice.period === 'morning';
              const isAfternoon = practice.period === 'afternoon';
              const isNight = practice.period === 'night';
              const daysLabel = formatDaysLabel(practice.daysOfWeek);

              return (
                <div
                  key={practice.id}
                  className="p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-md flex flex-col justify-between hover:border-zinc-700 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                              practice.pillar === 'mente'
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                : 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#1F2430]'
                            }`}
                          >
                            {practice.pillar === 'mente' ? 'Mente' : 'Alma & Fé'}
                          </span>

                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-[#1F2430]">
                            {practice.category}
                          </span>

                          <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                            {isMorning && <Sun className="w-3 h-3 text-amber-400" />}
                            {isAfternoon && <Sunset className="w-3 h-3 text-orange-400" />}
                            {isNight && <Moon className="w-3 h-3 text-indigo-400" />}
                            {!isMorning && !isAfternoon && !isNight && <Clock className="w-3 h-3 text-zinc-400" />}
                            <span>
                              {isMorning
                                ? 'Manhã'
                                : isAfternoon
                                ? 'Tarde'
                                : isNight
                                ? 'Noite'
                                : 'Livre'}
                            </span>
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white font-mono">
                          {practice.title}
                        </h3>
                      </div>

                      {/* Toggle Attachment to Daily Routine */}
                      <button
                        type="button"
                        onClick={() => handleToggleRoutineAttachment(practice)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          practice.addToDailyRoutine
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-900 text-zinc-500 border border-[#1F2430] hover:text-zinc-300'
                        }`}
                        title={
                          practice.addToDailyRoutine
                            ? 'Atrelada à rotina diária (clique para desativar)'
                            : 'Não atrelada à rotina diária (clique para atrelar ao planner)'
                        }
                      >
                        {practice.addToDailyRoutine ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Na Rotina Diária</span>
                          </>
                        ) : (
                          <span>+ Atrelar à Rotina</span>
                        )}
                      </button>
                    </div>

                    {practice.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                        {practice.description}
                      </p>
                    )}

                    {/* Schedule info: Days of Week + Duration */}
                    <div className="pt-2 border-t border-[#1F2430] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
                        <CalendarCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>Dias da Rotina: <strong className="text-white">{daysLabel}</strong></span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Meta: <strong className="text-white">{practice.targetDurationMinutes} min</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Frequência: <strong className="text-white">{practice.daysOfWeek?.length || 7}x / sem</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions: Edit & Delete */}
                  <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-[#1F2430]">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(practice)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#1F2430] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWithConfirm(practice.id, practice.title)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. MODAL: CADASTRAR OU EDITAR PRÁTICA COM SELEÇÃO DE DIAS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#12141A] border border-[#1F2430] rounded-2xl shadow-2xl p-6 overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-[#1F2430] pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#38BDF8]" />
                <h3 className="text-base font-bold text-white uppercase font-mono tracking-wider">
                  {editingPracticeId ? 'Editar Prática de Mindset' : 'Nova Prática de Mindset'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-zinc-900 border border-[#1F2430] cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Sugestões rápidas no topo do modal para novo item */}
              {!editingPracticeId && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-500 uppercase">
                    Sugestões de Cadastro Rápido:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormTitle(preset.title);
                          setFormPillar(preset.pillar);
                          setFormCategory(preset.category);
                          setFormDuration(preset.targetDurationMinutes);
                          setFormPeriod(preset.period);
                          setFormDaysOfWeek(preset.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
                          setFormDescription(preset.description);
                        }}
                        className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 border border-[#1F2430] hover:border-[#D97706] text-zinc-300 hover:text-white cursor-pointer"
                      >
                        {preset.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase">
                  Título da Prática / Intenção *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 30min de Leitura Diária, Reza Diária, Meditação..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-[#D97706]"
                />
              </div>

              {/* SELEÇÃO DE DIAS EM QUE QUER ESSA ROTINA */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-[#1F2430] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Em quais dias você quer essa rotina? *</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#38BDF8] font-bold">
                    {formDaysOfWeek.length}x / semana
                  </span>
                </div>

                {/* Quick Presets for Days */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPresetDays('all')}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      formDaysOfWeek.length === 7
                        ? 'bg-[#E2E8F0] text-[#090A0C] font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-[#1F2430]'
                    }`}
                  >
                    Todos os Dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDays('weekdays')}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      formDaysOfWeek.length === 5 && [1, 2, 3, 4, 5].every((d) => formDaysOfWeek.includes(d))
                        ? 'bg-[#E2E8F0] text-[#090A0C] font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-[#1F2430]'
                    }`}
                  >
                    Seg a Sex
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDays('weekend')}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      formDaysOfWeek.length === 2 && [0, 6].every((d) => formDaysOfWeek.includes(d))
                        ? 'bg-[#E2E8F0] text-[#090A0C] font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-[#1F2430]'
                    }`}
                  >
                    Fim de Semana
                  </button>
                </div>

                {/* Individual Days Toggles: Seg, Ter, Qua, Qui, Sex, Sáb, Dom */}
                <div className="grid grid-cols-7 gap-1 pt-1">
                  {DAYS_OF_WEEK.map((dw) => {
                    const isSelected = formDaysOfWeek.includes(dw.day);
                    return (
                      <button
                        key={dw.day}
                        type="button"
                        onClick={() => toggleFormDayOfWeek(dw.day)}
                        className={`py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm font-black'
                            : 'bg-black/60 text-zinc-400 border border-[#1F2430] hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        <span>{dw.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pilar & Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase">
                    Pilar *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPillar('mente')}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        formPillar === 'mente'
                          ? 'bg-sky-400 text-black shadow-sm font-extrabold'
                          : 'bg-black/60 text-zinc-400 border border-[#1F2430] hover:text-white'
                      }`}
                    >
                      🧠 Mente
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPillar('alma')}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        formPillar === 'alma'
                          ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm font-extrabold'
                          : 'bg-black/60 text-zinc-400 border border-[#1F2430] hover:text-white'
                      }`}
                    >
                      ✨ Alma / Fé
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-zinc-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duração & Período da Rotina */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase flex items-center justify-between">
                    <span>Duração Planejada</span>
                    <span className="text-[#38BDF8]">{formDuration} min</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[10, 15, 20, 30, 45, 60].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormDuration(m)}
                        className={`flex-1 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                          formDuration === m
                            ? 'bg-[#E2E8F0] text-[#090A0C] font-bold'
                            : 'bg-black/60 text-zinc-400 border border-[#1F2430] hover:text-white'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase">
                    Momento da Rotina *
                  </label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as RoutinePeriod)}
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                  >
                    <option value="morning" className="bg-zinc-900">🌅 Rotina da Manhã</option>
                    <option value="afternoon" className="bg-zinc-900">☀️ Rotina da Tarde</option>
                    <option value="night" className="bg-zinc-900">🌙 Rotina da Noite</option>
                    <option value="anytime" className="bg-zinc-900">⏱️ Qualquer Horário / Flexível</option>
                  </select>
                </div>
              </div>

              {/* Descrição / Propósito */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase">
                  Descrição / Propósito Pessoal
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Leitura focada antes de dormir, oração pelas intenções da família..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-[#D97706]"
                />
              </div>

              {/* Switch: Atrelar à rotina / planner diário */}
              <div className="p-3 rounded-xl bg-black/40 border border-[#1F2430] flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-white block">
                    Atrelar à Rotina e Planner Diário
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Aparecerá automaticamente na lista de tarefas do dia e no acompanhamento
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formAddToRoutine}
                  onChange={(e) => setFormAddToRoutine(e.target.checked)}
                  className="w-5 h-5 accent-[#D97706] cursor-pointer"
                />
              </div>

              {/* Actions: Salvar, Cancelar, e Deletar se estiver editando */}
              <div className="flex items-center justify-between pt-4 border-t border-[#1F2430]">
                {editingPracticeId ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (editingPracticeId) {
                        handleDeleteWithConfirm(editingPracticeId, formTitle);
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-900 border border-[#1F2430] transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-lg "
                  >
                    {editingPracticeId ? 'Salvar Alterações' : 'Cadastrar Prática'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
