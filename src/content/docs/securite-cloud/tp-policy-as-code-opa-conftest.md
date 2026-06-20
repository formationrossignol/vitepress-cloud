---
title: "TP : Policy as Code sur plan Terraform avec OPA et Conftest"
date: 2026-06-14
description: Écrire des règles OPA en Rego, générer un plan Terraform sans apply, évaluer le plan avec Conftest pour bloquer les non-conformités avant exécution, puis valider une version corrigée.
---

## Prérequis

### Environnement technique

* OpenTofu ou Terraform installé pour générer un plan IaC.
* Conftest installé pour évaluer le plan avec des règles OPA.
* jq installé pour lire et filtrer les rapports JSON.
* Accès à un terminal Bash ou Zsh.

Ce TP est réalisable sur Linux, macOS et Windows.

Il ne déploie aucune ressource cloud.

Aucune commande `apply` ne doit être exécutée.

### Compatibilité Windows

Sur Windows, l'environnement recommandé est WSL2 avec Ubuntu.

```powershell
wsl --version
wsl --install -d Ubuntu
```

Ouvrir ensuite un terminal Ubuntu WSL et suivre la section Linux.

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
sudo apt-get install -y curl wget unzip git jq gnupg python3
```

Installer OpenTofu :

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh -o install-opentofu.sh
chmod +x install-opentofu.sh
sudo ./install-opentofu.sh --install-method deb
rm -f install-opentofu.sh
```

Installer Conftest :

```bash
LATEST_VERSION=$(wget -O - "https://api.github.com/repos/open-policy-agent/conftest/releases/latest" \
  | grep '"tag_name":' \
  | sed -E 's/.*"([^"]+)".*/\1/' \
  | cut -c 2-)

ARCH=$(uname -m)
SYSTEM=$(uname)

if [ "$ARCH" = "x86_64" ]; then ARCH="x86_64"; fi
if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi

wget "https://github.com/open-policy-agent/conftest/releases/download/v${LATEST_VERSION}/conftest_${LATEST_VERSION}_${SYSTEM}_${ARCH}.tar.gz"
tar xzf "conftest_${LATEST_VERSION}_${SYSTEM}_${ARCH}.tar.gz"
sudo mv conftest /usr/local/bin/
rm -f "conftest_${LATEST_VERSION}_${SYSTEM}_${ARCH}.tar.gz"
```

#### Sur Fedora / RHEL / Rocky Linux / AlmaLinux

```bash
sudo dnf install -y curl wget unzip git jq python3
```

Installer OpenTofu :

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh -o install-opentofu.sh
chmod +x install-opentofu.sh
sudo ./install-opentofu.sh --install-method rpm
rm -f install-opentofu.sh
```

Installer Conftest (même procédure que Debian) :

```bash
LATEST_VERSION=$(curl -s https://api.github.com/repos/open-policy-agent/conftest/releases/latest \
  | grep '"tag_name":' \
  | sed -E 's/.*"([^"]+)".*/\1/' \
  | cut -c 2-)

ARCH=$(uname -m)
SYSTEM=$(uname)

if [ "$ARCH" = "x86_64" ]; then ARCH="x86_64"; fi
if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi

wget "https://github.com/open-policy-agent/conftest/releases/download/v${LATEST_VERSION}/conftest_${LATEST_VERSION}_${SYSTEM}_${ARCH}.tar.gz"
tar xzf "conftest_${LATEST_VERSION}_${SYSTEM}_${ARCH}.tar.gz"
sudo mv conftest /usr/local/bin/
rm -f "conftest_${LATEST_VERSION}_${SYSTEM}_${ARCH}.tar.gz"
```

#### Sur macOS

```bash
brew install opentofu
brew install conftest
brew install jq
```

#### Sur Windows avec PowerShell

```powershell
winget install --exact --id OpenTofu.Tofu
winget install --exact --id jqlang.jq
winget install --exact --id Git.Git
```

Installer Scoop si nécessaire :

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

Installer Conftest via Scoop :

```powershell
scoop install conftest
```

Fermer puis rouvrir PowerShell ou Git Bash pour recharger le `PATH`.

### Vérification des outils

```bash
tofu version || terraform version
conftest --version
jq --version
```

Résultat attendu : une version doit être affichée pour chaque outil.

### Précaution

Ce TP ne crée aucune ressource cloud et n'exécute aucun `apply`.

Les providers AWS utilisent des credentials fictifs avec `skip_credentials_validation = true`.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Écrire du code Terraform volontairement non conforme.
* Générer un plan Terraform sans `apply`.
* Exporter un plan Terraform au format JSON.
* Écrire des règles OPA en Rego pour valider un plan.
* Évaluer un plan JSON avec Conftest.
* Bloquer un plan non conforme avant exécution.
* Corriger le code Terraform pour le rendre conforme.
* Valider qu'un plan corrigé passe les politiques.
* Comparer les violations entre un plan vulnérable et un plan conforme.
* Produire un rapport local des résultats.

## Politiques implémentées

| Politique | Non-conformité bloquée |
|---|---|
| S3 public | Public Access Block désactivé |
| Security Group ouvert | SSH ouvert à `0.0.0.0/0` |
| Base exposée | RDS avec `publicly_accessible = true` |
| Secret dans le plan | Secret géré directement dans le plan |
| Tags obligatoires | Absence des tags `Environment` et `Owner` |

## Flux de contrôle

| Étape | Rôle |
|---|---|
| Écriture Terraform | Définir une infrastructure volontairement non conforme |
| Génération du plan | Produire un fichier de plan binaire |
| Export JSON | Convertir le plan en JSON avec `show -json` |
| Évaluation OPA | Appliquer des règles Rego avec Conftest |
| Blocage | Refuser le plan si une règle est violée |
| Correction | Produire une version conforme |
| Validation | Vérifier que le plan corrigé passe les politiques |

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-policy-as-code-terraform-plan
cd tp-policy-as-code-terraform-plan

mkdir -p vulnerable secure policy scripts reports
```

```bash
find . -maxdepth 2 -type d | sort
```

Résultat attendu :

```text
.
./policy
./reports
./scripts
./secure
./vulnerable
```

### 2. Définir les variables du TP

```bash
cat > scripts/env.sh <<'EOF'
export TP_NAME="tp-policy-as-code-terraform-plan"

export VULNERABLE_DIR="vulnerable"
export SECURE_DIR="secure"
export POLICY_DIR="policy"
export REPORTS_DIR="reports"

export VULNERABLE_PLAN="${REPORTS_DIR}/vulnerable.tfplan"
export VULNERABLE_PLAN_JSON="${REPORTS_DIR}/vulnerable.tfplan.json"
export SECURE_PLAN="${REPORTS_DIR}/secure.tfplan"
export SECURE_PLAN_JSON="${REPORTS_DIR}/secure.tfplan.json"

export CONFTEST_VULNERABLE_TXT="${REPORTS_DIR}/conftest-vulnerable.txt"
export CONFTEST_VULNERABLE_JSON="${REPORTS_DIR}/conftest-vulnerable.json"
export CONFTEST_SECURE_TXT="${REPORTS_DIR}/conftest-secure.txt"
export CONFTEST_SECURE_JSON="${REPORTS_DIR}/conftest-secure.json"

export AWS_EC2_METADATA_DISABLED=true
EOF
```

```bash
source scripts/env.sh
```

```bash
echo "$TP_NAME"
echo "$VULNERABLE_DIR"
echo "$SECURE_DIR"
echo "$POLICY_DIR"
```

### 3. Détecter OpenTofu ou Terraform

```bash
cat > scripts/select-iac-cli.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if command -v tofu >/dev/null 2>&1; then
  echo "tofu"
elif command -v terraform >/dev/null 2>&1; then
  echo "terraform"
else
  echo "Aucun outil IaC trouvé : installer OpenTofu ou Terraform." >&2
  exit 1
fi
EOF
```

```bash
chmod +x scripts/select-iac-cli.sh
```

```bash
export IAC_CLI="$(./scripts/select-iac-cli.sh)"
echo "Outil IaC détecté : ${IAC_CLI}"
${IAC_CLI} version
```

### 4. Créer un diagnostic des outils

```bash
{
  echo "# Diagnostic outils TP Policy as Code"
  echo
  echo "## Outil IaC"
  ${IAC_CLI} version 2>/dev/null || echo "Non disponible"
  echo
  echo "## Conftest"
  conftest --version 2>/dev/null || echo "Non disponible"
  echo
  echo "## jq"
  jq --version 2>/dev/null || echo "Non disponible"
} | tee reports/00-tools-diagnostic.txt
```

## Création du Terraform non conforme

### 5. Créer le Terraform vulnérable

```bash
cat > vulnerable/main.tf <<'EOF'
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "eu-west-3"
}

provider "aws" {
  region = var.aws_region

  access_key = "mock_access_key"
  secret_key = "mock_secret_key"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
  skip_requesting_account_id  = true
}

resource "aws_s3_bucket" "public_bucket" {
  bucket = "formation-policy-as-code-public-bucket-demo-123456"

  tags = {
    Environment = "dev"
  }
}

resource "aws_s3_bucket_public_access_block" "public_bucket" {
  bucket = aws_s3_bucket.public_bucket.id

  block_public_acls       = false
  ignore_public_acls      = false
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_security_group" "open_ssh" {
  name        = "formation-policy-open-ssh"
  description = "Security Group volontairement non conforme"

  ingress {
    description = "SSH ouvert à Internet"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Flux sortant non restreint"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = "dev"
  }
}

resource "aws_db_instance" "public_database" {
  identifier          = "formation-policy-public-db"
  engine              = "mysql"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  username            = "admin"
  password            = "P@ssw0rd123!"
  publicly_accessible = true
  skip_final_snapshot = true

  tags = {
    Environment = "dev"
  }
}

resource "aws_secretsmanager_secret" "demo_secret" {
  name = "formation-policy-hardcoded-secret"

  tags = {
    Environment = "dev"
  }
}

resource "aws_secretsmanager_secret_version" "demo_secret_value" {
  secret_id     = aws_secretsmanager_secret.demo_secret.id
  secret_string = "username=admin;password=SuperSecretPassword123!"
}
EOF
```

### 6. Documenter les non-conformités attendues

```bash
cat > reports/01-non-conformites-attendues.md <<'EOF'
# Non-conformités attendues

| Ressource | Problème |
|---|---|
| aws_s3_bucket_public_access_block.public_bucket | Blocage d'accès public désactivé |
| aws_security_group.open_ssh | SSH ouvert à `0.0.0.0/0` |
| aws_db_instance.public_database | Base publiquement accessible |
| aws_secretsmanager_secret_version.demo_secret_value | Secret injecté directement dans le plan |
| aws_s3_bucket.public_bucket | Tag `Owner` absent |
| aws_security_group.open_ssh | Tag `Owner` absent |
| aws_db_instance.public_database | Tag `Owner` absent |
EOF
```

```bash
cat reports/01-non-conformites-attendues.md
```

## Création des règles OPA

### 7. Créer les règles Rego

```bash
cat > policy/terraform_plan.rego <<'EOF'
package main

deny contains msg if {
  rc := input.resource_changes[_]
  rc.mode == "managed"
  rc.type == "aws_s3_bucket_public_access_block"
  after := rc.change.after
  object.get(after, "block_public_acls", true) == false
  msg := sprintf("S3 public non conforme : block_public_acls=false sur %s", [rc.address])
}

deny contains msg if {
  rc := input.resource_changes[_]
  rc.mode == "managed"
  rc.type == "aws_s3_bucket_public_access_block"
  after := rc.change.after
  object.get(after, "ignore_public_acls", true) == false
  msg := sprintf("S3 public non conforme : ignore_public_acls=false sur %s", [rc.address])
}

deny contains msg if {
  rc := input.resource_changes[_]
  rc.mode == "managed"
  rc.type == "aws_s3_bucket_public_access_block"
  after := rc.change.after
  object.get(after, "block_public_policy", true) == false
  msg := sprintf("S3 public non conforme : block_public_policy=false sur %s", [rc.address])
}

deny contains msg if {
  rc := input.resource_changes[_]
  rc.mode == "managed"
  rc.type == "aws_s3_bucket_public_access_block"
  after := rc.change.after
  object.get(after, "restrict_public_buckets", true) == false
  msg := sprintf("S3 public non conforme : restrict_public_buckets=false sur %s", [rc.address])
}

deny contains msg if {
  rc := input.resource_changes[_]
  rc.mode == "managed"
  rc.type == "aws_security_group"
  ingress := object.get(rc.change.after, "ingress", [])[_]
  cidr := object.get(ingress, "cidr_blocks", [])[_]
  cidr == "0.0.0.0/0"
  object.get(ingress, "from_port", 0) <= 22
  object.get(ingress, "to_port", 0) >= 22
  msg := sprintf("Security Group non conforme : SSH ouvert à Internet sur %s", [rc.address])
}

deny contains msg if {
  rc := input.resource_changes[_]
  rc.mode == "managed"
  rc.type == "aws_db_instance"
  after := rc.change.after
  object.get(after, "publicly_accessible", false) == true
  msg := sprintf("Base de données non conforme : publicly_accessible=true sur %s", [rc.address])
}

deny contains msg if {
  rc := input.resource_changes[_]
  rc.mode == "managed"
  rc.type == "aws_secretsmanager_secret_version"
  after_sensitive := object.get(rc.change, "after_sensitive", {})
  object.get(after_sensitive, "secret_string", false) == true
  msg := sprintf("Secret non conforme : secret_string présent dans le plan sur %s", [rc.address])
}

deny contains msg if {
  rc := input.resource_changes[_]
  rc.mode == "managed"
  taggable_resource(rc.type)
  tags := object.get(rc.change.after, "tags", {})
  not object.get(tags, "Environment", false)
  msg := sprintf("Tags non conformes : tag Environment absent sur %s", [rc.address])
}

deny contains msg if {
  rc := input.resource_changes[_]
  rc.mode == "managed"
  taggable_resource(rc.type)
  tags := object.get(rc.change.after, "tags", {})
  not object.get(tags, "Owner", false)
  msg := sprintf("Tags non conformes : tag Owner absent sur %s", [rc.address])
}

taggable_resource(resource_type) if { resource_type == "aws_s3_bucket" }
taggable_resource(resource_type) if { resource_type == "aws_security_group" }
taggable_resource(resource_type) if { resource_type == "aws_db_instance" }
taggable_resource(resource_type) if { resource_type == "aws_secretsmanager_secret" }
EOF
```

### 8. Vérifier la syntaxe des règles

```bash
conftest verify --policy policy | tee reports/02-conftest-policy-verify.txt
```

Si aucune erreur n'est retournée, les règles Rego sont syntaxiquement valides.

## Génération du plan Terraform vulnérable

### 9. Initialiser et valider le dossier vulnérable

```bash
cd vulnerable
${IAC_CLI} init -backend=false
${IAC_CLI} validate
cd ..
```

```bash
cat > reports/03-vulnerable-validate.txt <<EOF
Dossier : ${VULNERABLE_DIR}
Outil IaC : ${IAC_CLI}
Validation : OK
Apply exécuté : non
EOF
```

### 10. Générer le plan vulnérable

```bash
cd vulnerable
${IAC_CLI} plan -refresh=false -input=false -out="../${VULNERABLE_PLAN}"
cd ..
```

```bash
ls -lh "${VULNERABLE_PLAN}"
```

### 11. Exporter le plan en JSON

```bash
${IAC_CLI} show -json "${VULNERABLE_PLAN}" > "${VULNERABLE_PLAN_JSON}"
```

```bash
ls -lh "${VULNERABLE_PLAN_JSON}"
```

```bash
jq -r '.resource_changes[] | [.address, .type, (.change.actions | join(","))] | @tsv' \
  "${VULNERABLE_PLAN_JSON}" \
  | tee reports/04-vulnerable-plan-resources.tsv
```

## Évaluation du plan avec Conftest

### 12. Tester le plan vulnérable en sortie texte

```bash
conftest test "${VULNERABLE_PLAN_JSON}" \
  --policy "${POLICY_DIR}" \
  | tee "${CONFTEST_VULNERABLE_TXT}" || true
```

Résultat attendu : `FAIL`. Le plan doit être refusé.

### 13. Tester le plan vulnérable en sortie JSON

```bash
conftest test "${VULNERABLE_PLAN_JSON}" \
  --policy "${POLICY_DIR}" \
  --output json \
  > "${CONFTEST_VULNERABLE_JSON}" || true
```

```bash
ls -lh "${CONFTEST_VULNERABLE_JSON}"
```

### 14. Extraire les violations

```bash
jq -r '.[]? | .failures[]? | .msg' "${CONFTEST_VULNERABLE_JSON}" \
  | tee reports/05-vulnerable-policy-violations.txt
```

Résultat attendu : les violations S3, Security Group, RDS, Secret et Tags doivent apparaître.

## Blocage avant apply

### 15. Créer un script de contrôle Policy as Code

```bash
cat > scripts/policy-gate.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

PLAN_JSON="${1:-}"
POLICY_DIR="${2:-policy}"

if [ -z "$PLAN_JSON" ]; then
  echo "Usage: $0 <tfplan.json> [policy_dir]" >&2
  exit 2
fi

if [ ! -f "$PLAN_JSON" ]; then
  echo "Plan JSON introuvable : $PLAN_JSON" >&2
  exit 2
fi

if [ ! -d "$POLICY_DIR" ]; then
  echo "Dossier de politiques introuvable : $POLICY_DIR" >&2
  exit 2
fi

echo "Contrôle Policy as Code"
echo "Plan analysé : $PLAN_JSON"
echo "Politiques : $POLICY_DIR"
echo

conftest test "$PLAN_JSON" --policy "$POLICY_DIR"

echo
echo "Gate OK : le plan est conforme."
EOF
```

```bash
chmod +x scripts/policy-gate.sh
```

### 16. Exécuter le contrôle sur le plan vulnérable

```bash
set +e
./scripts/policy-gate.sh "${VULNERABLE_PLAN_JSON}" "${POLICY_DIR}" \
  | tee reports/06-vulnerable-policy-gate.txt
GATE_STATUS=${PIPESTATUS[0]}
set -e

echo "${GATE_STATUS}" | tee reports/07-vulnerable-policy-gate-status.txt
```

```bash
if [ "${GATE_STATUS}" -ne 0 ]; then
  echo "Plan bloqué avant apply : non-conformités détectées." \
    | tee reports/08-vulnerable-plan-blocked.txt
else
  echo "Plan autorisé."
fi
```

Résultat attendu :

```text
Plan bloqué avant apply : non-conformités détectées.
```

### 17. Créer un script d'apply sécurisé (non exécuté)

Ce script illustre comment intégrer le contrôle Policy as Code avant un `apply`.

Il ne doit pas être exécuté dans ce TP.

```bash
cat > scripts/apply-with-policy-gate.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

IAC_CLI="${IAC_CLI:-tofu}"
PLAN_FILE="${1:-}"
POLICY_DIR="${2:-policy}"

if [ -z "$PLAN_FILE" ]; then
  echo "Usage: $0 <tfplan> [policy_dir]" >&2
  exit 2
fi

PLAN_JSON="${PLAN_FILE}.json"

echo "Export du plan en JSON"
"$IAC_CLI" show -json "$PLAN_FILE" > "$PLAN_JSON"

echo "Contrôle Policy as Code"
conftest test "$PLAN_JSON" --policy "$POLICY_DIR"

echo "Plan conforme."
echo "La commande apply serait autorisée à ce stade."
echo "Commande volontairement désactivée dans ce TP :"
echo "$IAC_CLI apply \"$PLAN_FILE\""
EOF
```

```bash
chmod +x scripts/apply-with-policy-gate.sh
```

## Correction du Terraform

### 18. Créer une version conforme

```bash
cat > secure/main.tf <<'EOF'
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "eu-west-3"
}

variable "admin_cidr" {
  type        = string
  description = "CIDR d'administration autorisé"
  default     = "203.0.113.10/32"
}

variable "db_password" {
  type        = string
  description = "Mot de passe fourni via variable externe"
  sensitive   = true
}

provider "aws" {
  region = var.aws_region

  access_key = "mock_access_key"
  secret_key = "mock_secret_key"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
  skip_requesting_account_id  = true
}

resource "aws_s3_bucket" "private_bucket" {
  bucket = "formation-policy-as-code-private-bucket-demo-123456"

  tags = {
    Environment = "dev"
    Owner       = "formation"
  }
}

resource "aws_s3_bucket_public_access_block" "private_bucket" {
  bucket = aws_s3_bucket.private_bucket.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_security_group" "restricted_admin" {
  name        = "formation-policy-restricted-admin"
  description = "Security Group conforme avec SSH restreint"

  ingress {
    description = "SSH restreint à une IP d'administration"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    description = "HTTPS sortant uniquement"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = "dev"
    Owner       = "formation"
  }
}

resource "aws_db_instance" "private_database" {
  identifier          = "formation-policy-private-db"
  engine              = "mysql"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  username            = "admin"
  password            = var.db_password
  publicly_accessible = false
  skip_final_snapshot = true

  tags = {
    Environment = "dev"
    Owner       = "formation"
  }
}
EOF
```

```bash
cat > secure/terraform.tfvars.example <<'EOF'
admin_cidr  = "203.0.113.10/32"
db_password = "REPLACE_WITH_VALUE_FROM_SECRET_MANAGER"
EOF
```

### 19. Initialiser et valider le dossier conforme

```bash
cd secure
${IAC_CLI} init -backend=false
${IAC_CLI} validate
cd ..
```

```bash
cat > reports/09-secure-validate.txt <<EOF
Dossier : ${SECURE_DIR}
Outil IaC : ${IAC_CLI}
Validation : OK
Apply exécuté : non
EOF
```

### 20. Générer le plan conforme

La variable `db_password` est définie temporairement via `TF_VAR_*` pour permettre la génération du plan sans valeur interactive.

```bash
export TF_VAR_db_password="temporary-demo-password-for-plan"

cd secure
${IAC_CLI} plan -refresh=false -input=false -out="../${SECURE_PLAN}"
cd ..

unset TF_VAR_db_password
```

```bash
ls -lh "${SECURE_PLAN}"
```

### 21. Exporter le plan conforme en JSON

```bash
${IAC_CLI} show -json "${SECURE_PLAN}" > "${SECURE_PLAN_JSON}"
```

```bash
jq -r '.resource_changes[] | [.address, .type, (.change.actions | join(","))] | @tsv' \
  "${SECURE_PLAN_JSON}" \
  | tee reports/10-secure-plan-resources.tsv
```

## Validation du plan conforme

### 22. Tester le plan conforme en sortie texte

```bash
conftest test "${SECURE_PLAN_JSON}" \
  --policy "${POLICY_DIR}" \
  | tee "${CONFTEST_SECURE_TXT}"
```

Résultat attendu : `PASS`.

### 23. Tester le plan conforme en sortie JSON

```bash
conftest test "${SECURE_PLAN_JSON}" \
  --policy "${POLICY_DIR}" \
  --output json \
  > "${CONFTEST_SECURE_JSON}"
```

```bash
ls -lh "${CONFTEST_SECURE_JSON}"
```

### 24. Exécuter le gate sur le plan conforme

```bash
./scripts/policy-gate.sh "${SECURE_PLAN_JSON}" "${POLICY_DIR}" \
  | tee reports/11-secure-policy-gate.txt
```

Résultat attendu :

```text
Gate OK : le plan est conforme.
```

## Comparaison des résultats

### 25. Compter les violations du plan vulnérable

```bash
jq '[.[]? | .failures[]?] | length' "${CONFTEST_VULNERABLE_JSON}" \
  | tee reports/12-vulnerable-violation-count.txt
```

### 26. Compter les violations du plan conforme

```bash
jq '[.[]? | .failures[]?] | length' "${CONFTEST_SECURE_JSON}" \
  | tee reports/13-secure-violation-count.txt
```

### 27. Générer une comparaison

```bash
cat > reports/14-policy-comparison.md <<EOF
# Comparaison Policy as Code

| Plan | Violations |
|---|---:|
| Plan vulnérable | $(cat reports/12-vulnerable-violation-count.txt) |
| Plan conforme | $(cat reports/13-secure-violation-count.txt) |

## Résultat

Le plan vulnérable est bloqué avant apply.

Le plan conforme passe le contrôle Policy as Code.
EOF
```

```bash
cat reports/14-policy-comparison.md
```

## Rapport de synthèse

### 28. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP : Policy as Code sur plan Terraform"
  echo
  echo "## Environnement"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| TP | ${TP_NAME} |"
  echo "| Outil IaC | ${IAC_CLI} |"
  echo "| Dossier vulnérable | ${VULNERABLE_DIR} |"
  echo "| Dossier conforme | ${SECURE_DIR} |"
  echo "| Dossier politiques | ${POLICY_DIR} |"
  echo
  echo "## Politiques implémentées"
  echo
  echo "| Politique | Règle |"
  echo "|---|---|"
  echo "| S3 public | Public Access Block obligatoire |"
  echo "| SSH public | Interdiction de SSH depuis 0.0.0.0/0 |"
  echo "| Base publique | Interdiction de publicly_accessible=true |"
  echo "| Secret dans le plan | Interdiction de secret géré directement dans le plan |"
  echo "| Tags | Environment et Owner obligatoires |"
  echo
  echo "## Résultats"
  echo
  echo "| Plan | Résultat | Violations |"
  echo "|---|---|---:|"
  echo "| Plan vulnérable | Bloqué | $(cat reports/12-vulnerable-violation-count.txt) |"
  echo "| Plan conforme | Autorisé | $(cat reports/13-secure-violation-count.txt) |"
} > reports/rapport-tp-policy-as-code-terraform-plan.md
```

### 29. Afficher le rapport

```bash
cat reports/rapport-tp-policy-as-code-terraform-plan.md
```

### 30. Lister les fichiers générés

```bash
find . -maxdepth 3 -type f | sort \
  | tee reports/15-generated-files.txt
```

## Nettoyage

### 31. Supprimer les fichiers d'initialisation IaC

```bash
rm -rf vulnerable/.terraform vulnerable/.terraform.lock.hcl
rm -rf secure/.terraform secure/.terraform.lock.hcl
```

```bash
find . -name ".terraform" -type d
find . -name ".terraform.lock.hcl" -type f
```

### 32. Vérifier qu'aucune ressource cloud n'a été créée

```bash
find . -name "terraform.tfstate*" -type f
```

Résultat attendu : aucun fichier `terraform.tfstate` ne doit être présent.

### 33. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-policy-as-code-terraform-plan
```

## Résultat attendu

À la fin du TP, les éléments suivants doivent avoir été validés :

| Élément | Validation |
|---|---|
| Terraform vulnérable | Un plan non conforme est généré |
| Export JSON | Le plan est converti avec `show -json` |
| Règles OPA | Les règles Rego sont présentes dans `policy/` |
| Conftest | Le plan JSON est analysé |
| Blocage | Le plan vulnérable est refusé avant apply |
| Correction | Une version conforme est produite |
| Validation finale | Le plan conforme passe le gate |
| Rapport | Un rapport Markdown est disponible dans `reports/` |
| Nettoyage | Aucun état Terraform ni ressource cloud ne reste présent |

Aucune ressource cloud, aucun état Terraform et aucun `apply` ne doivent être produits pendant ce TP.
