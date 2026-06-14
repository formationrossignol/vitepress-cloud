---
title: "TP : Sécuriser le tfstate avec un backend S3 minimal"
date: 2026-06-14
description: Créer un bucket S3 chiffré, versionné et non public, migrer un state Terraform local vers ce backend, activer le verrouillage natif S3 et vérifier la protection en production.
---

## Prérequis

### Environnement technique

* AWS CLI installé et configuré.
* OpenTofu ou Terraform installé.
* jq installé pour lire et filtrer les sorties JSON.
* Accès à un terminal Bash ou Zsh.
* Accès à un compte AWS de lab.
* Permissions suffisantes pour créer, configurer et supprimer un bucket S3.

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
sudo apt-get install -y curl wget unzip git jq python3
```

Installer AWS CLI si nécessaire :

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip
```

Installer OpenTofu :

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh -o install-opentofu.sh
chmod +x install-opentofu.sh
sudo ./install-opentofu.sh --install-method deb
rm -f install-opentofu.sh
```

#### Sur Fedora / RHEL / Rocky Linux / AlmaLinux

```bash
sudo dnf install -y curl wget unzip git jq python3
```

Installer AWS CLI si nécessaire :

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip
```

Installer OpenTofu :

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh -o install-opentofu.sh
chmod +x install-opentofu.sh
sudo ./install-opentofu.sh --install-method rpm
rm -f install-opentofu.sh
```

#### Sur macOS

```bash
brew install awscli
brew install opentofu
brew install jq
```

#### Sur Windows

Sur Windows, l'environnement recommandé est WSL2 avec Ubuntu :

```powershell
wsl --version
wsl --install -d Ubuntu
```

Si WSL n'est pas disponible :

```powershell
winget install --exact --id Amazon.AWSCLI
winget install --exact --id OpenTofu.Tofu
winget install --exact --id jqlang.jq
winget install --exact --id Git.Git
```

### Vérification des outils

```bash
aws --version
tofu version || terraform version
jq --version
```

### Permissions AWS nécessaires

```text
sts:GetCallerIdentity
s3:CreateBucket
s3:DeleteBucket
s3:HeadBucket
s3:ListBucket
s3:GetObject
s3:PutObject
s3:DeleteObject
s3:ListBucketVersions
s3:GetObjectVersion
s3:DeleteObjectVersion
s3:PutBucketPublicAccessBlock
s3:GetBucketPublicAccessBlock
s3:PutBucketVersioning
s3:GetBucketVersioning
s3:PutBucketEncryption
s3:GetBucketEncryption
s3:PutBucketPolicy
s3:GetBucketPolicy
s3:GetBucketLocation
s3:ListObjectVersions
```

### Précaution

Ce TP crée des ressources AWS réelles dans un compte de lab.

Il crée un bucket S3 et exécute des `apply` Terraform.

Le TP peut générer des coûts si les ressources ne sont pas supprimées.

Ne pas exécuter ce TP dans un compte de production.

### Ressources créées

| Ressource | Quantité |
|---|---|
| Bucket S3 | 1 |
| Objet tfstate | 1 |
| Objet lockfile temporaire | 0 ou 1 pendant les opérations |

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Créer un bucket S3 dédié au stockage du tfstate.
* Activer le chiffrement SSE-S3 sur le bucket.
* Activer le versioning S3 pour conserver les versions du state.
* Bloquer tout accès public au bucket.
* Configurer un backend S3 dans Terraform.
* Activer le verrouillage natif S3 avec `use_lockfile = true`.
* Migrer un state local vers le backend S3.
* Vérifier que le state est correctement stocké et protégé.
* Générer une policy IAM minimale pour le backend.
* Nettoyer proprement le bucket et les fichiers locaux.

## Architecture cible

```text
Poste local
  |
  | terraform plan / apply / state
  v
Backend S3 (chiffré, versionné, non public, HTTPS uniquement)
  |
  | terraform.tfstate
  v
Bucket S3 dédié
```

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-tfstate-s3-minimal
cd tp-tfstate-s3-minimal

mkdir -p bootstrap app scripts reports
```

```bash
find . -maxdepth 2 -type d | sort
```

Résultat attendu :

```text
.
./app
./bootstrap
./reports
./scripts
```

### 2. Vérifier l'identité AWS utilisée

```bash
aws sts get-caller-identity
```

### 3. Définir la région AWS par défaut

```bash
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-west-3}"
export AWS_PAGER=""
echo "Région AWS CLI par défaut : ${AWS_DEFAULT_REGION}"
```

### 4. Définir les variables du TP

```bash
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
export TP_ID="$(date +%Y%m%d%H%M%S)"
export TFSTATE_BUCKET="formation-tfstate-${AWS_ACCOUNT_ID}-${TP_ID}"

export BOOTSTRAP_DIR="bootstrap"
export APP_DIR="app"
export REPORTS_DIR="reports"

export TFSTATE_KEY="formation/tfstate-s3-minimal/terraform.tfstate"
export TFSTATE_LOCK_KEY="formation/tfstate-s3-minimal/terraform.tfstate.tflock"

echo "Compte AWS : ${AWS_ACCOUNT_ID}"
echo "Bucket tfstate : ${TFSTATE_BUCKET}"
echo "Clé tfstate : ${TFSTATE_KEY}"
```

```bash
cat > scripts/env.sh <<EOF
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION}"
export AWS_PAGER=""
export TP_ID="${TP_ID}"
export AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
export TFSTATE_BUCKET="${TFSTATE_BUCKET}"
export BOOTSTRAP_DIR="bootstrap"
export APP_DIR="app"
export REPORTS_DIR="reports"
export TFSTATE_KEY="formation/tfstate-s3-minimal/terraform.tfstate"
export TFSTATE_LOCK_KEY="formation/tfstate-s3-minimal/terraform.tfstate.tflock"
EOF
```

```bash
echo "Bucket : ${TFSTATE_BUCKET}" | tee reports/00-variables.txt
```

### 5. Sélectionner Terraform ou OpenTofu

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
export IAC_CLI="$(./scripts/select-iac-cli.sh)"
echo "Outil IaC détecté : ${IAC_CLI}"
${IAC_CLI} version
```

### 6. Créer un diagnostic des outils

```bash
{
  echo "# Diagnostic outils TP tfstate S3"
  echo
  echo "## AWS CLI"
  aws --version 2>/dev/null || echo "Non disponible"
  echo
  echo "## Outil IaC"
  ${IAC_CLI} version 2>/dev/null || echo "Non disponible"
  echo
  echo "## jq"
  jq --version 2>/dev/null || echo "Non disponible"
  echo
  echo "## Compte AWS"
  aws sts get-caller-identity
} | tee reports/01-tools-diagnostic.txt
```

## Création du bucket S3 sécurisé

### 7. Créer le code Terraform de bootstrap

```bash
cat > bootstrap/main.tf <<'EOF'
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
  type = string
}

variable "tfstate_bucket" {
  type = string
}

provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "tfstate" {
  bucket = var.tfstate_bucket

  tags = {
    Name        = var.tfstate_bucket
    Usage       = "terraform-state"
    Environment = "training"
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_policy" "tfstate_tls_only" {
  bucket = aws_s3_bucket.tfstate.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.tfstate.arn,
          "${aws_s3_bucket.tfstate.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.tfstate
  ]
}

output "tfstate_bucket" {
  value = aws_s3_bucket.tfstate.bucket
}

output "tfstate_bucket_arn" {
  value = aws_s3_bucket.tfstate.arn
}
EOF
```

La ressource `aws_s3_bucket_acl` est volontairement absente. Avec `object_ownership = "BucketOwnerEnforced"`, les ACL S3 sont désactivées et `aws_s3_bucket_acl` serait en erreur.

```bash
cat > bootstrap/terraform.tfvars <<EOF
aws_region     = "${AWS_DEFAULT_REGION}"
tfstate_bucket = "${TFSTATE_BUCKET}"
EOF
```

### 8. Initialiser et valider le bootstrap

```bash
cd bootstrap
${IAC_CLI} init
${IAC_CLI} validate
cd ..
```

```bash
cat > reports/02-bootstrap-validation.txt <<EOF
Dossier : ${BOOTSTRAP_DIR}
Outil IaC : ${IAC_CLI}
Bucket prévu : ${TFSTATE_BUCKET}
Région : ${AWS_DEFAULT_REGION}
Validation : OK
EOF
```

### 9. Créer le bucket S3 sécurisé

```bash
cd bootstrap
${IAC_CLI} apply -auto-approve
cd ..
```

```bash
cd bootstrap
${IAC_CLI} output -json | tee ../reports/03-bootstrap-outputs.json
cd ..
```

```bash
aws s3api head-bucket --bucket "${TFSTATE_BUCKET}"
echo "Code de retour head-bucket : $?"
```

```bash
aws s3api get-bucket-location \
  --bucket "${TFSTATE_BUCKET}" \
  | tee reports/04-bucket-location.json
```

## Vérifications de sécurité du bucket

### 10. Vérifier le blocage public

```bash
aws s3api get-public-access-block \
  --bucket "${TFSTATE_BUCKET}" \
  | tee reports/05-public-access-block.json
```

Résultat attendu :

```json
{
  "PublicAccessBlockConfiguration": {
    "BlockPublicAcls": true,
    "IgnorePublicAcls": true,
    "BlockPublicPolicy": true,
    "RestrictPublicBuckets": true
  }
}
```

### 11. Vérifier le versioning

```bash
aws s3api get-bucket-versioning \
  --bucket "${TFSTATE_BUCKET}" \
  | tee reports/06-bucket-versioning.json
```

Résultat attendu :

```json
{
  "Status": "Enabled"
}
```

### 12. Vérifier le chiffrement

```bash
aws s3api get-bucket-encryption \
  --bucket "${TFSTATE_BUCKET}" \
  | tee reports/07-bucket-encryption.json
```

Résultat attendu :

```json
{
  "ServerSideEncryptionConfiguration": {
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }
}
```

### 13. Vérifier la policy HTTPS obligatoire

```bash
aws s3api get-bucket-policy \
  --bucket "${TFSTATE_BUCKET}" \
  --query Policy \
  --output text \
  | jq . \
  | tee reports/08-bucket-policy.json
```

La policy doit contenir `DenyInsecureTransport` avec `aws:SecureTransport = false`.

### 14. Vérifier que le bucket est vide avant migration

```bash
aws s3api list-objects-v2 \
  --bucket "${TFSTATE_BUCKET}" \
  | tee reports/09-bucket-objects-before-migration.json
```

Résultat attendu :

```json
{
  "KeyCount": 0
}
```

## Création d'un projet Terraform local

### 15. Créer le projet applicatif local

```bash
cat > app/main.tf <<'EOF'
terraform {
  required_version = ">= 1.5.0"
}

resource "terraform_data" "demo" {
  input = {
    name        = "tfstate-s3-minimal"
    environment = "training"
  }
}

output "demo_id" {
  value = terraform_data.demo.id
}
EOF
```

Ce projet utilise `terraform_data`. Il ne crée aucune ressource cloud.

### 16. Initialiser le projet avec un state local

```bash
cd app
${IAC_CLI} init
${IAC_CLI} validate
${IAC_CLI} apply -auto-approve
cd ..
```

```bash
ls -lh app/terraform.tfstate | tee reports/10-local-tfstate-file.txt
```

```bash
cd app
${IAC_CLI} output | tee ../reports/11-app-output-local-state.txt
cd ..
```

## Configuration du backend S3

### 17. Créer la configuration backend S3

```bash
cat > app/backend.tf <<EOF
terraform {
  backend "s3" {
    bucket       = "${TFSTATE_BUCKET}"
    key          = "${TFSTATE_KEY}"
    region       = "${AWS_DEFAULT_REGION}"
    encrypt      = true
    use_lockfile = true
  }
}
EOF
```

```bash
cat app/backend.tf
```

`use_lockfile = true` active le verrouillage natif S3 sans dépendance à DynamoDB. Cette fonctionnalité est disponible dans OpenTofu et Terraform récents.

### 18. Migrer le state local vers S3

```bash
cd app
${IAC_CLI} init -migrate-state -force-copy
cd ..
```

```bash
ls -la app | tee reports/12-app-files-after-migration.txt
```

Le fichier local `terraform.tfstate` peut rester comme backup de migration. Le state actif est désormais sur S3.

### 19. Vérifier le state distant

```bash
aws s3api list-objects-v2 \
  --bucket "${TFSTATE_BUCKET}" \
  --prefix "formation/tfstate-s3-minimal/" \
  | tee reports/13-bucket-objects-after-migration.json
```

```bash
aws s3 ls "s3://${TFSTATE_BUCKET}/formation/tfstate-s3-minimal/" \
  | tee reports/14-s3-ls-state-prefix.txt
```

Résultat attendu : `terraform.tfstate` doit être visible.

### 20. Vérifier le fonctionnement du backend S3

```bash
cd app
${IAC_CLI} plan | tee ../reports/15-app-plan-after-s3-backend.txt
${IAC_CLI} state list | tee ../reports/16-app-state-list.txt
cd ..
```

Résultat attendu :

```text
terraform_data.demo
```

## Test du versioning du state

### 21. Modifier la ressource locale

```bash
python3 - <<'PY'
from pathlib import Path

path = Path("app/main.tf")
content = path.read_text()
content = content.replace(
    'environment = "training"',
    'environment = "training-updated"'
)
path.write_text(content)
print("Modification appliquée.")
PY
```

```bash
grep -n "environment" app/main.tf
```

### 22. Appliquer la modification

```bash
cd app
${IAC_CLI} apply -auto-approve
cd ..
```

### 23. Vérifier les versions du fichier state

```bash
aws s3api list-object-versions \
  --bucket "${TFSTATE_BUCKET}" \
  --prefix "${TFSTATE_KEY}" \
  | tee reports/17-state-object-versions.json
```

```bash
jq '[.Versions[]? | select(.Key == "'"${TFSTATE_KEY}"'")] | length' \
  reports/17-state-object-versions.json \
  | tee reports/18-state-version-count.txt
```

Résultat attendu : au moins `2` versions.

## Vérification de non-publication

### 24. Tester l'absence d'accès public

```bash
export STATE_PUBLIC_URL="https://${TFSTATE_BUCKET}.s3.${AWS_DEFAULT_REGION}.amazonaws.com/${TFSTATE_KEY}"
echo "${STATE_PUBLIC_URL}" | tee reports/19-state-public-url.txt
```

```bash
curl -I "${STATE_PUBLIC_URL}" \
  | tee reports/20-public-access-test.txt || true
```

Résultat attendu :

```text
HTTP/1.1 403 Forbidden
```

## Politique IAM minimale recommandée

### 25. Générer une policy IAM minimale pour le backend

```bash
cat > reports/21-iam-policy-minimale-tfstate.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListTfstateBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::${TFSTATE_BUCKET}",
      "Condition": {
        "StringLike": {
          "s3:prefix": [
            "formation/tfstate-s3-minimal/*"
          ]
        }
      }
    },
    {
      "Sid": "ReadWriteTfstateObject",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::${TFSTATE_BUCKET}/${TFSTATE_KEY}",
        "arn:aws:s3:::${TFSTATE_BUCKET}/${TFSTATE_LOCK_KEY}"
      ]
    }
  ]
}
EOF
```

```bash
jq . reports/21-iam-policy-minimale-tfstate.json
```

Cette policy limite les actions au préfixe du state et aux objets nécessaires au state et au lockfile.

## Rapport de synthèse

### 26. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP : Sécuriser le tfstate avec S3 minimal"
  echo
  echo "## Environnement"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| TP | tp-tfstate-s3-minimal |"
  echo "| Région AWS | ${AWS_DEFAULT_REGION} |"
  echo "| Compte AWS | ${AWS_ACCOUNT_ID} |"
  echo "| Outil IaC | ${IAC_CLI} |"
  echo "| Bucket tfstate | ${TFSTATE_BUCKET} |"
  echo "| Clé tfstate | ${TFSTATE_KEY} |"
  echo "| Clé lockfile | ${TFSTATE_LOCK_KEY} |"
  echo
  echo "## Ressources créées"
  echo
  echo "| Ressource | Rôle |"
  echo "|---|---|"
  echo "| Bucket S3 | Stockage distant du tfstate |"
  echo "| Versioning S3 | Conservation des versions du state |"
  echo "| Chiffrement SSE-S3 | Chiffrement au repos |"
  echo "| Block Public Access | Blocage des accès publics |"
  echo "| Bucket policy TLS | Refus des accès non HTTPS |"
  echo
  echo "## Sécurisations vérifiées"
  echo
  echo "| Contrôle | Fichier de preuve |"
  echo "|---|---|"
  echo "| Block Public Access | reports/05-public-access-block.json |"
  echo "| Versioning | reports/06-bucket-versioning.json |"
  echo "| Chiffrement | reports/07-bucket-encryption.json |"
  echo "| Policy HTTPS | reports/08-bucket-policy.json |"
  echo "| Migration du state | reports/13-bucket-objects-after-migration.json |"
  echo "| Versions du state | reports/17-state-object-versions.json |"
  echo "| Test accès public | reports/20-public-access-test.txt |"
  echo
  echo "## Backend Terraform configuré"
  echo
  echo '```hcl'
  echo 'terraform {'
  echo '  backend "s3" {'
  echo "    bucket       = \"${TFSTATE_BUCKET}\""
  echo "    key          = \"${TFSTATE_KEY}\""
  echo "    region       = \"${AWS_DEFAULT_REGION}\""
  echo '    encrypt      = true'
  echo '    use_lockfile = true'
  echo '  }'
  echo '}'
  echo '```'
} > reports/rapport-tp-tfstate-s3-minimal.md
```

### 27. Afficher le rapport

```bash
cat reports/rapport-tp-tfstate-s3-minimal.md
```

### 28. Lister les fichiers générés

```bash
find . -maxdepth 3 -type f | sort \
  | tee reports/22-generated-files.txt
```

## Nettoyage

### 29. Recharger les variables si nécessaire

Si le nettoyage est effectué dans un nouveau terminal :

```bash
cd tp-tfstate-s3-minimal
source scripts/env.sh
export IAC_CLI="$(./scripts/select-iac-cli.sh)"
```

### 30. Détruire la ressource applicative

```bash
cd app
${IAC_CLI} destroy -auto-approve
cd ..
```

### 31. Supprimer les fichiers locaux du projet applicatif

```bash
rm -rf app/.terraform app/.terraform.lock.hcl
rm -f app/terraform.tfstate app/terraform.tfstate.backup
```

### 32. Vider le bucket S3 avec versions

```bash
cat > scripts/empty-versioned-bucket.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

BUCKET="${1:-}"

if [ -z "$BUCKET" ]; then
  echo "Usage: $0 <bucket-name>" >&2
  exit 1
fi

echo "Suppression des versions d'objets dans le bucket : $BUCKET"

aws s3api list-object-versions \
  --bucket "$BUCKET" \
  --output json \
  > /tmp/s3-versions.json

jq -c '.Versions[]? | {Key: .Key, VersionId: .VersionId}' /tmp/s3-versions.json \
  | while read -r object; do
    KEY=$(echo "$object" | jq -r '.Key')
    VERSION_ID=$(echo "$object" | jq -r '.VersionId')
    aws s3api delete-object \
      --bucket "$BUCKET" \
      --key "$KEY" \
      --version-id "$VERSION_ID" >/dev/null
  done

jq -c '.DeleteMarkers[]? | {Key: .Key, VersionId: .VersionId}' /tmp/s3-versions.json \
  | while read -r object; do
    KEY=$(echo "$object" | jq -r '.Key')
    VERSION_ID=$(echo "$object" | jq -r '.VersionId')
    aws s3api delete-object \
      --bucket "$BUCKET" \
      --key "$KEY" \
      --version-id "$VERSION_ID" >/dev/null
  done

rm -f /tmp/s3-versions.json
echo "Bucket vidé."
EOF
```

```bash
chmod +x scripts/empty-versioned-bucket.sh
./scripts/empty-versioned-bucket.sh "${TFSTATE_BUCKET}"
```

```bash
aws s3api list-object-versions \
  --bucket "${TFSTATE_BUCKET}" \
  | tee reports/23-bucket-versions-after-empty.json
```

### 33. Détruire le bootstrap

```bash
cd bootstrap
${IAC_CLI} destroy -auto-approve
cd ..
```

```bash
aws s3api head-bucket --bucket "${TFSTATE_BUCKET}" 2>&1 \
  && echo "Le bucket existe encore" \
  || echo "Bucket bien supprimé"
```

### 34. Supprimer les fichiers d'initialisation du bootstrap

```bash
rm -rf bootstrap/.terraform bootstrap/.terraform.lock.hcl
rm -f bootstrap/terraform.tfstate bootstrap/terraform.tfstate.backup
```

### 35. Vérifier qu'aucun state ne reste

```bash
find . -name "terraform.tfstate*" -type f
```

Résultat attendu : aucun fichier `terraform.tfstate` ne doit être présent.

### 36. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-tfstate-s3-minimal
```

## Résultat attendu

À la fin du TP, les éléments suivants doivent avoir été validés :

| Élément | Validation |
|---|---|
| Bucket S3 | Bucket dédié au tfstate créé |
| Accès public | Block Public Access activé |
| Versioning | Versioning activé |
| Chiffrement | SSE-S3 activé |
| Transport | Accès non HTTPS refusé |
| Backend S3 | `backend "s3"` configuré |
| Verrouillage | `use_lockfile = true` configuré |
| Migration | State local migré vers S3 |
| Vérification | Objet `terraform.tfstate` visible dans S3 |
| Historique | Plusieurs versions du state disponibles |
| Nettoyage | Bucket, state et fichiers locaux supprimés |

Les fichiers suivants doivent avoir été produits :

```text
app/backend.tf
app/main.tf
bootstrap/main.tf
bootstrap/terraform.tfvars
reports/01-tools-diagnostic.txt
reports/02-bootstrap-validation.txt
reports/03-bootstrap-outputs.json
reports/04-bucket-location.json
reports/05-public-access-block.json
reports/06-bucket-versioning.json
reports/07-bucket-encryption.json
reports/08-bucket-policy.json
reports/09-bucket-objects-before-migration.json
reports/13-bucket-objects-after-migration.json
reports/17-state-object-versions.json
reports/20-public-access-test.txt
reports/21-iam-policy-minimale-tfstate.json
reports/rapport-tp-tfstate-s3-minimal.md
scripts/empty-versioned-bucket.sh
scripts/env.sh
scripts/select-iac-cli.sh
```

Aucune instance EC2, aucune fonction Lambda et aucun coût supérieur au stockage S3 ne doivent être générés pendant ce TP.
