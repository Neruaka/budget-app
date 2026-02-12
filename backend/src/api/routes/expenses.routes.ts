// src/api/routes/expenses.routes.ts 
import { Router, Request, Response } from 'express';
import { AddExpenseUseCase }         from '../../contexts/expenses/application/AddExpenseUseCase.js';
import { IExpenseRepository }        from '../../contexts/expenses/domain/IExpenseRepository.js';
import { IBudgetRepository }         from '../../contexts/budget/domain/IBudgetRepository.js';

export function createExpensesRouter(
  expenseRepo: IExpenseRepository,
  budgetRepo:  IBudgetRepository,
): Router {
  const router     = Router();
  const addUseCase = new AddExpenseUseCase(expenseRepo, budgetRepo);

  // POST /expenses — créer une dépense
  router.post('/', async (req: Request, res: Response) => {
    const { montant, description, categorie, userId, mois, annee } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId est requis' });

    const result = await addUseCase.execute({
      montant:     Number(montant),
      description: description ?? '',
      categorie:   categorie ?? '',
      userId:      String(userId),
      mois:        mois ? Number(mois) : undefined,
      annee:       annee ? Number(annee) : undefined,
    });

    if (!result.success) return res.status(400).json({ error: result.error });

    return res.status(201).json({
      expense:        result.expense,
      budgetDepasse:  result.budgetDepasse,
      montantRestant: result.montantRestant,
      ...(result.budgetDepasse && {
        warning: `⚠️ Budget dépassé ! Il vous manque ${Math.abs(result.montantRestant ?? 0)}€`
      }),
    });
  });

  // GET /expenses/:userId — toutes les dépenses d'un user
  router.get('/:userId', async (req: Request, res: Response) => {
    const expenses = await expenseRepo.findByUserId(req.params.userId);
    return res.json(expenses.map(e => e.toPlainObject()));
  });

  // GET /expenses/:userId/period/:annee/:mois — dépenses sur une période
  router.get('/:userId/period/:annee/:mois', async (req: Request, res: Response) => {
    const { userId, annee, mois } = req.params;
    const expenses = await expenseRepo.findByUserAndPeriod(userId, Number(mois), Number(annee));
    return res.json(expenses.map(e => e.toPlainObject()));
  });

  // PUT /expenses/:userId/:id — modifier une dépense
  router.put('/:userId/:id', async (req: Request, res: Response) => {
    const { id, userId } = req.params;
    const { montant, description, categorie } = req.body;

    const expense = await expenseRepo.findById(id);
    if (!expense || expense.userId !== userId) {
      return res.status(404).json({ error: 'Dépense non trouvée' });
    }

    try {
      const updated = expense.update({
        montant:     montant !== undefined ? Number(montant) : undefined,
        description: description !== undefined ? String(description) : undefined,
        categorie:   categorie !== undefined ? String(categorie) : undefined,
      });
      await expenseRepo.update(updated);
      return res.json(updated.toPlainObject());
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur' });
    }
  });

  // DELETE /expenses/:userId/:id — supprimer une dépense
  router.delete('/:userId/:id', async (req: Request, res: Response) => {
    const { id, userId } = req.params;

    const expense = await expenseRepo.findById(id);
    if (!expense || expense.userId !== userId) {
      return res.status(404).json({ error: 'Dépense non trouvée' });
    }

    await expenseRepo.delete(id);
    return res.status(204).send();
  });

  return router;
}