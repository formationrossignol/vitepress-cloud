---
title: "03. Les menaces cloud"
---

# 03. Les menaces cloud

## Les Common vulnerabilities and Exposures (CVE)

Une CVE est un identifiant standardisé attribué à une vulnérabilité de cybersécurité publiquement connue. Elle permet de
désigner une faille de manière unique et partagée entre les éditeurs, les outils de sécurité, les équipes SOC, les scanners et
les bases de vulnérabilités. Le programme CVE a pour mission d’identifier, définir et cataloguer les vulnérabilités
publiquement divulguées.
Élément Description
CVE Identifiant unique d’une vulnérabilité connue
Format CVE-année-numéro, par exemple CVE-2021-44228
Rôle Référencer une faille de manière standardisée
Contenu Description, produit concerné, références, statut
Usage sécurité Détection, priorisation, correction et reporting
Source d’enrichissement NVD, éditeurs, CERT, bulletins de sécurité, outils de scan

## cycle de traitement d’une CVE

![Slide 48](/securite-cloud/03-menaces-cloud/p048_00_Image30.jpg)

## Common Vulnerability Scoring System

Le CVSS est un standard ouvert qui permet de décrire les caractéristiques principales d’une vulnérabilité et de produire un score numérique de
sévérité.
Élément Description
Rôle Évaluer la sévérité technique d’une vulnérabilité
Score ● 0.0 : None
- 0.1-3.9 : Low
- 4.0-6.9 : Medium
- 7.0-8.9 : High
- 9.0-10.0 : Critical
Version actuelle CVSS v4.0
Utilisation Aide à prioriser les vulnérabilités, sans remplacer l’analyse du risque réel
- La NVD (National Vulnerability Database) précise que CVSS fournit une mesure qualitative de sévérité, mais que ce n’est pas une mesure du
risque. Le risque dépend aussi de l’exposition, de l’exploitabilité réelle, des actifs concernés, des compensating controls et du contexte
métier.
- La NVD est une base de données de vulnérabilités maintenue par le NIST. Elle reprend les CVE publiées et les enrichit avec des scores CVSS,
des références, des produits affectés et des classifications CWE.

## Common Weakness Enumeration

Common Weakness Enumeration (CWE) est un référentiel qui classe les types de faiblesses logicielles ou matérielles pouvant
conduire à des vulnérabilités. MITRE le décrit comme une liste communautaire de faiblesses pouvant apparaître dans
l’architecture, la conception, le code ou l’implémentation d’un produit.
CWE Type de faiblesse Exemple
CWE-79 Cross-Site Scripting Entrée utilisateur injectée dans une page web
CWE-89 SQL Injection Requête SQL construite avec une entrée non filtrée
CWE-22 Path Traversal Accès à un fichier via ../
CWE-287 Improper Authentication Authentification mal implémentée
CWE-798 Hard-coded Credentials Mot de passe codé en dur
CWE-352 Cross-Site Request Forgery Requête déclenchée à l’insu de l’utilisateur
https://cwe.mitre.org/data/index.html

## Synthèse

Notion Signification Question associée Rôle Exemple
CVE Common Vulnerabilities
and Exposures
Quelle vulnérabilité précise a été
identifiée ?
Identifie une
vulnérabilité connue
CVE-2021-44228 pour
Log4Shell
CVSS Common Vulnerability
Scoring System
Quelle est la sévérité de cette
vulnérabilité ?
Évalue la gravité d’une
vulnérabilité
Score 9.8 Critical
CWE Common Weakness
Enumeration
Quel type de faiblesse est à l’origine
du problème ?
Classe le type de
faiblesse logicielle
CWE-89 pour SQL
Injection

## gestion des vulnérabilités cloud : vulnerabil y management program

(VMP)
Trouver, prioriser et corriger les failles avant l'attaquant. Un CVE non patché en prod = une fenêtre d'opportunité
ouverte.

![Slide 52](/securite-cloud/03-menaces-cloud/p052_01_Image31.jpg)

## gestion des vulnérabilités cloud : vulnerabil y management program

(VMP)

![Slide 53](/securite-cloud/03-menaces-cloud/p053_02_Image32.jpg)

## cycle de traitement d’une CVE vs VPM

Élément Niveau Rôle
CVE Vulnérabilité
individuelle
Identifie une faille connue à traiter
Cycle de traitement
d’une CVE
Processus
opérationnel
Décrit comment une CVE est découverte, évaluée, corrigée puis
vérifiée
Vulnerability
Management Program
Programme
global
Organise la gestion continue de toutes les vulnérabilités : inventaire,
scan, priorisation, remédiation, suivi

## Outils de Gestion des Vulnérabilités

Chaque couche de votre stack nécessite un outil spécifique. L'objectif : 0 CVE critique non détecté.
Infrastructure cloud Containers et images
- AWS Inspector : scan EC2, Lambda, ECR continu et
automatique
- Microsoft Defender for Cloud : vulnerability assessment
intégré Azure
- GCP Security Command Center : findings de
vulnérabilités GCP natifc
- Trivy (Aqua) : scanner images Docker : CVE + mauvaises
configs + secrets
- Grype (Anchore) : scan SBOM CycloneDX/SPDX contre
NVD + OSV + GitHub
- Snyk Container : scan + fix suggestions + monitoring en
continu
Code et dépendances IaC & Configuration
- Dependabot / Renovate :  mise à jour automatique des
dépendances vulnérables
- OWASP Dependency-Check / Snyk SCA : analyse
Software Composition
- GitHub Advanced Security : alertes CVE directement
dans les PRsdé
- tfsec / Checkov : détection misconfigurations
Terraform, CloudFormation, Bicep
- Prowler : 300+ checks AWS CIS Benchmark, PCI-DSS,
HIPAA en CLI/SaaS
- KICS (Checkmarx) : scan multi-IaC : Terraform, Docker,
K8s, Ansible

## CSA Top 11 : LEs Principales Menaces Cloud (Egregious Eleven)

1. Violations de données (Data Breaches)
2. Mauvaise configuration & contrôles inadéquats
3. Absence d'architecture et stratégie de sécurité cloud
4. Gestion insuffisante des identités et accès
5. Détournement de comptes (Account Hijacking)
6. Menaces internes (Insider Threats)
7. Interfaces et APIs non sécurisées
8. Surfaces d'attaque cloud faiblement contrôlées
9. Erreurs de métastructure et de plateforme
10. Visibilité et contrôle cloud limités
11. Abus et utilisation malveillante du cloud

## mauvaise configuration : Source #1 des incidents cloud

80% des incidents cloud sont causés par des erreurs de configuration côté client - Gartner 2024.
Bucket S3 / Blob Storage public Security Group trop ouvert
ACL public-read · Bucket policy sans restriction d'IP ·
Absence de Block Public Access · Log désactivé
0.0.0.0/0 en inbound sur port 22 (SSH), 3389 (RDP),
3306 (MySQL) · All traffic autorisé entre subnets
Credentials en clair dans le code Compte root / admin sans MFA
AWS_ACCESS_KEY dans GitHub · Password DB en clair
dans Dockerfile · Secrets dans les logs d'application
Console AWS sans MFA · Compte Global Admin Azure
non protégé · Root account utilisé au quotidien
Logs désactivés Chiffrement non activé par défaut
CloudTrail non activé dans toutes les régions · Logs S3
non activés · Durée rétention insuffisante (<1 an)
Volume EBS non chiffré · Bucket S3 sans SSE · RDS sans
encryption at rest · Snapshots non chiffrés

## Ransomwares ciblés cloud

- Ce qui change avec le cloud : APIs accessibles depuis Internet, automatisation massive des infrastructures,
permissions IAM souvent excessives, environnements hybrides complexes, sauvegardes cloud également ciblées,
etc.
- Objectifs des attaquants : Chiffrer les workloads et données, exfiltrer les données sensibles, désactiver les
sauvegardes, voler des credentials cloud, compromettre IAM / CI-CD / Kubernetes, etc.
- Kill Chain typique (enchaînement des étapes d’une attaque) :
  - Phishing
  - Vol de credentials
  - Escalade de privilèges
  - Mouvement latéral
  - Désactivation des backups
  - Exfiltration des données
  - Chiffrement / Double extorsion
Le ransomware moderne ne cible plus uniquement les postes utilisateurs : il vise désormais toute
l’infrastructure cloud.

## Ransomwares ciblés cloud

![Slide 59](/securite-cloud/03-menaces-cloud/p059_03_Image33.jpg)

## LE Shadow IT c’est quoi ?

- Le Shadow IT ou informatique parallèle est l’utilisation de systèmes, d’appareils, de logiciels,
d’applications et de services informatiques qui n’ont pas reçu l’approbation explicite du
service informatique.
- Il a connu une croissance exponentielle ces dernières années avec l’adoption
d’applications et de services basés dans le cloud.
- Si le Shadow IT peut améliorer la productivité des employés et stimuler l’innovation, il peut
également introduire de sérieux risques de sécurité dans votre entreprise par le biais de
fuites de données, de violations potentielles de la conformité, etc.

## Risques

- Fuite ou perte de données sensibles
- Utilisation d’outils non sécurisés ou non maîtrisés
- Non-conformité réglementaire (RGPD, NIS2, etc.)
- Multiplication des accès et comptes non contrôlés
- Absence de supervision, logs et traçabilité
- Fragmentation et dispersion des données
- Mauvaise gestion des identités et permissions
- Introduction de malwares ou applications malveillantes
- Dépendance à des services SaaS non validés
- Difficulté de gouvernance et d’inventaire IT
- Risques réputationnels en cas d’incident
- Coûts cachés et duplication des solutions IT

## LE Shadow AI c’est quoi ?

- Le Shadow AI désigne les usages d’intelligence artificielle qui apparaissent en dehors du
cadre officiel de l’entreprise : comptes personnels, outils non validés, extensions de
navigateur, copilotes, modèles externes ou fonctionnalités IA intégrées à des SaaS.
- Ce phénomène progresse vite, car les collaborateurs peuvent accéder en quelques
secondes à des assistants capables de rédiger, résumer, coder, analyser ou automatiser
une partie de leur travail.
- Le gain est réel, mais le risque l’est aussi : données confidentielles envoyées à des services
non maîtrisés, code source exposé, décisions appuyées sur des réponses fausses,
traitements non conformes, absence de traçabilité et perte de contrôle sur les usages
métiers.

## Risques

- Fuite de données sensibles vers des services externes
- Exposition de code source, secrets ou informations internes
- Non-conformité RGPD, NIS2 ou politiques internes
- Réponses erronées ou hallucinations utilisées comme vérité
- Absence de traçabilité et d’audit des usages IA
- Dépendance à des modèles ou fournisseurs non maîtrisés
- Réutilisation des données saisies pour l’entraînement des modèles
- Contournement des contrôles sécurité et de gouvernance
- Génération de contenu ou code vulnérable
- Risque juridique, réputationnel et propriété intellectuelle
- Multiplication d’outils IA non validés dans l’entreprise
- Shadow SaaS et fragmentation des données aggravés par l’IA

## Quelques statistiques sur le Shadow IT/AI

Thème Source
Applications cloud non
gérées / Shadow IT
Les entreprises utilisent en moyenne 1 295 applications et services
cloud, avec moins de 2 % administrés par l’IT.
Netskope, page “Shadow IT and Unmanaged Cloud
Protection”. (Netskope)
Shadow AI 72 % de l’usage GenAI en entreprise relève du Shadow IT, souvent via
des comptes personnels.
Netskope, Cloud and Threat Report: Generative AI 2025.
(Netskope)
Adoption GenAI 90 % des organisations utilisent des applications GenAI, et 98 %
utilisent des applications intégrant des fonctionnalités GenAI.
Netskope, Cloud and Threat Report: Generative AI 2025.
(Netskope)
Risque de fuite via apps
personnelles
60 % des incidents de menace interne impliquent des instances
personnelles d’applications cloud.
Netskope, Cloud and Threat Report: 2026. (Netskope)
Applications non autorisées 52 % des employés déclarent avoir téléchargé des applications non
autorisées.
1Password, cité par TechRadar, 2025. (TechRadar)
Données confidentielles
dans l’IA
Environ 38 % des employés déclarent partager des données
confidentielles avec des plateformes IA sans approbation.
Cloud Security Alliance citant une recherche CybSafe /
NCA. (cloudsecurityalliance.org)
Malware via cloud /
plateformes légitimes
En Europe, Netskope observe que 16 % des organisations subissent
chaque mois des téléchargements de malwares depuis GitHub.
Netskope, Threat Labs Report: Europe 2025. (Netskope)

## Attaques Suppl y Chain : Compromission de la Chaîne

d'Approvisionnement
Définition : Compromission d'un composant tiers (bibliothèque, outil, fournisseur) utilisé dans votre processus
de build ou livraison. L'attaquant vise un fournisseur pour atteindre ses clients. Impact en cascade sur tous les
utilisateurs du composant.
SolarWinds (2020) CodeCov (2021) Log4Shell (2021) XZ Utils (2024)
Mise à jour Orion IT
compromettante ·
18.000 clients touchés
dont des agences US
gouvernementales ·
Attribué à APT29
(Cozy Bear)
Script bash
compromis dans
l'image Docker · Vol
de variables
d'environnement
CI/CD · Credentials
AWS, GitHub tokens
exfiltrés
CVE-2021-44228 dans
Log4j (Java) · Présent
dans des milliers
d'applications · RCE
sans auth — CVSS
10.0 (score maximal)
Backdoor injectée via
contribution open
source sur 2 ans ·
Ciblait SSH sur Linux ·
Découverte par
hasard via benchmark
CPU

## Menaces Internes (Insider Threats)

Risque de sécurité provenant de l'intérieur de l'organisation : employés malveillants, comptes compromis,
erreurs involontaires. Particulièrement dangereux car l'accès est souvent légitime au départ.
Rôles surdimensionnés
(Over-permissioned) : utilisateurs avec plus de droits que nécessaire
→ violation du Least Privilege
Credentials compromis clés AWS en clair dans GitHub · tokens non rotés · accès partagés
sans traçabilité
Absence de MFA Comptes admin sans MFA → cible prioritaire phishing / brute force
Détection
comportementale
AWS GuardDuty, Azure Defender for Identity, Google Chronicle :
connexions inhabituelles, volume d'accès excessif, heure atypique
Contrôles Revues régulières des accès IAM · Alerte sur création de nouvelles
clés root · Monitoring des téléchargements massifs

## OWASP Top 10 : 2025 : Mapping Cloud Security

A01:2025 - Contrôle d’accès défaillant IAM sur-privilégié, rôles administrateur excessifs, bucket S3 public, accès inter-comptes mal maîtrisé
A02:2025 - Mauvaise configuration de sécurité Security Groups ouverts, CloudTrail désactivé, services exposés publiquement, configurations par défaut
dangereuses
A03:2025 - Défaillances de la chaîne
d’approvisionnement logicielle
Images Docker non signées, dépendances vulnérables, pipeline CI/CD compromis, artefacts non vérifiés
A04:2025 - Défaillances cryptographiques Secrets en clair, chiffrement absent, KMS mal configuré, mauvaise gestion des clés
A05:2025 - Injection Injection SQL dans API/Lambda, command injection dans containers, template injection dans l’IaC
A06 :2025 - Conception non sécurisée Absence de threat modeling, architecture sans Zero Trust, Landing Zone mal conçue, absence de least privilege
A07:2025 - Défaillances d’authentification MFA absent, fatigue MFA, attaque AiTM, mauvaise configuration OIDC/SAML, tokens non expirés
A08:2025 - Défaillances d’intégrité logicielle et des
données
Artifacts non signés, SBOM absent, drift Terraform, provenance logicielle non vérifiée
A09 :2025 - Défaillances de journalisation et de
supervision
Logs CloudTrail absents, SIEM non centralisé, alertes absentes, MTTD trop élevé
A10:2025 - Mauvaise gestion des conditions
exceptionnelles
Fail-open, erreurs silencieuses dans Lambda/API Gateway, timeouts mal gérés, rollback impossible

## Architecture Zero Trust

Idée clé Description
Principe Aucun utilisateur, terminal, application ou réseau n’est considéré comme fiable par défaut
Décision
d’accès
Chaque demande est évaluée selon l’identité, le terminal, le contexte, le risque et les politiques
Contrôle L’accès est accordé uniquement au strict nécessaire, pour une durée limitée
Surveillance Les sessions, comportements, logs et événements alimentent une réévaluation continue
Objectif Réduire la confiance implicite et limiter l’impact d’un compte, terminal ou service compromis
"Never trust, always verify"
Le Zero Trust remplace la confiance accordée au réseau par une décision d’accès continue, contextuelle et fondée sur
le risque.

## Architecture Zero Trust : NIST 800-207

PDP (Policy Decision Point) = décide / PEP (Policy Enforcement Point)= applique.
Le NIST SP 800-207 formalise l’architecture Zero Trust autour d’un principe simple : chaque demande d’accès est évaluée
dynamiquement par un moteur de décision, puis appliquée par un point de contrôle avant d’atteindre la ressource.

![Slide 71](/securite-cloud/03-menaces-cloud/p071_04_Image35.jpg)

## BeyondCorp (google) : exemple d’implémentation réelle

BeyondCorp illustre le passage d’une sécurité fondée sur le réseau interne à une sécurité fondée sur l’identité, le
terminal et le contexte d’accès.

![Slide 72](/securite-cloud/03-menaces-cloud/p072_05_Image36.jpg)

## CISA Zero Trust Maturity Model (ZTMM v2.0)

![Slide 73](/securite-cloud/03-menaces-cloud/p073_06_Image37.jpg)

## LAB : les menaces du cloud

dhdfhfgh
