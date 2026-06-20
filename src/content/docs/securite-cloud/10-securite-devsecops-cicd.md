---
title: "10. Sécurité DevSecOps & CI/CD"
---

# 10. Sécurité DevSecOps & CI/CD

## Pipeline DevSecOps complet : Sécurité shift-left

Le Shift-Left consiste à intégrer les contrôles de qualité et de sécurité le plus tôt possible dans le cycle de
développement afin de détecter et corriger les problèmes avant la mise en production.

![Slide 232](/securite-cloud/10-securite-devsecops-cicd/p232_00_Image71.jpg)


## Static application

Security Testing


## Static application security testing (SAST)


| Outil | Type |
| --- | --- |
| Semgrep | Open source |
| SonarQube | Qualité & sécurité |
| GitHub Advanced Security | Intégré GitHub |
| Checkmarx | Commercial |
| Fortify SCA | Commercial |
| Veracode Static Analysis | SaaS |
| CodeQL | Open source (GitHub) |


## Fonctionnement


![Slide 235](/securite-cloud/10-securite-devsecops-cicd/p235_01_Image72.jpg)


## Dynamic application

Security Testing


## Dynamic application security testing (DAST)


| Outil | Type |
| --- | --- |
| OWASP ZAP | Open source |
| Burp Suite | Référence du marché |
| Invicti (Netsparker) | Commercial |
| Acunetix | Commercial |
| Rapid7 InsightAppSec | SaaS |
| StackHawk | Cloud Native |




![Slide 238](/securite-cloud/10-securite-devsecops-cicd/p238_02_Image73.jpg)


## Nuclei : Scanner de vulnérabilités applicatives


| Concept | Détecte | Cas d'usage cloud |
| --- | --- | --- |
| •  Outil open source développé par<br>ProjectDiscovery<br>•  Scanner de vulnérabilités basé sur<br>des templates YAML<br>•  Fonctionne comme un DAST léger<br>et automatisable<br>•  Très utilisé en prime aux bogues,<br>pentest et CI/CD<br>•  Plus de 8 000 templates<br>communautaires | •  Vulnérabilités connues (CVE)<br>•  Mauvaises configurations<br>•  Secrets exposés<br>•  Endpoints sensibles<br>•  Headers de sécurité manquants<br>•  Expositions cloud (S3, Kubernetes,<br>API, etc.) | •  Scan d'API REST et GraphQL<br>•  Vérification de buckets S3 publics<br>•  Détection d'API Gateway exposées<br>•  Contrôle d'environnements<br>Kubernetes<br>•  Validation de services cloud<br>accessibles depuis Internet<br>•  Contrôle de sécurité avant mise en<br>production |




![Slide 241](/securite-cloud/10-securite-devsecops-cicd/p241_03_Image74.jpg)


## Software composition analysis

- Le Software Composition Analysis (SCA) consiste à analyser les bibliothèques et dépendances
open source utilisées par une application afin d'identifier les vulnérabilités connues, les
composants obsolètes et les risques liés à la chaîne d'approvisionnement logicielle.
- Objectif : détecter et corriger les vulnérabilités introduites indirectement par les dépendances
tierces.

| Ce que vérifie un SCA | Dépendances directes et transitives |
| --- | --- |
| •  Dépendances directes et transitives<br>•  Versions utilisées<br>•  Vulnérabilités connues (CVE)<br>•  Composants obsolètes<br>•  Licences open source<br>•  Présence dans un SBOM | Mon application<br>└── express |
|  | Mon application<br>└── express<br>├── body-parser<br>├── send |
|  | └── debug |




![Slide 244](/securite-cloud/10-securite-devsecops-cicd/p244_04_Image75.jpg)


## Comparaison de solutions


| Snyk | Dependabot | OWASP Dependency-Check |
| --- | --- | --- |
| Version gratuite et payante | Intégré nativement à GitHub | Open source |
| Plugin VS Code et IntelliJ | Création automatique de Pull Requests | Support multi-langages |
| Analyse des dépendances et CVE | Détection des dépendances vulnérables | Analyse basée sur les bases<br>NVD/CVE |
| Contrôles dans les Pull Requests | Mise à jour automatique des versions<br>vulnérables | Calcul des scores CVSS |
| Correctifs automatiques via Pull<br>Requests | Intégration GitHub simple | Intégration CI/CD |
| Support conteneurs, IaC et code | Focalisé sur les dépendances GitHub | Rapports détaillés de vulnérabilités |
| Approche DevSecOps complète | Solution simple et automatisée | Référence open source pour le SCA |


## Renovate : Gestion automatisée des dépendances



## Renovate : Fonctionnement


![Slide 247](/securite-cloud/10-securite-devsecops-cicd/p247_05_Image76.jpg)


## Software bill of materials (SBOM)


| Pourquoi utiliser un SBOM ? |  |  |
| --- | --- | --- |
| Sécurité | Conformité | Gouvernance |
| •  Identification rapide des<br>composants vulnérables<br>•  Réponse accélérée aux nouvelles<br>CVE<br>•  Amélioration de la visibilité sur la<br>Supply Chain | •  Gestion des licences open source<br>•  Réponse aux exigences réglementaires<br>•  Facilitation des audits | •  Inventaire logiciel centralisé<br>•  Suivi des versions utilisées<br>•  Gestion des risques fournisseurs |
| Un SBOM fournit la liste complète des composants d'un logiciel afin d'améliorer la visibilité, la sécurité et la |  |  |
| maîtrise de la chaîne d'approvisionnement logicielle. |  |  |




![Slide 250](/securite-cloud/10-securite-devsecops-cicd/p250_06_Image77.jpg)


## Comparatif des formats SBOM


|  | SPDX | CycloneDX | SWID |
| --- | --- | --- | --- |
| Origine | Linux Foundation (2010) | OWASP Foundation (2017) | ISO/IEC 19770-2 |
| Format principal | JSON, RDF, Tag-Value | JSON (recommandé), XML | XML |
| Orientation | Licences & conformité | Sécurité & Supply Chain | Inventaire logiciel |
| Standard | ISO/IEC 5962 | Standard OWASP | ISO/IEC 19770-2 |
| Points forts | Gestion des licences, conformité open source,<br>gouvernance | Vulnérabilités, VEX, dépendances, CI/CD, conteneurs | Gestion d'actifs, inventaire,<br>déploiement |
| Support CVE | Oui (moins riche) | Excellent support natif | Limité |
| Support VEX | Partiel | Natif | Non |
| Écosystème | GitHub, NTIA, conformité fournisseurs | AWS, Docker, GitHub, Trivy, Snyk, Dependency-Track | ITAM, SAM, grands SI |
| Points faibles | Plus verbeux et complexe | Moins centré sur les licences | Peu utilisé pour la sécurité<br>applicative |
| Cas d'usage idéal | Audit, conformité, licences | DevSecOps, SBOM sécurité, CI/CD | Inventaire logiciel d'entreprise |


## Choix du format



## Vulnerability exploitability exchange (vex) : Réduire le bruit

des CVEs
VEX permet au créateur d'un logiciel de communiquer si une CVE connue est réellement exploitable dans son produit.
Intégré nativement dans CycloneDX 1.4+.


## Dependency-Track : Plateforme de gestion continue des sboms


|  | Concept | Workflow intégré | Architecture |
| --- | --- | --- | --- |
| •  Plateforme SBOM-native (OWASP) :<br>ingère SPDX et CycloneDX<br>•  Corrèle chaque composant avec<br>NVD, OSV, VulnDB, GitHub Advisory<br>•  Alerte proactive : nouveau CVE =<br>notification immédiate<br>•  Dashboard de risque par projet /<br>équipe / organisation<br>•  API REST pour intégration CI/CD et<br>SIEM<br>•  Alternatives : Snyk (commercial) ·<br>Mend · FOSSA<br>•  éploiement : Docker self-hosted ou<br>Dependency-Track Cloud | •  Plateforme SBOM-native (OWASP) :<br>ingère SPDX et CycloneDX<br>•  Corrèle chaque composant avec<br>NVD, OSV, VulnDB, GitHub Advisory<br>•  Alerte proactive : nouveau CVE =<br>notification immédiate<br>•  Dashboard de risque par projet /<br>équipe / organisation<br>•  API REST pour intégration CI/CD et<br>SIEM<br>•  Alternatives : Snyk (commercial) ·<br>Mend · FOSSA<br>•  éploiement : Docker self-hosted ou<br>Dependency-Track Cloud | •  CI/CD génère SBOM (Syft/cdxgen) à<br>chaque build<br>•  Upload automatique vers<br>Dependency-Track (API)<br>•  D-Track corrèle avec toutes les bases CVE<br>•  Si CVE critique → webhook → alert<br>Slack/PagerDuty<br>•  VEX peut être émis directement depuis<br>D-Track<br>•  Tableau de bord CISO : risque agrégé par<br>portfolio<br>•  Historique : évolution du score de risque<br>dans le temps | •  Frontend : Vue.js SPA (UI de gestion<br>•  Backend : Quarkus (Java) REST API<br>•  Base de données : PostgreSQL<br>•  Message queue : Alpine (events asy<br>•  Intégrations : Jira · GitHub · GitLab<br>Slack · Teams<br>•  Auth : OIDC / LDAP / AD (SSO<br>enterprise)<br>•  Déploiement : docker-compose ou<br>Helm chart |


## La sécurité en continue

Approche consistant à surveiller, vérifier et améliorer en permanence la sécurité des systèmes, applications,
infrastructures et identités tout au long de leur cycle de vie.

![Slide 255](/securite-cloud/10-securite-devsecops-cicd/p255_07_Image78.jpg)


## Lambda, Step Functions, Cloud Run

Sans serveur, sans réseau traditionnel, sans OS à patcher mais avec une surface d'attaque radicalement différente centrée sur les permissions IAM et les déclencheurs d'événements.
Paradigme Serverless : Pas de serveur à gérer → Pas de port 22 → Pas d'OS à patcher. MAIS : chaque fonction = 1 identité IAM · chaque déclencheur = 1 vecteur d'attaque · chaque variable d'env = 1 risque de secret exposure.


## Sécurité du serverless

Le serverless réduit la gestion de l'infrastructure, mais déplace les risques vers les identités, les événements, les permissions, les dépendances, les secrets et l'observabilité.

| Dimension | Enjeu de sécurité |
| --- | --- |
| Identités d'exécution | Chaque fonction ou service serverless doit utiliser une identité dédiée avec des permissions minimales |
| Déclencheurs | Les sources capables d'invoquer une fonction doivent être strictement contrôlées |
| Événements | Les messages entrants doivent être filtrés, validés et limités pour éviter les traitements non prévus |
| Secrets | Les secrets ne doivent pas être stockés dans le code ou exposés dans les variables d'environnement |
| Dépendances | Les bibliothèques, layers, images ou packages utilisés par les fonctions doivent être scannés et maintenus |
| Réseau privé | Les fonctions doivent accéder aux ressources sensibles via VPC/VNet, points de terminaison privés ou connectivité maîtrisée |
| Journalisation | Les logs doivent permettre l'audit sans exposer de secrets, tokens ou données sensibles |
| Résilience | Retries, timeouts, quotas et dead-letter queues doivent éviter les boucles, pertes ou surcoûts |
| Surface d'attaque | APIs, points de terminaison publics, permissions excessives et intégrations événementielles deviennent les principaux points d'exposition |


## Secrets Management & architecture sécurisée Lambda

Une fonction Lambda ne doit jamais embarquer de secrets en dur : elle doit récupérer des secrets à la demande, avec une identité IAM limitée et des accès réseau contrôlés.

| Élément | Description |
| --- | --- |
| Principe | La fonction Lambda utilise son rôle IAM pour récupérer uniquement les secrets nécessaires |
| Stockage des secrets | AWS Secrets Manager ou Systems Manager Parameter Store |
| Accès aux secrets | Récupération dynamique, éventuellement avec cache via l'extension AWS Parameters and Secrets Lambda Extension |
| Permissions | Rôle IAM dédié, principe du moindre privilège, accès limité par secret, ressource et action |
| Réseau | Lambda placée dans un VPC si elle doit accéder à des ressources privées |
| Accès privé | VPC Endpoint / PrivateLink pour accéder à Secrets Manager sans passer par Internet public |
| Journalisation | Logs CloudWatch sans exposition de secrets dans les traces, erreurs ou variables affichées |

Cas d'usage :
- Connexion sécurisée à une base de données depuis Lambda
- Récupération d'un mot de passe, token API ou certificat depuis Secrets Manager
- Rotation centralisée des secrets sans redéployer le code
- Accès privé à une base RDS, un cache Redis ou une API interne
- Suppression des secrets stockés dans le code, les variables CI/CD ou les dépôts Git
- Contrôle fin des permissions par fonction Lambda


## Sécurité des architectures serverless et événementielles

Les orchestrateurs serverless (Step Functions, Cloud Run, EventBridge) enchaînent des fonctions. Une faille dans la chaîne = compromission de l'ensemble du pipeline.

| Composant serverless | Objectif de sécurité | AWS | Azure | GCP |
| --- | --- | --- | --- | --- |
| Source d'événement | Autoriser uniquement les événements issus de sources légitimes | S3, EventBridge, SNS | Event Grid, Blob Storage, Service Bus | Eventarc, Cloud Storage, Pub/Sub |
| Routage événementiel | Filtrer les événements pour éviter les déclenchements non prévus | EventBridge rules | Event Grid subscriptions | Eventarc triggers |
| Traitement serverless | Exécuter le traitement avec une identité dédiée et des droits minimaux | Lambda | Azure Functions | Cloud Functions, Cloud Run |
| Orchestration | Encadrer les étapes, conditions, erreurs, retries et compensations | Step Functions | Durable Functions, Logic Apps | Workflows |
| File / message broker | Découpler les traitements et absorber les pics sans perte d'événements | SQS, SNS | Service Bus, Storage Queues | Pub/Sub |
| Messages en échec | Isoler les événements non traités pour analyse, reprise ou investigation | SQS DLQ, EventBridge DLQ | Service Bus DLQ, Event Grid dead-letter | Pub/Sub dead-letter topic |
| Retries automatiques | Maîtriser les relances pour éviter doublons, boucles ou surconsommation | Lambda retries, EventBridge retries | Azure Functions retries, Event Grid retry policy | Eventarc retries, Pub/Sub retry policy |
| Payload événementiel | Limiter les données sensibles et valider le contenu avant traitement | Validation applicative, IAM, KMS | Managed identities, Key Vault, RBAC | IAM, Secret Manager, Cloud KMS |
| Traçabilité | Suivre le cycle complet d'un événement, du déclenchement au traitement | CloudWatch, X-Ray, CloudTrail | Monitor, Application Insights, Activity Logs | Cloud Logging, Cloud Trace, Audit Logs |


## Prêt pour lundi

| # | Action | Commande | Durée / Coût | Impact |
| --- | --- | --- | --- | --- |
| 1 | Installer Gitleaks en pre-commit hook | `pip install pre-commit && echo 'repos:\n- repo: https://github.com/gitleaks/gitleaks\n  hooks:\n - id: gitleaks' > .pre-commit-config.yaml` | 15 min / Gratuit | Bloque les secrets avant le commitcloud |
| 2 | Remplacer les clés statiques par OIDC federation | `# GitHub Actions: permissions: id-token: write + aws-actions/configure-aws-credentials@v4 avec role-to-assume` | 1h / Gratuit | Plus jamais de clé AWS dans votre pipeline (credentials temporaires uniquement) |
| 3 | Générer un SBOM sur votre application principale | `syft . -o cyclonedx-json > sbom.json && grype sbom:sbom.json` | 20 min / Gratuit | Inventaire de toutes vos dépendances + CVEs connues en une commande |
