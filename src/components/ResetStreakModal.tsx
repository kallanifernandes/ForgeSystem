import React, { useState } from 'react';
import { RefreshCw, ShieldAlert, Calendar } from 'lucide-react';

interface ResetStreakModalProps {
  isOpen: boolean;
  type: 'alcohol' | 'diet';
  targetDate?: string;
  onClose: () => void;
  onConfirmReset: (note?: string) => void;
}

export const ResetStreakModal: React.FC<ResetStreakModalProps> = ({
  isOpen,
  type,
  targetDate,
  onClose,
  onConfirmReset,
}) => {
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const isAlcohol = type === 'alcohol';

  const handleConfirm = () => {
    onConfirmReset(note);
    setNote('');
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-[#F3F4F6]">
      <div className="relative w-full max-w-md bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#1F2430] border border-[#2A2F3D] flex items-center justify-center text-[#D97706]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F3F4F6] tracking-wide uppercase">
              {isAlcohol ? 'Registro de Álcool' : 'Registro de Deslize na Dieta'}
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Reiniciar sequência e salvar ocorrência no histórico
            </p>
          </div>
        </div>

        {/* Campo de Motivo */}
        <div className="mb-5 space-y-2">
          <label className="block text-xs uppercase text-[#9CA3AF] font-bold">
            Motivo / O que aconteceu?
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              isAlcohol
                ? 'Ex: 2 chopes no aniversário de um amigo, taça de vinho...'
                : 'Ex: Pizza no domingo com a família, hambúrguer...'
            }
            autoFocus
            className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2.5 text-xs text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] transition-all duration-200"
          />
          <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF] pt-0.5">
            <Calendar className="w-3 h-3 text-[#38BDF8]" />
            <span>Gravando na análise diária ({targetDate || 'Hoje'})</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2430]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors cursor-pointer"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white border border-[#f59e0b]/20 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-none"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Gravar & Reiniciar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
