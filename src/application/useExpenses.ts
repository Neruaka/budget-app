// src/application/useExpenses.ts

import { useState, useEffect, useCallback } from 'react';
import { Expense, CreateExpenseDTO } from '../domain/types';
import { expensesApi } from '../infrastructure/api';
import { filtrerParMois } from '../domain/calculators';

export function useExpenses(mois: number, annee: number) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await expensesApi.getByMonth(mois, annee);
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [mois, annee]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (data: CreateExpenseDTO) => {
    const created = await expensesApi.create(data);
    setExpenses((prev) => [created, ...prev]);
    return created;
  };

  const updateExpense = async (id: number, data: Partial<CreateExpenseDTO>) => {
    const updated = await expensesApi.update(id, data);
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  };

  const deleteExpense = async (id: number) => {
    await expensesApi.delete(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // On utilise le domaine pour filtrer — pas de logique ici !
  const expensesDuMois = filtrerParMois(expenses, mois, annee);

  return {
    expenses: expensesDuMois,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refresh: fetchExpenses,
  };
}
