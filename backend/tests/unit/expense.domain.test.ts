// tests/unit/expense.domain.test.ts

import { describe, it, expect } from 'vitest';
import { Expense }       from '../../src/contexts/expenses/domain/Expense.js';
import { ExpenseErrors } from '../../src/contexts/expenses/domain/ExpenseErrors.js';

// ─── Création d'une dépense valide ────────────────────────────
describe('Expense — création valide', () => {

  it('crée une dépense avec tous les champs valides', () => {
    // Given / When
    const expense = Expense.create({
      montant:     45.50,
      description: 'Courses Carrefour',
      categorie:   'alimentation',
      userId:      'user-123',
    });

    // Then
    expect(expense.montant).toBe(45.50);
    expect(expense.description).toBe('Courses Carrefour');
    expect(expense.categorie).toBe('alimentation');
    expect(expense.userId).toBe('user-123');
    expect(expense.id).toBeDefined();           // un ID est auto-généré
    expect(expense.date).toBeInstanceOf(Date);  // date auto à now
  });

  it('génère un ID unique pour chaque dépense', () => {
    // Given / When
    const e1 = Expense.create({ montant: 10, categorie: 'test', userId: 'u1' });
    const e2 = Expense.create({ montant: 20, categorie: 'test', userId: 'u1' });

    // Then
    expect(e1.id).not.toBe(e2.id);
  });

  it('accepte un montant avec décimales', () => {
    const expense = Expense.create({ montant: 12.99, categorie: 'loisirs', userId: 'u1' });
    expect(expense.montant).toBe(12.99);
  });

});

// ─── Invariants du domaine (règles métier) ────────────────────

describe('Expense — invariants du domaine', () => {

  it('refuse un montant négatif', () => {
    // Given / When / Then
    expect(() =>
      Expense.create({ montant: -10, categorie: 'test', userId: 'u1' })
    ).toThrow(ExpenseErrors.MONTANT_NEGATIF);
  });

  it('refuse un montant égal à zéro', () => {
    expect(() =>
      Expense.create({ montant: 0, categorie: 'test', userId: 'u1' })
    ).toThrow(ExpenseErrors.MONTANT_ZERO);
  });

  it('refuse une catégorie vide', () => {
    expect(() =>
      Expense.create({ montant: 10, categorie: '', userId: 'u1' })
    ).toThrow(ExpenseErrors.CATEGORIE_VIDE);
  });

  it('refuse un userId vide', () => {
    expect(() =>
      Expense.create({ montant: 10, categorie: 'test', userId: '' })
    ).toThrow(ExpenseErrors.USER_ID_VIDE);
  });

  it('refuse un montant trop élevé (> 100 000)', () => {
    expect(() =>
      Expense.create({ montant: 999999, categorie: 'test', userId: 'u1' })
    ).toThrow(ExpenseErrors.MONTANT_TROP_ELEVE);
  });

});

// ─── Comportement de l'agrégat ────────────────────────────────
describe('Expense — comportements', () => {

  it('peut être converti en objet plain (toPlainObject)', () => {
    // Given
    const expense = Expense.create({
      montant:   25,
      categorie: 'transport',
      userId:    'user-abc',
    });

    // When
    const plain = expense.toPlainObject();

    // Then — toutes les propriétés sont présentes
    expect(plain).toMatchObject({
      id:          expect.any(String),
      montant:     25,
      categorie:   'transport',
      userId:      'user-abc',
      description: '',           // description vide par défaut
      date:        expect.any(Date),
    });
  });

  it('émet un événement domaine ExpenseCreated après création', () => {
    // Given / When
    const expense = Expense.create({ montant: 50, categorie: 'tech', userId: 'u1' });

    // Then
    const events = expense.pullEvents(); // récupère et vide la liste
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('ExpenseCreated');
    expect(events[0].payload.montant).toBe(50);
  });

  it('pullEvents vide la liste après l\'avoir lue', () => {
    // Given
    const expense = Expense.create({ montant: 50, categorie: 'tech', userId: 'u1' });

    // When
    expense.pullEvents(); // premier appel — vide la liste
    const events2 = expense.pullEvents(); // deuxième appel

    // Then
    expect(events2).toHaveLength(0);
  });

});

// ─── Reconstitution depuis la BDD ─────────────────────────────
describe('Expense — reconstitution (fromPersistence)', () => {

  it('reconstitue une dépense depuis des données persistées', () => {
    // Given — données telles qu'elles viennent de MongoDB
    const data = {
      id:          'expense-456',
      montant:     99.99,
      description: 'Amazon prime',
      categorie:   'abonnement',
      userId:      'user-789',
      date:        new Date('2026-01-15'),
    };

    // When
    const expense = Expense.fromPersistence(data);

    // Then — PAS d'événement domaine (c'est une reconstitution, pas une création)
    expect(expense.id).toBe('expense-456');
    expect(expense.montant).toBe(99.99);
    expect(expense.pullEvents()).toHaveLength(0);
  });

});
