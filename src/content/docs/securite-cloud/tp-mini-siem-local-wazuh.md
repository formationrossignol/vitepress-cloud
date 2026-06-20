---
title: "TP : Mini-SIEM local avec Wazuh"
date: 2026-06-14
description: Déployer un SIEM local avec Wazuh via Docker Compose, configurer la collecte d'événements Docker et Kubernetes, créer des règles locales de détection et vérifier les alertes dans le dashboard.
---

## Prérequis

### Environnement technique

* Docker installé et fonctionnel.
* Docker Compose disponible (`docker compose version`).
* Git installé.
* curl installé.
* Accès à un terminal Bash ou Zsh.
* Accès Internet pour cloner le dépôt Wazuh Docker et télécharger les images.
* Pour la partie Kubernetes optionnelle : `kind` et `kubectl` installés.

### Installer jq

Sur Debian / Ubuntu :

```bash
sudo apt update
sudo apt install -y jq
```

Sur macOS avec Homebrew :

```bash
brew install jq
```

### Vérifier les outils

```bash
docker --version
docker compose version
git --version
curl --version
```

Pour la partie Kubernetes optionnelle :

```bash
kubectl version --client
kind version
```

### Configuration minimale recommandée

| Élément | Valeur recommandée |
|---|---|
| CPU | 4 cœurs |
| RAM | 8 Go |
| Espace disque | 50 Go |

### Précaution

Ce TP crée uniquement un environnement local.

Aucune ressource cloud n'est créée.

Wazuh utilise un certificat auto-signé. Le navigateur affichera une alerte de sécurité lors de l'accès au dashboard, ce qui est normal dans ce contexte de lab.

Le mot de passe du dashboard Wazuh est défini en clair dans le fichier `scripts/env.sh`. Ne jamais utiliser ce fichier dans un environnement partagé ou de production.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Déployer un SIEM local avec Wazuh via Docker Compose.
* Configurer la collecte d'événements Docker dans Wazuh.
* Configurer la collecte d'événements Kubernetes dans Wazuh.
* Créer des règles locales de détection dans Wazuh.
* Générer des événements de test Docker et Kubernetes.
* Vérifier que les règles produisent des alertes dans Wazuh.
* Consulter les alertes dans le dashboard Wazuh.
* Produire un rapport local des résultats.
* Nettoyer l'environnement.

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-mini-siem-local
cd tp-mini-siem-local

mkdir -p scripts reports logs/docker logs/kubernetes
```

```bash
touch logs/docker/docker-events.log
touch logs/kubernetes/kind-events.log
```

```bash
find . -maxdepth 3 -type d | sort
```

Résultat attendu :

```text
.
./logs
./logs/docker
./logs/kubernetes
./reports
./scripts
```

### 2. Définir les variables du TP

```bash
cat > scripts/env.sh <<'EOF'
export TP_NAME="tp-mini-siem-local"
export WAZUH_VERSION="v4.14.2"

export WAZUH_DASHBOARD_URL="https://localhost"
export WAZUH_DASHBOARD_USER="admin"
export WAZUH_DASHBOARD_PASSWORD="SecretPassword"

export DOCKER_TEST_CONTAINER="siem-demo-nginx"
export KIND_CLUSTER_NAME="mini-siem"
export K8S_NAMESPACE="mini-siem"
EOF
```

```bash
source scripts/env.sh
```

```bash
echo "$TP_NAME"
echo "$WAZUH_VERSION"
echo "$WAZUH_DASHBOARD_URL"
```

### 3. Préparer le paramètre système requis

Sur Linux ou WSL2, définir `vm.max_map_count` :

```bash
sudo sysctl -w vm.max_map_count=262144
```

Ce paramètre est requis par Wazuh Indexer (basé sur OpenSearch) pour gérer ses zones mémoire virtuelles. Sans lui, Wazuh Indexer ne démarre pas.

```bash
sysctl vm.max_map_count | tee reports/01-vm-max-map-count.txt
```

Résultat attendu :

```text
vm.max_map_count = 262144
```

Sur macOS avec Docker Desktop, cette étape n'est pas nécessaire.

### 4. Cloner le dépôt Wazuh Docker

```bash
git clone https://github.com/wazuh/wazuh-docker.git -b "${WAZUH_VERSION}"
```

```bash
cd wazuh-docker/single-node
```

```bash
ls -la | tee ../../reports/02-wazuh-single-node-files.txt
```

### 5. Ajouter les montages locaux nécessaires

Depuis `wazuh-docker/single-node`, créer le fichier `docker-compose.override.yml` :

```bash
cat > docker-compose.override.yml <<'EOF'
services:
  wazuh.manager:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ../../logs/docker:/var/log/docker-training:ro
      - ../../logs/kubernetes:/var/log/kubernetes-training:ro
EOF
```

```bash
cat docker-compose.override.yml | tee ../../reports/03-compose-override.txt
```

Ce fichier ajoute au manager Wazuh :

* `/var/run/docker.sock` : accès aux événements Docker du poste local.
* `../../logs/docker` : fichier d'événements Docker de test.
* `../../logs/kubernetes` : fichier d'événements Kubernetes de test.

### 6. Configurer la collecte Docker et Kubernetes

Sauvegarder la configuration Wazuh avant modification :

```bash
cp config/wazuh_cluster/wazuh_manager.conf config/wazuh_cluster/wazuh_manager.conf.bak
```

Ajouter la surveillance Docker et Kubernetes :

```bash
python3 - <<'PY'
from pathlib import Path

path = Path("config/wazuh_cluster/wazuh_manager.conf")
content = path.read_text()

block = """
  <wodle name="docker-listener">
    <disabled>no</disabled>
    <interval>1m</interval>
    <attempts>5</attempts>
    <run_on_start>yes</run_on_start>
  </wodle>

  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/docker-training/docker-events.log</location>
  </localfile>

  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/kubernetes-training/kind-events.log</location>
  </localfile>
"""

if "docker-training/docker-events.log" not in content:
    content = content.replace("</ossec_config>", block + "\n</ossec_config>")
    path.write_text(content)
    print("Configuration mise à jour.")
else:
    print("Configuration déjà présente, aucune modification.")
PY
```

Vérifier la configuration :

```bash
grep -n "docker-listener\|docker-training\|kubernetes-training" config/wazuh_cluster/wazuh_manager.conf \
  | tee ../../reports/04-wazuh-collection-config.txt
```

### 7. Générer les certificats Wazuh

```bash
docker compose -f generate-indexer-certs.yml run --rm generator
```

```bash
find config/wazuh_indexer_ssl_certs -type f | sort \
  | tee ../../reports/05-wazuh-certificates.txt
```

### 8. Démarrer Wazuh

```bash
docker compose up -d
```

```bash
docker compose ps | tee ../../reports/06-wazuh-containers.txt
```

Résultat attendu :

```text
wazuh.manager    Up
wazuh.indexer    Up
wazuh.dashboard  Up
```

### 9. Attendre l'initialisation du dashboard

```bash
docker compose logs wazuh.dashboard | tail -n 50 \
  | tee ../../reports/07-wazuh-dashboard-logs.txt
```

Attendre que le dashboard soit disponible (peut prendre 2 à 5 minutes) :

```bash
until curl -k -s https://localhost >/dev/null; do
  echo "Dashboard Wazuh en cours de démarrage..."
  sleep 15
done
echo "Dashboard disponible."
```

```bash
curl -k -I https://localhost | tee ../../reports/08-wazuh-dashboard-http.txt
```

Résultat attendu :

```text
HTTP/1.1 200 OK
```

Accès au dashboard depuis un navigateur :

```text
URL      : https://localhost
Login    : admin
Password : SecretPassword
```

### 10. Créer des règles locales de détection

```bash
docker compose exec -T wazuh.manager bash -lc 'cat > /var/ossec/etc/rules/local_rules.xml' <<'EOF'
<group name="local,training,docker,kubernetes,">

  <rule id="100100" level="5">
    <match>TRAINING_DOCKER_EVENT</match>
    <description>Docker : événement de conteneur détecté</description>
    <group>docker,training,</group>
  </rule>

  <rule id="100101" level="8">
    <match>TRAINING_DOCKER_CONTAINER_EXEC</match>
    <description>Docker : exécution de commande dans un conteneur détectée</description>
    <group>docker,training,suspicious_command,</group>
  </rule>

  <rule id="100102" level="7">
    <match>TRAINING_DOCKER_CONTAINER_STOP</match>
    <description>Docker : arrêt de conteneur détecté</description>
    <group>docker,training,container_lifecycle,</group>
  </rule>

  <rule id="100200" level="6">
    <match>TRAINING_K8S_EVENT</match>
    <description>Kubernetes : événement de cluster détecté</description>
    <group>kubernetes,training,</group>
  </rule>

  <rule id="100201" level="8">
    <match>TRAINING_K8S_WARNING</match>
    <description>Kubernetes : événement de type Warning détecté</description>
    <group>kubernetes,training,warning,</group>
  </rule>

  <rule id="100202" level="9">
    <match>TRAINING_K8S_FAILED_POD</match>
    <description>Kubernetes : pod en échec détecté</description>
    <group>kubernetes,training,failed_pod,</group>
  </rule>

</group>
EOF
```

Vérifier les règles :

```bash
docker compose exec -T wazuh.manager bash -lc \
  "grep -n '10010\|10020' /var/ossec/etc/rules/local_rules.xml" \
  | tee ../../reports/09-local-rules.txt
```

Redémarrer le manager pour prendre en compte les règles :

```bash
docker compose restart wazuh.manager
sleep 30
```

```bash
docker compose ps wazuh.manager | tee ../../reports/10-wazuh-manager-after-rules.txt
```

## Centralisation et détection Docker

### 11. Créer un conteneur Docker de test

```bash
docker run -d \
  --name "${DOCKER_TEST_CONTAINER}" \
  nginx:alpine
```

```bash
docker ps --filter "name=${DOCKER_TEST_CONTAINER}" \
  | tee ../../reports/11-docker-test-container.txt
```

### 12. Générer un événement Docker normalisé

```bash
echo "$(date -Iseconds) source=docker event=TRAINING_DOCKER_EVENT container=${DOCKER_TEST_CONTAINER} action=create image=nginx:alpine" \
  >> ../../logs/docker/docker-events.log
```

```bash
tail -n 5 ../../logs/docker/docker-events.log \
  | tee ../../reports/12-docker-event-log.txt
```

### 13. Générer un événement Docker sensible

```bash
docker exec "${DOCKER_TEST_CONTAINER}" sh -c "id"
```

```bash
echo "$(date -Iseconds) source=docker event=TRAINING_DOCKER_CONTAINER_EXEC container=${DOCKER_TEST_CONTAINER} command='sh -c id'" \
  >> ../../logs/docker/docker-events.log
```

```bash
tail -n 5 ../../logs/docker/docker-events.log \
  | tee ../../reports/13-docker-exec-event.txt
```

### 14. Générer un événement d'arrêt de conteneur

```bash
docker stop "${DOCKER_TEST_CONTAINER}"
```

```bash
echo "$(date -Iseconds) source=docker event=TRAINING_DOCKER_CONTAINER_STOP container=${DOCKER_TEST_CONTAINER} action=stop" \
  >> ../../logs/docker/docker-events.log
```

```bash
tail -n 10 ../../logs/docker/docker-events.log \
  | tee ../../reports/14-docker-stop-event.txt
```

### 15. Vérifier les alertes Docker dans Wazuh

```bash
sleep 30
```

```bash
docker compose exec -T wazuh.manager bash -lc \
  "grep '10010' /var/ossec/logs/alerts/alerts.json | tail -n 20" \
  | tee ../../reports/15-wazuh-docker-alerts.json
```

Les règles locales `100100`, `100101` et `100102` doivent produire des alertes.

## Centralisation et détection Kubernetes (optionnel)

Cette partie nécessite `kind` et `kubectl`.

### 16. Créer un cluster Kubernetes local avec Kind

```bash
kind create cluster --name "${KIND_CLUSTER_NAME}"
```

```bash
kubectl get nodes -o wide \
  | tee ../../reports/16-kind-nodes.txt
```

```bash
kubectl create namespace "${K8S_NAMESPACE}"
```

```bash
kubectl get namespace "${K8S_NAMESPACE}" \
  | tee ../../reports/17-k8s-namespace.txt
```

### 17. Déployer une application Kubernetes saine

```bash
kubectl -n "${K8S_NAMESPACE}" create deployment web --image=nginx:alpine
```

```bash
kubectl -n "${K8S_NAMESPACE}" rollout status deployment/web
```

```bash
kubectl -n "${K8S_NAMESPACE}" get pods -o wide \
  | tee ../../reports/18-k8s-web-pods.txt
```

```bash
echo "$(date -Iseconds) source=kubernetes event=TRAINING_K8S_EVENT namespace=${K8S_NAMESPACE} workload=deployment/web action=created" \
  >> ../../logs/kubernetes/kind-events.log
```

### 18. Générer un pod Kubernetes en erreur

```bash
kubectl -n "${K8S_NAMESPACE}" run bad-image \
  --image=does-not-exist:latest \
  --restart=Never || true
```

```bash
sleep 45
```

```bash
kubectl -n "${K8S_NAMESPACE}" get pods \
  | tee ../../reports/19-k8s-bad-image-pod.txt
```

```bash
kubectl get events -A --sort-by=.lastTimestamp \
  | tee ../../reports/20-k8s-events.txt
```

### 19. Centraliser les événements Kubernetes dans Wazuh

Depuis la racine du TP, créer le script de collecte :

```bash
cd ../..
```

```bash
cat > scripts/collect-k8s-events.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

OUTPUT_FILE="logs/kubernetes/kind-events.log"

kubectl get events -A --sort-by=.lastTimestamp --no-headers | while read -r line; do
  if echo "$line" | grep -E "Warning|Failed|BackOff|ErrImagePull|ImagePullBackOff" >/dev/null; then
    echo "$(date -Iseconds) source=kubernetes event=TRAINING_K8S_WARNING raw=\"$line\"" >> "$OUTPUT_FILE"
  fi
done
EOF
```

```bash
chmod +x scripts/collect-k8s-events.sh
./scripts/collect-k8s-events.sh
```

```bash
echo "$(date -Iseconds) source=kubernetes event=TRAINING_K8S_FAILED_POD namespace=${K8S_NAMESPACE} pod=bad-image reason=ImagePullBackOff" \
  >> logs/kubernetes/kind-events.log
```

```bash
tail -n 20 logs/kubernetes/kind-events.log \
  | tee reports/21-k8s-normalized-events.txt
```

Revenir dans le dossier Wazuh :

```bash
cd wazuh-docker/single-node
```

### 20. Vérifier les alertes Kubernetes dans Wazuh

```bash
sleep 30
```

```bash
docker compose exec -T wazuh.manager bash -lc \
  "grep '10020' /var/ossec/logs/alerts/alerts.json | tail -n 20" \
  | tee ../../reports/22-wazuh-kubernetes-alerts.json
```

Les règles locales `100200`, `100201` et `100202` doivent produire des alertes.

## Consultation dans le dashboard Wazuh

### 21. Accéder au dashboard

Ouvrir dans un navigateur :

```text
https://localhost
```

| Champ | Valeur |
|---|---|
| Utilisateur | `admin` |
| Mot de passe | `SecretPassword` |

Le navigateur peut afficher une alerte de certificat. C'est attendu car le TP utilise un certificat auto-signé.

### 22. Rechercher les alertes Docker

Dans le dashboard Wazuh, rechercher les identifiants de règles :

```text
100100
100101
100102
```

### 23. Rechercher les alertes Kubernetes

Dans le dashboard Wazuh, rechercher les identifiants de règles :

```text
100200
100201
100202
```

## Rapport de synthèse

### 24. Revenir à la racine du TP

```bash
cd ../..
```

### 25. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP : Mini-SIEM local avec Wazuh"
  echo
  echo "## Environnement"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| TP | ${TP_NAME} |"
  echo "| Version Wazuh | ${WAZUH_VERSION} |"
  echo "| Dashboard | ${WAZUH_DASHBOARD_URL} |"
  echo "| Conteneur Docker de test | ${DOCKER_TEST_CONTAINER} |"
  echo "| Cluster Kubernetes local | ${KIND_CLUSTER_NAME} |"
  echo "| Namespace Kubernetes | ${K8S_NAMESPACE} |"
  echo
  echo "## Composants déployés"
  echo
  echo "| Composant | Rôle |"
  echo "|---|---|"
  echo "| Wazuh Manager | Collecte, analyse et corrélation |"
  echo "| Wazuh Indexer | Indexation des événements |"
  echo "| Wazuh Dashboard | Visualisation des alertes |"
  echo "| Docker | Source d'événements conteneurs |"
  echo "| Kind | Source Kubernetes locale optionnelle |"
  echo
  echo "## Fichiers surveillés"
  echo
  echo "| Fichier | Source |"
  echo "|---|---|"
  echo "| logs/docker/docker-events.log | Événements Docker normalisés |"
  echo "| logs/kubernetes/kind-events.log | Événements Kubernetes normalisés |"
  echo
  echo "## Règles locales"
  echo
  echo "| Rule ID | Détection |"
  echo "|---|---|"
  echo "| 100100 | Docker : événement de conteneur |"
  echo "| 100101 | Docker : exécution de commande dans un conteneur |"
  echo "| 100102 | Docker : arrêt de conteneur |"
  echo "| 100200 | Kubernetes : événement de cluster |"
  echo "| 100201 | Kubernetes : événement Warning |"
  echo "| 100202 | Kubernetes : pod en échec |"
  echo
  echo "## Tests réalisés"
  echo
  echo "| Test | Résultat attendu |"
  echo "|---|---|"
  echo "| Démarrage Wazuh | Dashboard disponible sur https://localhost |"
  echo "| Événement Docker normalisé | Alerte Wazuh 100100 |"
  echo "| Commande Docker exec | Alerte Wazuh 100101 |"
  echo "| Arrêt conteneur Docker | Alerte Wazuh 100102 |"
  echo "| Événement Kubernetes | Alerte Wazuh 100200 |"
  echo "| Warning Kubernetes | Alerte Wazuh 100201 |"
  echo "| Pod Kubernetes en échec | Alerte Wazuh 100202 |"
} > reports/rapport-tp-mini-siem-local.md
```

### 26. Afficher le rapport

```bash
cat reports/rapport-tp-mini-siem-local.md
```

### 27. Lister les fichiers générés

```bash
find . -maxdepth 3 -type f | sort \
  | tee reports/23-generated-files.txt
```

## Nettoyage

### 28. Supprimer le conteneur Docker de test

```bash
docker rm -f "${DOCKER_TEST_CONTAINER}" 2>/dev/null || true
```

```bash
docker ps -a --filter "name=${DOCKER_TEST_CONTAINER}"
```

### 29. Supprimer le cluster Kubernetes local (optionnel)

Réaliser cette étape uniquement si la partie Kubernetes a été complétée.

```bash
kind delete cluster --name "${KIND_CLUSTER_NAME}"
```

```bash
kind get clusters || true
```

### 30. Arrêter Wazuh et supprimer les volumes

```bash
cd wazuh-docker/single-node
```

```bash
docker compose down -v
```

```bash
docker compose ps
docker volume ls | grep wazuh || true
```

### 31. Supprimer le dossier local

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ../..
cd ..
rm -rf tp-mini-siem-local
```

## Résultat attendu

À la fin du TP, les éléments suivants doivent avoir été validés :

| Élément | Validation |
|---|---|
| Wazuh local | Dashboard disponible sur `https://localhost` |
| Collecte Docker | Événements Docker présents dans le fichier surveillé |
| Détection Docker | Alertes `100100`, `100101`, `100102` visibles dans Wazuh |
| Collecte Kubernetes | Événements Kubernetes centralisés dans le fichier surveillé |
| Détection Kubernetes | Alertes `100200`, `100201`, `100202` visibles dans Wazuh |
| Rapport | Rapport Markdown disponible dans `reports/` |
| Nettoyage | Conteneurs, volumes et cluster Kind supprimés |

Aucune ressource cloud, aucune clé AWS et aucun compte externe ne sont utilisés pendant ce TP.
