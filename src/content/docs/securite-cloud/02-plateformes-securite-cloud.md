---
title: "10. Plateformes de sécurité cloud"
---

# 10. Plateformes de sécurité cloud

## Cloud security posture management (CSPM)

- Un CSPM surveille la posture de sécurité des environnements cloud : comptes, subscriptions, projets, ressources, réseaux, stockages, bases de données et services managés.
- Il détecte les mauvaises configurations, les écarts de conformité et les dérives par rapport aux bonnes pratiques de sécurité.
- Fonctionne en continu via l'analyse des configurations cloud.
- Détection des mauvaises configurations : bucket public, Security Group ouvert en 0.0.0.0/0, CloudTrail désactivé, chiffrement absent.
- Contrôle de conformité : vérification automatique par rapport aux référentiels CIS Benchmarks, ISO 27001, PCI-DSS, SOC 2, NIST.
- Gestion de la posture cloud : score de sécurité, priorisation des risques, recommandations de remédiation, suivi des écarts.
- Cas d'usage : détection des ressources exposées publiquement, audit continu de la configuration cloud, préparation à la conformité, réduction du risque de misconfiguration, contrôle des environnements multi-cloud.
- Solutions : Wiz Cloud Security Platform, Prisma Cloud CSPM, Orca Cloud Security Platform, Lacework FortiCNAPP, Microsoft Defender for Cloud (CSPM), Aqua Security, Tenable Cloud Security, Qualys TotalCloud, etc.

![Slide 247](/securite-cloud/02-plateformes-securite-cloud/p247_v37_Image82.jpg)


## Cloud infrastructure entitlement management (CIEM)

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

![Slide 249](/securite-cloud/02-plateformes-securite-cloud/p249_v37_Image83.jpg)


## Kubernetes security posture management (KSPM)

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

![Slide 251](/securite-cloud/02-plateformes-securite-cloud/p251_v37_Image84.jpg)


## Cloud workload protection platform (CWPP)

- Un CWPP protège les workloads cloud : VM, conteneurs, clusters Kubernetes et parfois serverless contre les vulnérabilités, mauvaises configurations, malwares et comportements anormaux.
- Il apporte de la visibilité, du scan de vulnérabilités, du contrôle de conformité et de la détection en runtime.
- Fonctionne en temps réel pendant l'exécution (runtime security).
- Scan de vulnérabilités : images Docker, packages OS, bibliothèques applicatives.
- Environnement d'exécution de sécurité : détection comportementale (spawn shell inattendu, lecture /etc/shadow, connexion réseau suspecte).
- Conformité CIS Benchmarks : vérification automatique des hardening guides.
- Cas d'usage : protection contre les malwares et ransomwares, détection d'activités anormales dans les workloads, sécurisation des conteneurs et des images, contrôle de conformité et gestion des vulnérabilités.
- Solutions : Aqua Cloud Security Platform, Lacework FortiCNAPP, Sysdig Secure, Falco, Microsoft Defender for Containers, Prisma Cloud Compute, Wiz Runtime Sensor, Orca Cloud Security Platform, AWS GuardDuty Runtime Monitoring.

![Slide 253](/securite-cloud/02-plateformes-securite-cloud/p253_v37_Image85.jpg)


## Data security posture management (DSPM)


![Slide 38](/securite-cloud/02-plateformes-securite-cloud/p038_04_Image27.jpg)


| Domaine | Open Source |
| --- | --- |
| CSPM | Prowler, Cloudsplaining, ScoutSuite, Cartography |
| CWPP | Falco, Kubescape, Wazuh, Tracee |
| CIEM | PMapper, Cloudsplaining, Cartography |
| DSPM | Peu mature en open source (solution la plus crédible mais limité : OpenMetadata) |
| KSPM | Kubescape, kube-bench, kube-hunter |
| Analyse des chemins d'attaque | Cartography, PMapper, BloodHound (adapté cloud) |


## Cloud-Native application protection platform (CNAPP)

- Un CNAPP unifie les principales capacités de sécurité cloud au sein d'une plateforme unique.
- Il fournit une visibilité centralisée sur les configurations, les workloads, les identités, les données sensibles et les environnements Kubernetes.
- Fonctionne en continu via la corrélation des risques provenant des différentes couches de sécurité cloud.
- Capacités intégrées : CSPM + CWPP + CIEM + DSPM + KSPM + Analyse des chemins d'attaque (corrélation des vulnérabilités, expositions réseau, permissions IAM et données sensibles afin d'identifier les risques réellement exploitables).
- Valeur apportée :
  - Visibilité unifiée multi-cloud
  - Corrélation des risques entre les différentes couches de sécurité
  - Priorisation des remédiations
  - Gestion centralisée de la conformité
  - Score de risque global
  - Tableaux de bord et reporting centralisés
- Solutions : Wiz, Prisma Cloud, Orca Security, Microsoft Defender for Cloud, Lacework, Check Point CloudGuard, Sysdig Secure, Trend Vision One Cloud Security, SentinelOne Singularity Cloud Security.

![Slide 258](/securite-cloud/02-plateformes-securite-cloud/p258_v37_Image87.jpg)


## Une solution CNAPP open-source ?

Aujourd'hui, il n'existe pas de solution open source qui couvre de manière mature et intégrée l'ensemble du périmètre CNAPP. Le plus proche est généralement un assemblage de plusieurs outils open source.

| Domaine | Open Source |
| --- | --- |
| CSPM | Prowler, Cloudsplaining, ScoutSuite, Cartography |
| CWPP | Falco, Kubescape, Wazuh, Tracee |
| CIEM | PMapper, Cloudsplaining, Cartography |
| DSPM | Peu mature en open source (solution la plus crédible mais limitée : OpenMetadata) |
| KSPM | Kubescape, kube-bench, kube-hunter |
| Analyse des chemins d'attaque | Cartography, PMapper, BloodHound (adapté cloud) |


## Synthèse


| Outil | La question principale à se poser |
| --- | --- |
| CSPM | Ma config est-elle sûre ? |
| CWPP | Mes workloads sont-ils protégés ? |
| CIEM | Qui a trop de droits ? |
| KSPM | Mon Kubernetes est-il sécurisé ? |
| DSPM | Où sont mes données sensibles ? |
| CNAPP | Comment tout centraliser ? |

