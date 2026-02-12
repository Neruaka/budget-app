// src/presentation/components/ExpenseList.tsx

import { Expense } from '../../domain/types';
import { formaterMontant, formaterDate } from '../../domain/calculators';

interface Props {
  expenses: Expense[];
  loading: boolean;
  onDelete: (id: number) => void;
}

export function ExpenseList({ expenses, loading, onDelete }: Props) {
  if (loading) {
    return (
      <div className="card">
        <div className="skeleton-list">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-item" />)}
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="card empty-state">
        <p>💸</p>
        <p>Aucune dépense ce mois-ci</p>
        <p className="text-muted">Clique sur "Ajouter" pour commencer à tracker</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title">Dépenses du mois</h2>
      <ul className="expense-list">
        {expenses.map((expense) => (
          <li key={expense.id} className="expense-item">
            <div className="expense-icon" style={{ background: expense.category?.couleur + '22' }}>
              {expense.category?.icon ?? '💰'}
            </div>
            <div className="expense-info">
              <p className="expense-name">
                {expense.description || expense.category?.nom || 'Dépense'}
              </p>
              <p className="expense-meta">
                {expense.category?.nom} · {formaterDate(expense.date)}
              </p>
            </div>
            <div className="expense-right">
              <span className="expense-amount">{formaterMontant(expense.montant)}</span>
              <button
                className="btn-delete"
                onClick={() => onDelete(expense.id)}
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
