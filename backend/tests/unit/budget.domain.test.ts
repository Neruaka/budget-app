// tests/unit/budget.domain.test.ts

import { describe, it, expect } from 'vitest';
import { Budget }       from '../../src/contexts/budget/domain/Budget.js';
import { BudgetErrors } from '../../src/contexts/budget/domain/BudgetErrors.js';

describe('Budget — création valide', () => {

  it('crée un budget mensuel valide', () => {
    const budget = Budget.create({
      userId:    'user-123',
      montantMax: 1500,
      mois:       1,
      annee:      2026,
    });

    expect(budget.userId).toBe('user-123');
    expect(budget.montantMax).toBe(1500);
    expect(budget.mois).toBe(1);
    expect(budget.annee).toBe(2026);
    expect(budget.montantDepense).toBe(0); 
  });

});

describe('Budget — invariants', () => {

  it('refuse un montantMax négatif', () => {
    expect(() =>
      Budget.create({ userId: 'u1', montantMax: -100, mois: 1, annee: 2026 })
    ).toThrow(BudgetErrors.MONTANT_MAX_INVALIDE);
  });

  it('refuse un mois invalide (0 ou > 12)', () => {
    expect(() =>
      Budget.create({ userId: 'u1', montantMax: 500, mois: 0, annee: 2026 })
    ).toThrow(BudgetErrors.MOIS_INVALIDE);

    expect(() =>
      Budget.create({ userId: 'u1', montantMax: 500, mois: 13, annee: 2026 })
    ).toThrow(BudgetErrors.MOIS_INVALIDE);
  });

  it('refuse une annee invalide (< 2000)', () => {
    expect(() =>
      Budget.create({ userId: 'u1', montantMax: 500, mois: 1, annee: 1999 })
    ).toThrow(BudgetErrors.ANNEE_INVALIDE);
  });

});

describe('Budget — logique métier', () => {

  it('calcule correctement le montant restant', () => {
    // Given s
    const budget = Budget.create({ userId: 'u1', montantMax: 1000, mois: 1, annee: 2026 });

    // When
    budget.enregistrerDepense(300);

    // Then
    expect(budget.montantDepense).toBe(300);
    expect(budget.montantRestant).toBe(700);
    expect(budget.estDepasse).toBe(false);
  });

  it('détecte le dépassement de budget', () => {
    // Given
    const budget = Budget.create({ userId: 'u1', montantMax: 500, mois: 1, annee: 2026 });

    // When
    budget.enregistrerDepense(600);

    // Then
    expect(budget.estDepasse).toBe(true);
    expect(budget.montantRestant).toBe(-100);
  });

  it('émet un événement BudgetDepasse quand on dépasse', () => {
    // Given
    const budget = Budget.create({ userId: 'u1', montantMax: 100, mois: 1, annee: 2026 });

    // When
    budget.enregistrerDepense(150);

    // Then
    const events = budget.pullEvents();
    expect(events.some(e => e.type === 'BudgetDepasse')).toBe(true);
  });

  it('n\'émet PAS BudgetDepasse si on ne dépasse pas', () => {
    const budget = Budget.create({ userId: 'u1', montantMax: 1000, mois: 1, annee: 2026 });
    budget.enregistrerDepense(50);

    const events = budget.pullEvents();
    expect(events.some(e => e.type === 'BudgetDepasse')).toBe(false);
  });

  it('accumule plusieurs dépenses', () => {
    const budget = Budget.create({ userId: 'u1', montantMax: 1000, mois: 1, annee: 2026 });
    budget.enregistrerDepense(200);
    budget.enregistrerDepense(150);
    budget.enregistrerDepense(300);

    expect(budget.montantDepense).toBe(650);
    expect(budget.montantRestant).toBe(350);
  });

  it('calcule le pourcentage d\'utilisation', () => {
    const budget = Budget.create({ userId: 'u1', montantMax: 1000, mois: 1, annee: 2026 });
    budget.enregistrerDepense(250);

    expect(budget.pourcentageUtilise).toBe(25);
  });

});
