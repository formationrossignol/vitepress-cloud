---
title: "03. Les menaces cloud"
---

# 03. Les menaces cloud

## Les common vulnerabilities and exposures (CVE)

Une CVE est un identifiant standardisé attribué à une vulnérabilité de cybersécurité publiquement connue. Elle permet de
désigner une faille de manière unique et partagée entre les éditeurs, les outils de sécurité, les équipes SOC, les scanners et
les bases de vulnérabilités. Le programme CVE a pour mission d’identifier, définir et cataloguer les vulnérabilités
publiquement divulguées.

| Élément | Description |
| --- | --- |
| CVE | Identifiant unique d’une vulnérabilité connue |
| Format | CVE-année-numéro, par exemple CVE-2021-44228 |
| Rôle | Référencer une faille de manière standardisée |
| Contenu | Description, produit concerné, références, statut |
| Usage sécurité | Détection, priorisation, correction et reporting |
| Source d’enrichissement | NVD, éditeurs, CERT, bulletins de sécurité, outils de scan |


## Cycle de traitement d’une CVE


![Slide 48](/securite-cloud/03-menaces-cloud/p048_00_Image30.jpg)


## Common vulnerability scoring system

Le CVSS est un standard ouvert qui permet de décrire les caractéristiques principales d’une vulnérabilité et de produire un score numérique de
sévérité.

| Élément | Description |
| --- | --- |
| Rôle | Évaluer la sévérité technique d’une vulnérabilité |
| Score | •  0.0 : None<br>•  0.1-3.9 : Low<br>•  4.0-6.9 : Medium<br>•  7.0-8.9 : High<br>•  9.0-10.0 : Critical |
| Version actuelle | CVSS v4.0 |
| Utilisation | Aide à prioriser les vulnérabilités, sans remplacer l’analyse du risque réel |
| •  La NVD (National Vulnerability Database) précise que CVSS fournit une mesure qualitative de sévérité, mais que ce n’est pas une mesure du<br>risque. Le risque dépend aussi de l’exposition, de l’exploitabilité réelle, des actifs concernés, des compensating controls et du contexte<br>métier.<br>•  La NVD est une base de données de vulnérabilités maintenue par le NIST. Elle reprend les CVE publiées et les enrichit avec des scores CVSS,<br>des références, des produits affectés et des classifications CWE. |  |


## Common weakness enumeration

Common Weakness Enumeration (CWE) est un référentiel qui classe les types de faiblesses logicielles ou matérielles pouvant
conduire à des vulnérabilités. MITRE le décrit comme une liste communautaire de faiblesses pouvant apparaître dans
l’architecture, la conception, le code ou l’implémentation d’un produit.

|  | CWE | Type de faiblesse | Exemple |
| --- | --- | --- | --- |
|  | CWE-79 | Cross-Site Scripting | Entrée utilisateur injectée dans une page web |
|  | CWE-89 | SQL Injection | Requête SQL construite avec une entrée non filtrée |
|  | CWE-22 | Path Traversal | Accès à un fichier via ../ |
|  | CWE-287 | Improper Authentication | Authentification mal implémentée |
|  | CWE-798 | Hard-coded Credentials | Mot de passe codé en dur |
|  | CWE-352 | Cross-Site Request Forgery | Requête déclenchée à l’insu de l’utilisateur |
| https://cwe.mitre.org/data/index.html |  |  |  |


## Synthèse


| Notion | Signification | Question associée | Rôle | Exemple |
| --- | --- | --- | --- | --- |
| CVE | Common Vulnerabilities<br>and Exposures | Quelle vulnérabilité précise a été<br>identifiée ? | Identifie une<br>vulnérabilité connue | CVE-2021-44228 pour<br>Log4Shell |
| CVSS | Common Vulnerability<br>Scoring System | Quelle est la sévérité de cette<br>vulnérabilité ? | Évalue la gravité d’une<br>vulnérabilité | Score 9.8 Critical |
| CWE | Common Weakness<br>Enumeration | Quel type de faiblesse est à l’origine<br>du problème ? | Classe le type de<br>faiblesse logicielle | CWE-89 pour SQL<br>Injection |


## Gestion des vulnérabilités cloud : Vulnerabily management program

(VMP)
Trouver, prioriser et corriger les failles avant l'attaquant. Un CVE non patché en prod = une fenêtre d'opportunité
ouverte.

![Slide 52](/securite-cloud/03-menaces-cloud/p052_01_Image31.jpg)



(VMP)

![Slide 53](/securite-cloud/03-menaces-cloud/p053_02_Image32.jpg)


## Cycle de traitement d’une CVE vs VPM


| Élément | Niveau | Rôle |
| --- | --- | --- |
| CVE | Vulnérabilité<br>individuelle | Identifie une faille connue à traiter |
| Cycle de traitement<br>d’une CVE | Processus<br>opérationnel | Décrit comment une CVE est découverte, évaluée, corrigée puis<br>vérifiée |
| Vulnerability<br>Management Program | Programme<br>global | Organise la gestion continue de toutes les vulnérabilités : inventaire,<br>scan, priorisation, remédiation, suivi |


## Outils de gestion des vulnérabilités

Chaque couche de votre stack nécessite un outil spécifique. L'objectif : 0 CVE critique non détecté.

| Infrastructure cloud | Containers et images |
| --- | --- |
| •  AWS Inspector : scan EC2, Lambda, ECR continu et<br>automatique<br>•  Microsoft Defender for Cloud : vulnerability assessment<br>intégré Azure<br>•  GCP Security Command Center : findings de<br>vulnérabilités GCP natifc | •  Trivy (Aqua) : scanner images Docker : CVE + mauvaises<br>configs + secrets<br>•  Grype (Anchore) : scan SBOM CycloneDX/SPDX contre<br>NVD + OSV + GitHub<br>•  Snyk Container : scan + fix suggestions + monitoring en<br>continu |
| Code et dépendances | IaC & Configuration |
| •  Dependabot / Renovate : mise à jour automatique des<br>dépendances vulnérables<br>•  OWASP Dependency-Check / Snyk SCA : analyse<br>Software Composition<br>•  GitHub Advanced Security : alertes CVE directement<br>dans les PRsdé | •  tfsec / Checkov : détection misconfigurations<br>Terraform, CloudFormation, Bicep<br>•  Prowler : 300+ checks AWS CIS Benchmark, PCI-DSS,<br>HIPAA en CLI/SaaS<br>•  KICS (Checkmarx) : scan multi-IaC : Terraform, Docker,<br>K8s, Ansible |


## CSA Top 11 : Les principales menaces cloud (egregious eleven)

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


## Mauvaise configuration : Source #1 des incidents cloud

80% des incidents cloud sont causés par des erreurs de configuration côté client - Gartner 2024.

| Bucket S3 / Blob Storage public | Security Group trop ouvert |
| --- | --- |
| ACL public-read · Bucket policy sans restriction d'IP ·<br>Absence de Block Public Access · Log désactivé | 0.0.0.0/0 en inbound sur port 22 (SSH), 3389 (RDP),<br>3306 (MySQL) · All traffic autorisé entre subnets |
| Credentials en clair dans le code | Compte root / admin sans MFA |
| AWS_ACCESS_KEY dans GitHub · Password DB en clair<br>dans Dockerfile · Secrets dans les logs d'application | Console AWS sans MFA · Compte Global Admin Azure<br>non protégé · Root account utilisé au quotidien |
| Logs désactivés | Chiffrement non activé par défaut |
| CloudTrail non activé dans toutes les régions · Logs S3<br>non activés · Durée rétention insuffisante (<1 an) | Volume EBS non chiffré · Bucket S3 sans SSE · RDS sans<br>encryption at rest · Snapshots non chiffrés |


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




![Slide 59](/securite-cloud/03-menaces-cloud/p059_03_Image33.jpg)


## Le shadow IT c’est quoi ?

- Le Shadow IT ou informatique parallèle est l’utilisation de systèmes, d’appareils, de logiciels,
d’applications et de services informatiques qui n’ont pas reçu l’approbation explicite du
service informatique.
- Il a connu une croissance exponentielle ces dernières années avec l’adoption
d’applications et de services basés dans le cloud.
- Si le Shadow IT peut améliorer la productivité des employés et stimuler l’innovation, il peut
également introduire de sérieux risques de sécurité dans votre entreprise par le biais de
fuites de données, de violations potentielles de la conformité, etc.


## Le shadow AI c’est quoi ?

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


| Thème |  | Source |
| --- | --- | --- |
| Applications cloud non<br>gérées / Shadow IT | Les entreprises utilisent en moyenne 1 295 applications et services<br>cloud, avec moins de 2 % administrés par l’IT. | Netskope, page “Shadow IT and Unmanaged Cloud<br>Protection”. (Netskope) |
| Shadow AI | 72 % de l’usage GenAI en entreprise relève du Shadow IT, souvent via<br>des comptes personnels. | Netskope, Cloud and Threat Report: Generative AI 2025.<br>(Netskope) |
| Adoption GenAI | 90 % des organisations utilisent des applications GenAI, et 98 %<br>utilisent des applications intégrant des fonctionnalités GenAI. | Netskope, Cloud and Threat Report: Generative AI 2025.<br>(Netskope) |
| Risque de fuite via apps<br>personnelles | 60 % des incidents de menace interne impliquent des instances<br>personnelles d’applications cloud. | Netskope, Cloud and Threat Report: 2026. (Netskope) |
| Applications non autorisées | 52 % des employés déclarent avoir téléchargé des applications non<br>autorisées. | 1Password, cité par TechRadar, 2025. (TechRadar) |
| Données confidentielles<br>dans l’IA | Environ 38 % des employés déclarent partager des données<br>confidentielles avec des plateformes IA sans approbation. | Cloud Security Alliance citant une recherche CybSafe /<br>NCA. (cloudsecurityalliance.org) |
| Malware via cloud /<br>plateformes légitimes | En Europe, Netskope observe que 16 % des organisations subissent<br>chaque mois des téléchargements de malwares depuis GitHub. | Netskope, Threat Labs Report: Europe 2025. (Netskope) |


## Attaques supply chain : Compromission de la chaîne

d'Approvisionnement
Définition : Compromission d'un composant tiers (bibliothèque, outil, fournisseur) utilisé dans votre processus
de build ou livraison. L'attaquant vise un fournisseur pour atteindre ses clients. Impact en cascade sur tous les
utilisateurs du composant.

| SolarWinds (2020) | CodeCov (2021) | Log4Shell (2021) | XZ Utils (2024) |
| --- | --- | --- | --- |
| Mise à jour Orion IT<br>compromettante ·<br>18.000 clients touchés<br>dont des agences US<br>gouvernementales ·<br>Attribué à APT29<br>(Cozy Bear) | Script bash<br>compromis dans<br>l'image Docker · Vol<br>de variables<br>d'environnement<br>CI/CD · Credentials<br>AWS, GitHub tokens<br>exfiltrés | CVE-2021-44228 dans<br>Log4j (Java) · Présent<br>dans des milliers<br>d'applications · RCE<br>sans auth — CVSS<br>10.0 (score maximal) | Backdoor injectée via<br>contribution open<br>source sur 2 ans ·<br>Ciblait SSH sur Linux ·<br>Découverte par<br>hasard via benchmark<br>CPU |


| Rôles surdimensionnés | (Over-permissioned) : utilisateurs avec plus de droits que nécessaire<br>→ violation du Least Privilege |
| --- | --- |
| Credentials compromis | clés AWS en clair dans GitHub · tokens non rotés · accès partagés<br>sans traçabilité |
| Absence de MFA | Comptes admin sans MFA → cible prioritaire phishing / brute force |
| Détection<br>comportementale | AWS GuardDuty, Azure Defender for Identity, Google Chronicle :<br>connexions inhabituelles, volume d'accès excessif, heure atypique |
| Contrôles | Revues régulières des accès IAM · Alerte sur création de nouvelles<br>clés root · Monitoring des téléchargements massifs |


## OWASP Top 10 : 2025 : Mapping cloud security

| Risque | Impact cloud |
| --- | --- |
| A01:2025 - Contrôle d'accès défaillant | IAM sur-privilégié, rôles administrateur excessifs, bucket S3 public, accès inter-comptes mal maîtrisé |
| A02:2025 - Mauvaise configuration de sécurité | Security Groups ouverts, CloudTrail désactivé, services exposés publiquement, configurations par défaut dangereuses |
| A03:2025 - Défaillances de la chaîne d'approvisionnement logicielle | Images Docker non signées, dépendances vulnérables, pipeline CI/CD compromis, artefacts non vérifiés |
| A04:2025 - Défaillances cryptographiques | Secrets en clair, chiffrement absent, KMS mal configuré, mauvaise gestion des clés |
| A05:2025 - Injection | Injection SQL dans API/Lambda, command injection dans containers, template injection dans l'IaC |
| A06:2025 - Conception non sécurisée | Absence de threat modeling, architecture sans Zero Trust, Landing Zone mal conçue, absence de least privilege |
| A07:2025 - Défaillances d'authentification | MFA absent, fatigue MFA, attaque AiTM, mauvaise configuration OIDC/SAML, tokens non expirés |
| A08:2025 - Défaillances d'intégrité logicielle et des données | Artifacts non signés, SBOM absent, drift Terraform, provenance logicielle non vérifiée |
| A09:2025 - Défaillances de journalisation et de supervision | Logs CloudTrail absents, SIEM non centralisé, alertes absentes, MTTD trop élevé |
| A10:2025 - Mauvaise gestion des conditions exceptionnelles | Fail-open, erreurs silencieuses dans Lambda/API Gateway, timeouts mal gérés, rollback impossible |


## Architecture Zero Trust

"Never trust, always verify"
Le Zero Trust remplace la confiance accordée au réseau par une décision d’accès continue, contextuelle et fondée sur
le risque.

| Idée clé | Description |
| --- | --- |
| Principe | Aucun utilisateur, terminal, application ou réseau n’est considéré comme fiable par défaut |
| Décision<br>d’accès | Chaque demande est évaluée selon l’identité, le terminal, le contexte, le risque et les politiques |
| Contrôle | L’accès est accordé uniquement au strict nécessaire, pour une durée limitée |
| Surveillance | Les sessions, comportements, logs et événements alimentent une réévaluation continue |
| Objectif | Réduire la confiance implicite et limiter l’impact d’un compte, terminal ou service compromis |


![Slide 71](/securite-cloud/03-menaces-cloud/p071_04_Image35.jpg)


![Slide 72](/securite-cloud/03-menaces-cloud/p072_05_Image36.jpg)


## Architecture Zero Trust : NIST 800-207

Le NIST SP 800-207 formalise l'architecture Zero Trust autour d'un principe simple : chaque demande d'accès est évaluée dynamiquement par un moteur de décision, puis appliquée par un point de contrôle avant d'atteindre la ressource.

**PDP (Policy Decision Point)** = décide / **PEP (Policy Enforcement Point)** = applique.


## BeyondCorp (Google) : exemple d'implémentation réelle

BeyondCorp illustre le passage d'une sécurité fondée sur le réseau interne à une sécurité fondée sur l'identité, le terminal et le contexte d'accès.


## CISA Zero Trust Maturity Model (ZTMM v2.0)


![Slide 73](/securite-cloud/03-menaces-cloud/p073_06_Image37.jpg)

