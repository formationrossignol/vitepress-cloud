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


| •  Le SAST (Static Application Security Testing) analyse le code source , le bytecode (code intermédiaire entre les<br>instructions machines et le code source) ou les fichiers compilés afin de détecter des vulnérabilités de sécurité avant<br>l'exécution de l'application.<br>•  Objectif : identifier les failles de sécurité le plus tôt possible dans le cycle de développement (Shift-Left).<br>•  Ce que vérifie un SAST :<br>Outil Type<br>  ◦  Injections SQL<br>  ◦  Cross-Site Scripting (XSS)<br>Semgrep Open source<br>  ◦  Injections de commandes système<br>  ◦  Contrôles d'accès défaillants<br>SonarQube Qualité & sécurité<br>  ◦  Gestion incorrecte des secrets<br>  ◦  Validation insuffisante des entrées GitHub Advanced Security Intégré GitHub<br>  ◦  Utilisation dangereuse d'API<br>Checkmarx Commercial<br>  ◦  Algorithmes ou configurations cryptographiques faibles<br>Fortify SCA Commercial<br>Veracode Static Analysis SaaS |  |  |  |
| --- | --- | --- | --- |
|  | Outil | Type |  |
|  | Semgrep | Open source |  |
|  | SonarQube | Qualité & sécurité |  |
|  | GitHub Advanced Security | Intégré GitHub |  |
|  | Checkmarx | Commercial |  |
|  | Fortify SCA | Commercial |  |
|  | Veracode Static Analysis | SaaS |  |
|  | CodeQL | Open source (GitHub)<br>2 |  |
|  |  |  | 2 |


## Fonctionnement


![Slide 235](/securite-cloud/10-securite-devsecops-cicd/p235_01_Image72.jpg)


## Dynamic application

Security Testing


## Dynamic application security testing (DAST)


| •  Le DAST (Dynamic Application Security Testing) analyse une application en cours d'exécution afin d'identifier des<br>vulnérabilités exploitables depuis l'extérieur.<br>•  Objectif : détecter les failles visibles par un attaquant sans accéder au code source.<br>•  Ce que vérifie un DAST :<br>  ◦  Injections SQL<br>  ◦  Cross-Site Scripting (XSS) Outil Type<br>  ◦  Authentification faible<br>  ◦  Contrôles d'accès défaillants OWASP ZAP Open source<br>  ◦  Mauvaises configurations HTTP<br>Burp Suite Référence du marché<br>  ◦  Exposition d'informations sensibles<br>  ◦  Vulnérabilités des API<br>Invicti (Netsparker) Commercial<br>  ◦  Erreurs de gestion des sessions<br>Acunetix Commercial<br>Rapid7 InsightAppSec SaaS<br>StackHawk Cloud Native |  |  |
| --- | --- | --- |
|  | Outil | Type |
|  | OWASP ZAP | Open source |
|  | Burp Suite | Référence du marché |
|  | Invicti (Netsparker) | Commercial |
|  | Acunetix | Commercial |
|  | Rapid7 InsightAppSec | SaaS |
|  | StackHawk | Cloud Native |




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


| •  Le Software Bill of Materials (SBOM) est un inventaire structuré de tous les composants logiciels utilisés dans une<br>application : bibliothèques, dépendances, frameworks, conteneurs et métadonnées associées.<br>•  Objectif : connaître précisément ce qui compose un logiciel afin d'améliorer sa sécurité, sa conformité et sa<br>traçabilité. |  |  |
| --- | --- | --- |
| Pourquoi utiliser un SBOM ? |  |  |
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
| Cas d'usage idéal | Audit, conformité, licences | DevSecOps, SBOM sécurité, CI/CD | Inventaire logiciel d'entreprise<br>2 |


## Choix du format


| •  CycloneDX = Recommandé pour les projets DevSecOps et Cloud Native<br>•  SPDX = Recommandé pour la conformité et les licences open source<br>•  SWID = Recommandé pour l'inventaire logiciel et la gestion d'actifs |
| --- |
| Aujourd'hui, dans les pipelines modernes (Trivy, Syft, Dependency-Track, Snyk, GitHub, Docker), CycloneDX est<br>généralement le format SBOM privilégié, tandis que SPDX reste la référence pour les exigences<br>réglementaires et de conformité. SWID est beaucoup moins présent dans les chaînes DevSecOps. |


## Vulnerability exploitability exchange (vex) : Réduire le bruit

des CVEs
VEX permet au créateur d'un logiciel de communiquer si une CVE connue est réellement exploitable dans son produit.
Intégré nativement dans CycloneDX 1.4+.


## Dependency-Track : Plateforme de gestion continue des sboms


|  | Dependency-Track ingère vos SBOMs, les corrèle avec NVD/OSV/GitHub Advisory et vous alerte dès qu'un nouveau<br>CVE impacte un composant déjà inventorié. |  |  |
| --- | --- | --- | --- |
|  | Concept | Workflow intégré | Architecture |
| •  Plateforme SBOM-native (OWASP) :<br>ingère SPDX et CycloneDX<br>•  Corrèle chaque composant avec<br>NVD, OSV, VulnDB, GitHub Advisory<br>•  Alerte proactive : nouveau CVE =<br>notification immédiate<br>•  Dashboard de risque par projet /<br>équipe / organisation<br>•  API REST pour intégration CI/CD et<br>SIEM<br>•  Alternatives : Snyk (commercial) ·<br>Mend · FOSSA<br>•  éploiement : Docker self-hosted ou<br>Dependency-Track Cloud | •  Plateforme SBOM-native (OWASP) :<br>ingère SPDX et CycloneDX<br>•  Corrèle chaque composant avec<br>NVD, OSV, VulnDB, GitHub Advisory<br>•  Alerte proactive : nouveau CVE =<br>notification immédiate<br>•  Dashboard de risque par projet /<br>équipe / organisation<br>•  API REST pour intégration CI/CD et<br>SIEM<br>•  Alternatives : Snyk (commercial) ·<br>Mend · FOSSA<br>•  éploiement : Docker self-hosted ou<br>Dependency-Track Cloud | •  CI/CD génère SBOM (Syft/cdxgen) à<br>chaque build<br>•  Upload automatique vers<br>Dependency-Track (API)<br>•  D-Track corrèle avec toutes les bases CVE<br>•  Si CVE critique → webhook → alert<br>Slack/PagerDuty<br>•  VEX peut être émis directement depuis<br>D-Track<br>•  Tableau de bord CISO : risque agrégé par<br>portfolio<br>•  Historique : évolution du score de risque<br>dans le temps | •  Frontend : Vue.js SPA (UI de gestion<br>•  Backend : Quarkus (Java) REST API<br>•  Base de données : PostgreSQL<br>•  Message queue : Alpine (events asy<br>•  Intégrations : Jira · GitHub · GitLab<br>Slack · Teams<br>•  Auth : OIDC / LDAP / AD (SSO<br>enterprise)<br>•  Déploiement : docker-compose ou<br>Helm chart |


## La sécurité en continue

Approche consistant à surveiller, vérifier et améliorer en permanence la sécurité des systèmes, applications,
infrastructures et identités tout au long de leur cycle de vie.

![Slide 255](/securite-cloud/10-securite-devsecops-cicd/p255_07_Image78.jpg)


## Lambda, step functions, cloud run

Sans serveur, sans réseau traditionnel, sans OS à patcher mais avec une surface d'attaque radicalement différente centrée sur les
permissions IAM et les déclencheurs d'événements.
Paradigme Serverless : Pas de serveur à gérer → Pas de port 22 → Pas de OS à patcher. MAIS : chaque fonction = 1 identité IAM · chaque
déclencheur = 1 vecteur d'attaque · chaque variable d'env = 1 risque de secret exposure.


## Step functions, cloud run & event-driven architecture

Les orchestrateurs serverless (Step Functions, Cloud Run, EventBridge) enchaînent des Lambdas. Une faille dans la chaîne = compromission
de l'ensemble du pipeline.


## Prêt pour lundi

| # | Action | Commande | Durée / Coût | Impact |
| --- | --- | --- | --- | --- |
| 1 | Installer Gitleaks en pre-commit hook | `pip install pre-commit && echo 'repos:\n- repo: https://github.com/gitleaks/gitleaks\n  hooks:\n - id: gitleaks' > .pre-commit-config.yaml` | 15 min / Gratuit | Bloque les secrets avant le commitcloud |
| 2 | Remplacer les clés statiques par OIDC federation | `# GitHub Actions: permissions: id-token: write + aws-actions/configure-aws-credentials@v4 avec role-to-assume` | 1h / Gratuit | Plus jamais de clé AWS dans votre pipeline (credentials temporaires uniquement) |
| 3 | Générer un SBOM sur votre application principale | `syft . -o cyclonedx-json > sbom.json && grype sbom:sbom.json` | 20 min / Gratuit | Inventaire de toutes vos dépendances + CVEs connues en une commande |

## LAB : Sécurité DevSecOps & CI/CD

dhdfhfgh

