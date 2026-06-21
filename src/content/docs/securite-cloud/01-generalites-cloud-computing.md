---
title: "01. Généralités sur le cloud computing"
---

# 01. Généralités sur le cloud computing

## Qu’est-ce que le « cloud » ?

Selon l’Institut National des Normes et de la Technologie (NIST).
Le Cloud Computing est un modèle qui permet un accès réseau pratique et sur demande à un
pool partagé de ressources informatiques configurables (par exemple, des réseaux, des serveurs,
du stockage, des applications et des services) qui peut être rapidement approvisionné et
disponible sans trop d’efforts de gestion ou d’interaction d’opérateurs.
Ce modèle de cloud favorise la disponibilité et est composé de :
- Cinq caractéristiques essentielles.
- De trois modèles de service : SAAS, PAAS, IAAS.
- Et de quatre modèles de déploiement : Cloud privé, cloud communautaire, cloud public,
cloud hybride.


## Les 5 caractéristiques essentielles du cloud

- **Libre-service à la demande** : les utilisateurs peuvent provisionner des ressources et les utiliser sans intervention humaine du service.
- **Large accès au réseau** : ressources disponibles sur le réseau et accessibles par diverses plates-formes clientes.
- **Mise en commun des ressources** : plusieurs clients peuvent partager la même infrastructure et les mêmes applications avec sécurité et confidentialité. Plusieurs clients sont desservis à partir des mêmes ressources physiques.
- **Flexibilité rapide** : acquérir et disposer automatiquement et rapidement des ressources en cas de besoin. Évoluer rapidement et facilement en fonction de la demande.
- **Service mesuré** : l'utilisation est mesurée, les utilisateurs paient correctement pour ce qu'ils ont utilisé.


## Les modèles de cloud computing


![Slide 14](/securite-cloud/01-generalites-cloud-computing/p014_00_Image14.jpg)


## Avantages des différents types de cloud


![Slide 15](/securite-cloud/01-generalites-cloud-computing/p015_01_Image15.jpg)


## Limites de l’approche traditionnelle (on-premises)

- Payer le loyer du datacenter.
- Payer pour l'alimentation, le refroidissement, la maintenance.
- L'ajout et le remplacement de matériel prennent du temps.
- La mise à l'échelle (autoscaling) est limitée.
- Embaucher une équipe 24h/24 et 7j/7 pour surveiller l'infrastructure.
- Comment faire face aux catastrophes (tremblement de terre, coupure de courant,
incendie, etc.) ?
- Peut-on externaliser tout cela ?


## Le modèle as a service


![Slide 17](/securite-cloud/01-generalites-cloud-computing/p017_02_Image16.jpg)


## Extension du modèle as a service


![Slide 18](/securite-cloud/01-generalites-cloud-computing/p018_03_Image17.jpg)


## Histoire du cloud & évolution de la sécurité


![Slide 19](/securite-cloud/01-generalites-cloud-computing/p019_04_Image18.jpg)


## Quelques cas d'usage

- **Faire face à des pics d'activité** : auto-scaling pendant le Black Friday, événements sportifs, soldes, etc. (payer uniquement la capacité consommée).
- **Sauvegarder ses données quotidiennement** : snapshots automatisés, réplication multi-région, Plan de Reprise d'Activité (PRA) cloud (RTO/RPO) maîtrisés et testables.
- **Se libérer des machines physiques** : réduction CAPEX, virtualisation totale, fin de vie datacenter, migration datacenter-out.
- **Porter des projets de nouvelles technologies** : IA/ML managé (SageMaker, Vertex AI, etc.), IoT, Big Data (Spark/EMR) : accès immédiat aux services spécialisés.
- **Accélérer le time-to-market et les MVPs** : provisionner un environnement complet en quelques minutes, itérer rapidement, supprimer les ressources inutilisées.
- **Migrer vers le cloud** : stratégie de migration 7R (Rehost, Replatform, Refactor, Repurchase, Retain, Retire, Relocate), lift & shift ou modernisation.


## Modèle de responsabilités partagées

Dans le cloud, la sécurité est partagée : le fournisseur protège l'infrastructure cloud, tandis que le client reste responsable de la configuration, des accès, des données et des usages.

![Slide 23](/securite-cloud/01-generalites-cloud-computing/p023_v37_Image19.jpg)


## Lift & shift


![Slide 21](/securite-cloud/01-generalites-cloud-computing/p021_05_Image19.jpg)


## RTO et RPO (et MTD)


![Slide 22](/securite-cloud/01-generalites-cloud-computing/p022_06_Image20.jpg)


## Qu'est-ce qu'une application « cloud native » ?

- Une application Cloud Native est conçue dès l'origine pour exploiter pleinement le
modèle de delivery du Cloud (élasticité, scalabilité et automatisation).
- Elle est construite pour survivre et prospérer dans un environnement dynamique et
distribué.
- Avantages :
  - Améliore le "time to market".
  - Scalabilité accrue pour les applications.
  - La stack peut être immédiatement transférée vers une autre région.
  - Gestion des applications Cloud Native est entièrement automatisée.


## Les “12-factors app”

C'est une méthodologie créée par les ingénieurs d'Heroku pour définir les critères d'une application idéale pour le Cloud (Cloud Native) :
1. Codebase (Code source) : Un seul dépôt de code (Git) pour plusieurs déploiements (Prod, Staging, etc.).
2. Dependencies (Dépendances) : Déclarer et isoler explicitement les bibliothèques (ne jamais supposer qu'un outil est déjà sur le serveur).
3. Config (Configuration) : Stocker la configuration (mots de passe, URLs de BDD) dans des variables d’environnement, jamais dans le code.
4. Backing Services (Services secondaires) : Traiter les bases de données ou les serveurs de mail comme des ressources attachées (on peut les
swapper facilement).
5. Build, Release, Run : Séparer strictement l'étape de compilation, l'étape de configuration et l'exécution.
6. Processes (Processus) : L'application doit être Stateless (sans état). Rien n'est stocké en local (les données vont dans une base externe).
7. Port Binding (Assignation de ports) : L'application est autonome et expose son propre service sur un port (souvent via HTTP).
8. Concurrency (Concurrence) : Scaler horizontalement en multipliant les instances de l'application (grâce au côté Stateless).
9. Disposability (Jetabilité) : Démarrage rapide et arrêt propre (Graceful shutdown) pour favoriser l'agilité et la robustesse.
10. Dev/Prod Parity : Garder le développement, le test et la production les plus identiques possibles pour éviter les bugs de déploiement.
11. Logs : Traiter les logs comme des flux continus (streams). L'application écrit dans la console, c'est l'infrastructure qui les collecte.
12. Admin Processes : Exécuter les tâches d'administration (migrations de BDD) dans le même environnement que les processus applicatifs.


## Prêt pour lundi

| # | Action | Commande | Durée / Coût | Impact |
| --- | --- | --- | --- | --- |
| 1 | Scanner tous vos buckets/blobs publics | `aws s3api list-buckets | jq -r '.Buckets[].Name' | xargs -I{} aws s3api get-bucket-acl --bucket {}` | 5 min / Gratuit | Impact immédiat / Trouver les public-read avant un attaquant |
| 2 | Activer S3 Block Public Access au niveau organisation | `aws s3control put-public-access-block --account-id $ACCOUNT_ID --public-access-block-configuration BlockPublicAcls=true,...` | 2 min / Gratuit | Prévention définitive des buckets publics accidentels |
| 3 | Vérifier vos responsabilités dans vos contrats cloud | `# Ouvrir AWS Customer Agreement Section 4 - Security & Compliance` | 30 min / Gratuit | Savoir exactement ce que AWS garantit (et ce qu'il ne garantit PAS)mo |

| https://www.ionos.fr/digitalguide/serveur/know-how/caas-comparaison-des-offres-de- |
| --- |
| container-as-a-service/ |
| https://www.slideshare.net/OCTOTechnologySuisse/cloud-en-2017-sortez-du-status |
| https://www.objectif-cloud.com/modele-eco-cloud |
| https://www.stordata.fr/8-usages-intelligents-du-cloud-public/ |
| https://www.lebigdata.fr/cloud-native-definition-2 |

