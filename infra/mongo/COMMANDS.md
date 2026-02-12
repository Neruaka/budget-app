# 📋 COMMANDES CLÉS — Démo Replica Set MongoDB

## 🚀 Démarrage

```bash
# Lancer tout le cluster
docker compose up -d

# Voir les logs en temps réel
docker compose logs -f

# Vérifier que tous les containers tournent
docker compose ps
```

---

## 🔍 Vérification de l'état du cluster

```bash
# État complet du replica set (depuis le primary)
docker exec mongo-primary mongosh --eval "rs.status()"

# Version courte : juste les états des nœuds
docker exec mongo-primary mongosh --quiet --eval "
  rs.status().members.forEach(m => print(m.name + ' → ' + m.stateStr))
"

# Qui est le primary actuellement ?
docker exec mongo-primary mongosh --quiet --eval "rs.isMaster().primary"

# Via l'API backend
curl http://localhost:3000/health
curl http://localhost:3000/replica-status
```

---

## ✅ Validation de la réplication

```bash
# 1. Écrire sur le primary
docker exec mongo-primary mongosh budgetapp --eval "
  db.test.insertOne({ msg: 'hello replica', ts: new Date() })
"

# 2. Lire sur secondary1 (doit voir le document)
docker exec mongo-secondary1 mongosh budgetapp --eval "
  db.getMongo().setReadPref('secondary');
  db.test.findOne({ msg: 'hello replica' })
"

# 3. Tenter d'écrire sur secondary (doit échouer avec NotWritablePrimary)
docker exec mongo-secondary1 mongosh budgetapp --eval "
  db.test.insertOne({ msg: 'should fail' })
"
```

---

## ⚡ Test de failover (tuer le primary)

```bash
# 1. Stopper le primary
docker stop mongo-primary

# 2. Attendre l'élection (10-15 secondes)
sleep 15

# 3. Vérifier le nouveau primary
docker exec mongo-secondary1 mongosh --quiet --eval "
  rs.status().members.forEach(m => print(m.name + ' → ' + m.stateStr))
"

# 4. Vérifier que les écritures marchent toujours (via le backend)
curl -X POST http://localhost:3000/expenses \
  -H "Content-Type: application/json" \
  -d '{"montant": 42, "categorie": "test", "userId": 1}'

# 5. Redémarrer le primary (il redevient SECONDARY au retour)
docker start mongo-primary
sleep 20
docker exec mongo-primary mongosh --quiet --eval "rs.isMaster().ismaster"
# → false (il n'est plus primary, c'est normal)
```

---

## 📊 Mesure du lag de réplication (bonus)

```bash
docker exec mongo-primary mongosh --quiet --eval "
  const s = rs.status();
  const primary = s.members.find(m => m.stateStr === 'PRIMARY');
  s.members.filter(m => m.stateStr === 'SECONDARY').forEach(sec => {
    print('Lag ' + sec.name + ': ' + (primary.optimeDate - sec.optimeDate) + 'ms');
  });
"
```

---

## 🔥 Simulation de charge (bonus)

```bash
# Insérer 1000 documents rapidement
docker exec mongo-primary mongosh budgetapp --eval "
  for(let i = 0; i < 1000; i++) {
    db.load_test.insertOne({ i: i, ts: new Date(), data: 'x'.repeat(100) });
  }
  print('1000 documents insérés');
"

# Mesurer le lag après la charge
docker exec mongo-primary mongosh --quiet --eval "
  const s = rs.status();
  const p = s.members.find(m => m.stateStr === 'PRIMARY');
  s.members.filter(m => m.stateStr === 'SECONDARY').forEach(sec => {
    print('Lag ' + sec.name + ': ' + (p.optimeDate - sec.optimeDate) + 'ms');
  });
"
```

---

## 🧹 Reset complet

```bash
# Tout arrêter et supprimer les volumes (repart de zéro)
docker compose down -v

# Juste arrêter sans supprimer les données
docker compose down
```
