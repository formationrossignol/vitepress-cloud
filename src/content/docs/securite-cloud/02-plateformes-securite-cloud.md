---
title: "02. Plateformes de sécurité cloud"
---

# 02. Plateformes de sécurité cloud

## Cloud security posture management (CSPM)


![Slide 30](/securite-cloud/02-plateformes-securite-cloud/p030_00_Image23.jpg)


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




![Slide 32](/securite-cloud/02-plateformes-securite-cloud/p032_01_Image24.jpg)


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




![Slide 34](/securite-cloud/02-plateformes-securite-cloud/p034_02_Image25.jpg)


## Cloud workload protection platform (CWPP)


![Slide 36](/securite-cloud/02-plateformes-securite-cloud/p036_03_Image26.jpg)


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


![Slide 41](/securite-cloud/02-plateformes-securite-cloud/p041_05_Image28.jpg)


## Synthèse


| Outil | La question principale à se poser |
| --- | --- |
| CSPM | Ma config est-elle sûre ? |
| CWPP | Mes workloads sont-ils protégés ? |
| CIEM | Qui a trop de droits ? |
| KSPM | Mon Kubernetes est-il sécurisé ? |
| DSPM | Où sont mes données sensibles ? |
| CNAPP | Comment tout centraliser ? |

