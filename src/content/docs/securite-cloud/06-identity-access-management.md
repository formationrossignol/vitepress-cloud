---
title: "03. Identity & Access Management"
---

# 03. Identity & Access Management

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


## AiTM (adversary-in-the-Middle)

Une attaque AiTM (Adversary-in-the-Middle) intercepte la session entre l'utilisateur et le service légitime afin de voler les identifiants, le jeton de session ou le cookie d'authentification, ce qui peut permettre à l'attaquant de contourner le MFA sans avoir besoin de le casser.

![Slide 67](/securite-cloud/06-identity-access-management/p067_v37_Image33.jpg)


## MFA fatigue : Contourner le MFA sans jamais le craquer

Le MFA fatigue consiste à bombarder un utilisateur de demandes d'authentification jusqu'à ce qu'il en valide une par lassitude, distraction ou erreur, permettant ainsi à l'attaquant de contourner une protection MFA pourtant activée.

![Slide 68](/securite-cloud/06-identity-access-management/p068_v37_Image34.jpg)


## Vol de token de session cloud : Bypasser IAM sans MFA ni mot de passe

Une fois authentifié, l'attaquant n'a plus besoin de vos credentials. Il lui suffit de voler votre token de session AWS/Azure. Durée de vie : jusqu'à 12 heures.

| Cookie Session Hijacking (Browser) | STS Token Theft (API Access) |
| --- | --- |
| ● Comment : Vol du cookie de session AWS Console via XSS, malware, ou AiTM proxy. Le cookie contient un JWT valide.<br>● Impact : Accès AWS Console complet pour toute la durée de validité du cookie (8h par défaut).<br>● Détection : CloudTrail : ConsoleLogin depuis IP inhabituelle APRÈS une session légitime.<br>● Remède : ForceDestroyingSessions IAM · Conditional Access par IP · Session revocation API | ● Comment : Credentials temporaires STS volés depuis une Lambda, une instance EC2 (metadata), ou un pipeline CI/CD.<br>● Impact : `aws configure --profile stolen` puis accès API complet jusqu'à expiration (max 12h).<br>● Détection : Même AssumeRole utilisé depuis 2 IPs différentes → impossible travel.<br>● Remède : Conditions IAM `aws:SourceIp` · IMDSv2 obligatoire · STS session revocation |


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


## SAML 2.0 : Security Assertion Markup Language

SAML 2.0 (Security Assertion Markup Language) est un standard XML permettant d'échanger des informations d'authentification et d'autorisation entre un fournisseur d'identité (IdP) et un fournisseur de service (SP).

| Rôle | Description |
| --- | --- |
| Fournisseur d'identité | Authentifie l'utilisateur et émet l'assertion SAML |
| Fournisseur de service | Application qui reçoit l'assertion et donne l'accès |
| Usage principal | SSO entreprise vers applications SaaS ou cloud |

Cas d'usage :
- SSO entreprise : accès à Salesforce, ServiceNow, Microsoft 365
- Fournisseur de cloud : connexion fédérée à AWS, Azure ou GCP
- Partenaires : accès inter-entreprises sans créer de comptes locaux
- Gestion centralisée : départ d'un collaborateur = révocation côté fournisseur d'identité


## L'assertion SAML 2.0

L'assertion SAML est une preuve XML signée : elle indique qui est l'utilisateur, qui l'a authentifié, pour quelle application et avec quels attributs.

| Extrait de code XML | Explication |
| --- | --- |
| `<saml:Issuer>https://idp.entreprise.com</saml:Issuer>` | Qui émet l'assertion : le fournisseur d'identité (Azure AD, Okta, Keycloak…) |
| `<saml:NameID>alice@entreprise.com</saml:NameID>` | Qui est l'utilisateur : l'identité principale transmise à l'application |
| `<saml:Conditions NotOnOrAfter="10:20Z">` | Quand l'assertion est valide : durée courte pour limiter le risque de réutilisation |
| `<saml:Audience>https://app.example.com</saml:Audience>` | Pour quelle application : l'assertion ne doit être acceptée que par ce fournisseur de service |
| `<saml:AuthnStatement AuthnInstant="10:14Z" />` | Preuve d'authentification : indique que l'utilisateur a bien été authentifié par l'IdP |
| `<saml:Attribute Name="role">cloud-security-admin</saml:Attribute>` | Attributs transmis : rôle, groupe, email ou autre information utilisée pour autoriser l'accès |


## Fonctionnement


![Slide 125](/securite-cloud/06-identity-access-management/p125_03_Image45.jpg)


## OAuth 2.0 : Délégation d'autorisation

OAuth 2.0 permet à une application d'accéder à une ressource au nom d'un utilisateur, sans connaître son mot de passe.

| Élément | Description |
| --- | --- |
| Type | Framework d'autorisation permettant à une application d'obtenir un accès limité à une ressource protégée |
| Format | Jetons d'accès, souvent de type Bearer (le format exact du jeton n'est pas imposé par OAuth 2.0) |
| Propriétaire de la ressource | Utilisateur ou entité qui possède les données ou ressources protégées |
| Client | Application qui demande l'accès à une ressource au nom de l'utilisateur |
| Serveur d'autorisation | Authentifie l'utilisateur, recueille son consentement et émet les jetons |
| Serveur de ressources | API ou service qui héberge les ressources protégées et valide le jeton d'accès |
| Usage principal | Autoriser une application tierce à accéder à une API sans partager le mot de passe de l'utilisateur |
| Cas d'usage | ● Accès API délégué : Une application accède aux données d'un utilisateur avec son accord<br>● Applications mobiles ou web : Connexion à une API via un jeton d'accès limité<br>● CI/CD cloud : Un pipeline accède à des ressources cloud via un jeton à portée limitée |


![Slide 79](/securite-cloud/06-identity-access-management/p079_v37_Image35.jpg)


## OpenID connect (OIDC) : Couche d'identité sur OAuth 2.0

| Élément | Description |
| --- | --- |
| Format | Jetons OAuth 2.0 + ID Token, généralement au format JWT |
| Utilisateur final | Personne dont l'identité doit être vérifiée |
| Client | Application qui souhaite authentifier l'utilisateur |
| Fournisseur d'identité | Service qui authentifie l'utilisateur et émet les jetons OIDC |
| ID Token | Jeton contenant des informations d'identité vérifiables sur l'utilisateur |
| Access Token | Jeton permettant d'accéder à une API ou à une ressource protégée |
| UserInfo Endpoint | Point d'accès permettant de récupérer des informations complémentaires sur l'utilisateur |
| Usage principal | Authentifier un utilisateur et transmettre son identité à une application |
| Cas d'usage | ● SSO moderne : Connexion à une application web avec un fournisseur d'identité centralisé<br>● Connexion sociale : "Se connecter avec Google", Microsoft, Apple ou GitHub<br>● Fédération cloud : Accès à AWS/Azure/GCP avec une identité d'entreprise via OIDC |


![Slide 82](/securite-cloud/06-identity-access-management/p082_v37_Image35.jpg)


## Workload Identity Federation

| Élément | Description |
| --- | --- |
| Type | Mécanisme de fédération d'identité pour workloads, services, pipelines CI/CD, conteneurs, VM ou scripts |
| Format | Jetons courts ou assertions émises par un fournisseur d'identité externe, souvent via OIDC ou équivalent |
| Workload | Charge de travail non humaine qui doit accéder à une ressource cloud ou à une API |
| Fournisseur d'identité | Système qui atteste l'identité du workload : plateforme CI/CD, cluster Kubernetes, autre cloud, IdP d'entreprise |
| Fournisseur cloud | Plateforme qui fait confiance à l'identité externe et échange cette identité contre des permissions temporaires |
| Jetons temporaires | Identifiants à durée limitée permettant d'accéder aux ressources sans clé statique longue durée |
| Relation de confiance | Configuration qui définit quels workloads externes sont autorisés à obtenir quels droits |
| Usage principal | Permettre à un workload externe d'accéder à des ressources cloud sans stocker de secret ou de clé de service longue durée |

Cas d'usage :
- **CI/CD sans secret statique** : Un pipeline GitHub Actions, GitLab CI ou Azure DevOps accède au cloud sans stocker de clé longue durée
- **Kubernetes vers un fournisseur de cloud** : Un pod ou service Kubernetes obtient une identité fédérée pour appeler des API cloud
- **Multicloud** : Une VM ou un service AWS/Azure/GCP accède à un autre cloud via une relation de confiance
- **Workloads on-premise** : Un service interne accède à des ressources cloud sans compte local permanent

![Slide 85](/securite-cloud/06-identity-access-management/p085_v37_Image35.jpg)


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

La technique Account Manipulation (T1098) décrit les actions d'un attaquant visant à modifier un compte existant afin de maintenir son accès ou d'obtenir davantage de privilèges. Cette technique est utilisée principalement pour la persistance et l'élévation de privilèges.

Objectifs de l'attaquant :
- Maintenir un accès persistant : ajouter ses propres identifiants, modifier un mot de passe, ajouter une clé SSH, créer une méthode d'authentification alternative
- Augmenter ses privilèges : ajouter un utilisateur à un groupe administrateur, modifier une policy IAM, attacher un rôle avec plus de droits

## MITRE ATT&CK t1098 : Indicateurs de compromission & mesures de protection

| Indicateurs de compromission | Prévention | Détection |
| --- | --- | --- |
| •  Création inhabituelle de clés<br>d'accès IAM<br>•  Attribution de privilèges<br>administrateur<br>•  Ajout d'utilisateurs à des groupes<br>sensibles<br>•  Création de comptes de service<br>non autorisés<br>•  Modification des rôles<br>Kubernetes RBAC<br>•  Changement de permissions en<br>dehors des processus normaux | •  Principe du moindre<br>privilège<br>•  MFA obligatoire<br>•  Contrôle des<br>changements IAM<br>•  Revue périodique des<br>rôles et permissions | •  Surveillance des événements<br>IAM<br>•  Alertes sur les changements<br>de rôles<br>•  Journalisation CloudTrail /<br>Entra Audit Logs / GCP Audit<br>Logs<br>•  Détection des élévations de<br>privilèges |


## Prêt pour lundi

| # | Action | Commande | Durée / Coût | Impact |
| --- | --- | --- | --- | --- |
| 1 | Identifier tous les utilisateurs IAM sans MFA | `aws iam get-account-summary && aws iam list-users | jq '.Users[].UserName' | xargs -I{} aws iam list-mfa-devices --user-name {}` | 3 min / Gratuit | SCP préventive : aws iam list-virtual-mfa-devices pour visualiser l'exposition |
| 2 | Chercher les AdministratorAccess sur des rôles non-humains | `aws iam list-entities-for-policy --policy-arn arn:aws:iam::aws:policy/AdministratorAccess` | 2 min / Gratuit | Chaque rôle non-humain avec admin = bombe à retardement |
| 3 | Activer IMDSv2 sur toutes les instances EC2/Lambda | `aws ec2 modify-instance-metadata-options --instance-id i-xxx --http-tokens required --http-put-response-hop-limit 1` | 10 min / Gratuit | Bloque les attaques SSRF : metadata exploitation (T1552.005) |
