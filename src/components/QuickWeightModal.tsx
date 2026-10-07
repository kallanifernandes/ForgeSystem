import React, { useState } from 'react';
import { Scale, X, Check, TrendingDown, TrendingUp } from 'lucide-react';
import { UserProfile } from '../types';
import { calculateBMR, formatDateKey } from '../utils/calculations';

interface QuickWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveWeight: (newWeight: number, note?: string) => void;
}

export const QuickWeightModal: React.FC<QuickWeightModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveWeight,
}) => {
  const [weight, setWeight] = useState<string>(profile.currentWeight.toString());
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const numericWeight = parseFloat(weight);
  const isValid = !isNaN(numericWeight) && numericWeight > 30 && numericWeight < 300;
  const simulatedBMR = isValid
    ? calculateBMR(numericWeight, profile.height, profile.age, profile.gender)
    : 0;
  const delta = isValid ? +(numericWeight - profile.currentWeight).toFixed(1) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSaveWeight(numericWeight, note.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-[#F3F4F6]">
      <div className="relative w-full max-w-md bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1E29] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#1F2430] border border-[#2A2F3D] flex items-center justify-center text-[#38BDF8]">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wider">
              Registrar Pesagem
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Data: {formatDateKey(new Date())}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9CA3AF] font-semibold mb-1.5">
              Peso Atual (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="35"
                max="250"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                autoFocus
                className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-4 py-3 text-2xl font-bold text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
                placeholder="Ex: 81.2"
              />
              <span className="absolute right-4 top-4 text-sm text-[#9CA3AF] font-bold">
                KG
              </span>
            </div>
          </div>

          {isValid && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#0D0E14] border border-[#1F2430]">
              <div>
                <span className="text-[10px] uppercase text-[#9CA3AF] font-semibold block">Variação no ciclo</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {delta < 0 ? (
                    <TrendingDown className="w-4 h-4 text-[#38BDF8]" />
                  ) : delta > 0 ? (
                    <TrendingUp className="w-4 h-4 text-[#D97706]" />
                  ) : null}
                  <span
                    className={`text-sm font-bold ${
                      delta < 0
                        ? 'text-[#38BDF8]'
                        : delta > 0
                        ? 'text-[#D97706]'
                        : 'text-[#9CA3AF]'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta} kg
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#9CA3AF] font-semibold block">Nova TMB Estimada</span>
                <span className="text-sm font-bold text-[#F3F4F6] mt-0.5 block">
                  {simulatedBMR} <span className="text-[#9CA3AF] text-xs">kcal</span>
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9CA3AF] font-semibold mb-1.5">
              Observação (Opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Em jejum, pós-treino A"
              className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2.5 text-xs text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] transition-all duration-200"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-200 cursor-pointer border border-[#f59e0b]/20 shadow-none"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Gravar Pesagem</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
