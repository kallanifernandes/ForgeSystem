import React, { useState, useRef, useEffect } from 'react';
import {
  UtensilsCrossed,
  Dumbbell,
  BarChart3,
  LayoutDashboard,
  Beef,
  Sparkles,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Database,
  RefreshCw
} from 'lucide-react';
import { AuthUser } from '../services/auth';

export type ActiveTab = 'dashboard' | 'foods' | 'nutrition' | 'workouts' | 'mindsoul' | 'analytics';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenProfile?: () => void;
  isDbConnected?: boolean;
  onRefreshFromDb?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenProfile,
  isDbConnected = true,
  onRefreshFromDb,
  isRefreshing = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'dashboard' as const, label: 'Planner Diário', icon: LayoutDashboard },
    { id: 'foods' as const, label: 'Banco de Alimentos', icon: Beef },
    { id: 'nutrition' as const, label: 'Diário Alimentar', icon: UtensilsCrossed },
    { id: 'workouts' as const, label: 'Rotina de Treino', icon: Dumbbell },
    { id: 'mindsoul' as const, label: 'Mindset', icon: Sparkles },
    { id: 'analytics' as const, label: 'Análise & Perfil', icon: BarChart3 },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = currentUser?.name || 'Kallani';
  const userInitial = userName.trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090A0C]/95 backdrop-blur-xl border-b border-[#1F2430] shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Tag (Desktop) */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#12141A] border border-[#1F2430] flex items-center justify-center">
              <span className="text-[#D97706] font-black text-sm tracking-tighter">F</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xs tracking-[0.2em] text-[#F3F4F6]">FORGE</span>
              <span className="text-[9px] font-semibold tracking-[0.2em] text-[#9CA3AF]">BUILD YOURSELF</span>
            </div>
          </div>

          {/* Database Live Status Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0D0E14] border border-[#1F2430] text-[11px]">
            <div className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <Database className="w-3 h-3 text-[#9CA3AF]" />
            <span className="font-mono text-[#9CA3AF] text-[10px]">SUPABASE DB</span>
            <span className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase">
              {isDbConnected ? 'AO VIVO' : 'LOCAL'}
            </span>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 flex items-center justify-start lg:justify-center overflow-x-auto scrollbar-none py-2">
            <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-[#12141A] border border-[#1F2430] rounded-xl shadow-inner">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm'
                        : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1E29] font-medium'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#090A0C] stroke-[2.5]' : 'text-[#6B7280]'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* User Menu Dropdown (Top Right) */}
          {currentUser && (
            <div className="relative shrink-0 flex items-center gap-2" ref={dropdownRef}>
              {onRefreshFromDb && (
                <button
                  type="button"
                  title="Atualizar dados diretamente do Supabase"
                  disabled={isRefreshing}
                  onClick={onRefreshFromDb}
                  className="hidden sm:flex items-center justify-center p-2 rounded-xl bg-[#12141A] border border-[#1F2430] hover:border-[#2A2F3D] text-[#9CA3AF] hover:text-[#F3F4F6] transition-all duration-200 cursor-pointer shadow-sm hover:bg-[#1A1E29]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D97706]' : ''}`} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#12141A] border border-[#1F2430] hover:border-[#2A2F3D] text-[#F3F4F6] transition-all duration-200 cursor-pointer shadow-sm hover:bg-[#1A1E29]"
              >
                {/* Mini avatar */}
                <div className="w-7 h-7 rounded-lg bg-[#D97706] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {userInitial}
                </div>
                <span className="hidden sm:inline-block text-xs font-semibold text-[#F3F4F6] max-w-[100px] truncate">
                  {userName.split(' ')[0]}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-[#D97706]' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-[#12141A] border border-[#1F2430] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User info header */}
                  <div className="px-3 py-2 border-b border-[#1F2430] mb-1">
                    <p className="text-xs font-bold text-[#F3F4F6] truncate">{userName}</p>
                    <p className="text-[11px] text-[#9CA3AF] truncate">{currentUser.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-emerald-400 font-mono">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>PostgreSQL Supabase Conectado</span>
                    </div>
                  </div>

                  {/* Refresh live from DB */}
                  {onRefreshFromDb && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onRefreshFromDb();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1E29] transition-all duration-200 cursor-pointer text-left"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Atualizar do Banco de Dados</span>
                    </button>
                  )}

                  {/* Menu Options */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onOpenProfile) onOpenProfile();
                      else setActiveTab('analytics');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1E29] transition-all duration-200 cursor-pointer text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>Perfil & Configurações</span>
                  </button>

                  <div className="my-1 border-t border-[#1F2430]" />

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-all duration-200 cursor-pointer text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Sair / Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

