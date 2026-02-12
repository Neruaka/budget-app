// src/presentation/pages/Dashboard.tsx

import { useState } from 'react';
import { useExpenses } from '../../application/useExpenses';
import { useBudgetStats } from '../../application/useBudgetStats';
import { BudgetProgress } from '../components/BudgetProgress';
import { ExpenseList } from '../components/ExpenseList';
import { ExpenseForm } from '../components/ExpenseForm';
import { StatsChart } from '../components/StatsChart';

// Données mock pour le dev sans backend 
const MOCK_USER_ID = 1;
const MOCK_CATEGORIES = [
  { id: 1, nom: 'Alimentation', couleur: '#10b981', icon: '🛒', isDefault: true },
  { id: 2, nom: 'Transport', couleur: '#3b82f6', icon: '🚇', isDefault: true },
  { id: 3, nom: 'Logement', couleur: '#8b5cf6', icon: '🏠', isDefault: true },
  { id: 4, nom: 'Loisirs', couleur: '#f59e0b', icon: '🎮', isDefault: true },
  { id: 5, nom: 'Santé', couleur: '#ef4444', icon: '💊', isDefault: true },
  { id: 6, nom: 'Vêtements', couleur: '#ec4899', icon: '👕', isDefault: true },
];

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function Dashboard() {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const { expenses, loading, addExpense, deleteExpense } = useExpenses(mois, annee);
  const { stats, setBudgetMax } = useBudgetStats(expenses, mois, annee);

  const handleSetBudget = async () => {
    const montant = parseFloat(budgetInput);
    if (!montant || montant <= 0) return;
    await setBudgetMax(montant);
    setShowBudgetModal(false);
    setBudgetInput('');
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">💰 BudgetApp</h1>
          <p className="app-subtitle">Gestion de dépenses</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Ajouter
        </button>
      </header>

      {/* Sélecteur de mois */}
      <div className="month-selector">
        <button
          className="btn-icon"
          onClick={() => {
            if (mois === 1) { setMois(12); setAnnee(a => a - 1); }
            else setMois(m => m - 1);
          }}
        >◀</button>
        <span className="month-label">{MONTHS[mois - 1]} {annee}</span>
        <button
          className="btn-icon"
          onClick={() => {
            if (mois === 12) { setMois(1); setAnnee(a => a + 1); }
            else setMois(m => m + 1);
          }}
        >▶</button>
      </div>

      {/* Contenu principal */}
      <main className="dashboard-grid">
        {stats && (
          <BudgetProgress
            stats={stats}
            onSetBudget={() => setShowBudgetModal(true)}
          />
        )}

        <ExpenseList
          expenses={expenses}
          loading={loading}
          onDelete={deleteExpense}
        />

        {stats && stats.parCategorie.length > 0 && (
          <StatsChart stats={stats} />
        )}
      </main>

      {/* Modal ajout dépense */}
      {showForm && (
        <ExpenseForm
          categories={MOCK_CATEGORIES}
          userId={MOCK_USER_ID}
          onSubmit={addExpense}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Modal budget */}
      {showBudgetModal && (
        <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Définir le budget du mois</h2>
              <button className="btn-close" onClick={() => setShowBudgetModal(false)}>✕</button>
            </div>
            <div className="form">
              <div className="form-group">
                <label>Budget maximum (€)</label>
                <input
                  type="number"
                  placeholder="Ex: 800"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowBudgetModal(false)}>
                  Annuler
                </button>
                <button className="btn-primary" onClick={handleSetBudget}>
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
