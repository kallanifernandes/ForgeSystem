import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, KeyRound, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService, AuthUser } from '../services/auth';

interface AuthViewProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup extra fields
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetAllErrors = () => {
    setErrorMessage(null);
    setResetSuccessMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAllErrors();
    setLoading(true);

    try {
      const res = await authService.loginUser(email, password, rememberMe);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } catch {
      setErrorMessage('Erro de comunicação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAllErrors();

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.registerUser(name, email, password);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Erro ao criar conta.');
      }
    } catch {
      setErrorMessage('Erro ao registrar usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 of Forgot Password: Verify email exists
  const handleVerifyForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAllErrors();
    setLoading(true);

    try {
      const res = await authService.checkAccountEmail(forgotEmail);
      if (res.exists) {
        setForgotStep(2);
      } else {
        setErrorMessage('Nenhuma conta encontrada com este e-mail.');
      }
    } catch {
      setErrorMessage('Erro ao verificar a conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of Forgot Password: Reset password and login
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAllErrors();

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('As novas senhas não coincidem.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMessage('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPassword(forgotEmail, newPassword);
      if (res.success && res.user) {
        setResetSuccessMessage('Senha atualizada com sucesso! Acessando o cockpit...');
        setTimeout(() => {
          onAuthSuccess(res.user!);
        }, 600);
      } else {
        setErrorMessage(res.error || 'Erro ao atualizar senha.');
      }
    } catch {
      setErrorMessage('Erro ao processar a nova senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090A0C] flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased text-[#F3F4F6] selection:bg-amber-600 selection:text-white">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* ============================================================
            A. CABEÇALHO (FORGE - BUILD YOURSELF)
            ============================================================ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-[0.2em] text-[#F3F4F6] uppercase">
              FORGE
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-[#9CA3AF] tracking-[0.25em] uppercase">
            {mode === 'forgot_password' ? 'Recuperação de Acesso' : 'BUILD YOURSELF'}
          </p>
        </div>

        {/* ============================================================
            B. CARD DE AUTENTICAÇÃO (SURFACES & CARDS: #12141A, BORDAS: #1F2430)
            ============================================================ */}
        <div className="bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mensagem de Sucesso */}
          {resetSuccessMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* ============================================================
              1. FORMULÁRIO: ENTRAR NO COCKPIT (LOGIN)
              ============================================================ */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* E-mail */}
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/40 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/40 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#E2E8F0] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Linha de Ação Secundária: Lembrar acesso & Esqueceu a senha */}
              <div className="flex items-center justify-between pt-0.5 text-xs text-[#9CA3AF]">
                <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[#F3F4F6] transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-[#0D0E14] border-[#2A2F3D] accent-[#D97706] text-[#D97706]"
                  />
                  <span>Lembrar acesso</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    resetAllErrors();
                    setForgotEmail(email);
                    setForgotStep(1);
                    setMode('forgot_password');
                  }}
                  className="text-[#9CA3AF] hover:text-[#E2E8F0] transition-colors cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>

              {/* Botão Principal: ENTRAR NO COCKPIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#D97706] hover:bg-[#b45309] text-white active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-[#f59e0b]/20"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>ENTRAR NO COCKPIT</span>
                )}
              </button>
            </form>
          )}

          {/* ============================================================
              2. FORMULÁRIO: CRIAR CONTA (SIGNUP)
              ============================================================ */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/40 transition-all duration-200"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/40 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/40 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#E2E8F0] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/40 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Botão Principal: CRIAR CONTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#D97706] hover:bg-[#b45309] text-white active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-[#f59e0b]/20"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>CRIAR CONTA & INICIAR JORNADA</span>
                )}
              </button>
            </form>
          )}

          {/* ============================================================
              3. FORMULÁRIO: ESQUECEU A SENHA (REDEFINIÇÃO REAL DE ACESSO)
              ============================================================ */}
          {mode === 'forgot_password' && (
            <div>
              {forgotStep === 1 ? (
                /* Etapa 1: Validar e-mail */
                <form onSubmit={handleVerifyForgotEmail} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                      E-mail cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/40 transition-all duration-200"
                      />
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                      Informe o endereço de e-mail da sua conta para criar uma nova senha.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#D97706] hover:bg-[#b45309] text-white active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-[#f59e0b]/20"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>VERIFICAR CONTA</span>
                    )}
                  </button>
                </form>
              ) : (
                /* Etapa 2: Definir nova senha */
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="p-2.5 rounded-lg bg-[#0D0E14] border border-[#1F2430] text-xs text-[#9CA3AF] flex items-center justify-between">
                    <span className="truncate">Conta: <strong className="text-[#F3F4F6]">{forgotEmail}</strong></span>
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-[#38BDF8] hover:underline text-[11px] ml-2 shrink-0 cursor-pointer font-medium"
                    >
                      Alterar
                    </button>
                  </div>

                  {/* Nova Senha */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/40 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#E2E8F0] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/40 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#D97706] hover:bg-[#b45309] text-white active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-[#f59e0b]/20"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>REDEFINIR SENHA & ENTRAR</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ============================================================
            C. RODAPÉ DA TELA - ALTERNÂNCIA DISCRETA
            ============================================================ */}
        <div className="text-center mt-6">
          {mode === 'login' && (
            <p className="text-xs text-[#9CA3AF]">
              Ainda não possui acesso?{' '}
              <button
                type="button"
                onClick={() => {
                  resetAllErrors();
                  setMode('signup');
                }}
                className="text-[#E2E8F0] hover:text-white font-semibold underline underline-offset-4 transition-colors cursor-pointer ml-1"
              >
                Criar Conta
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p className="text-xs text-[#9CA3AF]">
              Já possui uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  resetAllErrors();
                  setMode('login');
                }}
                className="text-[#E2E8F0] hover:text-white font-semibold underline underline-offset-4 transition-colors cursor-pointer ml-1"
              >
                Entrar no Cockpit
              </button>
            </p>
          )}

          {mode === 'forgot_password' && (
            <p className="text-xs text-[#9CA3AF]">
              Lembrou sua senha?{' '}
              <button
                type="button"
                onClick={() => {
                  resetAllErrors();
                  setMode('login');
                  setForgotStep(1);
                }}
                className="text-[#E2E8F0] hover:text-white font-semibold underline underline-offset-4 transition-colors cursor-pointer ml-1 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Voltar para o Login</span>
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
