// src/presentation/components/ExpenseForm.tsx

import { useState } from 'react';
import { Category, CreateExpenseDTO } from '../../domain/types';
import { validerDepense } from '../../domain/calculators';

interface Props {
  categories: Category[];
  onSubmit: (data: CreateExpenseDTO) => Promise<void>;
  onClose: () => void;
}

export function ExpenseForm({ categories, onSubmit, onClose }: Props) {
  const [montant, setMontant] = useState('');
  const [categorie, setCategorie] = useState('');  // ← string
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation via la COUCHE DOMAINE — pas de logique ici
    const validationError = validerDepense(parseFloat(montant), categorie);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        montant: parseFloat(montant),
        categorie,
        description,
        userId: 'user-test',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nouvelle dépense</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Montant (€)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Catégorie</label>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              className="form-input"
              required
            >
              <option value="">Sélectionner...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.nom}>
                  {cat.icon} {cat.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Description (optionnel)</label>
            <input
              type="text"
              placeholder="Ex: Courses Monoprix"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
            />
          </div>

          {error && <p className="form-error">⚠️ {error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
