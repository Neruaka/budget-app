//s src/api/routes/budget.routes.ts

import { Router, Request, Response } from 'express';
import { Budget }             from '../../contexts/budget/domain/Budget.js';
import { IBudgetRepository }  from '../../contexts/budget/domain/IBudgetRepository.js';

export function createBudgetRouter(budgetRepo: IBudgetRepository): Router {
  const router = Router();

  // POST /budget — définir un budget mensuel
  router.post('/', async (req: Request, res: Response) => {
    const { userId, montantMax, mois, annee } = req.body;

    try {
      // Vérifier si un budget existe déjà pour cette période
      const existant = await budgetRepo.findByUserAndPeriod(
        String(userId), Number(mois), Number(annee)
      );

      if (existant) {
        return res.status(409).json({
          error: `Un budget existe déjà pour ${mois}/${annee}`,
          budget: existant.toPlainObject(),
        });
      }

      const budget = Budget.create({
        userId:     String(userId),
        montantMax: Number(montantMax),
        mois:       Number(mois),
        annee:      Number(annee),
      });

      await budgetRepo.save(budget);

      return res.status(201).json(budget.toPlainObject());
    } catch (err) {
      return res.status(400).json({
        error: err instanceof Error ? err.message : 'Erreur',
      });
    }
  });

  // GET /budget/:userId/:annee/:mois — récupérer le budget d'une période
  router.get('/:userId/:annee/:mois', async (req: Request, res: Response) => {
    const { userId, annee, mois } = req.params;

    const budget = await budgetRepo.findByUserAndPeriod(
      userId, Number(mois), Number(annee)
    );

    if (!budget) {
      return res.status(404).json({ error: 'Aucun budget pour cette période' });
    }

    return res.json({
      ...budget.toPlainObject(),
      // Propriétés calculées exposées dans l'API
      montantRestant:     budget.montantRestant,
      estDepasse:         budget.estDepasse,
      pourcentageUtilise: budget.pourcentageUtilise,
    });
  });

  return router;
}
