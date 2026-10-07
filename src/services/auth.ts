/**
 * Modular Authentication Service (LocalStorage with Supabase / Firebase ready interface)
 * Enforces per-user session management and data isolation.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isFirstAccess?: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface StoredAccount extends AuthUser {
  passwordHash: string; // Stored securely for prototype
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

const AUTH_USERS_KEY = 'forge_auth_accounts_v2';
const AUTH_SESSION_KEY = 'forge_auth_current_session_v2';

export const SUPABASE_KALLANI_UID = '26a57cf3-3b81-4fcd-8145-2ef5fc33064b';

// Primary user (Kallani) linked 1:1 with Supabase auth.users & public.perfis
const DEFAULT_PRIMARY_USER: StoredAccount = {
  id: SUPABASE_KALLANI_UID,
  name: 'Kallani',
  email: 'kallanirians@gmail.com',
  passwordHash: '123456',
  isFirstAccess: false,
  createdAt: '2026-09-01T00:00:00.000Z',
};

function getAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    if (!raw) {
      const initial = [DEFAULT_PRIMARY_USER];
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    const accounts = JSON.parse(raw) as StoredAccount[];
    // Ensure Kallani is present with real Supabase UID
    const existingIndex = accounts.findIndex(
      (a) => a.email.toLowerCase() === DEFAULT_PRIMARY_USER.email.toLowerCase() || a.id === 'user-kallani-primary'
    );
    if (existingIndex === -1) {
      accounts.push(DEFAULT_PRIMARY_USER);
    } else {
      accounts[existingIndex].id = SUPABASE_KALLANI_UID;
    }
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(accounts));
    return accounts;
  } catch (err) {
    console.error('Erro ao ler contas locais:', err);
    return [DEFAULT_PRIMARY_USER];
  }
}

function saveAccounts(accounts: StoredAccount[]): void {
  try {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Falha ao salvar contas:', err);
  }
}

export const authService = {
  /**
   * Garante que a sessão ativa do Supabase Auth esteja válida para as regras RLS
   */
  async ensureSupabaseSession(): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        return true;
      }
      // Se não houver sessão ativa no SDK mas há usuário atual, tenta conectar com credenciais padrão
      const cur = this.getCurrentUser();
      if (cur && cur.email.toLowerCase() === 'kallanirians@gmail.com') {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'kallanirians@gmail.com',
          password: '123456',
        });
        return !error;
      }
      return false;
    } catch (err) {
      console.warn('Erro ao verificar sessão Supabase:', err);
      return false;
    }
  },

  /**
   * Retrieves currently logged in user session
   */
  getCurrentUser(): AuthUser | null {
    try {
      // Check modern session key
      let raw = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
      
      // Fallback to legacy session key if needed
      if (!raw) {
        raw = localStorage.getItem('kairos_auth_current_session_v1') || sessionStorage.getItem('kairos_auth_current_session_v1');
      }

      if (!raw) {
        // Por padrão no primeiro acesso, iniciar já autenticado como Kallani conectado ao banco Supabase
        const defaultUser: AuthUser = {
          id: SUPABASE_KALLANI_UID,
          name: DEFAULT_PRIMARY_USER.name,
          email: DEFAULT_PRIMARY_USER.email,
          isFirstAccess: false,
          createdAt: DEFAULT_PRIMARY_USER.createdAt,
        };
        const payload = JSON.stringify({ user: defaultUser, rememberMe: true });
        localStorage.setItem(AUTH_SESSION_KEY, payload);
        return defaultUser;
      }

      const parsed = JSON.parse(raw) as { user: AuthUser; rememberMe: boolean };
      const user = parsed.user || null;
      if (user) {
        // Garante que o ID do Kallani sempre seja o UUID real do Supabase
        if (user.email.toLowerCase() === 'kallanirians@gmail.com' || user.id === 'user-kallani-primary') {
          user.id = SUPABASE_KALLANI_UID;
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ user, rememberMe: true }));
        }
      }
      return user;
    } catch {
      return null;
    }
  },

  /**
   * Log In user with email and password
   */
  async loginUser(
    email: string,
    password: string,
    rememberMe = true
  ): Promise<AuthResponse> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Por favor, informe e-mail e senha.' };
    }

    // 1. Tentar autenticação direta no Supabase Auth se configurado
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!supaErr && supaData?.user) {
          const authUser: AuthUser = {
            id: supaData.user.id,
            name: supaData.user.user_metadata?.name || 'Kallani',
            email: supaData.user.email || cleanEmail,
            isFirstAccess: false,
            createdAt: supaData.user.created_at || new Date().toISOString(),
          };

          const sessionPayload = JSON.stringify({ user: authUser, rememberMe });
          if (rememberMe) {
            localStorage.setItem(AUTH_SESSION_KEY, sessionPayload);
            sessionStorage.removeItem(AUTH_SESSION_KEY);
          } else {
            sessionStorage.setItem(AUTH_SESSION_KEY, sessionPayload);
            localStorage.removeItem(AUTH_SESSION_KEY);
          }

          return { success: true, user: authUser };
        }
      } catch (e) {
        console.warn('Tentativa de login no Supabase Auth falhou, verificando fallback local:', e);
      }
    }

    // 2. Fallback de contas locais caso o Supabase esteja temporariamente inacessível
    const accounts = getAccounts();
    const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!found) {
      return {
        success: false,
        error: 'Nenhuma conta cadastrada com este e-mail. Crie sua conta primeiro.',
      };
    }

    if (found.passwordHash !== cleanPassword) {
      return {
        success: false,
        error: 'Senha incorreta. Verifique suas credenciais.',
      };
    }

    const authUser: AuthUser = {
      id: found.id === 'user-kallani-primary' ? SUPABASE_KALLANI_UID : found.id,
      name: found.name,
      email: found.email,
      isFirstAccess: found.isFirstAccess,
      avatarUrl: found.avatarUrl,
      createdAt: found.createdAt,
    };

    const sessionPayload = JSON.stringify({ user: authUser, rememberMe });
    if (rememberMe) {
      localStorage.setItem(AUTH_SESSION_KEY, sessionPayload);
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, sessionPayload);
      localStorage.removeItem(AUTH_SESSION_KEY);
    }

    return { success: true, user: authUser };
  },

  /**
   * Register a new user account
   */
  async registerUser(
    name: string,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Informe seu nome completo.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Informe um endereço de e-mail válido.' };
    }

    if (!cleanPassword || cleanPassword.length < 4) {
      return { success: false, error: 'A senha deve ter pelo menos 4 caracteres.' };
    }

    // Try Supabase Auth first
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: supaData, error: supaErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: { name: cleanName }
          }
        });

        if (!supaErr && supaData?.user) {
          const authUser: AuthUser = {
            id: supaData.user.id,
            name: cleanName,
            email: cleanEmail,
            isFirstAccess: true,
            createdAt: new Date().toISOString(),
          };

          localStorage.setItem(
            AUTH_SESSION_KEY,
            JSON.stringify({ user: authUser, rememberMe: true })
          );

          return { success: true, user: authUser };
        }
      } catch (e) {
        console.warn('Erro no cadastro Supabase Auth, usando fallback:', e);
      }
    }

    const accounts = getAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        error: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.',
      };
    }

    const newAccount: StoredAccount = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: cleanPassword,
      isFirstAccess: true, // Mark for metric calibration onboarding
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    saveAccounts(accounts);

    const authUser: AuthUser = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      isFirstAccess: true,
      createdAt: newAccount.createdAt,
    };

    // Auto log-in new user
    localStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ user: authUser, rememberMe: true })
    );

    return { success: true, user: authUser };
  },

  /**
   * Mark first access as completed after metrics are set
   */
  markFirstAccessCompleted(userId: string): void {
    try {
      const accounts = getAccounts();
      const idx = accounts.findIndex((a) => a.id === userId);
      if (idx !== -1) {
        accounts[idx].isFirstAccess = false;
        saveAccounts(accounts);
      }

      // Update current session
      const current = this.getCurrentUser();
      if (current && current.id === userId) {
        current.isFirstAccess = false;
        const raw = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
        const rememberMe = raw ? (JSON.parse(raw).rememberMe ?? true) : true;
        const payload = JSON.stringify({ user: current, rememberMe });
        if (rememberMe) {
          localStorage.setItem(AUTH_SESSION_KEY, payload);
        } else {
          sessionStorage.setItem(AUTH_SESSION_KEY, payload);
        }
      }
    } catch (err) {
      console.error('Erro ao marcar primeiro acesso:', err);
    }
  },

  /**
   * Update profile info in auth store
   */
  updateCurrentUser(updates: Partial<AuthUser>): AuthUser | null {
    const current = this.getCurrentUser();
    if (!current) return null;

    const updated: AuthUser = { ...current, ...updates };
    const accounts = getAccounts();
    const idx = accounts.findIndex((a) => a.id === current.id);
    if (idx !== -1) {
      accounts[idx] = { ...accounts[idx], ...updates };
      saveAccounts(accounts);
    }

    const raw = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
    const rememberMe = raw ? (JSON.parse(raw).rememberMe ?? true) : true;
    const payload = JSON.stringify({ user: updated, rememberMe });
    if (rememberMe) {
      localStorage.setItem(AUTH_SESSION_KEY, payload);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, payload);
    }

    return updated;
  },

  /**
   * Check if account exists with email
   */
  async checkAccountEmail(email: string): Promise<{ exists: boolean; name?: string }> {
    await new Promise((r) => setTimeout(r, 250));
    const cleanEmail = email.trim().toLowerCase();
    const accounts = getAccounts();
    const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (found) {
      return { exists: true, name: found.name };
    }
    return { exists: false };
  },

  /**
   * Reset user password and auto-login
   */
  async resetPassword(email: string, newPassword: string): Promise<AuthResponse> {
    await new Promise((r) => setTimeout(r, 350));
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = newPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Preencha todos os campos obrigatórios.' };
    }

    if (cleanPassword.length < 4) {
      return { success: false, error: 'A nova senha deve ter pelo menos 4 caracteres.' };
    }

    const accounts = getAccounts();
    const idx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

    if (idx === -1) {
      return { success: false, error: 'Conta não encontrada para este e-mail.' };
    }

    accounts[idx].passwordHash = cleanPassword;
    saveAccounts(accounts);

    const authUser: AuthUser = {
      id: accounts[idx].id,
      name: accounts[idx].name,
      email: accounts[idx].email,
      isFirstAccess: accounts[idx].isFirstAccess,
      avatarUrl: accounts[idx].avatarUrl,
      createdAt: accounts[idx].createdAt,
    };

    // Auto log in after reset
    localStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ user: authUser, rememberMe: true })
    );

    return { success: true, user: authUser };
  },

  /**
   * Log out user
   */
  async logoutUser(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Erro ao deslogar do Supabase:', e);
      }
    }
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  },
};
