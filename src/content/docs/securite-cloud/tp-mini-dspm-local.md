---
title: "TP : Mini-DSPM local avec MinIO, scripts de classification et Gitleaks"
date: 2026-06-14
description: Déployer un stockage objet local avec MinIO, classifier des données sensibles avec un script Python, détecter des secrets avec Gitleaks et produire un rapport de type mini-DSPM.
---

## Prérequis

### Environnement technique

* Docker installé et fonctionnel.
* Accès à un terminal Bash ou Zsh.
* Python 3 installé.
* jq installé pour lire et filtrer les rapports JSON.
* Accès Internet pour télécharger les images Docker.
* Optionnel : lsof pour vérifier que les ports MinIO sont libres avant démarrage.

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

### Outils utilisés

Les outils utilisés via Docker sont :

```text
minio/minio:RELEASE.2025-04-22T22-12-26Z
minio/mc:RELEASE.2025-04-16T18-13-26Z
ghcr.io/gitleaks/gitleaks:v8.30.0
```

Les scripts de classification utilisent uniquement Python 3 et la bibliothèque standard.

### Précaution

Ce TP crée uniquement un environnement local.

Les secrets, données personnelles et données financières utilisés dans ce TP sont factices.

Ne jamais utiliser de vrais secrets, vrais tokens, vraies clés cloud, vrais numéros de carte, vraies données RH ou vraies données client dans un support de formation.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Déployer un stockage objet local compatible S3 avec MinIO.
* Créer plusieurs buckets représentant différentes zones de données.
* Découvrir les objets présents dans les buckets.
* Classifier des données sensibles avec un script local.
* Détecter des secrets exposés avec Gitleaks.
* Distinguer données personnelles, données financières et secrets techniques.
* Identifier les données sensibles placées dans une zone exposée.
* Prioriser les risques selon la sensibilité et l'exposition.
* Appliquer une première remédiation.
* Produire un rapport local de type mini-DSPM.

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-mini-dspm-local
cd tp-mini-dspm-local

mkdir -p datasets/raw/hr
mkdir -p datasets/raw/customers
mkdir -p datasets/raw/finance
mkdir -p datasets/raw/app
mkdir -p datasets/public
mkdir -p reports
mkdir -p scripts
mkdir -p mirror
mkdir -p minio-data

rm -rf .mc
```

### 2. Définir les variables du TP

```bash
export MINIO_ROOT_USER="minioadmin"
export MINIO_ROOT_PASSWORD="minioadmin123"

export MINIO_CONTAINER_NAME="minio-dspm"
export MINIO_NETWORK_NAME="dspm-net"

export MINIO_IMAGE="minio/minio:RELEASE.2025-04-22T22-12-26Z"
export MC_IMAGE="minio/mc:RELEASE.2025-04-16T18-13-26Z"
export GITLEAKS_IMAGE="ghcr.io/gitleaks/gitleaks:v8.30.0"

export BUCKET_RAW="dspm-raw"
export BUCKET_PUBLIC="dspm-public"
export BUCKET_QUARANTINE="dspm-quarantine"
```

### 3. Télécharger les images Docker

```bash
docker pull "${MINIO_IMAGE}"
docker pull "${MC_IMAGE}"
docker pull "${GITLEAKS_IMAGE}"
```

### 4. Vérifier que les ports MinIO sont disponibles

MinIO utilise ici les ports locaux `9000` pour l'API S3 et `9001` pour la console web.

```bash
if command -v lsof >/dev/null 2>&1; then
  if lsof -i :9000 -i :9001 >/dev/null 2>&1; then
    echo "Les ports 9000 ou 9001 sont déjà utilisés."
    lsof -i :9000 -i :9001
    exit 1
  fi
else
  echo "lsof non disponible : vérifier manuellement les ports 9000 et 9001 si MinIO ne démarre pas."
fi
```

### 5. Créer le réseau Docker local

```bash
docker network inspect "${MINIO_NETWORK_NAME}" >/dev/null 2>&1 \
  || docker network create "${MINIO_NETWORK_NAME}"
```

### 6. Démarrer MinIO

```bash
docker rm -f "${MINIO_CONTAINER_NAME}" >/dev/null 2>&1 || true

docker run -d \
  --name "${MINIO_CONTAINER_NAME}" \
  --network "${MINIO_NETWORK_NAME}" \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER="${MINIO_ROOT_USER}" \
  -e MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD}" \
  -v "$PWD/minio-data:/data" \
  "${MINIO_IMAGE}" \
  server /data --console-address ":9001"
```

La console MinIO est disponible localement à l'adresse suivante :

```text
http://localhost:9001
```

### 7. Vérifier que MinIO est démarré

```bash
docker ps --filter "name=${MINIO_CONTAINER_NAME}"
```

### 8. Configurer l'alias MinIO avec mc

```bash
for i in $(seq 1 30); do
  if docker run --rm \
    --network "${MINIO_NETWORK_NAME}" \
    -v "$PWD:/workdir" \
    "${MC_IMAGE}" \
    --config-dir /workdir/.mc \
    alias set local "http://${MINIO_CONTAINER_NAME}:9000" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"; then
    echo "Alias MinIO configuré"
    break
  fi

  if [ "$i" = "30" ]; then
    echo "MinIO n'est pas prêt après 30 tentatives"
    echo "Vérifier les logs avec : docker logs ${MINIO_CONTAINER_NAME}"
    exit 1
  fi

  sleep 2
done
```

### 9. Créer les buckets MinIO

```bash
docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  mb --ignore-existing "local/${BUCKET_RAW}"

docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  mb --ignore-existing "local/${BUCKET_PUBLIC}"

docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  mb --ignore-existing "local/${BUCKET_QUARANTINE}"
```

### 10. Simuler une zone publique

Cette étape rend le bucket `dspm-public` téléchargeable anonymement.

```bash
docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  anonymous set download "local/${BUCKET_PUBLIC}"
```

### 11. Vérifier la politique anonyme du bucket public

```bash
docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  anonymous get "local/${BUCKET_PUBLIC}"
```

### 12. Créer un fichier RH contenant des données personnelles factices

```bash
cat > datasets/raw/hr/employees.csv <<'EOF'
employee_id,first_name,last_name,email,phone,nir
E001,Alice,Martin,alice.martin@example.local,0611223344,1 84 12 75 123 456 78
E002,Karim,Benali,karim.benali@example.local,0622334455,2 91 03 31 987 654 32
EOF
```

### 13. Créer un fichier client contenant des données personnelles et financières factices

```bash
cat > datasets/raw/customers/customers.csv <<'EOF'
customer_id,email,phone,credit_card
C001,client.one@example.local,0712345678,4111111111111111
C002,client.two@example.local,0798765432,5555555555554444
EOF
```

### 14. Créer un fichier finance contenant des IBAN factices

```bash
cat > datasets/raw/finance/payments.csv <<'EOF'
payment_id,beneficiary,iban,amount
P001,Fournisseur A,FR76 3000 6000 0112 3456 7890 189,1200.50
P002,Fournisseur B,FR14 2004 1010 0505 0001 3M02 606,850.00
EOF
```

### 15. Créer un fichier applicatif contenant des secrets factices

Le token Slack est volontairement représenté sous un format non réel (`TRAINTOKEN`) pour éviter tout déclenchement des systèmes de protection de secrets lors du partage de ce support de formation. En environnement de lab réel, un token au format `xoxb-NNNNN-NNNNN-XXXX` serait détecté par Gitleaks.

```bash
cat > datasets/raw/app/config.env <<'EOF'
AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuv1234
SLACK_BOT_TOKEN=xoxb-TRAINTOKEN-TRAINTOKEN-TRAININGTRAININGTRAININGTRAININGTRAINING
DATABASE_PASSWORD=SuperSecretPassword123!
EOF
```

### 16. Créer un fichier public non sensible

```bash
cat > datasets/public/readme.txt <<'EOF'
Jeu de données public de démonstration.
Aucune donnée sensible ne doit être présente dans ce bucket.
EOF
```

### 17. Créer une erreur volontaire : données sensibles dans une zone publique

Ce fichier simule une mauvaise pratique : une extraction client contenant des données sensibles déposée dans une zone exposée.

```bash
cat > datasets/public/customer-export-public.csv <<'EOF'
customer_id,email,phone,credit_card
C999,exposed.customer@example.local,0601020304,4111111111111111
EOF
```

### 18. Charger les données dans MinIO

```bash
docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  mirror --overwrite /workdir/datasets/raw "local/${BUCKET_RAW}"

docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  mirror --overwrite /workdir/datasets/public "local/${BUCKET_PUBLIC}"
```

### 19. Lister les buckets

```bash
docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  ls local
```

### 20. Inventorier les objets MinIO

```bash
: > reports/minio-inventory.jsonl

for bucket in "${BUCKET_RAW}" "${BUCKET_PUBLIC}" "${BUCKET_QUARANTINE}"; do
  docker run --rm \
    --network "${MINIO_NETWORK_NAME}" \
    -v "$PWD:/workdir" \
    "${MC_IMAGE}" \
    --config-dir /workdir/.mc \
    ls --recursive --json "local/${bucket}" >> reports/minio-inventory.jsonl
done
```

### 21. Lire le nombre d'objets inventoriés

```bash
jq -s 'length' reports/minio-inventory.jsonl
```

### 22. Afficher une synthèse de l'inventaire

```bash
jq -rs '.[] | [
  (.key // .name // "non renseigné"),
  (.size // "non renseigné"),
  (.lastModified // .time // "non renseigné")
] | @tsv' reports/minio-inventory.jsonl
```

### 23. Copier les objets MinIO vers un miroir local

```bash
rm -rf mirror
mkdir -p mirror

docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  mirror --overwrite "local/${BUCKET_RAW}" /workdir/mirror/${BUCKET_RAW}

docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  mirror --overwrite "local/${BUCKET_PUBLIC}" /workdir/mirror/${BUCKET_PUBLIC}
```

### 24. Vérifier le miroir local

```bash
find mirror -type f -print
```

### 25. Créer le script de classification

Ce script recherche des motifs sensibles dans les fichiers texte :

* secrets techniques ;
* emails ;
* numéros de téléphone ;
* NIR factices ;
* IBAN ;
* numéros de cartes de test ;
* mots de passe ou tokens génériques.

```bash
cat > scripts/classify_data.py <<'EOF'
import csv
import json
import re
import sys
from pathlib import Path

if len(sys.argv) != 4:
    print("Usage: python3 classify_data.py <root_dir> <findings_json> <summary_csv>")
    sys.exit(1)

root_dir = Path(sys.argv[1])
findings_json = Path(sys.argv[2])
summary_csv = Path(sys.argv[3])

severity_rank = {
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
    "CRITICAL": 4,
}

rules = [
    {
        "category": "SECRETS",
        "name": "AWS_ACCESS_KEY_ID",
        "severity": "CRITICAL",
        "score": 100,
        "pattern": r"\bAKIA[0-9A-Z]{16}\b",
    },
    {
        "category": "SECRETS",
        "name": "AWS_SECRET_ACCESS_KEY",
        "severity": "CRITICAL",
        "score": 100,
        "pattern": r"(?i)aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{40}",
    },
    {
        "category": "SECRETS",
        "name": "GITHUB_TOKEN",
        "severity": "CRITICAL",
        "score": 100,
        "pattern": r"\bghp_[A-Za-z0-9]{36}\b",
    },
    {
        "category": "SECRETS",
        "name": "GENERIC_PASSWORD_OR_TOKEN",
        "severity": "HIGH",
        "score": 80,
        "pattern": r"(?i)\b(password|passwd|pwd|secret|token)\b\s*[:=]\s*['\"]?[^'\"\s]{8,}",
    },
    {
        "category": "PII",
        "name": "EMAIL",
        "severity": "MEDIUM",
        "score": 50,
        "pattern": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
    },
    {
        "category": "PII",
        "name": "PHONE_FR",
        "severity": "MEDIUM",
        "score": 50,
        "pattern": r"\b(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}\b",
    },
    {
        "category": "PII",
        "name": "NIR_FR",
        "severity": "HIGH",
        "score": 80,
        "pattern": r"\b[12]\s?\d{2}\s?(?:0[1-9]|1[0-2])\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b",
    },
    {
        "category": "FINANCIAL",
        "name": "IBAN_FR",
        "severity": "HIGH",
        "score": 80,
        "pattern": r"\bFR\d{2}(?:[ ]?[0-9A-Z]{4}){5}[ ]?[0-9A-Z]{3}\b",
    },
    {
        "category": "FINANCIAL",
        "name": "CREDIT_CARD_TEST",
        "severity": "HIGH",
        "score": 80,
        "pattern": r"\b(?:4[0-9]{15}|5[1-5][0-9]{14})\b",
    },
]

compiled_rules = [
    {**rule, "regex": re.compile(rule["pattern"])}
    for rule in rules
]

def read_text_file(path: Path):
    try:
        raw = path.read_bytes()
    except OSError:
        return None

    if b"\x00" in raw[:4096]:
        return None

    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("utf-8", errors="ignore")

def redact(value: str) -> str:
    value = value.strip()
    if len(value) <= 8:
        return "***"
    return value[:4] + "***" + value[-4:]

def exposure_for(relative_path: str) -> str:
    if relative_path.startswith("dspm-public/"):
        return "PUBLIC"
    return "PRIVATE"

def recommendation(categories, exposure, max_severity):
    categories = set(categories)

    if "SECRETS" in categories and exposure == "PUBLIC":
        return "Révoquer les secrets, supprimer l'objet exposé, enquêter sur les accès"
    if "SECRETS" in categories:
        return "Révoquer les secrets et déplacer la configuration vers un gestionnaire de secrets"
    if exposure == "PUBLIC" and ("PII" in categories or "FINANCIAL" in categories):
        return "Retirer de la zone publique et restreindre l'accès"
    if "FINANCIAL" in categories:
        return "Restreindre l'accès et vérifier la durée de conservation"
    if "PII" in categories:
        return "Classer comme donnée personnelle et appliquer une politique d'accès"
    if max_severity == "LOW":
        return "Conserver en surveillance"
    return "Vérifier manuellement la classification"

findings = []
summary_by_file = {}

for path in sorted(root_dir.rglob("*")):
    if not path.is_file():
        continue

    text = read_text_file(path)
    if text is None:
        continue

    relative_path = str(path.relative_to(root_dir))
    exposure = exposure_for(relative_path)

    file_findings = []

    for line_number, line in enumerate(text.splitlines(), start=1):
        for rule in compiled_rules:
            for match in rule["regex"].finditer(line):
                finding = {
                    "file": relative_path,
                    "line_number": line_number,
                    "category": rule["category"],
                    "rule": rule["name"],
                    "severity": rule["severity"],
                    "score": rule["score"],
                    "exposure": exposure,
                    "redacted_value": redact(match.group(0)),
                }
                findings.append(finding)
                file_findings.append(finding)

    if file_findings:
        categories = sorted({finding["category"] for finding in file_findings})
        severities = [finding["severity"] for finding in file_findings]
        max_severity = max(severities, key=lambda sev: severity_rank[sev])
        base_score = max(finding["score"] for finding in file_findings)
        exposure_bonus = 30 if exposure == "PUBLIC" else 0
        priority_score = min(100, base_score + exposure_bonus)

        summary_by_file[relative_path] = {
            "file": relative_path,
            "exposure": exposure,
            "categories": "|".join(categories),
            "findings": len(file_findings),
            "max_severity": max_severity,
            "priority_score": priority_score,
            "recommendation": recommendation(categories, exposure, max_severity),
        }

findings_json.write_text(json.dumps(findings, indent=2, ensure_ascii=False), encoding="utf-8")

with summary_csv.open("w", newline="", encoding="utf-8") as f:
    fieldnames = [
        "file",
        "exposure",
        "categories",
        "findings",
        "max_severity",
        "priority_score",
        "recommendation",
    ]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()

    for row in sorted(summary_by_file.values(), key=lambda item: item["priority_score"], reverse=True):
        writer.writerow(row)

print(f"Findings écrits dans {findings_json}")
print(f"Synthèse écrite dans {summary_csv}")
print(f"Nombre de fichiers sensibles : {len(summary_by_file)}")
print(f"Nombre total de findings : {len(findings)}")
EOF
```

### 26. Exécuter la classification

```bash
python3 scripts/classify_data.py \
  mirror \
  reports/classification-findings.json \
  reports/classification-summary.csv
```

### 27. Lire le nombre total de findings de classification

```bash
jq 'length' reports/classification-findings.json
```

### 28. Afficher les fichiers classifiés comme sensibles

```bash
cat reports/classification-summary.csv
```

### 29. Afficher les findings critiques

```bash
jq -r '.[] | select(.severity == "CRITICAL") | [.file, .line_number, .category, .rule, .exposure, .redacted_value] | @tsv' reports/classification-findings.json
```

### 30. Scanner le miroir local avec Gitleaks

```bash
docker run --rm \
  -v "$PWD/mirror:/repo" \
  -v "$PWD/reports:/reports" \
  "${GITLEAKS_IMAGE}" \
  dir /repo \
  --report-format json \
  --report-path /reports/gitleaks-minio-mirror.json \
  --redact \
  --exit-code 1
```

```bash
echo "Code de retour Gitleaks : $?"
```

### 31. Lire le nombre de findings Gitleaks

```bash
jq 'length' reports/gitleaks-minio-mirror.json
```

### 32. Afficher une synthèse des findings Gitleaks

```bash
jq -r '.[]? | [.RuleID, .File, .StartLine, .Description] | @tsv' reports/gitleaks-minio-mirror.json
```

### 33. Créer le script de priorisation DSPM

```bash
cat > scripts/build_dspm_report.py <<'EOF'
import csv
import json
import sys
from pathlib import Path

if len(sys.argv) != 5:
    print("Usage: python3 build_dspm_report.py <classification_csv> <gitleaks_json> <output_csv> <output_md>")
    sys.exit(1)

classification_csv = Path(sys.argv[1])
gitleaks_json = Path(sys.argv[2])
output_csv = Path(sys.argv[3])
output_md = Path(sys.argv[4])

def normalize_path(value: str) -> str:
    value = value.replace("\\", "/")
    value = value.replace("/repo/", "")
    value = value.lstrip("/")
    return value

def priority_label(score: int) -> str:
    if score >= 90:
        return "P1"
    if score >= 70:
        return "P2"
    if score >= 50:
        return "P3"
    return "P4"

with classification_csv.open("r", encoding="utf-8") as f:
    classification_rows = list(csv.DictReader(f))

try:
    gitleaks_findings = json.loads(gitleaks_json.read_text(encoding="utf-8"))
except json.JSONDecodeError:
    gitleaks_findings = []

gitleaks_by_file = {}

for finding in gitleaks_findings:
    file_path = normalize_path(finding.get("File", ""))
    if file_path:
        gitleaks_by_file[file_path] = gitleaks_by_file.get(file_path, 0) + 1

prioritized_rows = []

for row in classification_rows:
    file_path = normalize_path(row["file"])
    gitleaks_count = 0

    for gitleaks_file, count in gitleaks_by_file.items():
        if gitleaks_file == file_path or gitleaks_file.endswith(file_path) or file_path.endswith(gitleaks_file):
            gitleaks_count += count

    classification_score = int(row["priority_score"])
    final_score = min(100, classification_score + (20 if gitleaks_count > 0 else 0))

    if gitleaks_count > 0 and row["exposure"] == "PUBLIC":
        action = "Révoquer les secrets, supprimer l'exposition publique, vérifier les accès"
    elif gitleaks_count > 0:
        action = "Révoquer les secrets et déplacer la configuration vers un gestionnaire de secrets"
    else:
        action = row["recommendation"]

    prioritized_rows.append({
        "priority": priority_label(final_score),
        "final_score": final_score,
        "file": file_path,
        "exposure": row["exposure"],
        "categories": row["categories"],
        "classification_findings": row["findings"],
        "gitleaks_findings": gitleaks_count,
        "max_severity": row["max_severity"],
        "recommended_action": action,
    })

prioritized_rows.sort(key=lambda item: item["final_score"], reverse=True)

with output_csv.open("w", newline="", encoding="utf-8") as f:
    fieldnames = [
        "priority",
        "final_score",
        "file",
        "exposure",
        "categories",
        "classification_findings",
        "gitleaks_findings",
        "max_severity",
        "recommended_action",
    ]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(prioritized_rows)

with output_md.open("w", encoding="utf-8") as f:
    f.write("# Rapport mini-DSPM local\n\n")
    f.write("## Synthèse\n\n")
    f.write(f"- Fichiers sensibles identifiés : {len(prioritized_rows)}\n")
    f.write(f"- Findings Gitleaks : {len(gitleaks_findings)}\n")
    f.write("- Modèle de priorité : sensibilité + exposition + présence de secrets\n\n")

    f.write("## Priorités\n\n")
    f.write("| Priorité | Score | Fichier | Exposition | Catégories | Findings classification | Findings Gitleaks | Action recommandée |\n")
    f.write("|---|---:|---|---|---|---:|---:|---|\n")

    for row in prioritized_rows:
        f.write(
            f"| {row['priority']} | {row['final_score']} | {row['file']} | {row['exposure']} | "
            f"{row['categories']} | {row['classification_findings']} | {row['gitleaks_findings']} | "
            f"{row['recommended_action']} |\n"
        )

print(f"Priorités écrites dans {output_csv}")
print(f"Rapport écrit dans {output_md}")
EOF
```

### 34. Construire le rapport de priorisation DSPM

```bash
python3 scripts/build_dspm_report.py \
  reports/classification-summary.csv \
  reports/gitleaks-minio-mirror.json \
  reports/dspm-priorities.csv \
  reports/dspm-report.md
```

### 35. Afficher les priorités DSPM

```bash
cat reports/dspm-priorities.csv
```

### 36. Afficher le rapport mini-DSPM

```bash
cat reports/dspm-report.md
```

### 37. Identifier les objets publics à risque

```bash
python3 - <<'PY'
import csv
import sys

with open("reports/dspm-priorities.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    writer = csv.DictWriter(sys.stdout, fieldnames=reader.fieldnames)

    writer.writeheader()

    for row in reader:
        if row.get("exposure") == "PUBLIC":
            writer.writerow(row)
PY
```

### 38. Restreindre l'accès anonyme au bucket public

```bash
docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  anonymous set none "local/${BUCKET_PUBLIC}"
```

### 39. Vérifier que l'accès anonyme est restreint

```bash
docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  anonymous get "local/${BUCKET_PUBLIC}"
```

### 40. Déplacer l'export client exposé vers le bucket de quarantaine

```bash
docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  mv "local/${BUCKET_PUBLIC}/customer-export-public.csv" "local/${BUCKET_QUARANTINE}/customer-export-public.csv"
```

### 41. Vérifier les objets après remédiation

```bash
docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  ls --recursive "local/${BUCKET_PUBLIC}"

docker run --rm \
  --network "${MINIO_NETWORK_NAME}" \
  -v "$PWD:/workdir" \
  "${MC_IMAGE}" \
  --config-dir /workdir/.mc \
  ls --recursive "local/${BUCKET_QUARANTINE}"
```

### 42. Créer un rapport de synthèse final

```bash
{
  echo "# Synthèse du TP Mini-DSPM local"
  echo
  echo "## Buckets"
  echo
  echo "| Bucket | Rôle |"
  echo "|---|---|"
  echo "| ${BUCKET_RAW} | Zone de données brute |"
  echo "| ${BUCKET_PUBLIC} | Zone publique simulée |"
  echo "| ${BUCKET_QUARANTINE} | Zone de quarantaine |"
  echo
  echo "## Rapports générés"
  echo
  echo "- reports/minio-inventory.jsonl"
  echo "- reports/classification-findings.json"
  echo "- reports/classification-summary.csv"
  echo "- reports/gitleaks-minio-mirror.json"
  echo "- reports/dspm-priorities.csv"
  echo "- reports/dspm-report.md"
  echo
  echo "## Enseignements"
  echo
  echo "- Les données sensibles doivent être découvertes automatiquement."
  echo "- Les secrets techniques doivent être détectés et révoqués."
  echo "- Une donnée sensible exposée publiquement doit être priorisée."
  echo "- La classification seule ne suffit pas : l'exposition modifie la criticité."
  echo "- Une approche DSPM combine découverte, classification, exposition et priorisation."
} > reports/mini-dspm-summary.md
```

### 43. Afficher la synthèse finale

```bash
cat reports/mini-dspm-summary.md
```

### 44. Lister tous les rapports générés

```bash
find reports -maxdepth 1 -type f -print
```

## Nettoyage

### 45. Supprimer le conteneur MinIO

```bash
docker rm -f "${MINIO_CONTAINER_NAME}" >/dev/null 2>&1 || true
```

### 46. Supprimer le réseau Docker

```bash
docker network rm "${MINIO_NETWORK_NAME}" >/dev/null 2>&1 || true
```

### 47. Supprimer la configuration locale mc

```bash
rm -rf .mc
```

### 48. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-mini-dspm-local
```

## Résultat attendu

À la fin du TP, l'apprenant doit avoir produit les fichiers suivants :

```text
reports/minio-inventory.jsonl
reports/classification-findings.json
reports/classification-summary.csv
reports/gitleaks-minio-mirror.json
reports/dspm-priorities.csv
reports/dspm-report.md
reports/mini-dspm-summary.md
```

L'analyse doit permettre d'observer :

```text
Des données personnelles peuvent être découvertes dans des fichiers RH ou client.
Des données financières peuvent être détectées dans des exports CSV.
Des secrets techniques peuvent être détectés par script et par Gitleaks.
Une donnée sensible placée dans un bucket public simulé devient prioritaire.
La priorisation combine sensibilité, exposition et présence de secrets.
La remédiation consiste à restreindre l'exposition, déplacer les données sensibles et révoquer les secrets.
```

Aucun vrai secret, aucune vraie donnée personnelle et aucune vraie donnée financière ne doivent être utilisés pendant ce TP.
