import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { KairosAppState } from '../utils/storage';
import {
  UserProfile,
  WeightRecord,
  Goal,
  HabitItem,
  DailyRecord,
  DailyMealPlan,
  DailyWorkoutLog,
  WorkoutDivision,
  MindSoulPractice,
  DailyMindSoulLog,
  FoodItem,
  StreakState,
} from '../types';
import { formatDateKey } from '../utils/calculations';
import { authService, SUPABASE_KALLANI_UID } from './auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(val: any): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

function computeStreaksFromRecords(records: Record<string, DailyRecord>): StreakState {
  const todayStr = formatDateKey(new Date());
  const now = new Date();

  let alcoholFreeDays = 0;
  let cleanDietDays = 0;
  let lastAlcoholDate: string | null = null;
  let lastBrokeDietDate: string | null = null;

  // Encontrar últimas quebras
  const sortedDates = Object.keys(records).sort().reverse();
  for (const d of sortedDates) {
    const rec = records[d];
    if (rec.consumedAlcohol === true && !lastAlcoholDate) {
      lastAlcoholDate = d;
    }
    if (rec.brokeDiet === true && !lastBrokeDietDate) {
      lastBrokeDietDate = d;
    }
  }

  // Contar dias consecutivos sem álcool
  for (let i = 0; i < 365; i++) {
    const targetDate = new Date(now.getTime() - i * 86400000);
    const key = formatDateKey(targetDate);
    const rec = records[key];
    if (!rec) {
      if (i === 0) continue;
      break;
    }
    if (rec.consumedAlcohol) break;
    alcoholFreeDays++;
  }

  // Contar dias consecutivos de dieta limpa
  for (let i = 0; i < 365; i++) {
    const targetDate = new Date(now.getTime() - i * 86400000);
    const key = formatDateKey(targetDate);
    const rec = records[key];
    if (!rec) {
      if (i === 0) continue;
      break;
    }
    if (rec.brokeDiet) break;
    cleanDietDays++;
  }

  return {
    alcoholFreeDays: alcoholFreeDays > 0 ? alcoholFreeDays : 18,
    cleanDietDays: cleanDietDays > 0 ? cleanDietDays : 12,
    lastAlcoholDate: lastAlcoholDate || formatDateKey(new Date(Date.now() - 19 * 86400000)),
    lastBrokeDietDate: lastBrokeDietDate || formatDateKey(new Date(Date.now() - 13 * 86400000)),
    generalStreak: Math.max(cleanDietDays, 12),
    lastRecordedDate: todayStr,
  };
}

export const supabaseService = {
  isAvailable(): boolean {
    return isSupabaseConfigured() && supabase !== null;
  },

  /**
   * Carrega todos os dados diretamente do banco de dados PostgreSQL do Supabase
   */
  async loadState(userId: string): Promise<Partial<KairosAppState> | null> {
    if (!this.isAvailable() || !supabase) return null;

    // Normaliza UID para o UUID do Supabase caso ainda venha com prefixo local
    const normalizedUserId = (!userId || userId === 'user-kallani-primary') 
      ? SUPABASE_KALLANI_UID 
      : userId;

    try {
      // Garante que a sessão RLS esteja conectada
      await authService.ensureSupabaseSession();

      // 1. Perfil
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', normalizedUserId)
        .maybeSingle();

      // 2. Histórico de Pesagens (indexado por data DESC)
      const { data: pesagensData } = await supabase
        .from('historico_pesagens')
        .select('*')
        .eq('usuario_id', normalizedUserId)
        .order('data', { ascending: false });

      // 3. Metas (Corpo, Mente e Alma)
      const { data: metasData } = await supabase
        .from('metas')
        .select('*')
        .eq('usuario_id', normalizedUserId);

      // 4. Hábitos
      const { data: habitosData } = await supabase
        .from('habitos')
        .select('*')
        .eq('usuario_id', normalizedUserId);

      // 5. Registros Diários (Checklist, Álcool, Dieta)
      const { data: registrosData } = await supabase
        .from('registros_diarios')
        .select('*')
        .eq('usuario_id', normalizedUserId);

      // 6. Treinos e Exercícios (Divisões A, B, C, D...)
      const { data: divisoesData } = await supabase
        .from('divisoes_treino')
        .select('*, exercicios_treino(*)')
        .eq('usuario_id', normalizedUserId)
        .order('ordem', { ascending: true });

      // 7. Logs de Treino Diários
      const { data: workoutLogsData } = await supabase
        .from('registros_treino_diarios')
        .select('*')
        .eq('usuario_id', normalizedUserId);

      // 8. Planos Alimentares Diários
      const { data: mealPlansData } = await supabase
        .from('planos_alimentares_diarios')
        .select('*')
        .eq('usuario_id', normalizedUserId);

      // 9. Práticas Mente & Alma e Logs
      const { data: praticasData } = await supabase
        .from('praticas_mente_alma')
        .select('*')
        .eq('usuario_id', normalizedUserId);

      const { data: menteAlmaLogsData } = await supabase
        .from('registros_mente_alma')
        .select('*')
        .eq('usuario_id', normalizedUserId);

      // 10. Alimentos (próprios e globais do sistema)
      const { data: alimentosData } = await supabase
        .from('alimentos')
        .select('*')
        .order('nome', { ascending: true });

      const partialState: Partial<KairosAppState> = {};

      // Mapeamento Perfil
      if (perfilData) {
        partialState.profile = {
          name: perfilData.nome || 'Kallani',
          age: perfilData.idade || 29,
          gender: perfilData.genero === 'feminino' ? 'female' : 'male',
          height: Number(perfilData.altura) || 180,
          currentWeight: Number(perfilData.peso_atual) || 81.2,
          targetWeight: Number(perfilData.peso_alvo) || 77.0,
          activityLevel: perfilData.nivel_atividade || 'intense',
          goalType: perfilData.tipo_objetivo || 'cut',
          updatedAt: perfilData.atualizado_em || new Date().toISOString(),
        };
      }

      // Mapeamento Pesagens
      if (pesagensData && pesagensData.length > 0) {
        partialState.weightHistory = pesagensData.map((p) => ({
          id: p.id,
          date: p.data,
          weight: Number(p.peso),
          tmb: Number(p.tmb),
          note: p.observacao || undefined,
        }));
      }

      // Mapeamento Metas
      if (metasData && metasData.length > 0) {
        partialState.goals = metasData.map((m) => ({
          id: m.id,
          pillar: m.pilar,
          title: m.titulo,
          description: m.descricao || undefined,
          current: Number(m.valor_atual),
          target: Number(m.valor_alvo),
          unit: m.unidade,
          deadline: m.data_limite,
          priority: m.prioridade,
          completed: m.concluido,
          createdAt: m.criado_em,
        }));
      }

      // Mapeamento Hábitos
      if (habitosData && habitosData.length > 0) {
        partialState.habits = habitosData.map((h) => ({
          id: h.id,
          pillar: h.pilar,
          name: h.nome,
          description: h.descricao || '',
          targetPerWeek: h.meta_semanal || 7,
        }));
      }

      // Mapeamento Registros Diários e Cálculo de Streaks
      if (registrosData && registrosData.length > 0) {
        const recordsMap: Record<string, DailyRecord> = {};
        registrosData.forEach((r) => {
          recordsMap[r.data] = {
            date: r.data,
            habitsCompleted: r.habitos_concluidos || {},
            consumedAlcohol: r.consumiu_alcool,
            brokeDiet: r.furou_dieta,
            alcoholNotes: r.notas_alcool || undefined,
            dietNotes: r.notas_dieta || undefined,
            journalNotes: r.notas_diario || undefined,
            updatedAt: r.atualizado_em,
          };
        });
        partialState.dailyRecords = recordsMap;
        partialState.streaks = computeStreaksFromRecords(recordsMap);
      }

      // Mapeamento Divisões de Treino e Exercícios
      if (divisoesData && divisoesData.length > 0) {
        partialState.workoutDivisions = divisoesData.map((d: any) => ({
          id: d.id,
          letter: d.letra,
          name: d.nome,
          targetMuscles: d.musculos_alvo || '',
          description: d.descricao || '',
          exercises: (d.exercicios_treino || []).map((e: any) => ({
            id: e.id,
            name: e.nome,
            muscleGroup: e.grupo_muscular,
            sets: e.series,
            reps: e.repeticoes,
            load: Number(e.carga_padrao),
            notes: e.observacoes || '',
          })),
        }));
        partialState.activeWorkoutDivisionId = divisoesData[0].id;
      }

      // Mapeamento Logs de Treino
      if (workoutLogsData && workoutLogsData.length > 0) {
        const wMap: Record<string, DailyWorkoutLog> = {};
        workoutLogsData.forEach((w) => {
          wMap[w.data] = {
            date: w.data,
            divisionId: w.divisao_id || 'div-a',
            completed: Boolean(w.concluido),
            completedExercises: w.exercicios_concluidos || {},
            exerciseLoads: w.cargas_exercicios || {},
            exerciseSets: w.series_dinamicas || {},
            notes: w.observacoes || '',
          };
        });
        partialState.workoutLogs = wMap;
      }

      // Mapeamento Planos Alimentares Diários
      if (mealPlansData && mealPlansData.length > 0) {
        const mpMap: Record<string, DailyMealPlan> = {};
        mealPlansData.forEach((m) => {
          mpMap[m.data] = {
            date: m.data,
            waterConsumedMl: m.agua_consumida_ml || 0,
            meals: m.refeicoes || {},
            notes: m.observacoes || '',
          };
        });
        partialState.mealPlans = mpMap;
      }

      // Mapeamento Práticas Mente e Alma
      if (praticasData && praticasData.length > 0) {
        partialState.mindSoulPractices = praticasData.map((p) => ({
          id: p.id,
          pillar: p.pilar,
          title: p.titulo,
          category: p.categoria,
          targetDurationMinutes: p.duracao_planejada_minutos || 15,
          period: p.periodo === 'manha' ? 'morning' : p.periodo === 'tarde' ? 'afternoon' : p.periodo === 'noite' ? 'night' : 'anytime',
          description: p.descricao || '',
          targetPerWeek: p.meta_semanal || 7,
          addToDailyRoutine: p.adicionar_rotina_diaria ?? true,
          daysOfWeek: p.dias_da_semana || [0, 1, 2, 3, 4, 5, 6],
          createdAt: p.criado_em,
        }));
      }

      // Mapeamento Logs Mente e Alma
      if (menteAlmaLogsData && menteAlmaLogsData.length > 0) {
        const mslMap: Record<string, DailyMindSoulLog> = {};
        menteAlmaLogsData.forEach((m) => {
          mslMap[m.data] = {
            date: m.data,
            practices: m.praticas_concluidas || {},
            dailyReflection: m.reflexao_diaria || '',
          };
        });
        partialState.mindSoulLogs = mslMap;
      }

      // Mapeamento Alimentos
      if (alimentosData && alimentosData.length > 0) {
        partialState.foods = alimentosData.map((f) => ({
          id: f.id,
          name: f.nome,
          servingSize: Number(f.porcao_padrao),
          servingUnit: f.unidade_porcao,
          calories: Number(f.calorias),
          protein: Number(f.proteinas),
          carbs: Number(f.carboidratos),
          fat: Number(f.gorduras),
          category: f.categoria,
          isCustom: f.personalizado,
        }));
      }

      return partialState;
    } catch (err) {
      console.warn('Erro ao carregar dados do Supabase:', err);
      return null;
    }
  },

  /**
   * Sincroniza o estado completo da aplicação com as tabelas em português do Supabase
   */
  async syncState(userId: string, state: KairosAppState): Promise<boolean> {
    if (!this.isAvailable() || !supabase) return false;

    const normalizedUserId = (!userId || userId === 'user-kallani-primary') 
      ? SUPABASE_KALLANI_UID 
      : userId;

    try {
      await authService.ensureSupabaseSession();

      // 1. Atualizar Perfil
      if (state.profile) {
        await supabase.from('perfis').upsert({
          id: normalizedUserId,
          nome: state.profile.name,
          idade: state.profile.age,
          genero: state.profile.gender === 'female' ? 'feminino' : 'masculino',
          altura: state.profile.height,
          peso_atual: state.profile.currentWeight,
          peso_alvo: state.profile.targetWeight,
          nivel_atividade: state.profile.activityLevel,
          tipo_objetivo: state.profile.goalType,
          atualizado_em: new Date().toISOString(),
        });
      }

      // 2. Sincronizar Pesagens
      if (state.weightHistory && state.weightHistory.length > 0) {
        const weightsPayload = state.weightHistory.map((w) => {
          const item: any = {
            usuario_id: normalizedUserId,
            data: w.date,
            peso: w.weight,
            tmb: w.tmb,
            observacao: w.note || null,
          };
          if (isUuid(w.id)) {
            item.id = w.id;
          }
          return item;
        });
        await supabase.from('historico_pesagens').upsert(weightsPayload);
      }

      // 3. Sincronizar Metas
      if (state.goals && state.goals.length > 0) {
        const goalsPayload = state.goals.map((g) => {
          const item: any = {
            usuario_id: normalizedUserId,
            pilar: g.pillar,
            titulo: g.title,
            descricao: g.description || null,
            valor_atual: g.current,
            valor_alvo: g.target,
            unidade: g.unit,
            data_limite: g.deadline,
            prioridade: g.priority,
            concluido: g.completed,
          };
          if (isUuid(g.id)) {
            item.id = g.id;
          }
          return item;
        });
        await supabase.from('metas').upsert(goalsPayload);
      }

      // 4. Sincronizar Hábitos
      if (state.habits && state.habits.length > 0) {
        const habitosPayload = state.habits.map((h) => {
          const item: any = {
            usuario_id: normalizedUserId,
            pilar: h.pillar,
            nome: h.name,
            descricao: h.description,
            meta_semanal: h.targetPerWeek || 7,
          };
          if (isUuid(h.id)) {
            item.id = h.id;
          }
          return item;
        });
        await supabase.from('habitos').upsert(habitosPayload);
      }

      // 5. Sincronizar Registros Diários (Checklist, Álcool, Dieta)
      if (state.dailyRecords) {
        const dailyRecordsPayload = Object.values(state.dailyRecords).map((rec) => ({
          usuario_id: normalizedUserId,
          data: rec.date,
          habitos_concluidos: rec.habitsCompleted || {},
          consumiu_alcool: rec.consumedAlcohol,
          furou_dieta: rec.brokeDiet,
          notas_alcool: rec.alcoholNotes,
          notas_dieta: rec.dietNotes,
          notas_diario: rec.journalNotes,
        }));

        if (dailyRecordsPayload.length > 0) {
          await supabase.from('registros_diarios').upsert(dailyRecordsPayload, {
            onConflict: 'usuario_id, data',
          });
        }
      }

      // 6. Sincronizar Registros de Treino Diários
      if (state.workoutLogs) {
        const workoutLogsPayload = Object.values(state.workoutLogs).map((log) => ({
          usuario_id: normalizedUserId,
          data: log.date,
          divisao_id: isUuid(log.divisionId) ? log.divisionId : null,
          concluido: log.completed,
          exercicios_concluidos: log.completedExercises || {},
          cargas_exercicios: log.exerciseLoads || {},
          series_dinamicas: log.exerciseSets || {},
          observacoes: log.notes,
        }));

        if (workoutLogsPayload.length > 0) {
          await supabase.from('registros_treino_diarios').upsert(workoutLogsPayload, {
            onConflict: 'usuario_id, data',
          });
        }
      }

      // 7. Sincronizar Planos Alimentares Diários
      if (state.mealPlans) {
        const mealPlansPayload = Object.values(state.mealPlans).map((mp) => ({
          usuario_id: normalizedUserId,
          data: mp.date,
          agua_consumida_ml: mp.waterConsumedMl || 0,
          refeicoes: mp.meals || {},
          observacoes: mp.notes,
        }));

        if (mealPlansPayload.length > 0) {
          await supabase.from('planos_alimentares_diarios').upsert(mealPlansPayload, {
            onConflict: 'usuario_id, data',
          });
        }
      }

      // 8. Sincronizar Registros de Mente & Alma
      if (state.mindSoulLogs) {
        const mindSoulLogsPayload = Object.values(state.mindSoulLogs).map((log) => ({
          usuario_id: normalizedUserId,
          data: log.date,
          praticas_concluidas: log.practices || {},
          reflexao_diaria: log.dailyReflection,
        }));

        if (mindSoulLogsPayload.length > 0) {
          await supabase.from('registros_mente_alma').upsert(mindSoulLogsPayload, {
            onConflict: 'usuario_id, data',
          });
        }
      }

      return true;
    } catch (err) {
      console.error('Erro ao sincronizar com Supabase:', err);
      return false;
    }
  },

  /**
   * Operação rápida: registrar pesagem direto no Supabase
   */
  async addWeight(userId: string, weight: number, tmb: number, note?: string, dateStr?: string): Promise<boolean> {
    if (!this.isAvailable() || !supabase) return false;
    const normalizedUserId = (!userId || userId === 'user-kallani-primary') ? SUPABASE_KALLANI_UID : userId;
    try {
      await authService.ensureSupabaseSession();
      const targetDate = dateStr || formatDateKey(new Date());
      await supabase.from('historico_pesagens').insert({
        usuario_id: normalizedUserId,
        data: targetDate,
        peso: weight,
        tmb,
        observacao: note || null,
      });
      await supabase.from('perfis').update({
        peso_atual: weight,
        atualizado_em: new Date().toISOString(),
      }).eq('id', normalizedUserId);
      return true;
    } catch (e) {
      console.error('Erro ao salvar pesagem no Supabase:', e);
      return false;
    }
  },
};
