import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Dumbbell,
  Brain,
  ShieldCheck,
  Flame,
  Salad,
  Calendar,
  AlertTriangle,
  Lightbulb,
  Plus,
  Scale
} from 'lucide-react';
import {
  UserProfile,
  HabitItem,
  DailyRecord,
  WeightRecord,
  FortnightStats,
  PillarType
} from '../types';
import {
  computeFortnightAnalysis,
  formatDateKey
} from '../utils/calculations';

interface FortnightReviewViewProps {
  profile: UserProfile;
  habits: HabitItem[];
  dailyRecords: Record<string, DailyRecord>;
  weightHistory: WeightRecord[];
  onOpenQuickWeightModal: () => void;
}

export const FortnightReviewView: React.FC<FortnightReviewViewProps> = ({
  profile,
  habits,
  dailyRecords,
  weightHistory,
  onOpenQuickWeightModal,
}) => {
  const [cycleMode, setCycleMode] = useState<'current' | 'previous'>('current');

  // Compute date ranges for 14-day cycles
  const { startDate, endDate, prevStartDate, prevEndDate } = useMemo(() => {
    const today = new Date();
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(start.getDate() - 13); // 14 days total

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
      profile
    );
  }, [activeStart, activeEnd, dailyRecords, habits, weightHistory, profile]);

  // Previous cycle comparison stats
  const comparisonStats = useMemo(() => {
    return computeFortnightAnalysis(
      prevStartDate,
      prevEndDate,
      dailyRecords,
      habits,
      weightHistory,
      profile
    );
  }, [prevStartDate, prevEndDate, dailyRecords, habits, weightHistory, profile]);

  // SVG Radar Coordinates Calculation (Equilateral Triangle for 3 Pillars)
  // Center: (150, 150), Radius: 100
  // Top: Alma (Angle -90 deg = -PI/2) -> (150, 50)
  // Bottom Right: Corpo (Angle 30 deg = PI/6) -> (150 + 100*cos(30), 150 + 100*sin(30)) -> (236.6, 200)
  // Bottom Left: Mente (Angle 150 deg = 5PI/6) -> (150 + 100*cos(150), 150 + 100*sin(150)) -> (63.4, 200)
  const radarData = useMemo(() => {
    const cx = 160;
    const cy = 160;
    const maxR = 100;

    const almaPct = Math.min(100, Math.max(10, currentStats.pillarExecution.alma)) / 100;
    const corpoPct = Math.min(100, Math.max(10, currentStats.pillarExecution.corpo)) / 100;
    const mentePct = Math.min(100, Math.max(10, currentStats.pillarExecution.mente)) / 100;

    // Angles
    // Alma: -PI / 2
    const almaX = cx;
    const almaY = cy - maxR * almaPct;

    // Corpo: PI / 6 (30 deg)
    const corpoAngle = Math.PI / 6;
    const corpoX = cx + maxR * corpoPct * Math.cos(corpoAngle);
    const corpoY = cy + maxR * corpoPct * Math.sin(corpoAngle);

    // Mente: 5 * PI / 6 (150 deg)
    const menteAngle = (5 * Math.PI) / 6;
    const menteX = cx + maxR * mentePct * Math.cos(menteAngle);
    const menteY = cy + maxR * mentePct * Math.sin(menteAngle);

    // Baseline grid circles / triangles at 25%, 50%, 75%, 100%
    const levels = [0.25, 0.5, 0.75, 1.0];
    const gridPolygons = levels.map((lvl) => {
      const p1 = `${cx},${cy - maxR * lvl}`;
      const p2 = `${cx + maxR * lvl * Math.cos(corpoAngle)},${cy + maxR * lvl * Math.sin(corpoAngle)}`;
      const p3 = `${cx + maxR * lvl * Math.cos(menteAngle)},${cy + maxR * lvl * Math.sin(menteAngle)}`;
      return `${p1} ${p2} ${p3}`;
    });

    return {
      polygonPoints: `${almaX},${almaY} ${corpoX},${corpoY} ${menteX},${menteY}`,
      gridPolygons,
      cx,
      cy,
      maxR,
      almaPoint: { x: almaX, y: almaY },
      corpoPoint: { x: corpoX, y: corpoY },
      mentePoint: { x: menteX, y: menteY },
    };
  }, [currentStats]);

  // Weight Trend Line Chart Calculation
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

  return (
    <div className="space-y-6">
      {/* Title & Cycle Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Análise Quinzenal (Ciclos de 14 Dias)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Relatório de desenvoltura, equilíbrio entre pilares e evolução metabólica
          </p>
        </div>

        {/* Cycle Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setCycleMode('current')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              cycleMode === 'current'
                ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quinzena Atual ({startDate.slice(5)} a {endDate.slice(5)})
          </button>
          <button
            onClick={() => setCycleMode('previous')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              cycleMode === 'previous'
                ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ciclo Anterior
          </button>
        </div>
      </div>

      {/* TOP SUMMARY METRICS: EXECUTION %, DISCIPLINE, WEIGHT DELTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Taxa Geral de Execução */}
        <div className="p-4 rounded-2xl bg-[#121316] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">
              Taxa Geral de Execução
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-white">
                {currentStats.executionRate}%
              </span>
              <span className="text-xs text-emerald-400 font-mono font-semibold">
                {currentStats.totalCompletedHabits}/{currentStats.totalPlannedHabits} hábitos
              </span>
            </div>
          </div>
          <div className="mt-3 w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${currentStats.executionRate}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Dias Sem Álcool no Ciclo */}
        <div className="p-4 rounded-2xl bg-[#121316] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Consistência Sem Álcool</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-white">
                {currentStats.alcoholFreeRate}%
              </span>
              <span className="text-xs text-slate-400">do ciclo limpo</span>
            </div>
          </div>
          <span className="text-[11px] text-emerald-400/90 font-mono mt-2">
            Alta proteção do sono profundo e foco
          </span>
        </div>

        {/* Metric 3: Alimentação Limpa */}
        <div className="p-4 rounded-2xl bg-[#121316] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Salad className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dieta 100% no Plano</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-white">
                {currentStats.cleanDietRate}%
              </span>
              <span className="text-xs text-slate-400">conformidade</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-2">
            Déficit calórico preservado
          </span>
        </div>

        {/* Metric 4: Variação de Peso na Quinzena */}
        <div className="p-4 rounded-2xl bg-[#121316] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">
              Variação de Peso no Ciclo
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-mono font-bold ${
                  currentStats.weightDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {currentStats.weightDelta > 0 ? `+${currentStats.weightDelta}` : currentStats.weightDelta} kg
              </span>
              <span className="text-xs font-mono text-slate-400">
                ({currentStats.weightStart} → {currentStats.weightEnd} kg)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>TMB Atual:</span>
            <span className="font-mono text-white font-semibold">{currentStats.tmbEnd} kcal</span>
          </div>
        </div>
      </div>

      {/* CORE VISUAL REPORTS: RADAR DE EQUILÍBRIO & EVOLUÇÃO DE PESO/TMB */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RADAR DE EQUILÍBRIO (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#121316] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Radar de Equilíbrio Integral</span>
              </h2>
              <span className="text-xs font-mono text-emerald-400">
                Corpo · Mente · Alma
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              O desenvolvimento harmonioso exige proporção equilibrada entre força física, intelecto e quietude interior.
            </p>

            {/* Custom SVG Spider Radar Chart */}
            <div className="relative flex items-center justify-center py-2">
              <svg width="320" height="300" viewBox="0 0 320 300" className="overflow-visible">
                {/* Background Concentric Grid Triangles */}
                {radarData.gridPolygons.map((pts, idx) => (
                  <polygon
                    key={idx}
                    points={pts}
                    fill={idx === 3 ? 'rgba(255, 255, 255, 0.015)' : 'none'}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                    strokeDasharray={idx < 3 ? '2 2' : 'none'}
                  />
                ))}

                {/* Axis lines from center to vertices */}
                <line
                  x1={radarData.cx}
                  y1={radarData.cy}
                  x2={radarData.cx}
                  y2={radarData.cy - radarData.maxR}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                />
                <line
                  x1={radarData.cx}
                  y1={radarData.cy}
                  x2={radarData.cx + radarData.maxR * Math.cos(Math.PI / 6)}
                  y2={radarData.cy + radarData.maxR * Math.sin(Math.PI / 6)}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                />
                <line
                  x1={radarData.cx}
                  y1={radarData.cy}
                  x2={radarData.cx + radarData.maxR * Math.cos((5 * Math.PI) / 6)}
                  y2={radarData.cy + radarData.maxR * Math.sin((5 * Math.PI) / 6)}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                />

                {/* Filled Radar Polygon */}
                <polygon
                  points={radarData.polygonPoints}
                  fill="url(#radarGradient)"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  className="transition-all duration-700"
                />

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
                  </linearGradient>
                </defs>

                {/* Vertex Points */}
                <circle
                  cx={radarData.almaPoint.x}
                  cy={radarData.almaPoint.y}
                  r="5"
                  className="fill-purple-400 stroke-[#121316] stroke-2"
                />
                <circle
                  cx={radarData.corpoPoint.x}
                  cy={radarData.corpoPoint.y}
                  r="5"
                  className="fill-emerald-400 stroke-[#121316] stroke-2"
                />
                <circle
                  cx={radarData.mentePoint.x}
                  cy={radarData.mentePoint.y}
                  r="5"
                  className="fill-blue-400 stroke-[#121316] stroke-2"
                />

                {/* Vertex Labels & Values */}
                {/* ALMA (Top) */}
                <text
                  x={radarData.cx}
                  y={radarData.cy - radarData.maxR - 16}
                  textAnchor="middle"
                  className="fill-purple-400 text-xs font-semibold font-mono"
                >
                  🧘 ALMA ({currentStats.pillarExecution.alma}%)
                </text>

                {/* CORPO (Bottom Right) */}
                <text
                  x={radarData.cx + radarData.maxR * Math.cos(Math.PI / 6) + 12}
                  y={radarData.cy + radarData.maxR * Math.sin(Math.PI / 6) + 16}
                  textAnchor="start"
                  className="fill-emerald-400 text-xs font-semibold font-mono"
                >
                  🏋️ CORPO ({currentStats.pillarExecution.corpo}%)
                </text>

                {/* MENTE (Bottom Left) */}
                <text
                  x={radarData.cx + radarData.maxR * Math.cos((5 * Math.PI) / 6) - 12}
                  y={radarData.cy + radarData.maxR * Math.sin((5 * Math.PI) / 6) + 16}
                  textAnchor="end"
                  className="fill-blue-400 text-xs font-semibold font-mono"
                >
                  🧠 MENTE ({currentStats.pillarExecution.mente}%)
                </text>
              </svg>
            </div>
          </div>

          {/* Pillar comparison breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/[0.06] text-center">
            <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <span className="text-[10px] uppercase font-mono text-emerald-400 block">Corpo</span>
              <span className="text-base font-bold font-mono text-white">
                {currentStats.pillarExecution.corpo}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <span className="text-[10px] uppercase font-mono text-blue-400 block">Mente</span>
              <span className="text-base font-bold font-mono text-white">
                {currentStats.pillarExecution.mente}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <span className="text-[10px] uppercase font-mono text-purple-400 block">Alma</span>
              <span className="text-base font-bold font-mono text-white">
                {currentStats.pillarExecution.alma}%
              </span>
            </div>
          </div>
        </div>

        {/* EVOLUÇÃO DE PESO & TMB (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#121316] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-400" />
                  <span>Evolução de Peso e Taxa Metabólica Basal</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Acompanhamento biométrico para validação do déficit calórico
                </p>
              </div>

              <button
                onClick={onOpenQuickWeightModal}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-semibold text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Pesagem</span>
              </button>
            </div>

            {/* SVG Line / Area Graph */}
            {weightChart ? (
              <div className="py-4">
                <div className="relative w-full overflow-hidden">
                  <svg
                    viewBox={`0 0 ${weightChart.width} ${weightChart.height}`}
                    className="w-full h-44 overflow-visible"
                  >
                    <defs>
                      <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Subtle horizontal grid lines */}
                    <line
                      x1="25"
                      y1="25"
                      x2={weightChart.width - 25}
                      y2="25"
                      stroke="rgba(255,255,255,0.05)"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="25"
                      y1={weightChart.height / 2}
                      x2={weightChart.width - 25}
                      y2={weightChart.height / 2}
                      stroke="rgba(255,255,255,0.05)"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="25"
                      y1={weightChart.height - 25}
                      x2={weightChart.width - 25}
                      y2={weightChart.height - 25}
                      stroke="rgba(255,255,255,0.08)"
                    />

                    {/* Area fill */}
                    <path d={weightChart.areaD} fill="url(#weightArea)" />

                    {/* Line stroke */}
                    <path
                      d={weightChart.pathD}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Data Points */}
                    {weightChart.points.map((p, idx) => (
                      <g key={idx}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4.5"
                          className="fill-blue-400 stroke-[#121316] stroke-2"
                        />
                        <text
                          x={p.x}
                          y={p.y - 10}
                          textAnchor="middle"
                          className="fill-white text-[10px] font-mono font-semibold"
                        >
                          {p.weight} kg
                        </text>
                        <text
                          x={p.x}
                          y={weightChart.height - 8}
                          textAnchor="middle"
                          className="fill-slate-500 text-[9px] font-mono"
                        >
                          {p.date.slice(5)}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Registre pelo menos duas pesagens para traçar o gráfico de evolução.
              </div>
            )}
          </div>

          {/* Metabolic Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06]">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">TMB Inicial</span>
              <span className="text-sm font-bold font-mono text-white">
                {currentStats.tmbStart} kcal
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">TMB Atual</span>
              <span className="text-sm font-bold font-mono text-blue-400">
                {currentStats.tmbEnd} kcal
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Δ TMB</span>
              <span className="text-sm font-bold font-mono text-slate-300">
                {currentStats.tmbEnd - currentStats.tmbStart} kcal
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Meta Corporal</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {profile.targetWeight} kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DIAGNÓSTICO DA QUINZENA (INTELLIGENT PERFORMANCE DIAGNOSTIC) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Diagnóstico do Ciclo Quinzenal
            </h2>
            <p className="text-xs text-slate-400">
              Síntese de inteligência sobre seus padrões de consistência e diretrizes de ajuste
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Classification & Summary */}
          <div className="md:col-span-1 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                Classificação de Disciplina
              </span>
              <h4 className="text-lg font-bold text-white mt-1">
                {currentStats.diagnostic.disciplineGrade}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                {currentStats.diagnostic.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Pilar Forte:</span>
              <span className="text-emerald-400 font-semibold uppercase">
                {currentStats.diagnostic.dominantPillar}
              </span>
            </div>
          </div>

          {/* 3 Actionable Tactical Directives for Next 14 Days */}
          <div className="md:col-span-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Lightbulb className="w-4 h-4" />
              <span className="uppercase tracking-wider font-semibold">
                3 Diretrizes Táticas para os Próximos 14 Dias
              </span>
            </div>

            <div className="space-y-2.5">
              {currentStats.diagnostic.actionDirectives.map((directive, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {directive}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
