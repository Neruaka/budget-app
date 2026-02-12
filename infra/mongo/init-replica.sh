#!/bin/bash
# ============================================================
# init-replica.sh
# Ce script tourne dans un container one-shot au démarrage.
# Il attend que les 3 nœuds soient prêts, puis initialise
# le replica set et assigne les rôles PRIMARY / SECONDARY.
# ============================================================

echo "⏳ Attente que mongo1 (primary) soit prêt..."
until mongosh --host mongo1:27017 --quiet --eval "db.adminCommand('ping')" &>/dev/null; do
  sleep 2
done
echo "✅ mongo1 est prêt"

echo "⏳ Attente que mongo2 soit prêt..."
until mongosh --host mongo2:27017 --quiet --eval "db.adminCommand('ping')" &>/dev/null; do
  sleep 2
done
echo "✅ mongo2 est prêt"

echo "⏳ Attente que mongo3 soit prêt..."
until mongosh --host mongo3:27017 --quiet --eval "db.adminCommand('ping')" &>/dev/null; do
  sleep 2
done
echo "✅ mongo3 est prêt"

echo "🚀 Initialisation du Replica Set rs0..."

mongosh --host mongo1:27017 --quiet --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017', priority: 2 },
    { _id: 1, host: 'mongo2:27017', priority: 1 },
    { _id: 2, host: 'mongo3:27017', priority: 1 }
  ]
})
"

# priority: 2 sur mongo1 = il sera TOUJOURS élu primary en premier
# priority: 1 sur mongo2/3 = ils peuvent devenir primary si mongo1 tombe

echo "⏳ Attente de l'élection du primary (10s)..."
sleep 10

echo "📊 État du replica set :"
mongosh --host mongo1:27017 --quiet --eval "rs.status().members.forEach(m => print(m.name + ' → ' + m.stateStr))"

echo "✅ Replica Set initialisé avec succès !"
