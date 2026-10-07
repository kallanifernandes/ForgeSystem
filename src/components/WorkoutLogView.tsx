import React, { useState } from 'react';
import {
  Dumbbell,
  Plus,
  Check,
  X,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import {
  WorkoutDivision,
  WorkoutExercise,
  DailyWorkoutLog
} from '../types';
import { formatDateKey } from '../utils/calculations';
import { fireDisciplineConfetti } from '../utils/confetti';

interface WorkoutLogViewProps {
  workoutDivisions: WorkoutDivision[];
  activeDivisionId: string;
  onSelectDivision: (id: string) => void;
  onAddDivision: (division: Omit<WorkoutDivision, 'id'>) => void;
  onUpdateDivision?: (id: string, updates: Partial<WorkoutDivision>) => void;
  onDeleteDivision?: (id: string) => void;
  onAddExercise: (divisionId: string, exercise: Omit<WorkoutExercise, 'id'>) => void;
  onUpdateExercise: (divisionId: string, exerciseId: string, updates: Partial<WorkoutExercise>) => void;
  onDeleteExercise: (divisionId: string, exerciseId: string) => void;
  todayWorkoutLog?: DailyWorkoutLog;
  onUpdateTodayWorkoutLog: (log: DailyWorkoutLog) => void;
}

export const WorkoutLogView: React.FC<WorkoutLogViewProps> = ({
  workoutDivisions,
  activeDivisionId,
  onSelectDivision,
  onAddDivision,
  onUpdateDivision,
  onDeleteDivision,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  todayWorkoutLog,
  onUpdateTodayWorkoutLog,
}) => {
  const todayStr = formatDateKey(new Date());

  // Set of expanded division IDs to allow multiple open accordions
  const [expandedDivisionIds, setExpandedDivisionIds] = useState<Set<string>>(() => {
    const initialId = activeDivisionId || workoutDivisions[0]?.id;
    return initialId ? new Set([initialId]) : new Set();
  });

  // Target division for adding exercise
  const [targetDivisionForExercise, setTargetDivisionForExercise] = useState<string>(
    activeDivisionId || workoutDivisions[0]?.id || ''
  );

  // Modals state
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [isAddDivisionModalOpen, setIsAddDivisionModalOpen] = useState(false);

  // Edit Division Modal State
  const [editingDivision, setEditingDivision] = useState<WorkoutDivision | null>(null);
  const [editLetter, setEditLetter] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMuscles, setEditMuscles] = useState('');
  const [editExercises, setEditExercises] = useState<WorkoutExercise[]>([]);

  // Inline exercise addition inside Edit Modal
  const [isAddingExerciseInEdit, setIsAddingExerciseInEdit] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');
  const [newExSets, setNewExSets] = useState('4');
  const [newExReps, setNewExReps] = useState('8-12');
  const [newExLoad, setNewExLoad] = useState('20');
  const [newExNotes, setNewExNotes] = useState('');

  // Delete Division Confirmation Modal State
  const [deletingDivision, setDeletingDivision] = useState<WorkoutDivision | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form State for Top Add Exercise Modal
  const [exName, setExName] = useState('');
  const [exMuscle, setExMuscle] = useState('Peitoral');
  const [exSets, setExSets] = useState('4');
  const [exReps, setExReps] = useState('8-10');
  const [exLoad, setExLoad] = useState('60');
  const [exNotes, setExNotes] = useState('');

  // Form State for Top Add Division Modal
  const [divLetter, setDivLetter] = useState('E');
  const [divName, setDivName] = useState('');
  const [divDescription, setDivDescription] = useState('');
  const [divMuscles, setDivMuscles] = useState('');

  const currentLog: DailyWorkoutLog = todayWorkoutLog || {
    date: todayStr,
    divisionId: activeDivisionId || workoutDivisions[0]?.id || 'div-a',
    completed: false,
    completedExercises: {},
    exerciseLoads: {},
    notes: '',
  };

  // Toggle Accordion open/closed
  const handleToggleAccordion = (divisionId: string) => {
    setExpandedDivisionIds((prev) => {
      const next = new Set(prev);
      if (next.has(divisionId)) {
        next.delete(divisionId);
      } else {
        next.add(divisionId);
      }
      return next;
    });
    onSelectDivision(divisionId);
  };

  // Handlers for today execution
  const handleToggleExerciseDone = (divisionId: string, exerciseId: string) => {
    const isCurrentlyDone = currentLog.completedExercises[exerciseId] === true;
    const updatedExercises = {
      ...currentLog.completedExercises,
      [exerciseId]: !isCurrentlyDone,
    };

    const division = workoutDivisions.find((d) => d.id === divisionId);
    const allDone = division ? division.exercises.every((ex) => updatedExercises[ex.id] === true) : false;

    if (allDone) {
      fireDisciplineConfetti();
      showToast(`Todos os exercícios da divisão foram concluídos!`);
    }

    onUpdateTodayWorkoutLog({
      ...currentLog,
      divisionId,
      completed: allDone,
      completedExercises: updatedExercises,
    });
  };

  const handleUpdateLoad = (divisionId: string, exerciseId: string, newLoad: number) => {
    const updatedLoads = {
      ...currentLog.exerciseLoads,
      [exerciseId]: Math.max(0, newLoad),
    };

    onUpdateTodayWorkoutLog({
      ...currentLog,
      divisionId,
      exerciseLoads: updatedLoads,
    });

    onUpdateExercise(divisionId, exerciseId, { load: newLoad });
  };

  const handleToggleDivisionCompletion = (division: WorkoutDivision) => {
    const allAlreadyDone = division.exercises.length > 0 &&
      division.exercises.every((ex) => currentLog.completedExercises[ex.id] === true);
    const nextCompleted = !allAlreadyDone;

    const updatedExercises = { ...currentLog.completedExercises };
    division.exercises.forEach((ex) => {
      updatedExercises[ex.id] = nextCompleted;
    });

    if (nextCompleted) {
      fireDisciplineConfetti();
      showToast(`Treino ${division.letter} marcado como concluído!`);
    }

    onUpdateTodayWorkoutLog({
      ...currentLog,
      divisionId: division.id,
      completed: nextCompleted,
      completedExercises: updatedExercises,
    });
  };

  // Open Edit Division Modal
  const handleOpenEditDivision = (division: WorkoutDivision, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDivision(division);
    setEditLetter(division.letter);
    setEditName(division.name);
    setEditDescription(division.description || '');
    setEditMuscles(division.targetMuscles);
    setEditExercises(JSON.parse(JSON.stringify(division.exercises)));
    setIsAddingExerciseInEdit(false);
  };

  // Open Delete Division Confirmation Modal
  const handleOpenDeleteDivision = (division: WorkoutDivision, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingDivision(division);
  };

  // Confirm Delete Division
  const handleConfirmDeleteDivision = () => {
    if (!deletingDivision) return;
    const targetId = deletingDivision.id;
    const divName = deletingDivision.name;

    if (onDeleteDivision) {
      onDeleteDivision(targetId);
    }

    setExpandedDivisionIds((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });

    setDeletingDivision(null);
    showToast(`Treino "${divName}" foi excluído com sucesso.`);
  };

  // Reordering exercises inside Edit Modal
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editExercises.length) return;

    const updated = [...editExercises];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setEditExercises(updated);
  };

  const handleRemoveExerciseInEdit = (exerciseId: string) => {
    setEditExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const handleSaveAddExerciseInEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const newExercise: WorkoutExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newExName.trim(),
      muscleGroup: newExMuscle.trim() || editMuscles.split(/[,•|/]/)[0]?.trim() || 'Geral',
      sets: parseInt(newExSets) || 4,
      reps: newExReps.trim() || '10',
      load: parseFloat(newExLoad) || 0,
      notes: newExNotes.trim() || undefined,
    };

    setEditExercises((prev) => [...prev, newExercise]);
    setNewExName('');
    setNewExNotes('');
    setIsAddingExerciseInEdit(false);
  };

  // Save changes from Edit Division Modal
  const handleSaveEditDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDivision) return;

    const cleanLetter = editLetter.trim().toUpperCase() || 'A';
    const cleanName = editName.trim() || `Treino ${cleanLetter}`;

    if (onUpdateDivision) {
      onUpdateDivision(editingDivision.id, {
        letter: cleanLetter,
        name: cleanName,
        description: editDescription.trim() || undefined,
        targetMuscles: editMuscles.trim() || 'Grupos Variados',
        exercises: editExercises,
      });
    }

    setEditingDivision(null);
    showToast(`Treino ${cleanLetter} atualizado com sucesso!`);
  };

  // Add Exercise through Add Exercise Modal
  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exName.trim()) return;

    const targetDivId = targetDivisionForExercise || activeDivisionId || workoutDivisions[0]?.id;
    if (!targetDivId) return;

    onAddExercise(targetDivId, {
      name: exName.trim(),
      muscleGroup: exMuscle.trim() || 'Geral',
      sets: parseInt(exSets) || 4,
      reps: exReps.trim() || '10',
      load: parseFloat(exLoad) || 0,
      notes: exNotes.trim() || undefined,
    });

    setExpandedDivisionIds((prev) => new Set([...prev, targetDivId]));
    setExName('');
    setExNotes('');
    setIsAddExerciseModalOpen(false);
    showToast(`Exercício adicionado com sucesso!`);
  };

  // Create New Split / Division
  const handleCreateDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!divName.trim()) return;

    const cleanLetter = divLetter.trim().toUpperCase() || 'E';
    onAddDivision({
      letter: cleanLetter,
      name: divName.trim(),
      description: divDescription.trim() || undefined,
      targetMuscles: divMuscles.trim() || 'Grupos variados',
      exercises: [],
    });

    setDivName('');
    setDivDescription('');
    setDivMuscles('');
    setIsAddDivisionModalOpen(false);
    showToast(`Nova divisão (Treino ${cleanLetter}) cadastrada!`);
  };

  const handleOpenAddExerciseForDivision = (divisionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetDivisionForExercise(divisionId);
    const div = workoutDivisions.find((d) => d.id === divisionId);
    if (div && div.targetMuscles) {
      const firstMuscle = div.targetMuscles.split(/[,•|/]/)[0]?.trim();
      if (firstMuscle) setExMuscle(firstMuscle);
    }
    setIsAddExerciseModalOpen(true);
  };

  // Format muscles into clean bullet-separated string
  const formatMuscles = (musclesStr: string) => {
    if (!musclesStr) return '';
    return musclesStr
      .split(/[,•|/]/)
      .map((m) => m.trim())
      .filter(Boolean)
      .join(' • ');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-zinc-900 border border-[#D97706] text-[#38BDF8] rounded-xl shadow-2xl font-mono text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-mono uppercase">
            <Dumbbell className="w-5 h-5 text-[#38BDF8]" />
            <span>Rotina de Treino</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Gerencie divisões de treino, acompanhe séries e registre a progressão de cargas no seu diário de execução
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddDivisionModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            <span>Nova Divisão</span>
          </button>

          <button
            onClick={() => {
              setTargetDivisionForExercise(activeDivisionId || workoutDivisions[0]?.id || '');
              setIsAddExerciseModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs uppercase font-mono tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg "
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Exercício</span>
          </button>
        </div>
      </div>

      {/* VERTICAL LIST OF EXPANDABLE ACCORDION CARDS */}
      <div className="space-y-3.5">
        {workoutDivisions.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500 bg-[#12141A] border border-dashed border-[#1F2430] rounded-2xl space-y-3">
            <p>Nenhuma divisão de treino cadastrada.</p>
            <button
              onClick={() => setIsAddDivisionModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#E2E8F0] text-[#090A0C] font-bold text-xs uppercase font-mono tracking-wider"
            >
              + Criar Primeira Divisão
            </button>
          </div>
        ) : (
          workoutDivisions.map((division) => {
            const isExpanded = expandedDivisionIds.has(division.id);

            // Calculate completed count for this division today
            const completedCount = division.exercises.filter(
              (ex) => currentLog.completedExercises[ex.id] === true
            ).length;
            const totalExercises = division.exercises.length;
            const isAllCompleted = totalExercises > 0 && completedCount === totalExercises;
            const percentDone = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

            const formattedMuscles = formatMuscles(division.targetMuscles);

            return (
              <div
                key={division.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-[#12141A] border-[#D97706]/50 shadow-xl  ring-1 ring-[#D97706]/20'
                    : 'bg-[#12141A] border-[#1F2430] hover:border-zinc-700 hover:bg-[#15151b]'
                }`}
              >
                {/* ACCORDION HEADER (Clickable Area) */}
                <div
                  onClick={() => handleToggleAccordion(division.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                >
                  {/* Left: Division Letter Badge, Name & Muscle Groups */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Badge */}
                    <div className="flex-shrink-0 pt-0.5 sm:pt-0">
                      <span
                        className={`text-xs font-mono font-black uppercase px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
                          isExpanded
                            ? 'bg-[#E2E8F0] text-[#090A0C] font-bold border-[#D97706] shadow-md '
                            : 'bg-zinc-900 text-[#38BDF8] border-[#1F2430]'
                        }`}
                      >
                        TREINO {division.letter}
                      </span>
                    </div>

                    {/* Titles */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-white uppercase font-mono tracking-tight truncate">
                          {division.name.startsWith('Treino ')
                            ? division.name.replace(/^Treino\s+[A-Z]\s*[-–—:]\s*/i, '')
                            : division.name}
                        </h2>

                        {isAllCompleted && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center gap-1 uppercase">
                            <Check className="w-3 h-3 stroke-[3]" />
                            Concluído Hoje
                          </span>
                        )}
                      </div>

                      {/* Muscle Groups */}
                      {formattedMuscles && (
                        <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                          {formattedMuscles}
                        </p>
                      )}

                      {/* Exercises Count */}
                      <span className="text-[11px] font-mono text-zinc-500 block mt-0.5">
                        {totalExercises} {totalExercises === 1 ? 'exercício cadastrado' : 'exercícios cadastrados'}
                        {totalExercises > 0 && ` · ${completedCount}/${totalExercises} feitos hoje`}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions [Edit] [Delete] [Chevron] */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#1F2430]"
                  >
                    {/* EDIT BUTTON */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditDivision(division, e)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={`Editar Treino ${division.letter} e exercícios`}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Editar</span>
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenDeleteDivision(division, e)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-500/10 border border-[#1F2430] hover:border-red-500/30 text-zinc-500 hover:text-red-400 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                      title={`Excluir Treino ${division.letter}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Excluir</span>
                    </button>

                    {/* ACCORDION CHEVRON TOGGLE */}
                    <button
                      type="button"
                      onClick={() => handleToggleAccordion(division.id)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isExpanded
                          ? 'bg-[#E2E8F0] text-[#090A0C] font-bold border-[#D97706] shadow-sm'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border-[#1F2430] hover:border-zinc-700'
                      }`}
                      title={isExpanded ? 'Recolher treino' : 'Expandir treino'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* EXPANDED CONTENT: EXERCISES LIST & EXECUTION */}
                {isExpanded && (
                  <div className="border-t border-[#1F2430] bg-black/40 p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                    {/* Sub-header / Today's Execution Banner for this Division */}
                    <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-950/80 border border-[#1F2430] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#38BDF8] font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
                          <span>Execução Diária · {todayStr}</span>
                        </div>
                        {division.description ? (
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">
                            {division.description}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-500 font-mono mt-0.5">
                            Marque os exercícios concluídos e registre a evolução de carga hoje
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono">
                          <span className="text-[10px] text-zinc-500 uppercase block">Progresso</span>
                          <span className="text-xs font-bold text-white">
                            {completedCount}/{totalExercises}{' '}
                            <span className="text-[#38BDF8]">({percentDone}%)</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleDivisionCompletion(division)}
                          className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                            isAllCompleted
                              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#D97706]/40'
                              : 'bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none shadow-sm'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{isAllCompleted ? 'Treino Feito ✅' : 'Concluir Todos'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenAddExerciseForDivision(division.id, e)}
                          className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                          title="Adicionar exercício a este treino"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>+ Exercício</span>
                        </button>
                      </div>
                    </div>

                    {/* Exercises Checklist & Cargas */}
                    {division.exercises.length === 0 ? (
                      <div className="py-10 text-center text-xs font-mono text-zinc-500 bg-black/20 rounded-xl border border-dashed border-[#1F2430] space-y-2">
                        <p>Nenhum exercício cadastrado nesta divisão.</p>
                        <button
                          type="button"
                          onClick={(e) => handleOpenAddExerciseForDivision(division.id, e)}
                          className="text-[#38BDF8] hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar primeiro exercício</span>
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-800/60 rounded-xl border border-[#1F2430] bg-zinc-950/40 overflow-hidden">
                        {division.exercises.map((exercise, idx) => {
                          const isDone = currentLog.completedExercises[exercise.id] === true;
                          const currentExerciseLoad =
                            currentLog.exerciseLoads[exercise.id] !== undefined
                              ? currentLog.exerciseLoads[exercise.id]
                              : exercise.load;

                          return (
                            <div
                              key={exercise.id}
                              className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-colors ${
                                isDone ? 'bg-black/50' : 'hover:bg-zinc-900/40'
                              }`}
                            >
                              {/* Exercise Info & Checkbox */}
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleExerciseDone(division.id, exercise.id)}
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                                    isDone
                                      ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm'
                                      : 'bg-zinc-900 border border-zinc-700 text-zinc-500 hover:border-[#D97706]'
                                  }`}
                                  title={isDone ? 'Desmarcar exercício' : 'Marcar como concluído hoje'}
                                >
                                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                                </button>

                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-mono text-zinc-500 font-bold">
                                      #{idx + 1}
                                    </span>
                                    <span
                                      className={`text-sm font-bold font-mono ${
                                        isDone ? 'line-through text-zinc-500' : 'text-white'
                                      }`}
                                    >
                                      {exercise.name}
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-[#38BDF8] border border-[#1F2430] font-semibold uppercase">
                                      {exercise.muscleGroup}
                                    </span>
                                  </div>
                                  {exercise.notes && (
                                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                      Nota: {exercise.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Sets, Reps, Load & Actions */}
                              <div className="flex items-center justify-between sm:justify-end gap-4 pl-10 sm:pl-0 font-mono text-xs">
                                <div className="text-center sm:text-right">
                                  <span className="text-[10px] text-zinc-500 uppercase block">
                                    Séries x Reps
                                  </span>
                                  <span className="font-bold text-zinc-200">
                                    {exercise.sets} séries × {exercise.reps}
                                  </span>
                                </div>

                                {/* Interactive Weight / Load adjustment */}
                                <div className="flex items-center gap-1.5 bg-black/60 border border-[#1F2430] rounded-xl p-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateLoad(division.id, exercise.id, Math.max(0, currentExerciseLoad - 2.5))
                                    }
                                    className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer font-bold"
                                    title="Diminuir 2.5 kg"
                                  >
                                    -
                                  </button>
                                  <div className="px-2 text-center min-w-[58px]">
                                    <span className="text-xs font-bold text-[#38BDF8] block tabular-nums">
                                      {currentExerciseLoad} kg
                                    </span>
                                    <span className="text-[9px] text-zinc-500">carga</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateLoad(division.id, exercise.id, currentExerciseLoad + 2.5)
                                    }
                                    className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer font-bold"
                                    title="Aumentar 2.5 kg"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Delete Exercise from Division */}
                                <button
                                  type="button"
                                  onClick={() => onDeleteExercise(division.id, exercise.id)}
                                  className="p-1.5 rounded-lg text-zinc-600 hover:text-[#F3F4F6] transition-colors cursor-pointer"
                                  title="Excluir exercício deste treino"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          MODAL 1: EDITAR TREINO (DIVISÃO & EXERCÍCIOS)
          ======================================================== */}
      {editingDivision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl text-zinc-100  max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2430] flex-shrink-0">
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#38BDF8]" />
                <span>Editar Treino {editLetter}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingDivision(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDivision} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
              {/* Letter and Name */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Identificação *
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    value={editLetter}
                    onChange={(e) => setEditLetter(e.target.value)}
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-center text-sm font-mono font-bold text-[#38BDF8] uppercase focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Nome do Treino *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ex: Peitoral, Tríceps & Deltoide Anterior"
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              {/* Target Muscles */}
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Grupos Musculares *
                </label>
                <input
                  type="text"
                  required
                  value={editMuscles}
                  onChange={(e) => setEditMuscles(e.target.value)}
                  placeholder="Ex: Deltoides • Trapézio • Core"
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Descrição / Diretrizes do Treino (Opcional)
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ex: Foco em intensidade alta e descanso de 90s entre séries"
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#D97706]"
                />
              </div>

              {/* Exercises List & Reordering */}
              <div className="space-y-2 pt-2 border-t border-[#1F2430]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase text-zinc-400 font-bold">
                    Exercícios Cadastrados ({editExercises.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingExerciseInEdit(!isAddingExerciseInEdit)}
                    className="text-xs font-mono text-[#38BDF8] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingExerciseInEdit ? 'Fechar Formulário' : '+ Adicionar Exercício'}</span>
                  </button>
                </div>

                {/* Inline Exercise Adder Form */}
                {isAddingExerciseInEdit && (
                  <div className="p-3.5 rounded-xl bg-black/70 border border-[#D97706]/40 space-y-3">
                    <span className="text-[11px] font-mono uppercase text-[#38BDF8] font-bold block">
                      Novo Exercício na Divisão
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nome do Exercício *"
                        value={newExName}
                        onChange={(e) => setNewExName(e.target.value)}
                        className="bg-zinc-900 border border-[#1F2430] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:border-[#D97706]"
                      />
                      <input
                        type="text"
                        placeholder="Grupo Muscular (ex: Peitoral)"
                        value={newExMuscle}
                        onChange={(e) => setNewExMuscle(e.target.value)}
                        className="bg-zinc-900 border border-[#1F2430] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:border-[#D97706]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Séries"
                        value={newExSets}
                        onChange={(e) => setNewExSets(e.target.value)}
                        className="bg-zinc-900 border border-[#1F2430] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                      />
                      <input
                        type="text"
                        placeholder="Reps (ex: 8-12)"
                        value={newExReps}
                        onChange={(e) => setNewExReps(e.target.value)}
                        className="bg-zinc-900 border border-[#1F2430] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                      />
                      <input
                        type="number"
                        placeholder="Carga (kg)"
                        value={newExLoad}
                        onChange={(e) => setNewExLoad(e.target.value)}
                        className="bg-zinc-900 border border-[#1F2430] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#38BDF8] font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingExerciseInEdit(false)}
                        className="px-3 py-1 text-xs font-mono text-zinc-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAddExerciseInEdit}
                        className="px-3 py-1 rounded-lg bg-[#E2E8F0] text-[#090A0C] font-bold text-xs uppercase hover:bg-white transition-colors cursor-pointer"
                      >
                        Inserir na Lista
                      </button>
                    </div>
                  </div>
                )}

                {/* Exercises Reorderable List */}
                {editExercises.length === 0 ? (
                  <div className="py-6 text-center text-xs font-mono text-zinc-500 bg-black/30 rounded-xl border border-dashed border-[#1F2430]">
                    Nenhum exercício cadastrado. Clique acima para adicionar.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/60 rounded-xl border border-[#1F2430] bg-black/40 overflow-hidden max-h-[30vh] overflow-y-auto">
                    {editExercises.map((ex, index) => (
                      <div
                        key={ex.id}
                        className="p-2.5 sm:p-3 flex items-center justify-between gap-3 text-xs font-mono hover:bg-zinc-900/30"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[10px] text-zinc-500 font-bold w-5">
                            #{index + 1}
                          </span>
                          <span className="font-bold text-white truncate max-w-[180px] sm:max-w-none">
                            {ex.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-[#38BDF8] border border-[#1F2430] hidden sm:inline">
                            {ex.muscleGroup}
                          </span>
                          <span className="text-zinc-400 text-[11px] hidden md:inline">
                            ({ex.sets}x{ex.reps} · {ex.load}kg)
                          </span>
                        </div>

                        {/* Order Buttons (Up / Down) & Remove */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveExercise(index, 'up')}
                            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === editExercises.length - 1}
                            onClick={() => handleMoveExercise(index, 'down')}
                            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveExerciseInEdit(ex.id)}
                            className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 cursor-pointer ml-1"
                            title="Remover exercício"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2430] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingDivision(null)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs uppercase font-mono tracking-wider transition-all shadow-lg  cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: CONFIRMAÇÃO DE EXCLUSÃO DE TREINO
          ======================================================== */}
      {deletingDivision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                  Excluir treino?
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  Confirmação de ação irreversível
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6 font-mono text-xs text-zinc-300 bg-black/40 p-4 rounded-xl border border-[#1F2430]">
              <p>
                Tem certeza que deseja excluir o{' '}
                <span className="text-white font-bold">
                  Treino {deletingDivision.letter} — {deletingDivision.name}
                </span>
                ?
              </p>
              <p className="text-zinc-500 text-[11px]">
                Essa ação não poderá ser desfeita. Todos os {deletingDivision.exercises.length} exercícios desta
                divisão serão removidos.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDivision(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDivision}
                className="px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/60 text-red-400 font-extrabold text-xs uppercase font-mono tracking-wider transition-all cursor-pointer shadow-lg shadow-red-500/10"
              >
                Excluir treino
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: ADICIONAR EXERCÍCIO
          ======================================================== */}
      {isAddExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl text-zinc-100 ">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1F2430]">
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Novo Exercício · Treino{' '}
                {workoutDivisions.find((d) => d.id === targetDivisionForExercise)?.letter || ''}
              </h3>
              <button
                onClick={() => setIsAddExerciseModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Divisão de Treino Alvo
                </label>
                <select
                  value={targetDivisionForExercise}
                  onChange={(e) => setTargetDivisionForExercise(e.target.value)}
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                >
                  {workoutDivisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      Treino {d.letter} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Nome do Exercício *
                </label>
                <input
                  type="text"
                  required
                  value={exName}
                  onChange={(e) => setExName(e.target.value)}
                  placeholder="Ex: Supino Reto com Barra, Agachamento Livre, Levantamento Terra"
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Grupo Muscular
                  </label>
                  <input
                    type="text"
                    value={exMuscle}
                    onChange={(e) => setExMuscle(e.target.value)}
                    placeholder="Ex: Peitoral, Dorsal, Quadríceps"
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Carga Inicial (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={exLoad}
                    onChange={(e) => setExLoad(e.target.value)}
                    placeholder="60"
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-[#38BDF8] font-bold focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Séries
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={exSets}
                    onChange={(e) => setExSets(e.target.value)}
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Faixa de Repetições
                  </label>
                  <input
                    type="text"
                    value={exReps}
                    onChange={(e) => setExReps(e.target.value)}
                    placeholder="8-12 ou Falha"
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Observações / Dicas de Execução (Opcional)
                </label>
                <input
                  type="text"
                  value={exNotes}
                  onChange={(e) => setExNotes(e.target.value)}
                  placeholder="Ex: Pausa de 2s embaixo, cadência controlada"
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2430]">
                <button
                  type="button"
                  onClick={() => setIsAddExerciseModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs uppercase font-mono tracking-wider transition-all shadow-lg "
                >
                  Cadastrar Exercício
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: ADICIONAR NOVA DIVISÃO
          ======================================================== */}
      {isAddDivisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl text-zinc-100 ">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1F2430]">
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Nova Divisão de Treino
              </h3>
              <button
                onClick={() => setIsAddDivisionModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDivision} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Letra
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    value={divLetter}
                    onChange={(e) => setDivLetter(e.target.value)}
                    placeholder="E"
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-center text-sm font-mono font-bold text-[#38BDF8] uppercase focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Nome da Divisão *
                  </label>
                  <input
                    type="text"
                    required
                    value={divName}
                    onChange={(e) => setDivName(e.target.value)}
                    placeholder="Ex: Treino E - Braços & Abdômen"
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Grupos Musculares Alvo *
                </label>
                <input
                  type="text"
                  required
                  value={divMuscles}
                  onChange={(e) => setDivMuscles(e.target.value)}
                  placeholder="Ex: Bíceps • Tríceps • Antebraço • Core"
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Descrição / Diretrizes (Opcional)
                </label>
                <input
                  type="text"
                  value={divDescription}
                  onChange={(e) => setDivDescription(e.target.value)}
                  placeholder="Ex: Foco em hipertrofia de braços com superséries"
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2430]">
                <button
                  type="button"
                  onClick={() => setIsAddDivisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs uppercase font-mono tracking-wider transition-all shadow-lg "
                >
                  Criar Divisão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
