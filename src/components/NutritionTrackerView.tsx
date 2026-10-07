import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Edit2,
  Edit3,
  Copy,
  CalendarDays,
  RotateCcw,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Clock,
  Settings2
} from 'lucide-react';
import {
  FoodItem,
  DailyMealPlan,
  MealType,
  MealDefinition,
  MealFoodEntry,
  UserProfile
} from '../types';
import {
  formatDateKey,
  parseDateKey,
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  calculateFoodNutrients,
  calculateMealTotals,
  calculateDailyMealPlanTotals
} from '../utils/calculations';
import { fireDisciplineConfetti } from '../utils/confetti';

interface NutritionTrackerViewProps {
  profile: UserProfile;
  foods: FoodItem[];
  mealPlans: Record<string, DailyMealPlan>;
  onUpdateDailyMealPlan: (dateStr: string, plan: DailyMealPlan) => void;
  onBatchUpdateDailyMealPlans?: (plans: Record<string, DailyMealPlan>) => void;
  onNavigateToFoodDatabase: () => void;
}

export const DEFAULT_MEAL_DEFINITIONS: MealDefinition[] = [
  { id: 'cafe', name: 'Café da Manhã', subtitle: 'Quebra de jejum e primeira carga de nutrientes', icon: '🍳', time: '07:30' },
  { id: 'almoco', name: 'Almoço', subtitle: 'Refeição anabólica densa e carboidratos complexos', icon: '🥩', time: '12:30' },
  { id: 'lanche', name: 'Lanche da Tarde', subtitle: 'Aporte pré/pós treino e síntese proteica', icon: '⚡', time: '16:00' },
  { id: 'jantar', name: 'Jantar', subtitle: 'Densidade proteica e recuperação noturna', icon: '🍲', time: '20:00' },
  { id: 'ceia', name: 'Ceia', subtitle: 'Proteína de absorção lenta e modulação de sono', icon: '🌙', time: '22:30' },
];

const AVAILABLE_ICONS = ['🍳', '🥩', '⚡', '🍲', '🌙', '🥤', '🥗', '🥪', '🍎', '🥣', '🥑', '🥛', '🍌', '🍵', '🍗', '🐟'];

export const NutritionTrackerView: React.FC<NutritionTrackerViewProps> = ({
  profile,
  foods,
  mealPlans,
  onUpdateDailyMealPlan,
  onBatchUpdateDailyMealPlans,
  onNavigateToFoodDatabase,
}) => {
  const todayStr = formatDateKey(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Add Item to Meal Modal state
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('cafe');
  const [selectedFoodId, setSelectedFoodId] = useState<string>(foods[0]?.id || '');
  const [consumedQuantity, setConsumedQuantity] = useState<string>('100');

  // Edit Single Item Modal state
  const [editingEntry, setEditingEntry] = useState<{
    mealType: MealType;
    entry: MealFoodEntry;
  } | null>(null);
  const [editFoodId, setEditFoodId] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<string>('100');

  // Edit Entire Meal Modal state
  const [editingMealModalType, setEditingMealModalType] = useState<MealType | null>(null);
  const [tempMealEntries, setTempMealEntries] = useState<MealFoodEntry[]>([]);
  const [tempMealName, setTempMealName] = useState<string>('');
  const [tempMealSubtitle, setTempMealSubtitle] = useState<string>('');
  const [tempMealTime, setTempMealTime] = useState<string>('');
  const [tempMealIcon, setTempMealIcon] = useState<string>('🍳');
  const [modalNewFoodId, setModalNewFoodId] = useState<string>(foods[0]?.id || '');
  const [modalNewFoodQty, setModalNewFoodQty] = useState<string>('100');

  // Create New Meal Modal state
  const [isCreateMealOpen, setIsCreateMealOpen] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealSubtitle, setNewMealSubtitle] = useState('');
  const [newMealTime, setNewMealTime] = useState('');
  const [newMealIcon, setNewMealIcon] = useState('⚡');
  const [applyNewMealToWeek, setApplyNewMealToWeek] = useState(true);

  // Action feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compute profile targets
  const bmr = calculateBMR(profile.currentWeight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const targetMacros = calculateMacros(tdee, profile.currentWeight, profile.goalType);

  // Helper to extract meal definitions for any day
  const getMealDefinitionsForDate = (dateStr: string): MealDefinition[] => {
    const plan = mealPlans[dateStr];
    if (plan?.mealDefinitions && plan.mealDefinitions.length > 0) {
      return plan.mealDefinitions;
    }

    if (plan?.meals) {
      const keys = Object.keys(plan.meals);
      if (keys.length > 0) {
        const defaultMap = new Map(DEFAULT_MEAL_DEFINITIONS.map((m) => [m.id, m]));
        const list: MealDefinition[] = [];
        keys.forEach((k) => {
          if (defaultMap.has(k)) {
            list.push(defaultMap.get(k)!);
          } else {
            list.push({
              id: k,
              name: k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, ' '),
              subtitle: 'Refeição personalizada',
              icon: '🍽️',
              time: '12:00',
            });
          }
        });
        if (list.length > 0) return list;
      }
    }

    return DEFAULT_MEAL_DEFINITIONS;
  };

  const activeMealDefinitions = getMealDefinitionsForDate(selectedDateStr);

  // Selected date meal plan
  const rawPlan = mealPlans[selectedDateStr];
  const currentPlan: DailyMealPlan = rawPlan || {
    date: selectedDateStr,
    mealDefinitions: activeMealDefinitions,
    meals: activeMealDefinitions.reduce((acc, m) => {
      acc[m.id] = [];
      return acc;
    }, {} as Record<string, MealFoodEntry[]>),
  };

  const dayTotals = calculateDailyMealPlanTotals(currentPlan);

  // Compute Week Days for the Days of the Week selector
  const selectedDate = parseDateKey(selectedDateStr);
  const weekDays: { date: Date; dateStr: string; label: string; dayNum: number }[] = [];
  const startOfWeek = new Date(selectedDate);
  const dayOfWeek = startOfWeek.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const dStr = formatDateKey(d);
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    weekDays.push({
      date: d,
      dateStr: dStr,
      label: dayNames[d.getDay()],
      dayNum: d.getDate(),
    });
  }

  const shiftWeek = (days: number) => {
    const target = new Date(selectedDate);
    target.setDate(target.getDate() + days);
    setSelectedDateStr(formatDateKey(target));
  };

  // ==========================================
  // ADD / EDIT INDIVIDUAL FOOD ENTRIES
  // ==========================================

  const handleOpenAddModal = (mealId: MealType) => {
    setActiveMealType(mealId);
    const initialFood = foods[0];
    if (initialFood) {
      setSelectedFoodId(initialFood.id);
      setConsumedQuantity(initialFood.servingSize.toString());
    }
    setIsAddEntryOpen(true);
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const food = foods.find((f) => f.id === selectedFoodId);
    const qty = parseFloat(consumedQuantity);
    if (!food || isNaN(qty) || qty <= 0) return;

    const nutrients = calculateFoodNutrients(food, qty);
    const newEntry: MealFoodEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      foodId: food.id,
      foodName: food.name,
      quantity: qty,
      unit: food.servingUnit,
      calculatedCalories: nutrients.calories,
      calculatedProtein: nutrients.protein,
      calculatedCarbs: nutrients.carbs,
      calculatedFat: nutrients.fat,
    };

    const updatedMeals = {
      ...currentPlan.meals,
      [activeMealType]: [...(currentPlan.meals[activeMealType] || []), newEntry],
    };

    onUpdateDailyMealPlan(selectedDateStr, {
      ...currentPlan,
      mealDefinitions: activeMealDefinitions,
      meals: updatedMeals,
    });

    setIsAddEntryOpen(false);
  };

  const handleOpenEditEntry = (mealType: MealType, entry: MealFoodEntry) => {
    setEditingEntry({ mealType, entry });
    setEditFoodId(entry.foodId);
    setEditQuantity(entry.quantity.toString());
  };

  const handleSaveEditEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const food = foods.find((f) => f.id === editFoodId);
    const qty = parseFloat(editQuantity);
    if (!food || isNaN(qty) || qty <= 0) return;

    const nutrients = calculateFoodNutrients(food, qty);
    const updatedEntry: MealFoodEntry = {
      ...editingEntry.entry,
      foodId: food.id,
      foodName: food.name,
      quantity: qty,
      unit: food.servingUnit,
      calculatedCalories: nutrients.calories,
      calculatedProtein: nutrients.protein,
      calculatedCarbs: nutrients.carbs,
      calculatedFat: nutrients.fat,
    };

    const mealType = editingEntry.mealType;
    const updatedMeals = {
      ...currentPlan.meals,
      [mealType]: (currentPlan.meals[mealType] || []).map((item) =>
        item.id === editingEntry.entry.id ? updatedEntry : item
      ),
    };

    onUpdateDailyMealPlan(selectedDateStr, {
      ...currentPlan,
      mealDefinitions: activeMealDefinitions,
      meals: updatedMeals,
    });

    setEditingEntry(null);
  };

  const handleRemoveEntry = (mealType: MealType, entryId: string) => {
    const updatedMeals = {
      ...currentPlan.meals,
      [mealType]: (currentPlan.meals[mealType] || []).filter((e) => e.id !== entryId),
    };

    onUpdateDailyMealPlan(selectedDateStr, {
      ...currentPlan,
      mealDefinitions: activeMealDefinitions,
      meals: updatedMeals,
    });
  };

  // ==========================================
  // FULL MEAL EDITOR & METADATA
  // ==========================================

  const handleOpenMealEditor = (mealType: MealType) => {
    const mealDef = activeMealDefinitions.find((m) => m.id === mealType);
    setEditingMealModalType(mealType);
    const existing = currentPlan.meals[mealType] || [];
    setTempMealEntries(JSON.parse(JSON.stringify(existing)));
    setTempMealName(mealDef?.name || '');
    setTempMealSubtitle(mealDef?.subtitle || '');
    setTempMealTime(mealDef?.time || '');
    setTempMealIcon(mealDef?.icon || '🍳');

    if (foods.length > 0) {
      setModalNewFoodId(foods[0].id);
      setModalNewFoodQty(foods[0].servingSize.toString());
    }
  };

  const handleTempEntryQuantityChange = (entryId: string, newQty: number) => {
    if (newQty < 0) return;
    setTempMealEntries((prev) =>
      prev.map((item) => {
        if (item.id !== entryId) return item;
        const food = foods.find((f) => f.id === item.foodId);
        if (!food) {
          return { ...item, quantity: newQty };
        }
        const nutrients = calculateFoodNutrients(food, newQty);
        return {
          ...item,
          quantity: newQty,
          calculatedCalories: nutrients.calories,
          calculatedProtein: nutrients.protein,
          calculatedCarbs: nutrients.carbs,
          calculatedFat: nutrients.fat,
        };
      })
    );
  };

  const handleTempRemoveEntry = (entryId: string) => {
    setTempMealEntries((prev) => prev.filter((item) => item.id !== entryId));
  };

  const handleAddFoodInsideMealEditor = () => {
    const food = foods.find((f) => f.id === modalNewFoodId);
    const qty = parseFloat(modalNewFoodQty);
    if (!food || isNaN(qty) || qty <= 0) return;

    const nutrients = calculateFoodNutrients(food, qty);
    const newEntry: MealFoodEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      foodId: food.id,
      foodName: food.name,
      quantity: qty,
      unit: food.servingUnit,
      calculatedCalories: nutrients.calories,
      calculatedProtein: nutrients.protein,
      calculatedCarbs: nutrients.carbs,
      calculatedFat: nutrients.fat,
    };

    setTempMealEntries((prev) => [...prev, newEntry]);
  };

  const handleSaveMealEditor = () => {
    if (!editingMealModalType) return;

    // Update meal definition metadata
    const updatedDefinitions = activeMealDefinitions.map((def) =>
      def.id === editingMealModalType
        ? {
            ...def,
            name: tempMealName.trim() || def.name,
            subtitle: tempMealSubtitle.trim() || undefined,
            time: tempMealTime.trim() || undefined,
            icon: tempMealIcon || def.icon,
          }
        : def
    );

    const updatedMeals = {
      ...currentPlan.meals,
      [editingMealModalType]: tempMealEntries,
    };

    onUpdateDailyMealPlan(selectedDateStr, {
      ...currentPlan,
      mealDefinitions: updatedDefinitions,
      meals: updatedMeals,
    });

    setEditingMealModalType(null);
    showToast(`Refeição "${tempMealName || editingMealModalType}" atualizada com sucesso!`);
  };

  // ==========================================
  // CREATE / DELETE MEALS DYNAMICALLY
  // ==========================================

  const handleCreateMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName.trim()) return;

    const newId = `meal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const createdMeal: MealDefinition = {
      id: newId,
      name: newMealName.trim(),
      subtitle: newMealSubtitle.trim() || undefined,
      time: newMealTime.trim() || undefined,
      icon: newMealIcon || '⚡',
    };

    const updatedDefinitions = [...activeMealDefinitions, createdMeal];
    const updatedMeals = {
      ...currentPlan.meals,
      [newId]: [],
    };

    const updatedPlan: DailyMealPlan = {
      ...currentPlan,
      mealDefinitions: updatedDefinitions,
      meals: updatedMeals,
    };

    if (applyNewMealToWeek) {
      const batch: Record<string, DailyMealPlan> = {
        [selectedDateStr]: updatedPlan,
      };

      weekDays.forEach((day) => {
        if (day.dateStr !== selectedDateStr) {
          const existingPlan = mealPlans[day.dateStr] || {
            date: day.dateStr,
            mealDefinitions: activeMealDefinitions,
            meals: {},
          };
          const existingDefs = getMealDefinitionsForDate(day.dateStr);
          batch[day.dateStr] = {
            ...existingPlan,
            mealDefinitions: [...existingDefs, createdMeal],
            meals: {
              ...existingPlan.meals,
              [newId]: existingPlan.meals[newId] || [],
            },
          };
        }
      });

      if (onBatchUpdateDailyMealPlans) {
        onBatchUpdateDailyMealPlans(batch);
      } else {
        Object.entries(batch).forEach(([dStr, p]) => onUpdateDailyMealPlan(dStr, p));
      }
    } else {
      onUpdateDailyMealPlan(selectedDateStr, updatedPlan);
    }

    setNewMealName('');
    setNewMealSubtitle('');
    setNewMealTime('');
    setIsCreateMealOpen(false);
    fireDisciplineConfetti();
    showToast(`Nova refeição "${createdMeal.name}" adicionada ao cardápio!`);
  };

  const handleDeleteMeal = (mealId: MealType) => {
    const mealToDelete = activeMealDefinitions.find((m) => m.id === mealId);
    const mealTitle = mealToDelete?.name || 'refeição';

    if (
      !confirm(
        `Tem certeza que deseja excluir "${mealTitle}" deste dia? Todos os alimentos registrados nela serão apagados.`
      )
    ) {
      return;
    }

    const updatedDefinitions = activeMealDefinitions.filter((m) => m.id !== mealId);
    const updatedMeals = { ...currentPlan.meals };
    delete updatedMeals[mealId];

    onUpdateDailyMealPlan(selectedDateStr, {
      ...currentPlan,
      mealDefinitions: updatedDefinitions,
      meals: updatedMeals,
    });

    showToast(`Refeição "${mealTitle}" excluída com sucesso.`);
  };

  const handleClearMeal = (mealId: MealType) => {
    const mealDef = activeMealDefinitions.find((m) => m.id === mealId);
    const mealTitle = mealDef?.name || 'refeição';
    if (!confirm(`Deseja limpar todos os alimentos de ${mealTitle}?`)) return;

    const updatedMeals = {
      ...currentPlan.meals,
      [mealId]: [],
    };

    onUpdateDailyMealPlan(selectedDateStr, {
      ...currentPlan,
      mealDefinitions: activeMealDefinitions,
      meals: updatedMeals,
    });

    showToast(`Itens de ${mealTitle} foram removidos.`);
  };

  const handleRestoreDefaultMeals = () => {
    if (
      !confirm(
        'Deseja restaurar as 5 refeições padrão (Café da Manhã, Almoço, Lanche, Jantar, Ceia)? Alimentos existentes nessas categorias serão mantidos.'
      )
    ) {
      return;
    }

    const updatedMeals: Record<string, MealFoodEntry[]> = {};
    DEFAULT_MEAL_DEFINITIONS.forEach((def) => {
      updatedMeals[def.id] = currentPlan.meals[def.id] || [];
    });

    onUpdateDailyMealPlan(selectedDateStr, {
      ...currentPlan,
      mealDefinitions: DEFAULT_MEAL_DEFINITIONS,
      meals: updatedMeals,
    });

    showToast('Estrutura restaurada para as 5 refeições padrão.');
  };

  // ==========================================
  // DAY-LEVEL BATCH ACTIONS (COPY, REPLICATE, CLEAR)
  // ==========================================

  const handleCopyFromPreviousDay = () => {
    const current = parseDateKey(selectedDateStr);
    const prev = new Date(current);
    prev.setDate(prev.getDate() - 1);
    const prevDateStr = formatDateKey(prev);

    const prevPlan = mealPlans[prevDateStr];
    if (!prevPlan || Object.values(prevPlan.meals).every((arr) => !arr || arr.length === 0)) {
      alert(`O dia anterior (${prevDateStr}) não possui refeições cadastradas para copiar.`);
      return;
    }

    const prevDefs = getMealDefinitionsForDate(prevDateStr);
    const clonedMeals: Record<string, MealFoodEntry[]> = {};

    prevDefs.forEach((def) => {
      clonedMeals[def.id] = (prevPlan.meals[def.id] || []).map((e) => ({
        ...e,
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      }));
    });

    onUpdateDailyMealPlan(selectedDateStr, {
      ...currentPlan,
      mealDefinitions: prevDefs,
      meals: clonedMeals,
    });

    fireDisciplineConfetti();
    showToast(`Plano alimentar copiado com sucesso de ${prevDateStr} para ${selectedDateStr}!`);
  };

  const handleReplicateToWeek = () => {
    const hasAnyMeal = Object.values(currentPlan.meals).some((m) => m && m.length > 0);
    if (!hasAnyMeal) {
      alert('Monte ao menos uma refeição neste dia antes de replicar para toda a semana.');
      return;
    }

    if (!confirm(`Replicar as refeições e alimentos de ${selectedDateStr} para todos os outros 6 dias desta semana?`)) {
      return;
    }

    const updates: Record<string, DailyMealPlan> = {};
    weekDays.forEach((day) => {
      if (day.dateStr !== selectedDateStr) {
        updates[day.dateStr] = {
          date: day.dateStr,
          mealDefinitions: JSON.parse(JSON.stringify(activeMealDefinitions)),
          meals: JSON.parse(JSON.stringify(currentPlan.meals)),
          waterConsumedMl: currentPlan.waterConsumedMl,
        };
      }
    });

    if (onBatchUpdateDailyMealPlans) {
      onBatchUpdateDailyMealPlans(updates);
    } else {
      Object.entries(updates).forEach(([dStr, plan]) => {
        onUpdateDailyMealPlan(dStr, plan);
      });
    }

    fireDisciplineConfetti();
    showToast(`Cardápio replicado para todos os dias da semana com sucesso!`);
  };

  const handleClearDayPlan = () => {
    if (!confirm(`Limpar todos os alimentos do dia ${selectedDateStr}?`)) return;

    const clearedMeals: Record<string, MealFoodEntry[]> = {};
    activeMealDefinitions.forEach((def) => {
      clearedMeals[def.id] = [];
    });

    onUpdateDailyMealPlan(selectedDateStr, {
      ...currentPlan,
      mealDefinitions: activeMealDefinitions,
      meals: clearedMeals,
    });

    showToast(`Cardápio do dia ${selectedDateStr} foi limpo.`);
  };

  // Percentages against targets
  const calPct = targetMacros.targetCalories > 0 ? Math.min(150, Math.round((dayTotals.calories / targetMacros.targetCalories) * 100)) : 0;
  const protPct = targetMacros.proteinGrams > 0 ? Math.min(150, Math.round((dayTotals.protein / targetMacros.proteinGrams) * 100)) : 0;
  const carbPct = targetMacros.carbsGrams > 0 ? Math.min(150, Math.round((dayTotals.carbs / targetMacros.carbsGrams) * 100)) : 0;
  const fatPct = targetMacros.fatGrams > 0 ? Math.min(150, Math.round((dayTotals.fat / targetMacros.fatGrams) * 100)) : 0;

  // Selected food preview in add modal
  const addModalFood = foods.find((f) => f.id === selectedFoodId) || foods[0];
  const addModalQty = parseFloat(consumedQuantity) || 0;
  const addPreviewNutrients = addModalFood ? calculateFoodNutrients(addModalFood, addModalQty) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Edit item modal preview
  const editModalFood = foods.find((f) => f.id === editFoodId) || foods[0];
  const editModalQty = parseFloat(editQuantity) || 0;
  const editPreviewNutrients = editModalFood ? calculateFoodNutrients(editModalFood, editModalQty) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Totals of tempMealEntries in full meal edit modal
  const tempMealTotals = calculateMealTotals(tempMealEntries);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-zinc-900 border border-[#D97706] text-[#38BDF8] rounded-xl shadow-2xl font-mono text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-mono uppercase">
            <UtensilsCrossed className="w-5 h-5 text-[#38BDF8]" />
            <span>Diário Alimentar</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Monte suas refeições com alimentos cadastrados. Adicione ou exclua refeições na quantidade que quiser.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateMealOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs uppercase font-mono tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg "
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Refeição</span>
          </button>

          <button
            onClick={onNavigateToFoodDatabase}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Banco de Alimentos</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#38BDF8]" />
          </button>
        </div>
      </div>

      {/* 1. NUTRITIONAL TARGET COMPARISON BAR (CONSUMIDO VS META DIÁRIA) */}
      <div className="p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F2430]">
          <div>
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#38BDF8]" />
              <span>Metas Nutricionais do Dia</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400">
              Calorias Restantes:{' '}
              <strong className="font-bold text-[#38BDF8]">
                {targetMacros.targetCalories - dayTotals.calories} kcal
              </strong>
            </span>
          </div>
        </div>

        {/* 4 Macro Bars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Calorias Totais */}
          <div className="p-3.5 rounded-xl bg-black/50 border border-[#1F2430] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-zinc-400 uppercase font-bold">🔥 Calorias</span>
                <span className="text-[#38BDF8] font-bold">{calPct}%</span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl font-black font-mono text-white">{dayTotals.calories}</span>
                <span className="text-xs font-mono text-zinc-500">/ {targetMacros.targetCalories} kcal</span>
              </div>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#D97706] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, calPct)}%` }}
              />
            </div>
          </div>

          {/* Proteínas */}
          <div className="p-3.5 rounded-xl bg-black/50 border border-[#1F2430] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-zinc-400 uppercase font-bold">🍗 Proteínas</span>
                <span className="text-white font-bold">{protPct}%</span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl font-black font-mono text-white">{dayTotals.protein}g</span>
                <span className="text-xs font-mono text-zinc-500">/ {targetMacros.proteinGrams}g</span>
              </div>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#D97706] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, protPct)}%` }}
              />
            </div>
          </div>

          {/* Carboidratos */}
          <div className="p-3.5 rounded-xl bg-black/50 border border-[#1F2430] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-zinc-400 uppercase font-bold">🍚 Carboidratos</span>
                <span className="text-zinc-300 font-bold">{carbPct}%</span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl font-black font-mono text-white">{dayTotals.carbs}g</span>
                <span className="text-xs font-mono text-zinc-500">/ {targetMacros.carbsGrams}g</span>
              </div>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-zinc-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, carbPct)}%` }}
              />
            </div>
          </div>

          {/* Gorduras */}
          <div className="p-3.5 rounded-xl bg-black/50 border border-[#1F2430] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-zinc-400 uppercase font-bold">🥑 Gorduras</span>
                <span className="text-zinc-300 font-bold">{fatPct}%</span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl font-black font-mono text-white">{dayTotals.fat}g</span>
                <span className="text-xs font-mono text-zinc-500">/ {targetMacros.fatGrams}g</span>
              </div>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-zinc-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, fatPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. WEEKLY DAYS OF THE WEEK STRIP (DIAS DA SEMANA) */}
      <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#38BDF8]" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Dias da Semana
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => shiftWeek(-7)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-zinc-300 font-bold uppercase text-[11px] px-1">
              Semana {weekDays[0].dayNum} a {weekDays[6].dayNum} de{' '}
              {weekDays[0].date.toLocaleDateString('pt-BR', { month: 'short' })}
            </span>

            <button
              onClick={() => shiftWeek(7)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDateStr(todayStr)}
              className="ml-2 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[#38BDF8] font-bold uppercase text-[10px] border border-[#1F2430] transition-colors cursor-pointer"
            >
              Hoje
            </button>
          </div>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const isSelected = day.dateStr === selectedDateStr;
            const isToday = day.dateStr === todayStr;
            const dayPlan = mealPlans[day.dateStr];
            const totals = calculateDailyMealPlanTotals(dayPlan);
            const dayDefs = getMealDefinitionsForDate(day.dateStr);

            // Count filled meals
            let filledMealsCount = 0;
            if (dayPlan?.meals) {
              filledMealsCount = Object.values(dayPlan.meals).filter(
                (arr) => arr && arr.length > 0
              ).length;
            }

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDateStr(day.dateStr)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-zinc-900 border-[#D97706] shadow-lg  ring-1 ring-[#D97706]/40'
                    : 'bg-black/40 border-[#1F2430] hover:border-zinc-700 hover:bg-zinc-900/50'
                }`}
              >
                <div className="w-full flex items-center justify-between">
                  <span className={`text-[10px] font-mono uppercase font-bold ${
                    isSelected ? 'text-[#38BDF8]' : 'text-zinc-500'
                  }`}>
                    {day.label}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#D97706]/40 font-bold uppercase">
                      HOJE
                    </span>
                  )}
                </div>

                <div className="my-0.5 flex items-baseline gap-1">
                  <span className={`text-base font-black font-mono ${
                    isSelected ? 'text-white' : 'text-zinc-300'
                  }`}>
                    {day.dayNum}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {day.date.toLocaleDateString('pt-BR', { month: 'short' })}
                  </span>
                </div>

                {/* Day status badge */}
                <div className="w-full pt-1 border-t border-[#1F2430] flex items-center justify-between text-[10px] font-mono">
                  {totals.calories > 0 ? (
                    <>
                      <span className="text-[#38BDF8] font-bold">
                        {totals.calories}k
                      </span>
                      <span className="text-zinc-500">
                        {filledMealsCount}/{dayDefs.length} ref
                      </span>
                    </>
                  ) : (
                    <span className="text-zinc-600 italic">0/{dayDefs.length} ref</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Day Plan Actions Bar */}
        <div className="pt-2 border-t border-[#1F2430] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Dia Selecionado:</span>
            <span className="font-bold text-[#38BDF8]">{selectedDateStr}</span>
            <span className="text-[11px] text-zinc-500">
              ({activeMealDefinitions.length} {activeMealDefinitions.length === 1 ? 'refeição' : 'refeições'})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCreateMealOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-[#D97706]/40 text-[#38BDF8] flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
              title="Criar nova refeição personalizada para este dia"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Refeição</span>
            </button>

            <button
              onClick={handleCopyFromPreviousDay}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copia os alimentos do dia anterior para o dia atual"
            >
              <Copy className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Copiar do Dia Anterior</span>
            </button>

            <button
              onClick={handleReplicateToWeek}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Aplica a estrutura e alimentos deste dia para toda a semana"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Replicar p/ Semana Inteira</span>
            </button>

            <button
              onClick={handleRestoreDefaultMeals}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
              title="Restaura as 5 refeições padrão (Café, Almoço, Lanche, Jantar, Ceia)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar 5 Padrões</span>
            </button>

            {dayTotals.calories > 0 && (
              <button
                onClick={handleClearDayPlan}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-[#1F2430] text-zinc-500 hover:text-[#F3F4F6] flex items-center gap-1 transition-colors cursor-pointer"
                title="Limpar todos os alimentos do dia"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpar Dia</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC MEALS BREAKDOWN (REFEIÇÕES PERSONALIZÁVEIS) */}
      <div className="space-y-4">
        {activeMealDefinitions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#12141A] border border-dashed border-[#1F2430] text-center space-y-3">
            <p className="text-sm font-mono text-zinc-400">
              Nenhuma refeição cadastrada para este dia ({selectedDateStr}).
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsCreateMealOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs font-mono uppercase tracking-wider"
              >
                + Criar Primeira Refeição
              </button>
              <button
                onClick={handleRestoreDefaultMeals}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#1F2430] text-xs font-mono text-zinc-300"
              >
                Restaurar 5 Refeições Padrão
              </button>
            </div>
          </div>
        ) : (
          activeMealDefinitions.map((config, index) => {
            const entries = currentPlan.meals[config.id] || [];
            const mealTotals = calculateMealTotals(entries);

            return (
              <div
                key={config.id}
                className="p-5 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-md space-y-3.5 transition-all"
              >
                {/* Meal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F2430]/70">
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-2 rounded-xl bg-black/60 border border-[#1F2430]">
                      {config.icon || '🍽️'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500 font-bold">
                          #{index + 1}
                        </span>
                        <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                          {config.name}
                        </h3>
                        {config.time && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-[#38BDF8] border border-[#1F2430] font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            {config.time}
                          </span>
                        )}
                      </div>
                      {config.subtitle && (
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {config.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right font-mono text-xs">
                      <span className="font-black text-[#38BDF8] block text-sm">
                        {mealTotals.calories} kcal
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        P: {mealTotals.protein}g · C: {mealTotals.carbs}g · G: {mealTotals.fat}g
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* EDIT MEAL BUTTON */}
                      <button
                        onClick={() => handleOpenMealEditor(config.id)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-mono text-xs font-bold flex items-center gap-1.5 border border-[#1F2430] transition-colors cursor-pointer"
                        title="Editar nome, horário e alimentos desta refeição"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>Editar Refeição</span>
                      </button>

                      {/* ADD FOOD TO MEAL BUTTON */}
                      <button
                        onClick={() => handleOpenAddModal(config.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#D97706] hover:bg-[#b45309] text-white border border-[#f59e0b]/20 shadow-none font-mono text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Adicionar novo alimento a esta refeição"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>+ Item</span>
                      </button>

                      {/* DELETE MEAL BUTTON (ALLOWS USER TO DELETE ANY MEAL) */}
                      <button
                        onClick={() => handleDeleteMeal(config.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Excluir esta refeição do cardápio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Meal Items Aligned Nutritional Table */}
                {entries.length === 0 ? (
                  <div className="py-5 text-center text-xs font-mono text-zinc-500 bg-black/20 rounded-xl border border-dashed border-[#1F2430]">
                    Nenhum alimento registrado nesta refeição.{' '}
                    <button
                      onClick={() => handleOpenAddModal(config.id)}
                      className="text-[#38BDF8] hover:underline font-bold cursor-pointer ml-1"
                    >
                      + Montar cardápio
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[#1F2430] bg-black/40">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono min-w-[620px]">
                        <thead>
                          <tr className="border-b border-[#1F2430] bg-zinc-950/90 text-[10px] uppercase font-bold text-zinc-400">
                            <th className="py-2.5 px-3.5 text-left w-[32%]">Alimento</th>
                            <th className="py-2.5 px-3 text-center w-[14%]">Porção</th>
                            <th className="py-2.5 px-3 text-right text-[#38BDF8] w-[14%]">Calorias</th>
                            <th className="py-2.5 px-3 text-right text-zinc-300 w-[10%]">Proteína (P)</th>
                            <th className="py-2.5 px-3 text-right text-zinc-300 w-[10%]">Carboidrato (C)</th>
                            <th className="py-2.5 px-3 text-right text-zinc-300 w-[10%]">Gordura (G)</th>
                            <th className="py-2.5 px-3.5 text-right w-[10%]">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {entries.map((entry) => (
                            <tr
                              key={entry.id}
                              className="hover:bg-zinc-900/40 transition-colors group"
                            >
                              <td className="py-2.5 px-3.5 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] flex-shrink-0" />
                                  <span className="font-bold text-white text-xs">{entry.foodName}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center text-zinc-300 font-semibold tabular-nums whitespace-nowrap">
                                {entry.quantity} {entry.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-[#38BDF8] tabular-nums whitespace-nowrap">
                                {entry.calculatedCalories}{' '}
                                <span className="text-[10px] text-zinc-500 font-normal">kcal</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-zinc-200 tabular-nums whitespace-nowrap">
                                {entry.calculatedProtein}g
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-zinc-200 tabular-nums whitespace-nowrap">
                                {entry.calculatedCarbs}g
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-zinc-200 tabular-nums whitespace-nowrap">
                                {entry.calculatedFat}g
                              </td>
                              <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleOpenEditEntry(config.id, entry)}
                                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Editar quantidade ou alimento"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveEntry(config.id, entry.id)}
                                    className="p-1 text-zinc-600 hover:text-[#F3F4F6] hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Remover da refeição"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-[#1F2430] bg-zinc-950/90 text-xs font-mono">
                          <tr>
                            <td colSpan={2} className="py-2.5 px-3.5 font-bold text-zinc-400 uppercase text-[10px] tracking-wider">
                              Subtotal da Refeição
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-[#38BDF8] tabular-nums whitespace-nowrap">
                              {mealTotals.calories}{' '}
                              <span className="text-[10px] text-[#9CA3AF] font-normal">kcal</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-white tabular-nums whitespace-nowrap">
                              {mealTotals.protein}g
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-white tabular-nums whitespace-nowrap">
                              {mealTotals.carbs}g
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-white tabular-nums whitespace-nowrap">
                              {mealTotals.fat}g
                            </td>
                            <td className="py-2.5 px-3.5 text-right"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          MODAL A: CRIAR NOVA REFEIÇÃO (ADD MEAL)
          ======================================================== */}
      {isCreateMealOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl text-zinc-100 ">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1F2430]">
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#38BDF8]" />
                <span>Adicionar Nova Refeição</span>
              </h3>
              <button
                onClick={() => setIsCreateMealOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeal} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Nome da Refeição *
                </label>
                <input
                  type="text"
                  required
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  placeholder="Ex: Pré-Treino, Lanche 2, Refeição 4, Ceia Anabólica"
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Horário Sugerido
                  </label>
                  <input
                    type="time"
                    value={newMealTime}
                    onChange={(e) => setNewMealTime(e.target.value)}
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Ícone / Emoji
                  </label>
                  <select
                    value={newMealIcon}
                    onChange={(e) => setNewMealIcon(e.target.value)}
                    className="w-full bg-black/80 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706] text-lg"
                  >
                    {AVAILABLE_ICONS.map((emoji) => (
                      <option key={emoji} value={emoji}>
                        {emoji}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Subtítulo / Descrição (Opcional)
                </label>
                <input
                  type="text"
                  value={newMealSubtitle}
                  onChange={(e) => setNewMealSubtitle(e.target.value)}
                  placeholder="Ex: Carga de aminoácidos e carboidrato rápido"
                  className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-[#1F2430] flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="applyWeek"
                  checked={applyNewMealToWeek}
                  onChange={(e) => setApplyNewMealToWeek(e.target.checked)}
                  className="w-4 h-4 accent-[#D97706] rounded cursor-pointer"
                />
                <label htmlFor="applyWeek" className="text-xs font-mono text-zinc-300 cursor-pointer">
                  Criar esta refeição em todos os dias desta semana
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2430]">
                <button
                  type="button"
                  onClick={() => setIsCreateMealOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs uppercase font-mono tracking-wider transition-all shadow-lg "
                >
                  Criar Refeição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL B: EDITAR REFEIÇÃO COMPLETA (FULL MEAL EDITOR)
          ======================================================== */}
      {editingMealModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl text-zinc-100  max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2430] mb-4">
              <div>
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#38BDF8]" />
                  <span>Editar Refeição // {tempMealName}</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Edite nome, horário, alimentos e quantidades desta refeição
                </p>
              </div>

              <button
                onClick={() => setEditingMealModalType(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editable Meal Info (Name, Time, Icon) */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-[#1F2430] mb-4 space-y-3 font-mono text-xs">
              <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                Configurações da Refeição
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    value={tempMealName}
                    onChange={(e) => setTempMealName(e.target.value)}
                    placeholder="Nome da refeição"
                    className="w-full bg-black/80 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="time"
                    value={tempMealTime}
                    onChange={(e) => setTempMealTime(e.target.value)}
                    className="w-full bg-black/80 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={tempMealIcon}
                    onChange={(e) => setTempMealIcon(e.target.value)}
                    className="w-full bg-black/80 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D97706] text-base"
                  >
                    {AVAILABLE_ICONS.map((emoji) => (
                      <option key={emoji} value={emoji}>
                        {emoji} Ícone
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Live Totals Bar in Modal */}
            <div className="p-3 rounded-xl bg-black/60 border border-[#1F2430] mb-4 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 uppercase font-bold">Total da Refeição:</span>
              <div className="flex items-center gap-3">
                <span className="text-[#38BDF8] font-black text-sm">{tempMealTotals.calories} kcal</span>
                <span className="text-zinc-300">P: {tempMealTotals.protein}g</span>
                <span className="text-zinc-300">C: {tempMealTotals.carbs}g</span>
                <span className="text-zinc-300">G: {tempMealTotals.fat}g</span>
              </div>
            </div>

            {/* Scrollable Aligned Items Table */}
            <div className="flex-1 overflow-y-auto pr-1 max-h-[38vh]">
              {tempMealEntries.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-zinc-500 bg-black/30 rounded-xl border border-dashed border-[#1F2430]">
                  Esta refeição está vazia no momento. Adicione alimentos abaixo.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#1F2430] bg-black/40">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono min-w-[560px]">
                      <thead>
                        <tr className="border-b border-[#1F2430] bg-zinc-950 text-[10px] uppercase font-bold text-zinc-400">
                          <th className="py-2 px-3 text-left w-[30%]">Alimento</th>
                          <th className="py-2 px-2 text-center w-[25%]">Porção / Ajuste</th>
                          <th className="py-2 px-2 text-right text-[#38BDF8] w-[12%]">Calorias</th>
                          <th className="py-2 px-2 text-right text-zinc-300 w-[9%]">Prot</th>
                          <th className="py-2 px-2 text-right text-zinc-300 w-[9%]">Carb</th>
                          <th className="py-2 px-2 text-right text-zinc-300 w-[9%]">Gord</th>
                          <th className="py-2 px-3 text-right w-[6%]">Excluir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {tempMealEntries.map((item) => (
                          <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="py-2 px-3 text-left">
                              <span className="font-bold text-white text-xs block truncate max-w-[160px]" title={item.foodName}>
                                {item.foodName}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex items-center justify-center gap-1 bg-black/80 border border-zinc-700/80 rounded-lg p-0.5 max-w-[135px] mx-auto">
                                <button
                                  type="button"
                                  onClick={() => handleTempEntryQuantityChange(item.id, Math.max(10, item.quantity - 10))}
                                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center cursor-pointer text-xs"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleTempEntryQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-12 bg-transparent text-center font-bold text-white text-xs focus:outline-none tabular-nums"
                                />
                                <span className="text-[10px] text-zinc-500 pr-1">{item.unit}</span>
                                <button
                                  type="button"
                                  onClick={() => handleTempEntryQuantityChange(item.id, item.quantity + 10)}
                                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center cursor-pointer text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-right font-black text-[#38BDF8] tabular-nums whitespace-nowrap">
                              {item.calculatedCalories} <span className="text-[9px] text-zinc-500 font-normal">kcal</span>
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-zinc-200 tabular-nums whitespace-nowrap">
                              {item.calculatedProtein}g
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-zinc-200 tabular-nums whitespace-nowrap">
                              {item.calculatedCarbs}g
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-zinc-200 tabular-nums whitespace-nowrap">
                              {item.calculatedFat}g
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleTempRemoveEntry(item.id)}
                                className="p-1 text-zinc-500 hover:text-[#F3F4F6] rounded transition-colors cursor-pointer"
                                title="Remover da refeição"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-[#1F2430] bg-zinc-950 font-bold text-xs">
                        <tr>
                          <td colSpan={2} className="py-2 px-3 text-zinc-400 uppercase text-[10px]">
                            Subtotal da Refeição
                          </td>
                          <td className="py-2 px-2 text-right text-[#38BDF8] font-black tabular-nums whitespace-nowrap">
                            {tempMealTotals.calories} <span className="text-[9px] text-[#9CA3AF] font-normal">kcal</span>
                          </td>
                          <td className="py-2 px-2 text-right text-white font-black tabular-nums whitespace-nowrap">
                            {tempMealTotals.protein}g
                          </td>
                          <td className="py-2 px-2 text-right text-white font-black tabular-nums whitespace-nowrap">
                            {tempMealTotals.carbs}g
                          </td>
                          <td className="py-2 px-2 text-right text-white font-black tabular-nums whitespace-nowrap">
                            {tempMealTotals.fat}g
                          </td>
                          <td className="py-2 px-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Add Food Section Inside Modal */}
            <div className="mt-4 pt-4 border-t border-[#1F2430] space-y-2">
              <span className="text-[11px] font-mono uppercase text-zinc-400 font-bold block">
                + Inserir Outro Alimento nesta Refeição
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7">
                  <select
                    value={modalNewFoodId}
                    onChange={(e) => {
                      setModalNewFoodId(e.target.value);
                      const f = foods.find((item) => item.id === e.target.value);
                      if (f) setModalNewFoodQty(f.servingSize.toString());
                    }}
                    className="w-full bg-black/80 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  >
                    {foods.map((food) => (
                      <option key={food.id} value={food.id}>
                        {food.name} ({food.calories} kcal / {food.servingSize}{food.servingUnit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={modalNewFoodQty}
                    onChange={(e) => setModalNewFoodQty(e.target.value)}
                    placeholder="Qtd"
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddFoodInsideMealEditor}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[#E2E8F0] hover:text-white font-mono text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    + Incluir
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1F2430] mt-4">
              <button
                type="button"
                onClick={() => {
                  if (editingMealModalType) {
                    handleDeleteMeal(editingMealModalType);
                    setEditingMealModalType(null);
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-mono text-red-400 hover:bg-red-400/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Refeição</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMealModalType(null)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveMealEditor}
                  className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs uppercase font-mono tracking-wider transition-all shadow-lg  flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL C: ADICIONAR ALIMENTO À REFEIÇÃO
          ======================================================== */}
      {isAddEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl text-zinc-100 ">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1F2430]">
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Adicionar à Refeição ({activeMealDefinitions.find((m) => m.id === activeMealType)?.name || activeMealType})
              </h3>
              <button
                onClick={() => setIsAddEntryOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {foods.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-xs font-mono text-zinc-400">
                  Nenhum alimento cadastrado no seu banco de dados.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddEntryOpen(false);
                    onNavigateToFoodDatabase();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs font-mono uppercase tracking-wider"
                >
                  Ir para Banco de Alimentos
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Selecione o Alimento *
                  </label>
                  <select
                    value={selectedFoodId}
                    onChange={(e) => {
                      setSelectedFoodId(e.target.value);
                      const f = foods.find((item) => item.id === e.target.value);
                      if (f) setConsumedQuantity(f.servingSize.toString());
                    }}
                    className="w-full bg-black/80 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                  >
                    {foods.map((food) => (
                      <option key={food.id} value={food.id}>
                        {food.name} ({food.calories} kcal / {food.servingSize}{food.servingUnit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Quantidade Consumida ({addModalFood?.servingUnit || 'g'}) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={consumedQuantity}
                    onChange={(e) => setConsumedQuantity(e.target.value)}
                    placeholder="150"
                    className="w-full bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                {/* Instant Calculation Preview */}
                {addModalFood && addModalQty > 0 && (
                  <div className="p-3.5 rounded-xl bg-black/50 border border-[#1F2430] space-y-2">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">
                      Cálculo Automático Proporcional:
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center font-mono">
                      <div className="p-2 rounded-lg bg-zinc-900 border border-[#1F2430]">
                        <span className="text-[10px] text-zinc-500 block">KCAL</span>
                        <span className="text-xs font-bold text-[#38BDF8]">{addPreviewNutrients.calories}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-900 border border-[#1F2430]">
                        <span className="text-[10px] text-zinc-500 block">PROT</span>
                        <span className="text-xs font-bold text-white">{addPreviewNutrients.protein}g</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-900 border border-[#1F2430]">
                        <span className="text-[10px] text-zinc-500 block">CARB</span>
                        <span className="text-xs font-bold text-zinc-300">{addPreviewNutrients.carbs}g</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-900 border border-[#1F2430]">
                        <span className="text-[10px] text-zinc-500 block">GORD</span>
                        <span className="text-xs font-bold text-zinc-300">{addPreviewNutrients.fat}g</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2430]">
                  <button
                    type="button"
                    onClick={() => setIsAddEntryOpen(false)}
                    className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs uppercase font-mono tracking-wider transition-all shadow-lg "
                  >
                    Inserir no Cardápio
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL D: EDITAR ITEM INDIVIDUAL DA REFEIÇÃO
          ======================================================== */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl text-zinc-100 ">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1F2430]">
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Editar Alimento ({activeMealDefinitions.find((m) => m.id === editingEntry.mealType)?.name || editingEntry.mealType})
              </h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Alimento
                </label>
                <select
                  value={editFoodId}
                  onChange={(e) => {
                    setEditFoodId(e.target.value);
                  }}
                  className="w-full bg-black/80 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#D97706]"
                >
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name} ({food.calories} kcal / {food.servingSize}{food.servingUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Quantidade Consumida ({editModalFood?.servingUnit || 'g'}) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="flex-1 bg-black/60 border border-[#1F2430] rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#D97706]"
                  />
                  <button
                    type="button"
                    onClick={() => setEditQuantity(String(Math.max(10, (parseFloat(editQuantity) || 0) - 10)))}
                    className="px-2.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 hover:text-white"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditQuantity(String((parseFloat(editQuantity) || 0) + 10))}
                    className="px-2.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 hover:text-white"
                  >
                    +10
                  </button>
                </div>
              </div>

              {/* Instant Calculation Preview */}
              {editModalFood && editModalQty > 0 && (
                <div className="p-3.5 rounded-xl bg-black/50 border border-[#1F2430] space-y-2">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">
                    Novo Cálculo Proporcional:
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-[#1F2430]">
                      <span className="text-[10px] text-zinc-500 block">KCAL</span>
                      <span className="text-xs font-bold text-[#38BDF8]">{editPreviewNutrients.calories}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900 border border-[#1F2430]">
                      <span className="text-[10px] text-zinc-500 block">PROT</span>
                      <span className="text-xs font-bold text-white">{editPreviewNutrients.protein}g</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900 border border-[#1F2430]">
                      <span className="text-[10px] text-zinc-500 block">CARB</span>
                      <span className="text-xs font-bold text-zinc-300">{editPreviewNutrients.carbs}g</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900 border border-[#1F2430]">
                      <span className="text-[10px] text-zinc-500 block">GORD</span>
                      <span className="text-xs font-bold text-zinc-300">{editPreviewNutrients.fat}g</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2430]">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold border border-[#f59e0b]/20 shadow-none text-xs uppercase font-mono tracking-wider transition-all shadow-lg "
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
