---
title: "12. Monitoring, Détection & Réponse aux incidents"
---

# 12. Monitoring, Détection & Réponse aux incidents

## AWS CloudTrail : Journal de toutes les actions cloud

AWS CloudTrail est le service d'audit natif d'AWS qui enregistre les actions effectuées dans un compte
AWS afin d'assurer la traçabilité, la conformité, l'investigation et la détection d'incidents de sécurité.

| Ce que CloudTrail enregistre |  |
| --- | --- |
| CloudTrail capture les appels API réalisés via … | Pour chaque action, CloudTrail enregistre notamment : |
| •  Console AWS<br>•  AWS CLI<br>•  SDK AWS<br>•  Services AWS | •  Qui a effectué l'action<br>•  Quelle action a été réalisée<br>•  Quand elle a eu lieu<br>•  Depuis quelle adresse IP<br>•  Sur quelle ressource<br>•  Quel a été le résultat |

| 2<br>7 |
| --- |
| 2 |


## AWS CloudTrail : Fonctionnement


![Slide 273](/securite-cloud/12-monitoring-detection-incidents/p273_00_Image79.jpg)


## MITRE ATT&CK pour le cloud : Tactiques et techniques

- MITRE ATT&CK Cloud est une déclinaison du référentiel MITRE ATT&CK dédiée aux
techniques d’attaque observées dans les environnements cloud.
- Il décrit les tactiques, techniques et procédures utilisées par les attaquants contre les
identités, services, workloads, données et ressources cloud.
- Objectif : Comprendre comment un attaquant progresse dans un environnement cloud
afin d’améliorer la détection, la réponse à incident et le durcissement des configurations.


## Inventaire des techniques


![Slide 278](/securite-cloud/12-monitoring-detection-incidents/p278_01_Image80.jpg)


## Exemples de techniques courantes


![Slide 279](/securite-cloud/12-monitoring-detection-incidents/p279_02_Image81.jpg)


## Réponse aux incidents cloud : Phases picerl

PIRCEL est un modèle de réponse aux incidents permettant de structurer les actions depuis la préparation jusqu'à l'amélioration
continue après l'incident.

| Préparation | Identification | Confinement |
| --- | --- | --- |
| •  Procédures et runbooks<br>•  Contacts d'urgence<br>•  Outils d'investigation<br>•  Exercices de crise<br>•  Sauvegardes et preuves<br>forensiques | •  Analyse des alertes<br>•  Confirmation du compromis<br>•  Qualification de l'impact<br>Identification du périmètre<br>affecté Priorisation de l'incident | •  Isolation des systèmes<br>compromis Révocation des accès<br>•  Blocage des flux malveillants<br>•  Préservation des preuves<br>•  Réduction de la surface<br>d'attaque |
| Éradication | Rétablissement | Leçons apprises |
| •  Suppression des malwares<br>•  Fermeture des vecteurs<br>d'attaque<br>•  Correction des vulnérabilités<br>•  Rotation des secrets<br>•  Nettoyage des ressources<br>compromises | •  Restauration des systèmes<br>•  Validation de sécurité<br>•  Réouverture progressive<br>•  Surveillance renforcée<br>•  Retour à la production | •  Analyse post-incident<br>•  Identification des causes racines<br>•  Mise à jour des procédures<br>•  Amélioration des contrôles<br>•  Capitalisation du retour<br>d'expérience |


## LAB : Monitoring, détection

& Réponse aux Incidents


## QCM : Monitoring, détection

& Réponse aux Incidents

