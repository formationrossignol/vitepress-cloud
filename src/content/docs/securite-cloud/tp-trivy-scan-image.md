---
title: "TP : Scanner une image vulnérable"
date: 2026-06-14
description: Scanner une image Docker obsolète avec Trivy, filtrer les vulnérabilités par criticité, générer un rapport JSON et rendre le scan bloquant en CI/CD.
---

## Prérequis

### Environnement technique

- Docker installé et fonctionnel.
- Accès à un terminal.
- Accès au registre Docker Hub.
- jq installé pour lire et filtrer les rapports JSON.
- Optionnel : Trivy installé localement pour les environnements où le montage du socket Docker n'est pas disponible.

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

### Image utilisée

```bash
python:3.4-alpine
```

Cette image est volontairement obsolète. Python 3.4 est en fin de vie et ne doit pas être utilisé en production.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

- Scanner une image de conteneur avec Trivy.
- Identifier les vulnérabilités détectées dans une image.
- Filtrer les vulnérabilités selon leur criticité.
- Générer un rapport de scan au format JSON.
- Lire les informations essentielles d'un rapport JSON.
- Comprendre l'intérêt d'un scan d'image dans une démarche DevSecOps.
- Rendre un scan bloquant en cas de vulnérabilités critiques.
- Interpréter le code de retour d'une commande dans un contexte CI/CD.

## Commandes

### 1. Vérifier que Docker est disponible

```bash
docker --version
```

### 2. Télécharger l'image vulnérable

```bash
docker pull python:3.4-alpine
```

### 3. Créer un répertoire de cache local pour Trivy

```bash
mkdir -p .trivy-cache
```

### 4. Scanner l'image avec Trivy via Docker

```bash
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$PWD/.trivy-cache:/root/.cache/" \
  aquasec/trivy:0.71.0 \
  image python:3.4-alpine
```

### 5. Scanner uniquement les vulnérabilités HIGH et CRITICAL

```bash
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$PWD/.trivy-cache:/root/.cache/" \
  aquasec/trivy:0.71.0 \
  image --severity HIGH,CRITICAL python:3.4-alpine
```

### 6. Générer un rapport JSON

```bash
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$PWD/.trivy-cache:/root/.cache/" \
  -v "$PWD:/workdir" \
  aquasec/trivy:0.71.0 \
  image --format json --output /workdir/trivy-report.json python:3.4-alpine
```

### 7. Vérifier que le rapport JSON a bien été généré

```bash
ls -lh trivy-report.json
```

### 8. Lire le début du rapport JSON de manière lisible

```bash
jq . trivy-report.json | head -100
```

### 9. Extraire les vulnérabilités principales avec jq

```bash
jq '.Results[]?.Vulnerabilities[]? | {VulnerabilityID, Severity, PkgName, InstalledVersion, FixedVersion, Title}' trivy-report.json | head -40
```

### 10. Rendre le scan bloquant en cas de vulnérabilité HIGH ou CRITICAL

```bash
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$PWD/.trivy-cache:/root/.cache/" \
  aquasec/trivy:0.71.0 \
  image --severity HIGH,CRITICAL --exit-code 1 python:3.4-alpine
```

```bash
echo "Code de retour : $?"
```

## Variante avec Trivy installé localement

La version installée localement peut différer de `0.71.0` selon le gestionnaire de paquets utilisé. Le comportement des commandes ci-dessous reste identique pour les usages du TP.

### 1. Installer Trivy sur macOS ou Linux avec Homebrew

```bash
brew install trivy
```

### 2. Vérifier la version de Trivy

```bash
trivy --version
```

### 3. Scanner l'image localement

```bash
trivy image python:3.4-alpine
```

### 4. Scanner uniquement les vulnérabilités HIGH et CRITICAL

```bash
trivy image --severity HIGH,CRITICAL python:3.4-alpine
```

### 5. Générer un rapport JSON

```bash
trivy image --format json --output trivy-report.json python:3.4-alpine
```

### 6. Lire le début du rapport JSON de manière lisible

```bash
jq . trivy-report.json | head -100
```

### 7. Extraire les vulnérabilités principales avec jq

```bash
jq '.Results[]?.Vulnerabilities[]? | {VulnerabilityID, Severity, PkgName, InstalledVersion, FixedVersion, Title}' trivy-report.json | head -40
```

### 8. Rendre le scan bloquant en cas de vulnérabilité HIGH ou CRITICAL

```bash
trivy image --severity HIGH,CRITICAL --exit-code 1 python:3.4-alpine
```

```bash
echo "Code de retour : $?"
```

## Résultat attendu

| Contrôle | Résultat attendu |
| --- | --- |
| Scan de vulnérabilités | Les vulnérabilités de l'image `python:3.4-alpine` sont affichées dans le terminal |
| Rapport JSON | `trivy-report.json` est généré dans le répertoire courant |
| Gate `--exit-code 1` | Code de retour différent de `0` si au moins une vulnérabilité de la sévérité demandée est détectée |
