---
title: "15. Zero Trust : Architecture Avancée"
---

# 15. Zero Trust : Architecture Avancée

## 15. Zero Trust :

Architecture Avancée

## mTLS (Mutual TLS) : authentification mutuelle

mTLS étend le protocole TLS classique : non seulement le client vérifie l'identité du serveur,
mais le serveur vérifie également l'identité du client via un certificat. Les deux parties
s'authentifient mutuellement avant l'établissement de la connexion chiffrée.
Cas d’usage Pourquoi utiliser mTLS
Service à service Authentifier les workloads et chiffrer les échanges internes, notamment dans
Kubernetes ou un service mesh.
APIs partenaires Autoriser uniquement les clients disposant d’un certificat valide à appeler une API
sensible.
Machine à machine Sécuriser les échanges entre systèmes sans utilisateur humain : agents, jobs,
passerelles, IoT.
Zero Trust interne Supprimer la confiance implicite dans le réseau : chaque connexion doit prouver les
deux identités.
Environnements
réglementés
Renforcer la maîtrise des flux dans des contextes sensibles : finance, santé, défense,
industrie.
Workloads hybrides Sécuriser les échanges entre Kubernetes, VM, cloud et environnements hors cluster
avec une CA commune.

![Slide 361](/securite-cloud/15-zero-trust-architecture/p361_00_Image100.jpg)

## SPIFFE/SPIRE : identité des workloads

SPIFFE définit l’identité, SPIRE la délivre, le SVID la prouve, et mTLS l’utilise pour authentifier les workloads entre eux.
Élément Message clé
SPIFFE (Secure Production
Identity Framework For
Everyone)
Standard open source qui définit une identité cryptographique uniforme pour les workloads : services,
pods, conteneurs, VM ou processus.
SPIFFE ID Identité unique du workload, exprimée sous forme d’URI.
Exemple : spiffe://prod.example.com/ns/paiement/sa/api-paiement.
SVID (SPIFFE Verifiable
Identity Document)
Document d’identité vérifiable, sous forme de certificat X.509 ou de jeton JWT, utilisé pour prouver
l’identité du workload.
SPIRE (SPIFFE Runtime
Environment)
Implémentation de référence de SPIFFE : elle atteste les workloads, émet les SVID et les renouvelle
automatiquement.
Lien avec mTLS Les certificats X.509-SVID peuvent être utilisés pour authentifier deux workloads et établir un canal mTLS.
Bénéfice sécurité Remplacer la confiance réseau et les secrets statiques par des identités courtes durées, vérifiables et
automatiquement renouvelées.

## FONCTIONNEMENT DE SPIFFE/SPIRE

![Slide 363](/securite-cloud/15-zero-trust-architecture/p363_01_Image101.jpg)

## Les règles de détection falco

![Slide 364](/securite-cloud/15-zero-trust-architecture/p364_02_Image90.jp2)

![Slide 364](/securite-cloud/15-zero-trust-architecture/p364_03_Image91.jpg)

## Informations générales

- Falco intercepte les
syscalls Linux via eBPF →
compare aux règles →
émet des alertes en
temps réel (< 1ms de
latence)
- De 80 à 120 règles natives
- Les règles sont écritent en
YAML

![Slide 365](/securite-cloud/15-zero-trust-architecture/p365_04_Image102.jpg)

## Ecrire une alerte

Structure Exemple : Détection d’un shell dans un conteneur
- rule: Nom de la règle
  desc: Description de la détection
  condition: condition logique
  output: Message affiché lors du déclenchement
  priority: Niveau de criticité
  tags: [catégorie]
- rule: Shell dans un conteneur
  desc: Détecte l’exécution d’un shell interactif dans un conteneur
  condition: container and proc.name in (bash, sh, zsh)
  output: Shell détecté dans le conteneur
           (user=%user.name container=%container.id
cmd=%proc.cmdline)
priority: WARNING
tags: [container, runtime]

## Priorité des alertes

Priorité Description Exemple concret
EMERGENCY Compromission critique Exécution d’un ransomware sur plusieurs conteneurs Kubernetes
ALERT Menace majeure Reverse shell détecté depuis un pod vers une IP externe
CRITICAL Activité dangereuse Lecture du fichier /etc/shadow dans un conteneur
ERROR Erreur de sécurité Désactivation d’un agent de sécurité ou modification suspecte d’un binaire système
WARNING Comportement suspect Exécution inattendue de bash dans un conteneur nginx
NOTICE Événement notable Nouveau pod privilégié créé dans Kubernetes
INFO Information Nouveau conteneur démarré dans le cluster
DEBUG Debug / diagnostic Logs détaillés Falco pour analyse technique ou troubleshooting

## Falcosidekick

- Falcosidekick est un composant complémentaire de Falco permettant de
router, enrichir et distribuer les alertes runtime vers des systèmes externes.
- Il agit comme une couche d’intégration entre Falco et les outils de sécurité,
d’observabilité et de collaboration.
- Le produit dispose d’une IHM.
Fonctionnalités principales :
 Fonction Description
Routage Envoi des alertes vers plusieurs destinations
Enrichissement Ajout de contexte (cluster, namespace, labels, host, etc.)
Transformation Formatage JSON / webhook / payload
Filtrage Exclusion ou routage conditionnel
Automatisation Déclenchement d’actions ou workflows

![Slide 368](/securite-cloud/15-zero-trust-architecture/p368_05_Image103.jp2)

## falco et Falcosidekick

![Slide 369](/securite-cloud/15-zero-trust-architecture/p369_06_Image104.jpg)

## Systèmes d'Exploitation Immuables

![Slide 370](/securite-cloud/15-zero-trust-architecture/p370_07_Image90.jp2)

![Slide 370](/securite-cloud/15-zero-trust-architecture/p370_08_Image91.jpg)

## Systèmes d'Exploitation Immuables (Sécurité Cloud par Design)

Un OS immuable ne peut pas être modifié en runtime. Toute configuration est déclarative et versionnée. Le
rollback est instantané. Idéal pour les nœuds K8s.
Aspect OS Traditionnel OS Immutable
Modification Possible en runtime (apt install, yum…) Impossible : rootfs en lecture seule
Persistance Changements permanents sur le système État éphémère (reboot) = état propre
Surface d’attaque Augmente avec chaque install/config Minimale et fixe : rien à modifier
Mise à jour Rolling update risqué : état inconsistant Atomique : basculement A/B instantané
Rollback Manuel et difficile Automatique : version précédente intacte
Auditabilité Difficile : état peut diverger Totale : infrastructure as code = source de vérité

## FOCUS SUR NIXOS

- Distribution Linux basée sur le gestionnaire de paquets Nix.
- Créateur : Eelco Dolstra
- Origine :
  - Projet de recherche universitaire.
  - Débuté vers 2003.
  - Université d’Utrecht (Pays-Bas).
- Compatible avec : AWS, GCP , Azure, Terrafor, Kubernetes, etc.
- NixOS transforme Linux en plateforme :
  - Déclarative : Système où l’on décrit l’état souhaité de l’infrastructure ou du système, sans
écrire les étapes détaillées pour y arriver)
  - Reproductible : Système pouvant reconstruire exactement le même environnement, à
l’identique, sur n’importe quelle machine.
  - Et immutable : Système qu’on ne modifie pas directement en production.
- Alternatives : Flatcar Container Linux, Bottlerocket (AWS), Talos Linux, RHCOS (OpenShift), etc.
https://www.it-connect.fr/quest-ce-que-nixos-la-distribution-linux-que-letat-pourrait-utiliser/

## Checklist de Hardening Production (CIS K8s Benchmark)

Control Plane Worker Nodes
- API Server :
  - --anonymous-auth=false
  - --authorization-mode=Node,RBAC
- etcd :
  - chiffrement au repos (encryption-config)
  - TLS client auth
- Controller Manager :
  - --use-service-account-credentials=true
- Scheduler :
  - --authorization-mode=RBAC
- pas de Webhook sans authentification
- Kubelet :
  - --anonymous-auth=false
  - --authorization-mode=Webhook
- Fichiers de config :
  - droits 600 sur kubelet.conf, ca.crt, etc.
- Pas de ports inutiles ouverts sur les nodes :
  - SSH (22) uniquement via bastion
- OS :
  - CIS Linux Benchmark niveau 2
  - auditd configuré
  - SELinux/AppArmor activé

## Checklist de Hardening Production (CIS K8s Benchmark)

Workloads & Pods Réseau
- Pod Security Standards :
  - profil Restricted pour les workloads critiques
- Pas de containers root :
  - runAsNonRoot: true
  - runAsUser > 1000
- ReadOnlyRootFilesystem: true sur tous les containers
- resources.limits obligatoires :
  - Requests + limits CPU et mémoire
- Network Policies :
  - default deny all dans chaque namespace
- Pas de hostNetwork: true
  - Sauf cas très spécifiques (CNI plugins)
- Services de type LoadBalancer uniquement si nécessaire :
  - Préférer Ingress
- Ingress avec TLS obligatoire :
  - cert-manager pour rotation automatique des certificats

## Checklist de Hardening Production (CIS K8s Benchmark)

RBAC & ServiceAccounts Secrets & Config
- automountServiceAccountToken: false
  - si le pod n’a pas besoin de l’ API Kubernetes
- ServiceAccounts dédiés par application
  - ne jamais utiliser le ServiceAccount par défaut
- Pas de ClusterRoleBinding avec wildcards :
  - * dans verbs ou resources interdit
- Revues régulières des accès :
  - kubectl auth can-i --list --as=system:serviceaccount:...
- Encryption at rest activée pour les secrets etcd
  - EncryptionConfiguration
- Secrets Kubernetes uniquement pour données
temporaires :
  - Préférer Vault / Secrets Manager
- ConfigMaps :
  - Ne pas stocker de données sensibles (même
encodées en Base64)
- IRSA / Workload Identity pour accès cloud provider
  - Pas de clés statiques

## QCM : Zero Trust :

Architecture Avancée
