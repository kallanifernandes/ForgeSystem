import React, { useState } from 'react';
import {
  User,
  Scale,
  Flame,
  Zap,
  PieChart,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Plus,
  Check,
  Info
} from 'lucide-react';
import {
  UserProfile,
  ActivityLevel,
  GoalDirection,
  BiologicalSex,
  WeightRecord
} from '../types';
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  ACTIVITY_MULTIPLIERS,
  formatDateKey
} from '../utils/calculations';

interface ProfileViewProps {
  profile: UserProfile;
  weightHistory: WeightRecord[];
  onUpdateProfile: (updated: UserProfile) => void;
  onAddWeightRecord: (record: Omit<WeightRecord, 'id'>) => void;
  onDeleteWeightRecord: (id: string) => void;
  onResetDemoData: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  weightHistory,
  onUpdateProfile,
  onAddWeightRecord,
  onDeleteWeightRecord,
  onResetDemoData,
  onExportData,
  onImportData,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeightVal, setNewWeightVal] = useState(profile.currentWeight.toString());
  const [newWeightNote, setNewWeightNote] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(formatDateKey(new Date()));

  // Dynamic Metabolic Computations in Real-Time
  const currentBMR = calculateBMR(
    formData.currentWeight,
    formData.height,
    formData.age,
    formData.gender
  );
  const currentTDEE = calculateTDEE(currentBMR, formData.activityLevel);
  const macros = calculateMacros(currentTDEE, formData.currentWeight, formData.goalType);

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

    const tmb = calculateBMR(w, formData.height, formData.age, formData.gender);
    onAddWeightRecord({
      date: newWeightDate,
      weight: w,
      tmb,
      note: newWeightNote.trim() || undefined,
    });

    // Also sync profile weight
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <span>Perfil & Mensuração Física (Biometria)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configuração de dados antropométricos e cálculo metabólico por Mifflin-St Jeor
          </p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Alterações salvas com sucesso!</span>
          </span>
        )}
      </div>

      {/* METABOLIC DISPLAY CARDS (TMB, GETD, MACROS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TMB Card */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white">Taxa Metabólica Basal (TMB)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Mifflin-St Jeor</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-mono font-bold text-white">{currentBMR}</span>
            <span className="text-xs font-mono text-blue-400 font-semibold">kcal / dia</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Energia gasta em repouso absoluto para manter funções vitais (respiração, batimentos, tecidos).
          </p>
        </div>

        {/* GETD (TDEE) Card */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white">Gasto Energético Diário (GETD)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">TMB × Fator Ativ.</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-mono font-bold text-emerald-400">{currentTDEE}</span>
            <span className="text-xs font-mono text-slate-400 font-semibold">kcal / dia</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gasto energético real somando rotina diária e atividades físicas ({ACTIVITY_MULTIPLIERS[formData.activityLevel].multiplier}x).
          </p>
        </div>

        {/* Target Calories Card */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <PieChart className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white">Meta Calórica Diária</span>
            </div>
            <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold">
              {formData.goalType === 'cut' ? 'Déficit (-450kcal)' : formData.goalType === 'bulk' ? 'Superávit (+350kcal)' : 'Manutenção'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-mono font-bold text-white">{macros.targetCalories}</span>
            <span className="text-xs font-mono text-purple-400 font-semibold">kcal / dia</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Consumo ideal planejado para atingir seu peso meta de {formData.targetWeight} kg.
          </p>
        </div>
      </div>

      {/* MACRONUTRIENT DISTRIBUTION BREAKDOWN */}
      <div className="p-5 rounded-2xl bg-[#121316] border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Divisão Sugerida de Macronutrientes
            </h2>
            <p className="text-xs text-slate-400">
              Otimizada para retenção muscular, densidade nutricional e saciedade
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Planejado: <strong className="text-white">{macros.targetCalories} kcal</strong>
          </span>
        </div>

        {/* Visual Macro Proportional Bar */}
        <div className="w-full h-3 rounded-full bg-white/[0.05] overflow-hidden flex mb-4">
          <div
            style={{ width: `${(macros.proteinCalories / macros.targetCalories) * 100}%` }}
            className="bg-blue-500 h-full"
            title="Proteínas"
          />
          <div
            style={{ width: `${(macros.carbsCalories / macros.targetCalories) * 100}%` }}
            className="bg-emerald-500 h-full"
            title="Carboidratos"
          />
          <div
            style={{ width: `${(macros.fatCalories / macros.targetCalories) * 100}%` }}
            className="bg-amber-500 h-full"
            title="Gorduras"
          />
        </div>

        {/* 3 Macro Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Proteína */}
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-blue-300">🍗 Proteínas</span>
              <span className="text-[11px] font-mono text-blue-400 font-semibold">
                {Math.round((macros.proteinCalories / macros.targetCalories) * 100)}%
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-white">{macros.proteinGrams}g</span>
              <span className="text-xs font-mono text-slate-400">({macros.proteinCalories} kcal)</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Construção e reparo tecidual
            </span>
          </div>

          {/* Carboidratos */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-300">🍚 Carboidratos</span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                {Math.round((macros.carbsCalories / macros.targetCalories) * 100)}%
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-white">{macros.carbsGrams}g</span>
              <span className="text-xs font-mono text-slate-400">({macros.carbsCalories} kcal)</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Energia para treinos e funções cognitivas
            </span>
          </div>

          {/* Gorduras */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-amber-300">🥑 Gorduras Boas</span>
              <span className="text-[11px] font-mono text-amber-400 font-semibold">
                {Math.round((macros.fatCalories / macros.targetCalories) * 100)}%
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-white">{macros.fatGrams}g</span>
              <span className="text-xs font-mono text-slate-400">({macros.fatCalories} kcal)</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Equilíbrio hormonal e absorção de vitaminas
            </span>
          </div>
        </div>
      </div>

      {/* USER SETUP FORM & WEIGHT LOG SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#121316] border border-white/[0.08]">
          <h2 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-white/[0.06]">
            Editar Dados Antropométricos
          </h2>

          <form onSubmit={handleSubmitProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Idade (anos)
                </label>
                <input
                  type="number"
                  required
                  min="14"
                  max="100"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Sexo Biológico
                </label>
                <select
                  value={formData.gender}
                  onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-[#1c1d22] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  max="250"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Peso Atual (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min="35"
                  max="250"
                  value={formData.currentWeight}
                  onChange={(e) => setFormData({ ...formData, currentWeight: Number(e.target.value) })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nível de Atividade Diária
                </label>
                <select
                  value={formData.activityLevel}
                  onChange={(e: any) => setFormData({ ...formData, activityLevel: e.target.value })}
                  className="w-full bg-[#1c1d22] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.label} ({item.multiplier}x)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Objetivo Físico
                </label>
                <select
                  value={formData.goalType}
                  onChange={(e: any) => setFormData({ ...formData, goalType: e.target.value })}
                  className="w-full bg-[#1c1d22] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="cut">Déficit Calórico (Perda de Gordura)</option>
                  <option value="maintain">Manutenção Metabólica</option>
                  <option value="bulk">Superávit Calórico (Ganho de Massa)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-white/[0.04]">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" />
                <span>Salvar & Recalcular Metas</span>
              </button>
            </div>
          </form>
        </div>

        {/* Weight Log History (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#121316] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Histórico de Pesagens</h3>
              </div>
              <button
                onClick={() => setShowAddWeight(true)}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {[...weightHistory]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">
                          {item.weight} kg
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.date}
                        </span>
                      </div>
                      {item.note && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {item.note}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-blue-400">
                        {item.tmb} kcal
                      </span>
                      <button
                        onClick={() => onDeleteWeightRecord(item.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick Info footer */}
          <div className="pt-4 border-t border-white/[0.04] text-[11px] text-slate-500 flex items-center justify-between">
            <span>Total de registros: {weightHistory.length}</span>
            <span>Meta Alvo: {formData.targetWeight} kg</span>
          </div>
        </div>
      </div>

      {/* STORAGE & BACKUP MANAGEMENT */}
      <div className="p-5 rounded-2xl bg-[#121316] border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Gestão de Dados & LocalStorage
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Seus dados estão gravados com segurança no navegador. Faça backup ou restaure dados demonstrativos a qualquer momento.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={onExportData}
              className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Exportar JSON</span>
            </button>

            <label className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Importar JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                if (confirm('Deseja restaurar os dados de demonstração com histórico completo de 14 dias?')) {
                  onResetDemoData();
                }
              }}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Dados Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: ADD WEIGHT */}
      {showAddWeight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-[#121316] border border-white/10 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-semibold text-white mb-4">Adicionar Registro de Peso</h3>
            <form onSubmit={handleAddWeightSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={newWeightDate}
                  onChange={(e) => setNewWeightDate(e.target.value)}
                  className="w-full bg-[#1c1d22] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeightVal}
                  onChange={(e) => setNewWeightVal(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nota (Opcional)</label>
                <input
                  type="text"
                  value={newWeightNote}
                  onChange={(e) => setNewWeightNote(e.target.value)}
                  placeholder="Ex: Em jejum, pós-treino"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWeight(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-500/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
