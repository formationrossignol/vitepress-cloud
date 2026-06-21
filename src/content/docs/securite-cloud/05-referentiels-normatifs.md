---
title: "13. Référentiels normatifs"
---

# 13. Référentiels normatifs

## ISO/CEI 27017 : Sécurité des services cloud



## ISO/CEI 27017 : Principes clés



## ISO/CEI 27017 : Exemples de contrôles


| Domaine | Exemples de mesures |
| --- | --- |
| IAM | MFA, moindre privilège, revue des droits |
| Réseau | Segmentation, filtrage, micro-segmentation |
| Données | Chiffrement au repos et en transit |
| Administration | Bastion, accès just-in-time, journalisation |
| Supervision | Monitoring, alertes, SIEM |
| Gouvernance | Matrice RACI, responsabilités documentées |


## Bénéfices



## ISO/CEI 27018 : Protection des données personnelles dans le cloud

ISO/CEI 27018 complète l'ISO/CEI 27017 pour les fournisseurs cloud agissant comme sous-traitants de données personnelles.
Objectif : garantir que les données personnelles confiées au cloud sont collectées, traitées, stockées et supprimées de manière sécurisée et transparente.

### Principes clés

| Principe | Détails |
| --- | --- |
| Consentement et finalité | Traitement uniquement selon les instructions du client · Utilisation limitée aux finalités prévues · Interdiction d'utiliser les données à des fins non autorisées |
| Gestion du cycle de vie | Conservation maîtrisée · Suppression sécurisée des données · Restitution des données à la fin du contrat |
| Transparence | Information claire sur les traitements réalisés · Communication des sous-traitants impliqués · Visibilité sur les localisations de stockage des données |
| Protection des données personnelles | Chiffrement des données sensibles · Contrôles d'accès adaptés aux risques · Limitation des accès administrateurs |
| Gestion des incidents | Détection des violations de données · Notification des incidents de sécurité · Mise à disposition des éléments nécessaires aux enquêtes |

### Exemples de contrôles

| Domaine | Exemples de mesures |
| --- | --- |
| Données personnelles | Classification et inventaire des données |
| Confidentialité | Chiffrement au repos et en transit |
| Accès | MFA, moindre privilège, traçabilité |
| Conservation | Politique de rétention documentée |
| Suppression | Effacement sécurisé et vérifiable |
| Sous-traitance | Encadrement contractuel des prestataires |
| Incidents | Procédures de notification et gestion des violations |


## Bénéfices & lien avec RGPD

Bénéfices :
- Renforcement de la protection des données personnelles
- Réduction des risques de fuite ou d'usage abusif
- Amélioration de la transparence vis-à-vis des clients
- Facilitation de la conformité réglementaire
- Renforcement de la confiance dans les services cloud

Lien avec le RGPD : l'ISO/CEI 27018 n'est pas une certification RGPD, mais elle apporte des mesures concrètes permettant de soutenir plusieurs exigences du RGPD :
- Protection des données dès la conception (Privacy by Design)
- Confidentialité et intégrité des données
- Limitation des finalités
- Gestion des sous-traitants
- Notification des violations de données


## CIS Benchmarks : Configurations sécurisées de référence

Les CIS Benchmarks fournissent des recommandations de configuration sécurisée pour durcir les environnements cloud et réduire les mauvaises configurations.

| Aspect | Rôle dans un CIS Benchmark |
| --- | --- |
| Périmètre | Couvrir les principaux services : IAM, réseau, stockage, logs, chiffrement et supervision |
| Usage | Comparer la configuration réelle avec les bonnes pratiques attendues |
| Contrôles types | Vérifier le MFA, les accès publics, les ports exposés, les logs et le chiffrement |
| Valeur sécurité | Réduire les mauvaises configurations et améliorer la posture de sécurité |
| Valeur conformité | Fournir une base d'audit reconnue et réutilisable |
| Limite | Ne remplace pas l'analyse de risque, le contexte métier ni les exigences réglementaires |

### Axes de durcissement

| Axe de durcissement | Ce que le CIS Benchmark permet de vérifier |
| --- | --- |
| Identités et accès | MFA, comptes privilégiés, permissions excessives, usage du compte root |
| Journalisation | Activation des logs, centralisation, protection et conservation des événements |
| Réseau | Exposition publique, ports sensibles, règles trop permissives, segmentation |
| Stockage et données | Chiffrement, accès publics, versioning, protection contre la suppression |
| Surveillance | Alertes sur les actions sensibles, changements de configuration et comportements à risque |
| Conformité | Écarts entre la configuration réelle et une base de sécurité reconnue |
| Remédiation | Priorisation des corrections pour réduire les mauvaises configurations |


## SOC 2 : Standard de confiance pour les fournisseurs saas


| Type I | Type II |
| --- | --- |
| Évalue la conception des contrôles | Évalue l'efficacité des contrôles |
| Photo à un instant donné | Observation sur plusieurs mois |
| Mise en place des processus | Vérification de leur fonctionnement |
| Audit ponctuelen | Audit continu (généralement 6 à 12 mois) |


## Les cinq critères de confiance

Le critère Sécurité est obligatoire !

![Slide 91](/securite-cloud/05-referentiels-normatifs/p091_00_Image38.jpg)


## Les points de contrôle



## SOC 2 et ISO 27001


| SOC 2 | ISO 27001 |
| --- | --- |
| Référentiel d'audit | Système de management de la sécurité |
| Très répandu aux États-Unis | Référence internationale |
| Contrôles orientés confiance client | Gouvernance globale de la sécurité |
| Souvent exigé pour les SaaS | Souvent exigé pour les grandes organisations |


## SecNumCloud : Qualification ANSSI & souveraineté numérique

SecNumCloud est la qualification de l'ANSSI garantissant un cloud de confiance alliant sécurité renforcée,
souveraineté numérique et protection contre les législations extraterritoriales.


## Principes fondamentaux, exigences de sécurité


| Principes fondamentaux | Exigences de sécurité |
| --- | --- |
| Hébergement maîtrisé | •  Audit par organisme qualifié ANSSI<br>•  Contrôles techniques, organisationnels<br>et opérationnels<br>•  Gestion des identités et des accès<br>•  Chiffrement des données<br>•  Journalisation et supervision<br>•  Gestion des incidents de sécurité<br>•  Continuité et reprise d'activité |
| •  Données hébergées en France ou dans l'Union européenne<br>•  Infrastructures sous contrôle du fournisseur qualifié<br>•  Localisation connue et audité |  |
| Souveraineté juridique |  |
| •  Protection contre les lois extraterritoriales<br>•  Indépendance vis-à-vis du Cloud Act américain<br>•  Gouvernance maîtrisée par des acteurs européen |  |
| Contrôle des accès |  |
| •  Personnel habilité et contrôlé<br>•  Gestion stricte des privilèges<br>•  Traçabilité complète des accès |  |


## Le processus de qualification


![Slide 97](/securite-cloud/05-referentiels-normatifs/p097_01_Image39.jpg)


## Les fournisseurs qualifiés


| Fournisseur | Particularité |
| --- | --- |
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
| --- | --- |
| Concept politique et stratégique | Concept réglementaire et opérationnel |
| Vise l'indépendance vis-à-vis des acteurs étrangers | Vise la protection des données sensibles |
| Contrôle européen ou national de l'infrastructure, de<br>l'exploitation et de la gouvernance | Respect d'exigences de sécurité et de souveraineté définies<br>par l'ANSSI |
| Pas nécessairement certifié ou qualifié | Souvent associé à SecNumCloud |
| Notion relativement floue | Notion encadrée en France |
| Les données, les infrastructures, l'exploitation et la<br>gouvernance restent sous contrôle national ou européen. | Garantir un haut niveau de sécurité et une protection contre<br>les législations extraterritoriales, même lorsqu'une technologie<br>étrangère est utilisée. |


## RGPD & cloud computing : Obligations clés

Dans le cloud, le RGPD impose de maîtriser où, comment et par qui les données personnelles sont traitées, y compris lorsque l’infrastructure est
opérée par un fournisseur externe.

| Domaine | Obligation principale |
| --- | --- |
| Rôles & responsabilités | Identifier le responsable de traitement, le sous-traitant et les éventuels sous-traitants ultérieurs. |
| Contrat cloud | Mettre en place un DPA (Data Processing Agreement) conforme à l’article 28 avec chaque fournisseur traitant des données<br>personnelles. |
| Transferts hors UE | Encadrer les transferts vers pays tiers avec des mécanismes légaux adaptés : CCT, garanties complémentaires, analyse de<br>transfert. |
| Sécurité des données | Appliquer chiffrement, contrôle d’accès, journalisation, sauvegardes et séparation des environnements. |
| Privacy by Design | Intégrer la protection des données dès la conception des services cloud. |
| DPIA / AIPD | Réaliser une analyse d’impact pour les traitements présentant un risque élevé. |
| Violation de données | Notifier l’autorité de contrôle sous 72 h en cas de violation de données personnelles. |
| Sanctions | Jusqu’à 20 M€ ou 4 % du chiffre d’affaires mondial annuel. |


## RGPD en résumé


![Slide 102](/securite-cloud/05-referentiels-normatifs/p102_02_Image40.jpg)


## EU Cyber resilience act (CRA)


|  | vulnérabilités et de transparence tout au long de leur cycle de vie.<br>La cybersécurité devient une obligation réglementaire et non plus une simple bonne pratique ! |  |  |
| --- | --- | --- | --- |
|  | Thème | Exigence principale |  |
| Sé<br>by | curité dès la conception (Security<br>Design & by Default) | Les produits doivent intégrer des mécanismes de sécurité dès leur conception et être sécurisés par défaut. |  |
| SB | OM obligatoire | Inventaire complet des composants logiciels afin d'assurer la traçabilité de la chaîne d'approvisionnement. |  |
| Ge | stion des vulnérabilités | Processus obligatoire de détection, correction et divulgation des vulnérabilités de sécurité. |  |
| No | tification des incidents | Signalement des vulnérabilités activement exploitées et des incidents majeurs aux autorités compétentes<br>dans les délais réglementaires. |  |
| Su | pport et mises à jour de sécurité | Fourniture de correctifs et de mises à jour de sécurité pendant toute la durée de vie prévue du produit. |  |
| Sa | nctions | Jusqu'à 15 M€ ou 2,5 % du chiffre d'affaires mondial annuel en cas de non-conformité. |  |
| Impact Cloud & SaaS | pact Cloud & SaaS | Les éditeurs SaaS, fournisseurs cloud et fabricants de produits connectés doivent démontrer leur conformit<br>(SBOM, gestion des vulnérabilités, processus de mise à jour). | é |


## La directive NIS2

(Network and Information Security)



NIS2 impose aux organisations essentielles et importantes de maîtriser leurs risques cyber, sécuriser leur chaîne d'approvisionnement et
démontrer une gestion efficace des incidents, y compris ceux liés à leurs fournisseurs et services cloud.


## La cyber-résilience selon NIS2



## Qui est concerné ?


| Secteur | Exemples |
| --- | --- |
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
| --- | --- |
| ISO 27017 | Bonnes pratiques de sécurité pour les services cloud |
| ISO 27018 | Protection des données personnelles dans le cloud |
| CIS Benchmarks | Guides de durcissement des systèmes, plateformes et services cloud |
| SOC 2 | Audit de l'efficacité des contrôles de sécurité d'un fournisseur SaaS |
| SecNumCloud | Qualification ANSSI pour les clouds de confiance |
| RGPD | Protection des données personnelles |
| NIS2 | Cyber-résilience des organisations critiques |
| CRA | Sécurité des produits numériques sur tout leur cycle de vie |

