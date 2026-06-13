---
title: "06. Identity & Access Management (IAM)"
---

# 06. Identity & Access Management (IAM)

## 06. Identity & Access

Management (IAM)

![Slide 110](/securite-cloud/06-identity-access-management/p110_00_Image13.jpg)

## Les fondamentaux de l’IAM cloud

Ensemble des politiques, processus et technologies permettant de gérer les identités numériques et de contrôler
quelles ressources elles peuvent accéder, quand et comment.
 Authentification (AuthN)
Qui es-tu ? Vérification de l'identité (password, MFA, certificat,
biométrie)
Autorisation (AuthZ) Que peux-tu faire ? Contrôle des permissions sur les ressources
4 entités IAM AWS Users (humains) · Groups (groupes d'users) · Roles (entités
assumables) · Policies (politiques JSON)
Concept de compte root Le compte le plus “puissant” : NE JAMAIS l'utiliser au quotidien ·
MFA obligatoire · Verrouiller les clés root
IAM Cloud providers AWS IAM · Azure AD (Entra ID) · Google Cloud IAM : concepts
similaires, syntaxes différentes

## RBAC vs ABAC : Modèles de Contrôle d'Accès

Recommandation pratique : Commencer par RBAC puis ajouter des conditions ABAC pour les cas sensibles.
RBAC : Role-Based Access Control ABAC : Attribute-Based Access Control
- Accès défini par le rôle de l'utilisateur
- Ex: Admin, Developer, ReadOnly, Auditor
- Simple à administrer et auditer
- Utilisé par défaut : AWS IAM, Azure RBAC, GCP IAM
- Moins flexible pour les cas d'usage complexes
- Risque : rôle explosion avec le temps
- Adapté à : 90% des organisations
- Exemple AWS : rôle 'S3ReadOnly' → accès lecture S3
- Accès basé sur des ATTRIBUTS contextuels
- Ex: dept=finance ET heure=bureau ET pays=FR
- Granularité maximale et très flexible
- Utilisé dans : AWS Cedar, OPA (Open Policy Agent)
- Idéal pour architectures Zero Trust avancées
- Plus complexe à configurer et déboguer
- Adapté à : architectures multi-cloud complexes
- Exemple : accès si tag:environment=prod ET
tag:team=security

## Principe du moindre privilège (Least Privilege)

Définition : Chaque identité (user, service, rôle) ne doit avoir que les permissions strictement nécessaires à sa tâche ni
plus, jamais.
Deny All par défaut Just-In-Time (JIT) Révision régulière
Commencer par refuser tout accès,
puis accorder uniquement les
permissions requises. Ne jamais
partir d'un accès large et
restreindre.
Accès temporaires activés à la
demande pour une durée limitée.
Azure PIM, AWS SSO avec durée
limitée = réduction de la fenêtre
d'attaque.
Access reviews trimestrielles.
Supprimer les droits inutilisés depuis
>90 jours. IAM Access Analyzer
(AWS) ou Access Reviews (Azure
AD).
Analyse de l'usage réel GCP IAM Recommender Azure PIM (JIT)
AWS IAM Access Analyzer génère
des politiques 'minimum required'
basées sur l'usage CloudTrail des 90
derniers jours.
Machine learning analysant l'usage
réel pour détecter les rôles
surdimensionnés et proposer des
restrictions précises.
Accès privilégiés Just-In-Time avec
durée max configurée + approbation
manageur + MFA obligatoire à
l'activation.

## Mul ti-Factor Authentication : Types et Bonnes Pratiques

MFA = quelque chose que vous SAVEZ (mot de passe, code PIN, etc.) + quelque chose que vous AVEZ (téléphone
recevant un code par SMS, carte à puce, et.) + quelque chose que vous ÊTES (voix, iris, empreinte digitale, etc.)
 Méthode MFA Niveau de sécurité Avantages Risques / Limites
SMS / Email OTP Faible Facile à déployer SIM swapping, phishing,
man-in-the-middle
TOTP (Google Auth,
Authy)
Moyen Gratuit, offline, portable Phishable (si pas FIDO2), perte du
device
Push (Okta, Duo, MS
Auth)
Bon UX simple, contexte de la
demande visible
MFA Fatigue attack possible si mal
configuré
Hardware FIDO2 /
Passkeys
Excellent Résistant au phishing, lié au
domaine
Coût, perte clé = blocage, gestion
stock
Certificat client (mTLS) Expert Idéal pour service accounts,
automatisé
PKI complexe, rotation des certificats

## Vol de Token de Session Cloud : Bypasser IAM Sans MFA Ni Mot de

Passe
Une fois authentifié, l'attaquant n'a plus besoin de vos credentials. Il lui suffit de voler votre token de session AWS/Azure. Durée de vie : jusqu'à 12 heures.
 Cookie Session Hijacking (Browser) STS Token Theft (API Access)
- Comment : Vol du cookie de session AWS Console via XSS, malware,
ou AiTM proxy. Le cookie contient un JWT valide.
- Impact : Accès AWS Console complet pour toute la durée de validité
du cookie (8h par défaut).
- Détection : CloudTrail : ConsoleLogin depuis IP inhabituelle APRÈS
une session légitime.
- Remède : ForceDestroyingSessions IAM · Conditional Access par IP ·
Session revocation API
- Comment : Credentials temporaires STS volés depuis une Lambda, une
instance EC2 (metadata), ou un pipeline CI/CD.
- Impact : aws configure --profile stolen puis accès API complet jusqu'à
expiration (max 12h).
- Détection : Même AssumeRole utilisé depuis 2 IPs différentes →
impossible travel.
- Remède : Conditions IAM : aws:SourceIp · IMDSv2 obligatoire · STS
set-session-policy
OIDC Token Reuse Moyen
- Comment : JWT ID Token volé (intercepté, logué, ou stocké en
localStorage) puis réutilisé sur un autre endpoint.
- Impact : Accès à toutes les ressources configurées pour ce JWT (APIs,
microservices, S3).
- Détection : Token utilisé depuis IP/User-Agent différents du token
précédent.
- Remède : Nonce binding · PKCE · Short-lived tokens (< 15 min) · Token
binding (RFC 8471)
- Comment : SSRF sur une app hébergée sur EC2/ECS → 169.254.169.254
→ credentials IAM du rôle d'instance.
- Impact : Credentials temporaires du rôle EC2 — utilisables pendant 1h,
renouvelables.
- Détection : Requêtes HTTP vers 169.254.169.254 depuis des process
applicatifs.
- Remède : IMDSv2 obligatoire (hop limit=1) · SCP interdisant IMDSv1 ·
Network Policy K8s

## Fédération d'Identités

Avantages Cas d'usage
Authentification centralisée Accès à plusieurs applications via le SSO
Réduction du nombre de mots de passe Accès aux fournisseurs cloud (AWS, Azure, GCP)
Gestion simplifiée des accès Intégration avec des applications SaaS
Amélioration de l'expérience utilisateur Collaboration entre organisations
Renforcement de la sécurité et de la conformité Fédération entre partenaires, clients ou filiales
La fédération d'identité permet à une organisation d'utiliser une identité unique et de confiance pour authentifier ses
utilisateurs et leur donner accès de manière sécurisée à plusieurs applications, services cloud ou ressources externes.

## Authentication unique (SSO : Single Sign-On)

Le Single Sign-On (SSO) permet à un utilisateur de s'authentifier une seule fois afin d'accéder de manière sécurisée à plusieurs
applications ou services, sans avoir à se reconnecter ni à gérer plusieurs mots de passe.
Avantages Bénéfices
Une seule authentification Améliore l'expérience utilisateur
Moins de mots de passe Réduit les risques liés aux mots de passe
Gestion centralisée Simplifie l'administration des accès
Révocation unique Désactive immédiatement l'accès à toutes les applications
MFA centralisé Renforce la sécurité globale
Cas d'usage :
- Accès aux environnements cloud (AWS, Azure, GCP)
- Accès aux applications SaaS (Microsoft 365, Salesforce, Jira, ServiceNow)
- Portails d'entreprise et intranets
- Collaboration entre partenaires et filiales

## SAML 2.0 :

Security Assertion Markup Language

![Slide 123](/securite-cloud/06-identity-access-management/p123_01_Image43.jpg)

## SAML 2.0 : Security Assertion Markup Language

Le Single Sign-On (SSO) permet à un utilisateur de s'authentifier une seule fois afin d'accéder de manière sécurisée à plusieurs
applications ou services, sans avoir à se reconnecter ni à gérer plusieurs mots de passe.

## OAuth 2.0 : Délégation d'Autorisation

Standard d'autorisation (2012) · Délègue l'accès SANS partager le mot de passe · Base de OIDC · 4 flows selon le
contexte

## OpenID Connect (OIDC) : Couche d'identité sur OAuth 2.0

Standard moderne (2014) · Tokens JWT · API-first · Utilisé : GitHub Actions, Google, AWS Cognito, Kubernetes IRSA

## Workload Identity Federation

Standard d'autorisation (2012) · Délègue l'accès SANS partager le mot de passe · Base de OIDC · 4 flows selon le
contexte

## Synthèse

Concept En quelques mots …
Fédération d'identité Permet d'utiliser une identité existante pour accéder à des applications ou services externes.
SSO (Single Sign-On) Se connecter une seule fois pour accéder à plusieurs applications.
OAuth 2.0 Autoriser une application à accéder à une ressource sans partager le mot de passe de
l'utilisateur.
OIDC (OpenID Connect) Permet à une application de vérifier l'identité d'un utilisateur de manière moderne et
sécurisée.
SAML Standard historique permettant aux entreprises d'authentifier leurs utilisateurs sur des
applications externes.
Workload Identity
Federation
Permet à une application ou un pipeline d'accéder au cloud sans utiliser de secret ou de clé
stockée.

## Gestion des secrets

Anti-pattern absolu : credentials en dur dans le code → git blame révèle tout, même après suppression (git history)
 AWS Secrets Manager Azure Key Vault
- Rotation automatique des secrets
- Intégration native RDS, Redshift, DocumentDB
- Audit complet via CloudTrail
- Cross-account via Resource Policy
- Coût : 0.40$/secret/mois + 0.05$/10K appels
- Secrets + Clés + Certificats dans une seule solution
- Backing HSM FIPS 140-2 Level 2/3 (Premium)
- RBAC granulaire avec Azure AD
- Soft-delete + Purge Protection obligatoires
- Intégration App Service, AKS, VMSS native
HashiCorp Vault GCP Secret Manager
- Open source + Enterprise — multi-cloud
- Dynamic secrets (credentials éphémères DB)
- Leasing & renewal — durée de vie contrôlée
- Secret engines : AWS, Azure, GCP , DB, SSH, PKI
- Transit encryption — Vault as encryption-as-a-service
- Versionning des secrets (rollback possible)
- IAM intégré avec conditions fines
- Audit logs automatiques dans Cloud Audit Logs
- Réplication régionale ou globale configurable
- CMEK (Customer-Managed Encryption Keys)

## Gestion des secrets : les anti-patterns

Clés AWS_ACCESS_KEY en dur dans le code source : git history conserve tout, même après suppression du commit
Secrets dans les variables d'environnement non chiffrées : visibles dans les logs, les ps aux, les inspections Docker
Partage de credentials via Slack, email ou fichiers texte : non traçable, non révocable
Tokens de service non rotés depuis > 90 jours : fenêtre d'exploitation croissante en cas de compromission
Secrets partagés entre plusieurs services : impossible de déterminer qui a utilisé quoi en cas d'incident
Solution : detect-secrets / git-secrets / truffleHog comme pre-commit hooks + scan dans la CI/CD

## Attaques IAM : Privilege Escalation (MITRE ATT&CK T1098)

La technique Account Manipulation (T1098)  décrit les actions d'un attaquant visant à modifier un compte
existant afin de maintenir son accès ou d'obtenir davantage de privilèges. Cette technique est utilisée
principalement pour la persistance et l'élévation de privilèges.
Objectifs de l'attaquant :
- Maintenir un accès persistant
  - Ajouter ses propres identifiants
  - Modifier un mot de passe
  - Ajouter une clé SSH
  - Créer une méthode d'authentification alternative
- Augmenter ses privilèges
  - Ajouter un utilisateur à un groupe administrateur
  - Attribuer un rôle IAM privilégié
  - Accorder des permissions supplémentaires
  - Contourner les politiques de sécurité

## MITRE ATT&CK T1098 : Indicateurs de compromission & Mesures de

protection
Indicateurs de compromission Prévention Détection
- Création inhabituelle de clés
d'accès IAM
- Attribution de privilèges
administrateur
- Ajout d'utilisateurs à des groupes
sensibles
- Création de comptes de service
non autorisés
- Modification des rôles
Kubernetes RBAC
- Changement de permissions en
dehors des processus normaux
- Principe du moindre
privilège
- MFA obligatoire
- Contrôle des
changements IAM
- Revue périodique des
rôles et permissions
- Surveillance des événements
IAM
- Alertes sur les changements
de rôles
- Journalisation CloudTrail /
Entra Audit Logs / GCP Audit
Logs
- Détection des élévations de
privilèges

## Prêt pour lundi

Identifier tous les utilisateurs IAM sans MFA
aws iam get-account-summary && aws iam list-users | jq '.Users[].UserName' | xargs -I{} aws iam
list-mfa-devices --user-name {}
< 3 min / Gratuit / SCP préventive : aws iam list-virtual-mfa-devices pour visualiser l'exposition
Chercher les AdministratorAccess sur des rôles non-humains
aws iam list-entities-for-policy --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
< 2 min / Gratuit / Chaque rôle non-humain avec admin = bombe à retardement
Activer IMDSv2 sur toutes les instances EC2/Lambda
aws ec2 modify-instance-metadata-options --instance-id i-xxx --http-tokens required
--http-put-response-hop-limit 1
< 10 min / Gratuit · Bloque les attaques SSRF : metadata exploitation (T1552.005)

## LAB : IAM

dhdfhfgh

![Slide 142](/securite-cloud/06-identity-access-management/p142_02_Image29.jpg)

## QCM : Identity & Access

Management

![Slide 143](/securite-cloud/06-identity-access-management/p143_03_Image22.jpg)
