// src/domain/calculators.ts
import { Expense, Budget, MonthlyStats, CategoryStat, Category } from './types';

// Calcule le total des dépenses d'une liste
export function calculerTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.montant, 0);
}

// Filtre les dépenses par mois/année
export function filtrerParMois(expenses: Expense[], mois: number, annee: number): Expense[] {
  return expenses.filter((e) => {
    const date = new Date(e.date);
    return date.getMonth() + 1 === mois && date.getFullYear() === annee;
  });
}

// Calcule le montant restant dans le budget
export function calculerRestant(budget: Budget, totalDepense: number): number {
  return budget.montantMax - totalDepense;
}

// Vérifie si le budget est dépassé
export function isBudgetDepasse(budget: Budget, totalDepense: number): boolean {
  return totalDepense > budget.montantMax;
}

// Calcule le pourcentage utilisé du budget
export function calculerPourcentageBudget(budget: Budget, totalDepense: number): number {
  if (budget.montantMax === 0) return 0;
  return Math.min((totalDepense / budget.montantMax) * 100, 100);
}

// Génère les stats mensuelles complètes
export function genererStatsmensuelles(
  expenses: Expense[],
  budget: Budget | null,
  categories: Category[]
): MonthlyStats {
  const total = calculerTotal(expenses);
  const budgetMax = budget?.montantMax ?? 0;

  // Grouper par catégorie
  const mapCategorie: Record<number, number> = {};
  expenses.forEach((e) => {
    mapCategorie[e.categoryId] = (mapCategorie[e.categoryId] ?? 0) + e.montant;
  });

  const parCategorie: CategoryStat[] = categories
    .filter((cat) => mapCategorie[cat.id] !== undefined)
    .map((cat) => ({
      category: cat,
      total: mapCategorie[cat.id],
      pourcentage: total > 0 ? (mapCategorie[cat.id] / total) * 100 : 0,
      count: expenses.filter((e) => e.categoryId === cat.id).length,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalDepense: total,
    budgetMax,
    pourcentageUtilise: budgetMax > 0 ? (total / budgetMax) * 100 : 0,
    isExceeded: budget ? isBudgetDepasse(budget, total) : false,
    parCategorie,
  };
}

// Validation d'une dépense avant création
export function validerDepense(montant: number, categoryId: number): string | null {
  if (!montant || montant <= 0) return 'Le montant doit être positif';
  if (montant > 100000) return 'Le montant semble incorrect';
  if (!categoryId) return 'Veuillez sélectionner une catégorie';
  return null; // null = pas d'erreur
}

// Formate un montant en euros
export function formaterMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
}

// Formate une date pour l'affichage
export function formaterDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}
