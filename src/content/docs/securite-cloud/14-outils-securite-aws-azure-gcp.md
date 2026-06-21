---
title: "11. Outils de sécurité : AWS, Azure et GCP"
---

# 11. Outils de sécurité : AWS, Azure et GCP

## Identité & accès


| AWS | Azure | GCP |  |
| --- | --- | --- | --- |
| IAM Identity Center | Microsoft Entra ID | Identity Platform | Authentification centralisée (SSO) |
| Cognito | External ID / B2C | Identity Platform | Gestion des identités clients<br>(CIAM) |
| IAM Access Analyzer | Entra Permissions<br>Management | Privileged Access Manager | Analyse et réduction des<br>permissions excessives |
| Verified Permissions | Permissions<br>Management | IAM Conditions | Contrôle fin des autorisations |


| AWS | Azure | GCP | Rôle |
| --- | --- | --- | --- |
| WAF | Front Door WAF | Cloud Armor | Protection des applications web |
| Shield Advanced | DDoS Protection | Cloud Armor Enterprise | Protection contre les attaques DDoS |
| Network Firewall | Azure Firewall | Cloud Firewall | Filtrage du trafic réseau |
| Firewall Manager | Azure Firewall Manager | Firewall Policies | Administration centralisée des<br>pare-feu |
| PrivateLink | Private Link | Private Service Connect | Accès privé aux services |
| Systems Manager<br>Session Manager | Azure Bastion | IAP TCP Forwarding | Administration sécurisée sans<br>exposition SSH/RDP |
| Verified Access | Global Secure Access | BeyondCorp Enterprise | Accès Zero Trust |
| Route 53 DNS Firewall | Azure DNS Private<br>Resolver | Cloud DNS + Policy | Protection et contrôle DNS |


## Protection des données


| AWS | Azure | GCP | Rôle |
| --- | --- | --- | --- |
| KMS | Key Vault | Cloud KMS | Gestion des clés de chiffrement |
| Secrets Manager | Key Vault | Secret Manager | Stockage sécurisé des secrets |
| CloudHSM | Managed HSM | Cloud HSM | Gestion des clés dans un HSM dédié |
| Macie | Microsoft Purview | Sensitive Data<br>Protection | Découverte et protection des données<br>sensibles |
| Backup | Azure Backup | Backup & DR | Sauvegarde et reprise après incident |




| AWS | Azure | GCP | Rôle |
| --- | --- | --- | --- |
| GuardDuty | Microsoft Sentinel | Event Threat Detection | Détection des menaces |
| Detective | Microsoft Sentinel<br>Investigation | Google SecOps | Investigation des incidents |
| Security Hub | Defender for Cloud | Security Command Center | Centralisation des alertes sécurité |
| CloudTrail | Activity Logs | Cloud Audit Logs | Journalisation des actions et audits |
| CloudWatch | Azure Monitor | Cloud Monitoring | Supervision et observabilité |
| Security Lake | Microsoft Sentinel Data Lake | Google SecOps Data<br>Platform | Centralisation des données de<br>sécurité |


## Sécurité des charges de travail


| AWS | Azure | GCP | Rôle |
| --- | --- | --- | --- |
| Inspector | Defender for<br>Cloud | Artifact Analysis | Analyse des vulnérabilités |
| ECR Scan | Defender for<br>Containers | Artifact Analysis | Scan des images de conteneurs |
| GuardDuty Runtime Monitoring | Defender for<br>Containers | Container Threat<br>Detection | Détection des comportements<br>malveillants en exécution |


## Gouvernance & conformité


| AWS | Azure | GCP | Rôle |
| --- | --- | --- | --- |
| Organizations | Management Groups | Organization Policies | Gouvernance multi-comptes / multi-projets |
| Control Tower | Landing Zones | Assured Workloads | Mise en place d'environnements sécurisés |
| Config | Azure Policy | Organization Policy<br>Service | Contrôle et application des règles de conformité |
| Audit Manager | Compliance Manager | Assured Workloads | Pilotage de la conformité réglementaire |


## Panorama des services de sécurité AWS


| Identité | Réseau | Données |
| --- | --- | --- |
| IAM<br>Identity Center<br>Organizations<br>MFA<br>STS<br>Verified Permissions<br>Cognito<br>IAM Access Analyzer | Groupe de sécurité<br>NACLs<br>WAF<br>Shield<br>Network Firewall<br>Firewall Manager<br>Route 53 Resolver DNS Firewall | KMS<br>Secrets Manager<br>CloudHSM<br>Macie<br>Backup<br>Amazon Security Lake |
| Charge de travail | Détection | Gourvernance |
| Inspector<br>ECR Scan<br>Systems Manager<br>Sécurité réseau dans EKS | GuardDuty<br>Security Hub<br>Detective<br>EventBridge<br>CloudWatch<br>AWS Health / Incident Detection | Config<br>Audit Manager<br>Organizations<br>Control Tower<br>Trusted Advisor<br>Artifact |


## AWS GuardDuty

- Détection intelligente des menaces pour protéger le compte AWS.
- Utilise des algorithmes de machine learning, détection d'anomalies, des données tierces.
- Un clic pour activer (essai de 30 jours), pas besoin d'installer de logiciel.
- Les données d'entrée :
  - Journaux d'événements CloudTrail : appels d'API inhabituels, déploiements non autorisés :
    - Événements de gestion CloudTrail : créer un sous-réseau VPC, créer un suivi, etc.
    - Événements de données CloudTrail S3 : obtenir un objet, lister des objets, supprimer un objet, etc.
  - Journaux de flux VPC : trafic interne inhabituel, adresse IP inhabituelle.
  - Journaux DNS : instances EC2 compromises envoyant des données codées dans les requêtes DNS.
  - Journaux d'audit Kubernetes : activités suspectes et compromis potentiels de cluster EKS.
- Les alertes de sécurité (findings) GuardDuty peuvent être routées via Amazon EventBridge vers AWS Lambda, Amazon SNS ou AWS Security Hub.


![Slide 308](/securite-cloud/14-outils-securite-aws-azure-gcp/p308_00_Image84.jpg)


## AWS Security Hub : Agrégateur central de sécurité

- AWS Security Hub est un service AWS permettant de centraliser, corréler et prioriser les alertes de sécurité
provenant des services AWS, des comptes cloud et des outils tiers.
- Agrège les alertes de sécurité de : GuardDuty / Inspector / Macie / IAM Access Analyzer
- Standards de conformité intégrés :
  - CIS AWS Foundations v2 · AWS Foundational Security Best Practices · PCI-DSS v3.2.1
  - Security Score global de 0 à 100 — évolue en temps réel
  - Custom Actions : envoyer findings vers Lambda · SNS · EventBridge
  - Cross-account aggregation : vue unifiée de toute l'organization
- Il agit comme un point central de visibilité pour la posture de sécurité AWS.




![Slide 310](/securite-cloud/14-outils-securite-aws-azure-gcp/p310_01_Image85.jpg)


## Amazon Inspector

- Amazon Inspector est un service de gestion des vulnérabilités :
  - Analyse automatiquement les workloads AWS.
  - Détecte les vulnérabilités logicielles et les expositions réseau involontaires.
- Scanne notamment :
  - Instances EC2.
  - Images de conteneurs ECR.
  - Fonctions Lambda.
- Produit des résultats de détection avec un niveau de sévérité.
- Aide à prioriser les corrections grâce à un score de risque.
- S’intègre avec AWS Security Hub et Amazon EventBridge.
- Service managé et automatisé.
- En résumé : Amazon Inspector identifie les vulnérabilités sur les workloads AWS pour aider
à prioriser les remédiations.




![Slide 312](/securite-cloud/14-outils-securite-aws-azure-gcp/p312_02_Image86.jpg)


## AWS Network Firewall

- AWS Network Firewall est un service de pare-feu réseau managé pour les VPC :
  - Permet de filtrer le trafic entrant, sortant et entre VPC.
  - Fonctionne avec des règles stateless et stateful.
  - Aide à bloquer les flux non autorisés ou suspects.
  - Peut inspecter le trafic avec des capacités IDS/IPS.
  - S’intègre avec AWS Firewall Manager pour une gestion centralisée.
  - Service managé, scalable et hautement disponible.
- Cas d’usage :
  - Contrôler le trafic entre sous-réseaux ou VPC.
  - Filtrer le trafic sortant vers Internet.
  - Bloquer des domaines, IP ou protocoles non autorisés.
  - Renforcer la sécurité réseau dans une architecture multi-comptes.
- En résumé : AWS Network Firewall protège le trafic réseau des VPC avec des règles de
pare-feu avancées, au-delà des Security Groups et des NACL (liste de contrôle d'accès
réseau).




![Slide 314](/securite-cloud/14-outils-securite-aws-azure-gcp/p314_03_Image87.jpg)


## AWS CloudTrail Lake : Analyse et investigation des journaux

- Service AWS managé permettant de centraliser, conserver et interroger les événements CloudTrail via SQL, sans infrastructure Athena, S3 ou Glue à administrer.
- Fonctionnalités clés :
  - Requêtes SQL natives : Interrogation directe des événements CloudTrail avec SQL standard
    ```sql
    SELECT eventTime, eventName, userIdentity.arn, sourceIPAddress
    FROM my_event_data_store
    WHERE eventName = 'DeleteBucket';
    ```
  - Rétention longue durée : Conservation configurable des journaux de 90 jours à 7 ans avec accès immédiat aux données historiques.
  - Intégration native AWS : Compatible avec AWS Organizations, AWS Config et CloudTrail Insights pour une visibilité centralisée.
  - Détection d'anomalies : CloudTrail Insights identifie automatiquement les comportements inhabituels et les pics d'activité API.
  - Investigation et analyse forensique : Recherche rapide des actions réalisées par un utilisateur IAM, un rôle ou une adresse IP sur plusieurs mois ou années.


## AWS CloudTrail Lake : Fonctionnement


![Slide 281](/securite-cloud/14-outils-securite-aws-azure-gcp/p281_v37_Image92.jpg)


## IAM Identity Center

- Service AWS pour centraliser les accès des utilisateurs.
- Permet le SSO (Single Sign-On) vers plusieurs comptes AWS et applications.
- Peut se connecter à un fournisseur d'identité existant :
  - Microsoft Entra ID.
  - Okta.
  - Google Workspace.
  - Active Directory.
- Permet d'attribuer des accès par utilisateur ou groupe.
- Utilise des permission sets pour définir les droits dans les comptes AWS.
- Réduit le besoin de créer des utilisateurs IAM dans chaque compte.
- Adapté aux environnements multi-comptes avec AWS Organizations.
- Améliore la gouvernance, l'audit et l'application du moindre privilège.
- En résumé :
  - IAM Identity Center centralise les accès humains aux comptes AWS.
  - IAM reste utilisé pour gérer les permissions, rôles et politiques AWS.


![Slide 318](/securite-cloud/14-outils-securite-aws-azure-gcp/p318_05_Image89.jpg)


## Panorama des services de sécurité Azure


| Identité | Réseau | Données |
| --- | --- | --- |
| Microsoft Entra ID<br>Conditional Access<br>PIM (Privileged Identity Management)<br>Identity Protection<br>MFA<br>Microsoft Entra Permissions Management<br>Defender for Identity | NSG (groupe de sécurité réseau)<br>Azure Firewall<br>DDoS Protection<br>Private Link<br>Front Door WAF<br>Application Gateway WAF<br>Azure Bastion | Key Vault<br>Purview<br>Information Protection<br>Managed HSM<br>Backup<br>Defender for Storage<br>Defender for SQL |
| Charge de travail | Détection | Gourvernance |
| Defender for Cloud<br>AKS Security<br>Container Registry<br>VM Protection<br>App Service Security | Microsoft Sentinel<br>Defender XDR<br>Monitor<br>Log Analytics<br>Defender for Cloud<br>Defender for Cloud Apps<br>Defender Threat Intelligence | Azure Policy<br>Blueprints<br>Landing Zones<br>Groupes d'administration<br>Cost Management<br>Microsoft Priva<br>Compliance Manager |


## Microsoft Defender for Cloud

Microsoft Defender for Cloud est la plateforme CNAPP de Microsoft Azure, combinant CSPM, protection des workloads et sécurité DevOps pour renforcer la posture de sécurité des environnements cloud, hybrides et multicloud.

| Capacité Defender for Cloud | Contribution sécurité |
| --- | --- |
| Gestion de posture (CSPM) | Identifie les mauvaises configurations et évalue en continu le niveau de sécurité des ressources cloud. |
| Secure Score | Mesure l'exposition au risque et fournit des recommandations de remédiation priorisées. |
| Protection des workloads (CWPP) | Protège les VM, conteneurs, bases de données, stockages et services PaaS contre les menaces. |
| Analyse des vulnérabilités | Détecte les vulnérabilités des systèmes, conteneurs et dépendances logicielles. |
| Protection Kubernetes | Surveille les clusters Kubernetes et détecte les comportements anormaux ou malveillants. |
| Sécurité DevOps | Analyse les dépôts Git, pipelines CI/CD et configurations IaC afin d'identifier les risques en amont. |
| Détection des menaces | Génère des alertes de sécurité basées sur les signaux collectés et les modèles d'analyse Microsoft. |
| Attack Path Analysis | Identifie les chemins d'attaque potentiels exploitables par un attaquant. |
| Multicloud et hybride | Couvre AWS, GCP et les environnements on-premise en plus d'Azure. |
| Conformité réglementaire | Évalue le respect des référentiels tels que ISO 27001, PCI-DSS, SOC 2 et RGPD. |


## Microsoft Entra ID : Identité et accès Zero Trust

Microsoft Entra ID est le socle d'identité Zero Trust de Microsoft : il centralise les accès, applique le MFA, le conditionnel et le moindre privilège.

| Capacité Microsoft Entra ID | Contribution sécurité |
| --- | --- |
| Gestion des identités | Centralise les utilisateurs, groupes, applications et comptes de service. |
| SSO | Permet un accès unifié aux applications cloud, SaaS et internes. |
| MFA | Renforce l'authentification avec un second facteur. |
| Accès conditionnel | Adapte l'accès selon l'utilisateur, l'appareil, la localisation, le risque et le contexte. |
| Zero Trust | Vérifie explicitement chaque demande d'accès avant d'autoriser l'utilisateur. |
| Protection des identités | Détecte les connexions suspectes et les comptes à risque. |
| Moindre privilège | Limite les droits via les rôles, groupes et accès temporaires. |
| Gouvernance des accès | Encadre les revues d'accès, les droits invités et le cycle de vie des identités. |


## Microsoft Entra ID : Exemples de politiques d'accès conditionnel

L'accès conditionnel applique les principes Zero Trust en adaptant dynamiquement les contrôles d'accès selon l'identité, le contexte, le niveau de risque et l'état de l'appareil.

| Politique d'accès conditionnel | Signal analysé | Action appliquée | Priorité |
| --- | --- | --- | --- |
| MFA obligatoire pour les administrateurs | Utilisateur membre d'un rôle privilégié (Global Admin, Security Admin…) | Exiger une authentification multifacteur forte (FIDO2 recommandé) | Critique |
| Blocage des authentifications héritées | Utilisation de protocoles legacy (IMAP, POP3, SMTP Auth, ActiveSync…) | Refuser la connexion | Élevée |
| Appareil conforme obligatoire | Accès à Microsoft 365 depuis un terminal non géré ou non conforme | Autoriser uniquement les appareils conformes Intune | Élevée |
| Blocage des utilisateurs à risque élevé | Niveau de risque utilisateur élevé détecté par Identity Protection | Bloquer l'accès jusqu'à remédiation | Critique |
| MFA renforcé sur connexion à risque | Connexion inhabituelle ou niveau de risque de connexion moyen/élevé | Exiger une authentification supplémentaire | Élevée |
| Accès limité pour les utilisateurs invités | Utilisateur externe B2B | Limiter l'accès aux applications autorisées et imposer le MFA | Moyenne |


## Microsoft Purview

Microsoft Purview permet de découvrir, classifier, protéger et gouverner les données sensibles afin de réduire les risques de fuite, de perte ou de non-conformité.

| Capacité Microsoft Purview | Contribution sécurité |
| --- | --- |
| Découverte des données | Identifie automatiquement les données présentes dans les environnements cloud, SaaS et on-premise. |
| Classification | Détecte et étiquette les données sensibles (RGPD, données financières, santé, secrets, etc.). |
| Protection de l'information | Applique des labels de sensibilité, du chiffrement et des restrictions d'usage. |
| Data Loss Prevention (DLP) | Empêche le partage ou l'exfiltration de données sensibles. |
| Gouvernance des données | Cartographie les données, leurs propriétaires et leurs flux de circulation. |
| Gestion des risques internes | Détecte les comportements pouvant entraîner une fuite de données ou une violation de conformité. |
| eDiscovery & Audit | Facilite les enquêtes, audits et investigations réglementaires. |
| Conformité | Aide à répondre aux exigences réglementaires telles que RGPD, ISO 27001, NIS2 ou PCI-DSS. |


## Panorama des services de sécurité GCP

| Identité | Réseau | Données |
| --- | --- | --- |
| Cloud IAM<br>Identity Platform<br>IAM Conditions<br>Workload Identity Federation<br>MFA<br>Cloud Identity<br>Privileged Access Manager<br>Access Context Manager | Cloud Firewall<br>Cloud Armor<br>VPC Service Controls<br>Cloud IDS<br>Private Service Connect<br>reCAPTCHA Enterprise, Certificate Authority<br>Service | Cloud KMS<br>Secret Manager<br>Sensitive Data Protection<br>External Key Manager<br>Backup & DR |
| Charge de travail | Détection | Gourvernance |
| Security Command<br>Center<br>GKE Security<br>Artifact Analysis<br>Binary Authorization<br>VM Manager<br>Container Threat Detection<br>GKE Enterprise security posture | Security Command<br>Security Operations (SecOps)<br>Center<br>Event Threat<br>Detection<br>Cloud Logging<br>Cloud Monitoring<br>Mandiant Threat Intelligence<br>Cloud Audit Logs | Organization Policies<br>Resource Manager<br>Assured Workloads<br>Policy Controller<br>Security Health Analytics<br>Cloud Asset Inventory<br>Risk Manager<br>Cloud Compliance<br>Access Transparency |



## Security Command Center

Security Command Center est le CSPM natif de Google Cloud, conçu pour centraliser la visibilité, détecter les mauvaises configurations et prioriser les risques de sécurité des environnements GCP.

| Capacité Security Command Center | Contribution sécurité |
| --- | --- |
| Vision unifiée | Centralise les alertes, vulnérabilités, mauvaises configurations et menaces dans une console unique. |
| Gestion de posture (CSPM) | Détecte les erreurs de configuration, les ressources exposées et les écarts par rapport aux bonnes pratiques. |
| Détection des menaces | Identifie les comportements suspects, compromissions de comptes et activités malveillantes. |
| Gestion des vulnérabilités | Analyse les VM, conteneurs et workloads afin d'identifier les vulnérabilités exploitables. |
| Priorisation des risques | Corrèle les informations de sécurité pour mettre en avant les risques les plus critiques. |
| Conformité | Aide à évaluer le respect des référentiels de sécurité et des exigences réglementaires. |
| Intégration native GCP | S'appuie sur les services Google Cloud tels que Cloud Asset Inventory, Event Threat Detection et Container Scanning. |
| Remédiation | Facilite l'investigation et l'application des actions correctives sur les ressources concernées. |


## Google Security Operations (SecOps)

Google Security Operations (SecOps) est la plateforme SIEM/SOAR de Google Cloud. Elle centralise les événements de sécurité, détecte les comportements malveillants, facilite les investigations et automatise la réponse aux incidents.

| Capacité SecOps | Contribution sécurité |
| --- | --- |
| Collecte centralisée | Agrège les logs, alertes et événements provenant du cloud, du réseau, des endpoints et des applications. |
| Détection avancée | Identifie les comportements suspects grâce aux règles de détection, à l'analyse comportementale et à l'IA. |
| Threat Intelligence | Enrichit les alertes avec les renseignements de Google Threat Intelligence et Mandiant. |
| Threat Hunting | Permet aux analystes de rechercher proactivement des indicateurs de compromission dans l'ensemble des données collectées. |
| Investigation | Corrèle les événements et reconstitue la chronologie des attaques pour accélérer l'analyse. |
| SOAR | Automatise les workflows de réponse, la qualification des alertes et les actions de remédiation. |
| Visibilité unifiée | Fournit une vue centralisée des menaces, incidents et activités de sécurité. |
| Pilotage SOC | Réduit les temps de détection (MTTD) et de réponse (MTTR) aux incidents. |


## GCP Cloud Armor

Google Cloud Armor protège les applications exposées contre les attaques DDoS et les attaques applicatives comme XSS ou SQL injection, via des politiques de sécurité appliquées au niveau des load balancers.

| Capacité Cloud Armor | Contribution sécurité |
| --- | --- |
| Protection DDoS | Absorbe et filtre les attaques volumétriques avant qu'elles n'atteignent les workloads. |
| WAF managé | Utilise des règles préconfigurées contre les risques applicatifs courants, dont l'OWASP Top 10. |
| Règles personnalisées | Autorise, bloque ou limite le trafic selon IP, géolocalisation, en-têtes ou attributs de requête. |
| Rate limiting | Réduit les abus, le scraping et les pics de requêtes anormaux. |
| Adaptive Protection | Détecte les attaques L7 avec des modèles ML et suggère des règles de mitigation. |
| Observabilité | Expose les décisions de filtrage dans Cloud Logging et Cloud Monitoring. |


## IAM Recommender

IAM Recommender analyse l'usage réel des permissions IAM et propose de supprimer ou réduire les rôles trop permissifs.

| Capacité IAM Recommender | Contribution sécurité |
| --- | --- |
| Analyse d'usage IAM | Observe les permissions réellement utilisées par les utilisateurs, groupes et comptes de service. |
| Détection des excès | Identifie les rôles trop larges ou inutilisés. |
| Moindre privilège | Recommande des rôles plus précis ou la suppression de droits inutiles. |
| Réduction du risque | Limite l'impact potentiel d'un compte compromis. |
| Aide à la remédiation | Propose des actions concrètes pour ajuster les accès. |


## Comparatif : Quel outil pour quel besoin ?


| Besoin | AWS natif | Azure natif | GCP natif | Tiers |
| --- | --- | --- | --- | --- |
| CSPM, posture<br>management | Security Hub CSPM + Config | Defender for Cloud | Security Command Center | Wiz / Prisma Cloud /<br>Orca |
| CWPP, protection<br>workloads | GuardDuty + Inspector | Defender for Servers /<br>Containers | Security Command Center + Container<br>Threat Detection | Lacework / Aqua /<br>Sysdig |
| SIEM / centralisation<br>sécurité | Security Lake + CloudWatch +<br>OpenSearch | Microsoft Sentinel | Google SecOps / Chronicle | Splunk / Elastic |
| Secrets management | Secrets Manager + KMS | Key Vault | Secret Manager + Cloud KMS | HashiCorp Vault |
| Scan images conteneurs | ECR + Inspector | ACR + Defender | Artifact Analysis | Trivy / Aqua / Sysdig |
| DLP / données sensibles | Macie, surtout S3 | Microsoft Purview | Sensitive Data Protection | Varonis / Symantec /<br>BigID |
| Multi-cloud unifié | AWS seulement | Defender avec add-on<br>AWS/GCP | SCC surtout GCP | Wiz / Orca / Prisma<br>Cloud |
| Coût PME 50 à 500<br>employés | Faible, pay-per-use | Faible si déjà Azure | Faible à modéré selon services activés | Élevé, licences<br>annuelles |


## Wiz : CNAPP leader du marché

- Wiz est une plateforme CNAPP qui corrèle configurations, vulnérabilités, identités, expositions réseau
et données sensibles afin d'identifier les chemins d'attaque réellement exploitables et de prioriser les
risques les plus critiques.
- Différenciateurs :
  - Fonctionnement sans agent
  - Déploiement rapide
  - Vue unifiée AWS, Azure, GCP et Kubernetes
  - Corrélation automatique des risques
  - Priorisation basée sur l'exploitabilité réelle


## Fonctionnement


![Slide 306](/securite-cloud/14-outils-securite-aws-azure-gcp/p306_v37_Image101.jpg)


## Top 10 OWASP pour les LLM 2025 & surface d'attaque cloud IA

- AWS Bedrock, Azure OpenAI et Vertex AI facilitent le déploiement de LLM en production, mais créent une nouvelle surface d'attaque.
- Les principaux risques concernent les injections de prompts, les fuites de données sensibles, les attaques sur les modèles et les données, ainsi que l'excès d'autonomie accordé aux systèmes d'IA.

| Risque | Retenir |
| --- | --- |
| LLM01 - Prompt Injection | Manipulation du modèle via des instructions malveillantes |
| LLM02 - Sensitive Information Disclosure | Divulgation de données sensibles ou confidentielles |
| LLM03 - Supply Chain | Compromission des modèles, datasets ou dépendances |
| LLM04 - Data and Model Poisoning | Altération des données d'entraînement ou du modèle |
| LLM05 - Improper Output Handling | Exploitation des réponses du modèle par des systèmes aval |
| LLM06 - Excessive Agency | Modèle disposant de trop de privilèges ou d'autonomie |
| LLM07 - System Prompt Leakage | Fuite des instructions internes et règles du modèle |
| LLM08 - Vector and Embedding Weaknesses | Attaques sur les bases vectorielles et mécanismes RAG |
| LLM09 - Misinformation | Production d'informations erronées ou trompeuses |
| LLM10 - Unbounded Consumption | Consommation excessive de ressources et coûts incontrôlés |

## L'injection de prompts : risque n°1 des applications LLM

L'injection de prompt consiste à manipuler les instructions fournies à un modèle d'IA afin de contourner les règles prévues par l'application et influencer son comportement.


![Slide 341](/securite-cloud/14-outils-securite-aws-azure-gcp/p341_09_Image93.jpg)


## Guardrails

- Les Guardrails sont une couche de sécurité placée autour du LLM afin de :
  - Contrôler les entrées
  - Contrôler les sorties
  - Contrôler les actions
  - Appliquer des politiques de sécurité
  - Protéger les données sensibles
  - Limiter l'autonomie du modèle
- Ils permettent de réduire les risques d'injection de prompts, de fuite de données sensibles et d'exécution d'actions non autorisées.
- Ils jouent pour l'IA un rôle proche de celui d'un :
  - WAF pour une application web
  - Les groupes de sécurité pour un serveur
  - Admission Controller pour Kubernetes

## Cinq grandes familles de guardrails


| Famille de<br>Guardrails | Rôle principal | Exemples de contrôles | Risques atténués |
| --- | --- | --- | --- |
| Contrôle des<br>entrées | Analyser et filtrer les<br>requêtes avant qu'elles<br>n'atteignent le LLM | Détection de Prompt Injection, Jailbreak,<br>validation du format, filtrage de contenus<br>interdits | Prompt Injection, Prompt<br>Leakage, contournement des<br>règles |
| Contrôle des<br>sorties | Vérifier les réponses<br>générées avant leur<br>restitution | Détection de données sensibles, masquage<br>d'informations, contrôle de conformité,<br>filtrage des réponses | Fuite d'informations, divulgation<br>de secrets, non-conformité |
| Sécurité des<br>contenus | Bloquer les contenus<br>dangereux ou inappropriés | Détection de violence, haine, harcèlement,<br>contenu sexuel, malware, fraude | Contenus toxiques, usages abusifs,<br>risques réglementaires |
| Contrôle des<br>actions | Encadrer les actions<br>exécutées par les agents IA | Validation humaine, listes d'autorisation,<br>limitation des privilèges, contrôle des outils<br>accessibles | Automatisation excessive,<br>escalade de privilèges, actions non<br>autorisées |
| Protection des<br>données | Identifier et protéger les<br>données sensibles utilisées<br>par le modèle | Détection de mots de passe, clés API, données<br>personnelles, données financières ou<br>médicales | Exposition de données sensibles,<br>violation de confidentialité, fuite<br>de secrets |


## Fonctionnement des guardrails


![Slide 313](/securite-cloud/14-outils-securite-aws-azure-gcp/p313_v37_Image103.jpg)


## LLM-as-a-judge

- Le LLM as a Judge agit comme un contrôleur qualité automatisé capable d'évaluer les
réponses d'un autre modèle selon des critères de pertinence, de sécurité et de conformité.
- Il constitue aujourd'hui un composant clé des plateformes d'IA générative en production.

| Avantages | Limites |
| --- | --- |
| Automatisation de l'évaluation des réponses | Le juge peut lui-même halluciner |
| Réduction des coûts de revue humaine | Risque de biais d'évaluation |
| Évaluation à grande échelle | Nécessite des critères d'évaluation précis |
| Détection rapide des dérives et anomalies | Les résultats peuvent varier selon le modèle utilisé |
| Amélioration continue des modèles et des prompts | Les évaluations critiques doivent être échantillonnées ou revues par<br>des humains |


## LLM-as-a-judge et critères d'évaluation


| Critère | Exemple |
| --- | --- |
| Pertinence | La réponse répond-elle à la question ? |
| Exactitude | Les informations sont-elles correctes ? |
| Sécurité | Contient-elle des données sensibles ? |
| Conformité | Respecte-t-elle les politiques définies ? |
| Toxicité | Contient-elle du contenu inapproprié ? |
| Hallucination | Les faits sont-ils vérifiables ? |


## Fonctionnement d’un llm-as-a-judge


![Slide 316](/securite-cloud/14-outils-securite-aws-azure-gcp/p316_v37_Image104.jpg)


![Slide 348](/securite-cloud/14-outils-securite-aws-azure-gcp/p348_12_Image96.jpg)


![Slide 349](/securite-cloud/14-outils-securite-aws-azure-gcp/p349_13_Image97.jpg)


## Gouvernance IA

La gouvernance de l’IA est l’ensemble des règles, processus, contrôles et responsabilités mis en place pour garantir que les
systèmes d’intelligence artificielle sont développés, déployés et exploités de manière sécurisée, fiable, éthique, conforme et
maîtrisée.

| Objectif | Description |
| --- | --- |
| Sécurité | Protéger les modèles, les données et les infrastructures IA |
| Conformité | Respecter les réglementations (RGPD, AI Act, NIS2, etc.) |
| Gestion des risques | Identifier, évaluer et réduire les risques liés à l’IA |
| Transparence | Comprendre les capacités, limites et décisions des modèles |
| Qualité | Garantir la pertinence, la robustesse et la fiabilité des résultats |
| Responsabilité | Définir qui décide, valide et supervise les usages de l’IA |


## AI-TRiSM framework (Gartner) : Gouvernance IA en production

- AI TRiSM (AI Trust, Risk and Security Management) est un cadre de gouvernance permettant de sécuriser les systèmes d’IA
générative en production en adressant les enjeux de confiance, de risque, de sécurité et d’exploitation.

| Domaine | Objectif | Exemples |
| --- | --- | --- |
| Trust (Confiance) | Garantir la fiabilité et la transparence<br>du système | Explicabilité des réponses, vérification des sources, documentation<br>des capacités et limites du modèle |
| Risk (Gestion des<br>risques) | Identifier, évaluer et réduire les<br>risques liés à l’IA | Tests de Red Teaming, classification des risques, détection des dérives<br>du modèle |
| Security (Sécurité) | Protéger les modèles, les données et<br>les infrastructures | Gestion des accès, chiffrement des données, isolation réseau,<br>protection contre les Prompt Injections |
| Management<br>(Gouvernance) | Superviser l’exploitation et assurer la<br>conformité | Audit des usages, surveillance continue, gestion des versions,<br>gouvernance des données |


## Les nouveaux risques introduits par l’IA selon Gartner


![Slide 321](/securite-cloud/14-outils-securite-aws-azure-gcp/p321_v37_Image107.jpg)


## Tests de red teaming IA

Le Red Teaming IA reproduit les comportements d’attaquants réels afin d’évaluer la robustesse des systèmes d’IA générative.
Il permet d’identifier les vulnérabilités de sécurité, de sûreté et de conformité des LLM, des systèmes RAG et des agents IA avant qu’elles ne puissent être exploitées en production.


## Sécuriser un pipeline RAG sur AWS Bedrock

La sécurisation d’Amazon Bedrock repose sur une approche de défense en profondeur combinant IAM, Bedrock Guardrails, contrôle d’accès aux bases de connaissances, chiffrement des données et surveillance continue des usages du modèle.


## AWS STS (Security Token Service) : Sessions temporaires

AWS STS fournit des identifiants temporaires, limités dans le temps et traçables, pour accéder aux ressources AWS de manière plus sécurisée.

| Élément | Description | Rôle |
| --- | --- | --- |
| Objectif | Émettre des identifiants temporaires | Remplacer les accès permanents par des accès limités dans le temps |
| Credentials retournés | AccessKeyId, SecretAccessKey, SessionToken | — |
| Durée | De 15 minutes à 12 heures selon la configuration du rôle | — |
| Bénéfice sécurité | Réduit l’usage de clés statiques et améliore la traçabilité | — |

### Capacités principales

| Usage | Description |
| --- | --- |
| AssumeRole | Endosser temporairement un rôle IAM |
| Fédération OIDC | Utiliser un fournisseur d’identité externe ou un workload |
| Fédération SAML | Permettre l’accès via un fournisseur d’identité d’entreprise |
| Accès cross-account | Accéder à des ressources dans un autre compte AWS |
| Workloads temporaires | Fournir des accès temporaires aux Pods, applications ou pipelines |


## PMapper : Analyse des chemins d’escalade de privilèges

- PMapper (Principal Mapper) est un outil open source permettant d’analyser les relations IAM AWS afin d’identifier :
  - les chemins d’escalade de privilèges
  - les accès indirects à des rôles administrateurs
  - les permissions dangereuses
  - les chaînes d’attaque IAM
- Il construit un graphe des relations entre :
  - Utilisateurs IAM
  - Relations de confiance
  - Rôles IAM
  - Politiques
  - Permissions AWS

```bash
# Installer et analyser
pip install principalmapper
pmapper --account 123456789012 graph create
pmapper --account 123456789012 analysis find_risks
pmapper --account 123456789012 query ‘who can becomeadmin?’
```


## PMapper : Exemple


![Slide 324](/securite-cloud/14-outils-securite-aws-azure-gcp/p324_v37_Image108.jpg)

