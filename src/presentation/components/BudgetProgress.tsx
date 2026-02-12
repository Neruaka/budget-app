// src/presentation/components/BudgetProgress.tsx

import { MonthlyStats } from '../../domain/types';
import { formaterMontant } from '../../domain/calculators';

interface Props {
  stats: MonthlyStats;
  onSetBudget: () => void;
}

export function BudgetProgress({ stats, onSetBudget }: Props) {
  const { totalDepense, budgetMax, pourcentageUtilise, isExceeded } = stats;

  const barColor = isExceeded
    ? '#ef4444'
    : pourcentageUtilise > 80
    ? '#f59e0b'
    : '#10b981';

  return (
    <div className="budget-card">
      <div className="budget-header">
        <div>
          <h2 className="section-title">Budget du mois</h2>
          {budgetMax > 0 ? (
            <p className="budget-amounts">
              <span className={isExceeded ? 'text-danger' : 'text-primary'}>
                {formaterMontant(totalDepense)}
              </span>
              <span className="text-muted"> / {formaterMontant(budgetMax)}</span>
            </p>
          ) : (
            <p className="text-muted">Aucun budget défini</p>
          )}
        </div>
        <button className="btn-secondary" onClick={onSetBudget}>
          {budgetMax > 0 ? '✏️ Modifier' : '+ Définir un budget'}
        </button>
      </div>

      {budgetMax > 0 && (
        <>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${Math.min(pourcentageUtilise, 100)}%`, background: barColor }}
            />
          </div>
          <div className="budget-footer">
            <span style={{ color: barColor }}>{pourcentageUtilise.toFixed(1)}% utilisé</span>
            {isExceeded ? (
              <span className="alert-badge">
                ⚠️ Dépassement de {formaterMontant(totalDepense - budgetMax)}
              </span>
            ) : (
              <span className="text-muted">
                Reste : {formaterMontant(budgetMax - totalDepense)}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
