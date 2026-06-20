---
title: "TP : Vérifier le CIS Kubernetes Benchmark avec kube-bench"
date: 2026-06-15
description: Créer un cluster Kind, lancer kube-bench en local et via Job Kubernetes, lire les statuts PASS/FAIL/WARN/INFO, extraire les remédiations, corriger les workloads et comparer les résultats avant et après.
---

## Prérequis

### Environnement technique

* Docker installé et fonctionnel.
* Kind installé.
* kubectl installé.
* kube-bench installé.
* jq installé pour lire et filtrer les sorties JSON.
* Accès à un terminal Bash ou Zsh.
* Accès Internet pour télécharger les images Docker.

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
sudo apt-get install -y curl wget git jq docker.io
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

Installer kube-bench :

```bash
curl -L "https://github.com/aquasecurity/kube-bench/releases/download/v0.15.4/kube-bench_0.15.4_linux_amd64.deb" \
  -o kube-bench.deb
sudo apt install -y ./kube-bench.deb
rm -f kube-bench.deb
```

#### Sur macOS

```bash
brew install kind
brew install kubectl
brew install kube-bench
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
kube-bench version 2>/dev/null || echo "kube-bench non disponible en local - utilisation via Job Kubernetes"
jq --version
```

### Compatibilité Windows

| Système | Terminal recommandé |
|---|---|
| Linux | Bash |
| macOS | Terminal ou iTerm2 |
| Windows | WSL2 Ubuntu |
| Windows alternatif | Git Bash |

### Précaution

Ce TP crée un cluster Kubernetes local de formation.

Aucune ressource cloud n'est créée.

Le cluster Kind n'est pas attendu parfaitement conforme au CIS Kubernetes Benchmark : c'est un environnement local pédagogique, pas un cluster de production durci.

Le cluster doit être supprimé à la fin du TP.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Créer un cluster Kubernetes local avec Kind.
* Lancer kube-bench en ligne de commande locale.
* Lancer kube-bench comme Job Kubernetes.
* Lire et interpréter les statuts `PASS`, `FAIL`, `WARN` et `INFO`.
* Extraire les contrôles en échec et leurs remédiations.
* Identifier les familles de contrôles CIS.
* Déployer un workload corrigé et une NetworkPolicy.
* Comparer les résultats avant et après correction.
* Produire un rapport local des résultats.

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-kube-bench-cis
cd tp-kube-bench-cis

mkdir -p kind manifests/kube-bench manifests/demo manifests/secure scripts reports
```

```bash
find . -maxdepth 3 -type d | sort
```

Résultat attendu :

```text
.
./kind
./manifests
./manifests/demo
./manifests/kube-bench
./manifests/secure
./reports
./scripts
```

### 2. Définir les variables du TP

```bash
cat > scripts/env.sh <<'EOF'
export TP_NAME="tp-kube-bench-cis"
export KIND_CLUSTER_NAME="cis-benchmark-lab"
export KIND_CONFIG_FILE="kind/kind-config.yaml"
export NS_DEMO="cis-demo"
export NS_SECURE="cis-secure"
export KUBE_BENCH_NS="kube-system"
export KUBE_BENCH_TEXT_JOB="kube-bench-text"
export KUBE_BENCH_JSON_JOB="kube-bench-json"
export KUBE_BENCH_TEXT_JOB_AFTER="kube-bench-text-after"
export KUBE_BENCH_JSON_JOB_AFTER="kube-bench-json-after"
export REPORTS_DIR="reports"
EOF
```

```bash
source scripts/env.sh
```

```bash
echo "$TP_NAME"
echo "$KIND_CLUSTER_NAME"
echo "$NS_DEMO"
echo "$NS_SECURE"
```

### 3. Créer un diagnostic des outils

```bash
{
  echo "# Diagnostic outils TP kube-bench"
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
  echo "## kube-bench"
  kube-bench version 2>/dev/null || echo "Non disponible en local - utilisation via Job Kubernetes"
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
name: cis-benchmark-lab
nodes:
  - role: control-plane
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
cis-benchmark-lab
```

```bash
kubectl config current-context | tee reports/02-kubectl-context.txt
```

Résultat attendu :

```text
kind-cis-benchmark-lab
```

### 6. Vérifier les nœuds

```bash
kubectl get nodes -o wide | tee reports/03-nodes.txt
kubectl cluster-info | tee reports/04-cluster-info.txt
```

## Création d'un workload de démonstration

### 7. Créer les namespaces

```bash
kubectl create namespace "${NS_DEMO}"
kubectl label namespace "${NS_DEMO}" environment=dev security=weak --overwrite

kubectl create namespace "${NS_SECURE}"
kubectl label namespace "${NS_SECURE}" environment=dev security=improved --overwrite
```

```bash
kubectl get namespaces --show-labels | tee reports/05-namespaces.txt
```

### 8. Créer un Pod volontairement faible

```bash
cat > manifests/demo/01-weak-pod.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: weak-nginx
  namespace: ${NS_DEMO}
  labels:
    app: weak-nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.25
      ports:
        - containerPort: 80
      securityContext:
        allowPrivilegeEscalation: true
EOF
```

```bash
kubectl apply -f manifests/demo/01-weak-pod.yaml
kubectl -n "${NS_DEMO}" wait --for=condition=Ready pod/weak-nginx --timeout=120s
kubectl -n "${NS_DEMO}" get pod weak-nginx -o wide | tee reports/06-weak-pod.txt
```

### 9. Inspecter le Pod faible

```bash
kubectl -n "${NS_DEMO}" get pod weak-nginx -o json \
  | jq '{
      name: .metadata.name,
      namespace: .metadata.namespace,
      serviceAccountName: .spec.serviceAccountName,
      automountServiceAccountToken: .spec.automountServiceAccountToken,
      allowPrivilegeEscalation: .spec.containers[0].securityContext.allowPrivilegeEscalation,
      resources: .spec.containers[0].resources
    }' \
  | tee reports/07-weak-pod-summary.json
```

## Exécution kube-bench en ligne de commande locale

### 10. Lancer kube-bench localement

Si kube-bench est installé localement, cette commande scanne l'environnement du poste.

Dans un environnement WSL2 ou macOS, les fichiers de configuration Kubernetes du nœud Kind ne sont pas accessibles directement. Le scan le plus pertinent de ce TP est le scan exécuté dans le cluster via un Job Kubernetes (étapes suivantes).

```bash
set +e
kube-bench run 2>/dev/null \
  | tee reports/08-kube-bench-local.txt
LOCAL_STATUS=$?
set -e

echo "${LOCAL_STATUS}" | tee reports/09-kube-bench-local-status.txt
```

## Exécution kube-bench dans Kubernetes

### 11. Créer le Job kube-bench en sortie texte

kube-bench détermine automatiquement les cibles à scanner en fonction de la version Kubernetes détectée. Le flag `--targets` n'est pas spécifié pour laisser kube-bench choisir les cibles pertinentes pour le cluster Kind.

```bash
cat > manifests/kube-bench/01-kube-bench-text-job.yaml <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: ${KUBE_BENCH_TEXT_JOB}
  namespace: ${KUBE_BENCH_NS}
spec:
  template:
    spec:
      hostPID: true
      restartPolicy: Never
      containers:
        - name: kube-bench
          image: aquasec/kube-bench:v0.15.4
          command:
            - kube-bench
            - run
          volumeMounts:
            - name: var-lib-etcd
              mountPath: /var/lib/etcd
              readOnly: true
            - name: var-lib-kubelet
              mountPath: /var/lib/kubelet
              readOnly: true
            - name: etc-systemd
              mountPath: /etc/systemd
              readOnly: true
            - name: etc-kubernetes
              mountPath: /etc/kubernetes
              readOnly: true
            - name: usr-bin
              mountPath: /usr/local/mount-from-host/bin
              readOnly: true
      volumes:
        - name: var-lib-etcd
          hostPath:
            path: /var/lib/etcd
        - name: var-lib-kubelet
          hostPath:
            path: /var/lib/kubelet
        - name: etc-systemd
          hostPath:
            path: /etc/systemd
        - name: etc-kubernetes
          hostPath:
            path: /etc/kubernetes
        - name: usr-bin
          hostPath:
            path: /usr/bin
EOF
```

### 12. Exécuter le Job kube-bench texte

```bash
kubectl apply -f manifests/kube-bench/01-kube-bench-text-job.yaml
```

```bash
kubectl -n "${KUBE_BENCH_NS}" wait \
  --for=condition=complete \
  job/"${KUBE_BENCH_TEXT_JOB}" \
  --timeout=180s
```

```bash
export KUBE_BENCH_TEXT_POD="$(kubectl -n "${KUBE_BENCH_NS}" get pods \
  -l job-name="${KUBE_BENCH_TEXT_JOB}" \
  --sort-by=.metadata.creationTimestamp \
  -o jsonpath='{.items[-1].metadata.name}')"
echo "${KUBE_BENCH_TEXT_POD}" | tee reports/10-kube-bench-text-pod.txt
```

```bash
kubectl -n "${KUBE_BENCH_NS}" logs "${KUBE_BENCH_TEXT_POD}" \
  | tee reports/11-kube-bench-text-results.txt
```

Résultat attendu : le rapport doit contenir des lignes avec les statuts `[INFO]`, `[PASS]`, `[FAIL]` et `[WARN]`.

### 13. Créer le Job kube-bench JSON

```bash
cat > manifests/kube-bench/02-kube-bench-json-job.yaml <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: ${KUBE_BENCH_JSON_JOB}
  namespace: ${KUBE_BENCH_NS}
spec:
  template:
    spec:
      hostPID: true
      restartPolicy: Never
      containers:
        - name: kube-bench
          image: aquasec/kube-bench:v0.15.4
          command:
            - kube-bench
            - run
            - --json
          volumeMounts:
            - name: var-lib-etcd
              mountPath: /var/lib/etcd
              readOnly: true
            - name: var-lib-kubelet
              mountPath: /var/lib/kubelet
              readOnly: true
            - name: etc-systemd
              mountPath: /etc/systemd
              readOnly: true
            - name: etc-kubernetes
              mountPath: /etc/kubernetes
              readOnly: true
            - name: usr-bin
              mountPath: /usr/local/mount-from-host/bin
              readOnly: true
      volumes:
        - name: var-lib-etcd
          hostPath:
            path: /var/lib/etcd
        - name: var-lib-kubelet
          hostPath:
            path: /var/lib/kubelet
        - name: etc-systemd
          hostPath:
            path: /etc/systemd
        - name: etc-kubernetes
          hostPath:
            path: /etc/kubernetes
        - name: usr-bin
          hostPath:
            path: /usr/bin
EOF
```

```bash
kubectl apply -f manifests/kube-bench/02-kube-bench-json-job.yaml
```

```bash
kubectl -n "${KUBE_BENCH_NS}" wait \
  --for=condition=complete \
  job/"${KUBE_BENCH_JSON_JOB}" \
  --timeout=180s
```

```bash
export KUBE_BENCH_JSON_POD="$(kubectl -n "${KUBE_BENCH_NS}" get pods \
  -l job-name="${KUBE_BENCH_JSON_JOB}" \
  --sort-by=.metadata.creationTimestamp \
  -o jsonpath='{.items[-1].metadata.name}')"
echo "${KUBE_BENCH_JSON_POD}" | tee reports/12-kube-bench-json-pod.txt
```

```bash
kubectl -n "${KUBE_BENCH_NS}" logs "${KUBE_BENCH_JSON_POD}" \
  | tee reports/13-kube-bench-results.json
```

```bash
jq . reports/13-kube-bench-results.json >/dev/null && echo "JSON valide"
```

## Analyse des résultats CIS

### 14. Créer le script de synthèse

```bash
cat > scripts/kube-bench-summary.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

REPORT="${1:-reports/13-kube-bench-results.json}"

echo "# Synthèse kube-bench"
echo

echo "## Nombre de contrôles par statut"
jq -r '[.Controls[]?.tests[]?.results[]?] | group_by(.status) | map({status: .[0].status, count: length}) | .[] | "\(.status)\t\(.count)"' "$REPORT"
echo

echo "## Contrôles FAIL"
jq -r '.Controls[]?.tests[]?.results[]? | select(.status == "FAIL") | [.test_number, .test_desc] | @tsv' "$REPORT"
echo

echo "## Contrôles WARN"
jq -r '.Controls[]?.tests[]?.results[]? | select(.status == "WARN") | [.test_number, .test_desc] | @tsv' "$REPORT"
EOF
```

```bash
chmod +x scripts/kube-bench-summary.sh
./scripts/kube-bench-summary.sh reports/13-kube-bench-results.json \
  | tee reports/14-kube-bench-summary.txt
```

### 15. Extraire les contrôles en échec

```bash
jq -r '.Controls[]?.tests[]?.results[]? | select(.status == "FAIL") | [.test_number, .test_desc, .remediation] | @tsv' \
  reports/13-kube-bench-results.json \
  | tee reports/15-kube-bench-failures.tsv
```

```bash
head -n 20 reports/15-kube-bench-failures.tsv
```

### 16. Extraire les remédiations

```bash
jq -r '.Controls[]?.tests[]?.results[]? | select(.status == "FAIL" or .status == "WARN") | "### " + .test_number + " - " + .test_desc + "\n\n" + (.remediation // "Aucune remédiation fournie") + "\n"' \
  reports/13-kube-bench-results.json \
  | tee reports/16-kube-bench-remediations.md
```

```bash
head -n 80 reports/16-kube-bench-remediations.md
```

### 17. Identifier les familles de contrôles

```bash
grep -Ei "api server|apiserver" reports/11-kube-bench-text-results.txt \
  | tee reports/17-api-server-controls.txt || true
grep -Ei "etcd" reports/11-kube-bench-text-results.txt \
  | tee reports/18-etcd-controls.txt || true
grep -Ei "kubelet" reports/11-kube-bench-text-results.txt \
  | tee reports/19-kubelet-controls.txt || true
grep -Ei "policy|policies|rbac|network" reports/11-kube-bench-text-results.txt \
  | tee reports/20-policy-controls.txt || true
```

### 18. Créer une synthèse des domaines CIS

```bash
cat > reports/21-cis-domains-summary.md <<'EOF'
# Domaines de durcissement Kubernetes

| Domaine | Ce que kube-bench vérifie |
|---|---|
| API Server | Paramètres de sécurité du serveur d'API Kubernetes |
| etcd | Sécurité de la base de données du cluster |
| Controller Manager | Configuration du contrôleur Kubernetes |
| Scheduler | Configuration du scheduler |
| Kubelet | Configuration de l'agent présent sur les nœuds |
| RBAC et policies | Usage des permissions, politiques et contrôles d'accès |

## Lecture des statuts

| Statut | Signification |
|---|---|
| PASS | Le contrôle est conforme |
| FAIL | Le contrôle est non conforme |
| WARN | Le contrôle nécessite une vérification manuelle |
| INFO | Le contrôle est informatif |
EOF
```

```bash
cat reports/21-cis-domains-summary.md
```

## Corrections applicatives simples

### 19. Créer un Pod sécurisé

```bash
cat > manifests/secure/01-secure-pod.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: secure-nginx
  namespace: ${NS_SECURE}
  labels:
    app: secure-nginx
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
        allowPrivilegeEscalation: false
        privileged: false
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

### 20. Créer une NetworkPolicy default-deny

```bash
cat > manifests/secure/02-networkpolicy.yaml <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: ${NS_SECURE}
spec:
  podSelector: {}
  policyTypes:
    - Ingress
EOF
```

```bash
kubectl apply -f manifests/secure/
kubectl -n "${NS_SECURE}" wait --for=condition=Ready pod/secure-nginx --timeout=120s
kubectl -n "${NS_SECURE}" get pod secure-nginx -o wide | tee reports/22-secure-pod.txt
kubectl -n "${NS_SECURE}" get networkpolicy | tee reports/23-secure-networkpolicy.txt
```

### 21. Inspecter le Pod sécurisé

```bash
kubectl -n "${NS_SECURE}" get pod secure-nginx -o json \
  | jq '{
      automountServiceAccountToken: .spec.automountServiceAccountToken,
      runAsNonRoot: .spec.securityContext.runAsNonRoot,
      seccompProfile: .spec.securityContext.seccompProfile.type,
      allowPrivilegeEscalation: .spec.containers[0].securityContext.allowPrivilegeEscalation,
      privileged: .spec.containers[0].securityContext.privileged,
      readOnlyRootFilesystem: .spec.containers[0].securityContext.readOnlyRootFilesystem,
      runAsUser: .spec.containers[0].securityContext.runAsUser,
      capabilitiesDrop: .spec.containers[0].securityContext.capabilities.drop,
      resources: .spec.containers[0].resources
    }' \
  | tee reports/24-secure-pod-summary.json
```

## Relance du benchmark

Les Jobs de la relance utilisent des noms différents pour éviter tout conflit avec les anciens Pods.

### 22. Créer les Jobs kube-bench pour la relance

```bash
cat > manifests/kube-bench/03-kube-bench-text-job-after.yaml <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: ${KUBE_BENCH_TEXT_JOB_AFTER}
  namespace: ${KUBE_BENCH_NS}
spec:
  template:
    spec:
      hostPID: true
      restartPolicy: Never
      containers:
        - name: kube-bench
          image: aquasec/kube-bench:v0.15.4
          command:
            - kube-bench
            - run
          volumeMounts:
            - name: var-lib-etcd
              mountPath: /var/lib/etcd
              readOnly: true
            - name: var-lib-kubelet
              mountPath: /var/lib/kubelet
              readOnly: true
            - name: etc-systemd
              mountPath: /etc/systemd
              readOnly: true
            - name: etc-kubernetes
              mountPath: /etc/kubernetes
              readOnly: true
            - name: usr-bin
              mountPath: /usr/local/mount-from-host/bin
              readOnly: true
      volumes:
        - name: var-lib-etcd
          hostPath:
            path: /var/lib/etcd
        - name: var-lib-kubelet
          hostPath:
            path: /var/lib/kubelet
        - name: etc-systemd
          hostPath:
            path: /etc/systemd
        - name: etc-kubernetes
          hostPath:
            path: /etc/kubernetes
        - name: usr-bin
          hostPath:
            path: /usr/bin
EOF
```

```bash
cat > manifests/kube-bench/04-kube-bench-json-job-after.yaml <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: ${KUBE_BENCH_JSON_JOB_AFTER}
  namespace: ${KUBE_BENCH_NS}
spec:
  template:
    spec:
      hostPID: true
      restartPolicy: Never
      containers:
        - name: kube-bench
          image: aquasec/kube-bench:v0.15.4
          command:
            - kube-bench
            - run
            - --json
          volumeMounts:
            - name: var-lib-etcd
              mountPath: /var/lib/etcd
              readOnly: true
            - name: var-lib-kubelet
              mountPath: /var/lib/kubelet
              readOnly: true
            - name: etc-systemd
              mountPath: /etc/systemd
              readOnly: true
            - name: etc-kubernetes
              mountPath: /etc/kubernetes
              readOnly: true
            - name: usr-bin
              mountPath: /usr/local/mount-from-host/bin
              readOnly: true
      volumes:
        - name: var-lib-etcd
          hostPath:
            path: /var/lib/etcd
        - name: var-lib-kubelet
          hostPath:
            path: /var/lib/kubelet
        - name: etc-systemd
          hostPath:
            path: /etc/systemd
        - name: etc-kubernetes
          hostPath:
            path: /etc/kubernetes
        - name: usr-bin
          hostPath:
            path: /usr/bin
EOF
```

### 23. Exécuter les Jobs de relance

```bash
kubectl apply -f manifests/kube-bench/03-kube-bench-text-job-after.yaml
kubectl -n "${KUBE_BENCH_NS}" wait \
  --for=condition=complete \
  job/"${KUBE_BENCH_TEXT_JOB_AFTER}" \
  --timeout=180s

export KUBE_BENCH_TEXT_POD_AFTER="$(kubectl -n "${KUBE_BENCH_NS}" get pods \
  -l job-name="${KUBE_BENCH_TEXT_JOB_AFTER}" \
  --sort-by=.metadata.creationTimestamp \
  -o jsonpath='{.items[-1].metadata.name}')"
kubectl -n "${KUBE_BENCH_NS}" logs "${KUBE_BENCH_TEXT_POD_AFTER}" \
  | tee reports/25-kube-bench-text-results-after.txt
```

```bash
kubectl apply -f manifests/kube-bench/04-kube-bench-json-job-after.yaml
kubectl -n "${KUBE_BENCH_NS}" wait \
  --for=condition=complete \
  job/"${KUBE_BENCH_JSON_JOB_AFTER}" \
  --timeout=180s

export KUBE_BENCH_JSON_POD_AFTER="$(kubectl -n "${KUBE_BENCH_NS}" get pods \
  -l job-name="${KUBE_BENCH_JSON_JOB_AFTER}" \
  --sort-by=.metadata.creationTimestamp \
  -o jsonpath='{.items[-1].metadata.name}')"
kubectl -n "${KUBE_BENCH_NS}" logs "${KUBE_BENCH_JSON_POD_AFTER}" \
  | tee reports/26-kube-bench-results-after.json
```

### 24. Créer le script de comparaison

```bash
cat > scripts/compare-kube-bench.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

BEFORE="${1:-reports/13-kube-bench-results.json}"
AFTER="${2:-reports/26-kube-bench-results-after.json}"

count_status() {
  local file="$1"
  local status="$2"
  jq --arg status "$status" '[.Controls[]?.tests[]?.results[]? | select(.status == $status)] | length' "$file"
}

cat <<REPORT
# Comparaison kube-bench

| Statut | Avant | Après |
|---|---:|---:|
| PASS | $(count_status "$BEFORE" "PASS") | $(count_status "$AFTER" "PASS") |
| FAIL | $(count_status "$BEFORE" "FAIL") | $(count_status "$AFTER" "FAIL") |
| WARN | $(count_status "$BEFORE" "WARN") | $(count_status "$AFTER" "WARN") |
| INFO | $(count_status "$BEFORE" "INFO") | $(count_status "$AFTER" "INFO") |

## Interprétation

Les corrections applicatives peuvent améliorer certaines pratiques de workloads.
Les contrôles kube-bench portent surtout sur la configuration du cluster, des composants et des nœuds.
Un cluster Kind local peut conserver des écarts non corrigibles dans ce TP.
REPORT
EOF
```

```bash
chmod +x scripts/compare-kube-bench.sh
./scripts/compare-kube-bench.sh \
  reports/13-kube-bench-results.json \
  reports/26-kube-bench-results-after.json \
  | tee reports/27-kube-bench-comparison.md
```

```bash
cat reports/27-kube-bench-comparison.md
```

## Rapport de synthèse

### 25. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP : Vérifier CIS Kubernetes Benchmark avec kube-bench"
  echo
  echo "## Environnement"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| TP | ${TP_NAME} |"
  echo "| Cluster Kind | ${KIND_CLUSTER_NAME} |"
  echo "| Namespace démo | ${NS_DEMO} |"
  echo "| Namespace corrigé | ${NS_SECURE} |"
  echo "| Namespace kube-bench | ${KUBE_BENCH_NS} |"
  echo "| Version kube-bench | v0.15.4 |"
  echo
  echo "## Scans réalisés"
  echo
  echo "| Scan | Rapport |"
  echo "|---|---|"
  echo "| kube-bench local | reports/08-kube-bench-local.txt |"
  echo "| kube-bench Job texte | reports/11-kube-bench-text-results.txt |"
  echo "| kube-bench Job JSON | reports/13-kube-bench-results.json |"
  echo "| Failures | reports/15-kube-bench-failures.tsv |"
  echo "| Remédiations | reports/16-kube-bench-remediations.md |"
  echo "| Comparaison | reports/27-kube-bench-comparison.md |"
  echo
  echo "## Corrections applicatives"
  echo
  echo "| Correction | Ressource |"
  echo "|---|---|"
  echo "| Désactivation du token automatique | Pod sécurisé |"
  echo "| Exécution non-root | Pod sécurisé |"
  echo "| Seccomp RuntimeDefault | Pod sécurisé |"
  echo "| Escalade de privilèges désactivée | Pod sécurisé |"
  echo "| Capabilities supprimées | Pod sécurisé |"
  echo "| Filesystem en lecture seule | Pod sécurisé |"
  echo "| Requests et limits | Pod sécurisé |"
  echo "| NetworkPolicy default-deny | Namespace sécurisé |"
  echo
  echo "## Note"
  echo
  echo "kube-bench doit produire un rapport avec des statuts PASS, FAIL, WARN et INFO."
  echo "Certaines non-conformités peuvent rester présentes car Kind est un cluster local pédagogique."
} > reports/rapport-tp-kube-bench-cis.md
```

### 26. Afficher le rapport

```bash
cat reports/rapport-tp-kube-bench-cis.md
```

### 27. Lister les fichiers générés

```bash
find . -maxdepth 4 -type f | sort \
  | tee reports/28-generated-files.txt
```

## Nettoyage

### 28. Supprimer les Jobs kube-bench

```bash
kubectl -n "${KUBE_BENCH_NS}" delete job \
  "${KUBE_BENCH_TEXT_JOB}" \
  "${KUBE_BENCH_JSON_JOB}" \
  "${KUBE_BENCH_TEXT_JOB_AFTER}" \
  "${KUBE_BENCH_JSON_JOB_AFTER}" \
  --ignore-not-found
```

```bash
kubectl -n "${KUBE_BENCH_NS}" get jobs | tee reports/29-jobs-after-cleanup.txt
```

### 29. Supprimer les ressources applicatives

```bash
kubectl delete -f manifests/demo/ --ignore-not-found
kubectl delete -f manifests/secure/ --ignore-not-found
kubectl delete namespace "${NS_DEMO}" --ignore-not-found
kubectl delete namespace "${NS_SECURE}" --ignore-not-found
```

```bash
kubectl get namespaces | tee reports/30-namespaces-after-cleanup.txt
```

### 30. Supprimer le cluster Kind

```bash
kind delete cluster --name "${KIND_CLUSTER_NAME}"
```

```bash
kind get clusters | tee reports/31-kind-clusters-after-delete.txt || true
```

### 31. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-kube-bench-cis
```

## Résultat attendu

À la fin du TP, les éléments suivants doivent avoir été validés :

| Élément | Validation |
|---|---|
| Cluster Kind | Cluster local créé |
| kube-bench local | Commande testée |
| kube-bench Job | Job exécuté dans Kubernetes |
| Rapport texte | Résultats lisibles dans `reports/11-kube-bench-text-results.txt` |
| Rapport JSON | Résultats structurés dans `reports/13-kube-bench-results.json` |
| Analyse | Contrôles FAIL et WARN extraits |
| Remédiations | Remédiations exportées dans un fichier Markdown |
| Correction workload | Pod sécurisé et NetworkPolicy créés |
| Comparaison | Résultats avant et après comparés |
| Nettoyage | Cluster Kind supprimé |

Aucune ressource cloud, aucune clé AWS et aucun compte externe ne sont utilisés pendant ce TP.
