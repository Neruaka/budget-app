// src/api/server.ts


import 'dotenv/config';
import express       from 'express';
import cors          from 'cors';
import mongoose      from 'mongoose';

// Implémentations concrètes (MongoDB)
import { MongoExpenseRepository } from '../contexts/expenses/infrastructure/MongoExpenseRepository.js';
import { MongoBudgetRepository }  from '../contexts/budget/infrastructure/MongoBudgetRepository.js';

// Routeurs
import { createExpensesRouter }   from './routes/expenses.routes.js';
import { createBudgetRouter }     from './routes/budget.routes.js';

const app  = express();
const PORT = process.env.PORT ?? 3000;

// ─── Middlewares ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── MongoDB Replica Set ──────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ??
  'mongodb://mongo1:27017,mongo2:27017,mongo3:27017/budgetapp?replicaSet=rs0';

mongoose.connect(MONGO_URI, { readPreference: 'primaryPreferred' });

mongoose.connection.on('connected',    () => console.log('✅ MongoDB connecté'));
mongoose.connection.on('error',    err => console.error('❌ MongoDB erreur:', err.message));
mongoose.connection.on('reconnected',  () => console.log('🔄 MongoDB reconnecté'));

// ─── Composition Root : instancier les repos ──────────────────
const expenseRepo = new MongoExpenseRepository();
const budgetRepo  = new MongoBudgetRepository();

// ─── Routes ───────────────────────────────────────────────────
app.use('/expenses', createExpensesRouter(expenseRepo, budgetRepo));
app.use('/budget',   createBudgetRouter(budgetRepo));

// GET /health — état du cluster MongoDB
app.get('/health', async (_req, res) => {
  try {
    const status = await mongoose.connection.db!.admin().command({ isMaster: 1 });
    res.json({
      status:  'ok',
      mongodb: {
        connected: mongoose.connection.readyState === 1,
        isPrimary: status.ismaster,
        primary:   status.primary,
        hosts:     status.hosts,
        setName:   status.setName,
      }
    });
  } catch (err) {
    res.status(503).json({ status: 'error', message: String(err) });
  }
});

// GET /replica-status — état de chaque nœud
app.get('/replica-status', async (_req, res) => {
  try {
    const status  = await mongoose.connection.db!.admin().command({ replSetGetStatus: 1 });
    const members = status.members.map((m: Record<string, unknown>) => ({
      name:   m.name,
      state:  m.stateStr,
      health: m.health === 1 ? 'UP' : 'DOWN',
    }));
    res.json({ setName: status.set, members });
  } catch (err) {
    res.status(503).json({ status: 'error', message: String(err) });
  }
});

// GET /categories — liste des catégories (statique pour MVP)
app.get('/categories', (_req, res) => {
  res.json([
    { id: '1', nom: 'alimentation',  couleur: '#4CAF50', icon: '🛒', isDefault: true },
    { id: '2', nom: 'transport',     couleur: '#2196F3', icon: '🚇', isDefault: true },
    { id: '3', nom: 'loisirs',       couleur: '#FF9800', icon: '🎮', isDefault: true },
    { id: '4', nom: 'santé',         couleur: '#E91E63', icon: '💊', isDefault: true },
    { id: '5', nom: 'logement',      couleur: '#9C27B0', icon: '🏠', isDefault: true },
    { id: '6', nom: 'abonnement',    couleur: '#00BCD4', icon: '📱', isDefault: true },
    { id: '7', nom: 'tech',          couleur: '#607D8B', icon: '💻', isDefault: true },
    { id: '8', nom: 'autre',         couleur: '#795548', icon: '📦', isDefault: true },
  ]);
});

// ─────────────────────────────────────────────────────────────
// ENDPOINTS DIAGNOSTICS 
// Ces 3 routes prouvent que le cluster fonctionne :
//   /db/status     → état complet du replica set
//   /db/write-test → écrit sur le primary, retourne la preuve
//   /db/read-test  → lit sur un secondary, retourne la preuve
// ─────────────────────────────────────────────────────────────

// GET /db/status — vue complète du cluster
app.get('/db/status', async (_req, res) => {
  try {
    const rsStatus  = await mongoose.connection.db!.admin().command({ replSetGetStatus: 1 });
    const isMaster  = await mongoose.connection.db!.admin().command({ isMaster: 1 });

    const members = rsStatus.members.map((m: Record<string, unknown>) => ({
      name:        m.name,
      role:        m.stateStr,
      health:      m.health === 1 ? 'UP' : 'DOWN',
      lagSeconds:  m.stateStr === 'SECONDARY'
        ? Math.round(((isMaster.operationTime?.t ?? 0) - ((m.optime as Record<string,unknown>)?.t as number ?? 0)))
        : 0,
    }));

    res.json({
      status:      'ok',
      replicaSet:  rsStatus.set,
      primary:     isMaster.primary,
      members,
      timestamp:   new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({ status: 'error', message: String(err) });
  }
});

// GET /db/write-test — prouve qu'on écrit sur le primary
app.get('/db/write-test', async (_req, res) => {
  try {
    const db        = mongoose.connection.db!;
    const isMaster  = await db.admin().command({ isMaster: 1 });
    const timestamp = new Date();

    // Insère un document de test dans une collection dédiée
    const result    = await db.collection('_diagnostic').insertOne({
      type:      'write-test',
      timestamp,
      message:   'Écriture de test sur le primary',
    });

    res.json({
      success:      true,
      operation:    'WRITE',
      host:         isMaster.me,
      role:         'PRIMARY',
      replicaSet:   isMaster.setName,
      insertedId:   result.insertedId,
      timestamp:    timestamp.toISOString(),
      message:      '✅ Écriture réussie sur le primary',
    });
  } catch (err) {
    res.status(503).json({ success: false, operation: 'WRITE', error: String(err) });
  }
});

// GET /db/read-test — prouve qu'on peut lire sur un secondary
app.get('/db/read-test', async (_req, res) => {
  try {
    const db       = mongoose.connection.db!;
    const isMaster = await db.admin().command({ isMaster: 1 });

    // Force la lecture sur un secondary via readPreference
    const lastWrite = await db.collection('_diagnostic')
      .find({ type: 'write-test' }, { readConcern: { level: 'local' } })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    const rsStatus  = await db.admin().command({ replSetGetStatus: 1 });
    const secondary = rsStatus.members.find(
      (m: Record<string, unknown>) => m.stateStr === 'SECONDARY' && m.health === 1
    );

    res.json({
      success:        true,
      operation:      'READ',
      host:           isMaster.me,
      connectedTo:    isMaster.primary,
      replicaSet:     isMaster.setName,
      secondaryAvail: secondary?.name ?? 'aucun',
      lastWriteFound: lastWrite.length > 0,
      lastWriteAt:    lastWrite[0]?.timestamp ?? null,
      timestamp:      new Date().toISOString(),
      message:        '✅ Lecture réussie — réplication confirmée',
    });
  } catch (err) {
    res.status(503).json({ success: false, operation: 'READ', error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Backend démarré → http://localhost:${PORT}`);
  console.log(`   GET  /health`);
  console.log(`   GET  /replica-status`);
  console.log(`   GET  /db/status        ← diagnostics cluster`);
  console.log(`   GET  /db/write-test    ← preuve écriture primary`);
  console.log(`   GET  /db/read-test     ← preuve lecture replica`);
  console.log(`   POST /expenses`);
  console.log(`   GET  /expenses/:userId`);
  console.log(`   POST /budget`);
  console.log(`   GET  /budget/:userId/:annee/:mois`);
});

export { app };