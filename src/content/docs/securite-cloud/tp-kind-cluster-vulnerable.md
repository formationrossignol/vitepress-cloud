---
title: "TP : Créer un cluster Kind vulnérable et manipuler pods, namespaces et RBAC"
date: 2026-06-14
description: Créer un cluster Kind local, déployer un Pod privilégié et un ServiceAccount lié à cluster-admin, auditer les mauvaises pratiques RBAC, puis corriger avec des permissions minimales et un Pod durci.
---

## Prérequis

### Environnement technique

* Docker installé et fonctionnel.
* kubectl installé.
* Kind installé.
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

Installer Docker si nécessaire :

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

#### Sur macOS

```bash
brew install kind
brew install kubectl
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
kubectl version --client
kind version
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

Il ne doit pas être utilisé pour un usage réel.

Aucune ressource cloud n'est créée.

Le cluster doit être supprimé à la fin du TP.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Créer un cluster Kubernetes local avec Kind.
* Créer et labelliser des namespaces.
* Déployer un Pod volontairement vulnérable.
* Analyser les risques liés à un Security Context permissif.
* Créer des secrets Kubernetes et les exposer à un Pod.
* Créer un ServiceAccount trop privilégié lié à `cluster-admin`.
* Tester des permissions RBAC avec `kubectl auth can-i`.
* Auditer un cluster avec un script bash.
* Corriger les mauvaises pratiques observées.
* Valider que les permissions sont réduites après correction.
* Nettoyer le cluster et le dossier local.

## Mauvaises pratiques déployées

| Catégorie | Mauvaise pratique |
|---|---|
| Pod | Conteneur privilégié |
| Pod | Exécution en root |
| Pod | `allowPrivilegeEscalation=true` |
| Pod | Montage `hostPath` sur `/` |
| Pod | Token ServiceAccount monté automatiquement |
| Secrets | Secret applicatif exposé au Pod |
| RBAC | ServiceAccount lié à `cluster-admin` |
| RBAC | Role avec `resources=["*"]` et `verbs=["*"]` |

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-kind-cluster-vulnerable
cd tp-kind-cluster-vulnerable

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
export TP_NAME="tp-kind-cluster-vulnerable"
export KIND_CLUSTER_NAME="kind-vulnerable"
export KIND_CONFIG_FILE="kind/kind-config.yaml"
export NS_DEV="dev"
export NS_PROD="prod"
export NS_AUDIT="audit"
export VULNERABLE_APP_NAME="vulnerable-web"
export SECURE_APP_NAME="secure-web"
export BAD_SERVICE_ACCOUNT="bad-admin-sa"
export LIMITED_SERVICE_ACCOUNT="limited-reader-sa"
EOF
```

```bash
source scripts/env.sh
```

```bash
echo "$TP_NAME"
echo "$KIND_CLUSTER_NAME"
echo "$NS_DEV"
echo "$NS_PROD"
```

### 3. Créer le fichier de configuration Kind

```bash
cat > kind/kind-config.yaml <<'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: kind-vulnerable
nodes:
  - role: control-plane
  - role: worker
EOF
```

```bash
cat "${KIND_CONFIG_FILE}"
```

### 4. Créer le cluster Kind

```bash
kind create cluster --config "${KIND_CONFIG_FILE}"
```

```bash
kind get clusters | tee reports/01-kind-clusters.txt
```

Résultat attendu :

```text
kind-vulnerable
```

```bash
kubectl config current-context | tee reports/02-kubectl-context.txt
```

Résultat attendu :

```text
kind-kind-vulnerable
```

### 5. Vérifier les nœuds du cluster

```bash
kubectl get nodes -o wide | tee reports/03-nodes.txt
```

```bash
kubectl get namespaces | tee reports/04-namespaces-initial.txt
```

## Création des namespaces

### 6. Créer les namespaces du TP

```bash
kubectl create namespace "${NS_DEV}"
kubectl create namespace "${NS_PROD}"
kubectl create namespace "${NS_AUDIT}"
```

```bash
kubectl get namespaces | tee reports/05-namespaces-created.txt
```

### 7. Ajouter des labels aux namespaces

```bash
kubectl label namespace "${NS_DEV}" environment=dev --overwrite
kubectl label namespace "${NS_PROD}" environment=prod --overwrite
kubectl label namespace "${NS_AUDIT}" environment=audit --overwrite
```

```bash
kubectl get namespaces --show-labels | tee reports/06-namespaces-labels.txt
```

## Déploiement volontairement vulnérable

### 8. Créer un Secret mal utilisé

```bash
cat > manifests/vulnerable/01-secret.yaml <<'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: dev
type: Opaque
stringData:
  database-password: "SuperSecretPassword123!"
  api-key: "AKIAIOSFODNN7EXAMPLE"
EOF
```

```bash
kubectl apply -f manifests/vulnerable/01-secret.yaml
kubectl -n "${NS_DEV}" get secret app-secret | tee reports/07-vulnerable-secret.txt
```

### 9. Créer un ServiceAccount trop privilégié

```bash
cat > manifests/vulnerable/02-bad-serviceaccount.yaml <<'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: bad-admin-sa
  namespace: dev
automountServiceAccountToken: true
EOF
```

```bash
kubectl apply -f manifests/vulnerable/02-bad-serviceaccount.yaml
kubectl -n "${NS_DEV}" get serviceaccount "${BAD_SERVICE_ACCOUNT}" \
  | tee reports/08-bad-serviceaccount.txt
```

### 10. Créer un ClusterRoleBinding dangereux

```bash
cat > manifests/vulnerable/03-cluster-admin-binding.yaml <<'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: bad-admin-sa-cluster-admin
subjects:
  - kind: ServiceAccount
    name: bad-admin-sa
    namespace: dev
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
EOF
```

```bash
kubectl apply -f manifests/vulnerable/03-cluster-admin-binding.yaml
kubectl get clusterrolebinding bad-admin-sa-cluster-admin \
  | tee reports/09-bad-clusterrolebinding.txt
```

### 11. Tester les droits excessifs du ServiceAccount

```bash
kubectl auth can-i '*' '*' \
  --as="system:serviceaccount:${NS_DEV}:${BAD_SERVICE_ACCOUNT}" \
  | tee reports/10-bad-sa-can-i-all.txt
```

Résultat attendu :

```text
yes
```

```bash
kubectl auth can-i get secrets \
  -n "${NS_PROD}" \
  --as="system:serviceaccount:${NS_DEV}:${BAD_SERVICE_ACCOUNT}" \
  | tee reports/11-bad-sa-can-get-prod-secrets.txt
```

Résultat attendu :

```text
yes
```

Cette configuration est volontairement dangereuse. Un ServiceAccount applicatif ne devrait pas disposer du rôle `cluster-admin`.

### 12. Créer un Pod vulnérable

```bash
cat > manifests/vulnerable/04-vulnerable-pod.yaml <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: vulnerable-web
  namespace: dev
  labels:
    app: vulnerable-web
spec:
  serviceAccountName: bad-admin-sa
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

```bash
kubectl apply -f manifests/vulnerable/04-vulnerable-pod.yaml
kubectl -n "${NS_DEV}" wait --for=condition=Ready pod/"${VULNERABLE_APP_NAME}" --timeout=120s
kubectl -n "${NS_DEV}" get pod "${VULNERABLE_APP_NAME}" -o wide \
  | tee reports/12-vulnerable-pod.txt
```

### 13. Inspecter les mauvaises pratiques du Pod

```bash
kubectl -n "${NS_DEV}" get pod "${VULNERABLE_APP_NAME}" -o yaml \
  | tee reports/13-vulnerable-pod-yaml.yaml
```

```bash
kubectl -n "${NS_DEV}" get pod "${VULNERABLE_APP_NAME}" -o json \
  | jq '{
      serviceAccountName: .spec.serviceAccountName,
      automountServiceAccountToken: .spec.automountServiceAccountToken,
      privileged: .spec.containers[0].securityContext.privileged,
      allowPrivilegeEscalation: .spec.containers[0].securityContext.allowPrivilegeEscalation,
      runAsUser: .spec.containers[0].securityContext.runAsUser,
      hostPath: .spec.volumes[0].hostPath
    }' \
  | tee reports/14-vulnerable-pod-security-summary.json
```

Résultat attendu :

```json
{
  "serviceAccountName": "bad-admin-sa",
  "automountServiceAccountToken": true,
  "privileged": true,
  "allowPrivilegeEscalation": true,
  "runAsUser": 0,
  "hostPath": {
    "path": "/",
    "type": "Directory"
  }
}
```

### 14. Manipuler le Pod vulnérable

```bash
kubectl -n "${NS_DEV}" logs "${VULNERABLE_APP_NAME}" \
  | tee reports/15-vulnerable-pod-logs.txt || true
```

```bash
kubectl -n "${NS_DEV}" exec "${VULNERABLE_APP_NAME}" -- id \
  | tee reports/16-vulnerable-pod-id.txt
```

Résultat attendu :

```text
uid=0(root)
```

```bash
kubectl -n "${NS_DEV}" exec "${VULNERABLE_APP_NAME}" -- ls /host \
  | tee reports/17-vulnerable-hostpath-ls.txt
```

Le Pod a accès à une partie du système hôte du nœud Kind via le montage `hostPath`. Dans un cluster réel, ce type de montage est une mauvaise pratique majeure.

## Manipulation des namespaces

### 15. Créer une application dans le namespace prod

```bash
cat > manifests/vulnerable/05-prod-pod.yaml <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: prod-web
  namespace: prod
  labels:
    app: prod-web
spec:
  containers:
    - name: web
      image: nginx:1.25
      ports:
        - containerPort: 80
EOF
```

```bash
kubectl apply -f manifests/vulnerable/05-prod-pod.yaml
kubectl -n "${NS_PROD}" wait --for=condition=Ready pod/prod-web --timeout=120s
kubectl get pods -A | tee reports/18-pods-all-namespaces.txt
```

### 16. Observer l'isolation logique des namespaces

```bash
kubectl -n "${NS_DEV}" get pods | tee reports/19-pods-dev.txt
kubectl -n "${NS_PROD}" get pods | tee reports/20-pods-prod.txt
kubectl get pods -A | tee reports/21-pods-all.txt
```

Les namespaces organisent les ressources, mais ils ne suffisent pas à eux seuls à garantir une isolation forte.

## RBAC volontairement trop permissif

### 17. Créer un Role trop large dans le namespace dev

```bash
cat > manifests/vulnerable/06-wide-role.yaml <<'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: wide-dev-role
  namespace: dev
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
EOF
```

```bash
kubectl apply -f manifests/vulnerable/06-wide-role.yaml
kubectl -n "${NS_DEV}" get role wide-dev-role -o yaml \
  | tee reports/22-wide-role.yaml
```

### 18. Créer un ServiceAccount utilisateur de test

```bash
cat > manifests/vulnerable/07-dev-user-sa.yaml <<'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dev-user-sa
  namespace: dev
EOF
```

```bash
kubectl apply -f manifests/vulnerable/07-dev-user-sa.yaml
```

### 19. Attacher le Role trop large

```bash
cat > manifests/vulnerable/08-wide-rolebinding.yaml <<'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-user-wide-rolebinding
  namespace: dev
subjects:
  - kind: ServiceAccount
    name: dev-user-sa
    namespace: dev
roleRef:
  kind: Role
  name: wide-dev-role
  apiGroup: rbac.authorization.k8s.io
EOF
```

```bash
kubectl apply -f manifests/vulnerable/08-wide-rolebinding.yaml
```

### 20. Tester les droits du ServiceAccount de test

```bash
kubectl auth can-i get pods \
  -n "${NS_DEV}" \
  --as="system:serviceaccount:${NS_DEV}:dev-user-sa" \
  | tee reports/23-dev-user-can-get-pods.txt
```

```bash
kubectl auth can-i delete pods \
  -n "${NS_DEV}" \
  --as="system:serviceaccount:${NS_DEV}:dev-user-sa" \
  | tee reports/24-dev-user-can-delete-pods.txt
```

```bash
kubectl auth can-i get secrets \
  -n "${NS_DEV}" \
  --as="system:serviceaccount:${NS_DEV}:dev-user-sa" \
  | tee reports/25-dev-user-can-get-secrets.txt
```

Résultat attendu : `yes` pour les trois commandes. Cette configuration est trop permissive.

## Audit des mauvaises pratiques

### 21. Créer un script d'audit simple

```bash
cat > scripts/audit-cluster.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "# Audit simple du cluster Kubernetes"
echo

echo "## Pods privilégiés"
kubectl get pods -A -o json \
  | jq -r '.items[] | select([.spec.containers[]?.securityContext.privileged] | any(. == true)) | "\(.metadata.namespace)/\(.metadata.name)"'
echo

echo "## Pods avec allowPrivilegeEscalation=true"
kubectl get pods -A -o json \
  | jq -r '.items[] | select([.spec.containers[]?.securityContext.allowPrivilegeEscalation] | any(. == true)) | "\(.metadata.namespace)/\(.metadata.name)"'
echo

echo "## Pods exécutés explicitement en root"
kubectl get pods -A -o json \
  | jq -r '.items[] | select([.spec.containers[]?.securityContext.runAsUser] | any(. == 0)) | "\(.metadata.namespace)/\(.metadata.name)"'
echo

echo "## Pods avec hostPath"
kubectl get pods -A -o json \
  | jq -r '.items[] | select(.spec.volumes[]?.hostPath) | "\(.metadata.namespace)/\(.metadata.name)"'
echo

echo "## ClusterRoleBindings vers cluster-admin"
kubectl get clusterrolebinding -o json \
  | jq -r '.items[] | select(.roleRef.name == "cluster-admin") | .metadata.name'
echo

echo "## Roles avec wildcard"
kubectl get role -A -o json \
  | jq -r '.items[] | select([.rules[]?.resources[]?] | any(. == "*")) | "\(.metadata.namespace)/\(.metadata.name)"'
EOF
```

```bash
chmod +x scripts/audit-cluster.sh
./scripts/audit-cluster.sh | tee reports/26-audit-vulnerable-cluster.txt
```

Résultat attendu :

```text
dev/vulnerable-web
bad-admin-sa-cluster-admin
dev/wide-dev-role
```

### 22. Inventorier les ressources RBAC

```bash
kubectl get serviceaccounts -A | tee reports/27-serviceaccounts.txt
kubectl get roles -A | tee reports/28-roles.txt
kubectl get rolebindings -A | tee reports/29-rolebindings.txt
kubectl get clusterrolebindings | tee reports/30-clusterrolebindings.txt
```

## Correction des mauvaises pratiques

### 23. Supprimer les ressources vulnérables

```bash
kubectl -n "${NS_DEV}" delete pod "${VULNERABLE_APP_NAME}" --ignore-not-found
kubectl delete clusterrolebinding bad-admin-sa-cluster-admin --ignore-not-found
kubectl -n "${NS_DEV}" delete rolebinding dev-user-wide-rolebinding --ignore-not-found
kubectl -n "${NS_DEV}" delete role wide-dev-role --ignore-not-found
```

### 24. Créer un ServiceAccount limité

```bash
cat > manifests/secure/01-limited-serviceaccount.yaml <<'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: limited-reader-sa
  namespace: dev
automountServiceAccountToken: false
EOF
```

```bash
kubectl apply -f manifests/secure/01-limited-serviceaccount.yaml
```

### 25. Créer un Role de lecture limité

```bash
cat > manifests/secure/02-limited-role.yaml <<'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: dev
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
EOF
```

```bash
kubectl apply -f manifests/secure/02-limited-role.yaml
```

### 26. Attacher le Role limité

```bash
cat > manifests/secure/03-limited-rolebinding.yaml <<'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: limited-reader-binding
  namespace: dev
subjects:
  - kind: ServiceAccount
    name: limited-reader-sa
    namespace: dev
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
EOF
```

```bash
kubectl apply -f manifests/secure/03-limited-rolebinding.yaml
```

### 27. Créer un Pod corrigé

```bash
cat > manifests/secure/04-secure-pod.yaml <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: secure-web
  namespace: dev
  labels:
    app: secure-web
spec:
  serviceAccountName: limited-reader-sa
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

```bash
kubectl apply -f manifests/secure/04-secure-pod.yaml
kubectl -n "${NS_DEV}" wait --for=condition=Ready pod/"${SECURE_APP_NAME}" --timeout=120s
kubectl -n "${NS_DEV}" get pod "${SECURE_APP_NAME}" -o wide \
  | tee reports/31-secure-pod.txt
```

### 28. Vérifier les droits limités

```bash
kubectl auth can-i get pods \
  -n "${NS_DEV}" \
  --as="system:serviceaccount:${NS_DEV}:${LIMITED_SERVICE_ACCOUNT}" \
  | tee reports/32-limited-sa-can-get-pods.txt
```

Résultat attendu : `yes`.

```bash
kubectl auth can-i delete pods \
  -n "${NS_DEV}" \
  --as="system:serviceaccount:${NS_DEV}:${LIMITED_SERVICE_ACCOUNT}" \
  | tee reports/33-limited-sa-can-delete-pods.txt
```

Résultat attendu : `no`.

```bash
kubectl auth can-i get secrets \
  -n "${NS_DEV}" \
  --as="system:serviceaccount:${NS_DEV}:${LIMITED_SERVICE_ACCOUNT}" \
  | tee reports/34-limited-sa-can-get-secrets.txt
```

Résultat attendu : `no`.

### 29. Inspecter le Pod corrigé

```bash
kubectl -n "${NS_DEV}" get pod "${SECURE_APP_NAME}" -o json \
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
  | tee reports/35-secure-pod-security-summary.json
```

### 30. Relancer l'audit

```bash
./scripts/audit-cluster.sh | tee reports/36-audit-after-fix.txt
```

Le Pod vulnérable, le `ClusterRoleBinding` dangereux et le Role wildcard ne doivent plus apparaître.

## Rapport de synthèse

### 31. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP : Cluster Kind vulnérable"
  echo
  echo "## Environnement"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| TP | ${TP_NAME} |"
  echo "| Cluster Kind | ${KIND_CLUSTER_NAME} |"
  echo "| Namespace dev | ${NS_DEV} |"
  echo "| Namespace prod | ${NS_PROD} |"
  echo "| Namespace audit | ${NS_AUDIT} |"
  echo
  echo "## Mauvaises pratiques déployées"
  echo
  echo "| Catégorie | Mauvaise pratique |"
  echo "|---|---|"
  echo "| Pod | Conteneur privilégié |"
  echo "| Pod | Exécution en root |"
  echo "| Pod | allowPrivilegeEscalation=true |"
  echo "| Pod | Montage hostPath sur / |"
  echo "| Pod | Token ServiceAccount monté automatiquement |"
  echo "| Secrets | Secret applicatif exposé au Pod |"
  echo "| RBAC | ServiceAccount lié à cluster-admin |"
  echo "| RBAC | Role avec resources=* et verbs=* |"
  echo
  echo "## Corrections appliquées"
  echo
  echo "| Catégorie | Correction |"
  echo "|---|---|"
  echo "| Pod | Conteneur non privilégié |"
  echo "| Pod | Exécution non-root |"
  echo "| Pod | allowPrivilegeEscalation=false |"
  echo "| Pod | Root filesystem en lecture seule |"
  echo "| Pod | Capabilities supprimées |"
  echo "| Pod | Seccomp RuntimeDefault |"
  echo "| Pod | Requests et limits définies |"
  echo "| ServiceAccount | Token non monté automatiquement |"
  echo "| RBAC | Permissions limitées à la lecture des Pods |"
  echo "| RBAC | Suppression du ClusterRoleBinding cluster-admin |"
  echo
  echo "## Fichiers de preuve"
  echo
  echo "| Contrôle | Fichier |"
  echo "|---|---|"
  echo "| Nœuds Kind | reports/03-nodes.txt |"
  echo "| Namespaces | reports/05-namespaces-created.txt |"
  echo "| Droits ServiceAccount dangereux | reports/10-bad-sa-can-i-all.txt |"
  echo "| Pod vulnérable | reports/14-vulnerable-pod-security-summary.json |"
  echo "| Audit initial | reports/26-audit-vulnerable-cluster.txt |"
  echo "| Pod corrigé | reports/35-secure-pod-security-summary.json |"
  echo "| Audit après correction | reports/36-audit-after-fix.txt |"
} > reports/rapport-tp-kind-cluster-vulnerable.md
```

### 32. Afficher le rapport

```bash
cat reports/rapport-tp-kind-cluster-vulnerable.md
```

### 33. Lister les fichiers générés

```bash
find . -maxdepth 4 -type f | sort \
  | tee reports/37-generated-files.txt
```

## Nettoyage

### 34. Supprimer les ressources applicatives

```bash
kubectl -n "${NS_DEV}" delete pod "${SECURE_APP_NAME}" --ignore-not-found
kubectl -n "${NS_PROD}" delete pod prod-web --ignore-not-found
kubectl -n "${NS_DEV}" delete serviceaccount "${BAD_SERVICE_ACCOUNT}" --ignore-not-found
kubectl -n "${NS_DEV}" delete serviceaccount "${LIMITED_SERVICE_ACCOUNT}" --ignore-not-found
kubectl -n "${NS_DEV}" delete serviceaccount dev-user-sa --ignore-not-found
kubectl delete clusterrolebinding bad-admin-sa-cluster-admin --ignore-not-found
kubectl -n "${NS_DEV}" delete rolebinding limited-reader-binding --ignore-not-found
kubectl -n "${NS_DEV}" delete role pod-reader --ignore-not-found
kubectl -n "${NS_DEV}" delete rolebinding dev-user-wide-rolebinding --ignore-not-found
kubectl -n "${NS_DEV}" delete role wide-dev-role --ignore-not-found
kubectl -n "${NS_DEV}" delete secret app-secret --ignore-not-found
```

### 35. Supprimer les namespaces

```bash
kubectl delete namespace "${NS_DEV}" --ignore-not-found
kubectl delete namespace "${NS_PROD}" --ignore-not-found
kubectl delete namespace "${NS_AUDIT}" --ignore-not-found
```

```bash
kubectl get namespaces | tee reports/38-namespaces-after-cleanup.txt
```

### 36. Supprimer le cluster Kind

```bash
kind delete cluster --name "${KIND_CLUSTER_NAME}"
```

```bash
kind get clusters | tee reports/39-kind-clusters-after-delete.txt || true
```

### 37. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-kind-cluster-vulnerable
```

## Résultat attendu

À la fin du TP, les éléments suivants doivent avoir été validés :

| Élément | Validation |
|---|---|
| Cluster Kind | Cluster local créé avec deux nœuds |
| Namespaces | Namespaces `dev`, `prod` et `audit` créés |
| Pod vulnérable | Pod privilégié déployé dans `dev` |
| Secret | Secret applicatif créé et consommé |
| RBAC dangereux | ServiceAccount lié à `cluster-admin` |
| Role trop large | Role wildcard créé dans `dev` |
| Audit | Mauvaises pratiques détectées par le script |
| Correction Pod | Pod non-root, non privilégié et plus strict |
| Correction RBAC | Permissions limitées à la lecture des Pods |
| Nettoyage | Cluster Kind supprimé |

Aucune ressource cloud, aucune clé AWS et aucun compte externe ne sont utilisés pendant ce TP.
