import React, { useState } from 'react';
import {
  Beef,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  RotateCcw
} from 'lucide-react';
import { FoodItem } from '../types';

interface FoodDatabaseViewProps {
  foods: FoodItem[];
  onAddFood: (food: Omit<FoodItem, 'id'>) => void;
  onUpdateFood: (id: string, updates: Partial<FoodItem>) => void;
  onDeleteFood: (id: string) => void;
  onResetDefaultFoods: () => void;
}

export const FoodDatabaseView: React.FC<FoodDatabaseViewProps> = ({
  foods,
  onAddFood,
  onUpdateFood,
  onDeleteFood,
  onResetDefaultFoods,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [category, setCategory] = useState<FoodItem['category']>('Proteínas');

  const categories = [
    'Todos',
    'Proteínas',
    'Carboidratos',
    'Gorduras',
    'Vegetais & Frutas',
    'Laticínios & Suplementos',
  ];

  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Todos' || food.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    setEditingFoodId(null);
    setName('');
    setServingSize('100');
    setServingUnit('g');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setCategory('Proteínas');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (food: FoodItem) => {
    setEditingFoodId(food.id);
    setName(food.name);
    setServingSize(food.servingSize.toString());
    setServingUnit(food.servingUnit);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFat(food.fat.toString());
    setCategory(food.category || 'Proteínas');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      servingSize: parseFloat(servingSize) || 100,
      servingUnit: servingUnit.trim() || 'g',
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      category,
      isCustom: true,
    };

    if (editingFoodId) {
      onUpdateFood(editingFoodId, payload);
    } else {
      onAddFood(payload);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 text-[#F3F4F6]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F3F4F6] flex items-center gap-2 uppercase">
            <Beef className="w-5 h-5 text-[#38BDF8]" />
            <span>Banco de Alimentos</span>
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Gerencie alimentos de referência com seus valores exatos de Calorias, Proteínas, Carboidratos e Gorduras
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onResetDefaultFoods}
            className="px-3 py-2 rounded-xl bg-[#12141A] hover:bg-[#1A1E29] border border-[#1F2430] text-xs text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restaurar tabela padrão de alimentos limpos"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span>Restaurar Padrões</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-200 cursor-pointer border border-[#f59e0b]/20 shadow-none"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Alimento</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND CATEGORY FILTER */}
      <div className="p-4 rounded-2xl bg-[#12141A] border border-[#1F2430] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do alimento (ex: Frango, Arroz, Ovo)..."
            className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F3F4F6] placeholder-zinc-500 focus:outline-none focus:border-[#D97706] transition-all duration-200"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#E2E8F0] text-[#090A0C] font-bold shadow-sm'
                  : 'bg-[#0D0E14] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1E29] border border-[#1F2430]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FOODS TABLE & GRID */}
      <div className="bg-[#12141A] border border-[#1F2430] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1F2430] bg-[#0D0E14] text-[#9CA3AF] uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 font-bold">Alimento</th>
                <th className="py-3.5 px-4 font-bold">Porção Referência</th>
                <th className="py-3.5 px-4 font-bold text-[#E2E8F0]">Calorias</th>
                <th className="py-3.5 px-4 font-bold text-[#F3F4F6]">Proteínas (P)</th>
                <th className="py-3.5 px-4 font-bold text-[#F3F4F6]">Carboidratos (C)</th>
                <th className="py-3.5 px-4 font-bold text-[#F3F4F6]">Gorduras (G)</th>
                <th className="py-3.5 px-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2430]">
              {filteredFoods.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#9CA3AF]">
                    Nenhum alimento encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredFoods.map((food) => (
                  <tr
                    key={food.id}
                    className="hover:bg-[#1A1E29]/60 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#F3F4F6] text-sm">
                          {food.name}
                        </span>
                        {food.category && (
                          <span className="text-[10px] text-[#38BDF8] uppercase tracking-wider font-semibold">
                            {food.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#9CA3AF]">
                      {food.servingSize} {food.servingUnit}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#E2E8F0] text-sm">
                        {food.calories} <span className="text-[10px] text-[#9CA3AF]">kcal</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#F3F4F6]">
                      {food.protein}g
                    </td>
                    <td className="py-3 px-4 font-bold text-[#F3F4F6]">
                      {food.carbs}g
                    </td>
                    <td className="py-3 px-4 font-bold text-[#F3F4F6]">
                      {food.fat}g
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(food)}
                          className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1E29] transition-colors cursor-pointer"
                          title="Editar alimento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteFood(food.id)}
                          className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                          title="Excluir do banco"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="py-3 px-4 bg-[#0D0E14] border-t border-[#1F2430] flex items-center justify-between text-[11px] text-[#9CA3AF]">
          <span>Total cadastrado: {foods.length} alimentos de alto valor biológico</span>
          <span className="text-[#38BDF8] font-bold">Pronto para montagem de refeições</span>
        </div>
      </div>

      {/* MODAL: CADASTRAR OU EDITAR ALIMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#12141A] border border-[#1F2430] rounded-2xl p-6 shadow-2xl text-[#F3F4F6]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1F2430]">
              <h3 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wider">
                {editingFoodId ? 'Editar Alimento' : 'Cadastrar Novo Alimento'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1E29]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-[#9CA3AF] font-semibold mb-1.5">
                  Nome do Alimento *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Peito de Frango Grelhado, Patinho Moído, Arroz Integral"
                  className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3.5 py-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#D97706] transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase text-[#9CA3AF] font-semibold mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3 py-2 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#D97706]"
                  >
                    <option value="Proteínas">Proteínas</option>
                    <option value="Carboidratos">Carboidratos</option>
                    <option value="Gorduras">Gorduras</option>
                    <option value="Vegetais & Frutas">Vegetais & Frutas</option>
                    <option value="Laticínios & Suplementos">Laticínios & Suplementos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#9CA3AF] font-semibold mb-1.5">
                    Calorias Referência (kcal) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="Ex: 165"
                    className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3 py-2 text-xs text-[#F3F4F6] font-bold focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase text-[#9CA3AF] font-semibold mb-1.5">
                    Qtd. de Referência *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    placeholder="100"
                    className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3 py-2 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#9CA3AF] font-semibold mb-1.5">
                    Unidade de Medida *
                  </label>
                  <input
                    type="text"
                    required
                    value={servingUnit}
                    onChange={(e) => setServingUnit(e.target.value)}
                    placeholder="g, ml, unidade, fatia"
                    className="w-full bg-[#0D0E14] border border-[#2A2F3D] rounded-xl px-3 py-2 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              {/* 3 Macros */}
              <div className="p-3.5 rounded-xl bg-[#0D0E14] border border-[#1F2430] space-y-3">
                <span className="text-[11px] uppercase text-[#9CA3AF] block font-bold">
                  Macronutrientes para a Porção ({servingSize}{servingUnit})
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#9CA3AF] mb-1 font-semibold">
                      Proteína (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-[#12141A] border border-[#1F2430] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] font-bold focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#9CA3AF] mb-1 font-semibold">
                      Carboidrato (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-[#12141A] border border-[#1F2430] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] font-bold focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#9CA3AF] mb-1 font-semibold">
                      Gordura (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-[#12141A] border border-[#1F2430] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] font-bold focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2430]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#9CA3AF] hover:text-[#F3F4F6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 border border-[#f59e0b]/20 shadow-none cursor-pointer"
                >
                  {editingFoodId ? 'Atualizar Alimento' : 'Salvar no Banco'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
