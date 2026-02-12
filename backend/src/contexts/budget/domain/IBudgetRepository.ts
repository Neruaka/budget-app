// src/contexts/budget/domain/IBudgetRepository.ts

import { Budget } from './Budget.js';

export interface IBudgetRepository {
  save(budget: Budget): Promise<void>;
  findByUserAndPeriod(userId: string, mois: number, annee: number): Promise<Budget | null>;
  findByUserId(userId: string): Promise<Budget[]>;
}
