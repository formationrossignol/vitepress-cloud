---
title: "09. Sécurité des conteneurs & Kubernetes"
---

# 09. Sécurité des conteneurs & Kubernetes

## 09. Sécurité des conteneurs

& kubernetes

## Sécurité de Docker : Hardening des Images et des Conteneurs

Images de base minimales Utilisateur non-root obligatoire
FROM ubuntu:latest
FROM alpine:3.19
# Pas de USER → root par défaut
RUN adduser -D appuser && USER appuser
Pas de secrets dans les couches Filesystem en lecture seule
ENV DB_PASSWORD=secret123
ARG DB_PASSWORD (build-time) + Secrets manager runtime
docker run myapp
docker run --read-only --tmpfs /tmp myapp
Capabilities Linux limitées Scan CVE obligatoire
# Toutes les capabilities accordées
--cap-drop=ALL --cap-add=NET_BIND_SERVICE
# Image déployée sans scan
trivy image myapp:latest (gate CI bloquant)

## Kubernetes RBAC : Contrôle d'Accès au Cluster

RBAC K8s : Sujets (Users/Groups/ServiceAccounts) → Verbs (get/list/create/delete) → Resources (pods/secrets/deployments)
Objets RBAC Kubernetes Anti-patterns K8S à éviter
- Role : permissions dans un namespace spécifique
- ClusterRole : permissions cluster-wide (tous namespaces)
- RoleBinding : lie un Role à des sujets dans un namespace
- ClusterRoleBinding : lie un ClusterRole à des sujets globalement
- ServiceAccount : identité pour les pods (≠ user humain)
- Wildcard dans les verbes : verbs: ["*"] : JAMAIS
- ClusterAdmin bindé à un ServiceAccount applicatif
- Default ServiceAccount avec des droits (le désactiver)
- Partage de ServiceAccount entre plusieurs apps
- Oublier de désactiver automountServiceAccountToken
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: default
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"] # jamais "*"

## Network Policies : Micro-segmentation dans Kubernetes

- Les Network Policies permettent de contrôler les communications réseau entre les Pods Kubernetes.
- Par défaut, un cluster Kubernetes autorise généralement toutes les communications internes (flat network). Les
Network Policies appliquent le principe du Zero Trust en autorisant uniquement les flux explicitement
nécessaires.
- Objectif : limiter les mouvements latéraux d'un attaquant et réduire la surface d'attaque du cluster.
 Principe de fonctionnement
Contrôle du trafic Est-Ouest Contrôle du trafic Nord-Sud Approche "Default Deny"
- Pod → Pod
- Namespace → Namespace
- Pod → Service
- Entrées depuis l'extérieur
- Sorties vers Internet ou
vers des services externes
- Tout est interdit par défaut
- Les flux nécessaires sont
explicitement autorisés
- Les autres communications
restent bloquées

## Network Policies : Micro-segmentation dans Kubernetes

Attention : Par défaut dans Kubernetes, tout le trafic est autorisé entre tous les pods de tous les namespaces !
Default Deny All Allow Namespace → Namespace Allow Egress HTTPS
Première règle déployée dans chaque
namespace. Bloque tout trafic IN et
OUT. Puis ouvrir uniquement les flux
nécessaires.
Autoriser uniquement le trafic entre
namespaces spécifiques. Ex: ns/frontend →
ns/backend uniquement via port 8080.
Autoriser uniquement le trafic sortant
HTTPS vers Internet pour les mises à jour,
webhooks, API externes.
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  # bloque TOUT
  # puis ouvrir sélectivement
spec:
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: frontend
    - podSelector: {}
spec:
  podSelector:
    matchLabels:
      app: myapp
  egress:
  - ports:
    - port: 443
      protocol: TCP

## Fonctionnement

![Slide 198](/securite-cloud/09-securite-conteneurs-kubernetes/p198_00_Image63.jpg)

## Pod Security Standards (PSS)

Privileged Baseline Restricted
À réserver aux composants système de
confiance
Point de départ recommandé pour les
applications
Niveau recommandé pour les applications
en production
- Aucune restriction de sécurité
- Pods privilégiés autorisés
- hostNetwork, hostPID, hostIPC
autorisés
- Toutes les capacités Linux
autorisées
- Volumes hostPath autorisés
- Accès complet à l'hôte
- À réserver aux composants
système de confiance
- Protection minimale contre les
escalades de privilèges
- Pods privilégiés interdits
- hostNetwork, hostPID, hostIPC
interdits
- Volumes hostPath interdits
- Capacités Linux dangereuses
interdites (NET_RAW, etc.)
- Adapté à la majorité des
applications
- Hérite de toutes les restrictions du
niveau Baseline
- runAsNonRoot: true obligatoire
- allowPrivilegeEscalation: false
obligatoire
- seccompProfile: RuntimeDefault
requis
- Capacités Linux fortement
restreintes
- Hardening renforcé des Pods
Les Pod Security Standards (PSS) définissent des niveaux de sécurité prédéfinis qui contrôlent les
configurations autorisées des Pods Kubernetes afin de réduire les risques de compromission.

## Fonctionnement

![Slide 201](/securite-cloud/09-securite-conteneurs-kubernetes/p201_01_Image64.jpg)

## Admission Controllers : contrôler les ressources avant leur

création
Élément Description
Rôle Intercepter les requêtes envoyées à l’ API Server avant l’enregistrement de la
ressource
Position Après l’authentification et l’autorisation RBAC, avant la persistance dans etcd
Types Mutating Admission Controller et Validating Admission Controller
Objectif sécurité Empêcher l’entrée de configurations dangereuses ou non conformes dans le cluster
Résultat La ressource est modifiée, acceptée ou refusée
Un Admission Controller est un mécanisme (plugin) Kubernetes qui intercepte les requêtes envoyées à l’ API Server
après l’authentification et l’autorisation, mais avant l’enregistrement de la ressource dans le cluster. Il permet de
modifier, valider ou refuser une ressource afin d’appliquer des règles de sécurité, de conformité ou de gouvernance.

## Fonctionnement

Actions
1 Un utilisateur, une CI/CD ou un contrôleur envoie
 une requête à l’ API Kubernetes
2 Kubernetes authentifie l’identité
3 Kubernetes vérifie les droits avec RBAC
4 L’ Admission Controller intercepte la requête
5 Un contrôleur mutating peut modifier la
ressource
6 Un contrôleur validating vérifie la conformité
7 La ressource est acceptée ou refusée avant
création

![Slide 204](/securite-cloud/09-securite-conteneurs-kubernetes/p204_02_Image65.jpg)

## Admission Controllers courants

Contrôleur Type Rôle dans l’admission
PodSecurity Validating Applique les niveaux PSS Privileged, Baseline, Restricted aux Pods
ResourceQuota Validating Refuse les créations qui dépassent les quotas d’un namespace
LimitRanger Mutating / Validating Définit des valeurs par défaut ou vérifie les limites CPU / mémoire
ValidatingAdmissionWebhook Validating Délègue la validation à un webhook externe
MutatingAdmissionWebhook Mutating Délègue la modification d’une ressource à un webhook externe
ValidatingAdmissionPolicy Validating Applique des règles d’admission déclaratives avec CEL
ServiceAccount Mutating / Validating Associe les Pods à une identité Kubernetes et vérifie certains
prérequis

## OPA Gatekeeper : appliquer des politiques Kubernetes

OPA Gatekeeper est un contrôleur d’admission Kubernetes qui applique des politiques déclaratives exécutées par Open Policy
Agent. Il permet de refuser ou modifier des ressources qui ne respectent pas les règles définies pour le cluster. La
documentation officielle le décrit comme un webhook validating et mutating qui applique des politiques basées sur des CRD et
exécutées par OPA.
Élément Description
Rôle Contrôler les ressources Kubernetes avant leur création ou modification
Position S’appuie sur les Admission Controllers Kubernetes
Moteur Open Policy Agent
Type Validating et mutating webhook
Langage Rego
Objets clés ConstraintTemplate et Constraint
Objectif Imposer automatiquement des règles de sécurité, conformité et gouvernance

## Fonctionnement

![Slide 208](/securite-cloud/09-securite-conteneurs-kubernetes/p208_03_Image66.jpg)

## Exemples de politiques

Politique Contrôle appliqué
Interdire les Pods privilégiés Bloque les configurations à risque
Imposer des labels obligatoires Renforce la traçabilité
Interdire les images latest Améliore la reproductibilité
Restreindre les registres d’images Contrôle la provenance des conteneurs
Interdire les volumes hostPath Réduit l’exposition du nœud hôte
Imposer des limites CPU / mémoire Encadre la consommation de ressources
OPA Gatekeeper transforme les règles de sécurité Kubernetes en politiques exécutées automatiquement à
l’entrée du cluster.

## Un exemple

ConstraintTemplate Constraint
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            labels:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels
        violation[{"msg": msg}] {
          required := input.parameters.labels[_]
          not input.review.object.metadata.labels[required]
          msg := sprintf("Le label obligatoire '%v' est absent.", [required])
        }
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: labels-obligatoires
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Namespace"]
  parameters:
    labels:
      - owner
      - environment
Cas Manifeste Kubernetes
Refusé apiVersion: v1
kind: Namespace
metadata:
  name: app-prod
Validé apiVersion: v1
kind: Namespace
metadata:
  name: app-prod
  labels:
    owner: platform-team
    environment: prod
Ici, les labels obligatoires
sont owner et environment

## Synthèse

![Slide 211](/securite-cloud/09-securite-conteneurs-kubernetes/p211_04_Image67.jpg)

## Polaris : Validateur des meilleures pratiques Kubernetes

(Fairwinds)
Polaris valide que vos ressources K8s suivent les meilleurs pratiques de sécurité et de fiabilité. Il peut fonctionner en audit, en
CI/CD ou en admission webhook en temps réel.
Concept Fonctionnement
- Validateur des meilleurs pratiques K8s (Fairwinds, OSS)
- 3 modes : CLI audit, CI/CD check,  Admission webhook
- Vérifie : security contexts, resource limits et health
checks
- Checks par catégorie : sécurité, fiabilité et efficacité
- Profils de sévérité configurables
(danger/warning/ignore)
- Score global 0-100 : 'fiabilité et sécurité du cluster'
- Alternatives : Kubescape (plus complet) · kube-score
- Mode webhook : bloque les déploiements non conformes
- Checks clés : runAsNonRoot, readOnlyRootFilesystem,
resource limits/requests, liveness probe
- Intégration Helm
$> polaris audit --format=pretty (audit cluster)
$> polaris audit --audit-path=./k8s/ (audit
manifestes locaux)
$> polaris audit --format=score (score 0-100)

## Les vérifications

Critique Warning Conforme
- privileged = true
- allowPrivilegeEscalation = true
- hostPID = true
- hostIPC = true
- hostNetwork = true
- Exécution en root
(runAsNonRoot = false)
- runAsNonRoot non défini
- readOnlyRootFilesystem non défini
- securityContext absent ou
incomplet
- CPU requests non définies
- Memory requests non définies
- CPU limits non définies
- Memory limits non définies
- livenessProbe absente
- readinessProbe absente
- startupProbe absente
- Image utilisant le tag latest
- Image sans tag explicite
- Exécution non-root
(runAsNonRoot = true)
- allowPrivilegeEscalation = false
- readOnlyRootFilesystem = true
- privileged = false
- Capabilities Linux réduites (drop:
ALL)
- Requests et Limits définies
- Probes configurées
- Security Context conforme
- Image versionnée avec un tag
explicite

## fonctionnement

![Slide 215](/securite-cloud/09-securite-conteneurs-kubernetes/p215_05_Image68.jpg)

## Falco : Runtime Security & Détection Comportementale

- Projet CNCF open source de détection des menaces en temps réel pour Linux, containers et Kubernetes.
- Analyse les syscalls et les événements K8s pour détecter les comportements anormaux pendant l'exécution.
- Règles Falco par défaut : spawn shell dans container · lecture /etc/shadow · écriture dans /bin ou /usr/bin ·
connexion réseau inattendue · ptrace syscall
- Fonctionnement : hook kernel via eBPF (recommandé) ou module noyau → analyse syscalls en temps réel —
overhead <5%
- Sources : syscalls Linux · K8s Audit Logs · Cloud APIs (AWS CloudTrail plugin) · container runtime events
- Destinations d'alertes : stdout/syslog · Slack/PagerDuty via Falco Sidekick · SIEM via Fluentd/Logstash ·
SNS/Pub-Sub
- Exemple règle custom : alerter si un process écrit dans /etc/crontab ou crée une tâche cron dans un container
Falco est l'équivalent d'un système de détection d'intrusion (IDS) pour Kubernetes : il observe les activités des
conteneurs et déclenche des alertes dès qu'un comportement suspect est détecté.

## Ce que Falco surveille

Activités suspectes Kubernetes Hôtes Linux Exemples de détections
- Shell lancé dans un
conteneur
- Exécution d'outils
d'administration
- Téléchargement de
fichiers suspects
- Modification de
fichiers système
- Escalade de
privilèges
- Création de Pods
privilégiés
- Utilisation de
conteneurs root
- Modification de
ressources
sensibles
- Accès anormaux
à l'API
Kubernetes
- Exécution de
commandes sensibles
- Connexions réseau
suspectes
- Accès aux fichiers
critiques
- Shell interactif dans un
conteneur
-  Conteneur exécuté en mode
privilégié
- Écriture dans /etc
- Exécution de curl, wget ou nc
dans un Pod applicatif
- Connexion réseau vers une
adresse inconnue
- Lecture de secrets Kubernetes

## FONCTIONNEMENT

Le SOAR (Security Orchestration, Automation and Response) est une plateforme qui orchestre les outils de sécurité,
automatise les processus de réponse aux incidents et assiste les équipes SOC dans la gestion des cyberattaques.
Exemples de solutions : Cortex XSOAR, Splunk SOAR, Microsoft Sentinel, IBM QRadar SOAR, FortiSOAR, Google Security
Operations et Tines.

![Slide 219](/securite-cloud/09-securite-conteneurs-kubernetes/p219_06_Image69.jpg)

## NeuVector : Sécurité Containers & K8s Full Lifecycle

- NeuVector (open source depuis 2022, racheté par SUSE) est une plateforme CWPP complète pour Kubernetes : Réseau Zero Trust,
analyse des vulnérabilités et conformité.
Concept & position Fonctionnalités clés
- CWPP (Cloud Workload Protection Platform) pour
Kubernetes
- Concurrent : Falco (runtime) + Trivy (scan) + Calico
- NeuVector = solution tout-en-un : scan + runtime +
réseau
- Déployé en DaemonSet sur chaque nœud Kubernetes
- Alternatives : Aqua Security, Sysdig, Prisma Cloud
Compute
- Forces : réseau Zero Trust natif, sans agent séparé
- Sécurité réseau : micro-segmentation automatique des Pods
et contrôle des communications
- Apprentissage comportemental : identification automatique
des flux et comportements légitimes
- Protection à l'exécution (runtime) : détection et blocage des
activités anormales ou malveillantes
- Analyse des vulnérabilités : scan continu des images de
conteneurs et des nœuds Kubernetes
- Conformité réglementaire : vérification automatisée des
référentiels CIS Kubernetes, PCI-DSS et HIPAA
- Pare-feu applicatif (WAF) : protection des applications et des
flux HTTP/HTTPS (couche 7)
- Prévention des fuites de données (DLP) : détection des
données sensibles circulant dans les communications réseau

## FONCTIONNEMENT

![Slide 222](/securite-cloud/09-securite-conteneurs-kubernetes/p222_07_Image70.jpg)

## NeuVector vs Falco

Critère Falco NeuVector
Positionnement Détection comportementale à l'exécution Plateforme complète de sécurité Kubernetes
Détection Détection des comportements suspects Détection des menaces et anomalies
Prévention Alertes uniquement Détection et blocage des menaces
Sécurité réseau Non Micro-segmentation et réseau Zero Trust
Analyse des vulnérabilités Non Scan des images, conteneurs et nœuds
Conformité Non Contrôles CIS Benchmarks, PCI-DSS, HIPAA, etc.
Approche Outil spécialisé runtime sécurité Solution tout-en-un (runtime + réseau + scan)
Configuration Règles Falco (YAML) Interface graphique, API et CRD Kubernetes
Complexité Léger et simple à déployer Plus complet mais plus complexe
Cas d'usage privilégié Détection d'intrusion et surveillance runtime Protection globale des workloads Kubernetes
Avantages Léger, flexible, modulaire Couverture sécurité étendue
Limites Pas de prévention native ni de sécurité réseau Plus lourd et plus riche fonctionnellement

## KSPM & CIS Kubernetes Benchmark (kube-bench)

- KSPM (Kubernetes Security Posture Management) évalue en continu la configuration de vos clusters
Kubernetes contre des référentiels de sécurité (CIS Benchmarks, MITRE ATT&CK for Kubernetes, NSA
Kubernetes Hardening Guide).
- kube-bench (Aqua Security) : outil open source qui vérifie la conformité CIS Kubernetes Benchmark :
100+ vérifications automatiques
- Domaines audités : kube-apiserver · etcd · kube-scheduler · kube-controller-manager · kubelet · fichiers
de configuration
- Solutions KSPM marché : Prisma Cloud KSPM · Wiz for Kubernetes · Aqua Security · Sysdig Secure ·
Lacework
- Détection de drift : comparer config cluster en cours vs. IaC Terraform/Helm : alerter sur les divergences
Recommandation : lancer kube-bench à chaque nouveau nœud ajouté et hebdomadairement sur tous les
cluster.

## Kubescape : Kubernetes Security Posture Management

- Kubescape est le scanner KSPM de référence de la CNCF.
- Il audite votre cluster K8s contre les frameworks CIS Benchmark, NSA/CISA, MITRE ATT&CK et les contrôles RBAC.
Concept & position Commandes clés vs kube-bench & Polaris
- KSPM (K8s Security Posture
Management) open source CNCF
- Audite clusters K8s / EKS / AKS /
GKE / OpenShift
- Frameworks : CIS K8s 1.8 ·
NSA/CISA · MITRE ATT&CK
- Analyse : RBAC · Network Policies ·
PSS · Images
- Score de risque 0-100 par
namespace et par cluster
- Alternatives : kube-bench (CIS
uniquement) · Polaris · Trivy
- ARMO Platform : version cloud
avec monitoring continu
$> kubescape scan --submit (scan +
dashboard cloud)
$> kubescape scan framework cis-eks
(scan CIS EKS spécifique)
$> kubescape scan framework nsa
(framework NSA/CISA)
$> kubescape scan control C-0013 (1
contrôle précis)
$> kubescape scan --severity critical
(filtrer par criticité)
$> kubescape scan --exceptions
./exceptions.json
$> kubescape scan image nginx:latest
(scan image)
- kube-bench : CIS K8s uniquement, très
léger, nodes only
- Kubescape : multi-framework,
ressources K8s + images
- Polaris : best practices Fairwinds, UX
orientée devs
- Kubescape : plus complet mais plus
lourd que kube-bench
- Trivy : scan images + misconfigs K8s (alt.
léger)
- Recommandation : Kubescape (complet)
+ kube-bench (CIS nodes)
- Tous peuvent coexister dans un pipeline
CI/CD

## Prêt pour lundi

Auditer les RBAC ClusterRoleBindings avec cluster-admin
kubectl get clusterrolebindings -o json | jq '.items[] | select(.roleRef.name=="cluster-admin") |
.subjects'
< 2 min / Gratuit / Chaque binding cluster-admin non justifié est un vecteur d'escalade
Vérifier qu'il n'y a pas de pods avec allowPrivilegeEscalation: true
kubectl get pods --all-namespaces -o json | jq
'.items[].spec.containers[].securityContext.allowPrivilegeEscalation'
< 2 min / Gratuit / Un pod privilégié peut compromettre le nœud entier (container escape)
Installer Falco en 5 minutes avec Helm
helm repo add falcosecurity https://falcosecurity.github.io/charts && helm install falco
falcosecurity/falco --namespace falco --create-namespace
< 10 min / Gratuit / Détection comportementale runtime (alertes si un pod exécute des commandes suspectes)
