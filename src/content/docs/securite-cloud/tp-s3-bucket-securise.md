---
title: "TP : Sécuriser un bucket S3 minimal avec Block Public Access, chiffrement et policy restrictive"
date: 2026-06-14
description: Créer un bucket S3 dans un compte de lab, activer Block Public Access, configurer le chiffrement SSE-S3, appliquer une bucket policy restrictive et tester une policy IAM least privilege avec l'IAM Policy Simulator.
---

## Prérequis

### Environnement technique

* AWS CLI installé et configuré.
* Accès à un terminal Bash ou Zsh.
* jq installé pour lire et filtrer les sorties JSON.
* Accès à un compte AWS de lab.
* Permissions suffisantes pour créer, configurer, tester et supprimer un bucket S3.
* Permissions suffisantes pour utiliser l'IAM Policy Simulator.

### Permissions AWS nécessaires

Le principal AWS utilisé pour ce TP doit disposer des permissions nécessaires pour exécuter les actions suivantes :

```text
sts:GetCallerIdentity
s3:CreateBucket
s3:DeleteBucket
s3:HeadBucket
s3:PutObject
s3:GetObject
s3:DeleteObject
s3:ListBucket
s3:PutBucketPublicAccessBlock
s3:GetBucketPublicAccessBlock
s3:PutBucketEncryption
s3:GetBucketEncryption
s3:PutBucketPolicy
s3:GetBucketPolicy
s3:DeleteBucketPolicy
iam:SimulateCustomPolicy
```

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

### Précaution

Ce TP crée un bucket S3 réel dans un compte AWS de lab.

Aucun utilisateur IAM, aucune clé d'accès et aucun mot de passe ne sont créés.

Le bucket et les objets créés doivent être supprimés à la fin du TP.

Ne pas exécuter ce TP dans un compte de production.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Créer un bucket S3 minimal.
* Activer et vérifier S3 Block Public Access.
* Tester le rejet d'une bucket policy publique.
* Configurer le chiffrement par défaut du bucket.
* Vérifier le chiffrement appliqué à un objet.
* Appliquer une bucket policy restrictive.
* Comprendre le rôle d'une policy IAM least privilege.
* Tester une policy IAM avec l'IAM Policy Simulator.
* Vérifier qu'une action autorisée est acceptée.
* Vérifier qu'une action excessive est refusée.
* Nettoyer les ressources S3 créées pendant le TP.

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-s3-bucket-minimal-secure
cd tp-s3-bucket-minimal-secure

mkdir -p policies
mkdir -p reports
mkdir -p files
```

### 2. Vérifier l'identité AWS utilisée

```bash
aws sts get-caller-identity
```

### 3. Définir la région AWS par défaut

```bash
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-west-3}"
echo "Région AWS CLI par défaut : ${AWS_DEFAULT_REGION}"
```

### 4. Définir les variables du TP

```bash
export TP_ID="$(date +%Y%m%d%H%M%S)"
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

export BUCKET_NAME="tp-s3-secure-${AWS_ACCOUNT_ID}-${TP_ID}"

echo "Compte AWS : ${AWS_ACCOUNT_ID}"
echo "Bucket S3 : ${BUCKET_NAME}"
```

### 5. Créer le bucket S3

La création d'un bucket S3 varie légèrement pour la région `us-east-1`.

La commande suivante gère les deux cas.

```bash
if [ "${AWS_DEFAULT_REGION}" = "us-east-1" ]; then
  aws s3api create-bucket \
    --bucket "${BUCKET_NAME}" \
    --region "${AWS_DEFAULT_REGION}"
else
  aws s3api create-bucket \
    --bucket "${BUCKET_NAME}" \
    --region "${AWS_DEFAULT_REGION}" \
    --create-bucket-configuration LocationConstraint="${AWS_DEFAULT_REGION}"
fi
```

### 6. Vérifier que le bucket existe

```bash
aws s3api head-bucket \
  --bucket "${BUCKET_NAME}"
```

```bash
echo "Code de retour head-bucket : $?"
```

### 7. Créer la configuration Block Public Access

Cette configuration active les quatre protections principales au niveau du bucket.

```bash
cat > policies/block-public-access.json <<'EOF'
{
  "BlockPublicAcls": true,
  "IgnorePublicAcls": true,
  "BlockPublicPolicy": true,
  "RestrictPublicBuckets": true
}
EOF
```

### 8. Appliquer Block Public Access au bucket

```bash
aws s3api put-public-access-block \
  --bucket "${BUCKET_NAME}" \
  --public-access-block-configuration file://policies/block-public-access.json
```

### 9. Vérifier Block Public Access

```bash
aws s3api get-public-access-block \
  --bucket "${BUCKET_NAME}" \
  --output json
```

### 10. Créer une bucket policy publique de test

Cette policy tente d'autoriser tout Internet à lire les objets du bucket.

Elle est volontairement dangereuse et ne doit pas être conservée.

```bash
cat > policies/public-read-bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadObjects",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF
```

### 11. Vérifier le JSON de la policy publique

```bash
jq . policies/public-read-bucket-policy.json
```

### 12. Tester le rejet d'une policy publique

Cette commande doit échouer si `BlockPublicPolicy` est actif.

```bash
aws s3api put-bucket-policy \
  --bucket "${BUCKET_NAME}" \
  --policy file://policies/public-read-bucket-policy.json 2>&1 \
  && echo "La policy publique a été appliquée : résultat non attendu" \
  || echo "Policy publique rejetée : résultat attendu"
```

### 13. Créer la configuration de chiffrement par défaut

Cette configuration force explicitement le chiffrement côté serveur avec SSE-S3.

Même si S3 applique déjà un chiffrement par défaut sur les buckets modernes, l'objectif du TP est de rendre cette configuration visible, explicite et vérifiable.

```bash
cat > policies/bucket-encryption-sse-s3.json <<'EOF'
{
  "Rules": [
    {
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }
  ]
}
EOF
```

### 14. Appliquer le chiffrement par défaut au bucket

```bash
aws s3api put-bucket-encryption \
  --bucket "${BUCKET_NAME}" \
  --server-side-encryption-configuration file://policies/bucket-encryption-sse-s3.json
```

### 15. Vérifier le chiffrement du bucket

```bash
aws s3api get-bucket-encryption \
  --bucket "${BUCKET_NAME}" \
  --output json
```

### 16. Créer une bucket policy restrictive

Cette policy ne donne aucun accès public.

Elle ajoute deux restrictions défensives :

* refuser les accès non chiffrés en transit ;
* refuser les tentatives d'upload avec ACL publique.

```bash
cat > policies/restrictive-bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::${BUCKET_NAME}",
        "arn:aws:s3:::${BUCKET_NAME}/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "DenyPublicReadAcl",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": [
            "public-read",
            "public-read-write",
            "authenticated-read"
          ]
        }
      }
    }
  ]
}
EOF
```

### 17. Vérifier le JSON de la bucket policy restrictive

```bash
jq . policies/restrictive-bucket-policy.json
```

### 18. Appliquer la bucket policy restrictive

```bash
aws s3api put-bucket-policy \
  --bucket "${BUCKET_NAME}" \
  --policy file://policies/restrictive-bucket-policy.json
```

### 19. Vérifier la bucket policy appliquée

```bash
aws s3api get-bucket-policy \
  --bucket "${BUCKET_NAME}" \
  --query Policy \
  --output text | jq .
```

### 20. Créer un fichier de test

```bash
cat > files/hello.txt <<'EOF'
Objet de test pour vérifier la configuration minimale de sécurité S3.
EOF
```

### 21. Uploader un objet dans le bucket

```bash
aws s3api put-object \
  --bucket "${BUCKET_NAME}" \
  --key "demo/hello.txt" \
  --body files/hello.txt
```

### 22. Vérifier le chiffrement de l'objet

```bash
aws s3api head-object \
  --bucket "${BUCKET_NAME}" \
  --key "demo/hello.txt" \
  --query 'ServerSideEncryption' \
  --output text
```

Le résultat attendu est :

```text
AES256
```

### 23. Tester une tentative d'upload avec ACL publique

Cette commande doit échouer.

Selon la configuration du compte et du bucket, l'échec peut venir de plusieurs mécanismes de protection :

* `BlockPublicAcls` ou `IgnorePublicAcls` si les ACL sont encore supportées ;
* `BucketOwnerEnforced` si les ACL sont désactivées par défaut sur le bucket ;
* la bucket policy restrictive si une ACL publique est explicitement refusée.

Dans tous les cas, le résultat attendu est le rejet de l'upload avec ACL publique.

```bash
aws s3api put-object \
  --bucket "${BUCKET_NAME}" \
  --key "demo/public-acl-test.txt" \
  --body files/hello.txt \
  --acl public-read 2>&1 \
  && echo "Upload avec ACL publique accepté : résultat non attendu" \
  || echo "Upload avec ACL publique rejeté : résultat attendu"
```

### 24. Créer une policy IAM least privilege pour accéder au bucket

Cette policy autorise uniquement :

* la liste du bucket ;
* la lecture d'objets ;
* l'écriture d'objets ;
* la suppression d'objets.

Elle ne permet pas de modifier la configuration du bucket.

```bash
cat > policies/iam-s3-least-privilege-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowListSpecificBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::${BUCKET_NAME}"
    },
    {
      "Sid": "AllowObjectOperationsInSpecificBucket",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF
```

### 25. Vérifier le JSON de la policy IAM

```bash
jq . policies/iam-s3-least-privilege-policy.json
```

### 26. Préparer la policy IAM pour la simulation

`simulate-custom-policy` attend une policy sous forme de chaîne JSON.

```bash
export POLICY_JSON="$(jq -c . policies/iam-s3-least-privilege-policy.json)"
```

### 27. Tester l'action autorisée `s3:ListBucket`

```bash
aws iam simulate-custom-policy \
  --policy-input-list "${POLICY_JSON}" \
  --action-names s3:ListBucket \
  --resource-arns "arn:aws:s3:::${BUCKET_NAME}" \
  --output json > reports/simulate-list-bucket.json
```

```bash
jq -r '.EvaluationResults[] | [.EvalActionName, .EvalResourceName, .EvalDecision] | @tsv' reports/simulate-list-bucket.json
```

Le résultat attendu est :

```text
allowed
```

### 28. Tester les actions autorisées sur les objets

```bash
aws iam simulate-custom-policy \
  --policy-input-list "${POLICY_JSON}" \
  --action-names s3:GetObject s3:PutObject s3:DeleteObject \
  --resource-arns "arn:aws:s3:::${BUCKET_NAME}/demo/hello.txt" \
  --output json > reports/simulate-object-actions.json
```

```bash
jq -r '.EvaluationResults[] | [.EvalActionName, .EvalResourceName, .EvalDecision] | @tsv' reports/simulate-object-actions.json
```

Les résultats attendus sont :

```text
allowed
allowed
allowed
```

### 29. Tester des actions non autorisées

```bash
aws iam simulate-custom-policy \
  --policy-input-list "${POLICY_JSON}" \
  --action-names s3:DeleteBucket s3:PutBucketPolicy s3:PutBucketPublicAccessBlock \
  --resource-arns "arn:aws:s3:::${BUCKET_NAME}" \
  --output json > reports/simulate-admin-actions.json
```

```bash
jq -r '.EvaluationResults[] | [.EvalActionName, .EvalResourceName, .EvalDecision] | @tsv' reports/simulate-admin-actions.json
```

Les résultats attendus sont :

```text
implicitDeny
implicitDeny
implicitDeny
```

### 30. Sauvegarder les variables utiles au nettoyage

```bash
cat > reports/tp.env <<EOF
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION}"
export TP_ID="${TP_ID}"
export AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
export BUCKET_NAME="${BUCKET_NAME}"
EOF
```

### 31. Afficher les variables sauvegardées

```bash
cat reports/tp.env
```

### 32. Construire un rapport de synthèse local

```bash
{
  echo "# Rapport TP Sécurisation minimale d'un bucket S3"
  echo
  echo "## Bucket analysé"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| Compte AWS | ${AWS_ACCOUNT_ID} |"
  echo "| Région | ${AWS_DEFAULT_REGION} |"
  echo "| Bucket | ${BUCKET_NAME} |"
  echo
  echo "## Contrôles appliqués"
  echo
  echo "| Contrôle | Fichier |"
  echo "|---|---|"
  echo "| Block Public Access | policies/block-public-access.json |"
  echo "| Chiffrement SSE-S3 | policies/bucket-encryption-sse-s3.json |"
  echo "| Bucket policy restrictive | policies/restrictive-bucket-policy.json |"
  echo "| Policy IAM least privilege | policies/iam-s3-least-privilege-policy.json |"
  echo
  echo "## Tests réalisés"
  echo
  echo "- Rejet d'une bucket policy publique."
  echo "- Vérification du chiffrement du bucket."
  echo "- Vérification du chiffrement d'un objet."
  echo "- Rejet d'une tentative d'ACL publique."
  echo "- Simulation IAM d'actions autorisées."
  echo "- Simulation IAM d'actions non autorisées."
  echo
  echo "## Résultat pédagogique"
  echo
  echo "- Le bucket n'est pas public."
  echo "- Les objets sont chiffrés côté serveur."
  echo "- La bucket policy ajoute des garde-fous défensifs."
  echo "- La policy IAM respecte le principe du moindre privilège."
} > reports/s3-bucket-security-summary.md
```

### 33. Afficher le rapport de synthèse local

```bash
cat reports/s3-bucket-security-summary.md
```

### 34. Lister les rapports générés

```bash
find reports -maxdepth 1 -type f -print
```

## Nettoyage

### 35. Recharger les variables si nécessaire

Si le nettoyage est effectué dans le même terminal, cette commande n'est pas indispensable.

Si un nouveau terminal a été ouvert, se replacer dans le dossier du TP puis recharger les variables :

```bash
cd tp-s3-bucket-minimal-secure
source reports/tp.env
```

### 36. Supprimer la bucket policy

Cette étape doit impérativement être exécutée avant la suppression des objets.

La bucket policy appliquée précédemment contient un refus défensif sur les accès non sécurisés. L'AWS CLI utilise HTTPS par défaut, mais dans certains environnements particuliers, par exemple avec un proxy ou un endpoint personnalisé, la policy pourrait bloquer les opérations de nettoyage. Supprimer la policy avant de vider le bucket rend le nettoyage plus robuste.

```bash
aws s3api delete-bucket-policy \
  --bucket "${BUCKET_NAME}" 2>&1 \
  || echo "Aucune bucket policy à supprimer ou policy déjà supprimée"
```

### 37. Supprimer les objets du bucket

```bash
aws s3 rm "s3://${BUCKET_NAME}" --recursive
```

### 38. Supprimer le bucket

```bash
aws s3api delete-bucket \
  --bucket "${BUCKET_NAME}"
```

### 39. Vérifier que le bucket a été supprimé

```bash
aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>&1 \
  && echo "Le bucket existe encore" \
  || echo "Bucket bien supprimé"
```

## Résultat attendu

| Fichier produit | Description |
| --- | --- |
| `policies/block-public-access.json` | Configuration Block Public Access appliquée au bucket |
| `policies/public-read-bucket-policy.json` | Policy publique utilisée pour tester le blocage BPA |
| `policies/bucket-encryption-sse-s3.json` | Configuration de chiffrement par défaut SSE-S3 |
| `policies/restrictive-bucket-policy.json` | Bucket policy défensive refusant les actions non autorisées |
| `policies/iam-s3-least-privilege-policy.json` | Policy IAM en lecture seule suivant le moindre privilège |
| `reports/simulate-list-bucket.json` | Résultat de simulation IAM pour `s3:ListBucket` |
| `reports/simulate-object-actions.json` | Résultat de simulation IAM pour les actions sur les objets |
| `reports/simulate-admin-actions.json` | Résultat de simulation IAM pour les actions d'administration |
| `reports/tp.env` | Variables d'environnement du TP (nom du bucket, région) |
| `reports/s3-bucket-security-summary.md` | Rapport de synthèse du TP |

| Contrôle | Résultat attendu |
| --- | --- |
| Cycle de vie du bucket | Créé, sécurisé, testé puis supprimé |
| Block Public Access | Empêche l'application d'une bucket policy publique |
| Chiffrement par défaut | Tous les objets déposés sont chiffrés au repos (SSE-S3) |
| Bucket policy restrictive | Ajoute des garde-fous défensifs contre les actions non autorisées |
| Policy IAM moindre privilège | Autorise uniquement les actions nécessaires sur le bucket |
| Actions d'administration | Refusées par la simulation IAM |
| Clés d'accès et accès public | Aucune clé d'accès IAM ni accès public créés pendant le TP |
