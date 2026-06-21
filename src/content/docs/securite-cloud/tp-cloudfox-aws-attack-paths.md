---
title: "TP : Cartographier les chemins d'attaque AWS avec CloudFox"
date: 2026-06-15
description: Utiliser CloudFox en lecture seule pour cartographier les principaux IAM, permissions, trusts, workloads, endpoints et secrets d'un compte AWS, puis produire une matrice de chemins d'attaque et un graphe DOT sans créer aucune ressource.
---

## Prérequis

### Environnement technique

* AWS CLI installé et configuré avec un profil de lab.
* CloudFox installé (v1.17.0 minimum requis).
* jq installé pour lire et filtrer les sorties JSON.
* Python 3 installé.
* Graphviz installé pour générer les graphes DOT.
* Accès à un terminal Bash ou Zsh.
* Accès Internet pour télécharger CloudFox et appeler les API AWS.

Ce TP ne crée aucune ressource AWS.

Il n'exécute aucune action offensive active.

Il n'exploite aucune vulnérabilité.

Il n'exécute pas les commandes de loot générées par CloudFox.

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
sudo apt-get install -y curl wget git jq python3 python3-pip graphviz golang-go
```

Installer AWS CLI si nécessaire :

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip
```

Installer CloudFox (v1.17.0 minimum — les versions antérieures ne fonctionnent plus depuis décembre 2025) :

```bash
go install github.com/BishopFox/cloudfox@v1.17.0
export PATH="$HOME/go/bin:$PATH"
echo 'export PATH="$HOME/go/bin:$PATH"' >> ~/.bashrc
```

#### Sur macOS

```bash
brew install awscli
brew install cloudfox
brew install jq
brew install python
brew install graphviz
```

#### Sur Windows

L'environnement recommandé est WSL2 avec Ubuntu :

```powershell
wsl --version
wsl --install -d Ubuntu
```

Dans Ubuntu WSL, suivre la section Debian / Ubuntu.

### Vérification des outils

```bash
aws --version
cloudfox version 2>/dev/null || cloudfox --version || true
jq --version
python3 --version
dot -V
```

### Permissions AWS recommandées

CloudFox fonctionne en lecture seule. Il a besoin de suffisamment de permissions pour lire IAM, EC2, S3, CloudTrail, Lambda, ECS, EKS, RDS et d'autres services.

| Politique | Rôle |
|---|---|
| `SecurityAudit` | Couverture de nombreux contrôles de sécurité |
| `ViewOnlyAccess` | Lecture large des ressources |

Ne pas utiliser le compte root AWS. Ne pas utiliser un profil de production sans autorisation préalable.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Vérifier un profil AWS en lecture seule.
* Lancer un inventaire CloudFox.
* Cartographier les principaux et permissions IAM.
* Identifier les relations de confiance entre rôles.
* Simuler des permissions sensibles avec `iam-simulator`.
* Identifier des workloads avec permissions sensibles.
* Cartographier les endpoints, ports et interfaces réseau.
* Identifier les buckets S3 et secrets référencés.
* Analyser les fichiers CSV générés par CloudFox.
* Produire une matrice de chemins d'attaque et un graphe DOT.

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-cloudfox-aws-attack-paths
cd tp-cloudfox-aws-attack-paths

mkdir -p scripts reports reports/cloudfox reports/analysis graphs
```

```bash
find . -maxdepth 3 -type d | sort
```

Résultat attendu :

```text
.
./graphs
./reports
./reports/analysis
./reports/cloudfox
./scripts
```

### 2. Définir les variables du TP

```bash
cat > scripts/env.sh <<'EOF'
export TP_NAME="tp-cloudfox-aws-attack-paths"
export AWS_PROFILE_NAME="${AWS_PROFILE_NAME:-default}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-west-3}"
export AWS_PAGER=""
export CLOUDFOX_OUTPUT_ROOT="cloudfox-output"
export LOCAL_CLOUDFOX_COPY="reports/cloudfox"
export REPORTS_DIR="reports"
export ANALYSIS_DIR="reports/analysis"
export GRAPHS_DIR="graphs"
EOF
```

```bash
source scripts/env.sh
```

```bash
echo "$TP_NAME"
echo "$AWS_PROFILE_NAME"
echo "$AWS_DEFAULT_REGION"
```

### 3. Vérifier l'identité AWS

```bash
aws sts get-caller-identity \
  --profile "${AWS_PROFILE_NAME}" \
  | tee reports/00-aws-identity.json
```

```bash
export AWS_ACCOUNT_ID="$(jq -r '.Account' reports/00-aws-identity.json)"
export AWS_CALLER_ARN="$(jq -r '.Arn' reports/00-aws-identity.json)"
echo "${AWS_ACCOUNT_ID}" | tee reports/01-aws-account-id.txt
echo "${AWS_CALLER_ARN}" | tee reports/02-aws-caller-arn.txt
```

```bash
aws configure get region \
  --profile "${AWS_PROFILE_NAME}" \
  | tee reports/03-aws-profile-region.txt || true
```

Si aucune région n'est configurée :

```bash
aws configure set region "${AWS_DEFAULT_REGION}" \
  --profile "${AWS_PROFILE_NAME}"
```

### 4. Vérifier CloudFox

```bash
cloudfox version 2>/dev/null || cloudfox --version \
  | tee reports/04-cloudfox-version.txt
```

```bash
cloudfox aws -h | tee reports/05-cloudfox-aws-help.txt
cloudfox aws inventory -h | tee reports/06-cloudfox-inventory-help.txt
```

### 5. Documenter le périmètre

```bash
cat > reports/07-scope.md <<'EOF'
# Cadrage du TP CloudFox

## Ce que fait le TP

- Enumère les ressources AWS accessibles au profil.
- Cartographie les permissions IAM.
- Identifie des relations de confiance.
- Identifie des workloads avec permissions sensibles.
- Identifie des endpoints et surfaces exposées.
- Génère des fichiers locaux de synthèse.

## Ce que le TP ne fait pas

- Ne crée aucune ressource AWS.
- Ne modifie aucune ressource AWS.
- Ne supprime aucune ressource AWS.
- Ne lance aucune attaque.
- Ne tente aucune connexion aux endpoints découverts.
- Ne télécharge pas de secrets.
- N'exécute pas les commandes de loot générées par CloudFox.

## Bonnes pratiques

- Utiliser un compte de test ou un compte autorisé.
- Utiliser un profil AWS dédié en lecture seule.
- Ne pas exécuter sur un compte de production sans autorisation.
- Traiter les rapports CloudFox comme sensibles.
EOF
```

```bash
cat reports/07-scope.md
```

## Cartographie initiale du compte AWS

### 6. Créer le script de localisation du dossier CloudFox

CloudFox écrit ses sorties dans `cloudfox-output/aws/<account-id>/`. Le script suivant localise automatiquement le dernier sous-dossier créé.

```bash
cat > scripts/find-cloudfox-output.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-cloudfox-output}"

if [ ! -d "$ROOT" ]; then
  echo "Dossier CloudFox introuvable : $ROOT" >&2
  exit 1
fi

find "$ROOT/aws" -mindepth 1 -maxdepth 1 -type d | sort | tail -n 1
EOF
```

```bash
chmod +x scripts/find-cloudfox-output.sh
```

### 7. Lancer l'inventaire CloudFox

```bash
set +e
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  inventory \
  -v2 \
  | tee reports/08-cloudfox-inventory-console.txt
CLOUDFOX_INVENTORY_STATUS=${PIPESTATUS[0]}
set -e
echo "${CLOUDFOX_INVENTORY_STATUS}" | tee reports/09-cloudfox-inventory-status.txt
```

```bash
export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
echo "${CLOUDFOX_AWS_OUTPUT}" | tee reports/10-cloudfox-output-path.txt
```

```bash
rm -rf "${LOCAL_CLOUDFOX_COPY}"
mkdir -p "${LOCAL_CLOUDFOX_COPY}"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -maxdepth 3 -type f | sort \
  | tee reports/11-cloudfox-files-after-inventory.txt
```

## Cartographie IAM

### 8. Lister les principaux IAM

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  principals \
  -v2 \
  | tee reports/12-cloudfox-principals-console.txt

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "principals" | sort \
  | tee reports/13-cloudfox-principals-files.txt
```

### 9. Cartographier les permissions IAM

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  permissions \
  -v2 \
  | tee reports/14-cloudfox-permissions-console.txt

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "permissions" | sort \
  | tee reports/15-cloudfox-permissions-files.txt
```

### 10. Cartographier les relations de confiance IAM

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  role-trusts \
  -v2 \
  | tee reports/16-cloudfox-role-trusts-console.txt

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "role-trusts" | sort \
  | tee reports/17-cloudfox-role-trusts-files.txt
```

### 11. Simuler les permissions sensibles

```bash
set +e
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  iam-simulator \
  -v2 \
  | tee reports/18-cloudfox-iam-simulator-console.txt
IAM_SIMULATOR_STATUS=${PIPESTATUS[0]}
set -e
echo "${IAM_SIMULATOR_STATUS}" | tee reports/19-cloudfox-iam-simulator-status.txt
```

Actions sensibles à tester individuellement :

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  iam-simulator \
  --action iam:PassRole \
  -v2 \
  | tee reports/20-cloudfox-iam-simulator-passrole-console.txt || true
```

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  iam-simulator \
  --action sts:AssumeRole \
  -v2 \
  | tee reports/21-cloudfox-iam-simulator-assumerole-console.txt || true
```

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  iam-simulator \
  --action lambda:CreateFunction \
  -v2 \
  | tee reports/22-cloudfox-iam-simulator-lambda-console.txt || true
```

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  iam-simulator \
  --action iam:AttachUserPolicy \
  -v2 \
  | tee reports/23-cloudfox-iam-simulator-attachpolicy-console.txt || true
```

```bash
export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "iam-simulator" | sort \
  | tee reports/24-cloudfox-iam-simulator-files.txt
```

## Cartographie des workloads

### 12. Identifier les workloads avec permissions sensibles

| Élément | Risque |
|---|---|
| Workload avec rôle admin | Compromission workload vers contrôle du compte |
| Workload avec `iam:PassRole` | Possibilité de passer un rôle à un service |
| Workload avec accès secrets | Exfiltration potentielle |
| Workload public + rôle sensible | Chemin d'attaque prioritaire |

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  workloads \
  -v2 \
  | tee reports/25-cloudfox-workloads-console.txt

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "workloads" | sort \
  | tee reports/26-cloudfox-workloads-files.txt
```

## Cartographie réseau et exposition externe

### 13. Cartographier les instances EC2

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  instances \
  -v2 \
  | tee reports/27-cloudfox-instances-console.txt

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "instances" | sort \
  | tee reports/28-cloudfox-instances-files.txt
```

### 14. Cartographier les interfaces réseau

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  eni \
  -v2 \
  | tee reports/29-cloudfox-eni-console.txt

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "elastic-network|eni" | sort \
  | tee reports/30-cloudfox-eni-files.txt
```

### 15. Cartographier les ports exposés

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  network-ports \
  -v2 \
  | tee reports/31-cloudfox-network-ports-console.txt

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "network-ports" | sort \
  | tee reports/32-cloudfox-network-ports-files.txt
```

### 16. Cartographier les endpoints publics

| Élément | Risque |
|---|---|
| Endpoint public | Surface d'attaque externe |
| Port exposé | Service attaquable |
| Instance publique | Point d'entrée potentiel |
| Endpoint + rôle IAM sensible | Chemin d'attaque prioritaire |

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  endpoints \
  -v2 \
  | tee reports/33-cloudfox-endpoints-console.txt

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "endpoints" | sort \
  | tee reports/34-cloudfox-endpoints-files.txt
```

## Cartographie S3 et secrets

### 17. Cartographier les buckets S3

Ne pas exécuter les commandes de loot générées par CloudFox. Ce TP se limite à la cartographie.

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  buckets \
  -v2 \
  | tee reports/35-cloudfox-buckets-console.txt

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "bucket" | sort \
  | tee reports/36-cloudfox-buckets-files.txt
```

### 18. Cartographier les secrets référencés

Ne pas récupérer les valeurs des secrets.

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  secrets \
  -v2 \
  | tee reports/37-cloudfox-secrets-console.txt

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "secret|ssm" | sort \
  | tee reports/38-cloudfox-secrets-files.txt
```

## Cartographie des politiques de ressources

### 19. Identifier les trusts sur ressources

| Type | Chemin d'attaque potentiel |
|---|---|
| Bucket policy trop permissive | Accès données |
| SQS policy externe | Injection ou lecture messages |
| SNS policy externe | Publication ou abonnement abusif |
| ECR policy permissive | Accès images ou supply chain |
| KMS policy permissive | Déchiffrement ou usage de clés |

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  resource-trusts \
  -v2 \
  | tee reports/39-cloudfox-resource-trusts-console.txt

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "resource-trust" | sort \
  | tee reports/40-cloudfox-resource-trusts-files.txt
```

## Option avancée : PMapper

### 20. Installer Principal Mapper (optionnel)

Cette section est optionnelle. PMapper enrichit les résultats CloudFox avec une analyse de chemins de privilèges IAM.

```bash
sudo apt-get install -y graphviz python3-pip
python3 -m pip install --user principalmapper
export PATH="$HOME/.local/bin:$PATH"
pmapper --help | tee reports/41-pmapper-help.txt
```

### 21. Créer le graphe PMapper

```bash
set +e
pmapper --profile "${AWS_PROFILE_NAME}" graph create \
  | tee reports/42-pmapper-graph-create.txt
PMAPPER_STATUS=${PIPESTATUS[0]}
set -e
echo "${PMAPPER_STATUS}" | tee reports/43-pmapper-status.txt
pmapper graph list | tee reports/44-pmapper-graph-list.txt || true
```

### 22. Exécuter CloudFox pmapper

```bash
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  pmapper \
  -v2 \
  | tee reports/45-cloudfox-pmapper-console.txt || true

export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -Ei "pmapper" | sort \
  | tee reports/46-cloudfox-pmapper-files.txt
```

## Analyse locale des chemins d'attaque

### 23. Créer un index des fichiers CloudFox

```bash
find "${LOCAL_CLOUDFOX_COPY}" -type f | sort | tee reports/47-cloudfox-all-files.txt
find "${LOCAL_CLOUDFOX_COPY}" -type f -name "*.csv" | sort | tee reports/48-cloudfox-csv-files.txt
find "${LOCAL_CLOUDFOX_COPY}" -type f | grep "/loot/" | sort \
  | tee reports/49-cloudfox-loot-files.txt || true
```

Les fichiers de loot décrivent des actions possibles. Ne pas les exécuter dans un contexte pédagogique.

### 24. Créer un script de synthèse des risques

```bash
cat > scripts/analyze-cloudfox-csv.py <<'EOF'
#!/usr/bin/env python3
import csv
import sys
from pathlib import Path

if len(sys.argv) != 2:
    print("Usage: analyze-cloudfox-csv.py <cloudfox_output_dir>", file=sys.stderr)
    sys.exit(2)

root = Path(sys.argv[1])

keywords = {
    "admin": ["admin", "administrator", "fullaccess", "*:*", "iam:*"],
    "privesc": ["priv", "escal", "canprivesctoadmin", "path to admin"],
    "public": ["public", "0.0.0.0/0", "::/0", "internet", "external"],
    "secrets": ["secret", "password", "token", "key", "credential", "ssm"],
    "assume_role": ["assumerole", "sts:assumerole", "trusted principal"],
    "pass_role": ["passrole", "iam:passrole"],
    "network": ["endpoint", "publicip", "port", "dns", "hostname"],
}

csv_files = sorted(root.rglob("*.csv"))

print("# Synthèse CloudFox")
print()
print("## Fichiers CSV analysés")
print()
print("| Fichier | Lignes |")
print("|---|---:|")

all_rows = []
for path in csv_files:
    try:
        with path.open(newline="", encoding="utf-8", errors="replace") as f:
            rows = list(csv.DictReader(f))
    except Exception:
        rows = []
    rel = path.relative_to(root)
    print(f"| {rel} | {len(rows)} |")
    for row in rows:
        all_rows.append((rel, row))

print()
print("## Indicateurs par famille")
print()
print("| Famille | Occurrences |")
print("|---|---:|")

family_hits = {family: [] for family in keywords}
for rel, row in all_rows:
    text = " ".join(str(v) for v in row.values()).lower()
    for family, words in keywords.items():
        if any(word.lower() in text for word in words):
            family_hits[family].append((rel, row))

for family, hits in family_hits.items():
    print(f"| {family} | {len(hits)} |")

print()
print("## Extraits prioritaires")
print()

for family in ["admin", "privesc", "assume_role", "pass_role", "public", "network", "secrets"]:
    hits = family_hits.get(family, [])
    print(f"### {family}")
    print()
    if not hits:
        print("Aucun indicateur trouvé.")
        print()
        continue
    print("| Fichier | Extrait |")
    print("|---|---|")
    for rel, row in hits[:20]:
        values = [str(v) for v in row.values() if v]
        excerpt = " / ".join(values[:6]).replace("|", "/").replace("\n", " ")
        print(f"| {rel} | {excerpt[:300]} |")
    print()
EOF
```

```bash
chmod +x scripts/analyze-cloudfox-csv.py
python3 scripts/analyze-cloudfox-csv.py "${LOCAL_CLOUDFOX_COPY}" \
  | tee reports/analysis/50-cloudfox-risk-summary.md
cat reports/analysis/50-cloudfox-risk-summary.md
```

### 25. Créer une matrice de chemins d'attaque

```bash
cat > reports/analysis/51-attack-path-matrix.md <<'EOF'
# Matrice de chemins d'attaque AWS

## Lecture

Un chemin d'attaque combine généralement :
1. Un point d'entrée.
2. Une identité ou un workload.
3. Une permission sensible.
4. Une cible.
5. Un impact potentiel.

## Matrice

| Chemin | Point d'entrée | Pivot | Permission ou relation | Impact potentiel | Priorité |
|---|---|---|---|---|---|
| 1 | Endpoint public | Instance EC2 | Instance profile sensible | Accès AWS via rôle attaché | Haute |
| 2 | Workload compromis | Rôle IAM | Permissions admin ou privesc | Contrôle du compte | Haute |
| 3 | Principal IAM | sts:AssumeRole | Trust permissif | Pivot vers rôle sensible | Haute |
| 4 | Principal IAM | iam:PassRole | Création service ou fonction | Exécution avec rôle plus fort | Haute |
| 5 | Bucket exposé | Policy S3 | List/GetObject | Exfiltration de données | Moyenne à haute |
| 6 | Secret référencé | Secrets Manager ou SSM | Accès lecture secret | Vol de credentials | Haute |
| 7 | Ressource partagée | Resource policy | Trust externe | Pivot cross-account | Haute |
| 8 | Port exposé | Service réseau | Application vulnérable | Compromission initiale | Moyenne à haute |

## Règle de priorisation

Priorité haute si le chemin contient : une exposition publique, un rôle IAM sensible, une permission iam:PassRole, une permission sts:AssumeRole, une permission administrative, un accès à des secrets ou une relation cross-account.
EOF
```

```bash
cat reports/analysis/51-attack-path-matrix.md
```

### 26. Créer un graphe DOT simplifié

```bash
cat > scripts/build-attack-path-graph.py <<'EOF'
#!/usr/bin/env python3
from pathlib import Path

output = Path("graphs/aws-attack-paths.dot")

dot = '''digraph AWSAttackPaths {
  graph [rankdir=LR, label="Cartographie simplifiee des chemins d attaque AWS", labelloc=top];
  node [shape=box, style="rounded"];
  Internet [label="Internet\\nPoint d entree externe"];
  Endpoint [label="Endpoints publics\\nendpoints / network-ports"];
  Workload [label="Workloads\\nEC2 / Lambda / ECS / EKS"];
  Role [label="Roles IAM\\nInstance profiles / service roles"];
  Trust [label="Role Trusts\\nsts:AssumeRole"];
  Permissions [label="Permissions sensibles\\niam:PassRole / admin / privesc"];
  Secrets [label="Secrets\\nSSM / Secrets Manager"];
  Buckets [label="Buckets S3\\nDonnees potentielles"];
  Admin [label="Impact\\nAcces admin ou donnees sensibles"];
  Internet -> Endpoint [label="exposition"];
  Endpoint -> Workload [label="compromission possible"];
  Workload -> Role [label="credentials temporaires"];
  Role -> Permissions [label="droits effectifs"];
  Role -> Trust [label="assume role"];
  Trust -> Permissions [label="pivot IAM"];
  Permissions -> Admin [label="elevation"];
  Permissions -> Secrets [label="lecture"];
  Permissions -> Buckets [label="acces donnees"];
  Secrets -> Admin [label="credentials"];
  Buckets -> Admin [label="exfiltration"];
}
'''

output.write_text(dot, encoding="utf-8")
print(output)
EOF
```

```bash
python3 scripts/build-attack-path-graph.py \
  | tee reports/analysis/52-attack-path-graph-file.txt
```

```bash
dot -Tsvg graphs/aws-attack-paths.dot -o graphs/aws-attack-paths.svg
ls -lh graphs | tee reports/analysis/53-graphs-files.txt
```

### 27. Créer la liste de lecture CloudFox

```bash
{
  echo "# Liste de lecture CloudFox"
  echo
  echo "## IAM"
  echo
  echo "| Sujet | Fichier |"
  echo "|---|---|"
  PRINCIPALS_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "principals.*\.csv$" | head -n 1 || true)"
  PERMISSIONS_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "permissions.*\.csv$" | head -n 1 || true)"
  TRUSTS_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "role-trusts.*\.csv$" | head -n 1 || true)"
  IAM_SIM_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "iam-simulator.*\.csv$" | head -n 1 || true)"
  PMAPPER_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "pmapper.*\.csv$" | head -n 1 || true)"
  echo "| Principaux IAM | ${PRINCIPALS_CSV:-Non disponible} |"
  echo "| Permissions IAM | ${PERMISSIONS_CSV:-Non disponible} |"
  echo "| Trusts IAM | ${TRUSTS_CSV:-Non disponible} |"
  echo "| IAM Simulator | ${IAM_SIM_CSV:-Non disponible} |"
  echo "| PMapper | ${PMAPPER_CSV:-Non disponible} |"
  echo
  echo "## Workloads"
  echo
  echo "| Sujet | Fichier |"
  echo "|---|---|"
  WORKLOADS_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "workloads.*\.csv$" | head -n 1 || true)"
  INSTANCES_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "instances.*\.csv$" | head -n 1 || true)"
  echo "| Workloads | ${WORKLOADS_CSV:-Non disponible} |"
  echo "| Instances | ${INSTANCES_CSV:-Non disponible} |"
  echo
  echo "## Réseau"
  echo
  echo "| Sujet | Fichier |"
  echo "|---|---|"
  ENDPOINTS_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "endpoints.*\.csv$" | head -n 1 || true)"
  PORTS_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "network-ports.*\.csv$" | head -n 1 || true)"
  ENI_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "elastic-network|eni.*\.csv$" | head -n 1 || true)"
  echo "| Endpoints | ${ENDPOINTS_CSV:-Non disponible} |"
  echo "| Ports réseau | ${PORTS_CSV:-Non disponible} |"
  echo "| ENI | ${ENI_CSV:-Non disponible} |"
  echo
  echo "## Données et secrets"
  echo
  echo "| Sujet | Fichier |"
  echo "|---|---|"
  BUCKETS_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "bucket.*\.csv$" | head -n 1 || true)"
  SECRETS_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "secret.*\.csv$" | head -n 1 || true)"
  RTRUSTS_CSV="$(find "${LOCAL_CLOUDFOX_COPY}" -type f | grep -E "resource-trust.*\.csv$" | head -n 1 || true)"
  echo "| Buckets | ${BUCKETS_CSV:-Non disponible} |"
  echo "| Secrets | ${SECRETS_CSV:-Non disponible} |"
  echo "| Trusts ressources | ${RTRUSTS_CSV:-Non disponible} |"
} > reports/analysis/54-cloudfox-reading-list.md
```

```bash
cat reports/analysis/54-cloudfox-reading-list.md
```

### 28. Créer un atelier d'analyse des chemins d'attaque

```bash
cat > reports/analysis/55-attack-paths-workshop.md <<'EOF'
# Atelier d'analyse des chemins d'attaque

## Chemin 1 : endpoint public vers rôle sensible

| Élément | Observation |
|---|---|
| Endpoint public identifié | A compléter |
| Ressource associée | A compléter |
| Workload associé | A compléter |
| Rôle attaché | A compléter |
| Permission sensible | A compléter |
| Impact potentiel | A compléter |
| Priorité | A compléter |

## Chemin 2 : principal IAM vers rôle sensible

| Élément | Observation |
|---|---|
| Principal de départ | A compléter |
| Permission sts:AssumeRole | A compléter |
| Rôle de destination | A compléter |
| Trust policy permissive | A compléter |
| Permissions du rôle | A compléter |
| Impact potentiel | A compléter |
| Priorité | A compléter |

## Chemin 3 : permission iam:PassRole

| Élément | Observation |
|---|---|
| Principal concerné | A compléter |
| Action iam:PassRole | A compléter |
| Rôle passable | A compléter |
| Service utilisable | A compléter |
| Risque | A compléter |
| Priorité | A compléter |

## Chemin 4 : accès secret

| Élément | Observation |
|---|---|
| Secret identifié | A compléter |
| Principal pouvant y accéder | A compléter |
| Workload utilisant le secret | A compléter |
| Impact si compromis | A compléter |
| Priorité | A compléter |
EOF
```

```bash
cat reports/analysis/55-attack-paths-workshop.md
```

## Option : exécuter plusieurs commandes en une fois

### 29. Utiliser `all-checks` avec prudence

La commande `all-checks` lance la plupart des commandes AWS CloudFox avec des paramètres par défaut. Elle peut prendre plusieurs dizaines de minutes sur un compte actif. Elle reste en lecture seule.

```bash
set +e
cloudfox aws \
  --profile "${AWS_PROFILE_NAME}" \
  all-checks \
  -v2 \
  | tee reports/57-cloudfox-all-checks-console.txt
ALL_CHECKS_STATUS=${PIPESTATUS[0]}
set -e

echo "${ALL_CHECKS_STATUS}" | tee reports/58-cloudfox-all-checks-status.txt
```

```bash
export CLOUDFOX_AWS_OUTPUT="$(./scripts/find-cloudfox-output.sh "${CLOUDFOX_OUTPUT_ROOT}")"
cp -R "${CLOUDFOX_AWS_OUTPUT}"/. "${LOCAL_CLOUDFOX_COPY}"/
python3 scripts/analyze-cloudfox-csv.py "${LOCAL_CLOUDFOX_COPY}" \
  | tee reports/analysis/59-cloudfox-risk-summary-after-all-checks.md
```

## Rapport de synthèse

### 30. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP : Cartographier les chemins d'attaque AWS avec CloudFox"
  echo
  echo "## Environnement"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| TP | ${TP_NAME} |"
  echo "| Compte AWS | ${AWS_ACCOUNT_ID} |"
  echo "| Profil AWS | ${AWS_PROFILE_NAME} |"
  echo "| Caller ARN | ${AWS_CALLER_ARN} |"
  echo "| Région par défaut | ${AWS_DEFAULT_REGION} |"
  echo "| Dossier CloudFox | ${LOCAL_CLOUDFOX_COPY} |"
  echo
  echo "## Cadrage"
  echo
  echo "| Élément | Statut |"
  echo "|---|---|"
  echo "| Création de ressource AWS | Non |"
  echo "| Modification de ressource AWS | Non |"
  echo "| Exploitation active | Non |"
  echo "| Scan réseau actif | Non |"
  echo "| Rapports locaux | Oui |"
  echo "| Cartographie IAM | Oui |"
  echo "| Cartographie réseau | Oui |"
  echo "| Cartographie workloads | Oui |"
  echo
  echo "## Commandes CloudFox exécutées"
  echo
  echo "| Commande | Objectif |"
  echo "|---|---|"
  echo "| inventory | Ressources et régions |"
  echo "| principals | Utilisateurs et rôles IAM |"
  echo "| permissions | Permissions IAM |"
  echo "| role-trusts | Relations de confiance |"
  echo "| iam-simulator | Permissions sensibles |"
  echo "| workloads | Workloads avec permissions sensibles |"
  echo "| instances | Instances et rôles associés |"
  echo "| eni | Interfaces et IPs |"
  echo "| network-ports | Ports exposés |"
  echo "| endpoints | Endpoints publics |"
  echo "| buckets | Buckets S3 |"
  echo "| secrets | Secrets référencés |"
  echo "| resource-trusts | Policies de ressources |"
  echo
  echo "## Livrables principaux"
  echo
  echo "| Livrable | Fichier |"
  echo "|---|---|"
  echo "| Synthèse risques | reports/analysis/50-cloudfox-risk-summary.md |"
  echo "| Matrice chemins d'attaque | reports/analysis/51-attack-path-matrix.md |"
  echo "| Graphe DOT | graphs/aws-attack-paths.dot |"
  echo "| Graphe SVG | graphs/aws-attack-paths.svg |"
  echo "| Liste de lecture | reports/analysis/54-cloudfox-reading-list.md |"
  echo "| Atelier d'analyse | reports/analysis/55-attack-paths-workshop.md |"
} > reports/rapport-tp-cloudfox-aws-attack-paths.md
```

### 31. Afficher le rapport

```bash
cat reports/rapport-tp-cloudfox-aws-attack-paths.md
```

### 32. Lister les fichiers générés

```bash
find . -maxdepth 5 -type f | sort \
  | tee reports/60-generated-files.txt
```

## Nettoyage

### 33. Confirmer l'absence de modifications AWS

Ce TP n'a utilisé que des appels en lecture via CloudFox et AWS CLI. Vérifier les scripts du TP :

```bash
grep -h "^aws " scripts/*.sh scripts/env.sh 2>/dev/null \
  | grep -E "create|put|delete|update|attach|detach|run-instances|start|stop|terminate" \
  || echo "Aucune commande AWS de modification détectée dans les scripts."
```

Résultat attendu :

```text
Aucune commande AWS de modification détectée dans les scripts.
```

### 34. Supprimer le cache CloudFox (optionnel)

```bash
find "$HOME/.cloudfox" -maxdepth 3 -type f 2>/dev/null | head -n 50 || true
rm -rf "$HOME/.cloudfox/cached-data/aws/${AWS_ACCOUNT_ID}" || true
```

### 35. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-cloudfox-aws-attack-paths
```

## Résultat attendu

À la fin du TP, les éléments suivants doivent avoir été validés :

| Élément | Validation |
|---|---|
| Profil AWS | Identité AWS vérifiée |
| CloudFox | Version v1.17.0 ou supérieure |
| Coûts | Aucune ressource AWS créée |
| Inventory | Ressources et régions identifiées |
| IAM | Principaux, permissions et trusts cartographiés |
| IAM Simulator | Actions sensibles évaluées |
| Workloads | Workloads avec permissions sensibles identifiés |
| Réseau | Endpoints, ports et ENI cartographiés |
| S3 | Buckets identifiés |
| Secrets | Secrets référencés identifiés sans exfiltration |
| Resource trusts | Policies de ressources analysées |
| Chemins d'attaque | Matrice et graphe local produits |
| Rapport | Rapport Markdown disponible |

Aucune ressource AWS n'est créée, modifiée ou supprimée pendant ce TP.
