---
title: "TP : Créer utilisateurs, groupes, rôles et policies avec JSON IAM et Parliament"
date: 2026-06-14
description: Créer des ressources IAM via AWS CLI, écrire des policies JSON, les valider avec Parliament et nettoyer les ressources après le TP.
---

## Prérequis

### Environnement technique

* AWS CLI installé et configuré.
* Accès à un terminal Bash ou Zsh.
* jq installé pour lire et filtrer les sorties JSON.
* Python 3 installé.
* pip disponible.
* Accès à un compte AWS de lab.
* Permissions IAM suffisantes pour créer, attacher, détacher et supprimer des ressources IAM.

### Permissions AWS nécessaires

Le principal AWS utilisé pour ce TP doit disposer des permissions nécessaires pour exécuter les actions suivantes :

```text
sts:GetCallerIdentity
iam:CreateUser
iam:DeleteUser
iam:GetUser
iam:CreateGroup
iam:DeleteGroup
iam:GetGroup
iam:AddUserToGroup
iam:RemoveUserFromGroup
iam:CreateRole
iam:DeleteRole
iam:GetRole
iam:CreatePolicy
iam:DeletePolicy
iam:AttachGroupPolicy
iam:DetachGroupPolicy
iam:AttachRolePolicy
iam:DetachRolePolicy
iam:GetPolicy
iam:GetPolicyVersion
iam:ListAttachedGroupPolicies
iam:ListAttachedRolePolicies
iam:ListGroupsForUser
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

### Installer Parliament

Créer un environnement Python dédié :

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Installer Parliament avec une version de `setuptools` compatible :

```bash
pip install "setuptools<81" parliament
```

Vérifier l'installation :

```bash
parliament --help
```

### Précaution

Ce TP crée des ressources IAM réelles dans le compte AWS utilisé.

Aucune clé d'accès IAM et aucun mot de passe console ne sont créés dans ce TP.

Les ressources créées doivent être supprimées à la fin du TP.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Créer un utilisateur IAM.
* Créer un groupe IAM.
* Ajouter un utilisateur IAM à un groupe.
* Écrire une policy IAM en JSON.
* Valider une policy IAM avec Parliament avant déploiement.
* Créer une policy managée client.
* Attacher une policy à un groupe IAM.
* Créer un rôle IAM avec une trust policy JSON.
* Attacher une policy à un rôle IAM.
* Vérifier les associations entre utilisateurs, groupes, rôles et policies.
* Nettoyer les ressources IAM créées pendant le TP.

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-iam-json-parliament
cd tp-iam-json-parliament

mkdir -p policies
mkdir -p reports
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

export IAM_USER_NAME="tp-iam-user-${TP_ID}"
export IAM_GROUP_NAME="tp-iam-group-${TP_ID}"
export IAM_ROLE_NAME="tp-iam-role-${TP_ID}"

export GROUP_POLICY_NAME="tp-iam-group-policy-${TP_ID}"
export ROLE_POLICY_NAME="tp-iam-role-policy-${TP_ID}"
```

### 5. Récupérer l'identifiant du compte AWS

```bash
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
echo "Compte AWS : ${AWS_ACCOUNT_ID}"
```

### 6. Créer une policy IAM volontairement incorrecte

Cette policy est utilisée uniquement pour observer le comportement de Parliament.

Elle ne doit pas être déployée dans AWS.

```bash
cat > policies/bad-s3-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BadS3Action",
      "Effect": "Allow",
      "Action": "s3:GetObjectt",
      "Resource": "arn:aws:s3:::example-bucket/*"
    }
  ]
}
EOF
```

### 7. Valider le JSON de la policy incorrecte avec jq

```bash
jq . policies/bad-s3-policy.json
```

### 8. Analyser la policy incorrecte avec Parliament

```bash
parliament --string "$(cat policies/bad-s3-policy.json)"
```

```bash
echo "Code de retour Parliament policy incorrecte : $?"
```

### 9. Créer une policy JSON pour le groupe IAM

Cette policy donne une permission de lecture limitée à la liste des buckets et à la localisation des buckets.

```bash
cat > policies/group-s3-list-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowListAllBuckets",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowGetBucketLocation",
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::*"
    }
  ]
}
EOF
```

### 10. Valider la policy du groupe avec jq

```bash
jq . policies/group-s3-list-policy.json
```

### 11. Valider la policy du groupe avec Parliament

```bash
parliament --string "$(cat policies/group-s3-list-policy.json)"
```

```bash
echo "Code de retour Parliament policy groupe : $?"
```

### 12. Créer une policy JSON pour le rôle IAM

Cette policy autorise la lecture d'objets dans un bucket de démonstration.

Le bucket n'est pas créé dans ce TP : il sert uniquement à illustrer la syntaxe d'un ARN S3 objet dans une policy IAM.

```bash
cat > policies/role-s3-read-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowReadObjectsInDemoBucket",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::tp-iam-demo-${TP_ID}/*"
    }
  ]
}
EOF
```

### 13. Valider la policy du rôle avec jq

```bash
jq . policies/role-s3-read-policy.json
```

### 14. Valider la policy du rôle avec Parliament

```bash
parliament --string "$(cat policies/role-s3-read-policy.json)"
```

```bash
echo "Code de retour Parliament policy rôle : $?"
```

### 15. Créer une trust policy JSON pour le rôle IAM

Cette trust policy autorise le service EC2 à assumer le rôle.

```bash
cat > policies/role-trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEC2AssumeRole",
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
```

### 16. Valider la trust policy avec jq

```bash
jq . policies/role-trust-policy.json
```

### 17. Créer le groupe IAM

```bash
aws iam create-group \
  --group-name "${IAM_GROUP_NAME}"
```

### 18. Créer l'utilisateur IAM

```bash
aws iam create-user \
  --user-name "${IAM_USER_NAME}"
```

### 19. Ajouter l'utilisateur au groupe

```bash
aws iam add-user-to-group \
  --group-name "${IAM_GROUP_NAME}" \
  --user-name "${IAM_USER_NAME}"
```

### 20. Créer la policy managée client pour le groupe

```bash
aws iam create-policy \
  --policy-name "${GROUP_POLICY_NAME}" \
  --policy-document file://policies/group-s3-list-policy.json \
  > reports/create-group-policy.json
```

### 21. Récupérer l'ARN de la policy du groupe

```bash
export GROUP_POLICY_ARN="$(jq -r '.Policy.Arn' reports/create-group-policy.json)"
echo "Policy groupe : ${GROUP_POLICY_ARN}"
```

### 22. Attacher la policy au groupe IAM

```bash
aws iam attach-group-policy \
  --group-name "${IAM_GROUP_NAME}" \
  --policy-arn "${GROUP_POLICY_ARN}"
```

### 23. Créer le rôle IAM

```bash
aws iam create-role \
  --role-name "${IAM_ROLE_NAME}" \
  --assume-role-policy-document file://policies/role-trust-policy.json \
  > reports/create-role.json
```

### 24. Créer la policy managée client pour le rôle

```bash
aws iam create-policy \
  --policy-name "${ROLE_POLICY_NAME}" \
  --policy-document file://policies/role-s3-read-policy.json \
  > reports/create-role-policy.json
```

### 25. Récupérer l'ARN de la policy du rôle

```bash
export ROLE_POLICY_ARN="$(jq -r '.Policy.Arn' reports/create-role-policy.json)"
echo "Policy rôle : ${ROLE_POLICY_ARN}"
```

### 26. Attacher la policy au rôle IAM

```bash
aws iam attach-role-policy \
  --role-name "${IAM_ROLE_NAME}" \
  --policy-arn "${ROLE_POLICY_ARN}"
```

### 27. Sauvegarder les variables utiles au nettoyage

```bash
cat > reports/tp.env <<EOF
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION}"
export TP_ID="${TP_ID}"
export AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
export IAM_USER_NAME="${IAM_USER_NAME}"
export IAM_GROUP_NAME="${IAM_GROUP_NAME}"
export IAM_ROLE_NAME="${IAM_ROLE_NAME}"
export GROUP_POLICY_NAME="${GROUP_POLICY_NAME}"
export ROLE_POLICY_NAME="${ROLE_POLICY_NAME}"
export GROUP_POLICY_ARN="${GROUP_POLICY_ARN}"
export ROLE_POLICY_ARN="${ROLE_POLICY_ARN}"
EOF
```

### 28. Afficher les variables sauvegardées

```bash
cat reports/tp.env
```

### 29. Vérifier que l'utilisateur appartient au groupe

```bash
aws iam list-groups-for-user \
  --user-name "${IAM_USER_NAME}" \
  --output json
```

### 30. Vérifier les policies attachées au groupe

```bash
aws iam list-attached-group-policies \
  --group-name "${IAM_GROUP_NAME}" \
  --output json
```

### 31. Vérifier les policies attachées au rôle

```bash
aws iam list-attached-role-policies \
  --role-name "${IAM_ROLE_NAME}" \
  --output json
```

### 32. Consulter la version par défaut de la policy du groupe

```bash
export GROUP_POLICY_VERSION_ID="$(aws iam get-policy \
  --policy-arn "${GROUP_POLICY_ARN}" \
  --query 'Policy.DefaultVersionId' \
  --output text)"

aws iam get-policy-version \
  --policy-arn "${GROUP_POLICY_ARN}" \
  --version-id "${GROUP_POLICY_VERSION_ID}" \
  --output json
```

### 33. Consulter la version par défaut de la policy du rôle

```bash
export ROLE_POLICY_VERSION_ID="$(aws iam get-policy \
  --policy-arn "${ROLE_POLICY_ARN}" \
  --query 'Policy.DefaultVersionId' \
  --output text)"

aws iam get-policy-version \
  --policy-arn "${ROLE_POLICY_ARN}" \
  --version-id "${ROLE_POLICY_VERSION_ID}" \
  --output json
```

### 34. Créer un rapport de synthèse Markdown

```bash
{
  echo "# Rapport TP IAM JSON Parliament"
  echo
  echo "## Ressources IAM créées"
  echo
  echo "| Type | Nom ou ARN |"
  echo "|---|---|"
  echo "| Utilisateur IAM | ${IAM_USER_NAME} |"
  echo "| Groupe IAM | ${IAM_GROUP_NAME} |"
  echo "| Rôle IAM | ${IAM_ROLE_NAME} |"
  echo "| Policy groupe | ${GROUP_POLICY_ARN} |"
  echo "| Policy rôle | ${ROLE_POLICY_ARN} |"
  echo
  echo "## Fichiers JSON produits"
  echo
  echo "- policies/bad-s3-policy.json"
  echo "- policies/group-s3-list-policy.json"
  echo "- policies/role-s3-read-policy.json"
  echo "- policies/role-trust-policy.json"
  echo
  echo "## Vérifications réalisées"
  echo
  echo "- Validation JSON avec jq."
  echo "- Analyse des policies IAM avec Parliament."
  echo "- Création d'un utilisateur IAM."
  echo "- Création d'un groupe IAM."
  echo "- Ajout de l'utilisateur au groupe."
  echo "- Création de policies managées client."
  echo "- Attachement d'une policy au groupe."
  echo "- Création d'un rôle IAM."
  echo "- Attachement d'une policy au rôle."
} > reports/iam-json-parliament-summary.md
```

### 35. Afficher le rapport de synthèse

```bash
cat reports/iam-json-parliament-summary.md
```

## Nettoyage

### 36. Recharger les variables si nécessaire

Si le nettoyage est effectué dans le même terminal, cette commande n'est pas indispensable.

Si un nouveau terminal a été ouvert, se replacer dans le dossier du TP puis recharger les variables :

```bash
cd tp-iam-json-parliament
source reports/tp.env
```

### 37. Détacher la policy du groupe

```bash
aws iam detach-group-policy \
  --group-name "${IAM_GROUP_NAME}" \
  --policy-arn "${GROUP_POLICY_ARN}"
```

### 38. Détacher la policy du rôle

```bash
aws iam detach-role-policy \
  --role-name "${IAM_ROLE_NAME}" \
  --policy-arn "${ROLE_POLICY_ARN}"
```

### 39. Supprimer l'utilisateur du groupe

```bash
aws iam remove-user-from-group \
  --group-name "${IAM_GROUP_NAME}" \
  --user-name "${IAM_USER_NAME}"
```

### 40. Supprimer l'utilisateur IAM

```bash
aws iam delete-user \
  --user-name "${IAM_USER_NAME}"
```

### 41. Supprimer le groupe IAM

```bash
aws iam delete-group \
  --group-name "${IAM_GROUP_NAME}"
```

### 42. Supprimer le rôle IAM

```bash
aws iam delete-role \
  --role-name "${IAM_ROLE_NAME}"
```

### 43. Supprimer la policy du groupe

```bash
aws iam delete-policy \
  --policy-arn "${GROUP_POLICY_ARN}"
```

### 44. Supprimer la policy du rôle

```bash
aws iam delete-policy \
  --policy-arn "${ROLE_POLICY_ARN}"
```

### 45. Vérifier que l'utilisateur IAM a été supprimé

```bash
aws iam get-user --user-name "${IAM_USER_NAME}" 2>&1 \
  && echo "L'utilisateur existe encore" \
  || echo "Utilisateur bien supprimé"
```

### 46. Vérifier que le groupe IAM a été supprimé

```bash
aws iam get-group --group-name "${IAM_GROUP_NAME}" 2>&1 \
  && echo "Le groupe existe encore" \
  || echo "Groupe bien supprimé"
```

### 47. Vérifier que le rôle IAM a été supprimé

```bash
aws iam get-role --role-name "${IAM_ROLE_NAME}" 2>&1 \
  && echo "Le rôle existe encore" \
  || echo "Rôle bien supprimé"
```

## Résultat attendu

À la fin du TP, l'apprenant doit avoir produit les fichiers suivants :

```text
policies/bad-s3-policy.json
policies/group-s3-list-policy.json
policies/role-s3-read-policy.json
policies/role-trust-policy.json
reports/create-group-policy.json
reports/create-role.json
reports/create-role-policy.json
reports/tp.env
reports/iam-json-parliament-summary.md
```

Les ressources IAM suivantes doivent avoir été créées puis supprimées :

```text
Utilisateur IAM
Groupe IAM
Rôle IAM
Policy managée client attachée au groupe
Policy managée client attachée au rôle
```

La policy incorrecte doit être analysée par Parliament afin d'illustrer la détection d'une action IAM invalide.

Les policies déployées doivent être valides en JSON et exploitables par AWS IAM.

Le bucket référencé dans la policy du rôle n'est pas créé dans ce TP. Il sert uniquement à illustrer la syntaxe d'un ARN S3 objet dans une policy IAM.

Aucune clé d'accès IAM ni aucun mot de passe console ne doivent être créés pendant le TP.
