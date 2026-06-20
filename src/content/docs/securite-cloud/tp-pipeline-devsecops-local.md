---
title: "TP : Pipeline DevSecOps locale avec Gitea, Woodpecker, Trivy et Semgrep"
date: 2026-06-14
description: Déployer une forge Git locale avec Gitea et un moteur CI avec Woodpecker, écrire une pipeline DevSecOps intégrant Trivy (secrets, SCA, SBOM) et Semgrep (SAST), bloquer la pipeline sur findings, puis valider après correction.
---

## Prérequis

### Environnement technique

* Docker installé et fonctionnel.
* Docker Compose disponible (`docker compose version`).
* Git installé.
* curl installé.
* jq installé pour lire et filtrer les rapports JSON.
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
sudo apt-get install -y docker.io docker-compose-plugin git curl jq
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER"
```

Se déconnecter puis se reconnecter si l'utilisateur vient d'être ajouté au groupe Docker.

#### Sur macOS

```bash
brew install git curl jq
```

Installer Docker Desktop depuis docker.com, puis vérifier :

```bash
docker --version
docker compose version
```

#### Sur Windows

L'environnement recommandé est WSL2 avec Ubuntu :

```powershell
wsl --version
wsl --install -d Ubuntu
```

Installer Docker Desktop et activer l'intégration WSL2, puis dans Ubuntu WSL :

```bash
sudo apt-get update
sudo apt-get install -y git curl jq
docker --version
docker compose version
```

### Vérification des outils

```bash
docker --version
docker compose version
git --version
curl --version
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

Ce TP crée uniquement un environnement local.

Aucune ressource cloud n'est créée.

Les conteneurs et volumes doivent être supprimés à la fin du TP.

Le mot de passe Gitea est défini en clair dans `scripts/env.sh`. Ne pas utiliser ce fichier dans un environnement partagé.

## Outils utilisés

| Composant | Image Docker | Rôle |
|---|---|---|
| Gitea | `gitea/gitea:1.26` | Forge Git locale |
| Woodpecker Server | `woodpeckerci/woodpecker-server:v3.15` | Moteur CI local |
| Woodpecker Agent | `woodpeckerci/woodpecker-agent:v3.15` | Agent CI local |
| Trivy | `aquasec/trivy:0.71.0` | Scan secrets, SCA, SBOM |
| Semgrep | `semgrep/semgrep:1.127.0` | SAST |

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Déployer une forge Git locale avec Gitea.
* Déployer un moteur CI local avec Woodpecker.
* Connecter Woodpecker à Gitea via OAuth.
* Écrire une pipeline DevSecOps avec plusieurs étapes de contrôle.
* Détecter des secrets en clair avec Trivy.
* Détecter des patterns dangereux avec Semgrep.
* Détecter des dépendances vulnérables avec Trivy.
* Générer un SBOM au format CycloneDX avec Trivy.
* Bloquer une pipeline avec un gate de sécurité.
* Corriger les findings et valider le passage de la pipeline.

## Contrôles intégrés

| Contrôle | Outil | Résultat attendu |
|---|---|---|
| Secrets | Trivy | Détecter une clé ou un mot de passe en clair |
| SAST | Semgrep | Détecter un pattern de code dangereux |
| SCA | Trivy | Détecter des dépendances vulnérables |
| SBOM | Trivy | Générer un inventaire CycloneDX |
| Gate CI | Script Bash | Bloquer la pipeline si des risques sont détectés |

Le TP suit deux phases :

| Phase | Description |
|---|---|
| Version vulnérable | La pipeline échoue volontairement |
| Version corrigée | La pipeline passe après correction |

## Configuration du fichier hosts

Le TP utilise les noms locaux `gitea` et `woodpecker` qui doivent pointer vers `127.0.0.1`.

### Sur Linux ou macOS

```bash
echo "127.0.0.1 gitea woodpecker" | sudo tee -a /etc/hosts
```

```bash
grep "gitea woodpecker" /etc/hosts
```

### Sur Windows

Ouvrir PowerShell en administrateur :

```powershell
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 gitea woodpecker"
```

```powershell
Select-String -Path "C:\Windows\System32\drivers\etc\hosts" -Pattern "gitea"
```

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-pipeline-devsecops-local
cd tp-pipeline-devsecops-local

mkdir -p platform demo-app reports scripts
```

```bash
find . -maxdepth 2 -type d | sort
```

Résultat attendu :

```text
.
./demo-app
./platform
./reports
./scripts
```

### 2. Définir les variables du TP

```bash
cat > scripts/env.sh <<'EOF'
export TP_NAME="tp-pipeline-devsecops-local"
export GITEA_URL="http://gitea:3000"
export WOODPECKER_URL="http://woodpecker:8000"
export GITEA_USER="formation"
export GITEA_PASSWORD="Formation1234"
export GITEA_EMAIL="formation@example.local"
export REPO_NAME="demo-devsecops"
export REPO_DIR="demo-app"
export WOODPECKER_AGENT_SECRET="formation-woodpecker-agent-secret-local"
EOF
```

```bash
source scripts/env.sh
```

```bash
echo "$TP_NAME"
echo "$GITEA_URL"
echo "$WOODPECKER_URL"
echo "$REPO_NAME"
```

### 3. Créer le fichier `.env` de la plateforme

```bash
cat > platform/.env <<EOF
WOODPECKER_AGENT_SECRET=${WOODPECKER_AGENT_SECRET}
WOODPECKER_GITEA_CLIENT=TO_BE_FILLED
WOODPECKER_GITEA_SECRET=TO_BE_FILLED
EOF
```

```bash
cat platform/.env
```

### 4. Créer le fichier Docker Compose

```bash
cat > platform/docker-compose.yml <<'EOF'
services:
  gitea:
    image: gitea/gitea:1.26
    container_name: devsecops-gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=sqlite3
      - GITEA__server__DOMAIN=gitea
      - GITEA__server__ROOT_URL=http://gitea:3000/
      - GITEA__server__HTTP_PORT=3000
      - GITEA__service__DISABLE_REGISTRATION=false
      - GITEA__webhook__ALLOWED_HOST_LIST=external,loopback,gitea,woodpecker
    volumes:
      - gitea_data:/data
    ports:
      - "3000:3000"
      - "2222:22"
    networks:
      - devsecops

  woodpecker:
    image: woodpeckerci/woodpecker-server:v3.15
    container_name: devsecops-woodpecker
    depends_on:
      - gitea
    environment:
      - WOODPECKER_OPEN=true
      - WOODPECKER_ADMIN=formation
      - WOODPECKER_HOST=http://woodpecker:8000
      - WOODPECKER_GITEA=true
      - WOODPECKER_GITEA_URL=http://gitea:3000
      - WOODPECKER_GITEA_CLIENT=${WOODPECKER_GITEA_CLIENT}
      - WOODPECKER_GITEA_SECRET=${WOODPECKER_GITEA_SECRET}
      - WOODPECKER_AGENT_SECRET=${WOODPECKER_AGENT_SECRET}
    volumes:
      - woodpecker_server_data:/var/lib/woodpecker
    ports:
      - "8000:8000"
    networks:
      - devsecops

  woodpecker-agent:
    image: woodpeckerci/woodpecker-agent:v3.15
    container_name: devsecops-woodpecker-agent
    command: agent
    depends_on:
      - woodpecker
    environment:
      - WOODPECKER_SERVER=woodpecker:9000
      - WOODPECKER_AGENT_SECRET=${WOODPECKER_AGENT_SECRET}
      - WOODPECKER_BACKEND=docker
      - WOODPECKER_BACKEND_DOCKER_NETWORK=devsecops-local
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - devsecops

networks:
  devsecops:
    name: devsecops-local

volumes:
  gitea_data:
  woodpecker_server_data:
EOF
```

### 5. Démarrer Gitea

```bash
cd platform
docker compose up -d gitea
cd ..
```

Attendre le démarrage :

```bash
until curl -s http://gitea:3000 >/dev/null; do
  echo "Gitea en cours de démarrage..."
  sleep 5
done
echo "Gitea disponible."
```

```bash
curl -I http://gitea:3000 | tee reports/01-gitea-http.txt
```

Résultat attendu :

```text
HTTP/1.1 200 OK
```

### 6. Créer l'utilisateur administrateur Gitea

```bash
cd platform
docker compose exec -u git gitea gitea admin user create \
  --username "${GITEA_USER}" \
  --password "${GITEA_PASSWORD}" \
  --email "${GITEA_EMAIL}" \
  --admin \
  --must-change-password=false || true
cd ..
```

```bash
curl -s -u "${GITEA_USER}:${GITEA_PASSWORD}" \
  "${GITEA_URL}/api/v1/user" \
  | jq .login \
  | tee reports/02-gitea-user-check.txt
```

Résultat attendu :

```text
"formation"
```

## Configuration OAuth Gitea pour Woodpecker

### 7. Créer l'application OAuth dans Gitea

Ouvrir Gitea dans un navigateur :

```text
http://gitea:3000
```

Se connecter avec :

| Champ | Valeur |
|---|---|
| Utilisateur | `formation` |
| Mot de passe | `Formation1234` |

Créer une application OAuth :

```text
Avatar utilisateur → Settings → Applications → OAuth2 Applications
```

| Champ | Valeur |
|---|---|
| Application name | `woodpecker` |
| Redirect URI | `http://woodpecker:8000/authorize` |

Copier les deux valeurs générées :

| Valeur | Variable |
|---|---|
| Client ID | `WOODPECKER_GITEA_CLIENT` |
| Client Secret | `WOODPECKER_GITEA_SECRET` |

### 8. Renseigner les secrets OAuth dans le fichier .env

```bash
nano platform/.env
```

Remplacer `TO_BE_FILLED` par les valeurs générées dans Gitea.

Vérifier sans afficher les secrets complets :

```bash
grep "WOODPECKER_GITEA_CLIENT" platform/.env
grep "WOODPECKER_GITEA_SECRET" platform/.env
```

### 9. Démarrer Woodpecker

```bash
cd platform
docker compose up -d
cd ..
```

```bash
cd platform
docker compose ps | tee ../reports/03-platform-containers.txt
cd ..
```

Résultat attendu :

```text
devsecops-gitea             Up
devsecops-woodpecker        Up
devsecops-woodpecker-agent  Up
```

```bash
curl -I http://woodpecker:8000 | tee reports/04-woodpecker-http.txt
```

Résultat attendu :

```text
HTTP/1.1 200 OK
```

Ouvrir Woodpecker dans un navigateur et se connecter avec Gitea :

```text
http://woodpecker:8000
```

## Création de l'application vulnérable

### 10. Créer la structure applicative

```bash
mkdir -p demo-app/app demo-app/rules demo-app/scripts demo-app/reports
```

```bash
cat > demo-app/.gitignore <<'EOF'
reports/*.json
reports/*.txt
reports/*.cdx.json
__pycache__/
*.pyc
.venv/
EOF
```

### 11. Créer une application Python vulnérable

```bash
cat > demo-app/app/main.py <<'EOF'
from flask import Flask, request
import subprocess

app = Flask(__name__)

@app.route("/")
def index():
    name = request.args.get("name", "world")
    command = "echo Hello " + name
    result = subprocess.run(
        command,
        shell=True,
        capture_output=True,
        text=True
    )
    return result.stdout

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
EOF
```

```bash
cat > demo-app/app/config.py <<'EOF'
AWS_ACCESS_KEY_ID = "AKIA1234567890ABCDEF"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
DATABASE_PASSWORD = "SuperSecretPassword123!"
EOF
```

```bash
cat > demo-app/requirements.txt <<'EOF'
Flask==0.12.2
Jinja2==2.10
requests==2.19.1
PyYAML==5.3.1
EOF
```

```bash
cat > demo-app/README.md <<'EOF'
# Demo DevSecOps

Application volontairement vulnérable pour tester une pipeline DevSecOps locale.

| Contrôle | Outil |
|---|---|
| Secrets | Trivy |
| SAST | Semgrep |
| SCA | Trivy |
| SBOM | Trivy |
EOF
```

### 12. Créer les règles SAST Semgrep

```bash
cat > demo-app/rules/semgrep.yml <<'EOF'
rules:
  - id: python-subprocess-shell-true
    languages:
      - python
    severity: ERROR
    message: "Utilisation dangereuse de subprocess avec shell=True"
    patterns:
      - pattern: subprocess.$FUNC(..., shell=True, ...)

  - id: flask-debug-true
    languages:
      - python
    severity: ERROR
    message: "Mode debug Flask activé"
    pattern: app.run(..., debug=True, ...)
EOF
```

### 13. Créer le script de gate sécurité

```bash
cat > demo-app/scripts/security-gate.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="${REPORT_DIR:-reports}"
SECRETS_REPORT="${REPORT_DIR}/trivy-secrets.json"
SAST_REPORT="${REPORT_DIR}/semgrep-sast.json"
SCA_REPORT="${REPORT_DIR}/trivy-sca.json"
SBOM_FILE="${REPORT_DIR}/sbom.cdx.json"

for f in "$SECRETS_REPORT" "$SAST_REPORT" "$SCA_REPORT" "$SBOM_FILE"; do
  if [ ! -f "$f" ]; then
    echo "Rapport manquant : $f"
    exit 2
  fi
done

SECRET_COUNT=$(jq '[.Results[]? | .Secrets[]?] | length' "$SECRETS_REPORT")
SAST_COUNT=$(jq '.results | length' "$SAST_REPORT")
SCA_HIGH_CRITICAL_COUNT=$(jq '[.Results[]? | .Vulnerabilities[]? | select(.Severity == "HIGH" or .Severity == "CRITICAL")] | length' "$SCA_REPORT")

echo "Synthèse sécurité"
echo "Secrets détectés              : $SECRET_COUNT"
echo "Findings SAST Semgrep         : $SAST_COUNT"
echo "Vulnérabilités HIGH/CRITICAL  : $SCA_HIGH_CRITICAL_COUNT"
echo "SBOM généré                   : $SBOM_FILE"
echo

if [ "$SECRET_COUNT" -gt 0 ]; then
  echo "Gate refusé : secrets détectés."
  exit 1
fi

if [ "$SAST_COUNT" -gt 0 ]; then
  echo "Gate refusé : findings SAST détectés."
  exit 1
fi

if [ "$SCA_HIGH_CRITICAL_COUNT" -gt 0 ]; then
  echo "Gate refusé : vulnérabilités HIGH ou CRITICAL détectées."
  exit 1
fi

echo "Gate accepté : aucun blocage détecté."
EOF
```

```bash
chmod +x demo-app/scripts/security-gate.sh
```

### 14. Créer la pipeline Woodpecker

```bash
cat > demo-app/.woodpecker.yaml <<'EOF'
steps:
  prepare:
    image: alpine:3.20
    commands:
      - mkdir -p reports
      - echo "Pipeline DevSecOps locale"
      - echo "Contrôles : secrets, SAST, SCA, SBOM"

  secrets-trivy:
    image: aquasec/trivy:0.71.0
    commands:
      - trivy fs --scanners secret --format json --output reports/trivy-secrets.json .
      - trivy fs --scanners secret --format table .

  sast-semgrep:
    image: semgrep/semgrep:1.127.0
    commands:
      - semgrep scan --config rules/semgrep.yml --json --output reports/semgrep-sast.json . || true
      - semgrep scan --config rules/semgrep.yml . || true

  sca-trivy:
    image: aquasec/trivy:0.71.0
    commands:
      - trivy fs --scanners vuln --severity HIGH,CRITICAL --format json --output reports/trivy-sca.json .
      - trivy fs --scanners vuln --severity HIGH,CRITICAL --format table .

  sbom-trivy:
    image: aquasec/trivy:0.71.0
    commands:
      - trivy fs --format cyclonedx --output reports/sbom.cdx.json .

  security-gate:
    image: alpine:3.20
    commands:
      - apk add --no-cache bash jq
      - bash scripts/security-gate.sh
EOF
```

## Exécution locale des contrôles avant CI

### 15. Lancer le scan secrets avec Trivy

```bash
cd demo-app
mkdir -p reports
```

```bash
docker run --rm \
  -v "$PWD":/src \
  -w /src \
  aquasec/trivy:0.71.0 \
  fs --scanners secret --format json --output reports/trivy-secrets.json .
```

```bash
jq '[.Results[]? | .Secrets[]?] | length' reports/trivy-secrets.json \
  | tee reports/local-secret-count.txt
```

Résultat attendu : `1` ou plus.

### 16. Lancer le scan SAST avec Semgrep

```bash
docker run --rm \
  -v "$PWD":/src \
  -w /src \
  semgrep/semgrep:1.127.0 \
  semgrep scan --config rules/semgrep.yml --json --output reports/semgrep-sast.json . || true
```

```bash
jq '.results | length' reports/semgrep-sast.json \
  | tee reports/local-sast-count.txt
```

Résultat attendu : `2`.

### 17. Lancer le scan SCA avec Trivy

```bash
docker run --rm \
  -v "$PWD":/src \
  -w /src \
  aquasec/trivy:0.71.0 \
  fs --scanners vuln --severity HIGH,CRITICAL --format json --output reports/trivy-sca.json .
```

```bash
jq '[.Results[]? | .Vulnerabilities[]? | select(.Severity == "HIGH" or .Severity == "CRITICAL")] | length' \
  reports/trivy-sca.json \
  | tee reports/local-sca-high-critical-count.txt
```

Résultat attendu : `1` ou plus.

### 18. Générer le SBOM

```bash
docker run --rm \
  -v "$PWD":/src \
  -w /src \
  aquasec/trivy:0.71.0 \
  fs --format cyclonedx --output reports/sbom.cdx.json .
```

```bash
ls -lh reports/sbom.cdx.json
jq '.bomFormat, .specVersion' reports/sbom.cdx.json
```

Résultat attendu :

```text
"CycloneDX"
```

### 19. Exécuter le gate local

```bash
set +e
docker run --rm \
  -v "$PWD":/src \
  -w /src \
  alpine:3.20 \
  sh -c "apk add --no-cache bash jq >/dev/null && bash scripts/security-gate.sh" \
  | tee reports/local-security-gate.txt
GATE_STATUS=${PIPESTATUS[0]}
set -e

echo "${GATE_STATUS}" | tee reports/local-security-gate-status.txt
```

Résultat attendu :

```text
Gate refusé
```

```bash
cd ..
```

## Création du dépôt dans Gitea

### 20. Créer le dépôt Gitea avec l'API

```bash
curl -s -u "${GITEA_USER}:${GITEA_PASSWORD}" \
  -H "Content-Type: application/json" \
  -X POST "${GITEA_URL}/api/v1/user/repos" \
  -d "{\"name\":\"${REPO_NAME}\",\"private\":false}" \
  | jq . \
  | tee reports/05-gitea-repo-create.json
```

```bash
curl -s -u "${GITEA_USER}:${GITEA_PASSWORD}" \
  "${GITEA_URL}/api/v1/repos/${GITEA_USER}/${REPO_NAME}" \
  | jq '.full_name' \
  | tee reports/06-gitea-repo-check.txt
```

Résultat attendu :

```text
"formation/demo-devsecops"
```

### 21. Initialiser le dépôt Git local

```bash
cd demo-app

git init
git config user.name "Formation DevSecOps"
git config user.email "formation@example.local"

git add .
git commit -m "Initial vulnerable DevSecOps demo"
git branch -M main

git remote add origin "http://${GITEA_USER}:${GITEA_PASSWORD}@gitea:3000/${GITEA_USER}/${REPO_NAME}.git"
git push -u origin main

cd ..
```

## Activation du dépôt dans Woodpecker

### 22. Activer le dépôt dans Woodpecker

Ouvrir Woodpecker dans un navigateur :

```text
http://woodpecker:8000
```

Se connecter avec Gitea, puis activer le dépôt :

```text
Repositories → formation/demo-devsecops → Enable
```

### 23. Déclencher la pipeline

```bash
cd demo-app
git commit --allow-empty -m "Trigger vulnerable pipeline"
git push
cd ..
```

Dans Woodpecker, vérifier le build `formation/demo-devsecops`.

Résultat attendu : la pipeline échoue à l'étape `security-gate`.

## Correction de l'application

### 24. Corriger les secrets en clair

```bash
cat > demo-app/app/config.py <<'EOF'
import os

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD", "")
EOF
```

### 25. Corriger le code dangereux

```bash
cat > demo-app/app/main.py <<'EOF'
from flask import Flask, request
import os
import subprocess

app = Flask(__name__)

@app.route("/")
def index():
    name = request.args.get("name", "world")
    result = subprocess.run(
        ["echo", "Hello", name],
        check=True,
        capture_output=True,
        text=True
    )
    return result.stdout

if __name__ == "__main__":
    debug_enabled = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=5000, debug=debug_enabled)
EOF
```

### 26. Corriger les dépendances vulnérables

```bash
cat > demo-app/requirements.txt <<'EOF'
Flask==3.1.3
requests==2.32.4
PyYAML==6.0.2
EOF
```

Si un scan SCA détecte encore une vulnérabilité HIGH ou CRITICAL liée à une version devenue vulnérable après la rédaction du TP, mettre à jour la dépendance concernée vers la dernière version corrigée disponible sur PyPI.

### 27. Relancer les scans locaux

```bash
cd demo-app
rm -rf reports
mkdir -p reports
```

```bash
docker run --rm -v "$PWD":/src -w /src aquasec/trivy:0.71.0 \
  fs --scanners secret --format json --output reports/trivy-secrets.json .

docker run --rm -v "$PWD":/src -w /src semgrep/semgrep:1.127.0 \
  semgrep scan --config rules/semgrep.yml --json --output reports/semgrep-sast.json . || true

docker run --rm -v "$PWD":/src -w /src aquasec/trivy:0.71.0 \
  fs --scanners vuln --severity HIGH,CRITICAL --format json --output reports/trivy-sca.json .

docker run --rm -v "$PWD":/src -w /src aquasec/trivy:0.71.0 \
  fs --format cyclonedx --output reports/sbom.cdx.json .
```

```bash
docker run --rm \
  -v "$PWD":/src \
  -w /src \
  alpine:3.20 \
  sh -c "apk add --no-cache bash jq >/dev/null && bash scripts/security-gate.sh" \
  | tee reports/local-security-gate-after-fix.txt
```

Résultat attendu :

```text
Gate accepté
```

```bash
cd ..
```

### 28. Pousser la correction

```bash
cd demo-app
git add .
git commit -m "Fix DevSecOps findings"
git push
cd ..
```

Dans Woodpecker, vérifier le nouveau build.

Résultat attendu :

```text
Pipeline passed
```

## Rapport de synthèse

### 29. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP : Pipeline DevSecOps locale"
  echo
  echo "## Environnement"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| TP | ${TP_NAME} |"
  echo "| Forge | Gitea 1.26 |"
  echo "| CI | Woodpecker v3.15 |"
  echo "| Dépôt | ${GITEA_USER}/${REPO_NAME} |"
  echo "| URL Gitea | ${GITEA_URL} |"
  echo "| URL Woodpecker | ${WOODPECKER_URL} |"
  echo
  echo "## Contrôles intégrés"
  echo
  echo "| Contrôle | Outil | Fichier de sortie |"
  echo "|---|---|---|"
  echo "| Secrets | Trivy 0.71.0 | reports/trivy-secrets.json |"
  echo "| SAST | Semgrep 1.127.0 | reports/semgrep-sast.json |"
  echo "| SCA | Trivy 0.71.0 | reports/trivy-sca.json |"
  echo "| SBOM | Trivy 0.71.0 | reports/sbom.cdx.json |"
  echo "| Gate CI | Script Bash + jq | scripts/security-gate.sh |"
  echo
  echo "## Résultats"
  echo
  echo "| Étape | Résultat |"
  echo "|---|---|"
  echo "| Premier push | Pipeline échouée |"
  echo "| Correction | Findings corrigés |"
  echo "| Second push | Pipeline réussie |"
} > reports/rapport-tp-pipeline-devsecops-local.md
```

### 30. Afficher le rapport

```bash
cat reports/rapport-tp-pipeline-devsecops-local.md
```

### 31. Lister les fichiers générés

```bash
find . -maxdepth 4 -type f | sort \
  | tee reports/07-generated-files.txt
```

## Nettoyage

### 32. Arrêter la plateforme et supprimer les volumes

```bash
cd platform
docker compose down -v
cd ..
```

```bash
docker volume ls | grep -E "gitea|woodpecker" || true
```

### 33. Supprimer les images de test (optionnel)

```bash
docker image rm aquasec/trivy:0.71.0 semgrep/semgrep:1.127.0 || true
```

### 34. Supprimer les entrées hosts

Sur Linux ou macOS :

```bash
sudo sed -i '/gitea woodpecker/d' /etc/hosts
grep "gitea woodpecker" /etc/hosts || true
```

Sur Windows (PowerShell administrateur) :

```powershell
(Get-Content "C:\Windows\System32\drivers\etc\hosts") | Where-Object { $_ -notmatch "gitea woodpecker" } | Set-Content "C:\Windows\System32\drivers\etc\hosts"
```

### 35. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-pipeline-devsecops-local
```

## Résultat attendu

À la fin du TP, les éléments suivants doivent avoir été validés :

| Élément | Validation |
|---|---|
| Gitea | Forge locale accessible sur `http://gitea:3000` |
| Woodpecker | CI locale accessible sur `http://woodpecker:8000` |
| Dépôt applicatif | Dépôt `formation/demo-devsecops` créé |
| Pipeline | `.woodpecker.yaml` exécuté automatiquement |
| Secrets | Trivy détecte les secrets en clair |
| SAST | Semgrep détecte les patterns dangereux |
| SCA | Trivy détecte les dépendances vulnérables |
| SBOM | Trivy génère un fichier CycloneDX |
| Gate CI | La pipeline vulnérable est bloquée |
| Correction | La pipeline corrigée passe |
| Nettoyage | Conteneurs et volumes supprimés |

Aucune ressource cloud, aucune clé AWS et aucun compte externe ne sont utilisés pendant ce TP.
