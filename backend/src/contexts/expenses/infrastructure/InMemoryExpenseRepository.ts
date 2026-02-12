// src/contexts/expenses/infrastructure/InMemoryExpenseRepository.ts

import { Expense }             from '../domain/Expense.js';
import { IExpenseRepository }  from '../domain/IExpenseRepository.js';

export class InMemoryExpenseRepository implements IExpenseRepository {
  // Map<id, Expense> — stockage en mémoire
  private readonly store = new Map<string, Expense>();

  async save(expense: Expense): Promise<void> {
    this.store.set(expense.id, expense);
  }

  async findById(id: string): Promise<Expense | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Expense[]> {
    return [...this.store.values()].filter(e => e.userId === userId);
  }

  async findByUserAndPeriod(userId: string, mois: number, annee: number): Promise<Expense[]> {
    return [...this.store.values()].filter(e => {
      if (e.userId !== userId) return false;
      const d = e.date;
      return d.getMonth() + 1 === mois && d.getFullYear() === annee;
    });
  }

  async update(expense: Expense): Promise<void> {
    this.store.set(expense.id, expense);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  // Helper de test : voir toutes les dépenses
  all(): Expense[] {
    return [...this.store.values()];
  }

  // Helper de test : compter les dépenses
  count(): number {
    return this.store.size;
  }
}