import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Scale,
  Activity,
  Target,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { UserProfile, BiologicalSex, ActivityLevel, GoalDirection } from '../types';
import { calculateBMR, calculateTDEE, calculateMacros } from '../utils/calculations';

interface FirstAccessOnboardingModalProps {
  initialProfile: UserProfile;
  userName: string;
  onComplete: (updatedProfile: UserProfile) => void;
}

export const FirstAccessOnboardingModal: React.FC<FirstAccessOnboardingModalProps> = ({
  initialProfile,
  userName,
  onComplete,
}) => {
  const [name, setName] = useState(userName || initialProfile.name || '');
  const [age, setAge] = useState<number>(initialProfile.age || 26);
  const [gender, setGender] = useState<BiologicalSex>(initialProfile.gender || 'male');
  const [height, setHeight] = useState<number>(initialProfile.height || 178);
  const [currentWeight, setCurrentWeight] = useState<number>(initialProfile.currentWeight || 80.0);
  const [targetWeight, setTargetWeight] = useState<number>(initialProfile.targetWeight || 75.0);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile.activityLevel || 'intense'
  );
  const [goalType, setGoalType] = useState<GoalDirection>(initialProfile.goalType || 'cut');

  // Real-time metabolic calculations
  const bmr = calculateBMR(currentWeight, height, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const macros = calculateMacros(tdee, currentWeight, goalType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...initialProfile,
      name: name.trim() || userName || 'Atleta Kairos',
      age: Number(age) || 26,
      gender,
      height: Number(height) || 178,
      currentWeight: Number(currentWeight) || 80,
      targetWeight: Number(targetWeight) || 75,
      activityLevel,
      goalType,
      updatedAt: new Date().toISOString(),
    };
    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 font-sans antialiased text-[#F3F4F6]">
      <div className="relative w-full max-w-2xl bg-[#12141A] border border-[#1F2430] rounded-2xl shadow-2xl p-5 sm:p-7 md:p-8 my-auto">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F2430] border border-[#2A2F3D] text-[#38BDF8] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Calibração de Primeiro Acesso</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F3F4F6]">
            Configuração das Métricas Físicas
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-lg mx-auto">
            Bem-vindo ao <strong className="text-[#F3F4F6]">FORGE</strong>! Insira seus dados corporais para calibrarmos com precisão sua Taxa Metabólica Basal (TMB), Gasto Energético Total (GETD) e metas diárias.
          </p>
        </div>

        {/* Real-time Metabolic Stats Preview */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl bg-[#0D0E14] border border-[#1F2430] mb-6">
          <div className="text-center p-2 rounded-lg bg-[#12141A] border border-[#1F2430]">
            <span className="text-[10px] sm:text-xs font-semibold uppercase text-[#9CA3AF] flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-[#D97706]" /> TMB (Basal)
            </span>
            <div className="text-base sm:text-xl font-bold text-[#F3F4F6] mt-0.5">
              {bmr} <span className="text-[10px] text-[#9CA3AF] font-normal">kcal</span>
            </div>
            <span className="text-[9px] text-[#6B7280] block">Gasto em repouso</span>
          </div>

          <div className="text-center p-2 rounded-lg bg-[#12141A] border border-[#1F2430]">
            <span className="text-[10px] sm:text-xs font-semibold uppercase text-[#9CA3AF] flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-[#38BDF8]" /> GETD (Total)
            </span>
            <div className="text-base sm:text-xl font-bold text-[#38BDF8] mt-0.5">
              {tdee} <span className="text-[10px] text-[#9CA3AF] font-normal">kcal</span>
            </div>
            <span className="text-[9px] text-[#6B7280] block">Com seus treinos</span>
          </div>

          <div className="text-center p-2 rounded-lg bg-[#12141A] border border-[#1F2430]">
            <span className="text-[10px] sm:text-xs font-semibold uppercase text-[#9CA3AF] flex items-center justify-center gap-1">
              <Target className="w-3 h-3 text-[#E2E8F0]" /> Meta Diária
            </span>
            <div className="text-base sm:text-xl font-bold text-[#E2E8F0] mt-0.5">
              {macros.targetCalories} <span className="text-[10px] text-[#9CA3AF] font-normal">kcal</span>
            </div>
            <span className="text-[9px] text-[#6B7280] block">Para o seu objetivo</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Nome */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                Nome de Exibição
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2 text-sm text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
              />
            </div>

            {/* Gênero Biológico */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                Gênero Biológico (Fórmula Harris-Benedict)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as BiologicalSex)}
                className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2 text-sm text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
              >
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>

            {/* Idade */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                Idade (Anos)
              </label>
              <input
                type="number"
                min={14}
                max={99}
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2 text-sm text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
              />
            </div>

            {/* Altura */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                Altura (cm)
              </label>
              <input
                type="number"
                min={120}
                max={230}
                required
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2 text-sm text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
              />
            </div>

            {/* Peso Atual */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                Peso Atual (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min={30}
                max={250}
                required
                value={currentWeight}
                onChange={(e) => setCurrentWeight(Number(e.target.value))}
                className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2 text-sm text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
              />
            </div>

            {/* Peso Alvo */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                Peso Alvo (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min={30}
                max={250}
                required
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2 text-sm text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
              />
            </div>

            {/* Nível de Atividade */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                Nível de Atividade Semanal
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2 text-sm text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
              >
                <option value="sedentary">Sedentário (pouco ou nenhum exercício)</option>
                <option value="light">Leve (exercício 1 a 3 dias/semana)</option>
                <option value="moderate">Moderado (exercício 3 a 5 dias/semana)</option>
                <option value="intense">Intenso (musculação pesada 6 a 7 dias)</option>
                <option value="very_intense">Muito Intenso (atleta / 2x ao dia)</option>
              </select>
            </div>

            {/* Objetivo */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                Objetivo Físico Tático
              </label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as GoalDirection)}
                className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2 text-sm text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
              >
                <option value="cut">Definição / Secar Gordura (Déficit Calórico)</option>
                <option value="maintain">Manutenção e Recomposição Corporal</option>
                <option value="bulk">Ganho de Massa Muscular (Superávit Calórico)</option>
              </select>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide bg-[#D97706] hover:bg-[#b45309] text-white active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border border-[#f59e0b]/20"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              <span>CALIBRAR MÉTRICAS & ATIVAR COCKPIT</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
