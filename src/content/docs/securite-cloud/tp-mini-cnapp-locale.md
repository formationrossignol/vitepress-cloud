---
title: "TP : Construire une mini-CNAPP locale avec Trivy, Syft, Grype et Kubescape"
date: 2026-06-14
description: Simuler une approche CNAPP locale en combinant scan d'image, génération de SBOM, analyse de vulnérabilités et audit de posture Kubernetes.
---

## Prérequis

### Environnement technique

* Docker installé et fonctionnel.
* Accès à un terminal Bash ou Zsh.
* Accès aux registres Docker Hub et GHCR.
* jq installé pour lire, filtrer et consolider les rapports JSON.
* Kubescape installé localement.
* Accès Internet pour télécharger les images, les bases de vulnérabilités et les frameworks Kubescape.
* Environnement recommandé sur Windows : WSL2 + Ubuntu + Docker Desktop.

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

### Installer Kubescape

Sur macOS avec Homebrew :

```bash
brew install kubescape
```

Sur Linux :

```bash
curl -s https://raw.githubusercontent.com/kubescape/kubescape/master/install.sh | /bin/bash
```

Vérifier l'installation :

```bash
kubescape version
```

### Compatibilité Windows

Ce TP est conçu pour être exécuté dans un terminal Bash.

Sur Windows, l'environnement recommandé est :

```text
Windows + WSL2 + Ubuntu + Docker Desktop + jq + Kubescape
```

Depuis Ubuntu WSL2, vérifier que Docker est accessible :

```bash
docker --version
docker run --rm hello-world
```

L'exécution directe en PowerShell n'est pas recommandée, car plusieurs commandes utilisent une syntaxe Bash :

* heredocs `<<'EOF'`
* variable `$PWD`
* blocs `{ echo ... }`
* pipes et redirections
* chemins Linux pour les volumes Docker

### Outils utilisés

Les outils utilisés via Docker sont :

```bash
aquasec/trivy:0.71.0
ghcr.io/anchore/syft:v1.45.1
ghcr.io/anchore/grype:v0.114.0
```

Kubescape est utilisé localement avec la commande :

```bash
kubescape
```

### Image utilisée

```bash
python:3.4-alpine
```

Cette image est volontairement obsolète. Python 3.4 est en fin de vie et ne doit pas être utilisé en production.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Comprendre la logique d'une mini-CNAPP locale.
* Scanner une image de conteneur avec Trivy.
* Générer un SBOM avec Syft.
* Scanner une image avec Grype.
* Scanner un SBOM avec Grype.
* Scanner des manifests Kubernetes avec Trivy.
* Scanner des manifests Kubernetes avec Kubescape.
* Produire des rapports JSON exploitables.
* Consolider plusieurs résultats dans un rapport unique.
* Comprendre la complémentarité entre scan image, SBOM, vulnérabilités, configuration Kubernetes et posture sécurité.
* Interpréter un code de retour dans un contexte CI/CD.

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p mini-cnapp-locale
cd mini-cnapp-locale

mkdir -p k8s
mkdir -p reports
mkdir -p .trivy-cache
```

### 2. Télécharger l'image vulnérable

```bash
docker pull python:3.4-alpine
```

### 3. Télécharger les images des outils

```bash
docker pull aquasec/trivy:0.71.0
docker pull ghcr.io/anchore/syft:v1.45.1
docker pull ghcr.io/anchore/grype:v0.114.0
```

### 4. Vérifier les versions des outils Docker

```bash
docker run --rm aquasec/trivy:0.71.0 --version
docker run --rm ghcr.io/anchore/syft:v1.45.1 version
docker run --rm ghcr.io/anchore/grype:v0.114.0 version
```

### 5. Vérifier la version de Kubescape

```bash
kubescape version
```

### 6. Créer un manifeste Kubernetes volontairement vulnérable

```bash
cat > k8s/pod-vulnerable.yaml <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: vulnerable-pod
  labels:
    app: vulnerable-app
spec:
  hostPID: true
  containers:
    - name: nginx
      image: nginx:1.25
      ports:
        - containerPort: 80
      securityContext:
        privileged: true
        runAsUser: 0
EOF
```

### 7. Scanner l'image locale avec Trivy

```bash
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$PWD/.trivy-cache:/root/.cache/" \
  -v "$PWD:/workdir" \
  aquasec/trivy:0.71.0 \
  image --format json --output /workdir/reports/trivy-image.json python:3.4-alpine
```

```bash
echo "Code de retour Trivy image : $?"
```

### 8. Lire la synthèse des vulnérabilités Trivy

```bash
jq '[.Results[]?.Vulnerabilities[]? | .Severity] | sort | group_by(.) | map({severity: .[0], count: length})' reports/trivy-image.json
```

### 9. Afficher les principales vulnérabilités Trivy

```bash
jq -r '.Results[]?.Vulnerabilities[]? | [.VulnerabilityID, .Severity, .PkgName, .InstalledVersion, (.FixedVersion // "non renseigné")] | @tsv' reports/trivy-image.json | head -20
```

### 10. Générer un SBOM Syft au format Syft JSON

```bash
docker run --rm \
  -v "$PWD:/workdir" \
  ghcr.io/anchore/syft:v1.45.1 \
  registry:python:3.4-alpine \
  -o syft-json=/workdir/reports/syft-sbom.json
```

```bash
echo "Code de retour Syft JSON : $?"
```

### 11. Générer un SBOM Syft au format CycloneDX JSON

```bash
docker run --rm \
  -v "$PWD:/workdir" \
  ghcr.io/anchore/syft:v1.45.1 \
  registry:python:3.4-alpine \
  -o cyclonedx-json=/workdir/reports/syft-cyclonedx.json
```

```bash
echo "Code de retour Syft CycloneDX : $?"
```

### 12. Vérifier les SBOM générés

```bash
ls -lh reports/syft-sbom.json reports/syft-cyclonedx.json
```

### 13. Lire une synthèse du SBOM Syft

```bash
jq '{schema: .schema.version, artifacts: (.artifacts | length)}' reports/syft-sbom.json
```

### 14. Lire une synthèse du SBOM CycloneDX

```bash
jq '{bomFormat, specVersion, components: (.components | length)}' reports/syft-cyclonedx.json
```

### 15. Scanner l'image avec Grype depuis le registre

```bash
docker run --rm \
  -v "$PWD:/workdir" \
  ghcr.io/anchore/grype:v0.114.0 \
  registry:python:3.4-alpine \
  -o json=/workdir/reports/grype-image.json
```

```bash
echo "Code de retour Grype image : $?"
```

### 16. Lire la synthèse des vulnérabilités Grype sur l'image

```bash
jq '[.matches[]?.vulnerability.severity] | sort | group_by(.) | map({severity: .[0], count: length})' reports/grype-image.json
```

### 17. Afficher les principales vulnérabilités Grype sur l'image

```bash
jq -r '.matches[]? | [.vulnerability.id, .vulnerability.severity, .artifact.name, .artifact.version, (.vulnerability.fix.versions[0] // "non renseigné")] | @tsv' reports/grype-image.json | head -20
```

### 18. Scanner le SBOM Syft avec Grype

```bash
docker run --rm \
  -v "$PWD:/workdir" \
  ghcr.io/anchore/grype:v0.114.0 \
  sbom:/workdir/reports/syft-sbom.json \
  -o json=/workdir/reports/grype-sbom.json
```

```bash
echo "Code de retour Grype SBOM : $?"
```

### 19. Lire la synthèse des vulnérabilités Grype sur le SBOM

```bash
jq '[.matches[]?.vulnerability.severity] | sort | group_by(.) | map({severity: .[0], count: length})' reports/grype-sbom.json
```

### 20. Afficher les principales vulnérabilités Grype sur le SBOM

```bash
jq -r '.matches[]? | [.vulnerability.id, .vulnerability.severity, .artifact.name, .artifact.version, (.vulnerability.fix.versions[0] // "non renseigné")] | @tsv' reports/grype-sbom.json | head -20
```

### 21. Scanner les manifests Kubernetes avec Trivy

```bash
docker run --rm \
  -v "$PWD/.trivy-cache:/root/.cache/" \
  -v "$PWD:/workdir" \
  aquasec/trivy:0.71.0 \
  config --format json --output /workdir/reports/trivy-config-k8s.json /workdir/k8s
```

```bash
echo "Code de retour Trivy config Kubernetes : $?"
```

### 22. Lire la synthèse des mauvaises configurations Trivy

```bash
jq '[.Results[]?.Misconfigurations[]? | .Severity] | sort | group_by(.) | map({severity: .[0], count: length})' reports/trivy-config-k8s.json
```

### 23. Afficher les principales mauvaises configurations Trivy

```bash
jq -r '.Results[]?.Misconfigurations[]? | [.ID, .Severity, .Title, (.CauseMetadata.Resource? // "non renseigné")] | @tsv' reports/trivy-config-k8s.json | head -20
```

### 24. Scanner les manifests Kubernetes locaux avec Kubescape

```bash
kubescape scan ./k8s/ \
  --format json \
  --format-version v2 \
  --output reports/kubescape-k8s.json
```

```bash
echo "Code de retour Kubescape : $?"
```

### 25. Vérifier que le rapport Kubescape a bien été généré

```bash
ls -lh reports/kubescape-k8s.json
```

### 26. Lire les clés principales du rapport Kubescape

```bash
jq 'keys' reports/kubescape-k8s.json
```

### 27. Afficher une synthèse des statuts Kubescape

```bash
jq -r '.results[]?.controls[]?.status.status? // empty' reports/kubescape-k8s.json | sort | uniq -c
```

### 28. Vérifier l'ensemble des rapports générés

```bash
ls -lh reports
```

### 29. Construire un rapport de synthèse mini-CNAPP

```bash
{
  echo "# Rapport mini-CNAPP locale"
  echo
  echo "## Cartographie des contrôles"
  echo
  echo "| Domaine | Outil | Rapport |"
  echo "|---|---|---|"
  echo "| Vulnérabilités image | Trivy | reports/trivy-image.json |"
  echo "| SBOM Syft JSON | Syft | reports/syft-sbom.json |"
  echo "| SBOM CycloneDX | Syft | reports/syft-cyclonedx.json |"
  echo "| Vulnérabilités image | Grype | reports/grype-image.json |"
  echo "| Vulnérabilités depuis SBOM | Grype | reports/grype-sbom.json |"
  echo "| Misconfigurations Kubernetes | Trivy | reports/trivy-config-k8s.json |"
  echo "| Posture Kubernetes | Kubescape | reports/kubescape-k8s.json |"
  echo
  echo "## Synthèse Trivy image"
  echo
  echo '```json'
  jq '[.Results[]?.Vulnerabilities[]? | .Severity] | sort | group_by(.) | map({severity: .[0], count: length})' reports/trivy-image.json
  echo '```'
  echo
  echo "## Synthèse Syft SBOM"
  echo
  echo '```json'
  jq '{schema: .schema.version, artifacts: (.artifacts | length)}' reports/syft-sbom.json
  echo '```'
  echo
  echo "## Synthèse Grype image"
  echo
  echo '```json'
  jq '[.matches[]?.vulnerability.severity] | sort | group_by(.) | map({severity: .[0], count: length})' reports/grype-image.json
  echo '```'
  echo
  echo "## Synthèse Grype SBOM"
  echo
  echo '```json'
  jq '[.matches[]?.vulnerability.severity] | sort | group_by(.) | map({severity: .[0], count: length})' reports/grype-sbom.json
  echo '```'
  echo
  echo "## Synthèse Trivy configuration Kubernetes"
  echo
  echo '```json'
  jq '[.Results[]?.Misconfigurations[]? | .Severity] | sort | group_by(.) | map({severity: .[0], count: length})' reports/trivy-config-k8s.json
  echo '```'
  echo
  echo "## Synthèse Kubescape"
  echo
  echo '```text'
  jq -r '.results[]?.controls[]?.status.status? // empty' reports/kubescape-k8s.json | sort | uniq -c
  echo '```'
} > reports/mini-cnapp-summary.md
```

### 30. Afficher le rapport de synthèse

```bash
cat reports/mini-cnapp-summary.md
```

### 31. Rendre le scan Grype bloquant à partir du SBOM

```bash
docker run --rm \
  -v "$PWD:/workdir" \
  ghcr.io/anchore/grype:v0.114.0 \
  sbom:/workdir/reports/syft-sbom.json \
  --fail-on high
```

```bash
echo "Code de retour Grype bloquant : $?"
```

### 32. Rendre le scan Trivy bloquant sur les vulnérabilités HIGH et CRITICAL

```bash
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$PWD/.trivy-cache:/root/.cache/" \
  aquasec/trivy:0.71.0 \
  image --severity HIGH,CRITICAL --exit-code 1 python:3.4-alpine
```

```bash
echo "Code de retour Trivy bloquant : $?"
```

## Résultat attendu

| Fichier produit | Description |
| --- | --- |
| `reports/trivy-image.json` | Rapport Trivy de vulnérabilités sur l'image |
| `reports/syft-sbom.json` | SBOM généré par Syft au format JSON |
| `reports/syft-cyclonedx.json` | SBOM généré par Syft au format CycloneDX |
| `reports/grype-image.json` | Rapport Grype de vulnérabilités sur l'image |
| `reports/grype-sbom.json` | Rapport Grype de vulnérabilités sur le SBOM Syft |
| `reports/trivy-config-k8s.json` | Rapport Trivy de misconfigurations sur les manifests Kubernetes |
| `reports/kubescape-k8s.json` | Rapport Kubescape de conformité sur les manifests Kubernetes |
| `reports/mini-cnapp-summary.md` | Rapport de synthèse centralisant les résultats de tous les outils |

| Contrôle | Résultat attendu |
| --- | --- |
| Rapport de synthèse | `mini-cnapp-summary.md` centralise les résultats principaux de chaque outil |
| Approche CNAPP | Plusieurs contrôles regroupés localement simulent une approche CNAPP simplifiée |
| Gate Grype `--fail-on high` | Code de retour différent de `0` si vulnérabilités `high` ou `critical` détectées |
| Gate Trivy `--exit-code 1` | Code de retour différent de `0` si vulnérabilités `HIGH` ou `CRITICAL` détectées |
