---
title: "06. Identity & Access Management (IAM)"
---

# 06. Identity & Access Management (IAM)

## Les fondamentaux de l’IAM cloud


| Authentification (AuthN) | Qui es-tu ? Vérification de l'identité (password, MFA, certificat,<br>biométrie) |
| --- | --- |
| Autorisation (AuthZ) | Que peux-tu faire ? Contrôle des permissions sur les ressources |
| 4 entités IAM AWS | Users (humains) · Groups (groupes d'users) · Roles (entités<br>assumables) · Policies (politiques JSON) |
| Concept de compte root | Le compte le plus “puissant” : NE JAMAIS l'utiliser au quotidien ·<br>MFA obligatoire · Verrouiller les clés root |
| IAM Cloud providers | AWS IAM · Azure AD (Entra ID) · Google Cloud IAM : concepts<br>similaires, syntaxes différentes |


## RBAC vs ABAC : Modèles de contrôle d'accès

Recommandation pratique : Commencer par RBAC puis ajouter des conditions ABAC pour les cas sensibles.

| RBAC : Role-Based Access Control | ABAC : Attribute-Based Access Control |
| --- | --- |
| •  Accès défini par le rôle de l'utilisateur<br>•  Ex: Admin, Developer, ReadOnly, Auditor<br>•  Simple à administrer et auditer<br>•  Utilisé par défaut : AWS IAM, Azure RBAC, GCP IAM<br>•  Moins flexible pour les cas d'usage complexes<br>•  Risque : rôle explosion avec le temps<br>•  Adapté à : 90% des organisations<br>•  Exemple AWS : rôle 'S3ReadOnly' → accès lecture S3 | •  Accès basé sur des ATTRIBUTS contextuels<br>•  Ex: dept=finance ET heure=bureau ET pays=FR<br>•  Granularité maximale et très flexible<br>•  Utilisé dans : AWS Cedar, OPA (Open Policy Agent)<br>•  Idéal pour architectures Zero Trust avancées<br>•  Plus complexe à configurer et déboguer<br>•  Adapté à : architectures multi-cloud complexes<br>•  Exemple : accès si tag:environment=prod ET<br>tag:team=security |


## Principe du moindre privilège (least privilege)

Définition : Chaque identité (user, service, rôle) ne doit avoir que les permissions strictement nécessaires à sa tâche ni
plus, jamais.

| Deny All par défaut | Just-In-Time (JIT) | Révision régulière |
| --- | --- | --- |
| Commencer par refuser tout accès,<br>puis accorder uniquement les<br>permissions requises. Ne jamais<br>partir d'un accès large et<br>restreindre. | Accès temporaires activés à la<br>demande pour une durée limitée.<br>Azure PIM, AWS SSO avec durée<br>limitée = réduction de la fenêtre<br>d'attaque. | Access reviews trimestrielles.<br>Supprimer les droits inutilisés depuis<br>>90 jours. IAM Access Analyzer<br>(AWS) ou Access Reviews (Azure<br>AD). |
| Analyse de l'usage réel | GCP IAM Recommender | Azure PIM (JIT) |
| AWS IAM Access Analyzer génère<br>des politiques 'minimum required'<br>basées sur l'usage CloudTrail des 90<br>derniers jours. | Machine learning analysant l'usage<br>réel pour détecter les rôles<br>surdimensionnés et proposer des<br>restrictions précises. | Accès privilégiés Just-In-Time avec<br>durée max configurée + approbation<br>manageur + MFA obligatoire à<br>l'activation. |


## Multi-Factor authentication : Types et bonnes pratiques


|  | Méthode MFA | Niveau de sécurité | Avantages | Risques / Limites |
| --- | --- | --- | --- | --- |
|  | SMS / Email OTP | Faible | Facile à déployer | SIM swapping, phishing,<br>man-in-the-middle |
|  | TOTP (Google Auth,<br>Authy) | Moyen | Gratuit, offline, portable | Phishable (si pas FIDO2), perte du<br>device |
|  | Push (Okta, Duo, MS<br>Auth) | Bon | UX simple, contexte de la<br>demande visible | MFA Fatigue attack possible si mal<br>configuré |
|  | Hardware FIDO2 /<br>Passkeys | Excellent | Résistant au phishing, lié au<br>domaine | Coût, perte clé = blocage, gestion<br>stock |
| Certificat client (mTLS) | Certificat client (mTLS) | Expert | Idéal pour service accounts,<br>automatisé | PKI complexe, rotation des certificats |


## AiTM (adversary-in-the-middle)


![Slide 115](/securite-cloud/06-identity-access-management/p115_00_Image41.jpg)


## MFA fatigue : Contourner le MFA sans jamais le craquer


![Slide 116](/securite-cloud/06-identity-access-management/p116_01_Image42.jpg)


## Vol de token de session cloud : Bypasser IAM sans MFA ni mot de



## Fédération d'identités

La fédération d'identité permet à une organisation d'utiliser une identité unique et de confiance pour authentifier ses
utilisateurs et leur donner accès de manière sécurisée à plusieurs applications, services cloud ou ressources externes.

| Avantages | Cas d'usage |
| --- | --- |
| Authentification centralisée | Accès à plusieurs applications via le SSO |
| Réduction du nombre de mots de passe | Accès aux fournisseurs cloud (AWS, Azure, GCP) |
| Gestion simplifiée des accès | Intégration avec des applications SaaS |
| Amélioration de l'expérience utilisateur | Collaboration entre organisations |
| Renforcement de la sécurité et de la conformité | Fédération entre partenaires, clients ou filiales |


## Authentication unique (SSO : Single sign-on)

Le Single Sign-On (SSO) permet à un utilisateur de s'authentifier une seule fois afin d'accéder de manière sécurisée à plusieurs
applications ou services, sans avoir à se reconnecter ni à gérer plusieurs mots de passe.

| Avantages | Bénéfices |
| --- | --- |
| Une seule authentification | Améliore l'expérience utilisateur |
| Moins de mots de passe | Réduit les risques liés aux mots de passe |
| Gestion centralisée | Simplifie l'administration des accès |
| Révocation unique | Désactive immédiatement l'accès à toutes les applications |
| MFA centralisé | Renforce la sécurité globale |
| Cas d'usage :<br>•  Accès aux environnements cloud (AWS, Azure, GCP)<br>•  Accès aux applications SaaS (Microsoft 365, Salesforce, Jira, ServiceNow)<br>•  Portails d'entreprise et intranets<br>•  Collaboration entre partenaires et filiales |  |


## Authentification unique (SSO : Single sign-on)


![Slide 122](/securite-cloud/06-identity-access-management/p122_02_Image44.jpg)


## SAML 2.0 : 

Security Assertion Markup Language


## SAML 2.0 : Security assertion markup language

Le Single Sign-On (SSO) permet à un utilisateur de s'authentifier une seule fois afin d'accéder de manière sécurisée à plusieurs
applications ou services, sans avoir à se reconnecter ni à gérer plusieurs mots de passe.


## Fonctionnement


![Slide 125](/securite-cloud/06-identity-access-management/p125_03_Image45.jpg)


## OAuth 2.0 : Délégation d'autorisation





![Slide 128](/securite-cloud/06-identity-access-management/p128_04_Image46.jpg)


## OpenID connect (OIDC) : Couche d'identité sur OAuth 2.0





![Slide 131](/securite-cloud/06-identity-access-management/p131_05_Image48.jpg)


## Workload identity federation





![Slide 134](/securite-cloud/06-identity-access-management/p134_06_Image49.jpg)


## Synthèse


| Concept | En quelques mots … |
| --- | --- |
| Fédération d'identité | Permet d'utiliser une identité existante pour accéder à des applications ou services externes. |
| SSO (Single Sign-On) | Se connecter une seule fois pour accéder à plusieurs applications. |
| OAuth 2.0 | Autoriser une application à accéder à une ressource sans partager le mot de passe de<br>l'utilisateur. |
| OIDC (OpenID Connect) | Permet à une application de vérifier l'identité d'un utilisateur de manière moderne et<br>sécurisée. |
| SAML | Standard historique permettant aux entreprises d'authentifier leurs utilisateurs sur des<br>applications externes. |
| Workload Identity<br>Federation | Permet à une application ou un pipeline d'accéder au cloud sans utiliser de secret ou de clé<br>stockée. |


## Gestion des secrets


|  | AWS Secrets Manager | Azure Key Vault |
| --- | --- | --- |
| • <br>• <br>• <br>• <br>• | Rotation automatique des secrets<br>Intégration native RDS, Redshift, DocumentDB<br>Audit complet via CloudTrail<br>Cross-account via Resource Policy<br>Coût : 0.40$/secret/mois + 0.05$/10K appels | •  Secrets + Clés + Certificats dans une seule solution<br>•  Backing HSM FIPS 140-2 Level 2/3 (Premium)<br>•  RBAC granulaire avec Azure AD<br>•  Soft-delete + Purge Protection obligatoires<br>•  Intégration App Service, AKS, VMSS native |
|  | HashiCorp Vault | GCP Secret Manager |
| • <br>• <br>• <br>• <br>• | Open source + Enterprise — multi-cloud<br>Dynamic secrets (credentials éphémères DB)<br>Leasing & renewal — durée de vie contrôlée<br>Secret engines : AWS, Azure, GCP, DB, SSH, PKI<br>Transit encryption — Vault as encryption-as-a-service | •  Versionning des secrets (rollback possible)<br>•  IAM intégré avec conditions fines<br>•  Audit logs automatiques dans Cloud Audit Logs<br>•  Réplication régionale ou globale configurable<br>•  CMEK (Customer-Managed Encryption Keys) |


## Gestion des secrets : Les anti-patterns


| Secrets dans les variables d'environnement non chiffrées : visibles dans les logs, les ps aux, les inspections Docker |
| --- |
| Partage de credentials via Slack, email ou fichiers texte : non traçable, non révocable |
| Tokens de service non rotés depuis > 90 jours : fenêtre d'exploitation croissante en cas de compromission |
| Secrets partagés entre plusieurs services : impossible de déterminer qui a utilisé quoi en cas d'incident |
| Solution : detect-secrets / git-secrets / truffleHog comme pre-commit hooks + scan dans la CI/CD |


## Attaques IAM : Privilege escalation (MITRE ATT&CK t1098)



## MITRE ATT&CK t1098 : Indicateurs de compromission & mesures de

protection

| Indicateurs de compromission | Prévention | Détection |
| --- | --- | --- |
| •  Création inhabituelle de clés<br>d'accès IAM<br>•  Attribution de privilèges<br>administrateur<br>•  Ajout d'utilisateurs à des groupes<br>sensibles<br>•  Création de comptes de service<br>non autorisés<br>•  Modification des rôles<br>Kubernetes RBAC<br>•  Changement de permissions en<br>dehors des processus normaux | •  Principe du moindre<br>privilège<br>•  MFA obligatoire<br>•  Contrôle des<br>changements IAM<br>•  Revue périodique des<br>rôles et permissions | •  Surveillance des événements<br>IAM<br>•  Alertes sur les changements<br>de rôles<br>•  Journalisation CloudTrail /<br>Entra Audit Logs / GCP Audit<br>Logs<br>•  Détection des élévations de<br>privilèges |


## Prêt pour lundi

| # | Action | Commande | Durée / Coût | Impact |
| --- | --- | --- | --- | --- |
| 1 | Identifier tous les utilisateurs IAM sans MFA | `aws iam get-account-summary && aws iam list-users | jq '.Users[].UserName' | xargs -I{} aws iam list-mfa-devices --user-name {}` | 3 min / Gratuit | SCP préventive : aws iam list-virtual-mfa-devices pour visualiser l'exposition |
| 2 | Chercher les AdministratorAccess sur des rôles non-humains | `aws iam list-entities-for-policy --policy-arn arn:aws:iam::aws:policy/AdministratorAccess` | 2 min / Gratuit | Chaque rôle non-humain avec admin = bombe à retardement |
| 3 | Activer IMDSv2 sur toutes les instances EC2/Lambda | `aws ec2 modify-instance-metadata-options --instance-id i-xxx --http-tokens required --http-put-response-hop-limit 1` | 10 min / Gratuit | Bloque les attaques SSRF : metadata exploitation (T1552.005) |
