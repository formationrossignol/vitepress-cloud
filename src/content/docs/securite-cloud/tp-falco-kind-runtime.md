---
title: "TP : Détection runtime avec Falco sur Kind"
date: 2026-06-15
description: Installer Falco sur Kind via Helm, déclencher des comportements suspects (shell, fichiers sensibles, token ServiceAccount, outils réseau), écrire des règles personnalisées et analyser les alertes runtime.
---

## Prérequis

### Environnement technique

* Docker installé et fonctionnel.
* Kind installé.
* kubectl installé.
* Helm installé.
* jq installé pour lire et filtrer les sorties JSON.
* Accès à un terminal Bash ou Zsh.
* Accès Internet pour télécharger les images Docker et les charts Helm.

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

### Installation des outils

#### Sur Debian / Ubuntu (ou WSL2 Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y curl wget git jq apt-transport-https ca-certificates gnupg docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER"
```

Se déconnecter puis se reconnecter si l'utilisateur vient d'être ajouté au groupe Docker.

Installer kubectl :

```bash
KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt)
curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/kubectl
```

Installer Kind :

```bash
curl -Lo ./kind "https://kind.sigs.k8s.io/dl/v0.32.0/kind-linux-amd64"
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

Installer Helm :

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

#### Sur macOS

```bash
brew install kind
brew install kubectl
brew install helm
brew install jq
```

Installer Docker Desktop depuis docker.com.

#### Sur Windows

L'environnement recommandé est WSL2 avec Ubuntu :

```powershell
wsl --version
wsl --install -d Ubuntu
```

Installer Docker Desktop et activer l'intégration WSL2, puis dans Ubuntu WSL suivre la section Debian / Ubuntu.

### Vérification des outils

```bash
docker --version
kind version
kubectl version --client
helm version
jq --version
```

### Compatibilité par système

| Système | Support Falco runtime |
|---|---|
| Linux | Recommandé |
| Windows WSL2 | Possible si Docker fonctionne côté Linux |
| macOS Docker Desktop | Possible pour Kind, moins fiable pour Falco runtime |
| Windows Docker Desktop | Possible pour Kind, moins fiable pour Falco runtime |

### Précaution

Ce TP crée un cluster Kubernetes local.

Aucune ressource cloud n'est créée.

Falco dépend de l'accès aux événements système du noyau Linux. Sur Docker Desktop macOS ou Windows, certains événements runtime peuvent ne pas être visibles.

Le cluster doit être supprimé à la fin du TP.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Installer Falco sur un cluster Kind via Helm.
* Comprendre le rôle du driver Falco (eBPF, kmod, modern_ebpf).
* Déclencher des comportements suspects dans un conteneur.
* Lire et interpréter les alertes Falco.
* Écrire des règles Falco personnalisées.
* Détecter une écriture dans `/etc`, une lecture de token et un outil réseau.
* Créer un Deployment sécurisé pour réduire la surface d'attaque.
* Produire un rapport local des résultats.

## Scénarios de détection

| Scénario | Exemple |
|---|---|
| Shell interactif dans un conteneur | `kubectl exec -- sh` |
| Lecture de fichiers sensibles | `cat /etc/shadow` |
| Écriture dans `/etc` | `touch /etc/falco-test` |
| Accès au token ServiceAccount | Lecture du token Kubernetes |
| Exécution d'un outil réseau | `wget`, `nc`, `curl` |
| Pod de debug suspect | BusyBox avec commandes suspectes |

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-falco-kind-runtime
cd tp-falco-kind-runtime

mkdir -p kind manifests/app manifests/falco scripts reports
```

```bash
find . -maxdepth 3 -type d | sort
```

Résultat attendu :

```text
.
./kind
./manifests
./manifests/app
./manifests/falco
./reports
./scripts
```

### 2. Définir les variables du TP

```bash
cat > scripts/env.sh <<'EOF'
export TP_NAME="tp-falco-kind-runtime"
export KIND_CLUSTER_NAME="falco-runtime-lab"
export KIND_CONFIG_FILE="kind/kind-config.yaml"
export NS_APP="runtime-demo"
export FALCO_NAMESPACE="falco"
export APP_NAME="runtime-nginx"
export APP_LABEL="app=runtime-nginx"
export REPORTS_DIR="reports"
EOF
```

```bash
source scripts/env.sh
```

```bash
echo "$TP_NAME"
echo "$KIND_CLUSTER_NAME"
echo "$NS_APP"
echo "$FALCO_NAMESPACE"
```

### 3. Créer un diagnostic des outils

```bash
{
  echo "# Diagnostic outils TP Falco"
  echo
  echo "## Docker"
  docker --version 2>/dev/null || echo "Non disponible"
  echo
  echo "## Kind"
  kind version 2>/dev/null || echo "Non disponible"
  echo
  echo "## kubectl"
  kubectl version --client 2>/dev/null || echo "Non disponible"
  echo
  echo "## Helm"
  helm version 2>/dev/null || echo "Non disponible"
  echo
  echo "## jq"
  jq --version 2>/dev/null || echo "Non disponible"
} | tee reports/00-tools-diagnostic.txt
```

## Création du cluster Kind

### 4. Créer la configuration Kind

```bash
cat > kind/kind-config.yaml <<'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: falco-runtime-lab
nodes:
  - role: control-plane
  - role: worker
EOF
```

```bash
cat "${KIND_CONFIG_FILE}"
```

### 5. Créer le cluster

```bash
kind create cluster --config "${KIND_CONFIG_FILE}"
```

```bash
kind get clusters | tee reports/01-kind-clusters.txt
```

Résultat attendu :

```text
falco-runtime-lab
```

```bash
kubectl config current-context | tee reports/02-kubectl-context.txt
```

Résultat attendu :

```text
kind-falco-runtime-lab
```

### 6. Vérifier les nœuds

```bash
kubectl get nodes -o wide | tee reports/03-nodes.txt
```

## Installation de Falco

### 7. Ajouter le dépôt Helm Falco

```bash
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update
```

```bash
helm search repo falcosecurity/falco | tee reports/04-falco-helm-search.txt
```

### 8. Créer les valeurs Helm Falco

Le chart Falco `8.x` utilise par défaut une image distroless. La clé `customRules` permet d'injecter des règles locales directement via Helm sans modifier le ConfigMap manuellement.

```bash
cat > manifests/falco/values.yaml <<'EOF'
tty: true

driver:
  kind: auto

falco:
  priority: notice
  json_output: false
  stdout_output:
    enabled: true
  file_output:
    enabled: false
  syslog_output:
    enabled: false
  rules_files:
    - /etc/falco/falco_rules.yaml
    - /etc/falco/falco_rules.local.yaml
    - /etc/falco/rules.d
EOF
```

### 9. Installer Falco avec Helm

```bash
helm upgrade --install falco falcosecurity/falco \
  --version "8.0.1" \
  --namespace "${FALCO_NAMESPACE}" \
  --create-namespace \
  -f manifests/falco/values.yaml
```

```bash
kubectl -n "${FALCO_NAMESPACE}" wait \
  --for=condition=Ready \
  pods \
  --all \
  --timeout=180s
```

```bash
kubectl -n "${FALCO_NAMESPACE}" get pods -o wide \
  | tee reports/05-falco-pods.txt
```

### 10. Vérifier les logs Falco

```bash
kubectl -n "${FALCO_NAMESPACE}" logs \
  -l app.kubernetes.io/name=falco \
  -c falco \
  --tail=80 \
  | tee reports/06-falco-startup-logs.txt
```

```bash
grep -Ei "driver|engine|modern|ebpf|kmod|syscall" reports/06-falco-startup-logs.txt \
  | tee reports/07-falco-driver-summary.txt || true
```

Si les Pods Falco sont en erreur :

```bash
kubectl -n "${FALCO_NAMESPACE}" describe pods \
  | tee reports/08-falco-pods-describe.txt
```

## Déploiement d'une application de test

### 11. Créer le namespace applicatif

```bash
kubectl create namespace "${NS_APP}"
kubectl label namespace "${NS_APP}" environment=dev security=runtime --overwrite
kubectl get namespace "${NS_APP}" --show-labels | tee reports/09-app-namespace.txt
```

### 12. Créer une application Nginx

```bash
cat > manifests/app/01-nginx-deployment.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${APP_NAME}
  namespace: ${NS_APP}
  labels:
    app: ${APP_NAME}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${APP_NAME}
  template:
    metadata:
      labels:
        app: ${APP_NAME}
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
EOF
```

```bash
kubectl apply -f manifests/app/01-nginx-deployment.yaml
kubectl -n "${NS_APP}" rollout status deployment/"${APP_NAME}"
```

```bash
export APP_POD="$(kubectl -n "${NS_APP}" get pods \
  -l "${APP_LABEL}" \
  --sort-by=.metadata.creationTimestamp \
  -o jsonpath='{.items[-1].metadata.name}')"
echo "${APP_POD}" | tee reports/10-app-pod-name.txt
kubectl -n "${NS_APP}" get pod "${APP_POD}" -o wide | tee reports/11-app-pod.txt
```

## Détection 1 : shell dans un conteneur

### 13. Déclencher un shell dans le Pod

```bash
kubectl -n "${NS_APP}" exec "${APP_POD}" -- sh -c "id && whoami"
kubectl -n "${NS_APP}" exec "${APP_POD}" -- sh -c "echo falco-shell-test"
```

### 14. Rechercher l'alerte Falco

```bash
sleep 5
kubectl -n "${FALCO_NAMESPACE}" logs \
  -l app.kubernetes.io/name=falco \
  -c falco \
  --since=5m \
  | tee reports/12-falco-logs-shell.txt
grep -Ei "shell|Terminal shell|spawned process|runtime-nginx|${APP_POD}|sh" \
  reports/12-falco-logs-shell.txt \
  | tee reports/13-falco-alerts-shell.txt || true
```

Résultat attendu : au moins une alerte liée à l'exécution d'un shell dans le conteneur.

## Détection 2 : lecture d'un fichier sensible

### 15. Lire un fichier sensible dans le conteneur

```bash
kubectl -n "${NS_APP}" exec "${APP_POD}" -- cat /etc/shadow || true
kubectl -n "${NS_APP}" exec "${APP_POD}" -- cat /etc/passwd >/dev/null
```

### 16. Rechercher l'alerte Falco

```bash
sleep 5
kubectl -n "${FALCO_NAMESPACE}" logs \
  -l app.kubernetes.io/name=falco \
  -c falco \
  --since=5m \
  | tee reports/14-falco-logs-sensitive-files.txt
grep -Ei "Sensitive|shadow|passwd|opened for reading|runtime-nginx|${APP_POD}" \
  reports/14-falco-logs-sensitive-files.txt \
  | tee reports/15-falco-alerts-sensitive-files.txt || true
```

Résultat attendu : Falco détecte la lecture de `/etc/shadow`.

## Détection 3 : écriture dans un répertoire sensible

### 17. Créer des règles Falco personnalisées

La clé `customRules` est supportée par le chart Falco version 3.x et supérieure.

```bash
cat > manifests/falco/custom-rules.yaml <<'EOF'
customRules:
  local-rules.yaml: |-
    - rule: Local Write Below Etc In Container
      desc: Détecte une écriture dans /etc depuis un conteneur
      condition: >
        evt.type in (open,openat,openat2,creat)
        and evt.is_open_write=true
        and fd.typechar='f'
        and fd.name startswith /etc
        and container
      output: >
        Ecriture suspecte dans /etc depuis un conteneur
        file=%fd.name proc=%proc.name cmd=%proc.cmdline
        user=%user.name container=%container.name
        image=%container.image.repository:%container.image.tag
        k8s_ns=%k8s.ns.name k8s_pod=%k8s.pod.name
      priority: WARNING
      tags: [filesystem, container, mitre_persistence]

    - rule: Local ServiceAccount Token Read
      desc: Détecte la lecture du token ServiceAccount depuis un conteneur
      condition: >
        evt.type in (open,openat,openat2)
        and fd.name contains /var/run/secrets/kubernetes.io/serviceaccount/token
        and container
      output: >
        Lecture suspecte du token ServiceAccount
        file=%fd.name proc=%proc.name cmd=%proc.cmdline
        user=%user.name container=%container.name
        image=%container.image.repository:%container.image.tag
        k8s_ns=%k8s.ns.name k8s_pod=%k8s.pod.name
      priority: WARNING
      tags: [credential_access, container, kubernetes]

    - rule: Local Network Tool Executed In Container
      desc: Détecte l'exécution d'outils réseau courants depuis un conteneur
      condition: >
        spawned_process
        and container
        and proc.name in (curl, wget, nc, ncat, netcat, telnet, socat)
      output: >
        Outil réseau exécuté dans un conteneur
        proc=%proc.name cmd=%proc.cmdline user=%user.name
        container=%container.name
        image=%container.image.repository:%container.image.tag
        k8s_ns=%k8s.ns.name k8s_pod=%k8s.pod.name
      priority: NOTICE
      tags: [network, discovery, container]
EOF
```

### 18. Charger les règles personnalisées

```bash
helm upgrade falco falcosecurity/falco \
  --version "8.0.1" \
  --namespace "${FALCO_NAMESPACE}" \
  -f manifests/falco/values.yaml \
  -f manifests/falco/custom-rules.yaml
```

```bash
kubectl -n "${FALCO_NAMESPACE}" rollout status daemonset/falco
kubectl -n "${FALCO_NAMESPACE}" get pods | tee reports/16-falco-pods-after-rules.txt
```

### 19. Déclencher une écriture dans `/etc`

```bash
kubectl -n "${NS_APP}" exec "${APP_POD}" -- sh -c "touch /etc/falco-runtime-test" || true
kubectl -n "${NS_APP}" exec "${APP_POD}" -- sh -c "rm -f /etc/falco-runtime-test" || true
```

### 20. Rechercher l'alerte personnalisée

```bash
sleep 5
kubectl -n "${FALCO_NAMESPACE}" logs \
  -l app.kubernetes.io/name=falco \
  -c falco \
  --since=5m \
  | tee reports/17-falco-logs-write-etc.txt
grep -Ei "Ecriture suspecte|Write Below Etc|falco-runtime-test|/etc" \
  reports/17-falco-logs-write-etc.txt \
  | tee reports/18-falco-alerts-write-etc.txt || true
```

Résultat attendu : Falco détecte l'écriture dans `/etc`.

## Détection 4 : lecture du token ServiceAccount

### 21. Lire le token ServiceAccount

```bash
kubectl -n "${NS_APP}" exec "${APP_POD}" -- sh -c "ls -l /var/run/secrets/kubernetes.io/serviceaccount/" || true
kubectl -n "${NS_APP}" exec "${APP_POD}" -- sh -c "head -c 20 /var/run/secrets/kubernetes.io/serviceaccount/token" || true
```

### 22. Rechercher l'alerte Falco

```bash
sleep 5
kubectl -n "${FALCO_NAMESPACE}" logs \
  -l app.kubernetes.io/name=falco \
  -c falco \
  --since=5m \
  | tee reports/19-falco-logs-token.txt
grep -Ei "ServiceAccount|token|credential|kubernetes.io/serviceaccount" \
  reports/19-falco-logs-token.txt \
  | tee reports/20-falco-alerts-token.txt || true
```

Résultat attendu : Falco détecte la lecture du token ServiceAccount.

## Détection 5 : outil réseau dans le conteneur

### 23. Déclencher une commande réseau

L'image Nginx ne contient pas forcément `curl` ou `wget`. BusyBox (étape suivante) est plus fiable pour ce test.

```bash
kubectl -n "${NS_APP}" exec "${APP_POD}" -- sh -c "wget -qO- http://example.com >/dev/null" || true
kubectl -n "${NS_APP}" exec "${APP_POD}" -- sh -c "which wget || true; which curl || true; which nc || true"
```

### 24. Rechercher l'alerte Falco

```bash
sleep 5
kubectl -n "${FALCO_NAMESPACE}" logs \
  -l app.kubernetes.io/name=falco \
  -c falco \
  --since=5m \
  | tee reports/21-falco-logs-network-tool.txt
grep -Ei "Outil réseau|wget|curl|netcat|nc|network" \
  reports/21-falco-logs-network-tool.txt \
  | tee reports/22-falco-alerts-network-tool.txt || true
```

Résultat attendu : Falco détecte l'outil réseau si présent dans l'image.

## Détection 6 : Pod de debug suspect

### 25. Créer un Pod de debug avec BusyBox

BusyBox inclut `wget` et `sh`, ce qui permet de déclencher plusieurs règles Falco.

```bash
cat > manifests/app/02-debug-pod.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: suspicious-debug
  namespace: ${NS_APP}
  labels:
    app: suspicious-debug
spec:
  containers:
    - name: debug
      image: busybox:1.36
      command:
        - sh
        - -c
        - "sleep 3600"
EOF
```

```bash
kubectl apply -f manifests/app/02-debug-pod.yaml
kubectl -n "${NS_APP}" wait --for=condition=Ready pod/suspicious-debug --timeout=120s
```

```bash
kubectl -n "${NS_APP}" exec suspicious-debug -- sh -c "id; uname -a; cat /etc/passwd >/dev/null"
kubectl -n "${NS_APP}" exec suspicious-debug -- sh -c "wget -qO- http://example.com >/dev/null" || true
```

### 26. Rechercher les alertes liées au Pod de debug

```bash
sleep 5
kubectl -n "${FALCO_NAMESPACE}" logs \
  -l app.kubernetes.io/name=falco \
  -c falco \
  --since=5m \
  | tee reports/23-falco-logs-debug-pod.txt
grep -Ei "suspicious-debug|shell|passwd|wget|Outil réseau|Sensitive" \
  reports/23-falco-logs-debug-pod.txt \
  | tee reports/24-falco-alerts-debug-pod.txt || true
```

## Analyse des alertes

### 27. Créer un script d'extraction des alertes

```bash
cat > scripts/extract-falco-alerts.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${1:-reports/falco-all-alerts.txt}"

echo "# Alertes Falco extraites"
echo

echo "## Priorités observées"
grep -Eio "Emergency|Alert|Critical|Error|Warning|Notice|Informational|Debug" "$LOG_FILE" \
  | sort | uniq -c | sort -nr || true
echo

echo "## Alertes liées aux shells"
grep -Ei "shell|sh|bash|Terminal" "$LOG_FILE" || true
echo

echo "## Alertes liées aux fichiers sensibles"
grep -Ei "shadow|passwd|Sensitive|/etc" "$LOG_FILE" || true
echo

echo "## Alertes liées aux tokens"
grep -Ei "ServiceAccount|token|credential|kubernetes.io" "$LOG_FILE" || true
echo

echo "## Alertes liées aux outils réseau"
grep -Ei "wget|curl|netcat|nc|Outil réseau" "$LOG_FILE" || true
EOF
```

```bash
chmod +x scripts/extract-falco-alerts.sh
```

```bash
kubectl -n "${FALCO_NAMESPACE}" logs \
  -l app.kubernetes.io/name=falco \
  -c falco \
  --since=30m \
  | tee reports/falco-all-alerts.txt
```

```bash
./scripts/extract-falco-alerts.sh reports/falco-all-alerts.txt \
  | tee reports/25-falco-alerts-summary.md
```

```bash
cat reports/25-falco-alerts-summary.md
```

### 28. Créer une matrice de détection

```bash
cat > reports/26-detection-matrix.md <<'EOF'
# Matrice de détection Falco

| Scénario | Commande de test | Rapport |
|---|---|---|
| Shell dans un conteneur | kubectl exec -- sh | reports/13-falco-alerts-shell.txt |
| Lecture fichier sensible | cat /etc/shadow | reports/15-falco-alerts-sensitive-files.txt |
| Ecriture dans /etc | touch /etc/falco-runtime-test | reports/18-falco-alerts-write-etc.txt |
| Lecture token ServiceAccount | head token | reports/20-falco-alerts-token.txt |
| Outil réseau | wget example.com | reports/22-falco-alerts-network-tool.txt |
| Pod de debug suspect | suspicious-debug | reports/24-falco-alerts-debug-pod.txt |

## Interprétation

Une alerte absente peut venir de plusieurs causes :

| Cause possible | Explication |
|---|---|
| Falco ne démarre pas | Driver incompatible avec l'environnement local |
| Docker Desktop | Accès limité aux événements noyau |
| Outil absent dans l'image | curl, wget ou nc non présent |
| Règle non chargée | Vérifier le ConfigMap et les logs Falco |
| Evenement trop ancien | Utiliser --since avec une durée plus longue |
EOF
```

```bash
cat reports/26-detection-matrix.md
```

## Durcissement du workload

### 29. Créer une version plus sûre du Deployment

```bash
cat > manifests/app/03-nginx-secure-deployment.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-runtime-nginx
  namespace: ${NS_APP}
  labels:
    app: secure-runtime-nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: secure-runtime-nginx
  template:
    metadata:
      labels:
        app: secure-runtime-nginx
    spec:
      automountServiceAccountToken: false
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
          securityContext:
            privileged: false
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsUser: 101
            runAsGroup: 101
            capabilities:
              drop:
                - ALL
          resources:
            requests:
              cpu: "50m"
              memory: "64Mi"
            limits:
              cpu: "200m"
              memory: "128Mi"
          volumeMounts:
            - name: nginx-cache
              mountPath: /var/cache/nginx
            - name: nginx-run
              mountPath: /var/run
            - name: nginx-tmp
              mountPath: /tmp
      volumes:
        - name: nginx-cache
          emptyDir: {}
        - name: nginx-run
          emptyDir: {}
        - name: nginx-tmp
          emptyDir: {}
EOF
```

```bash
kubectl apply -f manifests/app/03-nginx-secure-deployment.yaml
kubectl -n "${NS_APP}" rollout status deployment/secure-runtime-nginx
kubectl -n "${NS_APP}" get deployment secure-runtime-nginx -o yaml | tee reports/27-secure-deployment.yaml
```

### 30. Inspecter la configuration durcie

```bash
export SECURE_POD="$(kubectl -n "${NS_APP}" get pods \
  -l app=secure-runtime-nginx \
  --sort-by=.metadata.creationTimestamp \
  -o jsonpath='{.items[-1].metadata.name}')"

kubectl -n "${NS_APP}" get pod "${SECURE_POD}" -o json \
  | jq '{
      pod: .metadata.name,
      automountServiceAccountToken: .spec.automountServiceAccountToken,
      runAsNonRoot: .spec.securityContext.runAsNonRoot,
      seccompProfile: .spec.securityContext.seccompProfile.type,
      privileged: .spec.containers[0].securityContext.privileged,
      allowPrivilegeEscalation: .spec.containers[0].securityContext.allowPrivilegeEscalation,
      readOnlyRootFilesystem: .spec.containers[0].securityContext.readOnlyRootFilesystem,
      runAsUser: .spec.containers[0].securityContext.runAsUser,
      capabilitiesDrop: .spec.containers[0].securityContext.capabilities.drop,
      resources: .spec.containers[0].resources
    }' \
  | tee reports/28-secure-pod-summary.json
```

## Rapport de synthèse

### 31. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP : Détection runtime avec Falco sur Kind"
  echo
  echo "## Environnement"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| TP | ${TP_NAME} |"
  echo "| Cluster Kind | ${KIND_CLUSTER_NAME} |"
  echo "| Namespace applicatif | ${NS_APP} |"
  echo "| Namespace Falco | ${FALCO_NAMESPACE} |"
  echo "| Application test | ${APP_NAME} |"
  echo "| Version chart Falco | 8.0.1 |"
  echo
  echo "## Détections testées"
  echo
  echo "| Détection | Fichier de preuve |"
  echo "|---|---|"
  echo "| Shell dans un conteneur | reports/13-falco-alerts-shell.txt |"
  echo "| Lecture /etc/shadow | reports/15-falco-alerts-sensitive-files.txt |"
  echo "| Ecriture dans /etc | reports/18-falco-alerts-write-etc.txt |"
  echo "| Lecture token ServiceAccount | reports/20-falco-alerts-token.txt |"
  echo "| Outil réseau | reports/22-falco-alerts-network-tool.txt |"
  echo "| Pod de debug suspect | reports/24-falco-alerts-debug-pod.txt |"
  echo
  echo "## Règles personnalisées"
  echo
  echo "| Règle | Objectif |"
  echo "|---|---|"
  echo "| Local Write Below Etc In Container | Ecriture dans /etc |"
  echo "| Local ServiceAccount Token Read | Lecture du token Kubernetes |"
  echo "| Local Network Tool Executed In Container | wget, curl, nc, telnet, socat |"
  echo
  echo "## Bonnes pratiques appliquées"
  echo
  echo "| Bonne pratique | Ressource |"
  echo "|---|---|"
  echo "| Désactivation du token automatique | Deployment sécurisé |"
  echo "| Exécution non-root | Deployment sécurisé |"
  echo "| Seccomp RuntimeDefault | Deployment sécurisé |"
  echo "| Escalade de privilèges désactivée | Deployment sécurisé |"
  echo "| Capabilities supprimées | Deployment sécurisé |"
  echo "| Filesystem en lecture seule | Deployment sécurisé |"
  echo "| Requests et limits | Deployment sécurisé |"
  echo
  echo "## Limites"
  echo
  echo "Falco dépend de l'accès aux événements système du noyau Linux."
  echo "Sur Docker Desktop macOS ou Windows, certains événements runtime peuvent ne pas être visibles."
} > reports/rapport-tp-falco-kind-runtime.md
```

### 32. Afficher le rapport

```bash
cat reports/rapport-tp-falco-kind-runtime.md
```

### 33. Lister les fichiers générés

```bash
find . -maxdepth 4 -type f | sort \
  | tee reports/29-generated-files.txt
```

## Nettoyage

### 34. Supprimer les workloads applicatifs

```bash
kubectl delete -f manifests/app/ --ignore-not-found
kubectl delete namespace "${NS_APP}" --ignore-not-found
kubectl get namespaces | tee reports/30-namespaces-after-app-cleanup.txt
```

### 35. Désinstaller Falco

```bash
helm uninstall falco --namespace "${FALCO_NAMESPACE}" || true
kubectl delete namespace "${FALCO_NAMESPACE}" --ignore-not-found
kubectl get namespaces | tee reports/31-namespaces-after-falco-cleanup.txt
```

### 36. Supprimer le cluster Kind

```bash
kind delete cluster --name "${KIND_CLUSTER_NAME}"
kind get clusters | tee reports/32-kind-clusters-after-delete.txt || true
```

### 37. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-falco-kind-runtime
```

## Résultat attendu

À la fin du TP, les éléments suivants doivent avoir été validés :

| Élément | Validation |
|---|---|
| Cluster Kind | Cluster local créé |
| Falco | Falco installé en DaemonSet via Helm |
| Application test | Deployment Nginx déployé |
| Shell | Une alerte est générée |
| Fichier sensible | Une alerte est générée |
| Règle locale `/etc` | Une alerte est générée |
| Règle locale token | Une alerte est générée |
| Règle locale réseau | Une alerte est générée si l'outil existe |
| Durcissement | Deployment sécurisé créé |
| Rapport | Rapport Markdown généré |
| Nettoyage | Cluster Kind supprimé |

Les fichiers suivants doivent avoir été produits :

```text
kind/kind-config.yaml
manifests/app/01-nginx-deployment.yaml
manifests/app/02-debug-pod.yaml
manifests/app/03-nginx-secure-deployment.yaml
manifests/falco/custom-rules.yaml
manifests/falco/values.yaml
reports/00-tools-diagnostic.txt
reports/05-falco-pods.txt
reports/06-falco-startup-logs.txt
reports/13-falco-alerts-shell.txt
reports/15-falco-alerts-sensitive-files.txt
reports/18-falco-alerts-write-etc.txt
reports/20-falco-alerts-token.txt
reports/22-falco-alerts-network-tool.txt
reports/24-falco-alerts-debug-pod.txt
reports/25-falco-alerts-summary.md
reports/26-detection-matrix.md
reports/28-secure-pod-summary.json
reports/rapport-tp-falco-kind-runtime.md
scripts/env.sh
scripts/extract-falco-alerts.sh
```

Aucune ressource cloud, aucune clé AWS et aucun compte externe ne sont utilisés pendant ce TP.
