---
title: "14. Outils de sécurité : AWS, Azure et GCP"
---

# 14. Outils de sécurité : AWS, Azure et GCP

## Identité & accès


| AWS | Azure | GCP |  |
| --- | --- | --- | --- |
| IAM Identity Center | Microsoft Entra ID | Identity Platform | Authentification centralisée (SSO) |
| Cognito | External ID / B2C | Identity Platform | Gestion des identités clients<br>(CIAM) |
| IAM Access Analyzer | Entra Permissions<br>Management | Privileged Access Manager | Analyse et réduction des<br>permissions excessives |
| Verified Permissions | Permissions<br>Management | IAM Conditions | Contrôle fin des autorisations |


|  | Réseau & Accès Sécurisés |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| AWS |  | Azure | GCP | Rôle |  |
| WAF |  | Front Door WAF | Cloud Armor | Protection des applications web |  |
| Shield Advanced |  | DDoS Protection | Cloud Armor Enterprise | Protection contre les attaques DDoS |  |
| Network Firewall |  | Azure Firewall | Cloud Firewall | Filtrage du trafic réseau |  |
| Firewall Manager |  | Azure Firewall Manager | Firewall Policies | Administration centralisée des<br>pare-feu |  |
| PrivateLink |  | Private Link | Private Service Connect | Accès privé aux services |  |
| Systems Manager<br>Session Manager |  | Azure Bastion | IAP TCP Forwarding | Administration sécurisée sans<br>exposition SSH/RDP |  |
| Verified Access |  | Global Secure Access | BeyondCorp Enterprise | Accès Zero Trust |  |
| Route 53 DNS Firewall |  | Azure DNS Private<br>Resolver | Cloud DNS + Policy | Protection et contrôle DNS<br>3 |  |
|  |  |  |  |  | 3 |


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


## Panaroma des services de sécurité AWS


| Identité | Réseau | Données |
| --- | --- | --- |
| IAM<br>Identity Center<br>Organizations<br>MFA<br>STS<br>Verified Permissions<br>Cognito<br>IAM Access Analyzer | Groupe de sécurité<br>NACLs<br>WAF<br>Shield<br>Network Firewall<br>Firewall Manager<br>Route 53 Resolver DNS Firewall | KMS<br>Secrets Manager<br>CloudHSM<br>Macie<br>Backup<br>Amazon Security Lake |
| Charge de travail | Détection | Gourvernance |
| Inspector<br>ECR Scan<br>Systems Manager<br>Sécurité réseau dans EKS | GuardDuty<br>Security Hub<br>Detective<br>EventBridge<br>CloudWatch<br>AWS Health / Incident Detection | Config<br>Audit Manager<br>Organizations<br>Control Tower<br>Trusted Advisor<br>Artifact |


| AWS GuardDuty |
| --- |
| •  Détection intelligente des menaces pour protéger le compte AWS.<br>•  Utilise des algorithmes de machine learning, détection d'anomalies, des données tierces.<br>•  Un clic pour activer (essai de 30 jours), pas besoin d'installer de logiciel.<br>•  Les données d'entrée :<br>  ◦  Journaux d'événements CloudTrail : appels d'API inhabituels, déploiements non autorisés :<br>■ Événements de gestion CloudTrail : créer un sous-réseau VPC, créer un suivi, etc.<br>■ Événements de données CloudTrail S3 : obtenir un objet, lister des objets, supprimer<br>un objet, etc.<br>  ◦  Journaux de flux VPC : trafic interne inhabituel, adresse IP inhabituelle.<br>  ◦  Journaux DNS : instances EC2 compromises envoyant des données codées dans les<br>requêtes DNS.<br>  ◦  Journaux d'audit Kubernetes : activités suspectes et compromis potentiels de cluster EKS.<br>•  Les alertes de sécurité (findings) GuardDuty peuvent être routés via Amazon EventBridge vers<br>AWS Lambda, Amazon SNS ou AWS Security Hub. |


## AWS GuardDuty


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


## AWS CloudTrail Lake : Fonctionnement


![Slide 316](/securite-cloud/14-outils-securite-aws-azure-gcp/p316_04_Image88.jpg)


| IAM Identity Center |
| --- |
| •  Service AWS pour centraliser les accès des utilisateurs.<br>•  Permet le SSO (Single Sign-On) vers plusieurs comptes AWS et applications.<br>•  Peut se connecter à un fournisseur d’identité existant :<br>  ◦  Microsoft Entra ID.<br>  ◦  Okta.<br>  ◦  Google Workspace.<br>  ◦  Active Directory.<br>•  Permet d’attribuer des accès par utilisateur ou groupe.<br>•  Utilise des permission sets pour définir les droits dans les comptes AWS.<br>•  Réduit le besoin de créer des utilisateurs IAM dans chaque compte.<br>•  Adapté aux environnements multi-comptes avec AWS Organizations.<br>•  Améliore la gouvernance, l’audit et l’application du moindre privilège.<br>•  En résumé :<br>  ◦  IAM Identity Center centralise les accès humains aux comptes AWS.<br>  ◦  IAM reste utilisé pour gérer les permissions, rôles et politiques AWS. |


## IAM Identity Center


![Slide 318](/securite-cloud/14-outils-securite-aws-azure-gcp/p318_05_Image89.jpg)


## Panaroma des services de sécurité Azure


| Identité | Réseau | Données |
| --- | --- | --- |
| Microsoft Entra ID<br>Conditional Access<br>PIM (Privileged Identity Management)<br>Identity Protection<br>MFA<br>Microsoft Entra Permissions Management<br>Defender for Identity | NSG (groupe de sécurité réseau)<br>Azure Firewall<br>DDoS Protection<br>Private Link<br>Front Door WAF<br>Application Gateway WAF<br>Azure Bastion | Key Vault<br>Purview<br>Information Protection<br>Managed HSM<br>Backup<br>Defender for Storage<br>Defender for SQL |
| Charge de travail | Détection | Gourvernance |
| Defender for Cloud<br>AKS Security<br>Container Registry<br>VM Protection<br>App Service Security | Microsoft Sentinel<br>Defender XDR<br>Monitor<br>Log Analytics<br>Defender for Cloud<br>Defender for Cloud Apps<br>Defender Threat Intelligence | Azure Policy<br>Blueprints<br>Landing Zones<br>Groupes d'administration<br>Cost Management<br>Microsoft Priva<br>Compliance Manager |


| Microsoft Defender for Cloud : CSPM + CWPP Intégré |
| --- |
| •  jh |


| Panaroma des services de sécurité GCP |  |  |  |
| --- | --- | --- | --- |
| Identité | Réseau | Données |  |
| Cloud IAM<br>Identity Platform<br>IAM Conditions<br>Workload Identity Federation<br>MFA<br>Cloud Identity<br>Privileged Access Manager<br>Access Context Manager | Cloud Firewall<br>Cloud Armor<br>VPC Service Controls<br>Cloud IDS<br>Private Service Connect<br>reCAPTCHA Enterprise, Certificate Authority<br>Service | Cloud KMS<br>Secret Manager<br>Sensitive Data Protection<br>External Key Manager<br>Backup & DR |  |
| Charge de travail | Détection | Gourvernance |  |
| Security Command<br>Center<br>GKE Security<br>Artifact Analysis<br>Binary Authorization<br>VM Manager<br>Container Threat Detection<br>GKE Enterprise security posture | Security Command<br>Security Operations (SecOps)<br>Center<br>Event Threat<br>Detection<br>Cloud Logging<br>Cloud Monitoring<br>Mandiant Threat Intelligence<br>Cloud Audit Logs | Organization Policies<br>Resource Manager<br>Assured Workloads<br>Policy Controller<br>Security Health Analytics<br>Cloud Asset Inventory<br>Risk Manager<br>Cloud Compliance<br>Access Transparency<br>3 |  |
|  |  |  | 3 |


| Security Command Center : CSPM Natif GCP |
| --- |
| •  Tableau de bord centralisé de sécurité GCP. Agrège les findings de tous les services de<br>sécurité GCP + détecte les menaces via l'intégration Mandiant Threat Intelligence.<br>•  Asset Inventory : découverte automatique de toutes les ressources GCP (Compute · GCS ·<br>GKE · CloudSQL · BigQuery · IAM)<br>•  Threat Detection : Event Threat Detection (logs) + Container Threat Detection (runtime) +<br>VM Threat Detection (mémoire)<br>•  Security Health Analytics : détecte ~150 misconfiguration types — buckets publics · SA clés<br>· APIs exposées · audit logs désactivés<br>•  Mandiant Integration : threat intelligence Mandiant nativement intégrée — IoC, TTPs,<br>attribution groupes APT en temps réel<br>•  SIEM Export : findings vers Chronicle (natif) · Pub/Sub → Splunk/Sentinel · BigQuery pour<br>analyse historique |


| Google Chronicle : SIEM Cloud-Native à Rétention Illimitée |  |
| --- | --- |
| •  SIEM cloud-native développé par Google, basé sur l'infrastructure Bigtable et Spanner.<br>Ingestion et rétention de logs à grande échelle avec un pricing fixe (pas au volume),<br>intégration Mandiant.<br>•  Rétention : 1 an incluse dans le tarif de base (vs 90j pour la plupart des SIEM) —<br>requêtable à tout moment en temps réel<br>•  Performances : ingestion de milliards d'événements/jour · requêtes sur 1 an de données<br>en secondes grâce à l'infra Google<br>•  YARA-L : langage de règles de détection basé sur YARA — corrélation multi-events sur<br>fenêtres temporelles (over 5m, over 1h)<br>•  SOAR intégré : playbooks automatisés (ex-Siemplify) · case management · threat<br>intelligence enrichissement automatique<br>•  Connecteurs : GCP nativement, AWS (CloudTrail, VPC Flow et GuardDuty), Azure, Okta,<br>CrowdStrike, Palo Alto Networks. |  |
|  | 3 |


![Slide 333](/securite-cloud/14-outils-securite-aws-azure-gcp/p333_06_Image90.jp2)

![Slide 333](/securite-cloud/14-outils-securite-aws-azure-gcp/p333_07_Image91.jpg)


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


![Slide 337](/securite-cloud/14-outils-securite-aws-azure-gcp/p337_08_Image92.jpg)


## Top 10 OWASP pour les LLM 2025 & surface d'attaque cloud IA

- AWS Bedrock, Azure OpenAI et Vertex AI facilitent le déploiement de LLM en production,
mais créent une nouvelle surface d'attaque.
- Les principaux risques concernent les injections de prompts, les fuites de données
sensibles, les attaques sur les modèles et les données, ainsi que l'excès d'autonomie
accordé aux systèmes d'IA.


| l’injection de Prompts : Risque n°1 des applications LLM |
| --- |
| L’injection de prompt consiste à manipuler les instructions fournies à un modèle d'IA afin de<br>contourner les règles prévues par l'application et influencer son comportement. |

![Slide 341](/securite-cloud/14-outils-securite-aws-azure-gcp/p341_09_Image93.jpg)


## Cinq grande famille de guardials


| Famille de<br>Guardrails | Rôle principal | Exemples de contrôles | Risques atténués |  |
| --- | --- | --- | --- | --- |
| Contrôle des<br>entrées | Analyser et filtrer les<br>requêtes avant qu'elles<br>n'atteignent le LLM | Détection de Prompt Injection, Jailbreak,<br>validation du format, filtrage de contenus<br>interdits | Prompt Injection, Prompt<br>Leakage, contournement des<br>règles |  |
| Contrôle des<br>sorties | Vérifier les réponses<br>générées avant leur<br>restitution | Détection de données sensibles, masquage<br>d'informations, contrôle de conformité,<br>filtrage des réponses | Fuite d'informations, divulgation<br>de secrets, non-conformité |  |
| Sécurité des<br>contenus | Bloquer les contenus<br>dangereux ou inappropriés | Détection de violence, haine, harcèlement,<br>contenu sexuel, malware, fraude | Contenus toxiques, usages abusifs,<br>risques réglementaires |  |
| Contrôle des<br>actions | Encadrer les actions<br>exécutées par les agents IA | Validation humaine, listes d'autorisation,<br>limitation des privilèges, contrôle des outils<br>accessibles | Automatisation excessive,<br>escalade de privilèges, actions non<br>autorisées |  |
| Protection des<br>données | Identifier et protéger les<br>données sensibles utilisées<br>par le modèle | Détection de mots de passe, clés API, données<br>personnelles, données financières ou<br>médicales | Exposition de données sensibles,<br>violation de confidentialité, fuite<br>de secrets |  |
|  |  |  |  | 3 |


## Fonctionnement des guardrails


![Slide 344](/securite-cloud/14-outils-securite-aws-azure-gcp/p344_10_Image94.jpg)


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


![Slide 347](/securite-cloud/14-outils-securite-aws-azure-gcp/p347_11_Image95.jpg)


| Tests de red teaming IA |
| --- |
| •  Le Red Teaming IA reproduit les comportements d’attaquants réels afin d’évaluer la robustesse des systèmes d’IA<br>générative.<br>•  Il permet d’identifier les vulnérabilités de sécurité, de sûreté et de conformité des LLM, des systèmes RAG et des agents IA<br>avant qu’elles ne puissent être exploitées en production. |

![Slide 348](/securite-cloud/14-outils-securite-aws-azure-gcp/p348_12_Image96.jpg)


| Sécuriser un Pipeline RAG sur AWS Bedrock |
| --- |
| La sécurisation d'Amazon Bedrock repose sur une approche de défense en profondeur combinant IAM, Bedrock Guardrails,<br>contrôle d'accès aux bases de connaissances, chiffrement des données et surveillance continue des usages du modèle. |

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


## Les nouveaux risques introduits par l'IA selon Gartner


![Slide 352](/securite-cloud/14-outils-securite-aws-azure-gcp/p352_14_Image98.jpg)


| Limites d'autorisation : Délégation sécurisée |
| --- |
| •  jh |


## Pip install principalmapper

pmapper --account 123456789012 graph create
pmapper --account 123456789012 analysis find_risks
pmapper --account 123456789012 query 'who can becomeadmin?'

| PMapper : Analyse des Chemins d'Escalade de Privilèges |  |
| --- | --- |
| •  PMapper (Principal Mapper) est un outil open source permettant d’analyser les relations IAM AWS afin<br>d’identifier :<br>  ◦  les chemins d’escalade de privilèges<br>  ◦  les accès indirects à des rôles administrateurs<br>  ◦  les permissions dangereuses<br>  ◦  les chaînes d’attaque IAM<br>•  Il construit un graphe des relations entre :<br>  ◦  Utilisateurs IAM<br>  ◦  Relations de confiance<br>  ◦  Rôles IAM<br>  ◦  Politiques<br>  ◦  Permissions AWS # Installer et analyser |  |
|  | # Installer et analyser |


## PMapper : Exemple


![Slide 356](/securite-cloud/14-outils-securite-aws-azure-gcp/p356_15_Image99.jpg)


| AWS STS : Sessions Temporaires & AssumeRole |
| --- |
| •  jh |


## QCM : Outils de sécurité : 

AWS, Azure et GCP

