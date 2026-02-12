// src/domain/types.ts

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  defaultCurrency: string;
}

export interface Category {
  id: number;
  nom: string;
  couleur: string;
  icon: string;
  isDefault: boolean;
}

export interface Expense {
  id: string;         
  montant: number;
  date: string;
  description?: string;
  userId: string;      
  categorie: string;   
}

export interface Budget {
  id: string;         
  montantMax: number;
  mois: number;
  annee: number;
  userId: string;      
  montantDepense?: number;
  montantRestant?: number;
  estDepasse?: boolean;
}

export interface MonthlyStats {
  totalDepense: number;
  budgetMax: number;
  pourcentageUtilise: number;
  isExceeded: boolean;
  parCategorie: CategoryStat[];
}

export interface CategoryStat {
  category: Category;
  total: number;
  pourcentage: number;
  count: number;
}


export type CreateExpenseDTO = {
  montant:     number;
  categorie:   string;   
  description: string;
  userId:      string;
  mois?:       number;
  annee?:      number;
};

export type CreateBudgetDTO = {
  montantMax: number;
  mois:       number;
  annee:      number;
  userId:     string;
};