// src/contexts/expenses/domain/ExpenseErrors.ts

export const ExpenseErrors = {
  MONTANT_NEGATIF:    'Le montant ne peut pas être négatif',
  MONTANT_ZERO:       'Le montant ne peut pas être nul',
  MONTANT_TROP_ELEVE: 'Le montant ne peut pas dépasser 100 000',
  CATEGORIE_VIDE:     'La catégorie est obligatoire',
  USER_ID_VIDE:       'L\'identifiant utilisateur est obligatoire',
} as const;

export type ExpenseError = typeof ExpenseErrors[keyof typeof ExpenseErrors];
