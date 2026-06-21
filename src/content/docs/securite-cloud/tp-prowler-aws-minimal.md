---
title: "TP : Scanner un compte AWS minimal avec Prowler sans coûts"
date: 2026-06-15
description: Exécuter Prowler via Docker sur un compte AWS en lecture seule, scanner IAM, S3, EC2 et CloudTrail, générer des rapports CSV/JSON/HTML locaux, extraire les findings High et Critical, et créer un gate local sans aucun coût AWS.
---

## Prérequis

### Environnement technique

* AWS CLI installé et configuré avec un profil de lab.
* Docker installé et fonctionnel.
* jq installé pour lire et filtrer les sorties JSON.
* Python 3 installé.
* Accès à un terminal Bash ou Zsh.
* Accès Internet pour télécharger l'image Prowler.

Ce TP ne crée aucune ressource AWS.

Il n'active aucun service payant.

Il n'envoie aucun résultat vers S3, Security Hub, CloudWatch, Athena ou QuickSight.

Les rapports sont générés uniquement en local.

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
sudo apt-get install -y curl unzip git jq python3 python3-pip docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER"
```

Se déconnecter puis se reconnecter si l'utilisateur vient d'être ajouté au groupe Docker.

Installer AWS CLI v2 si nécessaire :

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip
```

#### Sur macOS

```bash
brew install awscli
brew install jq
brew install python
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
aws --version
docker --version
jq --version
python3 --version
```

Sur Windows WSL2, les credentials AWS se trouvent dans `$HOME/.aws` côté WSL. Si les credentials sont configurés côté Windows natif, les copier dans le home WSL2 ou reconfigurer `aws configure` depuis WSL.

### Permissions AWS nécessaires

Le profil AWS utilisé doit disposer d'un accès en lecture sur les services ciblés :

```text
sts:GetCallerIdentity
iam:GetAccountSummary
iam:ListUsers
iam:ListPolicies
iam:GetAccountPasswordPolicy
s3:ListAllMyBuckets
s3:GetBucketPublicAccessBlock
ec2:DescribeSecurityGroups
cloudtrail:DescribeTrails
```

Si une commande retourne `AccessDenied`, le scan Prowler fonctionnera partiellement mais certains contrôles seront incomplets.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Vérifier un profil AWS en lecture seule.
* Exécuter Prowler depuis un conteneur Docker.
* Scanner un périmètre réduit de services AWS.
* Générer des rapports locaux CSV, JSON-OCSF et HTML.
* Analyser les findings par statut et par sévérité.
* Extraire les findings High et Critical.
* Créer un gate local basé sur les sévérités.
* Produire un rapport Markdown de synthèse.

## Services ciblés

| Service AWS | Raison du scan |
|---|---|
| IAM | Utilisateurs, politiques, accès et MFA |
| Account | Paramètres du compte |
| S3 | Buckets existants et leur exposition |
| EC2 | Security Groups et ressources réseau |
| CloudTrail | Traçabilité des actions |

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-prowler-aws-minimal
cd tp-prowler-aws-minimal

mkdir -p scripts reports reports/prowler
```

```bash
find . -maxdepth 3 -type d | sort
```

Résultat attendu :

```text
.
./reports
./reports/prowler
./scripts
```

### 2. Définir les variables du TP

```bash
cat > scripts/env.sh <<'EOF'
export TP_NAME="tp-prowler-aws-minimal"
export AWS_PROFILE_NAME="${AWS_PROFILE_NAME:-default}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-west-3}"
export AWS_PAGER=""
export PROWLER_IMAGE="prowlercloud/prowler:v4-stable"
export PROWLER_OUTPUT_DIR="reports/prowler"
export PROWLER_OUTPUT_NAME="prowler-aws-minimal"
export PROWLER_SERVICES="iam account s3 ec2 cloudtrail"
EOF
```

```bash
source scripts/env.sh
```

```bash
echo "$TP_NAME"
echo "$AWS_PROFILE_NAME"
echo "$AWS_DEFAULT_REGION"
echo "$PROWLER_IMAGE"
echo "$PROWLER_SERVICES"
```

### 3. Vérifier l'identité AWS

```bash
aws sts get-caller-identity \
  --profile "${AWS_PROFILE_NAME}" \
  | tee reports/00-aws-identity.json
```

```bash
export AWS_ACCOUNT_ID="$(jq -r '.Account' reports/00-aws-identity.json)"
echo "${AWS_ACCOUNT_ID}" | tee reports/01-aws-account-id.txt
```

```bash
aws configure get region \
  --profile "${AWS_PROFILE_NAME}" \
  | tee reports/02-aws-profile-region.txt || true
```

Si aucune région n'est configurée :

```bash
aws configure set region "${AWS_DEFAULT_REGION}" \
  --profile "${AWS_PROFILE_NAME}"
```

### 4. Documenter le cadrage sans coûts

```bash
cat > reports/03-cost-scope.md <<'EOF'
# Cadrage sans coûts

Ce TP ne crée aucune ressource AWS.
Ce TP n'active aucun service AWS.
Ce TP n'écrit aucun rapport dans S3.
Ce TP n'envoie aucun résultat dans AWS Security Hub.
Ce TP exécute uniquement des appels de lecture via les API AWS.
Les rapports sont stockés localement dans le dossier reports/prowler.
EOF
```

```bash
cat reports/03-cost-scope.md
```

### 5. Vérifier les permissions du profil

```bash
aws sts get-caller-identity \
  --profile "${AWS_PROFILE_NAME}" \
  --output table \
  | tee reports/04-aws-caller-identity-table.txt
```

```bash
aws iam get-account-summary \
  --profile "${AWS_PROFILE_NAME}" \
  | tee reports/05-iam-account-summary.json
```

```bash
aws s3api list-buckets \
  --profile "${AWS_PROFILE_NAME}" \
  | tee reports/06-s3-list-buckets.json
```

```bash
aws ec2 describe-security-groups \
  --profile "${AWS_PROFILE_NAME}" \
  --region "${AWS_DEFAULT_REGION}" \
  --max-results 5 \
  | tee reports/07-ec2-describe-security-groups.json
```

## Exécution de Prowler avec Docker

### 6. Télécharger l'image Prowler

Le tag `v4-stable` pointe toujours vers la dernière release stable de Prowler v4.

```bash
docker pull "${PROWLER_IMAGE}"
docker image ls | grep prowler | tee reports/08-prowler-image.txt
```

### 7. Vérifier la version de Prowler

```bash
docker run --rm "${PROWLER_IMAGE}" --version \
  | tee reports/09-prowler-version.txt
```

### 8. Lister les services disponibles

```bash
docker run --rm \
  -v "${HOME}/.aws:/home/prowler/.aws:ro" \
  "${PROWLER_IMAGE}" \
  aws --list-services \
  | tee reports/10-prowler-services.txt
```

```bash
grep -E "iam|account|s3|ec2|cloudtrail" reports/10-prowler-services.txt \
  | tee reports/11-prowler-target-services.txt || true
```

### 9. Lister quelques checks disponibles

```bash
docker run --rm \
  -v "${HOME}/.aws:/home/prowler/.aws:ro" \
  "${PROWLER_IMAGE}" \
  aws --list-checks \
  | tee reports/12-prowler-checks.txt
```

```bash
grep -Ei "mfa|root|s3|bucket|cloudtrail|security_group|public|password|access_key" \
  reports/12-prowler-checks.txt \
  | head -n 80 \
  | tee reports/13-prowler-interesting-checks.txt || true
```

## Scan AWS minimal

### 10. Lancer un scan ciblé

```bash
set +e
docker run --rm \
  -v "${HOME}/.aws:/home/prowler/.aws:ro" \
  -v "${PWD}/${PROWLER_OUTPUT_DIR}:/home/prowler/output" \
  "${PROWLER_IMAGE}" \
  aws \
  --profile "${AWS_PROFILE_NAME}" \
  -f "${AWS_DEFAULT_REGION}" \
  --services iam account s3 ec2 cloudtrail \
  -M csv json-ocsf html \
  -o /home/prowler/output \
  -F "${PROWLER_OUTPUT_NAME}" \
  --no-color \
  | tee reports/14-prowler-scan-console.txt
PROWLER_STATUS=${PIPESTATUS[0]}
set -e

echo "${PROWLER_STATUS}" | tee reports/15-prowler-scan-status.txt
```

Interpréter le code de retour :

```bash
if [ "${PROWLER_STATUS}" -eq 0 ]; then
  echo "Scan terminé sans findings bloquants selon le code retour Prowler." \
    | tee reports/16-prowler-status-interpretation.txt
elif [ "${PROWLER_STATUS}" -eq 3 ]; then
  echo "Scan terminé avec des contrôles en échec. C'est attendu dans un TP d'audit." \
    | tee reports/16-prowler-status-interpretation.txt
else
  echo "Scan terminé avec une erreur technique. Lire reports/14-prowler-scan-console.txt." \
    | tee reports/16-prowler-status-interpretation.txt
fi
```

### 11. Vérifier les rapports générés

```bash
find "${PROWLER_OUTPUT_DIR}" -type f | sort \
  | tee reports/17-prowler-output-files.txt
```

```bash
export PROWLER_CSV="$(find "${PROWLER_OUTPUT_DIR}" -type f -name "*.csv" | head -n 1)"
echo "${PROWLER_CSV}" | tee reports/18-prowler-csv-file.txt
```

```bash
export PROWLER_JSON="$(find "${PROWLER_OUTPUT_DIR}" -type f -name "*.json" | head -n 1)"
echo "${PROWLER_JSON}" | tee reports/19-prowler-json-file.txt
```

```bash
export PROWLER_HTML="$(find "${PROWLER_OUTPUT_DIR}" -type f -name "*.html" | head -n 1)"
echo "${PROWLER_HTML}" | tee reports/20-prowler-html-file.txt
```

```bash
ls -lh "${PROWLER_OUTPUT_DIR}" | tee reports/21-prowler-output-ls.txt
```

## Analyse des résultats CSV

### 12. Créer un script d'analyse CSV

```bash
cat > scripts/analyze-prowler-csv.py <<'EOF'
#!/usr/bin/env python3
import csv
import sys
from collections import Counter

if len(sys.argv) != 2:
    print("Usage: analyze-prowler-csv.py <prowler_report.csv>", file=sys.stderr)
    sys.exit(2)

path = sys.argv[1]

with open(path, newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

status_counter = Counter(row.get("STATUS", "UNKNOWN") for row in rows)
severity_counter = Counter(
    row.get("SEVERITY", "UNKNOWN")
    for row in rows
    if row.get("STATUS") == "FAIL"
)
service_counter = Counter(
    row.get("SERVICE_NAME", "UNKNOWN")
    for row in rows
    if row.get("STATUS") == "FAIL"
)

severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "informational": 4}

def sort_key(row):
    return (
        severity_order.get(row.get("SEVERITY", "").lower(), 99),
        row.get("SERVICE_NAME", ""),
        row.get("CHECK_ID", ""),
    )

print("# Synthèse Prowler")
print()
print("## Findings par statut")
print()
print("| Statut | Nombre |")
print("|---|---:|")
for status, count in sorted(status_counter.items()):
    print(f"| {status} | {count} |")

print()
print("## Findings FAIL par sévérité")
print()
print("| Sévérité | Nombre |")
print("|---|---:|")
for severity, count in sorted(severity_counter.items()):
    print(f"| {severity} | {count} |")

print()
print("## Findings FAIL par service")
print()
print("| Service | Nombre |")
print("|---|---:|")
for service, count in service_counter.most_common():
    print(f"| {service} | {count} |")

print()
print("## Top 20 des findings FAIL")
print()
print("| Sévérité | Service | Check | Ressource | Région |")
print("|---|---|---|---|---|")
failures = [row for row in rows if row.get("STATUS") == "FAIL"]
for row in sorted(failures, key=sort_key)[:20]:
    severity = row.get("SEVERITY", "")
    service = row.get("SERVICE_NAME", "")
    check = row.get("CHECK_ID", "")
    resource = row.get("RESOURCE_NAME", "") or row.get("RESOURCE_UID", "")
    region = row.get("REGION", "")
    print(f"| {severity} | {service} | {check} | {resource} | {region} |")
EOF
```

```bash
chmod +x scripts/analyze-prowler-csv.py
python3 scripts/analyze-prowler-csv.py "${PROWLER_CSV}" \
  | tee reports/22-prowler-summary.md
cat reports/22-prowler-summary.md
```

### 13. Extraire les findings en échec

```bash
cat > scripts/extract-prowler-failures.py <<'EOF'
#!/usr/bin/env python3
import csv
import sys

if len(sys.argv) != 3:
    print("Usage: extract-prowler-failures.py <input.csv> <output.tsv>", file=sys.stderr)
    sys.exit(2)

fields = [
    "SEVERITY", "SERVICE_NAME", "CHECK_ID", "CHECK_TITLE",
    "RESOURCE_NAME", "REGION", "RISK", "REMEDIATION_RECOMMENDATION_TEXT",
]

with open(sys.argv[1], newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

failures = [row for row in rows if row.get("STATUS") == "FAIL"]

with open(sys.argv[2], "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, delimiter="\t")
    writer.writerow(fields)
    for row in failures:
        writer.writerow([row.get(field, "") for field in fields])

print(f"{len(failures)} findings FAIL exportés dans {sys.argv[2]}")
EOF
```

```bash
chmod +x scripts/extract-prowler-failures.py
python3 scripts/extract-prowler-failures.py \
  "${PROWLER_CSV}" \
  reports/23-prowler-failures.tsv \
  | tee reports/24-prowler-failures-count.txt
head -n 20 reports/23-prowler-failures.tsv
```

### 14. Extraire les findings High et Critical

```bash
cat > scripts/extract-prowler-high-critical.py <<'EOF'
#!/usr/bin/env python3
import csv
import sys

if len(sys.argv) != 3:
    print("Usage: extract-prowler-high-critical.py <input.csv> <output.md>", file=sys.stderr)
    sys.exit(2)

with open(sys.argv[1], newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

selected = [
    row for row in rows
    if row.get("STATUS") == "FAIL"
    and row.get("SEVERITY", "").lower() in {"high", "critical"}
]

with open(sys.argv[2], "w", encoding="utf-8") as f:
    f.write("# Findings High et Critical\n\n")
    f.write("| Sévérité | Service | Check | Ressource | Région | Remédiation |\n")
    f.write("|---|---|---|---|---|---|\n")
    for row in selected:
        severity = row.get("SEVERITY", "")
        service = row.get("SERVICE_NAME", "")
        check = row.get("CHECK_ID", "")
        resource = row.get("RESOURCE_NAME", "") or row.get("RESOURCE_UID", "")
        region = row.get("REGION", "")
        remediation = row.get("REMEDIATION_RECOMMENDATION_TEXT", "").replace("|", "/").replace("\n", " ")
        f.write(f"| {severity} | {service} | {check} | {resource} | {region} | {remediation} |\n")

print(len(selected))
EOF
```

```bash
chmod +x scripts/extract-prowler-high-critical.py
python3 scripts/extract-prowler-high-critical.py \
  "${PROWLER_CSV}" \
  reports/25-prowler-high-critical.md \
  | tee reports/26-prowler-high-critical-count.txt
cat reports/25-prowler-high-critical.md
```

## Scans ciblés par service

### 15. Scanner uniquement IAM et Account

```bash
set +e
docker run --rm \
  -v "${HOME}/.aws:/home/prowler/.aws:ro" \
  -v "${PWD}/${PROWLER_OUTPUT_DIR}:/home/prowler/output" \
  "${PROWLER_IMAGE}" \
  aws \
  --profile "${AWS_PROFILE_NAME}" \
  --services iam account \
  -M csv html \
  -o /home/prowler/output \
  -F prowler-iam-account-minimal \
  --no-color \
  | tee reports/27-prowler-iam-account-console.txt
PROWLER_IAM_STATUS=${PIPESTATUS[0]}
set -e

echo "${PROWLER_IAM_STATUS}" | tee reports/28-prowler-iam-account-status.txt
```

```bash
export PROWLER_IAM_CSV="$(find "${PROWLER_OUTPUT_DIR}" -type f -name "*iam-account*.csv" | head -n 1)"
echo "${PROWLER_IAM_CSV}" | tee reports/29-prowler-iam-csv-file.txt
python3 scripts/analyze-prowler-csv.py "${PROWLER_IAM_CSV}" \
  | tee reports/30-prowler-iam-summary.md
cat reports/30-prowler-iam-summary.md
```

### 16. Scanner uniquement S3

```bash
set +e
docker run --rm \
  -v "${HOME}/.aws:/home/prowler/.aws:ro" \
  -v "${PWD}/${PROWLER_OUTPUT_DIR}:/home/prowler/output" \
  "${PROWLER_IMAGE}" \
  aws \
  --profile "${AWS_PROFILE_NAME}" \
  --services s3 \
  -M csv html \
  -o /home/prowler/output \
  -F prowler-s3-minimal \
  --no-color \
  | tee reports/31-prowler-s3-console.txt
PROWLER_S3_STATUS=${PIPESTATUS[0]}
set -e

echo "${PROWLER_S3_STATUS}" | tee reports/32-prowler-s3-status.txt
```

```bash
export PROWLER_S3_CSV="$(find "${PROWLER_OUTPUT_DIR}" -type f -name "*s3-minimal*.csv" | head -n 1)"
echo "${PROWLER_S3_CSV}" | tee reports/33-prowler-s3-csv-file.txt
python3 scripts/analyze-prowler-csv.py "${PROWLER_S3_CSV}" \
  | tee reports/34-prowler-s3-summary.md
cat reports/34-prowler-s3-summary.md
```

## Gate local

### 17. Créer un gate basé sur les findings critiques

```bash
cat > scripts/prowler-gate.py <<'EOF'
#!/usr/bin/env python3
import csv
import sys

if len(sys.argv) != 2:
    print("Usage: prowler-gate.py <prowler_report.csv>", file=sys.stderr)
    sys.exit(2)

with open(sys.argv[1], newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

blocking = [
    row for row in rows
    if row.get("STATUS") == "FAIL"
    and row.get("SEVERITY", "").lower() in {"critical", "high"}
]

print("Gate Prowler local")
print(f"Rapport analysé : {sys.argv[1]}")
print(f"Findings bloquants High/Critical : {len(blocking)}")

if blocking:
    print()
    print("Findings bloquants :")
    for row in blocking[:20]:
        print(
            f"- {row.get('SEVERITY')} | "
            f"{row.get('SERVICE_NAME')} | "
            f"{row.get('CHECK_ID')} | "
            f"{row.get('RESOURCE_NAME') or row.get('RESOURCE_UID')}"
        )
    sys.exit(1)

print("Gate accepté : aucun finding High/Critical en échec.")
EOF
```

```bash
chmod +x scripts/prowler-gate.py
```

```bash
set +e
python3 scripts/prowler-gate.py "${PROWLER_CSV}" \
  | tee reports/35-prowler-gate.txt
GATE_STATUS=${PIPESTATUS[0]}
set -e

echo "${GATE_STATUS}" | tee reports/36-prowler-gate-status.txt
```

```bash
if [ "${GATE_STATUS}" -ne 0 ]; then
  echo "Gate refusé : findings High ou Critical présents." \
    | tee reports/37-prowler-gate-result.txt
else
  echo "Gate accepté : aucun finding High ou Critical." \
    | tee reports/37-prowler-gate-result.txt
fi
```

## Lecture du rapport HTML

### 18. Ouvrir le rapport HTML local

```bash
echo "${PROWLER_HTML}"
```

Sur Linux :

```bash
xdg-open "${PROWLER_HTML}" || true
```

Sur macOS :

```bash
open "${PROWLER_HTML}"
```

Sur Windows WSL :

```bash
explorer.exe "$(wslpath -w "${PROWLER_HTML}")"
```

Dans le rapport HTML, analyser les statuts `PASS`, `FAIL` et `MANUAL`, les sévérités, les ressources concernées et les remédiations recommandées.

## Rapport de synthèse

### 19. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP : Prowler sur compte AWS minimal sans coûts"
  echo
  echo "## Environnement"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| TP | ${TP_NAME} |"
  echo "| Compte AWS | ${AWS_ACCOUNT_ID} |"
  echo "| Profil AWS | ${AWS_PROFILE_NAME} |"
  echo "| Région ciblée | ${AWS_DEFAULT_REGION} |"
  echo "| Image Prowler | ${PROWLER_IMAGE} |"
  echo "| Services ciblés | ${PROWLER_SERVICES} |"
  echo
  echo "## Cadrage sans coûts"
  echo
  echo "| Élément | Statut |"
  echo "|---|---|"
  echo "| Création de ressource AWS | Non |"
  echo "| Activation Security Hub | Non |"
  echo "| Export vers S3 | Non |"
  echo "| Export vers CloudWatch | Non |"
  echo "| Scan en lecture seule | Oui |"
  echo "| Rapports locaux | Oui |"
  echo
  echo "## Rapports générés"
  echo
  echo "| Format | Fichier |"
  echo "|---|---|"
  echo "| CSV | ${PROWLER_CSV} |"
  echo "| JSON-OCSF | ${PROWLER_JSON} |"
  echo "| HTML | ${PROWLER_HTML} |"
  echo "| Synthèse globale | reports/22-prowler-summary.md |"
  echo "| Findings FAIL | reports/23-prowler-failures.tsv |"
  echo "| Findings High/Critical | reports/25-prowler-high-critical.md |"
  echo "| Gate local | reports/35-prowler-gate.txt |"
  echo
  echo "## Interprétation"
  echo
  echo "Un finding FAIL indique qu'une configuration ne respecte pas une bonne pratique."
  echo "Les findings High et Critical doivent être analysés en priorité."
  echo "Certaines vérifications peuvent retourner AccessDenied selon les permissions du profil."
  echo "Aucune remédiation automatique n'est exécutée."
} > reports/rapport-tp-prowler-aws-minimal.md
```

### 20. Afficher le rapport

```bash
cat reports/rapport-tp-prowler-aws-minimal.md
```

### 21. Lister les fichiers générés

```bash
find . -maxdepth 4 -type f | sort \
  | tee reports/38-generated-files.txt
```

## Nettoyage

### 22. Vérifier les conteneurs temporaires

Prowler a été exécuté avec `docker run --rm`. Aucun conteneur persistant ne doit rester.

```bash
docker ps -a | grep prowler || true
```

### 23. Supprimer l'image Prowler (optionnel)

```bash
docker image ls | grep prowler || true
docker image rm "${PROWLER_IMAGE}" || true
```

### 24. Confirmer l'absence de modifications AWS

Ce TP n'a exécuté aucune commande de création ou modification AWS. Les seules commandes AWS utilisées sont des appels en lecture (`get-caller-identity`, `list-buckets`, `describe-security-groups`, `get-account-summary`).

```bash
grep -E "^aws " scripts/env.sh || true
```

Résultat attendu : aucune commande de création, modification ou activation.

### 25. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-prowler-aws-minimal
```

## Résultat attendu

À la fin du TP, les éléments suivants doivent avoir été validés :

| Élément | Validation |
|---|---|
| Profil AWS | Identité AWS vérifiée |
| Coûts | Aucune ressource AWS créée |
| Prowler | Exécution via Docker |
| Scan minimal | Services IAM, Account, S3, EC2 et CloudTrail scannés |
| Région | Scan limité à une région pour les services régionaux |
| Rapports | CSV, JSON-OCSF et HTML générés localement |
| Analyse | Findings PASS, FAIL et MANUAL analysés |
| Gate | High et Critical utilisés comme critère de blocage |
| Rapport | Synthèse Markdown disponible |

Aucune ressource AWS n'est créée, modifiée ou supprimée pendant ce TP.
