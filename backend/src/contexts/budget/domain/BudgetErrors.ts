// ssrc/contexts/budget/domain/BudgetErrors.ts

export const BudgetErrors = {
  MONTANT_MAX_INVALIDE: 'Le montant maximum doit être supérieur à 0',
  MOIS_INVALIDE:        'Le mois doit être compris entre 1 et 12',
  ANNEE_INVALIDE:       'L\'année doit être supérieure à 2000',
  USER_ID_VIDE:         'L\'identifiant utilisateur est obligatoire',
} as const;

export type BudgetError = typeof BudgetErrors[keyof typeof BudgetErrors];
