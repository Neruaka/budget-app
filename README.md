# 💰 Budget App

Application de gestion de budget avec architecture n-tier et MongoDB Replica Set.

## 📋 Table des matières

- [Architecture](#architecture)
- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Tests](#tests)
- [Structure du projet](#structure-du-projet)

## 🏗️ Architecture

### Architecture N-Tier (DDD)

L'application suit les principes du Domain-Driven Design avec une séparation claire des responsabilités :

```
📦 Backend (Node.js/Express)
├── 🎯 Domain Layer        → Entités métier, règles business
├── 📱 Application Layer    → Use cases, orchestration
├── 🔌 Infrastructure Layer → Repositories, MongoDB
└── 🌐 API Layer           → Routes REST, controllers
```

### MongoDB Replica Set

Configuration haute disponibilité avec 3 nœuds :
- **mongo1** (PRIMARY) → Lecture + Écriture
- **mongo2** (SECONDARY) → Réplication asynchrone
- **mongo3** (SECONDARY) → Réplication asynchrone

**Avantages** :
- ✅ Failover automatique (~10s)
- ✅ Read preference configurable
- ✅ Cohérence des données via oplog

## 🚀 Technologies

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool rapide
- **CSS Modules** - Styling

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **MongoDB** avec Mongoose
- **Vitest** - Tests unitaires et d'acceptation

### Infrastructure
- **Docker** + **Docker Compose**
- **MongoDB Replica Set** (3 nœuds)

## 📋 Prérequis

- **Node.js** ≥ 18.x
- **Docker** + **Docker Compose**
- **Git**

## 📦 Installation

### 1. Cloner le repository

```powershell
git clone https://github.com/Neruaka/budget-app.git
cd budget-app
```

### 2. Installer les dépendances

```powershell
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 3. Lancer l'infrastructure MongoDB

```powershell
docker-compose up -d
```

Attendre ~30 secondes que le replica set soit initialisé.

### 4. Vérifier le replica set

```powershell
docker exec -it mongo-primary mongosh --eval "rs.status()"
```

## 🎮 Utilisation

### Mode développement

**Terminal 1 - Backend** :
```powershell
cd backend
npm run dev
```
→ API disponible sur `http://localhost:3000`

**Terminal 2 - Frontend** :
```powershell
npm run dev
```
→ Application disponible sur `http://localhost:5173`

### Mode production

```powershell
# Build
npm run build
cd backend
npm run build
cd ..

# Démarrage
docker-compose up -d
```

## 🧪 Tests

### Backend

```powershell
cd backend

# Tests unitaires + acceptance
npm test

# Mode watch
npm run test:watch

# Couverture de code
npm run test:coverage
```

### Types de tests

- **Unit tests** → Tests du domain (Budget, Expense)
- **Acceptance tests** → Tests des use cases
- **Contract tests** → Tests de réplication MongoDB

## 📁 Structure du projet

```
budget-app/
├── src/                          # Frontend React
│   ├── application/              # Hooks métier
│   ├── domain/                   # Types et calculateurs
│   ├── infrastructure/           # API client
│   └── presentation/             # Components UI
│       ├── components/
│       └── pages/
│
├── backend/
│   ├── src/
│   │   ├── api/                  # Server Express + routes
│   │   ├── contexts/             # Bounded contexts (DDD)
│   │   │   ├── budget/
│   │   │   │   ├── domain/       # Entités + interfaces
│   │   │   │   └── infrastructure/ # Repositories
│   │   │   └── expenses/
│   │   │       ├── application/  # Use cases
│   │   │       ├── domain/
│   │   │       └── infrastructure/
│   │   └── shared/               # Domain events
│   └── tests/
│       ├── unit/                 # Tests domaine
│       ├── acceptance/           # Tests use cases
│       └── contract/             # Tests infra
│
├── infra/
│   └── mongo/                    # Scripts MongoDB
│       ├── init-replica.sh       # Init replica set
│       ├── validate.sh           # Validation
│       └── COMMANDS.md           # Documentation
│
├── docker-compose.yml            # Orchestration complète
├── Dockerfile.frontend
└── backend/Dockerfile
```

## 🎯 Fonctionnalités

- ✅ Ajout de dépenses
- ✅ Suivi du budget en temps réel
- ✅ Visualisation graphique des stats
- ✅ Calcul automatique du budget restant
- ✅ Gestion des catégories de dépenses
- ✅ Haute disponibilité (replica set)

## 📚 Documentation complémentaire

- [Commandes MongoDB](./infra/mongo/COMMANDS.md)
- [Tests backend](./backend/tests/)

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine du backend :

```env
MONGODB_URI=mongodb://mongo1:27017,mongo2:27018,mongo3:27019/budget?replicaSet=rs0
PORT=3000
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changes (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est un projet éducatif dans le cadre d'un cours d'architecture n-tier.

## 👨‍💻 Auteur

**Neruaka** - [GitHub](https://github.com/Neruaka)

---

⭐ N'hésitez pas à mettre une étoile si ce projet vous a été utile !
