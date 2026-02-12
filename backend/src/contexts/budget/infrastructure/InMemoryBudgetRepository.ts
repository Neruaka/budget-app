// src/contexts/budget/infrastructure/InMemoryBudgetRepository.ts

import { Budget }             from '../domain/Budget.js';
import { IBudgetRepository }  from '../domain/IBudgetRepository.js';

export class InMemoryBudgetRepository implements IBudgetRepository {
  private readonly store = new Map<string, Budget>();

  async save(budget: Budget): Promise<void> {
    // Clé composée userId-mois-annee pour unicité
    const key = `${budget.userId}-${budget.mois}-${budget.annee}`;
    this.store.set(key, budget);
  }

  async findByUserAndPeriod(userId: string, mois: number, annee: number): Promise<Budget | null> {
    const key = `${userId}-${mois}-${annee}`;
    return this.store.get(key) ?? null;
  }

  async findByUserId(userId: string): Promise<Budget[]> {
    return [...this.store.values()].filter(b => b.userId === userId);
  }
}
