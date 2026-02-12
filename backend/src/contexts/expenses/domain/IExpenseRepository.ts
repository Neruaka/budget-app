// src/contexts/expenses/domain/IExpenseRepository.ts

import { Expense } from './Expense.js';

export interface IExpenseRepository {
  save(expense: Expense): Promise<void>;
  findById(id: string): Promise<Expense | null>;
  findByUserId(userId: string): Promise<Expense[]>;
  findByUserAndPeriod(userId: string, mois: number, annee: number): Promise<Expense[]>;
  update(expense: Expense): Promise<void>;
  delete(id: string): Promise<void>;
}








