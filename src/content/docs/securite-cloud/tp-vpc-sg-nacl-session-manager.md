---
title: "TP : Sécuriser un VPC avec Security Group, NACL et Session Manager"
date: 2026-06-14
description: Créer un VPC minimal, configurer un Security Group sans port entrant, sécuriser le subnet avec une NACL, et administrer une instance EC2 sans SSH via AWS Systems Manager Session Manager.
---

## Prérequis

### Environnement technique

* AWS CLI installé et configuré.
* Session Manager Plugin installé sur le poste local.
* jq installé pour lire et filtrer les sorties JSON.
* Accès à un terminal Bash ou Zsh.
* Accès à un compte AWS de lab.
* Permissions suffisantes pour créer, tester et supprimer des ressources VPC, EC2, IAM et SSM.

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

### Vérifier AWS CLI

```bash
aws --version
```

### Vérifier le plugin Session Manager

```bash
session-manager-plugin --version
```

Si la commande n'est pas disponible, installer le plugin Session Manager avant de continuer.

### Permissions AWS nécessaires

Le principal AWS utilisé pour ce TP doit disposer des permissions nécessaires pour exécuter les actions suivantes :

```text
sts:GetCallerIdentity

ec2:CreateVpc
ec2:DeleteVpc
ec2:ModifyVpcAttribute
ec2:CreateSubnet
ec2:DeleteSubnet
ec2:ModifySubnetAttribute
ec2:CreateInternetGateway
ec2:DeleteInternetGateway
ec2:AttachInternetGateway
ec2:DetachInternetGateway
ec2:CreateRouteTable
ec2:DeleteRouteTable
ec2:CreateRoute
ec2:AssociateRouteTable
ec2:DisassociateRouteTable
ec2:CreateSecurityGroup
ec2:DeleteSecurityGroup
ec2:AuthorizeSecurityGroupEgress
ec2:RevokeSecurityGroupEgress
ec2:DescribeSecurityGroups
ec2:CreateNetworkAcl
ec2:DeleteNetworkAcl
ec2:CreateNetworkAclEntry
ec2:ReplaceNetworkAclAssociation
ec2:DescribeNetworkAcls
ec2:DescribeAvailabilityZones
ec2:RunInstances
ec2:TerminateInstances
ec2:DescribeInstances
ec2:CreateTags

iam:CreateRole
iam:DeleteRole
iam:AttachRolePolicy
iam:DetachRolePolicy
iam:CreateInstanceProfile
iam:DeleteInstanceProfile
iam:AddRoleToInstanceProfile
iam:RemoveRoleFromInstanceProfile
iam:PassRole

ssm:GetParameter
ssm:DescribeInstanceInformation
ssm:StartSession
```

### Précaution

Ce TP crée des ressources AWS réelles.

Il crée notamment :

* un VPC ;
* un subnet public ;
* une table de routage ;
* un Internet Gateway ;
* un Security Group ;
* une NACL ;
* une instance EC2 ;
* un rôle IAM pour Session Manager.

Le TP peut générer des coûts si les ressources ne sont pas supprimées.

Ne pas exécuter ce TP dans un compte de production.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Créer un VPC minimal.
* Configurer un subnet public contrôlé.
* Comprendre le rôle d'un Security Group.
* Comprendre le rôle d'une NACL.
* Comparer filtrage stateful et stateless.
* Bloquer les accès entrants classiques comme SSH.
* Autoriser uniquement les flux sortants nécessaires à Session Manager.
* Créer un rôle IAM pour une instance EC2 administrée par SSM.
* Se connecter à une instance sans clé SSH et sans bastion.
* Vérifier que l'administration passe par Session Manager.
* Nettoyer les ressources créées pendant le TP.

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-vpc-sg-nacl-session-manager
cd tp-vpc-sg-nacl-session-manager

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
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

export VPC_NAME="tp-vpc-ssm-${TP_ID}"
export VPC_CIDR="10.10.0.0/16"

export SUBNET_NAME="tp-subnet-public-ssm-${TP_ID}"
export SUBNET_CIDR="10.10.10.0/24"

export IGW_NAME="tp-igw-ssm-${TP_ID}"
export ROUTE_TABLE_NAME="tp-rt-public-ssm-${TP_ID}"

export SG_NAME="tp-sg-ssm-only-${TP_ID}"
export NACL_NAME="tp-nacl-ssm-${TP_ID}"

export IAM_ROLE_NAME="tp-ec2-ssm-role-${TP_ID}"
export INSTANCE_PROFILE_NAME="tp-ec2-ssm-profile-${TP_ID}"

export INSTANCE_NAME="tp-ec2-ssm-${TP_ID}"
export INSTANCE_TYPE="t3.micro"

echo "Compte AWS : ${AWS_ACCOUNT_ID}"
echo "Identifiant TP : ${TP_ID}"
```

### 5. Identifier une zone de disponibilité

```bash
export AVAILABILITY_ZONE="$(aws ec2 describe-availability-zones \
  --query 'AvailabilityZones[0].ZoneName' \
  --output text)"

echo "Zone de disponibilité utilisée : ${AVAILABILITY_ZONE}"
```

## Création du réseau

### 6. Créer le VPC

```bash
aws ec2 create-vpc \
  --cidr-block "${VPC_CIDR}" \
  --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${VPC_NAME}}]" \
  > reports/create-vpc.json
```

```bash
export VPC_ID="$(jq -r '.Vpc.VpcId' reports/create-vpc.json)"
echo "VPC_ID=${VPC_ID}"
```

### 7. Activer DNS support et DNS hostnames sur le VPC

```bash
aws ec2 modify-vpc-attribute \
  --vpc-id "${VPC_ID}" \
  --enable-dns-support '{"Value":true}'

aws ec2 modify-vpc-attribute \
  --vpc-id "${VPC_ID}" \
  --enable-dns-hostnames '{"Value":true}'
```

### 8. Créer le subnet

```bash
aws ec2 create-subnet \
  --vpc-id "${VPC_ID}" \
  --cidr-block "${SUBNET_CIDR}" \
  --availability-zone "${AVAILABILITY_ZONE}" \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${SUBNET_NAME}}]" \
  > reports/create-subnet.json
```

```bash
export SUBNET_ID="$(jq -r '.Subnet.SubnetId' reports/create-subnet.json)"
echo "SUBNET_ID=${SUBNET_ID}"
```

### 9. Activer l'attribution automatique d'adresse publique sur le subnet

Cette option permet à l'instance EC2 de sortir vers les endpoints publics AWS sans NAT Gateway.

Le TP reste sécurisé car aucun port entrant n'est ouvert sur le Security Group.

```bash
aws ec2 modify-subnet-attribute \
  --subnet-id "${SUBNET_ID}" \
  --map-public-ip-on-launch
```

### 10. Créer l'Internet Gateway

```bash
aws ec2 create-internet-gateway \
  --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${IGW_NAME}}]" \
  > reports/create-igw.json
```

```bash
export IGW_ID="$(jq -r '.InternetGateway.InternetGatewayId' reports/create-igw.json)"
echo "IGW_ID=${IGW_ID}"
```

### 11. Attacher l'Internet Gateway au VPC

```bash
aws ec2 attach-internet-gateway \
  --internet-gateway-id "${IGW_ID}" \
  --vpc-id "${VPC_ID}"
```

### 12. Créer la table de routage publique

```bash
aws ec2 create-route-table \
  --vpc-id "${VPC_ID}" \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${ROUTE_TABLE_NAME}}]" \
  > reports/create-route-table.json
```

```bash
export ROUTE_TABLE_ID="$(jq -r '.RouteTable.RouteTableId' reports/create-route-table.json)"
echo "ROUTE_TABLE_ID=${ROUTE_TABLE_ID}"
```

### 13. Créer la route vers Internet

```bash
aws ec2 create-route \
  --route-table-id "${ROUTE_TABLE_ID}" \
  --destination-cidr-block "0.0.0.0/0" \
  --gateway-id "${IGW_ID}"
```

### 14. Associer la table de routage au subnet

```bash
aws ec2 associate-route-table \
  --route-table-id "${ROUTE_TABLE_ID}" \
  --subnet-id "${SUBNET_ID}" \
  > reports/associate-route-table.json
```

```bash
export ROUTE_TABLE_ASSOC_ID="$(jq -r '.AssociationId' reports/associate-route-table.json)"
echo "ROUTE_TABLE_ASSOC_ID=${ROUTE_TABLE_ASSOC_ID}"
```

## Sécurisation par Security Group

### 15. Créer le Security Group

```bash
aws ec2 create-security-group \
  --group-name "${SG_NAME}" \
  --description "Security Group sans SSH entrant, administration via Session Manager" \
  --vpc-id "${VPC_ID}" \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${SG_NAME}}]" \
  > reports/create-security-group.json
```

```bash
export SECURITY_GROUP_ID="$(jq -r '.GroupId' reports/create-security-group.json)"
echo "SECURITY_GROUP_ID=${SECURITY_GROUP_ID}"
```

### 16. Supprimer la règle sortante par défaut du Security Group

Un Security Group nouvellement créé autorise généralement tout le trafic sortant.

Dans ce TP, on remplace ce comportement par une règle sortante limitée à HTTPS.

```bash
aws ec2 revoke-security-group-egress \
  --group-id "${SECURITY_GROUP_ID}" \
  --ip-permissions '[{"IpProtocol":"-1","IpRanges":[{"CidrIp":"0.0.0.0/0"}]}]' 2>/dev/null \
  || echo "Aucune règle sortante par défaut à supprimer ou règle déjà supprimée"
```

### 17. Autoriser uniquement le trafic sortant HTTPS

Session Manager utilise des communications sortantes vers les services AWS.

```bash
aws ec2 authorize-security-group-egress \
  --group-id "${SECURITY_GROUP_ID}" \
  --ip-permissions '[{"IpProtocol":"tcp","FromPort":443,"ToPort":443,"IpRanges":[{"CidrIp":"0.0.0.0/0","Description":"HTTPS sortant vers les services AWS pour SSM"}]}]'
```

### 18. Vérifier les règles du Security Group

```bash
aws ec2 describe-security-groups \
  --group-ids "${SECURITY_GROUP_ID}" \
  --output json > reports/security-group.json
```

```bash
jq '.SecurityGroups[0] | {GroupId, GroupName, IpPermissions, IpPermissionsEgress}' reports/security-group.json
```

### 19. Vérifier qu'aucune règle entrante n'est définie

```bash
jq '.SecurityGroups[0].IpPermissions | length' reports/security-group.json
```

Le résultat attendu est :

```text
0
```

## Sécurisation par NACL

### 20. Identifier la NACL par défaut du VPC

```bash
export DEFAULT_NACL_ID="$(aws ec2 describe-network-acls \
  --filters "Name=vpc-id,Values=${VPC_ID}" "Name=default,Values=true" \
  --query 'NetworkAcls[0].NetworkAclId' \
  --output text)"

echo "DEFAULT_NACL_ID=${DEFAULT_NACL_ID}"
```

### 21. Identifier l'association NACL actuelle du subnet

```bash
export ORIGINAL_NACL_ASSOC_ID="$(aws ec2 describe-network-acls \
  --filters "Name=association.subnet-id,Values=${SUBNET_ID}" \
  --query 'NetworkAcls[0].Associations[0].NetworkAclAssociationId' \
  --output text)"

echo "ORIGINAL_NACL_ASSOC_ID=${ORIGINAL_NACL_ASSOC_ID}"
```

### 22. Créer une NACL dédiée au subnet

```bash
aws ec2 create-network-acl \
  --vpc-id "${VPC_ID}" \
  --tag-specifications "ResourceType=network-acl,Tags=[{Key=Name,Value=${NACL_NAME}}]" \
  > reports/create-nacl.json
```

```bash
export NACL_ID="$(jq -r '.NetworkAcl.NetworkAclId' reports/create-nacl.json)"
echo "NACL_ID=${NACL_ID}"
```

### 23. Ajouter une règle NACL entrante qui refuse SSH

Cette règle illustre explicitement le refus de l'administration SSH.

Même sans cette règle, SSH serait bloqué par l'absence de règle entrante sur le Security Group.

```bash
aws ec2 create-network-acl-entry \
  --network-acl-id "${NACL_ID}" \
  --ingress \
  --rule-number 100 \
  --protocol 6 \
  --port-range From=22,To=22 \
  --cidr-block "0.0.0.0/0" \
  --rule-action deny
```

### 24. Ajouter une règle NACL entrante pour les ports éphémères

Les NACL sont stateless.

Pour qu'une connexion HTTPS sortante fonctionne, le trafic de retour doit être autorisé vers les ports éphémères de l'instance.

```bash
aws ec2 create-network-acl-entry \
  --network-acl-id "${NACL_ID}" \
  --ingress \
  --rule-number 110 \
  --protocol 6 \
  --port-range From=1024,To=65535 \
  --cidr-block "0.0.0.0/0" \
  --rule-action allow
```

### 25. Ajouter une règle NACL sortante HTTPS

```bash
aws ec2 create-network-acl-entry \
  --network-acl-id "${NACL_ID}" \
  --egress \
  --rule-number 100 \
  --protocol 6 \
  --port-range From=443,To=443 \
  --cidr-block "0.0.0.0/0" \
  --rule-action allow
```

### 26. Associer la NACL au subnet

```bash
aws ec2 replace-network-acl-association \
  --association-id "${ORIGINAL_NACL_ASSOC_ID}" \
  --network-acl-id "${NACL_ID}" \
  > reports/replace-nacl-association.json
```

```bash
export NACL_ASSOC_ID="$(jq -r '.NewAssociationId' reports/replace-nacl-association.json)"
echo "NACL_ASSOC_ID=${NACL_ASSOC_ID}"
```

### 27. Vérifier les règles NACL

```bash
aws ec2 describe-network-acls \
  --network-acl-ids "${NACL_ID}" \
  --output json > reports/network-acl.json
```

```bash
jq '.NetworkAcls[0].Entries | sort_by(.RuleNumber)' reports/network-acl.json
```

## Préparation IAM pour Session Manager

### 28. Créer la trust policy EC2

```bash
cat > policies/ec2-ssm-trust-policy.json <<'EOF'
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

### 29. Créer le rôle IAM pour l'instance EC2

```bash
aws iam create-role \
  --role-name "${IAM_ROLE_NAME}" \
  --assume-role-policy-document file://policies/ec2-ssm-trust-policy.json \
  > reports/create-iam-role.json
```

### 30. Attacher la policy managée AmazonSSMManagedInstanceCore

```bash
aws iam attach-role-policy \
  --role-name "${IAM_ROLE_NAME}" \
  --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
```

### 31. Créer l'instance profile

```bash
aws iam create-instance-profile \
  --instance-profile-name "${INSTANCE_PROFILE_NAME}" \
  > reports/create-instance-profile.json
```

### 32. Ajouter le rôle à l'instance profile

```bash
aws iam add-role-to-instance-profile \
  --instance-profile-name "${INSTANCE_PROFILE_NAME}" \
  --role-name "${IAM_ROLE_NAME}"
```

### 33. Attendre la propagation IAM

```bash
sleep 30
```

## Déploiement de l'instance EC2

### 34. Récupérer l'AMI Amazon Linux 2023

```bash
export AMI_ID="$(aws ssm get-parameter \
  --name "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64" \
  --query "Parameter.Value" \
  --output text)"

echo "AMI_ID=${AMI_ID}"
```

### 35. Lancer une instance sans clé SSH

L'instance est lancée sans key pair. L'administration se fera via Session Manager.

```bash
aws ec2 run-instances \
  --image-id "${AMI_ID}" \
  --instance-type "${INSTANCE_TYPE}" \
  --subnet-id "${SUBNET_ID}" \
  --security-group-ids "${SECURITY_GROUP_ID}" \
  --iam-instance-profile Name="${INSTANCE_PROFILE_NAME}" \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}}]" \
  > reports/run-instance.json
```

```bash
export INSTANCE_ID="$(jq -r '.Instances[0].InstanceId' reports/run-instance.json)"
echo "INSTANCE_ID=${INSTANCE_ID}"
```

### 36. Attendre que l'instance soit en état running

```bash
aws ec2 wait instance-running \
  --instance-ids "${INSTANCE_ID}"
```

### 37. Récupérer l'adresse publique de l'instance

```bash
export INSTANCE_PUBLIC_IP="$(aws ec2 describe-instances \
  --instance-ids "${INSTANCE_ID}" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)"

echo "INSTANCE_PUBLIC_IP=${INSTANCE_PUBLIC_IP}"
```

### 38. Vérifier la configuration réseau de l'instance

```bash
aws ec2 describe-instances \
  --instance-ids "${INSTANCE_ID}" \
  --query 'Reservations[0].Instances[0].{InstanceId:InstanceId,State:State.Name,PublicIp:PublicIpAddress,SubnetId:SubnetId,SecurityGroups:SecurityGroups[*].GroupId,IamProfile:IamInstanceProfile.Arn}' \
  --output json
```

## Vérification Session Manager

### 39. Attendre que l'instance soit visible dans Systems Manager

L'agent SSM peut mettre quelques minutes à apparaître comme `Online`.

```bash
for i in $(seq 1 40); do
  export SSM_PING_STATUS="$(aws ssm describe-instance-information \
    --filters "Key=InstanceIds,Values=${INSTANCE_ID}" \
    --query 'InstanceInformationList[0].PingStatus' \
    --output text 2>/dev/null)"

  echo "Tentative $i - Statut SSM : ${SSM_PING_STATUS}"

  if [ "${SSM_PING_STATUS}" = "Online" ]; then
    echo "Instance disponible dans Session Manager"
    break
  fi

  sleep 10
done
```

### 40. Vérifier les informations SSM de l'instance

```bash
aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=${INSTANCE_ID}" \
  --output json > reports/ssm-instance-information.json
```

```bash
jq '.InstanceInformationList[0] | {InstanceId, PingStatus, PlatformName, PlatformVersion, AgentVersion, IPAddress}' reports/ssm-instance-information.json
```

Si `PingStatus` n'est pas `Online`, vérifier :

```text
Le rôle IAM de l'instance contient AmazonSSMManagedInstanceCore.
L'instance profile est bien attaché à l'instance.
L'instance dispose d'une connectivité HTTPS sortante.
La région AWS CLI est la même que celle de l'instance.
L'AMI contient bien SSM Agent.
```

### 41. Ouvrir une session via Session Manager

Cette commande ouvre une session interactive sur l'instance.

```bash
aws ssm start-session \
  --target "${INSTANCE_ID}"
```

Dans la session, exécuter quelques commandes simples :

```bash
whoami
hostname
uname -a
exit
```

### 42. Vérifier que l'administration ne dépend pas de SSH

```bash
aws ec2 describe-security-groups \
  --group-ids "${SECURITY_GROUP_ID}" \
  --query 'SecurityGroups[0].IpPermissions' \
  --output json
```

Le résultat attendu est :

```json
[]
```

### 43. Vérifier la règle NACL de refus SSH

```bash
aws ec2 describe-network-acls \
  --network-acl-ids "${NACL_ID}" \
  --query 'NetworkAcls[0].Entries[?RuleNumber==`100`]' \
  --output json
```

La règle doit indiquer :

```text
Port 22
Action deny
Direction ingress
```

### 44. Vérifier la règle NACL HTTPS sortante

```bash
aws ec2 describe-network-acls \
  --network-acl-ids "${NACL_ID}" \
  --query 'NetworkAcls[0].Entries[?Egress==`true`]' \
  --output json
```

La règle attendue doit autoriser :

```text
TCP 443 sortant vers 0.0.0.0/0
```

### 45. Sauvegarder les variables utiles au nettoyage

```bash
cat > reports/tp.env <<EOF
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION}"
export TP_ID="${TP_ID}"
export AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"

export VPC_ID="${VPC_ID}"
export SUBNET_ID="${SUBNET_ID}"
export IGW_ID="${IGW_ID}"
export ROUTE_TABLE_ID="${ROUTE_TABLE_ID}"
export ROUTE_TABLE_ASSOC_ID="${ROUTE_TABLE_ASSOC_ID}"

export SECURITY_GROUP_ID="${SECURITY_GROUP_ID}"
export DEFAULT_NACL_ID="${DEFAULT_NACL_ID}"
export ORIGINAL_NACL_ASSOC_ID="${ORIGINAL_NACL_ASSOC_ID}"
export NACL_ID="${NACL_ID}"
export NACL_ASSOC_ID="${NACL_ASSOC_ID}"

export IAM_ROLE_NAME="${IAM_ROLE_NAME}"
export INSTANCE_PROFILE_NAME="${INSTANCE_PROFILE_NAME}"

export INSTANCE_ID="${INSTANCE_ID}"
export INSTANCE_PUBLIC_IP="${INSTANCE_PUBLIC_IP}"
EOF
```

### 46. Afficher les variables sauvegardées

```bash
cat reports/tp.env
```

### 47. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP VPC, Security Group, NACL et Session Manager"
  echo
  echo "## Ressources créées"
  echo
  echo "| Ressource | Valeur |"
  echo "|---|---|"
  echo "| VPC | ${VPC_ID} |"
  echo "| Subnet | ${SUBNET_ID} |"
  echo "| Internet Gateway | ${IGW_ID} |"
  echo "| Route Table | ${ROUTE_TABLE_ID} |"
  echo "| Security Group | ${SECURITY_GROUP_ID} |"
  echo "| NACL | ${NACL_ID} |"
  echo "| Instance EC2 | ${INSTANCE_ID} |"
  echo "| Rôle IAM EC2 | ${IAM_ROLE_NAME} |"
  echo
  echo "## Contrôles appliqués"
  echo
  echo "- Aucun port entrant autorisé au niveau du Security Group."
  echo "- Trafic sortant limité à HTTPS au niveau du Security Group."
  echo "- SSH explicitement refusé au niveau de la NACL."
  echo "- HTTPS sortant autorisé au niveau de la NACL."
  echo "- Ports éphémères entrants autorisés pour les retours de connexion."
  echo "- Administration réalisée via AWS Systems Manager Session Manager."
  echo
  echo "## Points pédagogiques"
  echo
  echo "- Le Security Group protège l'instance."
  echo "- La NACL protège le subnet."
  echo "- Le Security Group est stateful."
  echo "- La NACL est stateless."
  echo "- Session Manager permet l'administration sans SSH, sans bastion et sans clé privée."
} > reports/vpc-sg-nacl-session-manager-summary.md
```

### 48. Afficher le rapport de synthèse

```bash
cat reports/vpc-sg-nacl-session-manager-summary.md
```

### 49. Lister les rapports générés

```bash
find reports -maxdepth 1 -type f -print
```

## Nettoyage

### 50. Recharger les variables si nécessaire

Si le nettoyage est effectué dans le même terminal, cette commande n'est pas indispensable.

Si un nouveau terminal a été ouvert, se replacer dans le dossier du TP puis recharger les variables :

```bash
cd tp-vpc-sg-nacl-session-manager
source reports/tp.env
```

### 51. Terminer l'instance EC2

```bash
aws ec2 terminate-instances \
  --instance-ids "${INSTANCE_ID}"
```

### 52. Attendre la terminaison de l'instance

```bash
aws ec2 wait instance-terminated \
  --instance-ids "${INSTANCE_ID}"
```

### 53. Supprimer le Security Group

La suppression peut parfois retourner `DependencyViolation` si les dépendances EC2 ne sont pas encore totalement libérées.

```bash
for i in $(seq 1 10); do
  if aws ec2 delete-security-group \
    --group-id "${SECURITY_GROUP_ID}"; then
    echo "Security Group supprimé"
    break
  fi

  echo "Tentative $i : Security Group encore dépendant, nouvelle tentative dans 10 secondes"
  sleep 10
done
```

### 54. Réassocier la NACL par défaut au subnet

```bash
aws ec2 replace-network-acl-association \
  --association-id "${NACL_ASSOC_ID}" \
  --network-acl-id "${DEFAULT_NACL_ID}" \
  > reports/restore-default-nacl.json
```

### 55. Supprimer la NACL dédiée

```bash
aws ec2 delete-network-acl \
  --network-acl-id "${NACL_ID}"
```

### 56. Dissocier la table de routage

```bash
aws ec2 disassociate-route-table \
  --association-id "${ROUTE_TABLE_ASSOC_ID}"
```

### 57. Supprimer la table de routage

```bash
aws ec2 delete-route-table \
  --route-table-id "${ROUTE_TABLE_ID}"
```

### 58. Détacher l'Internet Gateway

```bash
aws ec2 detach-internet-gateway \
  --internet-gateway-id "${IGW_ID}" \
  --vpc-id "${VPC_ID}"
```

### 59. Supprimer l'Internet Gateway

```bash
aws ec2 delete-internet-gateway \
  --internet-gateway-id "${IGW_ID}"
```

### 60. Supprimer le subnet

```bash
aws ec2 delete-subnet \
  --subnet-id "${SUBNET_ID}"
```

### 61. Supprimer le VPC

```bash
aws ec2 delete-vpc \
  --vpc-id "${VPC_ID}"
```

### 62. Retirer le rôle de l'instance profile

```bash
aws iam remove-role-from-instance-profile \
  --instance-profile-name "${INSTANCE_PROFILE_NAME}" \
  --role-name "${IAM_ROLE_NAME}"
```

### 63. Supprimer l'instance profile

```bash
aws iam delete-instance-profile \
  --instance-profile-name "${INSTANCE_PROFILE_NAME}"
```

### 64. Détacher la policy SSM du rôle IAM

```bash
aws iam detach-role-policy \
  --role-name "${IAM_ROLE_NAME}" \
  --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
```

### 65. Supprimer le rôle IAM

```bash
aws iam delete-role \
  --role-name "${IAM_ROLE_NAME}"
```

### 66. Vérifier que l'instance est bien terminée

```bash
export INSTANCE_STATE="$(aws ec2 describe-instances \
  --instance-ids "${INSTANCE_ID}" \
  --query 'Reservations[0].Instances[0].State.Name' \
  --output text 2>&1)"

echo "État de l'instance : ${INSTANCE_STATE}"

if [ "${INSTANCE_STATE}" = "terminated" ]; then
  echo "Instance bien terminée"
else
  echo "Instance encore présente avec un état inattendu : ${INSTANCE_STATE}"
fi
```

### 67. Vérifier que le VPC est supprimé

```bash
aws ec2 describe-vpcs --vpc-ids "${VPC_ID}" 2>&1 \
  && echo "Le VPC existe encore" \
  || echo "VPC bien supprimé"
```

## Résultat attendu

| Fichier produit | Description |
| --- | --- |
| `policies/ec2-ssm-trust-policy.json` | Politique de confiance permettant à EC2 d'assumer le rôle SSM |
| `reports/create-vpc.json` | Réponse AWS à la création du VPC |
| `reports/create-subnet.json` | Réponse AWS à la création du subnet |
| `reports/create-igw.json` | Réponse AWS à la création de l'Internet Gateway |
| `reports/create-route-table.json` | Réponse AWS à la création de la table de routage |
| `reports/associate-route-table.json` | Réponse AWS à l'association table de routage / subnet |
| `reports/create-security-group.json` | Réponse AWS à la création du Security Group |
| `reports/security-group.json` | Vérification des règles du Security Group |
| `reports/create-nacl.json` | Réponse AWS à la création de la NACL |
| `reports/network-acl.json` | Vérification des règles de la NACL |
| `reports/create-iam-role.json` | Réponse AWS à la création du rôle IAM |
| `reports/create-instance-profile.json` | Réponse AWS à la création du profil d'instance |
| `reports/run-instance.json` | Réponse AWS au lancement de l'instance EC2 |
| `reports/ssm-instance-information.json` | Confirmation que l'instance est gérée par SSM |
| `reports/tp.env` | Variables d'environnement du TP (IDs des ressources créées) |
| `reports/vpc-sg-nacl-session-manager-summary.md` | Rapport de synthèse du TP |

| Contrôle de sécurité | Résultat attendu |
| --- | --- |
| Security Group — règles entrantes | Aucune règle entrante (port 22/SSH absent) |
| Trafic sortant de l'instance | Limité à HTTPS (port 443) |
| NACL — SSH | La NACL refuse explicitement SSH (port 22) |
| NACL — ports éphémères | Autorise le retour des connexions sortantes (1024-65535) |
| Administration de l'instance | Accessible via Session Manager sans SSH ni bastion |
| Rôle IAM | `AmazonSSMManagedInstanceCore` attaché, permettant à SSM de communiquer |
| Clé SSH | Aucune clé SSH créée pendant le TP |
| Bastion | Aucun bastion créé pendant le TP |
