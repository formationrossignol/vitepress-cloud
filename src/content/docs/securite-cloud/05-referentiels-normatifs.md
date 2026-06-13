---
title: "05. Les référentiels normatifs"
---

# 05. Les référentiels normatifs

## ISO/CEI 27017 : Sécurité des Services Cloud


|  | ● L'ISO/CEI 27017 est une norme internationale qui complète l'ISO/CEI 27002 en fournissant des recommandations spécifiques à la sécurité des environnements cloud. ● Elle s'adresse à la fois : ○ Aux fournisseurs de services cloud (CSP) ○ Aux clients utilisateurs de services cloud (CSC) ● Objectif : renforcer la sécurité des services cloud en clarifiant les responsabilités et en appliquant des contrôles adaptés aux modèles IaaS, PaaS et SaaS. |  |
|---|---|---|
| I | SO/CEI 27017 est le guide de référence pour appliquer les bonnes pratiques de sécurité dans le cloud en tenant compte des spécificités des environnements mutualisés et du modèle de responsabilité partagée. |  |
|  |  | 7 |


## ISO/CEI 27017 : Principes clés



## ISO/CEI 27017 : Exemples de contrôles


| Domaine | Exemples de mesures |
|---|---|
| IAM | MFA, moindre privilège, revue des droits |
| Réseau | Segmentation, filtrage, micro-segmentation |
| Données | Chiffrement au repos et en transit |
| Administration | Bastion, accès just-in-time, journalisation |
| Supervision | Monitoring, alertes, SIEM |
| Gouvernance | Matrice RACI, responsabilités documentées |


## Bénéfices


| ● Réduction des risques liés au cloud ● Clarification des responsabilités fournisseur/client ● Renforcement de la conformité réglementaire ● Amélioration de la confiance des clients ● Alignement avec les référentiels ISO 27001 et sécurité cloud |  |
|---|---|
|  | 8 |


## ISO/CEI 27018 : Protection des Données Personnelles dans le

Cloud

| Cloud ● L'ISO/CEI 27018 est une norme internationale dédiée à la protection des données à caractère personnel (PII : Personally Identifiable Information) dans les services cloud publics. ● Elle fournit des mesures complémentaires à l'ISO/CEI 27001 et à l'ISO/CEI 27017 pour les fournisseurs cloud agissant comme sous-traitants de données personnelles. ● Objectif : garantir que les données personnelles confiées au cloud sont collectées, traitées, stockées et supprimées de manière sécurisée et transparente. |  |
|---|---|
|  | 8 |


## ISO/CEI 27017 : Principes clés



## ISO/CEI 27017 : Exemples de contrôles


| Domaine | Exemples de mesures |
|---|---|
| Données personnelles | Classification et inventaire des données |
| Confidentialité | Chiffrement au repos et en transit |
| Accès | MFA, moindre privilège, traçabilité |
| Conservation | Politique de rétention documentée |
| Suppression | Effacement sécurisé et vérifiable |
| Sous-traitance | Encadrement contractuel des prestataires |
| Incidents | Procédures de notification et gestion des violations |


## Bénéfices & lien avec rgpd


| Bénéfices ● Renforcement de la protection des données personnelles ● Réduction des risques de fuite ou d'usage abusif ● Amélioration de la transparence vis-à-vis des clients ● Facilitation de la conformité réglementaire ● Renforcement de la confiance dans les services cloud Lien avec le RGPD ● L'ISO/CEI 27018 n'est pas une certification RGPD, mais elle apporte des mesures concrètes permettant de soutenir plusieurs exigences du RGPD : ○ Protection des données dès la conception (Privacy by Design) ○ Confidentialité et intégrité des données ○ Limitation des finalités ○ Gestion des sous-traitants ○ Notification des violations de données |  |
|---|---|
|  | 8 |


## CIS Benchmarks : Configurations Sécurisées de Référence


| ● Extension d'ISO 27002 spécifique aux services cloud computing. ● Définit des contrôles de sécurité supplémentaires pour les fournisseurs de services cloud (CSP) et leurs clients. ● Clarifie les responsabilités partagées. |  |
|---|---|
|  | 8 |


## SOC 2 : Standard de Confiance pour les Fournisseurs SaaS


| ● Développé par l’American Institute of CPAs (AICPA), SOC 2 permet de démontrer, via un audit indépendant, l'efficacité des contrôles de sécurité et la fiabilité d'un fournisseur de services numériques, tandis qu'ISO 27017 complète ISO 27002 avec des recommandations spécifiques au cloud et clarifie les responsabilités entre fournisseur et client. ● Objectifs : ○ Démontrer la maturité des contrôles de sécurité ○ Renforcer la confiance des clients et partenaires ○ Répondre aux exigences des grandes entreprises ○ Faciliter les audits fournisseurs (Vendor Assessment) Type I Type II Évalue la conception des contrôles Évalue l'efficacité des contrôles Photo à un instant donné Observation sur plusieurs mois Mise en place des processus Vérification de leur fonctionnement Audit ponctuelen Audit continu (généralement 6 à 12 mois) |  |
|---|---|
|  | 9 |

| Type I | Type II |
|---|---|
| Évalue la conception des contrôles | Évalue l'efficacité des contrôles |
| Photo à un instant donné | Observation sur plusieurs mois |
| Mise en place des processus | Vérification de leur fonctionnement |
| Audit ponctuelen | Audit continu (généralement 6 à 12 mois) |


## LEs cinq critères de confiance

Le critère Sécurité est obligatoire !

![Slide 91](/securite-cloud/05-referentiels-normatifs/p091_00_Image38.jpg)


## Les points de contrôle


| ● Gestion des accès et des identités ● Authentification multifacteur (MFA) ● Journalisation et audit ● Gestion des vulnérabilités ● Gestion des incidents de sécurité ● Sauvegardes et reprise d'activité ● Gestion des changements ● Sécurité des fournisseurs tier |  |
|---|---|
|  | 9 |


## SOC 2 et ISO 27001


| SOC 2 | ISO 27001 |
|---|---|
| Référentiel d'audit | Système de management de la sécurité |
| Très répandu aux États-Unis | Référence internationale |
| Contrôles orientés confiance client | Gouvernance globale de la sécurité |
| Souvent exigé pour les SaaS | Souvent exigé pour les grandes organisations |


## SecNumCloud : Qualification ANSSI & Souveraineté Numérique

SecNumCloud est la qualification de l'ANSSI garantissant un cloud de confiance alliant sécurité renforcée,
souveraineté numérique et protection contre les législations extraterritoriales.

| Objectifs ● Garantir un niveau élevé de cybersécurité ● Assurer la souveraineté des données sensibles ● Réduire les risques liés aux fournisseurs étrangers ● Renforcer la confiance dans les services cloud |  |
|---|---|
| Texte officiel de la qualification SecNumCloud 3.2 |  |
|  | 9 |


## Principes fondamentaux, exigences de sécurité


| Principes fondamentaux | Exigences de sécurité |
|---|---|
| Hébergement maîtrisé | ● Audit par organisme qualifié ANSSI ● Contrôles techniques, organisationnels et opérationnels ● Gestion des identités et des accès ● Chiffrement des données ● Journalisation et supervision ● Gestion des incidents de sécurité ● Continuité et reprise d'activité |
| ● Données hébergées en France ou dans l'Union européenne ● Infrastructures sous contrôle du fournisseur qualifié ● Localisation connue et audité |  |
| Souveraineté juridique |  |
| ● Protection contre les lois extraterritoriales ● Indépendance vis-à-vis du Cloud Act américain ● Gouvernance maîtrisée par des acteurs européen |  |
| Contrôle des accès |  |
| ● Personnel habilité et contrôlé ● Gestion stricte des privilèges ● Traçabilité complète des accès |  |


## Le processus de qualification


![Slide 97](/securite-cloud/05-referentiels-normatifs/p097_01_Image39.jpg)


## Les fournisseurs qualifiés


| Fournisseur | Particularité |
|---|---|
| OVHcloud | Cloud public souverain français qualifié SecNumCloud |
| 3DS Outscale | Cloud de Dassault Systèmes, fortement implanté dans les secteurs sensibles |
| S3NS | Coentreprise Thales + Google Cloud proposant un cloud de confiance qualifié SecNumCloud |
| Orange Business | Services cloud et infrastructures opérés par Orange avec offres qualifiées |
| Cloud Temple | Hébergeur et fournisseur cloud français spécialisé secteurs régulés |
| Cegedim.cloud | Cloud souverain orienté données sensibles et secteur de la santé |
| Oodrive | Collaboration et partage sécurisé de données qualifiés SecNumCloud |
| Whaller | Plateforme collaborative souveraine qualifiée SecNumCloud |
| Worldline | Services numériques et paiements avec offres cloud qualifiées |


## Cloud souverain vs cloud de confiance


| Cloud souverain | Cloud de confiance |
|---|---|
| Concept politique et stratégique | Concept réglementaire et opérationnel |
| Vise l'indépendance vis-à-vis des acteurs étrangers | Vise la protection des données sensibles |
| Contrôle européen ou national de l'infrastructure, de l'exploitation et de la gouvernance | Respect d'exigences de sécurité et de souveraineté définies par l'ANSSI |
| Pas nécessairement certifié ou qualifié | Souvent associé à SecNumCloud |
| Notion relativement floue | Notion encadrée en France |
| Les données, les infrastructures, l'exploitation et la gouvernance restent sous contrôle national ou européen. | Garantir un haut niveau de sécurité et une protection contre les législations extraterritoriales, même lorsqu'une technologie étrangère est utilisée. |


## RGPD & Cloud Computing : Obligations clés

Dans le cloud, le RGPD impose de maîtriser où, comment et par qui les données personnelles sont traitées, y compris lorsque l’infrastructure est
opérée par un fournisseur externe.

| Domaine | Obligation principale |  |
|---|---|---|
| Rôles & responsabilités | Identifier le responsable de traitement, le sous-traitant et les éventuels sous-traitants ultérieurs. |  |
| Contrat cloud | Mettre en place un DPA (Data Processing Agreement) conforme à l’article 28 avec chaque fournisseur traitant des données personnelles. |  |
| Transferts hors UE | Encadrer les transferts vers pays tiers avec des mécanismes légaux adaptés : CCT, garanties complémentaires, analyse de transfert. |  |
| Sécurité des données | Appliquer chiffrement, contrôle d’accès, journalisation, sauvegardes et séparation des environnements. |  |
| Privacy by Design | Intégrer la protection des données dès la conception des services cloud. |  |
| DPIA / AIPD | Réaliser une analyse d’impact pour les traitements présentant un risque élevé. |  |
| Violation de données | Notifier l’autorité de contrôle sous 72 h en cas de violation de données personnelles. |  |
| Sanctions | Jusqu’à 20 M€ ou 4 % du chiffre d’affaires mondial annuel. 1 |  |
|  |  | 1 |


## RGPD En résumé


![Slide 102](/securite-cloud/05-referentiels-normatifs/p102_02_Image40.jpg)


## EU Cyber Resilience Act (CRA)


| Le Cyber Resilience Act (CRA) impose aux produits numériques vendus dans l'Union Européenne des exigences de sécurité, de gestion des vulnérabilités et de transparence tout au long de leur cycle de vie. La cybersécurité devient une obligation réglementaire et non plus une simple bonne pratique ! |  |  |  |
|---|---|---|---|
|  | vulnérabilités et de transparence tout au long de leur cycle de vie. La cybersécurité devient une obligation réglementaire et non plus une simple bonne pratique ! |  |  |
|  | Thème | Exigence principale |  |
| Sé by | curité dès la conception (Security Design & by Default) | Les produits doivent intégrer des mécanismes de sécurité dès leur conception et être sécurisés par défaut. |  |
| SB | OM obligatoire | Inventaire complet des composants logiciels afin d'assurer la traçabilité de la chaîne d'approvisionnement. |  |
| Ge | stion des vulnérabilités | Processus obligatoire de détection, correction et divulgation des vulnérabilités de sécurité. |  |
| No | tification des incidents | Signalement des vulnérabilités activement exploitées et des incidents majeurs aux autorités compétentes dans les délais réglementaires. |  |
| Su | pport et mises à jour de sécurité | Fourniture de correctifs et de mises à jour de sécurité pendant toute la durée de vie prévue du produit. |  |
| Sa | nctions | Jusqu'à 15 M€ ou 2,5 % du chiffre d'affaires mondial annuel en cas de non-conformité. |  |
| Impact Cloud & SaaS | pact Cloud & SaaS | Les éditeurs SaaS, fournisseurs cloud et fabricants de produits connectés doivent démontrer leur conformit (SBOM, gestion des vulnérabilités, processus de mise à jour). | é |
|  |  |  | 1 |


## La directive NIS2

(Network and Information Security)


## La directive NIS2

NIS2 impose aux organisations essentielles et importantes de maîtriser leurs risques cyber, sécuriser leur chaîne d'approvisionnement et
démontrer une gestion efficace des incidents, y compris ceux liés à leurs fournisseurs et services cloud.

| ● En France, les Opérateur d'Importance Vitale (OIV) constituent déjà les acteurs les plus critiques pour la Nation. NIS2 étend les exigences de cybersécurité à un périmètre beaucoup plus large d'organisations essentielles et importantes à l'échelle européenne. ● D'un point de vue sécurité, NIS2 n'est pas une norme technique comme ISO 27001 ou un framework comme NIST. ● NIS2 oblige les organisations à mettre en place un niveau minimum de cybersécurité proportionné à leurs risques. |  |
|---|---|
|  | 1 |


## La cyber-résilience selon NIS2



## Qui est concerné ?


| Secteur | Exemples |
|---|---|
| Énergie | Producteurs, distributeurs |
| Transport | Aérien, ferroviaire, maritime |
| Santé | Hôpitaux, laboratoires |
| Eau | Opérateurs de distribution |
| Finance | Banques, assurances |
| Télécoms | Opérateurs et fournisseurs |
| Numérique | Cloud, SaaS, hébergeurs, DNS, datacenters |
| Industrie | Fabricants critiques |
| Administration | Collectivités et organismes publics |


## Synthèse sur les référentiels normatifs


| Référentiel | En quelques mots … |
|---|---|
| ISO 27017 | Bonnes pratiques de sécurité pour les services cloud |
| ISO 27018 | Protection des données personnelles dans le cloud |
| CIS Benchmarks | Guides de durcissement des systèmes, plateformes et services cloud |
| SOC 2 | Audit de l'efficacité des contrôles de sécurité d'un fournisseur SaaS |
| SecNumCloud | Qualification ANSSI pour les clouds de confiance |
| RGPD | Protection des données personnelles |
| NIS2 | Cyber-résilience des organisations critiques |
| CRA | Sécurité des produits numériques sur tout leur cycle de vie |

