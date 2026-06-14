---
title: "TP : Détecter des permissions IAM excessives avec Cloudsplaining, Parliament et IAM JSON"
date: 2026-06-14
description: Créer volontairement des permissions IAM excessives dans un compte de lab, puis les analyser avec Parliament et Cloudsplaining pour illustrer le principe du moindre privilège.
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
* Permissions suffisantes pour exécuter `iam:GetAccountAuthorizationDetails`.

### Permissions AWS nécessaires

Le principal AWS utilisé pour ce TP doit disposer des permissions nécessaires pour exécuter les actions suivantes :

```text
sts:GetCallerIdentity
iam:GetAccountAuthorizationDetails
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
iam:ListAttachedGroupPolicies
iam:ListAttachedRolePolicies
iam:ListGroupsForUser
iam:GetPolicy
iam:GetPolicyVersion
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

### Installer Parliament et Cloudsplaining

Créer un environnement Python dédié :

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Installer les outils :

```bash
pip install "setuptools<81" parliament cloudsplaining
```

Vérifier l'installation :

```bash
parliament --help
cloudsplaining --help
```

### Précaution

Ce TP crée volontairement des permissions IAM excessives dans un compte AWS de lab.

Aucune clé d'accès IAM et aucun mot de passe console ne sont créés.

Les ressources créées doivent être supprimées à la fin du TP.

Ne pas exécuter ce TP dans un compte de production.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Identifier une policy IAM excessive dans un fichier JSON.
* Comprendre pourquoi `Action: "*"` et `Resource: "*"` sont dangereux.
* Comprendre pourquoi `iam:*` est une permission très sensible.
* Identifier l'usage d'`AdministratorAccess`.
* Utiliser Parliament pour analyser des policies IAM JSON.
* Utiliser Cloudsplaining pour analyser un fichier de policy IAM.
* Utiliser Cloudsplaining pour analyser les détails IAM d'un compte AWS.
* Comparer une policy excessive avec une policy plus proche du moindre privilège.
* Produire un rapport d'analyse IAM.
* Nettoyer les ressources IAM créées pendant le TP.

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-iam-permissions-excessives
cd tp-iam-permissions-excessives

mkdir -p policies
mkdir -p reports
mkdir -p reports/cloudsplaining
mkdir -p reports/cloudsplaining-input
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

export IAM_USER_NAME="tp-excessive-user-${TP_ID}"
export IAM_GROUP_NAME="tp-excessive-group-${TP_ID}"
export IAM_ROLE_NAME="tp-excessive-role-${TP_ID}"

export IAM_STAR_POLICY_NAME="tp-iam-star-policy-${TP_ID}"

export AWS_ADMIN_POLICY_ARN="arn:aws:iam::aws:policy/AdministratorAccess"
```

### 5. Récupérer l'identifiant du compte AWS

```bash
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
echo "Compte AWS : ${AWS_ACCOUNT_ID}"
```

### 6. Créer une policy IAM excessive avec `iam:*`

Cette policy donne toutes les actions IAM sur toutes les ressources.

Elle est volontairement dangereuse.

```bash
cat > policies/iam-star-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAllIAMActions",
      "Effect": "Allow",
      "Action": "iam:*",
      "Resource": "*"
    }
  ]
}
EOF
```

### 7. Créer une policy équivalente à un accès administrateur

Cette policy est volontairement dangereuse.

Elle est proche du contenu fonctionnel de la policy managée AWS `AdministratorAccess`.

Elle est uniquement analysée localement dans ce TP et n'est pas déployée dans AWS.

```bash
cat > policies/admin-equivalent-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEverything",
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
EOF
```

### 8. Créer une policy plus proche du moindre privilège

Cette policy limite les actions à la consultation d'un rôle IAM précis.

Elle sert de comparaison pédagogique.

```bash
cat > policies/least-privilege-iam-read-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowReadSpecificRole",
      "Effect": "Allow",
      "Action": [
        "iam:GetRole",
        "iam:ListAttachedRolePolicies"
      ],
      "Resource": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${IAM_ROLE_NAME}"
    }
  ]
}
EOF
```

### 9. Vérifier la validité JSON des policies

```bash
jq . policies/iam-star-policy.json
jq . policies/admin-equivalent-policy.json
jq . policies/least-privilege-iam-read-policy.json
```

### 10. Analyser la policy `iam:*` avec Parliament

```bash
parliament --string "$(cat policies/iam-star-policy.json)"
```

```bash
echo "Code de retour Parliament iam:* : $?"
```

### 11. Analyser la policy administrateur avec Parliament

```bash
parliament --string "$(cat policies/admin-equivalent-policy.json)"
```

```bash
echo "Code de retour Parliament admin équivalent : $?"
```

### 12. Analyser la policy moindre privilège avec Parliament

```bash
parliament --string "$(cat policies/least-privilege-iam-read-policy.json)"
```

```bash
echo "Code de retour Parliament moindre privilège : $?"
```

### 13. Créer un fichier d'exclusions Cloudsplaining

Ce fichier n'exclut pas `AdministratorAccess`, car le TP cherche justement à détecter son usage.

```bash
cat > exclusions.yml <<'EOF'
policies:
  - "AWSServiceRoleFor*"
  - "*ServiceRolePolicy"
  - "*ServiceLinkedRolePolicy"
  - "service-role*"
  - "aws-service-role*"
roles:
  - "service-role*"
  - "aws-service-role*"
users: []
groups: []
EOF
```

### 14. Analyser la policy `iam:*` avec Cloudsplaining

Cloudsplaining affiche les résultats dans la sortie standard.

Le code de retour ne doit pas être interprété comme un indicateur d'absence ou de présence de findings.

```bash
cloudsplaining scan-policy-file \
  --input-file policies/iam-star-policy.json
```

### 15. Analyser la policy administrateur avec Cloudsplaining

```bash
cloudsplaining scan-policy-file \
  --input-file policies/admin-equivalent-policy.json
```

### 16. Analyser la policy moindre privilège avec Cloudsplaining

```bash
cloudsplaining scan-policy-file \
  --input-file policies/least-privilege-iam-read-policy.json
```

### 17. Créer une trust policy pour le rôle IAM

Cette trust policy autorise le service EC2 à assumer le rôle.

Aucune instance EC2 ni instance profile ne sont créés dans ce TP.

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

### 18. Valider la trust policy avec jq

```bash
jq . policies/role-trust-policy.json
```

### 19. Créer le groupe IAM

```bash
aws iam create-group \
  --group-name "${IAM_GROUP_NAME}"
```

### 20. Créer l'utilisateur IAM

```bash
aws iam create-user \
  --user-name "${IAM_USER_NAME}"
```

### 21. Ajouter l'utilisateur au groupe

```bash
aws iam add-user-to-group \
  --group-name "${IAM_GROUP_NAME}" \
  --user-name "${IAM_USER_NAME}"
```

### 22. Attacher `AdministratorAccess` au groupe IAM

Cette action est volontairement excessive.

Elle sert à faire apparaître un risque d'accès administrateur dans l'analyse.

```bash
aws iam attach-group-policy \
  --group-name "${IAM_GROUP_NAME}" \
  --policy-arn "${AWS_ADMIN_POLICY_ARN}"
```

### 23. Créer le rôle IAM

```bash
aws iam create-role \
  --role-name "${IAM_ROLE_NAME}" \
  --assume-role-policy-document file://policies/role-trust-policy.json \
  > reports/create-role.json
```

### 24. Créer la policy managée client `iam:*`

```bash
aws iam create-policy \
  --policy-name "${IAM_STAR_POLICY_NAME}" \
  --policy-document file://policies/iam-star-policy.json \
  > reports/create-iam-star-policy.json
```

### 25. Récupérer l'ARN de la policy `iam:*`

```bash
export IAM_STAR_POLICY_ARN="$(jq -r '.Policy.Arn' reports/create-iam-star-policy.json)"
echo "Policy iam:* : ${IAM_STAR_POLICY_ARN}"
```

### 26. Attacher la policy `iam:*` au rôle IAM

```bash
aws iam attach-role-policy \
  --role-name "${IAM_ROLE_NAME}" \
  --policy-arn "${IAM_STAR_POLICY_ARN}"
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
export IAM_STAR_POLICY_NAME="${IAM_STAR_POLICY_NAME}"
export IAM_STAR_POLICY_ARN="${IAM_STAR_POLICY_ARN}"
export AWS_ADMIN_POLICY_ARN="${AWS_ADMIN_POLICY_ARN}"
EOF
```

### 28. Afficher les variables sauvegardées

```bash
cat reports/tp.env
```

### 29. Vérifier les policies attachées au groupe

```bash
aws iam list-attached-group-policies \
  --group-name "${IAM_GROUP_NAME}" \
  --output json
```

### 30. Vérifier les policies attachées au rôle

```bash
aws iam list-attached-role-policies \
  --role-name "${IAM_ROLE_NAME}" \
  --output json
```

### 31. Vérifier que l'utilisateur appartient au groupe

```bash
aws iam list-groups-for-user \
  --user-name "${IAM_USER_NAME}" \
  --output json
```

### 32. Télécharger les détails IAM du compte avec Cloudsplaining

Cloudsplaining écrit le fichier JSON dans le dossier passé à `--output`.

```bash
cloudsplaining download \
  --output reports/cloudsplaining-input
```

### 33. Identifier le fichier de détails IAM téléchargé

```bash
export CLOUDSPLAINING_AUTHZ_FILE="$(find reports/cloudsplaining-input -maxdepth 1 -type f -name "*.json" | head -n 1)"

echo "Fichier Cloudsplaining téléchargé : ${CLOUDSPLAINING_AUTHZ_FILE}"

cp "${CLOUDSPLAINING_AUTHZ_FILE}" reports/account-authorization-details.json
```

### 34. Vérifier que le fichier d'autorisation IAM a été généré

```bash
ls -lh reports/account-authorization-details.json
```

### 35. Scanner les détails IAM du compte avec Cloudsplaining

```bash
cloudsplaining scan \
  --input-file reports/account-authorization-details.json \
  --exclusions-file exclusions.yml \
  --output reports/cloudsplaining
```

### 36. Lister les rapports Cloudsplaining générés

La structure de sortie peut varier selon la version de Cloudsplaining.

```bash
find reports/cloudsplaining -type f \( -name "*.html" -o -name "*.json" -o -name "*.csv" \) -print
```

### 37. Rechercher les ressources du TP dans les rapports Cloudsplaining

```bash
grep -R "${IAM_GROUP_NAME}\|${IAM_ROLE_NAME}\|${IAM_STAR_POLICY_NAME}\|AdministratorAccess" reports/cloudsplaining || true
```

### 38. Identifier les fichiers JSON de résultats Cloudsplaining

```bash
find reports/cloudsplaining -type f -name "*.json" -print
```

### 39. Lire les clés principales des rapports JSON Cloudsplaining

```bash
for file in $(find reports/cloudsplaining -type f -name "*.json"); do
  echo "Fichier : $file"
  jq 'keys' "$file" 2>/dev/null || true
done
```

### 40. Construire un rapport de synthèse local

```bash
{
  echo "# Rapport TP Détection de permissions IAM excessives"
  echo
  echo "## Ressources analysées"
  echo
  echo "| Élément | Valeur |"
  echo "|---|---|"
  echo "| Utilisateur IAM | ${IAM_USER_NAME} |"
  echo "| Groupe IAM | ${IAM_GROUP_NAME} |"
  echo "| Rôle IAM | ${IAM_ROLE_NAME} |"
  echo "| Policy AWS managée attachée | AdministratorAccess |"
  echo "| Policy client attachée | ${IAM_STAR_POLICY_ARN} |"
  echo
  echo "## Policies locales"
  echo
  echo "- policies/iam-star-policy.json"
  echo "- policies/admin-equivalent-policy.json"
  echo "- policies/least-privilege-iam-read-policy.json"
  echo "- policies/role-trust-policy.json"
  echo
  echo "## Analyses réalisées"
  echo
  echo "- Validation JSON avec jq."
  echo "- Analyse locale avec Parliament."
  echo "- Analyse locale avec Cloudsplaining scan-policy-file."
  echo "- Création de permissions IAM excessives dans un compte de lab."
  echo "- Téléchargement des détails IAM avec Cloudsplaining download."
  echo "- Analyse du compte avec Cloudsplaining scan."
  echo
  echo "## Points à observer"
  echo
  echo "- La présence d'AdministratorAccess sur le groupe."
  echo "- La présence d'une policy client contenant iam:*."
  echo "- La différence entre une permission globale et une permission ciblée."
  echo "- L'écart entre une policy techniquement valide et une policy conforme au moindre privilège."
} > reports/iam-excessive-permissions-summary.md
```

### 41. Afficher le rapport de synthèse local

```bash
cat reports/iam-excessive-permissions-summary.md
```

## Nettoyage

### 42. Recharger les variables si nécessaire

Si le nettoyage est effectué dans le même terminal, cette commande n'est pas indispensable.

Si un nouveau terminal a été ouvert, se replacer dans le dossier du TP puis recharger les variables :

```bash
cd tp-iam-permissions-excessives
source reports/tp.env
```

### 43. Détacher `AdministratorAccess` du groupe IAM

```bash
aws iam detach-group-policy \
  --group-name "${IAM_GROUP_NAME}" \
  --policy-arn "${AWS_ADMIN_POLICY_ARN}"
```

### 44. Détacher la policy `iam:*` du rôle IAM

```bash
aws iam detach-role-policy \
  --role-name "${IAM_ROLE_NAME}" \
  --policy-arn "${IAM_STAR_POLICY_ARN}"
```

### 45. Supprimer l'utilisateur du groupe

```bash
aws iam remove-user-from-group \
  --group-name "${IAM_GROUP_NAME}" \
  --user-name "${IAM_USER_NAME}"
```

### 46. Supprimer l'utilisateur IAM

```bash
aws iam delete-user \
  --user-name "${IAM_USER_NAME}"
```

### 47. Supprimer le groupe IAM

```bash
aws iam delete-group \
  --group-name "${IAM_GROUP_NAME}"
```

### 48. Supprimer le rôle IAM

```bash
aws iam delete-role \
  --role-name "${IAM_ROLE_NAME}"
```

### 49. Supprimer la policy client `iam:*`

```bash
aws iam delete-policy \
  --policy-arn "${IAM_STAR_POLICY_ARN}"
```

### 50. Vérifier que l'utilisateur IAM a été supprimé

```bash
aws iam get-user --user-name "${IAM_USER_NAME}" 2>&1 \
  && echo "L'utilisateur existe encore" \
  || echo "Utilisateur bien supprimé"
```

### 51. Vérifier que le groupe IAM a été supprimé

```bash
aws iam get-group --group-name "${IAM_GROUP_NAME}" 2>&1 \
  && echo "Le groupe existe encore" \
  || echo "Groupe bien supprimé"
```

### 52. Vérifier que le rôle IAM a été supprimé

```bash
aws iam get-role --role-name "${IAM_ROLE_NAME}" 2>&1 \
  && echo "Le rôle existe encore" \
  || echo "Rôle bien supprimé"
```

### 53. Vérifier que la policy client a été supprimée

```bash
aws iam get-policy --policy-arn "${IAM_STAR_POLICY_ARN}" 2>&1 \
  && echo "La policy existe encore" \
  || echo "Policy bien supprimée"
```

## Résultat attendu

À la fin du TP, l'apprenant doit avoir produit les fichiers suivants :

```text
policies/iam-star-policy.json
policies/admin-equivalent-policy.json
policies/least-privilege-iam-read-policy.json
policies/role-trust-policy.json
exclusions.yml
reports/tp.env
reports/account-authorization-details.json
reports/iam-excessive-permissions-summary.md
```

Le dossier suivant doit contenir les rapports Cloudsplaining :

```text
reports/cloudsplaining
```

Les ressources IAM suivantes doivent avoir été créées puis supprimées :

```text
Utilisateur IAM
Groupe IAM
Rôle IAM
Policy AWS managée AdministratorAccess attachée au groupe
Policy managée client contenant iam:* attachée au rôle
```

L'analyse doit permettre d'observer :

```text
AdministratorAccess est une permission excessive.
iam:* donne un contrôle très large sur IAM.
Action "*" avec Resource "*" correspond à un accès administrateur.
Une policy peut être valide en JSON tout en étant contraire au principe du moindre privilège.
Une policy plus ciblée réduit l'exposition et facilite l'audit.
```

Aucune clé d'accès IAM ni aucun mot de passe console ne doivent être créés pendant le TP.
