// src/presentation/components/StatsChart.tsx

import { MonthlyStats } from '../../domain/types';
import { formaterMontant } from '../../domain/calculators';

interface Props {
  stats: MonthlyStats;
}

export function StatsChart({ stats }: Props) {
  const { parCategorie, totalDepense } = stats;

  if (parCategorie.length === 0) {
    return (
      <div className="card empty-state">
        <p className="text-muted">Aucune stat disponible ce mois-ci</p>
      </div>
    );
  }

  // Génération du conic-gradient pour le donut chart
  let cumulativePct = 0;
  const segments = parCategorie.map((stat) => {
    const start = cumulativePct;
    cumulativePct += stat.pourcentage;
    return { ...stat, start, end: cumulativePct };
  });

  const gradientParts = segments.map(
    (s) => `${s.category.couleur} ${s.start.toFixed(1)}% ${s.end.toFixed(1)}%`
  );
  const gradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div className="card">
      <h2 className="section-title">Répartition par catégorie</h2>

      <div className="stats-layout">
        {/* Donut chart */}
        <div className="donut-container">
          <div className="donut" style={{ background: gradient }}>
            <div className="donut-hole">
              <span className="donut-total">{formaterMontant(totalDepense)}</span>
              <span className="donut-label">ce mois</span>
            </div>
          </div>
        </div>

        {/* Légende */}
        <ul className="stats-legend">
          {parCategorie.map((stat) => (
            <li key={stat.category.id} className="legend-item">
              <div
                className="legend-dot"
                style={{ background: stat.category.couleur }}
              />
              <div className="legend-info">
                <span className="legend-name">
                  {stat.category.icon} {stat.category.nom}
                </span>
                <span className="legend-count">{stat.count} dépense{stat.count > 1 ? 's' : ''}</span>
              </div>
              <div className="legend-right">
                <span className="legend-amount">{formaterMontant(stat.total)}</span>
                <span className="legend-pct">{stat.pourcentage.toFixed(0)}%</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
