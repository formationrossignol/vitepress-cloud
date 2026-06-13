---
title: "14. Outils de Sécurité : AWS, Azure et GCP"
---

# 14. Outils de Sécurité : AWS, Azure et GCP

## 14. Outils de Sécurité :

AWS, Azure et GCP


## Identité & accès


| AWS | Azure | GCP |  |
|---|---|---|---|
| IAM Identity Center | Microsoft Entra ID | Identity Platform | Authentification centralisée (SSO) |
| Cognito | External ID / B2C | Identity Platform | Gestion des identités clients (CIAM) |
| IAM Access Analyzer | Entra Permissions Management | Privileged Access Manager | Analyse et réduction des permissions excessives |
| Verified Permissions | Permissions Management | IAM Conditions | Contrôle fin des autorisations |


|  | Réseau & Accès Sécurisés |  |  |  |  |
|---|---|---|---|---|---|
| AWS |  | Azure | GCP | Rôle |  |
| WAF |  | Front Door WAF | Cloud Armor | Protection des applications web |  |
| Shield Advanced |  | DDoS Protection | Cloud Armor Enterprise | Protection contre les attaques DDoS |  |
| Network Firewall |  | Azure Firewall | Cloud Firewall | Filtrage du trafic réseau |  |
| Firewall Manager |  | Azure Firewall Manager | Firewall Policies | Administration centralisée des pare-feu |  |
| PrivateLink |  | Private Link | Private Service Connect | Accès privé aux services |  |
| Systems Manager Session Manager |  | Azure Bastion | IAP TCP Forwarding | Administration sécurisée sans exposition SSH/RDP |  |
| Verified Access |  | Global Secure Access | BeyondCorp Enterprise | Accès Zero Trust |  |
| Route 53 DNS Firewall |  | Azure DNS Private Resolver | Cloud DNS + Policy | Protection et contrôle DNS 3 |  |
|  |  |  |  |  | 3 |


## Protection des données


| AWS | Azure | GCP | Rôle |
|---|---|---|---|
| KMS | Key Vault | Cloud KMS | Gestion des clés de chiffrement |
| Secrets Manager | Key Vault | Secret Manager | Stockage sécurisé des secrets |
| CloudHSM | Managed HSM | Cloud HSM | Gestion des clés dans un HSM dédié |
| Macie | Microsoft Purview | Sensitive Data Protection | Découverte et protection des données sensibles |
| Backup | Azure Backup | Backup & DR | Sauvegarde et reprise après incident |


## Protection des données


| AWS | Azure | GCP | Rôle |
|---|---|---|---|
| GuardDuty | Microsoft Sentinel | Event Threat Detection | Détection des menaces |
| Detective | Microsoft Sentinel Investigation | Google SecOps | Investigation des incidents |
| Security Hub | Defender for Cloud | Security Command Center | Centralisation des alertes sécurité |
| CloudTrail | Activity Logs | Cloud Audit Logs | Journalisation des actions et audits |
| CloudWatch | Azure Monitor | Cloud Monitoring | Supervision et observabilité |
| Security Lake | Microsoft Sentinel Data Lake | Google SecOps Data Platform | Centralisation des données de sécurité |


## Sécurité des charges de travail


| AWS | Azure | GCP | Rôle |
|---|---|---|---|
| Inspector | Defender for Cloud | Artifact Analysis | Analyse des vulnérabilités |
| ECR Scan | Defender for Containers | Artifact Analysis | Scan des images de conteneurs |
| GuardDuty Runtime Monitoring | Defender for Containers | Container Threat Detection | Détection des comportements malveillants en exécution |


## Gouvernance & Conformité


| AWS | Azure | GCP | Rôle |
|---|---|---|---|
| Organizations | Management Groups | Organization Policies | Gouvernance multi-comptes / multi-projets |
| Control Tower | Landing Zones | Assured Workloads | Mise en place d'environnements sécurisés |
| Config | Azure Policy | Organization Policy Service | Contrôle et application des règles de conformité |
| Audit Manager | Compliance Manager | Assured Workloads | Pilotage de la conformité réglementaire |


## Panaroma des services de sécurité AWS


| Identité | Réseau | Données |
|---|---|---|
| IAM Identity Center Organizations MFA STS Verified Permissions Cognito IAM Access Analyzer | Groupe de sécurité NACLs WAF Shield Network Firewall Firewall Manager Route 53 Resolver DNS Firewall | KMS Secrets Manager CloudHSM Macie Backup Amazon Security Lake |
| Charge de travail | Détection | Gourvernance |
| Inspector ECR Scan Systems Manager Sécurité réseau dans EKS | GuardDuty Security Hub Detective EventBridge CloudWatch AWS Health / Incident Detection | Config Audit Manager Organizations Control Tower Trusted Advisor Artifact |


| AWS GuardDuty |
|---|
| ● Détection intelligente des menaces pour protéger le compte AWS. ● Utilise des algorithmes de machine learning, détection d'anomalies, des données tierces. ● Un clic pour activer (essai de 30 jours), pas besoin d'installer de logiciel. ● Les données d'entrée : ○ Journaux d'événements CloudTrail : appels d'API inhabituels, déploiements non autorisés : ■ Événements de gestion CloudTrail : créer un sous-réseau VPC, créer un suivi, etc. ■ Événements de données CloudTrail S3 : obtenir un objet, lister des objets, supprimer un objet, etc. ○ Journaux de flux VPC : trafic interne inhabituel, adresse IP inhabituelle. ○ Journaux DNS : instances EC2 compromises envoyant des données codées dans les requêtes DNS. ○ Journaux d'audit Kubernetes : activités suspectes et compromis potentiels de cluster EKS. ● Les alertes de sécurité (findings) GuardDuty peuvent être routés via Amazon EventBridge vers AWS Lambda, Amazon SNS ou AWS Security Hub. |


## AWS GuardDuty


![Slide 308](/securite-cloud/14-outils-securite-aws-azure-gcp/p308_00_Image84.jpg)


## AWS Security Hub : Agrégateur Central de Sécurité

- AWS Security Hub est un service AWS permettant de centraliser, corréler et prioriser les alertes de sécurité
provenant des services AWS, des comptes cloud et des outils tiers.
- Agrège les alertes de sécurité de : GuardDuty / Inspector / Macie / IAM Access Analyzer
- Standards de conformité intégrés :
  - CIS AWS Foundations v2 · AWS Foundational Security Best Practices · PCI-DSS v3.2.1
  - Security Score global de 0 à 100 — évolue en temps réel
  - Custom Actions : envoyer findings vers Lambda · SNS · EventBridge
  - Cross-account aggregation : vue unifiée de toute l'organization
- Il agit comme un point central de visibilité pour la posture de sécurité AWS.


## AWS Security Hub : Agrégateur Central de Sécurité


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


## Amazon Inspector


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


## AWS Network Firewall


![Slide 314](/securite-cloud/14-outils-securite-aws-azure-gcp/p314_03_Image87.jpg)


## AWS CloudTrail Lake : Analyse et Investigation des Journaux

CloudTraiL
- Service AWS managé permettant de centraliser, conserver et interroger les événements CloudTrail via
SQL, sans infrastructure Athena, S3 ou Glue à administrer.
- Fonctionnalités clés :
  - Requêtes SQL natives : Interrogation directe des événements CloudTrail avec SQL standard
    - SELECT eventTime, eventName, userIdentity.arn, sourceIPAddress
FROM my_event_data_store
WHERE eventName = 'DeleteBucket';
  - Rétention longue durée : Conservation configurable des journaux de 90 jours à 7 ans avec accès
immédiat aux données historiques.
  - Intégration native AWS : Compatible avec AWS Organizations, AWS Config et CloudTrail Insights
pour une visibilité centralisée.
  - Détection d'anomalies : CloudTrail Insights identifie automatiquement les comportements
inhabituels et les pics d'activité API.
  - Investigation et : Recherche rapide des actions réalisées par un utilisateur
IAM, un rôle ou u lusieurs mois ou années.


## AWS CloudTrail Lake : FONCTIONNEMENT


![Slide 316](/securite-cloud/14-outils-securite-aws-azure-gcp/p316_04_Image88.jpg)


| IAM Identity Center |
|---|
| ● Service AWS pour centraliser les accès des utilisateurs. ● Permet le SSO (Single Sign-On) vers plusieurs comptes AWS et applications. ● Peut se connecter à un fournisseur d’identité existant : ○ Microsoft Entra ID. ○ Okta. ○ Google Workspace. ○ Active Directory. ● Permet d’attribuer des accès par utilisateur ou groupe. ● Utilise des permission sets pour définir les droits dans les comptes AWS. ● Réduit le besoin de créer des utilisateurs IAM dans chaque compte. ● Adapté aux environnements multi-comptes avec AWS Organizations. ● Améliore la gouvernance, l’audit et l’application du moindre privilège. ● En résumé : ○ IAM Identity Center centralise les accès humains aux comptes AWS. ○ IAM reste utilisé pour gérer les permissions, rôles et politiques AWS. |


## IAM Identity Center


![Slide 318](/securite-cloud/14-outils-securite-aws-azure-gcp/p318_05_Image89.jpg)


## Panaroma des services de sécurité azure


| Identité | Réseau | Données |
|---|---|---|
| Microsoft Entra ID Conditional Access PIM (Privileged Identity Management) Identity Protection MFA Microsoft Entra Permissions Management Defender for Identity | NSG (groupe de sécurité réseau) Azure Firewall DDoS Protection Private Link Front Door WAF Application Gateway WAF Azure Bastion | Key Vault Purview Information Protection Managed HSM Backup Defender for Storage Defender for SQL |
| Charge de travail | Détection | Gourvernance |
| Defender for Cloud AKS Security Container Registry VM Protection App Service Security | Microsoft Sentinel Defender XDR Monitor Log Analytics Defender for Cloud Defender for Cloud Apps Defender Threat Intelligence | Azure Policy Blueprints Landing Zones Groupes d'administration Cost Management Microsoft Priva Compliance Manager |


| Microsoft Defender for Cloud : CSPM + CWPP Intégré |
|---|
| ● jh |


| Panaroma des services de sécurité GCP |  |  |  |
|---|---|---|---|
| Identité | Réseau | Données |  |
| Cloud IAM Identity Platform IAM Conditions Workload Identity Federation MFA Cloud Identity Privileged Access Manager Access Context Manager | Cloud Firewall Cloud Armor VPC Service Controls Cloud IDS Private Service Connect reCAPTCHA Enterprise, Certificate Authority Service | Cloud KMS Secret Manager Sensitive Data Protection External Key Manager Backup & DR |  |
| Charge de travail | Détection | Gourvernance |  |
| Security Command Center GKE Security Artifact Analysis Binary Authorization VM Manager Container Threat Detection GKE Enterprise security posture | Security Command Security Operations (SecOps) Center Event Threat Detection Cloud Logging Cloud Monitoring Mandiant Threat Intelligence Cloud Audit Logs | Organization Policies Resource Manager Assured Workloads Policy Controller Security Health Analytics Cloud Asset Inventory Risk Manager Cloud Compliance Access Transparency 3 |  |
|  |  |  | 3 |


| Security Command Center : CSPM Natif GCP |
|---|
| ● Tableau de bord centralisé de sécurité GCP. Agrège les findings de tous les services de sécurité GCP + détecte les menaces via l'intégration Mandiant Threat Intelligence. ● Asset Inventory : découverte automatique de toutes les ressources GCP (Compute · GCS · GKE · CloudSQL · BigQuery · IAM) ● Threat Detection : Event Threat Detection (logs) + Container Threat Detection (runtime) + VM Threat Detection (mémoire) ● Security Health Analytics : détecte ~150 misconfiguration types — buckets publics · SA clés · APIs exposées · audit logs désactivés ● Mandiant Integration : threat intelligence Mandiant nativement intégrée — IoC, TTPs, attribution groupes APT en temps réel ● SIEM Export : findings vers Chronicle (natif) · Pub/Sub → Splunk/Sentinel · BigQuery pour analyse historique |


| Google Chronicle : SIEM Cloud-Native à Rétention Illimitée |  |
|---|---|
| ● SIEM cloud-native développé par Google, basé sur l'infrastructure Bigtable et Spanner. Ingestion et rétention de logs à grande échelle avec un pricing fixe (pas au volume), intégration Mandiant. ● Rétention : 1 an incluse dans le tarif de base (vs 90j pour la plupart des SIEM) — requêtable à tout moment en temps réel ● Performances : ingestion de milliards d'événements/jour · requêtes sur 1 an de données en secondes grâce à l'infra Google ● YARA-L : langage de règles de détection basé sur YARA — corrélation multi-events sur fenêtres temporelles (over 5m, over 1h) ● SOAR intégré : playbooks automatisés (ex-Siemplify) · case management · threat intelligence enrichissement automatique ● Connecteurs : GCP nativement, AWS (CloudTrail, VPC Flow et GuardDuty), Azure, Okta, CrowdStrike, Palo Alto Networks. |  |
|  | 3 |


![Slide 333](/securite-cloud/14-outils-securite-aws-azure-gcp/p333_06_Image90.jp2)

![Slide 333](/securite-cloud/14-outils-securite-aws-azure-gcp/p333_07_Image91.jpg)


## Comparatif : Quel Outil pour Quel Besoin ?


| Besoin | AWS natif | Azure natif | GCP natif | Tiers |
|---|---|---|---|---|
| CSPM, posture management | Security Hub CSPM + Config | Defender for Cloud | Security Command Center | Wiz / Prisma Cloud / Orca |
| CWPP, protection workloads | GuardDuty + Inspector | Defender for Servers / Containers | Security Command Center + Container Threat Detection | Lacework / Aqua / Sysdig |
| SIEM / centralisation sécurité | Security Lake + CloudWatch + OpenSearch | Microsoft Sentinel | Google SecOps / Chronicle | Splunk / Elastic |
| Secrets management | Secrets Manager + KMS | Key Vault | Secret Manager + Cloud KMS | HashiCorp Vault |
| Scan images conteneurs | ECR + Inspector | ACR + Defender | Artifact Analysis | Trivy / Aqua / Sysdig |
| DLP / données sensibles | Macie, surtout S3 | Microsoft Purview | Sensitive Data Protection | Varonis / Symantec / BigID |
| Multi-cloud unifié | AWS seulement | Defender avec add-on AWS/GCP | SCC surtout GCP | Wiz / Orca / Prisma Cloud |
| Coût PME 50 à 500 employés | Faible, pay-per-use | Faible si déjà Azure | Faible à modéré selon services activés | Élevé, licences annuelles |


## Wiz : CNAPP Leader du Marché

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


![Slide 337](/securite-cloud/14-outils-securite-aws-azure-gcp/p337_08_Image92.jpg)


## Top 10 OWASP pour les LLM 2025 & Surface d'Attaque Cloud IA

- AWS Bedrock, Azure OpenAI et Vertex AI facilitent le déploiement de LLM en production,
mais créent une nouvelle surface d'attaque.
- Les principaux risques concernent les injections de prompts, les fuites de données
sensibles, les attaques sur les modèles et les données, ainsi que l'excès d'autonomie
accordé aux systèmes d'IA.


## Top 10 OWASP pour les LLM 2025 & Surface d'Attaque Cloud IA



| l’injection de Prompts : Risque n°1 des applications LLM |
|---|
| L’injection de prompt consiste à manipuler les instructions fournies à un modèle d'IA afin de contourner les règles prévues par l'application et influencer son comportement. |

![Slide 341](/securite-cloud/14-outils-securite-aws-azure-gcp/p341_09_Image93.jpg)


## Cinq grande famille de Guardials


| Famille de Guardrails | Rôle principal | Exemples de contrôles | Risques atténués |  |
|---|---|---|---|---|
| Contrôle des entrées | Analyser et filtrer les requêtes avant qu'elles n'atteignent le LLM | Détection de Prompt Injection, Jailbreak, validation du format, filtrage de contenus interdits | Prompt Injection, Prompt Leakage, contournement des règles |  |
| Contrôle des sorties | Vérifier les réponses générées avant leur restitution | Détection de données sensibles, masquage d'informations, contrôle de conformité, filtrage des réponses | Fuite d'informations, divulgation de secrets, non-conformité |  |
| Sécurité des contenus | Bloquer les contenus dangereux ou inappropriés | Détection de violence, haine, harcèlement, contenu sexuel, malware, fraude | Contenus toxiques, usages abusifs, risques réglementaires |  |
| Contrôle des actions | Encadrer les actions exécutées par les agents IA | Validation humaine, listes d'autorisation, limitation des privilèges, contrôle des outils accessibles | Automatisation excessive, escalade de privilèges, actions non autorisées |  |
| Protection des données | Identifier et protéger les données sensibles utilisées par le modèle | Détection de mots de passe, clés API, données personnelles, données financières ou médicales | Exposition de données sensibles, violation de confidentialité, fuite de secrets |  |
|  |  |  |  | 3 |


## Fonctionnement des Guardrails


![Slide 344](/securite-cloud/14-outils-securite-aws-azure-gcp/p344_10_Image94.jpg)


## LLM-as-a-judge

- Le LLM as a Judge agit comme un contrôleur qualité automatisé capable d'évaluer les
réponses d'un autre modèle selon des critères de pertinence, de sécurité et de conformité.
- Il constitue aujourd'hui un composant clé des plateformes d'IA générative en production.

| Avantages | Limites |
|---|---|
| Automatisation de l'évaluation des réponses | Le juge peut lui-même halluciner |
| Réduction des coûts de revue humaine | Risque de biais d'évaluation |
| Évaluation à grande échelle | Nécessite des critères d'évaluation précis |
| Détection rapide des dérives et anomalies | Les résultats peuvent varier selon le modèle utilisé |
| Amélioration continue des modèles et des prompts | Les évaluations critiques doivent être échantillonnées ou revues par des humains |


## LLM-as-a-judge et Critères d'évaluation


| Critère | Exemple |
|---|---|
| Pertinence | La réponse répond-elle à la question ? |
| Exactitude | Les informations sont-elles correctes ? |
| Sécurité | Contient-elle des données sensibles ? |
| Conformité | Respecte-t-elle les politiques définies ? |
| Toxicité | Contient-elle du contenu inapproprié ? |
| Hallucination | Les faits sont-ils vérifiables ? |


## Fonctionnement d’un LLM-as-a-judge


![Slide 347](/securite-cloud/14-outils-securite-aws-azure-gcp/p347_11_Image95.jpg)


| Tests de red teaming IA |
|---|
| ● Le Red Teaming IA reproduit les comportements d’attaquants réels afin d’évaluer la robustesse des systèmes d’IA générative. ● Il permet d’identifier les vulnérabilités de sécurité, de sûreté et de conformité des LLM, des systèmes RAG et des agents IA avant qu’elles ne puissent être exploitées en production. |

![Slide 348](/securite-cloud/14-outils-securite-aws-azure-gcp/p348_12_Image96.jpg)


| Sécuriser un Pipeline RAG sur AWS Bedrock |
|---|
| La sécurisation d'Amazon Bedrock repose sur une approche de défense en profondeur combinant IAM, Bedrock Guardrails, contrôle d'accès aux bases de connaissances, chiffrement des données et surveillance continue des usages du modèle. |

![Slide 349](/securite-cloud/14-outils-securite-aws-azure-gcp/p349_13_Image97.jpg)


## Gouvernance IA

La gouvernance de l’IA est l’ensemble des règles, processus, contrôles et responsabilités mis en place pour garantir que les
systèmes d’intelligence artificielle sont développés, déployés et exploités de manière sécurisée, fiable, éthique, conforme et
maîtrisée.

| Objectif | Description |
|---|---|
| Sécurité | Protéger les modèles, les données et les infrastructures IA |
| Conformité | Respecter les réglementations (RGPD, AI Act, NIS2, etc.) |
| Gestion des risques | Identifier, évaluer et réduire les risques liés à l’IA |
| Transparence | Comprendre les capacités, limites et décisions des modèles |
| Qualité | Garantir la pertinence, la robustesse et la fiabilité des résultats |
| Responsabilité | Définir qui décide, valide et supervise les usages de l’IA |


## AI-TRiSM Framework (Gartner) : Gouvernance IA en Production

- AI TRiSM (AI Trust, Risk and Security Management) est un cadre de gouvernance permettant de sécuriser les systèmes d’IA
générative en production en adressant les enjeux de confiance, de risque, de sécurité et d’exploitation.

| Domaine | Objectif | Exemples |
|---|---|---|
| Trust (Confiance) | Garantir la fiabilité et la transparence du système | Explicabilité des réponses, vérification des sources, documentation des capacités et limites du modèle |
| Risk (Gestion des risques) | Identifier, évaluer et réduire les risques liés à l’IA | Tests de Red Teaming, classification des risques, détection des dérives du modèle |
| Security (Sécurité) | Protéger les modèles, les données et les infrastructures | Gestion des accès, chiffrement des données, isolation réseau, protection contre les Prompt Injections |
| Management (Gouvernance) | Superviser l’exploitation et assurer la conformité | Audit des usages, surveillance continue, gestion des versions, gouvernance des données |


## Les nouveaux risques introduits par l'IA selon gartner


![Slide 352](/securite-cloud/14-outils-securite-aws-azure-gcp/p352_14_Image98.jpg)


| Limites d'autorisation : Délégation sécurisée |
|---|
| ● jh |


## Pip install principalmapper

pmapper --account 123456789012 graph create
pmapper --account 123456789012 analysis find_risks
pmapper --account 123456789012 query 'who can becomeadmin?'

| PMapper : Analyse des Chemins d'Escalade de Privilèges |  |
|---|---|
| ● PMapper (Principal Mapper) est un outil open source permettant d’analyser les relations IAM AWS afin d’identifier : ○ les chemins d’escalade de privilèges ○ les accès indirects à des rôles administrateurs ○ les permissions dangereuses ○ les chaînes d’attaque IAM ● Il construit un graphe des relations entre : ○ Utilisateurs IAM ○ Relations de confiance ○ Rôles IAM ○ Politiques ○ Permissions AWS # Installer et analyser |  |
|  | # Installer et analyser |


## PMapper : EXEMPLE


![Slide 356](/securite-cloud/14-outils-securite-aws-azure-gcp/p356_15_Image99.jpg)


| AWS STS : Sessions Temporaires & AssumeRole |
|---|
| ● jh |


## QCM : Outils de Sécurité :

AWS, Azure et GCP

