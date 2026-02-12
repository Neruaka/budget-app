// tests/acceptance/addExpense.usecase.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { AddExpenseUseCase }           from '../../src/contexts/expenses/application/AddExpenseUseCase.js';
import { InMemoryExpenseRepository }   from '../../src/contexts/expenses/infrastructure/InMemoryExpenseRepository.js';
import { InMemoryBudgetRepository }    from '../../src/contexts/budget/infrastructure/InMemoryBudgetRepository.js';
import { Budget }                      from '../../src/contexts/budget/domain/Budget.js';

describe('AddExpenseUseCase', () => {

  let expenseRepo: InMemoryExpenseRepository;
  let budgetRepo:  InMemoryBudgetRepository;
  let useCase:     AddExpenseUseCase;

  // Given — état initial avant chaque test
  beforeEach(() => {
    expenseRepo = new InMemoryExpenseRepository();
    budgetRepo  = new InMemoryBudgetRepository();
    useCase     = new AddExpenseUseCase(expenseRepo, budgetRepo);
  });

  it('crée et persiste une dépense valide', async () => {
    // When
    const result = await useCase.execute({
      montant:     45.50,
      description: 'Courses',
      categorie:   'alimentation',
      userId:      'user-1',
    });

    // Then
    expect(result.success).toBe(true);
    expect(result.expense).toBeDefined();
    expect(result.expense!.montant).toBe(45.50);

    // Vérifie que c'est bien dans le repo
    const persisted = await expenseRepo.findById(result.expense!.id);
    expect(persisted).not.toBeNull();
  });

  it('retourne une erreur si le montant est invalide', async () => {
    // When
    const result = await useCase.execute({
      montant:   -50,
      categorie: 'test',
      userId:    'user-1',
    });

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain('négatif');
  });

  it('met à jour le budget quand une dépense est ajoutée', async () => {
    // Given — un budget de 1000€ pour janvier 2026
    const budget = Budget.create({ userId: 'user-1', montantMax: 1000, mois: 1, annee: 2026 });
    await budgetRepo.save(budget);

    // When
    await useCase.execute({
      montant:   300,
      categorie: 'alimentation',
      userId:    'user-1',
      mois:      1,
      annee:     2026,
    });

    // Then — le budget reflète la dépense
    const budgetMaj = await budgetRepo.findByUserAndPeriod('user-1', 1, 2026);
    expect(budgetMaj!.montantDepense).toBe(300);
    expect(budgetMaj!.montantRestant).toBe(700);
  });

  it('détecte le dépassement de budget', async () => {
    // Given — budget serré de 100€
    const budget = Budget.create({ userId: 'user-2', montantMax: 100, mois: 1, annee: 2026 });
    await budgetRepo.save(budget);

    // When
    const result = await useCase.execute({
      montant:   150,
      categorie: 'loisirs',
      userId:    'user-2',
      mois:      1,
      annee:     2026,
    });

    // Then — la dépense est quand même créée mais on est notifié
    expect(result.success).toBe(true);
    expect(result.budgetDepasse).toBe(true);
    expect(result.montantRestant).toBe(-50);
  });

  it('crée une dépense même sans budget défini', async () => {
    // When — pas de budget pour cet utilisateur
    const result = await useCase.execute({
      montant:   50,
      categorie: 'tech',
      userId:    'user-sans-budget',
    });

    // Then 
    expect(result.success).toBe(true);
    expect(result.budgetDepasse).toBe(false);
  });

});

describe('GetExpensesUseCase', () => {

  it('retourne les dépenses d\'un utilisateur', async () => {
    const repo    = new InMemoryExpenseRepository();
    const budget  = new InMemoryBudgetRepository();
    const addCase = new AddExpenseUseCase(repo, budget);

    // Given — 3 dépenses pour user-1, 1 pour user-2
    await addCase.execute({ montant: 10, categorie: 'a', userId: 'user-1' });
    await addCase.execute({ montant: 20, categorie: 'b', userId: 'user-1' });
    await addCase.execute({ montant: 30, categorie: 'c', userId: 'user-2' });

    // When
    const expenses = await repo.findByUserId('user-1');

    // Then — seulement les 2 dépenses de user-1
    expect(expenses).toHaveLength(2);
    expect(expenses.every(e => e.userId === 'user-1')).toBe(true);
  });

});
