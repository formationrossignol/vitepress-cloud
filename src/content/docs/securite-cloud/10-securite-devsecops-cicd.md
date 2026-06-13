---
title: "10. Sécurité DevSecOps & CI/CD"
---

# 10. Sécurité DevSecOps & CI/CD

## Pipeline DevSecOps Complet : Sécurité Shift-Left

Le Shift-Left consiste à intégrer les contrôles de qualité et de sécurité le plus tôt possible dans le cycle de
développement afin de détecter et corriger les problèmes avant la mise en production.

![Slide 232](/securite-cloud/10-securite-devsecops-cicd/p232_00_Image71.jpg)

## Static Application

Security Testing

## Static Application Security Testing (sast)

- Le SAST (Static Application Security Testing) analyse le code source , le bytecode (code intermédiaire entre les
instructions machines et le code source) ou les fichiers compilés afin de détecter des vulnérabilités de sécurité avant
l'exécution de l'application.
- Objectif : identifier les failles de sécurité le plus tôt possible dans le cycle de développement (Shift-Left).
- Ce que vérifie un SAST :
  - Injections SQL
  - Cross-Site Scripting (XSS)
  - Injections de commandes système
  - Contrôles d'accès défaillants
  - Gestion incorrecte des secrets
  - Validation insuffisante des entrées
  - Utilisation dangereuse d'API
  - Algorithmes ou configurations cryptographiques faibles
Outil Type
Semgrep Open source
SonarQube Qualité & sécurité
GitHub Advanced Security Intégré GitHub
Checkmarx Commercial
Fortify SCA Commercial
Veracode Static Analysis SaaS
CodeQL Open source (GitHub)

## FONCTIONNEMENT

![Slide 235](/securite-cloud/10-securite-devsecops-cicd/p235_01_Image72.jpg)

## DYNAMIC Application

Security Testing

## Dynamic Application Security Testing (Dast)

- Le DAST (Dynamic Application Security Testing) analyse une application en cours d'exécution afin d'identifier des
vulnérabilités exploitables depuis l'extérieur.
- Objectif : détecter les failles visibles par un attaquant sans accéder au code source.
- Ce que vérifie un DAST :
  - Injections SQL
  - Cross-Site Scripting (XSS)
  - Authentification faible
  - Contrôles d'accès défaillants
  - Mauvaises configurations HTTP
  - Exposition d'informations sensibles
  - Vulnérabilités des API
  - Erreurs de gestion des sessions
Outil Type
OWASP ZAP Open source
Burp Suite Référence du marché
Invicti (Netsparker) Commercial
Acunetix Commercial
Rapid7 InsightAppSec SaaS
StackHawk Cloud Native

## FONCTIONNEMENT

![Slide 238](/securite-cloud/10-securite-devsecops-cicd/p238_02_Image73.jpg)

## Nuclei : Scanner de Vulnérabilités Applicatives

Concept Détecte Cas d'usage cloud
- Outil open source développé par
ProjectDiscovery
- Scanner de vulnérabilités basé sur
des templates YAML
- Fonctionne comme un DAST léger
et automatisable
- Très utilisé en prime aux bogues,
pentest et CI/CD
- Plus de 8 000 templates
communautaires
- Vulnérabilités connues (CVE)
- Mauvaises configurations
- Secrets exposés
- Endpoints sensibles
- Headers de sécurité manquants
- Expositions cloud (S3, Kubernetes,
API, etc.)
- Scan d'API REST et GraphQL
- Vérification de buckets S3 publics
- Détection d'API Gateway exposées
- Contrôle d'environnements
Kubernetes
- Validation de services cloud
accessibles depuis Internet
- Contrôle de sécurité avant mise en
production

## FONCTIONNEMENT

![Slide 241](/securite-cloud/10-securite-devsecops-cicd/p241_03_Image74.jpg)

## Software Composition Anal ysis

- Le Software Composition Analysis (SCA) consiste à analyser les bibliothèques et dépendances
open source utilisées par une application afin d'identifier les vulnérabilités connues, les
composants obsolètes et les risques liés à la chaîne d'approvisionnement logicielle.
- Objectif : détecter et corriger les vulnérabilités introduites indirectement par les dépendances
tierces.
Ce que vérifie un SCA Dépendances directes et transitives
- Dépendances directes et transitives
- Versions utilisées
- Vulnérabilités connues (CVE)
- Composants obsolètes
- Licences open source
- Présence dans un SBOM
Mon application
    └── express
Mon application
    └── express
            ├── body-parser
            ├── send
            └── debug

## Fonctionnement

![Slide 244](/securite-cloud/10-securite-devsecops-cicd/p244_04_Image75.jpg)

## Comparaison de solutions

Snyk Dependabot OWASP Dependency-Check
Version gratuite et payante Intégré nativement à GitHub Open source
Plugin VS Code et IntelliJ Création automatique de Pull Requests Support multi-langages
Analyse des dépendances et CVE Détection des dépendances vulnérables Analyse basée sur les bases
NVD/CVE
Contrôles dans les Pull Requests Mise à jour automatique des versions
vulnérables
Calcul des scores CVSS
Correctifs automatiques via Pull
Requests
Intégration GitHub simple Intégration CI/CD
Support conteneurs, IaC et code Focalisé sur les dépendances GitHub Rapports détaillés de vulnérabilités
Approche DevSecOps complète Solution simple et automatisée Référence open source pour le SCA

## RENOVATE : gestion automatisée des dépendances

- Renovate est un outil open source qui automatise la mise à jour des dépendances
logicielles en créant des Pull Requests lorsqu'une nouvelle version est disponible.
- Objectif : maintenir les dépendances à jour et réduire l'exposition aux vulnérabilités
connues.
- Fonctionnalités clés :
  - Détection automatique des nouvelles versions
  - Création de Pull Requests de mise à jour
  - Regroupement intelligent des mises à jour
  - Planification des mises à jour (quotidienne, hebdomadaire…)
  - Support multi-écosystèmes
  - Intégration GitHub, GitLab, Azure DevOps, Bitbucket
https://github.com/renovatebot/renovate

## RENOVATE : Fonctionnement

![Slide 247](/securite-cloud/10-securite-devsecops-cicd/p247_05_Image76.jpg)

## Software Bill of Materials (SBOM)

Un SBOM fournit la liste complète des composants d'un logiciel afin d'améliorer la visibilité, la sécurité et la
maîtrise de la chaîne d'approvisionnement logicielle.
- Le Software Bill of Materials (SBOM) est un inventaire structuré de tous les composants logiciels utilisés dans une
application : bibliothèques, dépendances, frameworks, conteneurs et métadonnées associées.
- Objectif : connaître précisément ce qui compose un logiciel afin d'améliorer sa sécurité, sa conformité et sa
traçabilité.
 Pourquoi utiliser un SBOM ?
Sécurité Conformité Gouvernance
- Identification rapide des
composants vulnérables
- Réponse accélérée aux nouvelles
CVE
- Amélioration de la visibilité sur la
Supply Chain
- Gestion des licences open source
- Réponse aux exigences réglementaires
- Facilitation des audits
- Inventaire logiciel centralisé
- Suivi des versions utilisées
- Gestion des risques fournisseurs

## Fonctionnement

![Slide 250](/securite-cloud/10-securite-devsecops-cicd/p250_06_Image77.jpg)

## Comparatif des Formats SBOM

SPDX CycloneDX SWID
Origine Linux Foundation (2010) OWASP Foundation (2017) ISO/IEC 19770-2
Format principal JSON, RDF, Tag-Value JSON (recommandé), XML XML
Orientation Licences & conformité Sécurité & Supply Chain Inventaire logiciel
Standard ISO/IEC 5962 Standard OWASP ISO/IEC 19770-2
Points forts Gestion des licences, conformité open source,
gouvernance
Vulnérabilités, VEX, dépendances, CI/CD, conteneurs Gestion d'actifs, inventaire,
déploiement
Support CVE Oui (moins riche) Excellent support natif Limité
Support VEX Partiel Natif Non
Écosystème GitHub, NTIA, conformité fournisseurs AWS, Docker, GitHub, Trivy, Snyk, Dependency-Track ITAM, SAM, grands SI
Points faibles Plus verbeux et complexe Moins centré sur les licences Peu utilisé pour la sécurité
applicative
Cas d'usage idéal Audit, conformité, licences DevSecOps, SBOM sécurité, CI/CD Inventaire logiciel d'entreprise

## Choix du format

- CycloneDX = Recommandé pour les projets DevSecOps et Cloud Native
- SPDX = Recommandé pour la conformité et les licences open source
- SWID = Recommandé pour l'inventaire logiciel et la gestion d'actifs
Aujourd'hui, dans les pipelines modernes (Trivy, Syft, Dependency-Track, Snyk, GitHub, Docker), CycloneDX est
généralement le format SBOM privilégié, tandis que SPDX reste la référence pour les exigences
réglementaires et de conformité. SWID est beaucoup moins présent dans les chaînes DevSecOps.

## Vulnerability Exploitability eXchange (vex) : Réduire le bruit

des CVEs
VEX permet au créateur d'un logiciel de communiquer si une CVE connue est réellement exploitable dans son produit.
Intégré nativement dans CycloneDX 1.4+.

## Dependency-Track : Plateforme de Gestion Continue des SBOMs

Dependency-Track ingère vos SBOMs, les corrèle avec NVD/OSV/GitHub Advisory et vous alerte dès qu'un nouveau
CVE impacte un composant déjà inventorié.
Concept Workflow intégré Architecture
- Plateforme SBOM-native (OWASP) :
ingère SPDX et CycloneDX
- Corrèle chaque composant avec
NVD, OSV, VulnDB, GitHub Advisory
- Alerte proactive : nouveau CVE =
notification immédiate
- Dashboard de risque par projet /
équipe / organisation
- API REST pour intégration CI/CD et
SIEM
- Alternatives : Snyk (commercial) ·
Mend · FOSSA
- éploiement : Docker self-hosted ou
Dependency-Track Cloud
- CI/CD génère SBOM (Syft/cdxgen) à
chaque build
- Upload automatique vers
Dependency-Track (API)
- D-Track corrèle avec toutes les bases CVE
- Si CVE critique → webhook → alert
Slack/PagerDuty
- VEX peut être émis directement depuis
D-Track
- Tableau de bord CISO : risque agrégé par
portfolio
- Historique : évolution du score de risque
dans le temps
- Frontend : Vue.js SPA (UI de gestion)
- Backend : Quarkus (Java) REST API
- Base de données : PostgreSQL
- Message queue : Alpine (events async)
- Intégrations : Jira · GitHub · GitLab ·
Slack · Teams
- Auth : OIDC / LDAP / AD (SSO
enterprise)
- Déploiement : docker-compose ou K8s
Helm chart

## LA Sécurité en continue

Approche consistant à surveiller, vérifier et améliorer en permanence la sécurité des systèmes, applications,
infrastructures et identités tout au long de leur cycle de vie.

![Slide 255](/securite-cloud/10-securite-devsecops-cicd/p255_07_Image78.jpg)

## Lambda, Step Functions, Cloud Run

Sans serveur, sans réseau traditionnel, sans OS à patcher mais avec une surface d'attaque radicalement différente centrée sur les
permissions IAM et les déclencheurs d'événements.
Paradigme Serverless : Pas de serveur à gérer → Pas de port 22 → Pas de OS à patcher. MAIS : chaque fonction = 1 identité IAM · chaque
déclencheur = 1 vecteur d'attaque · chaque variable d'env = 1 risque de secret exposure.

## Step Functions, Cloud Run & Event-Driven Architecture

Les orchestrateurs serverless (Step Functions, Cloud Run, EventBridge) enchaînent des Lambdas. Une faille dans la chaîne = compromission
de l'ensemble du pipeline.

## Prêt pour lundi

Installer Gitleaks en pre-commit hook
pip install pre-commit && echo 'repos:\n- repo: https://github.com/gitleaks/gitleaks\n  hooks:\n
- id: gitleaks' > .pre-commit-config.yaml
< 15 min / Gratuit / Bloque les secrets avant le commitcloud
Remplacer les clés statiques par OIDC federation
# GitHub Actions: permissions: id-token: write + aws-actions/configure-aws-credentials@v4 avec
role-to-assume
< 1h / Gratuit / Plus jamais de clé AWS dans votre pipeline (credentials temporaires uniquement)
Générer un SBOM sur votre application principale
syft . -o cyclonedx-json > sbom.json && grype sbom:sbom.json
< 20 min / Gratuit / Inventaire de toutes vos dépendances + CVEs connues en une commande

## LAB : Sécurité DevSecOps & CI/CD

dhdfhfgh
