---
title: "TP : Scanner un cluster Kubernetes avec Kubescape"
date: 2026-06-15
description: Créer un cluster Kind, déployer des ressources vulnérables, scanner manifests et cluster avec Kubescape (NSA, MITRE), utiliser un seuil de conformité comme gate CI, corriger les non-conformités et comparer les résultats.
---

## Prérequis

### Environnement technique

* Docker installé et fonctionnel.
* Kind installé.
* kubectl installé.
* Kubescape installé.
* jq installé pour lire et filtrer les sorties JSON.
* Accès à un terminal Bash ou Zsh.
* Accès Internet pour télécharger les images Docker et les frameworks Kubescape.

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

Installer Kubescape :

```bash
curl -s https://raw.githubusercontent.com/kubescape/kubescape/master/install.sh | /bin/bash
export PATH="$HOME/.kubescape/bin:$PATH"
```

#### Sur macOS

```bash
brew install kind
brew install kubectl
brew install kubescape
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
kubescape version
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

Ce TP crée un cluster Kubernetes local volontairement vulnérable.

Aucune ressource cloud n'est créée.

Le cluster doit être supprimé à la fin du TP.

Kubescape télécharge les frameworks (NSA, MITRE) à la première utilisation. Un accès Internet est nécessaire.

La commande `kubescape scan image` requiert que l'image soit accessible depuis le poste local. Elle peut prendre plusieurs minutes selon la connexion.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Créer un cluster Kubernetes local avec Kind.
* Déployer des ressources volontairement non conformes.
* Scanner des manifests YAML avec Kubescape avant déploiement.
* Scanner un cluster actif avec Kubescape.
* Cibler un namespace précis avec Kubescape.
* Utiliser un seuil de conformité pour bloquer une pipeline.
* Scanner une image de conteneur avec Kubescape.
* Corriger les non-conformités et redéployer.
* Comparer les résultats avant et après correction.
* Produire un rapport local des résultats.

## Mauvaises pratiques déployées

| Catégorie | Mauvaise pratique |
|---|---|
| Pod | Conteneur privilégié |
| Pod | Exécution en root |
| Pod | `allowPrivilegeEscalation=true` |
| Pod | Absence de limites CPU et mémoire |
| Pod | Absence de `seccompProfile` |
| Pod | Montage `hostPath` sur `/` |
| ServiceAccount | Token monté automatiquement |
| RBAC | ServiceAccount lié à `cluster-admin` |
| Secret | Secret applicatif en clair dans un manifest |
| Network | Absence de NetworkPolicy |

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-kubescape-cluster-scan
cd tp-kubescape-cluster-scan

mkdir -p kind manifests/vulnerable manifests/secure scripts reports
```

```bash
find . -maxdepth 3 -type d | sort
```

Résultat attendu :

```text
.
./kind
./manifests
./manifests/secure
./manifests/vulnerable
./reports
./scripts
```

### 2. Définir les variables du TP

```bash
cat > scripts/env.sh <<'EOF'
export TP_NAME="tp-kubescape-cluster-scan"
export KIND_CLUSTER_NAME="kubescape-lab"
export KIND_CONFIG_FILE="kind/kind-config.yaml"
export NS_APP="demo-vulnerable"
export NS_SECURE="demo-secure"
export VULNERABLE_APP_NAME="vulnerable-web"
export SECURE_APP_NAME="secure-web"
export BAD_SERVICE_ACCOUNT="bad-admin-sa"
export LIMITED_SERVICE_ACCOUNT="limited-reader-sa"
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
echo "$NS_SECURE"
```

### 3. Créer un diagnostic des outils

```bash
{
  echo "# Diagnostic outils TP Kubescape"
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
  echo "## Kubescape"
  kubescape version 2>/dev/null || echo "Non disponible"
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
name: kubescape-lab
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
kubescape-lab
```

```bash
kubectl config current-context | tee reports/02-kubectl-context.txt
```

Résultat attendu :

```text
kind-kubescape-lab
```

### 6. Vérifier les nœuds

```bash
kubectl get nodes -o wide | tee reports/03-nodes.txt
```

## Création des ressources vulnérables

### 7. Créer les namespaces

```bash
kubectl create namespace "${NS_APP}"
kubectl create namespace "${NS_SECURE}"
```

```bash
kubectl label namespace "${NS_APP}" environment=dev security=weak --overwrite
kubectl label namespace "${NS_SECURE}" environment=dev security=improved --overwrite
```

```bash
kubectl get namespaces --show-labels | tee reports/04-namespaces.txt
```

### 8. Créer un Secret vulnérable

```bash
cat > manifests/vulnerable/01-secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: ${NS_APP}
type: Opaque
stringData:
  database-password: "SuperSecretPassword123!"
  api-key: "AKIAIOSFODNN7EXAMPLE"
EOF
```

```bash
cat manifests/vulnerable/01-secret.yaml
```

### 9. Créer un ServiceAccount trop privilégié

```bash
cat > manifests/vulnerable/02-serviceaccount.yaml <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${BAD_SERVICE_ACCOUNT}
  namespace: ${NS_APP}
automountServiceAccountToken: true
EOF
```

### 10. Créer un ClusterRoleBinding dangereux

```bash
cat > manifests/vulnerable/03-cluster-admin-binding.yaml <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: bad-admin-sa-cluster-admin
subjects:
  - kind: ServiceAccount
    name: ${BAD_SERVICE_ACCOUNT}
    namespace: ${NS_APP}
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
EOF
```

### 11. Créer un Pod vulnérable

```bash
cat > manifests/vulnerable/04-vulnerable-pod.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: ${VULNERABLE_APP_NAME}
  namespace: ${NS_APP}
  labels:
    app: ${VULNERABLE_APP_NAME}
spec:
  serviceAccountName: ${BAD_SERVICE_ACCOUNT}
  automountServiceAccountToken: true
  containers:
    - name: web
      image: nginx:1.25
      ports:
        - containerPort: 80
      env:
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: database-password
      securityContext:
        privileged: true
        allowPrivilegeEscalation: true
        runAsUser: 0
      volumeMounts:
        - name: host-root
          mountPath: /host
  volumes:
    - name: host-root
      hostPath:
        path: /
        type: Directory
EOF
```

### 12. Créer un Deployment vulnérable

```bash
cat > manifests/vulnerable/05-vulnerable-deployment.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vulnerable-deployment
  namespace: ${NS_APP}
  labels:
    app: vulnerable-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vulnerable-deployment
  template:
    metadata:
      labels:
        app: vulnerable-deployment
    spec:
      containers:
        - name: web
          image: nginx:1.25
          ports:
            - containerPort: 80
          securityContext:
            allowPrivilegeEscalation: true
EOF
```

### 13. Scanner les manifests avant déploiement

```bash
kubescape scan framework nsa manifests/vulnerable \
  --format json \
  --format-version v2 \
  --output reports/05-kubescape-manifests-vulnerable-nsa.json || true
```

```bash
kubescape scan framework nsa manifests/vulnerable \
  --verbose \
  | tee reports/06-kubescape-manifests-vulnerable-nsa.txt || true
```

Résultat attendu : des contrôles doivent échouer.

### 14. Déployer les ressources vulnérables

```bash
kubectl apply -f manifests/vulnerable/
```

```bash
kubectl -n "${NS_APP}" wait --for=condition=Ready pod/"${VULNERABLE_APP_NAME}" --timeout=120s
kubectl -n "${NS_APP}" rollout status deployment/vulnerable-deployment
kubectl get all -n "${NS_APP}" | tee reports/07-vulnerable-resources.txt
```

### 15. Vérifier les droits RBAC dangereux

```bash
kubectl auth can-i '*' '*' \
  --as="system:serviceaccount:${NS_APP}:${BAD_SERVICE_ACCOUNT}" \
  | tee reports/08-bad-sa-can-i-all.txt
```

Résultat attendu : `yes`.

```bash
kubectl auth can-i get secrets \
  -A \
  --as="system:serviceaccount:${NS_APP}:${BAD_SERVICE_ACCOUNT}" \
  | tee reports/09-bad-sa-can-get-secrets.txt
```

Résultat attendu : `yes`.

### 16. Inspecter le Pod vulnérable

```bash
kubectl -n "${NS_APP}" get pod "${VULNERABLE_APP_NAME}" -o json \
  | jq '{
      serviceAccountName: .spec.serviceAccountName,
      automountServiceAccountToken: .spec.automountServiceAccountToken,
      privileged: .spec.containers[0].securityContext.privileged,
      allowPrivilegeEscalation: .spec.containers[0].securityContext.allowPrivilegeEscalation,
      runAsUser: .spec.containers[0].securityContext.runAsUser,
      hostPath: .spec.volumes[0].hostPath,
      resources: .spec.containers[0].resources
    }' \
  | tee reports/10-vulnerable-pod-summary.json
```

## Scan du cluster avec Kubescape

### 17. Lancer un scan global du cluster

```bash
kubescape scan \
  --format json \
  --format-version v2 \
  --output reports/11-kubescape-cluster-global.json || true
```

```bash
kubescape scan --verbose \
  | tee reports/12-kubescape-cluster-global.txt || true
```

### 18. Scanner le cluster avec le framework NSA

```bash
kubescape scan framework nsa \
  --format json \
  --format-version v2 \
  --output reports/13-kubescape-cluster-nsa.json || true
```

```bash
kubescape scan framework nsa --verbose \
  | tee reports/14-kubescape-cluster-nsa.txt || true
```

### 19. Scanner uniquement le namespace vulnérable

```bash
kubescape scan framework nsa \
  --include-namespaces "${NS_APP}" \
  --format json \
  --format-version v2 \
  --output reports/15-kubescape-namespace-vulnerable-nsa.json || true
```

```bash
kubescape scan framework nsa \
  --include-namespaces "${NS_APP}" \
  --verbose \
  | tee reports/16-kubescape-namespace-vulnerable-nsa.txt || true
```

### 20. Scanner avec un seuil de conformité

```bash
set +e
kubescape scan framework nsa \
  --include-namespaces "${NS_APP}" \
  --compliance-threshold 80 \
  | tee reports/17-kubescape-compliance-threshold.txt
KUBESCAPE_STATUS=${PIPESTATUS[0]}
set -e

echo "${KUBESCAPE_STATUS}" | tee reports/18-kubescape-compliance-threshold-status.txt
```

```bash
if [ "${KUBESCAPE_STATUS}" -ne 0 ]; then
  echo "Gate refusé : score de conformité inférieur au seuil." \
    | tee reports/19-kubescape-gate-result.txt
else
  echo "Gate accepté : score de conformité suffisant." \
    | tee reports/19-kubescape-gate-result.txt
fi
```

Résultat attendu :

```text
Gate refusé
```

### 21. Extraire les findings ciblés

```bash
grep -Ei "${VULNERABLE_APP_NAME}|bad-admin|cluster-admin|privileged|hostPath|automount|ServiceAccount|Secret" \
  reports/14-kubescape-cluster-nsa.txt \
  | tee reports/20-kubescape-target-findings.txt || true
```

```bash
grep -Ei "Critical|High|Medium|Low|Failed|Action Required" \
  reports/14-kubescape-cluster-nsa.txt \
  | tee reports/21-kubescape-severity-summary.txt || true
```

### 22. Scanner l'image utilisée

Cette commande télécharge l'image depuis le registre public. Elle peut prendre plusieurs minutes.

```bash
kubescape scan image nginx:1.25 \
  --format json \
  --format-version v2 \
  --output reports/22-kubescape-image-nginx.json || true
```

```bash
kubescape scan image nginx:1.25 \
  | tee reports/23-kubescape-image-nginx.txt || true
```

## Correction des ressources

### 23. Supprimer les ressources vulnérables

```bash
kubectl delete -f manifests/vulnerable/ --ignore-not-found
kubectl get all -n "${NS_APP}" | tee reports/24-after-vulnerable-delete.txt || true
```

### 24. Créer un ServiceAccount limité

```bash
cat > manifests/secure/01-serviceaccount.yaml <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${LIMITED_SERVICE_ACCOUNT}
  namespace: ${NS_SECURE}
automountServiceAccountToken: false
EOF
```

### 25. Créer un Role limité

```bash
cat > manifests/secure/02-role.yaml <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: ${NS_SECURE}
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
EOF
```

### 26. Créer un RoleBinding limité

```bash
cat > manifests/secure/03-rolebinding.yaml <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: limited-reader-binding
  namespace: ${NS_SECURE}
subjects:
  - kind: ServiceAccount
    name: ${LIMITED_SERVICE_ACCOUNT}
    namespace: ${NS_SECURE}
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
EOF
```

### 27. Créer un Pod sécurisé

```bash
cat > manifests/secure/04-secure-pod.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: ${SECURE_APP_NAME}
  namespace: ${NS_SECURE}
  labels:
    app: ${SECURE_APP_NAME}
spec:
  serviceAccountName: ${LIMITED_SERVICE_ACCOUNT}
  automountServiceAccountToken: false
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: web
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

### 28. Créer une NetworkPolicy restrictive

```bash
cat > manifests/secure/05-networkpolicy.yaml <<EOF
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

### 29. Scanner les manifests corrigés avant déploiement

```bash
kubescape scan framework nsa manifests/secure \
  --format json \
  --format-version v2 \
  --output reports/25-kubescape-manifests-secure-nsa.json || true
```

```bash
kubescape scan framework nsa manifests/secure \
  --verbose \
  | tee reports/26-kubescape-manifests-secure-nsa.txt || true
```

### 30. Déployer les ressources corrigées

```bash
kubectl apply -f manifests/secure/
```

```bash
kubectl -n "${NS_SECURE}" wait --for=condition=Ready pod/"${SECURE_APP_NAME}" --timeout=120s
kubectl get all -n "${NS_SECURE}" | tee reports/27-secure-resources.txt
```

### 31. Vérifier les droits limités

```bash
kubectl auth can-i get pods \
  -n "${NS_SECURE}" \
  --as="system:serviceaccount:${NS_SECURE}:${LIMITED_SERVICE_ACCOUNT}" \
  | tee reports/28-limited-sa-can-get-pods.txt
```

Résultat attendu : `yes`.

```bash
kubectl auth can-i delete pods \
  -n "${NS_SECURE}" \
  --as="system:serviceaccount:${NS_SECURE}:${LIMITED_SERVICE_ACCOUNT}" \
  | tee reports/29-limited-sa-can-delete-pods.txt
```

Résultat attendu : `no`.

```bash
kubectl auth can-i get secrets \
  -n "${NS_SECURE}" \
  --as="system:serviceaccount:${NS_SECURE}:${LIMITED_SERVICE_ACCOUNT}" \
  | tee reports/30-limited-sa-can-get-secrets.txt
```

Résultat attendu : `no`.

### 32. Inspecter le Pod sécurisé

```bash
kubectl -n "${NS_SECURE}" get pod "${SECURE_APP_NAME}" -o json \
  | jq '{
      serviceAccountName: .spec.serviceAccountName,
      automountServiceAccountToken: .spec.automountServiceAccountToken,
      podRunAsNonRoot: .spec.securityContext.runAsNonRoot,
      seccompProfile: .spec.securityContext.seccompProfile.type,
      privileged: .spec.containers[0].securityContext.privileged,
      allowPrivilegeEscalation: .spec.containers[0].securityContext.allowPrivilegeEscalation,
      readOnlyRootFilesystem: .spec.containers[0].securityContext.readOnlyRootFilesystem,
      runAsUser: .spec.containers[0].securityContext.runAsUser,
      capabilitiesDrop: .spec.containers[0].securityContext.capabilities.drop,
      resources: .spec.containers[0].resources
    }' \
  | tee reports/31-secure-pod-summary.json
```

## Scan après correction

### 33. Scanner le namespace corrigé

```bash
kubescape scan framework nsa \
  --include-namespaces "${NS_SECURE}" \
  --format json \
  --format-version v2 \
  --output reports/32-kubescape-namespace-secure-nsa.json || true
```

```bash
kubescape scan framework nsa \
  --include-namespaces "${NS_SECURE}" \
  --verbose \
  | tee reports/33-kubescape-namespace-secure-nsa.txt || true
```

### 34. Comparer les deux namespaces

```bash
kubescape scan framework nsa \
  --include-namespaces "${NS_APP}" \
  --verbose \
  | tee reports/34-kubescape-namespace-vulnerable-final.txt || true
```

```bash
kubescape scan framework nsa \
  --include-namespaces "${NS_SECURE}" \
  --verbose \
  | tee reports/35-kubescape-namespace-secure-final.txt || true
```

```bash
cat > reports/36-kubescape-comparison.md <<EOF
# Comparaison Kubescape

## Namespace vulnérable

${NS_APP}

- reports/34-kubescape-namespace-vulnerable-final.txt
- reports/15-kubescape-namespace-vulnerable-nsa.json

## Namespace corrigé

${NS_SECURE}

- reports/35-kubescape-namespace-secure-final.txt
- reports/32-kubescape-namespace-secure-nsa.json

## Résultat attendu

Le namespace corrigé doit présenter moins de non-conformités liées aux workloads applicatifs.

Certaines alertes peuvent rester liées au cluster Kind lui-même, car il s'agit d'un cluster local de formation.
EOF
```

```bash
cat reports/36-kubescape-comparison.md
```

### 35. Créer un gate Kubescape sur le namespace corrigé

```bash
set +e
kubescape scan framework nsa \
  --include-namespaces "${NS_SECURE}" \
  --compliance-threshold 60 \
  | tee reports/37-kubescape-secure-threshold.txt
SECURE_GATE_STATUS=${PIPESTATUS[0]}
set -e

echo "${SECURE_GATE_STATUS}" | tee reports/38-kubescape-secure-threshold-status.txt
```

```bash
if [ "${SECURE_GATE_STATUS}" -ne 0 ]; then
  echo "Gate encore refusé : des améliorations restent nécessaires ou le cluster Kind porte des écarts non corrigibles dans ce TP." \
    | tee reports/39-kubescape-secure-gate-result.txt
else
  echo "Gate accepté : seuil de conformité atteint." \
    | tee reports/39-kubescape-secure-gate-result.txt
fi
```

## Rapport de synthèse

### 36. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP : Scanner un cluster Kubernetes avec Kubescape"
  echo
  echo "## Environnement"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| TP | ${TP_NAME} |"
  echo "| Cluster Kind | ${KIND_CLUSTER_NAME} |"
  echo "| Namespace vulnérable | ${NS_APP} |"
  echo "| Namespace corrigé | ${NS_SECURE} |"
  echo "| Pod vulnérable | ${VULNERABLE_APP_NAME} |"
  echo "| Pod corrigé | ${SECURE_APP_NAME} |"
  echo
  echo "## Scans réalisés"
  echo
  echo "| Scan | Rapport |"
  echo "|---|---|"
  echo "| Manifests vulnérables NSA | reports/05-kubescape-manifests-vulnerable-nsa.json |"
  echo "| Cluster global | reports/11-kubescape-cluster-global.json |"
  echo "| Cluster NSA | reports/13-kubescape-cluster-nsa.json |"
  echo "| Namespace vulnérable NSA | reports/15-kubescape-namespace-vulnerable-nsa.json |"
  echo "| Image nginx | reports/22-kubescape-image-nginx.json |"
  echo "| Manifests corrigés NSA | reports/25-kubescape-manifests-secure-nsa.json |"
  echo "| Namespace corrigé NSA | reports/32-kubescape-namespace-secure-nsa.json |"
  echo
  echo "## Mauvaises pratiques détectées"
  echo
  echo "| Catégorie | Exemple |"
  echo "|---|---|"
  echo "| Pod | Conteneur privilégié |"
  echo "| Pod | Exécution en root |"
  echo "| Pod | Escalade de privilèges autorisée |"
  echo "| Pod | Montage hostPath |"
  echo "| Pod | Pas de limites CPU et mémoire |"
  echo "| RBAC | ServiceAccount lié à cluster-admin |"
  echo "| Secret | Secret applicatif dans un manifest |"
  echo "| Network | Absence de NetworkPolicy |"
  echo
  echo "## Corrections appliquées"
  echo
  echo "| Catégorie | Correction |"
  echo "|---|---|"
  echo "| Pod | Conteneur non privilégié |"
  echo "| Pod | Exécution non-root |"
  echo "| Pod | Escalade de privilèges désactivée |"
  echo "| Pod | Capabilities supprimées |"
  echo "| Pod | Root filesystem en lecture seule |"
  echo "| Pod | Seccomp RuntimeDefault |"
  echo "| Pod | Requests et limits définies |"
  echo "| ServiceAccount | Token non monté automatiquement |"
  echo "| RBAC | Rôle limité à la lecture des Pods |"
  echo "| Network | NetworkPolicy default-deny ingress |"
  echo
  echo "## Note sur les résultats"
  echo
  echo "Le scan du namespace vulnérable doit produire plusieurs non-conformités."
  echo "Le scan du namespace corrigé doit réduire les non-conformités liées aux workloads."
  echo "Certaines alertes peuvent rester présentes car Kind est un cluster local pédagogique et non un cluster de production durci."
} > reports/rapport-tp-kubescape-cluster-scan.md
```

### 37. Afficher le rapport

```bash
cat reports/rapport-tp-kubescape-cluster-scan.md
```

### 38. Lister les fichiers générés

```bash
find . -maxdepth 4 -type f | sort \
  | tee reports/40-generated-files.txt
```

## Nettoyage

### 39. Supprimer les ressources Kubernetes

```bash
kubectl delete -f manifests/secure/ --ignore-not-found
kubectl delete -f manifests/vulnerable/ --ignore-not-found
kubectl delete namespace "${NS_APP}" --ignore-not-found
kubectl delete namespace "${NS_SECURE}" --ignore-not-found
```

```bash
kubectl get namespaces | tee reports/41-namespaces-after-cleanup.txt
```

### 40. Supprimer le cluster Kind

```bash
kind delete cluster --name "${KIND_CLUSTER_NAME}"
```

```bash
kind get clusters | tee reports/42-kind-clusters-after-delete.txt || true
```

### 41. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-kubescape-cluster-scan
```

## Résultat attendu

À la fin du TP, les éléments suivants doivent avoir été validés :

| Élément | Validation |
|---|---|
| Cluster Kind | Cluster local créé |
| Ressources vulnérables | Pods, Secret et RBAC dangereux déployés |
| Scan manifests | Kubescape détecte les erreurs avant déploiement |
| Scan cluster | Kubescape scanne le cluster actif |
| Scan namespace | Kubescape cible le namespace vulnérable |
| Gate sécurité | Le seuil de conformité bloque la version vulnérable |
| Correction | Une version plus sécurisée est déployée |
| Comparaison | Les résultats avant et après correction sont comparés |
| Rapport | Un rapport Markdown est disponible dans `reports/` |
| Nettoyage | Le cluster Kind est supprimé |

Les fichiers suivants doivent avoir été produits :

```text
kind/kind-config.yaml
manifests/secure/01-serviceaccount.yaml
manifests/secure/02-role.yaml
manifests/secure/03-rolebinding.yaml
manifests/secure/04-secure-pod.yaml
manifests/secure/05-networkpolicy.yaml
manifests/vulnerable/01-secret.yaml
manifests/vulnerable/02-serviceaccount.yaml
manifests/vulnerable/03-cluster-admin-binding.yaml
manifests/vulnerable/04-vulnerable-pod.yaml
manifests/vulnerable/05-vulnerable-deployment.yaml
reports/00-tools-diagnostic.txt
reports/05-kubescape-manifests-vulnerable-nsa.json
reports/11-kubescape-cluster-global.json
reports/13-kubescape-cluster-nsa.json
reports/15-kubescape-namespace-vulnerable-nsa.json
reports/22-kubescape-image-nginx.json
reports/32-kubescape-namespace-secure-nsa.json
reports/36-kubescape-comparison.md
reports/rapport-tp-kubescape-cluster-scan.md
scripts/env.sh
```

Aucune ressource cloud, aucune clé AWS et aucun compte externe ne sont utilisés pendant ce TP.
