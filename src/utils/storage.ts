import {
  UserProfile,
  Goal,
  HabitItem,
  DailyRecord,
  StreakState,
  WeightRecord,
  FoodItem,
  DailyMealPlan,
  WorkoutDivision,
  DailyWorkoutLog,
  MindSoulPractice,
  DailyMindSoulLog
} from '../types';
import { calculateBMR, formatDateKey, calculateFoodNutrients } from './calculations';

const STORAGE_KEY = 'kairos_integral_state_darkrock_v3';

export interface KairosAppState {
  profile: UserProfile;
  goals: Goal[];
  habits: HabitItem[];
  dailyRecords: Record<string, DailyRecord>;
  weightHistory: WeightRecord[];
  streaks: StreakState;
  foods: FoodItem[];
  mealPlans: Record<string, DailyMealPlan>;
  workoutDivisions: WorkoutDivision[];
  workoutLogs: Record<string, DailyWorkoutLog>;
  activeWorkoutDivisionId: string;
  mindSoulPractices: MindSoulPractice[];
  mindSoulLogs: Record<string, DailyMindSoulLog>;
}

export const INITIAL_FOODS: FoodItem[] = [
  {
    id: 'food-frango',
    name: 'Peito de Frango Grelhado',
    servingSize: 100,
    servingUnit: 'g',
    calories: 165,
    protein: 31.0,
    carbs: 0.0,
    fat: 3.6,
    category: 'Proteínas',
  },
  {
    id: 'food-patinho',
    name: 'Patinho Bovino Moído Magro',
    servingSize: 100,
    servingUnit: 'g',
    calories: 219,
    protein: 32.0,
    carbs: 0.0,
    fat: 9.2,
    category: 'Proteínas',
  },
  {
    id: 'food-tilapia',
    name: 'Filé de Tilápia Grelhado',
    servingSize: 100,
    servingUnit: 'g',
    calories: 128,
    protein: 26.0,
    carbs: 0.0,
    fat: 2.7,
    category: 'Proteínas',
  },
  {
    id: 'food-ovo',
    name: 'Ovo de Galinha Inteiro Cozido',
    servingSize: 1,
    servingUnit: 'unidade (50g)',
    calories: 74,
    protein: 6.3,
    carbs: 0.6,
    fat: 5.0,
    category: 'Proteínas',
  },
  {
    id: 'food-clara',
    name: 'Clara de Ovo Pasteurizada',
    servingSize: 100,
    servingUnit: 'g / ml',
    calories: 52,
    protein: 11.0,
    carbs: 0.7,
    fat: 0.2,
    category: 'Proteínas',
  },
  {
    id: 'food-whey',
    name: 'Whey Protein Concentrado 80%',
    servingSize: 30,
    servingUnit: 'g (1 scoop)',
    calories: 120,
    protein: 24.0,
    carbs: 2.5,
    fat: 1.8,
    category: 'Laticínios & Suplementos',
  },
  {
    id: 'food-arroz-branco',
    name: 'Arroz Branco Cozido',
    servingSize: 100,
    servingUnit: 'g',
    calories: 130,
    protein: 2.5,
    carbs: 28.2,
    fat: 0.3,
    category: 'Carboidratos',
  },
  {
    id: 'food-arroz-integral',
    name: 'Arroz Integral Cozido',
    servingSize: 100,
    servingUnit: 'g',
    calories: 124,
    protein: 2.6,
    carbs: 25.8,
    fat: 1.0,
    category: 'Carboidratos',
  },
  {
    id: 'food-aveia',
    name: 'Aveia em Flocos Finos',
    servingSize: 100,
    servingUnit: 'g',
    calories: 366,
    protein: 14.0,
    carbs: 60.0,
    fat: 7.5,
    category: 'Carboidratos',
  },
  {
    id: 'food-batata-doce',
    name: 'Batata Doce Cozida',
    servingSize: 100,
    servingUnit: 'g',
    calories: 86,
    protein: 1.6,
    carbs: 20.1,
    fat: 0.1,
    category: 'Carboidratos',
  },
  {
    id: 'food-pao-integral',
    name: 'Pão 100% Integral',
    servingSize: 50,
    servingUnit: 'g (2 fatias)',
    calories: 120,
    protein: 6.0,
    carbs: 22.0,
    fat: 1.5,
    category: 'Carboidratos',
  },
  {
    id: 'food-feijao',
    name: 'Feijão Preto Cozido',
    servingSize: 100,
    servingUnit: 'g',
    calories: 91,
    protein: 6.0,
    carbs: 14.0,
    fat: 0.5,
    category: 'Carboidratos',
  },
  {
    id: 'food-banana',
    name: 'Banana Prata',
    servingSize: 1,
    servingUnit: 'unidade (80g)',
    calories: 78,
    protein: 1.0,
    carbs: 20.0,
    fat: 0.2,
    category: 'Vegetais & Frutas',
  },
  {
    id: 'food-azeite',
    name: 'Azeite de Oliva Extra Virgem',
    servingSize: 13,
    servingUnit: 'ml (1 colher)',
    calories: 108,
    protein: 0.0,
    carbs: 0.0,
    fat: 12.0,
    category: 'Gorduras',
  },
  {
    id: 'food-pasta-amendoim',
    name: 'Pasta de Amendoim Integral',
    servingSize: 30,
    servingUnit: 'g (2 colheres)',
    calories: 180,
    protein: 8.5,
    carbs: 6.0,
    fat: 14.5,
    category: 'Gorduras',
  },
  {
    id: 'food-iogurte',
    name: 'Iogurte Natural Desnatado',
    servingSize: 170,
    servingUnit: 'g (1 pote)',
    calories: 70,
    protein: 7.0,
    carbs: 9.0,
    fat: 0.0,
    category: 'Laticínios & Suplementos',
  },
];

export const INITIAL_WORKOUT_DIVISIONS: WorkoutDivision[] = [
  {
    id: 'div-a',
    letter: 'A',
    name: 'Treino A - Peitoral, Tríceps & Deltoide Anterior',
    targetMuscles: 'Peito, Tríceps, Deltoide Anterior',
    exercises: [
      { id: 'ex-a1', name: 'Supino Reto com Barra', muscleGroup: 'Peitoral', sets: 4, reps: '8-10', load: 84, notes: 'Descanso 2min, descida controlada' },
      { id: 'ex-a2', name: 'Supino Inclinado com Halteres', muscleGroup: 'Peitoral', sets: 4, reps: '10-12', load: 28, notes: 'Banco a 30 graus' },
      { id: 'ex-a3', name: 'Crossover na Polia Média', muscleGroup: 'Peitoral', sets: 3, reps: '12-15', load: 25, notes: 'Pico de contração de 1s' },
      { id: 'ex-a4', name: 'Tríceps Pulley Corda', muscleGroup: 'Tríceps', sets: 4, reps: '10-12', load: 45, notes: 'Abrir a corda no final' },
      { id: 'ex-a5', name: 'Tríceps Francês / Testa Barra W', muscleGroup: 'Tríceps', sets: 3, reps: '10', load: 32, notes: 'Cotovelos alinhados' },
      { id: 'ex-a6', name: 'Elevação Frontal na Polia', muscleGroup: 'Ombros', sets: 3, reps: '12', load: 20 },
    ],
  },
  {
    id: 'div-b',
    letter: 'B',
    name: 'Treino B - Dorsal, Deltoide Posterior & Bíceps',
    targetMuscles: 'Costas, Bíceps, Posterior de Ombro',
    exercises: [
      { id: 'ex-b1', name: 'Puxada Alta Frente (Lat Pulldown)', muscleGroup: 'Dorsal', sets: 4, reps: '8-10', load: 75, notes: 'Depressão escapular firme' },
      { id: 'ex-b2', name: 'Remada Curvada com Barra', muscleGroup: 'Dorsal', sets: 4, reps: '8-10', load: 70, notes: 'Tronco a 45 graus' },
      { id: 'ex-b3', name: 'Remada Baixa no Triângulo', muscleGroup: 'Dorsal', sets: 3, reps: '10-12', load: 65 },
      { id: 'ex-b4', name: 'Crucifixo Inverso Peck Deck', muscleGroup: 'Deltoide Posterior', sets: 4, reps: '12-15', load: 40 },
      { id: 'ex-b5', name: 'Rosca Direta Barra W', muscleGroup: 'Bíceps', sets: 4, reps: '8-10', load: 34, notes: 'Sem balançar a lombar' },
      { id: 'ex-b6', name: 'Rosca Martelo com Halteres', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', load: 16 },
    ],
  },
  {
    id: 'div-c',
    letter: 'C',
    name: 'Treino C - Pernas Completo (Quadríceps & Posteriores)',
    targetMuscles: 'Quadríceps, Isquiotibiais, Panturrilhas',
    exercises: [
      { id: 'ex-c1', name: 'Agachamento Livre com Barra', muscleGroup: 'Pernas', sets: 4, reps: '8-10', load: 100, notes: 'Profundidade paralela' },
      { id: 'ex-c2', name: 'Leg Press 45°', muscleGroup: 'Pernas', sets: 4, reps: '10-12', load: 240 },
      { id: 'ex-c3', name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 3, reps: '12-15', load: 65, notes: 'Drop-set na última' },
      { id: 'ex-c4', name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 4, reps: '10-12', load: 55 },
      { id: 'ex-c5', name: 'Stiff com Halteres', muscleGroup: 'Posterior / Glúteo', sets: 3, reps: '10', load: 26 },
      { id: 'ex-c6', name: 'Panturrilha em Pé na Máquina', muscleGroup: 'Panturrilhas', sets: 5, reps: '15', load: 70 },
    ],
  },
  {
    id: 'div-d',
    letter: 'D',
    name: 'Treino D - Ombros Completo, Trapézio & Abdômen',
    targetMuscles: 'Deltoides, Trapézio, Core',
    exercises: [
      { id: 'ex-d1', name: 'Desenvolvimento Militar Halteres', muscleGroup: 'Ombros', sets: 4, reps: '8-10', load: 24 },
      { id: 'ex-d2', name: 'Elevação Lateral com Halteres', muscleGroup: 'Ombros', sets: 5, reps: '12-15', load: 12, notes: 'Controle na descida' },
      { id: 'ex-d3', name: 'Elevação Lateral na Polia Baixa', muscleGroup: 'Ombros', sets: 3, reps: '15', load: 10 },
      { id: 'ex-d4', name: 'Encolhimento com Barra', muscleGroup: 'Trapézio', sets: 4, reps: '12', load: 70 },
      { id: 'ex-d5', name: 'Crunch Abdominal na Polia com Corda', muscleGroup: 'Abdômen', sets: 4, reps: '15', load: 45 },
      { id: 'ex-d6', name: 'Prancha Isométrica com Carga', muscleGroup: 'Core', sets: 3, reps: '60s', load: 15 },
    ],
  },
];

export const INITIAL_HABITS: HabitItem[] = [
  {
    id: 'habit-corpo-treino',
    pillar: 'corpo',
    name: 'Treino de Força / Musculação Pesada',
    description: 'Executar o treino do dia com progressão de carga e intensidade máxima',
    targetPerWeek: 5,
  },
  {
    id: 'habit-corpo-dieta',
    pillar: 'corpo',
    name: 'Dieta e Macros 100% Batidos',
    description: 'Registrar todas as refeições no plano e atingir a meta proteica',
    targetPerWeek: 7,
  },
  {
    id: 'habit-corpo-agua',
    pillar: 'corpo',
    name: 'Hidratação de Ferro (3.5L)',
    description: 'Ingestão de 3.5 litros de água limpa para síntese proteica',
    targetPerWeek: 7,
  },
  {
    id: 'habit-mente-leitura',
    pillar: 'mente',
    name: 'Leitura Técnica / Estratégia (20 págs)',
    description: 'Filosofia estoica, liderança, engenharia ou finanças',
    targetPerWeek: 7,
  },
  {
    id: 'habit-mente-estudo',
    pillar: 'mente',
    name: 'Bloco Deep Work / Estudo Puro (1h)',
    description: '60 minutos sem celular, sem abas sociais, foco absoluto',
    targetPerWeek: 6,
  },
  {
    id: 'habit-alma-meditacao',
    pillar: 'alma',
    name: 'Retiro Mental & Silêncio (15m)',
    description: 'Desaceleração do sistema nervoso e controle de impulsos',
    targetPerWeek: 7,
  },
  {
    id: 'habit-alma-sono',
    pillar: 'alma',
    name: 'Higiene do Sono (Zero telas às 22h30)',
    description: 'Cortar dopamina barata e dormir em quarto escuro e frio',
    targetPerWeek: 7,
  },
];

export const INITIAL_MIND_SOUL_PRACTICES: MindSoulPractice[] = [
  {
    id: 'msp-leitura-30',
    pillar: 'mente',
    title: '30min de Leitura Diária',
    category: 'Leitura',
    targetDurationMinutes: 30,
    period: 'night',
    description: 'Leitura focada de filosofia estoica, liderança ou desenvolvimento profissional.',
    targetPerWeek: 7,
    addToDailyRoutine: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'msp-deep-work',
    pillar: 'mente',
    title: 'Bloco Deep Work / Estudo Focado',
    category: 'Estudo & Foco',
    targetDurationMinutes: 60,
    period: 'morning',
    description: '60 minutos sem celular e distrações, foco extremo em tarefas prioritárias.',
    targetPerWeek: 6,
    addToDailyRoutine: true,
    daysOfWeek: [1, 2, 3, 4, 5, 6], // Seg a Sáb
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'msp-reza-diaria',
    pillar: 'alma',
    title: 'Reza Diária & Oração de Gratidão',
    category: 'Oração & Fé',
    targetDurationMinutes: 15,
    period: 'morning',
    description: 'Agradecimento diário a Deus, fortalecimento espiritual e intenções do dia.',
    targetPerWeek: 7,
    addToDailyRoutine: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'msp-meditacao-silencio',
    pillar: 'alma',
    title: 'Meditação & Retiro de Silêncio',
    category: 'Meditação & Mindfulness',
    targetDurationMinutes: 15,
    period: 'afternoon',
    description: 'Desaceleração do sistema nervoso, respiração consciente e foco no agora.',
    targetPerWeek: 7,
    addToDailyRoutine: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'msp-diario-gratidao',
    pillar: 'alma',
    title: 'Exame de Consciência & Reflexão',
    category: 'Escrita & Reflexão',
    targetDurationMinutes: 10,
    period: 'night',
    description: 'Revisão das atitudes do dia, vitórias, correções e motivos para agradecer.',
    targetPerWeek: 7,
    addToDailyRoutine: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    createdAt: '2026-09-01T00:00:00.000Z',
  },
];

export const INITIAL_PROFILE: UserProfile = {
  name: 'Kallani',
  age: 29,
  gender: 'male',
  height: 180,
  currentWeight: 81.2,
  targetWeight: 77.0,
  activityLevel: 'intense',
  goalType: 'cut',
  updatedAt: new Date().toISOString(),
};

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-corpo-1',
    pillar: 'corpo',
    title: 'Definição Máxima: 77kg com 10-12% BF',
    description: 'Secar gordura visceral e subcutânea preservando cada grama de massa muscular.',
    current: 81.2,
    target: 77.0,
    unit: 'kg',
    deadline: '2026-11-30',
    priority: 'high',
    completed: false,
    createdAt: '2026-09-01',
  },
  {
    id: 'goal-corpo-2',
    pillar: 'corpo',
    title: 'Progressão de Carga: Supino Reto 100kg para 8 reps',
    description: 'Força bruta e técnica rígida no supino com barra olímpica.',
    current: 84,
    target: 100,
    unit: 'kg',
    deadline: '2026-12-31',
    priority: 'high',
    completed: false,
    createdAt: '2026-09-01',
  },
  {
    id: 'goal-mente-1',
    pillar: 'mente',
    title: 'Concluir 100h de Deep Work & Arquitetura de Software',
    description: 'Construção de sistemas escaláveis e resolução de problemas complexos.',
    current: 68,
    target: 100,
    unit: 'horas',
    deadline: '2026-11-15',
    priority: 'high',
    completed: false,
    createdAt: '2026-09-01',
  },
  {
    id: 'goal-alma-1',
    pillar: 'alma',
    title: 'Blindagem Mental: 60 dias ininterruptos de meditação',
    description: 'Controle inabalável das reações emocionais e silêncio interior.',
    current: 42,
    target: 60,
    unit: 'dias',
    deadline: '2026-10-20',
    priority: 'high',
    completed: false,
    createdAt: '2026-09-01',
  },
];

export function generateSeedData(): KairosAppState {
  const profile = { ...INITIAL_PROFILE };
  const habits = [...INITIAL_HABITS];
  const goals = [...INITIAL_GOALS];
  const foods = [...INITIAL_FOODS];
  const workoutDivisions = [...INITIAL_WORKOUT_DIVISIONS];
  const dailyRecords: Record<string, DailyRecord> = {};
  const weightHistory: WeightRecord[] = [];
  const workoutLogs: Record<string, DailyWorkoutLog> = {};
  const mealPlans: Record<string, DailyMealPlan> = {};

  const today = new Date();
  const todayStr = formatDateKey(today);

  // Pesagens dos últimos 28 dias
  const weightPoints = [
    { daysAgo: 28, weight: 83.4 },
    { daysAgo: 21, weight: 82.8 },
    { daysAgo: 14, weight: 82.1 },
    { daysAgo: 7, weight: 81.6 },
    { daysAgo: 1, weight: 81.2 },
  ];

  weightPoints.forEach((wp, idx) => {
    const d = new Date(today);
    d.setDate(d.getDate() - wp.daysAgo);
    const dateStr = formatDateKey(d);
    weightHistory.push({
      id: `w-${idx}-${dateStr}`,
      date: dateStr,
      weight: wp.weight,
      tmb: calculateBMR(wp.weight, profile.height, profile.age, profile.gender),
      note: idx === 0 ? 'Pesagem inicial do ciclo quinzenal' : 'Aferição em jejum',
    });
  });

  // Gera dados dos últimos 21 dias
  for (let i = 21; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateKey(d);
    const isToday = i === 0;

    // Hábitos
    const habitsCompleted: Record<string, boolean> = {};
    habits.forEach((h) => {
      const rand = (i * 11 + h.name.length) % 10;
      habitsCompleted[h.id] = isToday ? true : rand > 2;
    });

    const consumedAlcohol = i >= 19 ? (i === 19) : false;
    const brokeDiet = i >= 13 ? (i === 13) : false;

    dailyRecords[dateStr] = {
      date: dateStr,
      habitsCompleted,
      consumedAlcohol,
      brokeDiet,
      alcoholNotes: consumedAlcohol ? '2 chopes artesanais com colegas de trabalho' : undefined,
      dietNotes: brokeDiet ? 'Pizza com amigos no domingo à noite fora do plano' : undefined,
      journalNotes: isToday ? 'Treino A concluído com peso máximo. Foco inabalável.' : undefined,
      updatedAt: new Date().toISOString(),
    };

    // Treinos: 5 dias por semana (exceto domingo ou dias aleatórios)
    const dayOfWeek = d.getDay(); // 0 domingo
    const isWorkoutDay = dayOfWeek !== 0;
    const divisionIndex = (21 - i) % workoutDivisions.length;
    const div = workoutDivisions[divisionIndex];

    const completedEx: Record<string, boolean> = {};
    const exLoads: Record<string, number> = {};
    div.exercises.forEach((ex) => {
      completedEx[ex.id] = isWorkoutDay;
      exLoads[ex.id] = ex.load;
    });

    workoutLogs[dateStr] = {
      date: dateStr,
      divisionId: div.id,
      completed: isWorkoutDay,
      completedExercises: completedEx,
      exerciseLoads: exLoads,
      notes: isWorkoutDay ? `Cargas batidas no ${div.name}` : 'Descanso ativo / Recuperação',
    };

    // Diário Alimentar padrão para os dias
    mealPlans[dateStr] = {
      date: dateStr,
      waterConsumedMl: 3500,
      meals: {
        cafe: [
          {
            id: `entry-c1-${dateStr}`,
            foodId: 'food-ovo',
            foodName: 'Ovo de Galinha Inteiro Cozido',
            quantity: 3,
            unit: 'unidade (50g)',
            calculatedCalories: 222,
            calculatedProtein: 18.9,
            calculatedCarbs: 1.8,
            calculatedFat: 15.0,
          },
          {
            id: `entry-c2-${dateStr}`,
            foodId: 'food-aveia',
            foodName: 'Aveia em Flocos Finos',
            quantity: 60,
            unit: 'g',
            calculatedCalories: 220,
            calculatedProtein: 8.4,
            calculatedCarbs: 36.0,
            calculatedFat: 4.5,
          },
          {
            id: `entry-c3-${dateStr}`,
            foodId: 'food-banana',
            foodName: 'Banana Prata',
            quantity: 1,
            unit: 'unidade (80g)',
            calculatedCalories: 78,
            calculatedProtein: 1.0,
            calculatedCarbs: 20.0,
            calculatedFat: 0.2,
          },
        ],
        almoco: [
          {
            id: `entry-a1-${dateStr}`,
            foodId: 'food-frango',
            foodName: 'Peito de Frango Grelhado',
            quantity: 200,
            unit: 'g',
            calculatedCalories: 330,
            calculatedProtein: 62.0,
            calculatedCarbs: 0.0,
            calculatedFat: 7.2,
          },
          {
            id: `entry-a2-${dateStr}`,
            foodId: 'food-arroz-branco',
            foodName: 'Arroz Branco Cozido',
            quantity: 180,
            unit: 'g',
            calculatedCalories: 234,
            calculatedProtein: 4.5,
            calculatedCarbs: 50.8,
            calculatedFat: 0.5,
          },
          {
            id: `entry-a3-${dateStr}`,
            foodId: 'food-feijao',
            foodName: 'Feijão Preto Cozido',
            quantity: 100,
            unit: 'g',
            calculatedCalories: 91,
            calculatedProtein: 6.0,
            calculatedCarbs: 14.0,
            calculatedFat: 0.5,
          },
          {
            id: `entry-a4-${dateStr}`,
            foodId: 'food-azeite',
            foodName: 'Azeite de Oliva Extra Virgem',
            quantity: 10,
            unit: 'ml (1 colher)',
            calculatedCalories: 83,
            calculatedProtein: 0.0,
            calculatedCarbs: 0.0,
            calculatedFat: 9.2,
          },
        ],
        lanche: [
          {
            id: `entry-l1-${dateStr}`,
            foodId: 'food-whey',
            foodName: 'Whey Protein Concentrado 80%',
            quantity: 40,
            unit: 'g (1 scoop)',
            calculatedCalories: 160,
            calculatedProtein: 32.0,
            calculatedCarbs: 3.3,
            calculatedFat: 2.4,
          },
          {
            id: `entry-l2-${dateStr}`,
            foodId: 'food-pasta-amendoim',
            foodName: 'Pasta de Amendoim Integral',
            quantity: 20,
            unit: 'g (2 colheres)',
            calculatedCalories: 120,
            calculatedProtein: 5.7,
            calculatedCarbs: 4.0,
            calculatedFat: 9.7,
          },
        ],
        jantar: [
          {
            id: `entry-j1-${dateStr}`,
            foodId: 'food-patinho',
            foodName: 'Patinho Bovino Moído Magro',
            quantity: 180,
            unit: 'g',
            calculatedCalories: 394,
            calculatedProtein: 57.6,
            calculatedCarbs: 0.0,
            calculatedFat: 16.6,
          },
          {
            id: `entry-j2-${dateStr}`,
            foodId: 'food-batata-doce',
            foodName: 'Batata Doce Cozida',
            quantity: 150,
            unit: 'g',
            calculatedCalories: 129,
            calculatedProtein: 2.4,
            calculatedCarbs: 30.2,
            calculatedFat: 0.2,
          },
        ],
        ceia: [
          {
            id: `entry-ce1-${dateStr}`,
            foodId: 'food-iogurte',
            foodName: 'Iogurte Natural Desnatado',
            quantity: 170,
            unit: 'g (1 pote)',
            calculatedCalories: 70,
            calculatedProtein: 7.0,
            calculatedCarbs: 9.0,
            calculatedFat: 0.0,
          },
        ],
      },
    };
  }

  const streaks: StreakState = {
    alcoholFreeDays: 18,
    cleanDietDays: 12,
    lastAlcoholDate: formatDateKey(new Date(Date.now() - 19 * 86400000)),
    lastBrokeDietDate: formatDateKey(new Date(Date.now() - 13 * 86400000)),
    generalStreak: 12,
    lastRecordedDate: todayStr,
  };

  const mindSoulPractices = [...INITIAL_MIND_SOUL_PRACTICES];
  const mindSoulLogs: Record<string, DailyMindSoulLog> = {};

  // Seed sample logs for today and previous days
  mindSoulLogs[todayStr] = {
    date: todayStr,
    practices: {
      'msp-leitura-30': {
        completed: true,
        durationMinutes: 30,
        notes: 'Leitura de "Meditações" de Marco Aurélio, Livro 4.',
        completedAt: new Date().toISOString(),
      },
      'msp-reza-diaria': {
        completed: true,
        durationMinutes: 15,
        notes: 'Oração matinal em família e intenção de serenidade.',
        completedAt: new Date().toISOString(),
      },
      'msp-deep-work': {
        completed: true,
        durationMinutes: 60,
        notes: 'Foco total no desenvolvimento das arquiteturas.',
        completedAt: new Date().toISOString(),
      },
      'msp-meditacao-silencio': {
        completed: false,
        durationMinutes: 15,
      },
      'msp-diario-gratidao': {
        completed: false,
        durationMinutes: 10,
      },
    },
    dailyReflection: 'Dia de clareza e alta disciplina. Mente focada e espírito em paz.',
  };

  return {
    profile,
    goals,
    habits,
    dailyRecords,
    weightHistory,
    streaks,
    foods,
    mealPlans,
    workoutDivisions,
    workoutLogs,
    activeWorkoutDivisionId: 'div-a',
    mindSoulPractices,
    mindSoulLogs,
  };
}

export function getStorageKeyForUser(userId?: string): string {
  return userId ? `${STORAGE_KEY}_user_${userId}` : STORAGE_KEY;
}

export function loadAppState(userId?: string, fallbackUserName?: string): KairosAppState {
  const userKey = getStorageKeyForUser(userId);
  try {
    let raw = localStorage.getItem(userKey);

    // Backward compatibility: if user-specific key is not found, but it is Kallani or legacy data exists
    if (!raw && (!userId || userId === 'user-kallani-primary' || userId.includes('kallani'))) {
      const legacyRaw = localStorage.getItem(STORAGE_KEY);
      if (legacyRaw) {
        raw = legacyRaw;
        // Migrate to user key
        localStorage.setItem(userKey, legacyRaw);
      }
    }

    if (!raw) {
      const initial = generateSeedData();
      if (fallbackUserName) {
        initial.profile.name = fallbackUserName;
      }
      saveAppState(initial, userId);
      return initial;
    }

    const parsed = JSON.parse(raw) as KairosAppState;
    if (!parsed.profile || !parsed.foods || !parsed.workoutDivisions || !parsed.mealPlans) {
      const resetState = generateSeedData();
      if (fallbackUserName) {
        resetState.profile.name = fallbackUserName;
      }
      saveAppState(resetState, userId);
      return resetState;
    }

    // Ensure mindSoulPractices and mindSoulLogs exist for backward compatibility
    if (!parsed.mindSoulPractices || parsed.mindSoulPractices.length === 0) {
      parsed.mindSoulPractices = [...INITIAL_MIND_SOUL_PRACTICES];
    } else {
      parsed.mindSoulPractices = parsed.mindSoulPractices.map((p) => ({
        ...p,
        daysOfWeek: p.daysOfWeek && p.daysOfWeek.length > 0 ? p.daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
      }));
    }
    if (!parsed.mindSoulLogs) {
      parsed.mindSoulLogs = {};
    }

    // Ensure default profile name is Kallani or user's registered name
    if (parsed.profile && (parsed.profile.name === 'Alexandre Silva' || parsed.profile.name === 'Alexandre' || parsed.profile.name === 'Kallni' || !parsed.profile.name)) {
      parsed.profile.name = fallbackUserName || 'Kallani';
      saveAppState(parsed, userId);
    }

    return parsed;
  } catch (err) {
    console.warn('Erro ao carregar localStorage, restaurando seed dark rock:', err);
    const initial = generateSeedData();
    if (fallbackUserName) {
      initial.profile.name = fallbackUserName;
    }
    saveAppState(initial, userId);
    return initial;
  }
}

export function saveAppState(state: KairosAppState, userId?: string): void {
  const userKey = getStorageKeyForUser(userId);
  try {
    localStorage.setItem(userKey, JSON.stringify(state));
  } catch (err) {
    console.error('Falha ao salvar no localStorage:', err);
  }
}
