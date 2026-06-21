---
title: "14. Gouvernance & Conformité cloud"
---

# 14. Gouvernance & Conformité cloud

## Les landing zones

Une landing zone est le socle cloud prêt à accueillir des applications.
Elle définit à l'avance les règles de base pour déployer dans le cloud de manière sécurisée, gouvernée et industrialisée : comptes ou subscriptions, réseau, IAM, journalisation, sécurité, supervision, politiques de conformité et organisation des environnements.

### C'est quoi une landing zone ?

| Situation | Sans landing zone | Avec landing zone |
| --- | --- | --- |
| Création d'un projet cloud | Chaque équipe crée ses ressources à sa façon | Les équipes utilisent un cadre commun déjà défini |
| Organisation | Comptes, projets ou subscriptions créés sans logique claire | Comptes, projets ou subscriptions structurés par environnement, équipe ou application |
| Réseau | Réseau configuré au cas par cas | Réseau standardisé : VPC/VNet, sous-réseaux, accès privés, règles communes |
| Identités et accès | Droits attribués manuellement, parfois trop larges | Accès basés sur des rôles, MFA, moindre privilège et règles communes |
| Logs et audit | Journaux parfois absents ou dispersés | Logs centralisés pour audit, supervision et investigation |
| Sécurité | Les contrôles dépendent de chaque projet | Contrôles appliqués par défaut : chiffrement, politiques, alertes, restrictions |
| Conformité | Difficile à vérifier après coup | Règles de conformité intégrées dès le départ |
| Résultat | Cloud hétérogène, difficile à sécuriser et à gouverner | Socle cloud maîtrisé, sécurisé et prêt pour les workloads |

### Ça sert à quoi ?

| Besoin | Rôle de la landing zone |
| --- | --- |
| Structurer le cloud | Organisation des comptes, subscriptions, projets, dossiers ou unités d'organisation |
| Sécuriser par défaut | IAM, MFA, moindre privilège, chiffrement, logs, contrôles de sécurité |
| Gouverner | Politiques, conformité, guardrails, tagging, règles de déploiement |
| Industrialiser | Création reproductible d'environnements dev, test, prod |
| Surveiller | Centralisation des logs, alertes, audit et supervision |
| Limiter les dérives | Contrôles préventifs et détectifs contre les mauvaises configurations |

### AWS vs Azure vs GCP : comparatif des implémentations

| Dimension | AWS | Azure | GCP |
| --- | --- | --- | --- |
| Approche principale | AWS Control Tower | Azure Landing Zones | Google Cloud Landing Zone / Cloud Foundation |
| Nature de l'offre | Service managé pour créer et gouverner une landing zone multi-comptes | Architecture de référence avec accélérateurs IaC ou portail | Guide d'architecture, blueprints et fondation Terraform |
| Unité d'organisation | Organizations, Organizational Units, comptes AWS | Management Groups, subscriptions, resource groups | Organization, folders, projects |
| Création des environnements | Account Factory pour créer et enrôler des comptes | Subscriptions organisées par plateforme et workloads | Projects organisés par dossiers, environnements ou domaines |
| Gouvernance | Contrôles préventifs, détectifs et proactifs | Azure Policy, initiatives, RBAC, management groups | Organization Policies, IAM, Resource Manager |
| Sécurité intégrée | Audit account, Log Archive, Security Hub, Config, Guardrails | Defender for Cloud, Policy, Monitor, Log Analytics, Sentinel | Security Command Center, Cloud Logging, IAM, VPC Service Controls |
| Réseau | VPC, Transit Gateway, comptes réseau dédiés | Hub & Spoke, Virtual WAN, Private Link | Shared VPC, VPC peering, Cloud NAT, Private Service Connect |
| Point fort | Mise en place rapide d'un socle AWS gouverné | Modèle très structuré pour gouvernance d'entreprise Azure | Forte modularité autour de l'organisation, des projets et de l'IaC |
| Limite | Très orienté AWS et modèle multi-comptes | Plus conceptuel, nécessite des choix d'implémentation | Moins "produit clé en main", davantage blueprint / architecture |

## AWS Organizations

Service global qui permet de gérer plusieurs comptes AWS.

Avantages :
- Facturation consolidée pour tous les comptes : mode de paiement unique
- La tarification bénéficie de l'utilisation agrégée (remise sur volume pour EC2, S3, etc.)
- Mutualisation des instances EC2 réservées pour des économies optimales
- L'API est disponible pour automatiser la création de compte AWS
- Restreindre les privilèges de compte à l'aide des politiques de contrôle des services (SCP)

### Terminologie

AWS Organizations repose sur une hiérarchie en arbre : la racine contient des unités d'organisation, les unités regroupent des comptes, et les politiques appliquées en haut de l'arbre se propagent aux niveaux inférieurs.

| Élément | Définition | Rôle dans AWS Organizations | Point clé |
| --- | --- | --- | --- |
| Organisation | Ensemble centralisé permettant de regrouper plusieurs comptes AWS. | Permet d'administrer les comptes comme une seule unité. | Contient un compte de gestion, des comptes membres, une racine et éventuellement des unités d'organisation. |
| Racine | Conteneur parent de toute l'organisation. | Point le plus haut de la hiérarchie. | Une politique appliquée à la racine s'applique à tous les comptes et toutes les UO. |
| Unité d'organisation (UO) | Conteneur hiérarchique placé sous la racine. | Sert à regrouper des comptes par environnement, équipe, département ou niveau de criticité. | Les politiques appliquées à une UO se propagent aux UO enfants et aux comptes associés. |
| Compte AWS | Compte AWS standard contenant des ressources, identités et services. | Héberge les workloads, environnements ou fonctions dédiées. | Chaque compte appartient à une seule UO ou directement à la racine. |
| Compte de gestion | Compte principal de l'organisation. | Sert à créer, organiser et administrer les comptes membres. | À protéger fortement, car il pilote l'organisation. |
| Compte membre | Compte AWS rattaché à l'organisation. | Utilisé pour isoler des environnements, applications, équipes ou fonctions. | Peut recevoir des politiques héritées de la racine ou de son UO. |
| Politique héritée | Politique appliquée à un niveau de la hiérarchie. | Définit des règles qui se propagent vers le bas. | Plus la politique est appliquée haut, plus son impact est large. |

### Focus sur les comptes

Un compte AWS est le contenant de base. Dans AWS Organizations, un compte devient soit compte de gestion (pour piloter l'organisation), soit compte membre (pour héberger des workloads, des environnements ou des fonctions spécialisées).

| Question | Compte de gestion | Compte membre |
| --- | --- | --- |
| Peut piloter AWS Organizations ? | Oui | Non, sauf permissions déléguées |
| Peut créer / organiser les comptes ? | Oui | Non |
| Reçoit les politiques de l'organisation ? | Cas particulier, à traiter avec prudence | Oui, selon sa position dans la racine ou une UO |
| Héberge normalement les workloads ? | À éviter | Oui |
| Niveau de criticité | Très élevé | Variable selon l'usage du compte |

### Stratégies multi-comptes

Une stratégie multi-comptes AWS permet de séparer les environnements, d'appliquer des garde-fous centraux, de centraliser les journaux et de mieux maîtriser les coûts, tout en limitant l'impact d'une erreur ou d'une compromission.

| Stratégie | Objectif | Exemple |
| --- | --- | --- |
| Isoler les environnements | Séparer les risques, les accès et les ressources | Comptes distincts pour dev, test, préproduction et production |
| Structurer par organisation | Aligner le cloud avec l'entreprise | Comptes par département, produit, équipe ou centre de coûts |
| Appliquer des garde-fous | Limiter ce que les comptes peuvent faire | SCP pour interdire certaines régions, services ou actions sensibles |
| Séparer les fonctions critiques | Protéger les services de sécurité et d'audit | Compte dédié pour la journalisation, compte sécurité, compte réseau |
| Centraliser les logs | Faciliter l'audit, l'investigation et la conformité | CloudTrail activé sur tous les comptes avec logs envoyés vers un compte central |
| Centraliser la supervision | Consolider les événements techniques et sécurité | Logs CloudWatch envoyés vers un compte central de logging |
| Maîtriser les coûts | Suivre la consommation par équipe ou application | Tags normalisés : application, environnement, owner, cost-center |
| Comparer avec le compte unique | Réduire les risques de mélange des environnements | Multi-comptes pour l'isolation forte ; multi-VPC dans un compte pour des besoins plus simples |

## Service Control Policies (SCP)

- Liste blanche ou liste noire des actions IAM
- Appliqué au niveau de l'OU ou du niveau de compte
- Ne s'applique pas au compte principal
- SCP est appliqué à tous les utilisateurs et rôles du compte, y compris l'utilisateur racine
- Le SCP n'affecte pas les rôles liés au service
- Les rôles liés à un service permettent à d'autres services AWS de s'intégrer à AWS Organizations et ne peuvent pas être restreints par les SCP
- SCP doit avoir une autorisation explicite (n'autorise rien par défaut)
- Cas d'utilisation :
  - Restreindre l'accès à certains services
  - Appliquer la conformité PCI en désactivant explicitement les services

### AWS Organizations vs AWS IAM

| Dimension | AWS Organizations | AWS IAM |
| --- | --- | --- |
| Rôle principal | Organiser et gouverner plusieurs comptes AWS | Gérer les identités et les permissions dans AWS |
| Périmètre | Multi-comptes | Principalement au niveau d'un compte AWS |
| Objet géré | Comptes, unités d'organisation, politiques globales | Utilisateurs, groupes, rôles, policies, clés d'accès |
| Usage typique | Structurer une landing zone, séparer prod/dev/sécurité/logs | Donner des droits précis à une personne, application ou service |
| Contrôle d'accès | Définit les limites maximales via les SCP | Autorise concrètement les actions via les policies IAM |
| Exemple | Interdire l'usage d'une région AWS à tous les comptes d'une OU | Autoriser un rôle à lire un bucket S3 spécifique |
| Logique sécurité | Gouvernance centrale et garde-fous | Moindre privilège et contrôle fin des accès |
| Niveau de granularité | Large : compte, OU, organisation | Fin : action, ressource, condition |
| Dans une landing zone | Structure les comptes et applique les règles globales | Gère les accès aux ressources dans chaque compte |
| En synthèse | AWS Organizations définit le cadre | AWS IAM définit les droits effectifs |

## AWS Control Tower

AWS Control Tower est un service managé qui permet de créer, organiser et gouverner une landing zone AWS multi-comptes.
Il s'appuie sur AWS Organizations pour structurer les comptes, appliquer des contrôles de sécurité et standardiser la création de nouveaux environnements.

| Fonction | Rôle |
| --- | --- |
| Créer la landing zone | Mettre en place un socle AWS multi-comptes conforme aux bonnes pratiques |
| Organiser les comptes | Structurer les comptes par unités d'organisation : sécurité, production, développement, sandbox |
| Provisionner les comptes | Créer de nouveaux comptes de manière standardisée avec Account Factory |
| Appliquer des garde-fous | Activer des contrôles préventifs, détectifs ou proactifs sur les comptes et les UO |
| Centraliser la sécurité | Créer des comptes dédiés pour l'audit, la journalisation et la gouvernance |
| Surveiller la conformité | Détecter les écarts de configuration et suivre l'état de conformité depuis un tableau de bord |
| Industrialiser la gouvernance | Réduire les configurations manuelles et appliquer les règles de manière cohérente |

### Les garde-fous

Les garde-fous AWS Control Tower permettent d'encadrer les comptes AWS en bloquant les actions risquées, en détectant les écarts de conformité et en vérifiant certaines ressources avant leur déploiement.

| Type de garde-fou | Objectif | Exemples |
| --- | --- | --- |
| Préventif | Bloquer une action non autorisée avant qu'elle ne soit réalisée | Interdire l'usage du compte root, empêcher la création de clés d'accès root ; restreindre certaines régions AWS, interdire certains services dans une UO |
| Détectif | Identifier une configuration non conforme après sa création | Détecter un bucket S3 public, détecter un volume EBS non chiffré, détecter l'absence de MFA, détecter l'absence de versioning sur S3 |
| Proactif | Vérifier une ressource avant son déploiement | Refuser un template CloudFormation qui crée une ressource non chiffrée, bloquer une configuration S3, RDS, EKS ou Lambda non conforme |
| Organisationnel | Standardiser la gouvernance multi-comptes | Imposer des comptes dédiés pour audit, logs, sécurité et production, appliquer des règles différentes selon les UO |
| Journalisation | Garantir la traçabilité des actions | Protéger CloudTrail, centraliser les logs dans un compte dédié, empêcher la suppression ou l'altération des journaux |
| Sécurité des données | Réduire les risques d'exposition | Empêcher l'accès public aux buckets, imposer le chiffrement, détecter les ressources non protégées |

## Les certifications de personnes de sécurité du cloud


| Certification | Organisme | Positionnement |
| --- | --- | --- |
| CCSK | Cloud Security Alliance | Fondamentaux de la sécurité cloud, approche vendor-neutral |
| CCSP | ISC2 | Expertise avancée sécurité, architecture et gouvernance cloud |
| AWS Certified Security -Specialty | AWS | Sécurité avancée des environnements AWS |
| AZ-500 | Microsoft | Sécurisation des environnements Azure |
| SC-100 | Microsoft | Architecture cybersécurité cloud, hybride et Zero Trust |
| SC-200 | Microsoft | SOC cloud, détection et réponse avec Sentinel / Defender |
| Professional Cloud Security Engineer | Google Cloud | Sécurité des environnements Google Cloud |
| CKS | CNCF / Linux Foundation | Sécurité Kubernetes et workloads cloud native |
| CISSP | ISC2 | Gouvernance et architecture cybersécurité, utile mais non<br>spécifique cloud |


## Tableau de bord CISO : KPIs sécurité cloud

Un Tableau de Bord CISO est un tableau de pilotage destiné au RSSI/CISO (Chief Information Security Officer)
permettant de suivre l’état de sécurité des environnements cloud à travers des indicateurs clés (KPIs).
Les objectifs sont de :
- Mesurer le niveau de risque
- Suivre la posture de sécurité
- Prioriser les remédiations
- Piloter la conformité
- Détecter les dérives
- Communiquer aux équipes techniques et à la direction
- Etc.




![Slide 292](/securite-cloud/13-gouvernance-conformite-cloud/p292_00_Image82.jpg)


## La défense en profondeur

- La défense en profondeur consiste à superposer plusieurs couches de sécurité
complémentaires afin de réduire le risque qu'une défaillance unique compromettre
l'ensemble du système.
- Principe : si une mesure de sécurité est contournée, les couches suivantes continuent de
protéger les actifs.
- Exemple d’application dans le cloud :
  - MFA sur les comptes privilégiés
  - Segmentation réseau et Security Groups
  - Chiffrement des données au repos et en transit
  - SAST, SCA et DAST dans la CI/CD
  - CSPM et CNAPP pour la posture cloud
  - SIEM, SOAR et détection comportementale
  - Sauvegardes et plans de reprise


## Les huit couches de la défense en profondeur


![Slide 294](/securite-cloud/13-gouvernance-conformite-cloud/p294_01_Image83.jpg)

