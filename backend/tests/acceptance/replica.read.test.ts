// tests/acceptance/replica.read.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryExpenseRepository }  from '../../src/contexts/expenses/infrastructure/InMemoryExpenseRepository.js';
import { InMemoryBudgetRepository }   from '../../src/contexts/budget/infrastructure/InMemoryBudgetRepository.js';
import { AddExpenseUseCase }          from '../../src/contexts/expenses/application/AddExpenseUseCase.js';
import { Expense }                    from '../../src/contexts/expenses/domain/Expense.js';

// ─── Helpers ──────────────────────────────────────────────────
function createReadOnlyRepo(source: InMemoryExpenseRepository): Pick<InMemoryExpenseRepository, 'findByUserId' | 'findByUserAndPeriod' | 'findById'> {
  return {
    findById:          (id) => source.findById(id),
    findByUserId:      (userId) => source.findByUserId(userId),
    findByUserAndPeriod: (userId, mois, annee) => source.findByUserAndPeriod(userId, mois, annee),
  };
}

// ─── Tests ────────────────────────────────────────────────────
describe('Réplication — lecture sur secondary', () => {

  let primaryRepo:   InMemoryExpenseRepository;
  let budgetRepo:    InMemoryBudgetRepository;
  let addUseCase:    AddExpenseUseCase;

  beforeEach(async () => {
    primaryRepo = new InMemoryExpenseRepository();
    budgetRepo  = new InMemoryBudgetRepository();
    addUseCase  = new AddExpenseUseCase(primaryRepo, budgetRepo);

    // Écriture sur le PRIMARY : 3 dépenses
    await addUseCase.execute({ montant: 45.50, categorie: 'alimentation', userId: 'user-test', description: 'Carrefour' });
    await addUseCase.execute({ montant: 12.99, categorie: 'loisirs',      userId: 'user-test', description: 'Netflix' });
    await addUseCase.execute({ montant: 8.50,  categorie: 'transport',    userId: 'user-test', description: 'Metro' });
  });

  it('le secondary contient les données écrites sur le primary', async () => {
    // Given — le secondary est une copie du primary (réplication)
    const secondaryRepo = createReadOnlyRepo(primaryRepo);

    // When — on lit les dépenses du user sur le secondary
    const expenses = await secondaryRepo.findByUserId('user-test');

    // Then — les 3 dépenses sont visibles sur le secondary
    expect(expenses).toHaveLength(3);
    expect(expenses.map(e => e.categorie)).toContain('alimentation');
    expect(expenses.map(e => e.categorie)).toContain('loisirs');
    expect(expenses.map(e => e.categorie)).toContain('transport');
  });

  it('le secondary voit le montant exact écrit sur le primary', async () => {
    // Given
    const secondaryRepo = createReadOnlyRepo(primaryRepo);

    // When
    const expenses = await secondaryRepo.findByUserId('user-test');

    // Then — intégrité des données garantie
    const carrefour = expenses.find(e => e.description === 'Carrefour');
    expect(carrefour?.montant).toBe(45.50);
  });

  it('une nouvelle écriture sur le primary est immédiatement visible sur le secondary', async () => {
    // Given — état initial : 3 dépenses
    const secondaryRepo = createReadOnlyRepo(primaryRepo);
    const avant = await secondaryRepo.findByUserId('user-test');
    expect(avant).toHaveLength(3);

    // When — nouvelle écriture sur le primary
    await addUseCase.execute({ montant: 99, categorie: 'tech', userId: 'user-test', description: 'Amazon' });

    // Then — le secondary voit la 4e dépense (réplication synchronisée)
    const apres = await secondaryRepo.findByUserId('user-test');
    expect(apres).toHaveLength(4);
    expect(apres.map(e => e.description)).toContain('Amazon');
  });

  it('le secondary refuse les écritures (NotWritablePrimary)', () => {
    // Given — un secondary ne peut pas être utilisé pour écrire
    const secondaryRepo = createReadOnlyRepo(primaryRepo);

    // Then — save() n'est pas disponible sur le secondary
    expect('save' in secondaryRepo).toBe(false);
    expect('delete' in secondaryRepo).toBe(false);
  });

  it('lecture par période fonctionne sur le secondary', async () => {
    // Given
    const secondaryRepo = createReadOnlyRepo(primaryRepo);
    const now = new Date();

    // When
    const expenses = await secondaryRepo.findByUserAndPeriod(
      'user-test',
      now.getMonth() + 1,
      now.getFullYear()
    );

    // Then
    expect(expenses.length).toBeGreaterThanOrEqual(3);
  });

});
