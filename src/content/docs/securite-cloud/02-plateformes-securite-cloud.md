---
title: "02. Plateformes de sécurité cloud"
---

# 02. Plateformes de sécurité cloud

## 02. Plateformes de

sécurité cloud


| Cloud Security Posture Management (CSPM) |  |
|---|---|
| ● Un CSPM surveille la posture de sécurité des environnements cloud : comptes, subscriptions, projets, ressources, réseaux, stockages, bases de données et services managés. ● Il détecte les mauvaises configurations, les écarts de conformité et les dérives par rapport aux bonnes pratiques de sécurité. ● Fonctionne en continu via l’analyse des configurations cloud. ● Détection des mauvaises configurations : bucket public, Security Group ouvert en 0.0.0.0/0, CloudTrail désactivé, chiffrement absent. ● Contrôle de conformité : vérification automatique par rapport aux référentiels CIS Benchmarks, ISO 27001, PCI-DSS, SOC 2, NIST. ● Gestion de la posture cloud : score de sécurité, priorisation des risques, recommandations de remédiation, suivi des écarts. ● Cas d’usage : détection des ressources exposées publiquement, audit continu de la configuration cloud, préparation à la conformité, réduction du risque de misconfiguration, contrôle des environnements multi-cloud. ● Solutions : Wiz Cloud Security Platform, Prisma Cloud CSPM, Orca Cloud Security Platform, Lacework FortiCNAPP, Microsoft Defender for Cloud, AWS Security Hub, Google Security Command Center, Prowler, Steampipe, ScoutSuite, etc. |  |
|  | 2 |


## Cloud Security Posture Management (CSPM)


![Slide 30](/securite-cloud/02-plateformes-securite-cloud/p030_00_Image23.jpg)


## Cloud Infrastructure Entitlement Management (CIEM)

- Un CIEM surveille les identités et les permissions des environnements cloud : utilisateurs, rôles IAM,
comptes de service, comptes privilégiés, accès cross-account et droits sur les ressources cloud.
- Il détecte les permissions excessives, les chemins d’escalade de privilèges et les écarts par rapport au
principe du moindre privilège (least privilege).
- Fonctionne en continu via l’analyse des droits d’accès et des relations entre identités et ressources.
- Détection des permissions excessives : rôle IAM avec AdministratorAccess, compte dormant avec
privilèges élevés, accès permanent non justifié, permissions héritées non maîtrisées, etc.
- Contrôle de gouvernance IAM : vérification automatique des accès sensibles, séparation des rôles,
comptes orphelins, comptes de service sur-privilégiés, accès non conformes.
- Gestion des identités cloud : score d’exposition, priorisation des risques IAM, recommandations de
réduction des droits, accès JIT (Just-In-Time), suivi des écarts.
- Cas d’usage : réduction des permissions excessives, prévention des escalades de privilèges, sécurisation
des comptes privilégiés, audit des accès sensibles, contrôle des environnements multi-cloud et SaaS.
- Solutions : Microsoft Entra Permissions Management, AWS IAM Access Analyzer, Google Security
Command Center (CIEM), Prisma Cloud CIEM, Wiz CIEM, Orca Security CIEM, Sonrai Dig, Ermetic CIEM
(désormais Tenable Cloud Security), Lacework Polygraphe, etc.


## Cloud Infrastructure Entitlement Management (CIEM)


![Slide 32](/securite-cloud/02-plateformes-securite-cloud/p032_01_Image24.jpg)


## Kubernetes Security Posture Management (KSPM)

- Un KSPM surveille la posture de sécurité des environnements Kubernetes : clusters, nœuds, pods,
conteneurs, RBAC, secrets et réseau.
- Il détecte les mauvaises configurations, les privilèges excessifs, les risques de sécurité et les écarts de
conformité Kubernetes.
- Fonctionne en continu via l’analyse des configurations et ressources Kubernetes.
- Analyse Kubernetes : clusters mal configurés, API Server exposé, composants non durcis.
- Contrôle des workloads : pods privilégiés, conteneurs root, images non approuvées.
- Analyse des accès : RBAC trop permissif, comptes de service sur-privilégiés, secrets exposés.
- Contrôle réseau : absence de Network Policies, communications non restreintes.
- Conformité : CIS Kubernetes Benchmark, NSA Kubernetes Hardening Guide, NIST, PCI-DSS.
- Cas d’usage : sécurisation des clusters EKS, AKS, GKE et OpenShift, audit continu Kubernetes, contrôle
des permissions et des workloads.
- Solutions : Kubescape, Wiz KSPM, Prisma Cloud, Orca Security, Sysdig Secure, Aqua Security, Microsoft
Defender for Containers, Red Hat ACS, Check Point CloudGuard, etc.


## Kubernetes Security Posture Management (KSPM)


![Slide 34](/securite-cloud/02-plateformes-securite-cloud/p034_02_Image25.jpg)


| Cloud Workload Protection Platform (CWPP) |  |
|---|---|
| ● Un CWPP protège les workloads cloud : VM, conteneurs, clusters Kubernetes et parfois serverless contre les vulnérabilités, mauvaises configurations, malwares et comportements anormaux. ● Il apporte de la visibilité, du scan de vulnérabilités, du contrôle de conformité et de la détection en runtime. ● Fonctionne en temps réel pendant l'exécution (runtime security). ● Scan de vulnérabilités : images Docker, packages OS, bibliothèques applicatives ● Environnement d'exécution de sécurité : détection comportementale (spawn shell inattendu, lecture /etc/shadow, connexion réseau suspecte) ● Conformité CIS Benchmarks : vérification automatique des hardening guides ● Cas d’usage : Protection contre les malwares et ransomwares, détection d’activités anormales dans les workloads, sécurisation des conteneurs et des images, contrôle de conformité et gestion des vulnérabilités, etc. ● Solutions : Aqua Cloud Security Platform, Lacework FortiCNAPP, Sysdig Secure, Falco, Microsoft Defender for Containers, Prisma Cloud Compute, Wiz Runtime Sensor, Orca Cloud Security Platform, AWS GuardDuty Runtime Monitoring, Google Security Command Center Enterprise, etc. 3 |  |
|  | 3 |


## Cloud Workload Protection Platform (CWPP)


![Slide 36](/securite-cloud/02-plateformes-securite-cloud/p036_03_Image26.jpg)


| Data Security Posture Management (DSPM) |  |
|---|---|
| ● Un DSPM surveille la posture de sécurité des données sensibles dans les environnements cloud : bases de données, data lakes, buckets S3, stockages blob, SaaS, entrepôts de données et services managés. ● Il détecte les données sensibles exposées, les accès excessifs, les mauvaises classifications et les écarts de conformité liés à la protection des données. ● Fonctionne en continu via la découverte, la classification et l’analyse des accès aux données. ● Découverte des données sensibles : identification automatique des PII, données financières, données de santé, secrets, données réglementées (RGPD, PCI, HIPAA). ● Contrôle de conformité : vérification automatique des accès, du chiffrement, des partages externes, des politiques DLP et des référentiels RGPD, PCI-DSS, ISO 27001, HIPAA. ● Gestion de la posture des données : score de risque data, priorisation des expositions critiques, recommandations de remédiation, suivi des écarts et des accès sensibles. ● Cas d’usage : détection des buckets contenant des données clients exposées, contrôle des accès aux données sensibles, réduction du risque de fuite de données, conformité réglementaire, audit continu des environnements multi-cloud et SaaS. ● Solutions : Microsoft Purview DSPM, Google Cloud DSPM, AWS Macie, Wiz DSPM, Prisma Cloud DSPM, Orca Security DSPM, Varonis, Securiti, BigID, etc. |  |
|  | 3 |


## Data Security Posture Management (DSPM)


![Slide 38](/securite-cloud/02-plateformes-securite-cloud/p038_04_Image27.jpg)


| Cloud-Native Application Protection Platform (CNAPP) |
|---|
| ● Un CNAPP unifie les principales capacités de sécurité cloud au sein d'une plateforme unique. ● Il fournit une visibilité centralisée sur les configurations, les workloads, les identités, les données sensibles et les environnements Kubernetes. ● Fonctionne en continu via la corrélation des risques provenant des différentes couches de sécurité cloud. ● Capacités intégrées : CSPM + CWPP + CIEM + DSPM + KSPM + Analyse des chemins d'attaque (corrélation des vulnérabilités, expositions réseau, permissions IAM et données sensibles afin d'identifier les risques réellement exploitables). ● Valeur apportée : ○ Visibilité unifiée multi-cloud ○ Corrélation des risques entre les différentes couches de sécurité ○ Priorisation des remédiations ○ Gestion centralisée de la conformité ○ Score de risque global ○ Tableaux de bord et reporting centralisés ● Solutions : Wiz, Prisma Cloud, Orca Security, Microsoft Defender for Cloud, Lacework, Check Point CloudGuard, Sysdig Secure, Trend Vision One Cloud Security, SentinelOne Singularity Cloud Security, etc. |


| Une solution CNAPP open-source ? |
|---|
| ● Aujourd'hui, il n'existe pas de solution open source qui couvre de manière mature et intégrée l'ensemble du périmètre CNAPP ● Le plus proche est généralement un assemblage de plusieurs outils open source. |

| Domaine | Open Source |
|---|---|
| CSPM | Prowler, Cloudsplaining, ScoutSuite, Cartography |
| CWPP | Falco, Kubescape, Wazuh, Tracee |
| CIEM | PMapper, Cloudsplaining, Cartography |
| DSPM | Peu mature en open source (solution la plus crédible mais limité : OpenMetadata) |
| KSPM | Kubescape, kube-bench, kube-hunter |
| Analyse des chemins d'attaque | Cartography, PMapper, BloodHound (adapté cloud) |


## Cloud-Native Application Protection Platform (CNAPP)


![Slide 41](/securite-cloud/02-plateformes-securite-cloud/p041_05_Image28.jpg)


## Synthèse


| Outil | La question principale à se poser |
|---|---|
| CSPM | Ma config est-elle sûre ? |
| CWPP | Mes workloads sont-ils protégés ? |
| CIEM | Qui a trop de droits ? |
| KSPM | Mon Kubernetes est-il sécurisé ? |
| DSPM | Où sont mes données sensibles ? |
| CNAPP | Comment tout centraliser ? |


## LAB : les Plateformes de

sécurité cloud
dhdfhfgh


## QCM : Plateformes de

sécurité cloud

