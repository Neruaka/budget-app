// src/App.tsx

import { useState } from 'react';
import { Dashboard } from './presentation/pages/Dashboard';
import './styles.css';

// Simulation d'auth simple (en attendant le backend Docker demain)
function App() {
  const [isLoggedIn] = useState(true); // mettre false pour voir la page login

  if (!isLoggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>💰 BudgetApp</h1>
          <p className="text-muted">Ta gestion de budget étudiant</p>
          <p className="auth-wip">🚧 Auth en cours d'intégration avec le backend</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default App;
