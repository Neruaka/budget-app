// src/contexts/expenses/application/AddExpenseUseCase.ts

import { Expense }            from '../domain/Expense.js';
import { IExpenseRepository } from '../domain/IExpenseRepository.js';
import { IBudgetRepository }  from '../../budget/domain/IBudgetRepository.js';

interface AddExpenseCommand {
  montant:      number;
  categorie:    string;
  userId:       string;
  description?: string;
  mois?:        number;
  annee?:       number;
}

interface AddExpenseResult {
  success:       boolean;
  expense?:      { id: string; montant: number; categorie: string; userId: string; date: Date };
  error?:        string;
  budgetDepasse: boolean;
  montantRestant?: number;
}

export class AddExpenseUseCase {

  constructor(
    // Injection de dépendances via les interfaces
    // En tests : InMemoryExpenseRepository
    // En prod   : MongoExpenseRepository
    private readonly expenseRepo: IExpenseRepository,
    private readonly budgetRepo:  IBudgetRepository,
  ) {}

  async execute(command: AddExpenseCommand): Promise<AddExpenseResult> {
    // ── Étape 1 : créer l'agrégat (validation incluse) ────────
    let expense: Expense;
    try {
      expense = Expense.create({
        montant:     command.montant,
        categorie:   command.categorie,
        userId:      command.userId,
        description: command.description,
      });
    } catch (err) {
      // Si la validation du domaine échoue, on retourne une erreur propre
      return {
        success:       false,
        error:         err instanceof Error ? err.message : 'Erreur inconnue',
        budgetDepasse: false,
      };
    }

    // ── Étape 2 : persister la dépense ────────────────────────
    await this.expenseRepo.save(expense);

    // ── Étape 3 : mettre à jour le budget (si défini) ─────────
    const maintenant = new Date();
    const mois  = command.mois  ?? maintenant.getMonth() + 1;
    const annee = command.annee ?? maintenant.getFullYear();

    const budget = await this.budgetRepo.findByUserAndPeriod(command.userId, mois, annee);

    let budgetDepasse  = false;
    let montantRestant: number | undefined;

    if (budget) {
      budget.enregistrerDepense(command.montant);
      await this.budgetRepo.save(budget);

      budgetDepasse  = budget.estDepasse;
      montantRestant = budget.montantRestant;

      // Les événements domaine (BudgetDepasse) sont disponibles ici
      // pour être dispatchés vers d'autres systèmes (emails, notifs...)
      const events = budget.pullEvents();
      if (events.length > 0) {
        console.log('Événements domaine :', events.map(e => e.type));
      }
    }

    // ── Étape 4 : retourner le résultat ───────────────────────
    return {
      success: true,
      expense: expense.toPlainObject(),
      budgetDepasse,
      montantRestant,
    };
  }
}
