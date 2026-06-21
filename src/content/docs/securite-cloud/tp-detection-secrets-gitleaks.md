---
title: "TP : Détecter des secrets dans un dépôt Git avec Gitleaks, TruffleHog et detect-secrets"
date: 2026-06-14
description: Scanner un dépôt Git local avec Gitleaks, TruffleHog et detect-secrets pour identifier des secrets exposés, générer des rapports JSON et simuler un contrôle pré-commit.
---

## Prérequis

### Environnement technique

* Docker installé et fonctionnel.
* Git installé.
* Accès à un terminal Bash ou Zsh.
* jq installé pour lire et filtrer les rapports JSON.
* Python 3 installé.
* pip disponible.
* Accès Internet pour télécharger les images Docker et les dépendances Python.

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

### Installer detect-secrets

Créer un environnement Python dédié :

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Installer detect-secrets :

```bash
pip install detect-secrets
```

Vérifier l'installation :

```bash
detect-secrets --version
detect-secrets-hook --help
```

### Outils utilisés

Les outils utilisés via Docker sont :

```text
ghcr.io/gitleaks/gitleaks:v8.30.0
trufflesecurity/trufflehog:3.95.2
```

L'outil suivant est utilisé localement via Python :

```text
detect-secrets
```

### Précaution

Ce TP crée volontairement de faux secrets dans un dépôt Git local.

Les secrets utilisés sont factices et servent uniquement à déclencher les outils de détection.

Ne jamais utiliser de vrais tokens, clés cloud, mots de passe ou secrets applicatifs dans un support de formation.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Identifier des secrets exposés dans un dépôt Git.
* Comprendre les risques associés aux tokens, clés API, clés cloud et mots de passe en clair.
* Scanner un répertoire de dépôt avec Gitleaks.
* Scanner un historique Git avec Gitleaks.
* Scanner un système de fichiers avec TruffleHog.
* Scanner un dépôt Git local avec TruffleHog.
* Générer une baseline avec detect-secrets.
* Utiliser detect-secrets-hook pour bloquer l'ajout d'un nouveau secret.
* Lire les rapports JSON produits par les outils.
* Comparer les résultats de plusieurs outils de détection.
* Comprendre l'intérêt d'un contrôle de secrets dans une chaîne DevSecOps.

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-detection-secrets-git
cd tp-detection-secrets-git

mkdir -p reports
```

### 2. Télécharger les images Docker des outils

```bash
docker pull ghcr.io/gitleaks/gitleaks:v8.30.0
docker pull trufflesecurity/trufflehog:3.95.2
```

### 3. Vérifier les versions des outils Docker

```bash
docker run --rm ghcr.io/gitleaks/gitleaks:v8.30.0 version
docker run --rm trufflesecurity/trufflehog:3.95.2 --version
```

### 4. Créer un dépôt Git local de démonstration

```bash
mkdir repo-vulnerable
cd repo-vulnerable

git init
git config user.email "formation@example.com"
git config user.name "Formation Sécurité Cloud"
```

### 5. Créer un fichier applicatif sans secret

```bash
cat > app.py <<'EOF'
print("Application de démonstration")
EOF
```

### 6. Créer un fichier contenant de faux secrets

```bash
cat > config.env <<'EOF'
AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF
AWS_SECRET_ACCESS_KEY=abcdEFGH1234567890abcdEFGH1234567890ABCD
DATABASE_PASSWORD=SuperSecretPassword123!
SLACK_BOT_TOKEN=xoxb-TRAINTOKEN-TRAINTOKEN-TRAININGTRAININGTRAININGTRAININGTRAINING
EOF
```

### 7. Créer un faux fichier de clé privée

```bash
cat > private-key.pem <<'EOF'
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0FakeTrainingKeyOnlyDoNotUseThisValueForAnything
FakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFake
FakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFake
-----END RSA PRIVATE KEY-----
EOF
```

### 8. Ajouter les fichiers au dépôt Git

```bash
git add app.py config.env private-key.pem
git commit -m "Ajout initial avec secrets factices"
```

### 9. Vérifier l'historique Git

```bash
git log --oneline
```

### 10. Revenir à la racine du TP

```bash
cd ..
```

### 11. Scanner le répertoire avec Gitleaks

Cette commande scanne les fichiers présents dans le répertoire du dépôt.

L'option `--redact` masque les valeurs des secrets dans le rapport. Les findings restent visibles, mais les valeurs sensibles sont remplacées par des valeurs masquées.

```bash
docker run --rm \
  -v "$PWD/repo-vulnerable:/repo" \
  -v "$PWD/reports:/reports" \
  ghcr.io/gitleaks/gitleaks:v8.30.0 \
  dir /repo \
  --report-format json \
  --report-path /reports/gitleaks-dir.json \
  --redact \
  --exit-code 1
```

```bash
echo "Code de retour Gitleaks dir : $?"
```

### 12. Vérifier le rapport Gitleaks

```bash
ls -lh reports/gitleaks-dir.json
```

### 13. Lire le nombre de findings Gitleaks

```bash
jq 'length' reports/gitleaks-dir.json
```

### 14. Afficher une synthèse des findings Gitleaks

```bash
jq -r '.[]? | [.RuleID, .File, .StartLine, .Description] | @tsv' reports/gitleaks-dir.json
```

### 15. Scanner le dépôt Git avec Gitleaks

Cette commande scanne l'historique Git du dépôt.

```bash
docker run --rm \
  -v "$PWD/repo-vulnerable:/repo" \
  -v "$PWD/reports:/reports" \
  ghcr.io/gitleaks/gitleaks:v8.30.0 \
  git /repo \
  --report-format json \
  --report-path /reports/gitleaks-git.json \
  --redact \
  --exit-code 1
```

```bash
echo "Code de retour Gitleaks git : $?"
```

### 16. Lire le nombre de findings Gitleaks dans l'historique Git

```bash
jq 'length' reports/gitleaks-git.json
```

### 17. Scanner le système de fichiers avec TruffleHog

Cette commande scanne les fichiers présents dans le dépôt.

TruffleHog produit une sortie au format JSON Lines : chaque finding est écrit comme un objet JSON séparé.

```bash
docker run --rm \
  -v "$PWD:/pwd" \
  trufflesecurity/trufflehog:3.95.2 \
  filesystem /pwd/repo-vulnerable \
  --json \
  --no-verification \
  > reports/trufflehog-filesystem.json
```

```bash
echo "Code de retour TruffleHog filesystem : $?"
```

### 18. Lire le nombre de findings TruffleHog filesystem

```bash
jq -s 'length' reports/trufflehog-filesystem.json
```

### 19. Afficher une synthèse des findings TruffleHog filesystem

```bash
jq -rs '.[] | [
  .DetectorName,
  .SourceName,
  (.SourceMetadata.Data.Filesystem.file? // .SourceMetadata.Data.Filesystem.path? // "non renseigné"),
  (.Raw // .Redacted // "non renseigné")
] | @tsv' reports/trufflehog-filesystem.json
```

### 20. Scanner le dépôt Git local avec TruffleHog

Cette commande scanne l'historique Git du dépôt local.

```bash
docker run --rm \
  -v "$PWD:/pwd" \
  trufflesecurity/trufflehog:3.95.2 \
  git file:///pwd/repo-vulnerable \
  --json \
  --no-verification \
  > reports/trufflehog-git.json
```

```bash
echo "Code de retour TruffleHog git : $?"
```

### 21. Lire le nombre de findings TruffleHog git

```bash
jq -s 'length' reports/trufflehog-git.json
```

### 22. Afficher une synthèse des findings TruffleHog git

```bash
jq -rs '.[] | [
  .DetectorName,
  .SourceName,
  (.SourceMetadata.Data.Git.file? // "non renseigné"),
  (.SourceMetadata.Data.Git.line? // "non renseigné")
] | @tsv' reports/trufflehog-git.json
```

### 23. Générer une baseline detect-secrets

Vérifier que l'environnement Python virtuel est actif avant d'exécuter cette commande.

```bash
source .venv/bin/activate
```

```bash
detect-secrets scan repo-vulnerable --all-files > reports/detect-secrets-baseline.json
```

```bash
echo "Code de retour detect-secrets scan : $?"
```

### 24. Vérifier la baseline detect-secrets

```bash
ls -lh reports/detect-secrets-baseline.json
```

### 25. Lire le nombre de fichiers contenant des secrets selon detect-secrets

```bash
jq '.results | keys | length' reports/detect-secrets-baseline.json
```

### 26. Lire le nombre total de findings detect-secrets

```bash
jq '([.results[]? | length] | add) // 0' reports/detect-secrets-baseline.json
```

### 27. Afficher une synthèse des findings detect-secrets

```bash
jq -r '.results | to_entries[]? as $file | $file.value[]? | [$file.key, .type, .line_number] | @tsv' reports/detect-secrets-baseline.json
```

### 28. Créer un nouveau fichier contenant un faux secret

Cette étape simule l'ajout d'un nouveau secret après la création de la baseline.

Le fichier est ajouté à l'index Git avec `git add`, mais il n'est pas commité. Il est donc visible par les scans de répertoire, mais pas encore par les scans d'historique Git.

```bash
cd repo-vulnerable

cat > new-secret.env <<'EOF'
GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuv1234
EOF

git add new-secret.env
```

### 29. Contrôler les fichiers staged avec detect-secrets-hook

Cette commande simule un contrôle de type pré-commit.

Vérifier que l'environnement Python virtuel est toujours actif avant d'exécuter cette commande.

```bash
source ../.venv/bin/activate

if ! command -v detect-secrets-hook >/dev/null 2>&1; then
  echo "detect-secrets-hook non trouvé — vérifier que l'environnement Python virtuel est actif"
  exit 1
fi
```

```bash
git diff --staged --name-only -z | xargs -0 detect-secrets-hook --baseline ../reports/detect-secrets-baseline.json
```

```bash
echo "Code de retour detect-secrets-hook : $?"
```

### 30. Revenir à la racine du TP

```bash
cd ..
```

### 31. Générer une nouvelle baseline après ajout du secret

```bash
detect-secrets scan repo-vulnerable --all-files > reports/detect-secrets-baseline-updated.json
```

### 32. Comparer le nombre de findings avant et après ajout

```bash
echo "Baseline initiale :"
jq '([.results[]? | length] | add) // 0' reports/detect-secrets-baseline.json

echo "Baseline mise à jour :"
jq '([.results[]? | length] | add) // 0' reports/detect-secrets-baseline-updated.json
```

### 33. Scanner à nouveau avec Gitleaks après ajout du nouveau secret

Ce scan lit les fichiers présents dans le répertoire. Il peut donc détecter `new-secret.env`, même si le fichier n'a pas été commité.

```bash
docker run --rm \
  -v "$PWD/repo-vulnerable:/repo" \
  -v "$PWD/reports:/reports" \
  ghcr.io/gitleaks/gitleaks:v8.30.0 \
  dir /repo \
  --report-format json \
  --report-path /reports/gitleaks-dir-updated.json \
  --redact \
  --exit-code 1
```

```bash
echo "Code de retour Gitleaks dir après ajout : $?"
```

### 34. Lire le nombre de findings Gitleaks après ajout

```bash
jq 'length' reports/gitleaks-dir-updated.json
```

### 35. Scanner à nouveau avec TruffleHog après ajout du nouveau secret

Ce scan lit les fichiers présents dans le répertoire. Il peut donc détecter `new-secret.env`, même si le fichier n'a pas été commité.

```bash
docker run --rm \
  -v "$PWD:/pwd" \
  trufflesecurity/trufflehog:3.95.2 \
  filesystem /pwd/repo-vulnerable \
  --json \
  --no-verification \
  > reports/trufflehog-filesystem-updated.json
```

```bash
echo "Code de retour TruffleHog après ajout : $?"
```

### 36. Lire le nombre de findings TruffleHog après ajout

```bash
jq -s 'length' reports/trufflehog-filesystem-updated.json
```

### 37. Construire un rapport de synthèse local

```bash
{
  echo "# Rapport TP Détection de secrets dans un dépôt Git"
  echo
  echo "## Outils utilisés"
  echo
  echo "| Outil | Usage | Rapport |"
  echo "|---|---|---|"
  echo "| Gitleaks | Scan du répertoire | reports/gitleaks-dir.json |"
  echo "| Gitleaks | Scan de l'historique Git | reports/gitleaks-git.json |"
  echo "| TruffleHog | Scan du système de fichiers | reports/trufflehog-filesystem.json |"
  echo "| TruffleHog | Scan de l'historique Git | reports/trufflehog-git.json |"
  echo "| detect-secrets | Baseline initiale | reports/detect-secrets-baseline.json |"
  echo "| detect-secrets | Baseline mise à jour | reports/detect-secrets-baseline-updated.json |"
  echo
  echo "## Synthèse Gitleaks dir"
  echo
  echo '```json'
  jq 'length' reports/gitleaks-dir.json
  echo '```'
  echo
  echo "## Synthèse Gitleaks git"
  echo
  echo '```json'
  jq 'length' reports/gitleaks-git.json
  echo '```'
  echo
  echo "## Synthèse TruffleHog filesystem"
  echo
  echo '```json'
  jq -s 'length' reports/trufflehog-filesystem.json
  echo '```'
  echo
  echo "## Synthèse TruffleHog git"
  echo
  echo '```json'
  jq -s 'length' reports/trufflehog-git.json
  echo '```'
  echo
  echo "## Synthèse detect-secrets"
  echo
  echo '```json'
  jq '([.results[]? | length] | add) // 0' reports/detect-secrets-baseline.json
  echo '```'
  echo
  echo "## Points à observer"
  echo
  echo "- Les secrets peuvent être présents dans les fichiers courants."
  echo "- Les secrets peuvent rester présents dans l'historique Git."
  echo "- Un secret doit être révoqué même s'il est supprimé du code."
  echo "- Une baseline permet de distinguer un stock existant de nouveaux secrets introduits."
  echo "- Un contrôle de secrets peut être intégré dans un hook Git ou une chaîne CI/CD."
} > reports/secrets-detection-summary.md
```

### 38. Afficher le rapport de synthèse

```bash
cat reports/secrets-detection-summary.md
```

### 39. Lister les rapports générés

```bash
find reports -maxdepth 1 -type f -print
```

## Nettoyage optionnel

### 40. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-detection-secrets-git
```

## Résultat attendu

| Fichier produit | Description |
| --- | --- |
| `reports/gitleaks-dir.json` | Secrets détectés dans le répertoire par Gitleaks |
| `reports/gitleaks-git.json` | Secrets détectés dans l'historique Git par Gitleaks |
| `reports/trufflehog-filesystem.json` | Secrets détectés dans les fichiers par TruffleHog |
| `reports/trufflehog-git.json` | Secrets détectés dans l'historique Git par TruffleHog |
| `reports/detect-secrets-baseline.json` | Baseline initiale créée par detect-secrets |
| `reports/detect-secrets-baseline-updated.json` | Baseline mise à jour après ajout d'un nouveau secret |
| `reports/gitleaks-dir-updated.json` | Scan Gitleaks après ajout du nouveau secret |
| `reports/trufflehog-filesystem-updated.json` | Scan TruffleHog après ajout du nouveau secret |
| `reports/secrets-detection-summary.md` | Rapport de synthèse du TP |

| Observation | Résultat attendu |
| --- | --- |
| Clés cloud dans des fichiers de configuration | Détectées par Gitleaks et TruffleHog |
| Tokens dans le dépôt | Détectés par au moins un outil |
| Clé privée sensible | Détectée comme secret à haut risque |
| Historique Git | Des secrets supprimés du code restent détectables dans l'historique |
| Baseline detect-secrets | Permet de distinguer les secrets connus des nouveaux secrets |
| Hook Git ou pipeline bloquant | Un contrôle de secrets peut bloquer un commit ou une merge request |

Aucun vrai secret ne doit être utilisé pendant ce TP.
