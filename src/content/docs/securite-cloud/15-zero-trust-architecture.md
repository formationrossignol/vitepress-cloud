---
title: "12. Zero Trust : Architecture avancée"
---

# 12. Zero Trust : Architecture avancée

## MTLS (mutual TLS) : Authentification mutuelle

mTLS étend le protocole TLS classique : non seulement le client vérifie l'identité du serveur,
mais le serveur vérifie également l'identité du client via un certificat. Les deux parties
s'authentifient mutuellement avant l'établissement de la connexion chiffrée.

| Cas d’usage | Pourquoi utiliser mTLS |
| --- | --- |
| Service à service | Authentifier les workloads et chiffrer les échanges internes, notamment dans<br>Kubernetes ou un service mesh. |
| APIs partenaires | Autoriser uniquement les clients disposant d’un certificat valide à appeler une API<br>sensible. |
| Machine à machine | Sécuriser les échanges entre systèmes sans utilisateur humain : agents, jobs,<br>passerelles, IoT. |
| Zero Trust interne | Supprimer la confiance implicite dans le réseau : chaque connexion doit prouver les<br>deux identités. |
| Environnements<br>réglementés | Renforcer la maîtrise des flux dans des contextes sensibles : finance, santé, défense,<br>industrie. |
| Workloads hybrides | Sécuriser les échanges entre Kubernetes, VM, cloud et environnements hors cluster<br>avec une CA commune. |

![Slide 361](/securite-cloud/15-zero-trust-architecture/p361_00_Image100.jpg)


## SPIFFE/SPIRE : Identité des workloads


| Élément | Message clé |
| --- | --- |
| SPIFFE (Secure Production<br>Identity Framework For<br>Everyone) | Standard open source qui définit une identité cryptographique uniforme pour les workloads : services,<br>pods, conteneurs, VM ou processus. |
| SPIFFE ID | Identité unique du workload, exprimée sous forme d’URI.<br>Exemple : spiffe://prod.example.com/ns/paiement/sa/api-paiement. |
| SVID (SPIFFE Verifiable<br>Identity Document) | Document d’identité vérifiable, sous forme de certificat X.509 ou de jeton JWT, utilisé pour prouver<br>l’identité du workload. |
| SPIRE (SPIFFE Runtime<br>Environment) | Implémentation de référence de SPIFFE : elle atteste les workloads, émet les SVID et les renouvelle<br>automatiquement. |
| Lien avec mTLS | Les certificats X.509-SVID peuvent être utilisés pour authentifier deux workloads et établir un canal mTLS. |
| Bénéfice sécurité | Remplacer la confiance réseau et les secrets statiques par des identités courtes durées, vérifiables et<br>automatiquement renouvelées. |


## Fonctionnement de spiffe/spire


![Slide 363](/securite-cloud/15-zero-trust-architecture/p363_01_Image101.jpg)


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


| Structure | Exemple : Détection d’un shell dans un conteneur |
| --- | --- |
| - rule: Nom de la règle<br>desc: Description de la détection<br>condition: condition logique<br>output: Message affiché lors du déclenchement<br>priority: Niveau de criticité<br>tags: [catégorie] | - rule: Shell dans un conteneur<br>desc: Détecte l’exécution d’un shell interactif dans un conteneur<br>condition: container and proc.name in (bash, sh, zsh)<br>output: Shell détecté dans le conteneur<br>(user=%user.name container=%container.id<br>cmd=%proc.cmdline)<br>priority: WARNING<br>tags: [container, runtime] |


## Priorité des alertes


| Priorité | Description | Exemple concret |
| --- | --- | --- |
| EMERGENCY | Compromission critique | Exécution d’un ransomware sur plusieurs conteneurs Kubernetes |
| ALERT | Menace majeure | Reverse shell détecté depuis un pod vers une IP externe |
| CRITICAL | Activité dangereuse | Lecture du fichier /etc/shadow dans un conteneur |
| ERROR | Erreur de sécurité | Désactivation d’un agent de sécurité ou modification suspecte d’un binaire système |
| WARNING | Comportement suspect | Exécution inattendue de bash dans un conteneur nginx |
| NOTICE | Événement notable | Nouveau pod privilégié créé dans Kubernetes |
| INFO | Information | Nouveau conteneur démarré dans le cluster |
| DEBUG | Debug / diagnostic | Logs détaillés Falco pour analyse technique ou troubleshooting |


## Falco et falcosidekick


![Slide 369](/securite-cloud/15-zero-trust-architecture/p369_05_Image104.jpg)


![Slide 370](/securite-cloud/15-zero-trust-architecture/p370_07_Image91.jpg)


## Systèmes d'exploitation immuables (sécurité cloud par design)

Un OS immuable ne peut pas être modifié en runtime. Toute configuration est déclarative et versionnée. Le
rollback est instantané. Idéal pour les nœuds K8s.

| Aspect | OS Traditionnel | OS Immutable |
| --- | --- | --- |
| Modification | Possible en runtime (apt install, yum…) | Impossible : rootfs en lecture seule |
| Persistance | Changements permanents sur le système | État éphémère (reboot) = état propre |
| Surface d’attaque | Augmente avec chaque install/config | Minimale et fixe : rien à modifier |
| Mise à jour | Rolling update risqué : état inconsistant | Atomique : basculement A/B instantané |
| Rollback | Manuel et difficile | Automatique : version précédente intacte |
| Auditabilité | Difficile : état peut diverger | Totale : infrastructure as code = source de vérité |


## Focus sur NixOS

- Distribution Linux basée sur le gestionnaire de paquets Nix.
- Créateur : Eelco Dolstra
- Origine : projet de recherche universitaire, débuté vers 2003, Université d'Utrecht (Pays-Bas).
- Compatible avec : AWS, GCP, Azure, Terraform, Kubernetes, etc.
- NixOS transforme Linux en plateforme :
  - **Déclarative** : système où l'on décrit l'état souhaité de l'infrastructure ou du système, sans écrire les étapes détaillées pour y arriver.
  - **Reproductible** : système pouvant reconstruire exactement le même environnement, à l'identique, sur n'importe quelle machine.
  - **Immuable** : système qu'on ne modifie pas directement en production.
- Alternatives : Flatcar Container Linux, Bottlerocket (AWS), Talos Linux, RHCOS (OpenShift).


## Checklist de hardening production (CIS K8s Benchmark)

### Control Plane & Worker Nodes

**API Server :**
- `--anonymous-auth=false`
- `--authorization-mode=Node,RBAC`

**etcd :**
- chiffrement au repos (encryption-config)
- TLS client auth

**Controller Manager :**
- `--use-service-account-credentials=true`

**Scheduler :**
- `--authorization-mode=RBAC`
- pas de Webhook sans authentification

**Kubelet :**
- `--anonymous-auth=false`
- `--authorization-mode=Webhook`
- droits 600 sur kubelet.conf, ca.crt, etc.
- pas de ports inutiles ouverts sur les nodes
- SSH (22) uniquement via bastion

**OS :**
- CIS Linux Benchmark niveau 2
- auditd configuré
- SELinux/AppArmor activé

### Workloads & Réseau

**Pod Security Standards :**
- profil Restricted pour les workloads critiques
- `runAsNonRoot: true` + `runAsUser > 1000`
- `ReadOnlyRootFilesystem: true` sur tous les containers
- `resources.limits` obligatoires (CPU + mémoire)

**Réseau :**
- Network Policies : default deny all dans chaque namespace
- Pas de `hostNetwork: true` (sauf cas très spécifiques CNI plugins)
- Services de type LoadBalancer uniquement si nécessaire (préférer Ingress)
- Ingress avec TLS obligatoire : cert-manager pour rotation automatique

### RBAC & Secrets

**RBAC & ServiceAccounts :**
- `automountServiceAccountToken: false` si le pod n'a pas besoin de l'API Kubernetes
- ServiceAccounts dédiés par application (ne jamais utiliser le ServiceAccount par défaut)
- Pas de ClusterRoleBinding avec wildcards (`*` dans verbs ou resources interdit)
- Revues régulières : `kubectl auth can-i --list --as=system:serviceaccount:...`

**Secrets & Config :**
- Encryption at rest activée pour les secrets etcd (EncryptionConfiguration)
- Secrets Kubernetes uniquement pour données temporaires — préférer Vault / Secrets Manager
- ConfigMaps : ne pas stocker de données sensibles (même encodées en Base64)
- IRSA / Workload Identity pour accès au fournisseur de cloud — pas de clés statiques

