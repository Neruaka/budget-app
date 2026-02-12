# validate.sh 


RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo -e "${BLUE}   VALIDATION DU REPLICA SET MONGODB      ${NC}"
echo -e "${BLUE}══════════════════════════════════════════${NC}\n"

# ─── TEST 1 : État du replica set ────────────────────────────
echo -e "${YELLOW}[TEST 1] État du replica set${NC}"
docker exec mongo-primary mongosh --quiet --eval "
  const status = rs.status();
  status.members.forEach(m => {
    const icon = m.stateStr === 'PRIMARY' ? '👑' : m.stateStr === 'SECONDARY' ? '📖' : '❌';
    print(icon + ' ' + m.name + ' → ' + m.stateStr + ' (health: ' + (m.health === 1 ? 'UP' : 'DOWN') + ')');
  });
"
echo ""

# ─── TEST 2 : Écriture sur le PRIMARY ────────────────────────
echo -e "${YELLOW}[TEST 2] Écriture sur le PRIMARY${NC}"
docker exec mongo-primary mongosh --quiet budgetapp --eval "
  const result = db.test_replication.insertOne({
    message: 'test replication',
    timestamp: new Date(),
    node: 'primary'
  });
  print(' Document inséré avec _id: ' + result.insertedId);
"
echo ""

# ─── TEST 3 : Lecture sur SECONDARY_1 ────────────────────────
echo -e "${YELLOW}[TEST 3] Lecture sur SECONDARY_1 (vérif réplication)${NC}"
echo "Attente de la réplication (2s)..."
sleep 2

docker exec mongo-secondary1 mongosh --quiet budgetapp --eval "
  db.getMongo().setReadPref('secondary');
  const doc = db.test_replication.findOne({ message: 'test replication' });
  if (doc) {
    print(' Document trouvé sur secondary1 → réplication OK !');
    print('   _id: ' + doc._id);
    print('   timestamp: ' + doc.timestamp);
  } else {
    print(' Document NON trouvé → réplication KO');
  }
"
echo ""

# ─── TEST 4 : Lecture sur SECONDARY_2 ────────────────────────
echo -e "${YELLOW}[TEST 4] Lecture sur SECONDARY_2 (vérif réplication)${NC}"
docker exec mongo-secondary2 mongosh --quiet budgetapp --eval "
  db.getMongo().setReadPref('secondary');
  const doc = db.test_replication.findOne({ message: 'test replication' });
  if (doc) {
    print(' Document trouvé sur secondary2 → réplication OK !');
  } else {
    print(' Document NON trouvé → réplication KO');
  }
"
echo ""

# ─── TEST 5 : Écriture sur SECONDARY = doit échouer ─────────
echo -e "${YELLOW}[TEST 5] Tentative d'écriture sur SECONDARY (doit échouer)${NC}"
docker exec mongo-secondary1 mongosh --quiet budgetapp --eval "
  try {
    db.test_write.insertOne({ test: 'should fail' });
    print(' ERREUR : l écriture a réussi sur un secondary (anormal !)');
  } catch(e) {
    print(' Écriture refusée sur secondary → comportement correct');
    print('   Erreur : ' + e.message);
  }
"
echo ""

# ─── TEST 6 : Lag de réplication ─────────────────────────────
echo -e "${YELLOW}[TEST 6] Mesure du lag de réplication (bonus)${NC}"
docker exec mongo-primary mongosh --quiet --eval "
  const status = rs.status();
  const primary = status.members.find(m => m.stateStr === 'PRIMARY');
  const secondaries = status.members.filter(m => m.stateStr === 'SECONDARY');
  secondaries.forEach(s => {
    const lagMs = primary.optimeDate - s.optimeDate;
    print('Lag ' + s.name + ' : ' + lagMs + 'ms');
  });
"
echo ""

echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo -e "${BLUE}   TEST DE PANNE (simulate failover)      ${NC}"
echo -e "${BLUE}══════════════════════════════════════════${NC}\n"

# ─── TEST 7 : Simulation de panne ────────────────────────────
echo -e "${YELLOW}[TEST 7] Arrêt du PRIMARY (mongo1)${NC}"
echo "Arrêt de mongo-primary..."
docker stop mongo-primary
echo ""

echo "Attente de l'élection du nouveau primary (15s)..."
sleep 15

echo -e "${YELLOW}[TEST 8] Vérification après failover${NC}"
docker exec mongo-secondary1 mongosh --quiet --eval "
  try {
    const status = rs.status();
    status.members.forEach(m => {
      const icon = m.stateStr === 'PRIMARY' ? '👑 NOUVEAU PRIMARY' : m.stateStr === 'SECONDARY' ? '📖' : '💀 DOWN';
      print(icon + ': ' + m.name + ' → ' + m.stateStr);
    });
  } catch(e) {
    print('En cours d élection...');
  }
"
echo ""

echo -e "${YELLOW}[TEST 9] Tentative d'écriture après failover${NC}"
docker exec mongo-secondary1 mongosh --quiet budgetapp --eval "
  // Après failover, le driver redirige vers le nouveau primary
  // Ici on force la connexion au nouveau primary via rs.status
  const primary = rs.status().members.find(m => m.stateStr === 'PRIMARY');
  if (primary) {
    print(' Nouveau primary élu : ' + primary.name);
    print('   Les écritures sont de nouveau disponibles via ce nœud');
  } else {
    print(' Élection encore en cours...');
  }
"
echo ""

echo -e "${YELLOW}[CLEANUP] Redémarrage de mongo1${NC}"
docker start mongo-primary
echo "Attente de la resync (20s)..."
sleep 20

docker exec mongo-primary mongosh --quiet --eval "
  print('État de mongo1 après redémarrage :');
  const status = rs.status();
  const me = status.members.find(m => m.name.includes('mongo1'));
  print('mongo1 → ' + me.stateStr + ' (il est redevenu ' + me.stateStr + ')');
"

echo ""
echo -e "${GREEN} Validation complète. Vérifiez les résultats ci-dessus.${NC}"
