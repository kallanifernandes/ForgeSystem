import React, { useState } from 'react';
import {
  Target,
  Plus,
  Dumbbell,
  Brain,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  ChevronRight,
  TrendingUp,
  X,
  Check
} from 'lucide-react';
import { Goal, PillarType } from '../types';

interface GoalsViewProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | PillarType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pillar, setPillar] = useState<PillarType>('corpo');
  const [currentVal, setCurrentVal] = useState('0');
  const [targetVal, setTargetVal] = useState('100');
  const [unit, setUnit] = useState('kg');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');

  const filteredGoals = goals.filter((g) => {
    if (selectedFilter === 'all') return true;
    return g.pillar === selectedFilter;
  });

  // Calculate pillar completion averages
  const calculatePillarAvg = (p: PillarType) => {
    const list = goals.filter((g) => g.pillar === p);
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, g) => {
      if (g.completed) return acc + 100;
      const pct = Math.min(100, Math.max(0, (g.current / g.target) * 100));
      return acc + pct;
    }, 0);
    return Math.round(sum / list.length);
  };

  const corpoAvg = calculatePillarAvg('corpo');
  const menteAvg = calculatePillarAvg('mente');
  const almaAvg = calculatePillarAvg('alma');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddGoal({
      title: title.trim(),
      description: description.trim() || undefined,
      pillar,
      current: parseFloat(currentVal) || 0,
      target: parseFloat(targetVal) || 1,
      unit: unit.trim() || 'un',
      deadline: deadline || new Date().toISOString().split('T')[0],
      priority,
      completed: false,
    });

    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  const getDaysRemaining = (deadlineStr: string) => {
    const target = new Date(deadlineStr);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <span>Metas Integrais (Corpo & Mindset)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Planejamento estratégico e métricas de evolução para os 3 pilares essenciais
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Meta Integral</span>
        </button>
      </div>

      {/* THREE PILLARS SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CORPO */}
        <div
          onClick={() => setSelectedFilter(selectedFilter === 'corpo' ? 'all' : 'corpo')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'corpo'
              ? 'bg-emerald-950/30 border-emerald-500/50'
              : 'bg-[#121316] border-white/[0.08] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              <span>CORPO</span>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-400">
              {corpoAvg}%
            </span>
          </div>
          <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${corpoAvg}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 block">
            {goals.filter((g) => g.pillar === 'corpo').length} metas ativas
          </span>
        </div>

        {/* MENTE */}
        <div
          onClick={() => setSelectedFilter(selectedFilter === 'mente' ? 'all' : 'mente')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'mente'
              ? 'bg-blue-950/30 border-blue-500/50'
              : 'bg-[#121316] border-white/[0.08] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Brain className="w-4 h-4 text-blue-400" />
              <span>MENTE</span>
            </div>
            <span className="font-mono text-xs font-semibold text-blue-400">
              {menteAvg}%
            </span>
          </div>
          <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-blue-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${menteAvg}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 block">
            {goals.filter((g) => g.pillar === 'mente').length} metas ativas
          </span>
        </div>

        {/* ALMA */}
        <div
          onClick={() => setSelectedFilter(selectedFilter === 'alma' ? 'all' : 'alma')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'alma'
              ? 'bg-purple-950/30 border-purple-500/50'
              : 'bg-[#121316] border-white/[0.08] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>ALMA</span>
            </div>
            <span className="font-mono text-xs font-semibold text-purple-400">
              {almaAvg}%
            </span>
          </div>
          <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-purple-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${almaAvg}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 block">
            {goals.filter((g) => g.pillar === 'alma').length} metas ativas
          </span>
        </div>
      </div>

      {/* FILTER SEGMENTED CONTROLS */}
      <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl w-fit">
        {[
          { key: 'all' as const, label: 'Todas as Metas' },
          { key: 'corpo' as const, label: '🏋️ Corpo' },
          { key: 'mente' as const, label: '🧠 Mente' },
          { key: 'alma' as const, label: '🧘 Alma' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedFilter === tab.key
                ? 'bg-white/10 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* GOALS LIST */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#121316] border border-white/[0.08] text-center">
            <p className="text-sm text-slate-400">
              Nenhuma meta cadastrada neste pilar.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 text-xs text-emerald-400 hover:underline cursor-pointer"
            >
              Criar primeira meta agora
            </button>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const pct = Math.min(100, Math.max(0, Math.round((goal.current / goal.target) * 100)));
            const daysLeft = getDaysRemaining(goal.deadline);
            const isCorpo = goal.pillar === 'corpo';
            const isMente = goal.pillar === 'mente';
            const isAlma = goal.pillar === 'alma';

            const accentColor = isCorpo
              ? 'text-emerald-400'
              : isMente
              ? 'text-blue-400'
              : 'text-purple-400';

            const progressBg = isCorpo
              ? 'bg-emerald-400'
              : isMente
              ? 'bg-blue-400'
              : 'bg-purple-400';

            return (
              <div
                key={goal.id}
                className={`p-5 rounded-2xl bg-[#121316] border transition-all ${
                  goal.completed
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-white/[0.08] hover:border-white/[0.14]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className={`uppercase font-semibold tracking-wider ${accentColor}`}>
                        {goal.pillar}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">
                        {goal.priority === 'high' ? 'Alta Prioridade' : goal.priority === 'medium' ? 'Prioridade Média' : 'Prioridade Normal'}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {daysLeft > 0 ? `${daysLeft} dias restantes` : daysLeft === 0 ? 'Vence hoje' : 'Prazo expirado'}
                      </span>
                    </div>

                    <h3 className={`text-base font-semibold ${goal.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                      {goal.title}
                    </h3>

                    {goal.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  {/* Actions & Stepper */}
                  <div className="flex items-center gap-3 self-end md:self-start">
                    {/* Stepper buttons */}
                    <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl p-1">
                      <button
                        onClick={() =>
                          onUpdateGoal(goal.id, {
                            current: Math.max(0, +(goal.current - 1).toFixed(1)),
                          })
                        }
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] font-mono text-sm cursor-pointer"
                        title="Diminuir"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-mono font-semibold text-slate-200">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateGoal(goal.id, {
                            current: +(goal.current + 1).toFixed(1),
                          })
                        }
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] font-mono text-sm cursor-pointer"
                        title="Aumentar"
                      >
                        +
                      </button>
                    </div>

                    {/* Toggle Completed */}
                    <button
                      onClick={() => onUpdateGoal(goal.id, { completed: !goal.completed })}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        goal.completed
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                          : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-emerald-400'
                      }`}
                      title={goal.completed ? 'Desmarcar' : 'Concluir meta'}
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Excluir meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar and percentages */}
                <div className="mt-4 pt-3 border-t border-white/[0.04]">
                  <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                    <span className="text-slate-400">Progresso</span>
                    <span className={`font-semibold ${accentColor}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden">
                    <div
                      className={`${progressBg} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: NOVA META */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#121316] border border-white/10 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Criar Nova Meta Integral</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Pilar Integral
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['corpo', 'mente', 'alma'] as PillarType[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPillar(p)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium uppercase font-mono transition-all cursor-pointer ${
                        pillar === p
                          ? 'bg-white/15 text-white border border-white/30 shadow-sm'
                          : 'bg-white/[0.02] text-slate-400 border border-white/[0.06]'
                      }`}
                    >
                      {p === 'corpo' ? '🏋️ Corpo' : p === 'mente' ? '🧠 Mente' : '🧘 Alma'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Título da Meta
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Chegar aos 78kg com definição muscular"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Descrição ou Estratégia
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Déficit calórico moderado de 450 kcal e 5 treinos semanais."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Valor Atual
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentVal}
                    onChange={(e) => setCurrentVal(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Valor Alvo
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={targetVal}
                    onChange={(e) => setTargetVal(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Unidade
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg, páginas, h"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Data Limite (Prazo)
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#1c1d22] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full bg-[#1c1d22] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="high">Alta Prioridade</option>
                    <option value="medium">Média Prioridade</option>
                    <option value="low">Baixa Prioridade</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
