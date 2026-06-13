---
title: "12. Monitoring, Détection & Réponse aux Incidents"
---

# 12. Monitoring, Détection & Réponse aux Incidents

## 12. Monitoring, Détection

& Réponse aux Incidents


## AWS CloudTrail : Journal de Toutes les Actions Cloud

AWS CloudTrail est le service d'audit natif d'AWS qui enregistre les actions effectuées dans un compte
AWS afin d'assurer la traçabilité, la conformité, l'investigation et la détection d'incidents de sécurité.

| Ce que CloudTrail enregistre |  |
|---|---|
| CloudTrail capture les appels API réalisés via … | Pour chaque action, CloudTrail enregistre notamment : |
| ● Console AWS ● AWS CLI ● SDK AWS ● Services AWS | ● Qui a effectué l'action ● Quelle action a été réalisée ● Quand elle a eu lieu ● Depuis quelle adresse IP ● Sur quelle ressource ● Quel a été le résultat |

| 2 7 |
|---|
| 2 |


## AWS CloudTrail : FONCTIONNEMENT


![Slide 273](/securite-cloud/12-monitoring-detection-incidents/p273_00_Image79.jpg)


## MITRE ATT&CK pour le Cloud : Tactiques et Techniques

- MITRE ATT&CK Cloud est une déclinaison du référentiel MITRE ATT&CK dédiée aux
techniques d’attaque observées dans les environnements cloud.
- Il décrit les tactiques, techniques et procédures utilisées par les attaquants contre les
identités, services, workloads, données et ressources cloud.
- Objectif : Comprendre comment un attaquant progresse dans un environnement cloud
afin d’améliorer la détection, la réponse à incident et le durcissement des configurations.


## Inventaire des techniques


![Slide 278](/securite-cloud/12-monitoring-detection-incidents/p278_01_Image80.jpg)


## EXEMPLES de techniques courantes


![Slide 279](/securite-cloud/12-monitoring-detection-incidents/p279_02_Image81.jpg)


## Réponse aux Incidents Cloud : Phases PICERL

PIRCEL est un modèle de réponse aux incidents permettant de structurer les actions depuis la préparation jusqu'à l'amélioration
continue après l'incident.

| Préparation | Identification | Confinement |
|---|---|---|
| ● Procédures et runbooks ● Contacts d'urgence ● Outils d'investigation ● Exercices de crise ● Sauvegardes et preuves forensiques | ● Analyse des alertes ● Confirmation du compromis ● Qualification de l'impact Identification du périmètre affecté Priorisation de l'incident | ● Isolation des systèmes compromis Révocation des accès ● Blocage des flux malveillants ● Préservation des preuves ● Réduction de la surface d'attaque |
| Éradication | Rétablissement | Leçons apprises |
| ● Suppression des malwares ● Fermeture des vecteurs d'attaque ● Correction des vulnérabilités ● Rotation des secrets ● Nettoyage des ressources compromises | ● Restauration des systèmes ● Validation de sécurité ● Réouverture progressive ● Surveillance renforcée ● Retour à la production | ● Analyse post-incident ● Identification des causes racines ● Mise à jour des procédures ● Amélioration des contrôles ● Capitalisation du retour d'expérience |


## LAB : Monitoring, Détection

& Réponse aux Incidents


## QCM : Monitoring, Détection

& Réponse aux Incidents

