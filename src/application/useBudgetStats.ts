// src/application/useBudgetStats.ts


import { useState, useEffect } from 'react';
import { Budget, Category, Expense, MonthlyStats, CreateBudgetDTO } from '../domain/types';
import { budgetApi, categoriesApi } from '../infrastructure/api';
import { genererStatsmensuelles } from '../domain/calculators';

export function useBudgetStats(expenses: Expense[], mois: number, annee: number) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [budgetData, categoriesData] = await Promise.all([
          budgetApi.getCurrent(),
          categoriesApi.getAll(),
        ]);
        setBudget(budgetData);
        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mois, annee]);

  const setBudgetMax = async (montantMax: number) => {
    const data: CreateBudgetDTO = {
      montantMax,
      mois,
      annee,
      userId: 0, // sera rempli par le backend via le JWT
      isActive: true,
    };
    const newBudget = await budgetApi.set(data);
    setBudget(newBudget);
    return newBudget;
  };

  // Calcul des stats via la couche domaine — zéro logique ici
  const stats: MonthlyStats | null =
    categories.length > 0
      ? genererStatsmensuelles(expenses, budget, categories)
      : null;

  return { budget, categories, stats, loading, error, setBudgetMax };
}
