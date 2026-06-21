---
title: "04. Sécurité des conteneurs & Kubernetes"
---

# 04. Sécurité des conteneurs & Kubernetes

## Sécurité de Docker : Hardening des images et des conteneurs


| Images de base minimales | Utilisateur non-root obligatoire |
| --- | --- |
| FROM ubuntu:latest<br>FROM alpine:3.19 | # Pas de USER → root par défaut<br>RUN adduser -D appuser && USER appuser |
| Pas de secrets dans les couches | Filesystem en lecture seule |
| ENV DB_PASSWORD=secret123<br>ARG DB_PASSWORD (build-time) + Secrets manager runtime | docker run myapp<br>docker run --read-only --tmpfs /tmp myapp |
| Capabilities Linux limitées | Scan CVE obligatoire |
| # Toutes les capabilities accordées<br>--cap-drop=ALL --cap-add=NET_BIND_SERVICE | # Image déployée sans scan<br>trivy image myapp:latest (gate CI bloquant) |


## Kubernetes RBAC : Contrôle d'accès au cluster

RBAC K8s : Sujets (Users/Groups/ServiceAccounts) → Verbs (get/list/create/delete) → Resources (pods/secrets/deployments)

| Objets RBAC Kubernetes | Anti-patterns K8S à éviter |
| --- | --- |
| •  Role : permissions dans un namespace spécifique<br>•  ClusterRole : permissions cluster-wide (tous namespaces)<br>•  RoleBinding : lie un Role à des sujets dans un namespace<br>•  ClusterRoleBinding : lie un ClusterRole à des sujets globalement<br>•  ServiceAccount : identité pour les pods (≠ user humain) | •  Wildcard dans les verbes : verbs: ["*"] : JAMAIS<br>•  ClusterAdmin bindé à un ServiceAccount applicatif<br>•  Default ServiceAccount avec des droits (le désactiver)<br>•  Partage de ServiceAccount entre plusieurs apps<br>•  Oublier de désactiver automountServiceAccountToken |
| apiVersion: rbac.authorization.k8s.io/v1<br>kind: Role<br>metadata:<br>name: pod-reader<br>namespace: default<br>rules:<br>- apiGroups: [""]<br>resources: ["pods"]<br>verbs: ["get", "list", "watch"] # jamais "*" |  |


## Network policies : Micro-segmentation dans Kubernetes


| Principe de fonctionnement |  |  |
| --- | --- | --- |
| Contrôle du trafic Est-Ouest | Contrôle du trafic Nord-Sud | Approche "Default Deny" |
| •  Pod → Pod<br>•  Namespace → Namespace<br>•  Pod → Service | •  Entrées depuis l'extérieur<br>•  Sorties vers Internet ou<br>vers des services externes | •  Tout est interdit par défaut<br>•  Les flux nécessaires sont<br>explicitement autorisés<br>•  Les autres communications<br>restent bloquées |



Attention : Par défaut dans Kubernetes, tout le trafic est autorisé entre tous les pods de tous les namespaces !

| Default Deny All | Allow Namespace → Namespace | Allow Egress HTTPS |
| --- | --- | --- |
| Première règle déployée dans chaque<br>namespace. Bloque tout trafic IN et<br>OUT. Puis ouvrir uniquement les flux<br>nécessaires. | Autoriser uniquement le trafic entre<br>namespaces spécifiques. Ex: ns/frontend →<br>ns/backend uniquement via port 8080. | Autoriser uniquement le trafic sortant<br>HTTPS vers Internet pour les mises à jour,<br>webhooks, API externes. |
| spec:<br>podSelector: {}<br>policyTypes:<br>- Ingress<br>- Egress<br># bloque TOUT<br># puis ouvrir sélectivement | spec:<br>ingress:<br>- from:<br>- namespaceSelector:<br>matchLabels:<br>name: frontend<br>- podSelector: {} | spec:<br>podSelector:<br>matchLabels:<br>app: myapp<br>egress:<br>- ports:<br>- port: 443<br>protocol: TCP |


## Fonctionnement


![Slide 153](/securite-cloud/09-securite-conteneurs-kubernetes/p153_v37_Image56.jpg)


## Pod security standards (PSS)

Les Pod Security Standards (PSS) définissent des niveaux de sécurité prédéfinis qui contrôlent les
configurations autorisées des Pods Kubernetes afin de réduire les risques de compromission.




![Slide 156](/securite-cloud/09-securite-conteneurs-kubernetes/p156_v37_Image57.jpg)


## Admission controllers : Contrôler les ressources avant leur

création
Un Admission Controller est un mécanisme (plugin) Kubernetes qui intercepte les requêtes envoyées à l’API Server
après l’authentification et l’autorisation, mais avant l’enregistrement de la ressource dans le cluster. Il permet de
modifier, valider ou refuser une ressource afin d’appliquer des règles de sécurité, de conformité ou de gouvernance.

| Élément | Description |
| --- | --- |
| Rôle | Intercepter les requêtes envoyées à l’API Server avant l’enregistrement de la<br>ressource |
| Position | Après l’authentification et l’autorisation RBAC, avant la persistance dans etcd |
| Types | Mutating Admission Controller et Validating Admission Controller |
| Objectif sécurité | Empêcher l’entrée de configurations dangereuses ou non conformes dans le cluster |
| Résultat | La ressource est modifiée, acceptée ou refusée |




| 1 | Un utilisateur, une CI/CD ou un contrôleur envoie<br>une requête à l’API Kubernetes |
| --- | --- |
| 2 | Kubernetes authentifie l’identité |
| 3 | Kubernetes vérifie les droits avec RBAC |
| 4 | L’Admission Controller intercepte la requête |
| 5 | Un contrôleur mutating peut modifier la<br>ressource |
| 6 | Un contrôleur validating vérifie la conformité |
| 7 | La ressource est acceptée ou refusée avant<br>création |

![Slide 159](/securite-cloud/09-securite-conteneurs-kubernetes/p159_v37_Image58.jpg)


## Admission controllers courants


| Contrôleur | Type | Rôle dans l’admission |
| --- | --- | --- |
| PodSecurity | Validating | Applique les niveaux PSS Privileged, Baseline, Restricted aux Pods |
| ResourceQuota | Validating | Refuse les créations qui dépassent les quotas d’un namespace |
| LimitRanger | Mutating / Validating | Définit des valeurs par défaut ou vérifie les limites CPU / mémoire |
| ValidatingAdmissionWebhook | Validating | Délègue la validation à un webhook externe |
| MutatingAdmissionWebhook | Mutating | Délègue la modification d’une ressource à un webhook externe |
| ValidatingAdmissionPolicy | Validating | Applique des règles d’admission déclaratives avec CEL |
| ServiceAccount | Mutating / Validating | Associe les Pods à une identité Kubernetes et vérifie certains<br>prérequis |


## OPA Gatekeeper : Appliquer des politiques Kubernetes

OPA Gatekeeper est un contrôleur d’admission Kubernetes qui applique des politiques déclaratives exécutées par Open Policy
Agent. Il permet de refuser ou modifier des ressources qui ne respectent pas les règles définies pour le cluster. La
documentation officielle le décrit comme un webhook validating et mutating qui applique des politiques basées sur des CRD et
exécutées par OPA.

| Élément | Description |
| --- | --- |
| Rôle | Contrôler les ressources Kubernetes avant leur création ou modification |
| Position | S’appuie sur les Admission Controllers Kubernetes |
| Moteur | Open Policy Agent |
| Type | Validating et mutating webhook |
| Langage | Rego |
| Objets clés | ConstraintTemplate et Constraint |
| Objectif | Imposer automatiquement des règles de sécurité, conformité et gouvernance |




![Slide 163](/securite-cloud/09-securite-conteneurs-kubernetes/p163_v37_Image59.jpg)


## Exemples de politiques

OPA Gatekeeper transforme les règles de sécurité Kubernetes en politiques exécutées automatiquement à
l’entrée du cluster.

| Politique | Contrôle appliqué |
| --- | --- |
| Interdire les Pods privilégiés | Bloque les configurations à risque |
| Imposer des labels obligatoires | Renforce la traçabilité |
| Interdire les images latest | Améliore la reproductibilité |
| Restreindre les registres d’images | Contrôle la provenance des conteneurs |
| Interdire les volumes hostPath | Réduit l’exposition du nœud hôte |
| Imposer des limites CPU / mémoire | Encadre la consommation de ressources |


## Synthèse


![Slide 166](/securite-cloud/09-securite-conteneurs-kubernetes/p166_v37_Image60.jpg)


## Polaris : Validateur des meilleures pratiques Kubernetes

(Fairwinds)
Polaris valide que vos ressources K8s suivent les meilleurs pratiques de sécurité et de fiabilité. Il peut fonctionner en audit, en
CI/CD ou en admission webhook en temps réel.

| Concept | Fonctionnement |
| --- | --- |
| •  Validateur des meilleurs pratiques K8s (Fairwinds, OSS)<br>•  3 modes : CLI audit, CI/CD check, Admission webhook<br>•  Vérifie : security contexts, resource limits et health<br>checks<br>•  Checks par catégorie : sécurité, fiabilité et efficacité<br>•  Profils de sévérité configurables<br>(danger/warning/ignore)<br>•  Score global 0-100 : 'fiabilité et sécurité du cluster'<br>•  Alternatives : Kubescape (plus complet) · kube-score | •  Mode webhook : bloque les déploiements non conformes<br>•  Checks clés : runAsNonRoot, readOnlyRootFilesystem,<br>resource limits/requests, liveness probe<br>•  Intégration Helm |
|  | $> polaris audit --format=pretty (audit cluster)<br>$> polaris audit --audit-path=./k8s/ (audit<br>manifestes locaux)<br>$> polaris audit --format=score (score 0-100) |


## Les vérifications


| Critique | Warning | Conforme |
| --- | --- | --- |
| •  privileged = true<br>•  allowPrivilegeEscalation = true<br>•  hostPID = true<br>•  hostIPC = true<br>•  hostNetwork = true<br>•  Exécution en root<br>(runAsNonRoot = false) | •  runAsNonRoot non défini<br>•  readOnlyRootFilesystem non défini<br>•  securityContext absent ou<br>incomplet<br>•  CPU requests non définies<br>•  Memory requests non définies<br>•  CPU limits non définies<br>•  Memory limits non définies<br>•  livenessProbe absente<br>•  readinessProbe absente<br>•  startupProbe absente<br>•  Image utilisant le tag latest<br>•  Image sans tag explicite | •  Exécution non-root<br>(runAsNonRoot = true)<br>•  allowPrivilegeEscalation = false<br>•  readOnlyRootFilesystem = true<br>•  privileged = false<br>•  Capabilities Linux réduites (drop:<br>ALL)<br>•  Requests et Limits définies<br>•  Probes configurées<br>•  Security Context conforme<br>•  Image versionnée avec un tag<br>explicite |




![Slide 170](/securite-cloud/09-securite-conteneurs-kubernetes/p170_v37_Image61.jpg)


## Falco : Runtime security & détection comportementale

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


| Activités suspectes | Kubernetes | Hôtes Linux | Exemples de détections |
| --- | --- | --- | --- |
| •  Shell lancé dans un<br>conteneur<br>•  Exécution d'outils<br>d'administration<br>•  Téléchargement de<br>fichiers suspects<br>•  Modification de<br>fichiers système<br>•  Escalade de<br>privilèges | •  Création de Pods<br>privilégiés<br>•  Utilisation de<br>conteneurs root<br>•  Modification de<br>ressources<br>sensibles<br>•  Accès anormaux<br>à l'API<br>Kubernetes | •  Exécution de<br>commandes sensibles<br>•  Connexions réseau<br>suspectes<br>•  Accès aux fichiers<br>critiques | •  Shell interactif dans un<br>conteneur<br>•  Conteneur exécuté en mode<br>privilégié<br>•  Écriture dans /etc<br>•  Exécution de curl, wget ou nc<br>dans un Pod applicatif<br>•  Connexion réseau vers une<br>adresse inconnue<br>•  Lecture de secrets Kubernetes |



Le SOAR (Security Orchestration, Automation and Response) est une plateforme qui orchestre les outils de sécurité,
automatise les processus de réponse aux incidents et assiste les équipes SOC dans la gestion des cyberattaques.
Exemples de solutions : Cortex XSOAR, Splunk SOAR, Microsoft Sentinel, IBM QRadar SOAR, FortiSOAR, Google Security
Operations et Tines.

![Slide 174](/securite-cloud/09-securite-conteneurs-kubernetes/p174_v37_Image62.jpg)


| Concept & position | Fonctionnalités clés |
| --- | --- |
| •  CWPP (Cloud Workload Protection Platform) pour<br>Kubernetes<br>•  Concurrent : Falco (runtime) + Trivy (scan) + Calico<br>•  NeuVector = solution tout-en-un : scan + runtime +<br>réseau<br>•  Déployé en DaemonSet sur chaque nœud Kubernetes<br>•  Alternatives : Aqua Security, Sysdig, Prisma Cloud<br>Compute<br>•  Forces : réseau Zero Trust natif, sans agent séparé | •  Sécurité réseau : micro-segmentation automatique des Pods<br>et contrôle des communications<br>•  Apprentissage comportemental : identification automatique<br>des flux et comportements légitimes<br>•  Protection à l'exécution (runtime) : détection et blocage des<br>activités anormales ou malveillantes<br>•  Analyse des vulnérabilités : scan continu des images de<br>conteneurs et des nœuds Kubernetes<br>•  Conformité réglementaire : vérification automatisée des<br>référentiels CIS Kubernetes, PCI-DSS et HIPAA<br>•  Pare-feu applicatif (WAF) : protection des applications et des<br>flux HTTP/HTTPS (couche 7)<br>•  Prévention des fuites de données (DLP) : détection des<br>données sensibles circulant dans les communications réseau |




![Slide 177](/securite-cloud/09-securite-conteneurs-kubernetes/p177_v37_Image63.jpg)


## KSPM & CIS Kubernetes benchmark (kube-bench)

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


## Kubescape : Kubernetes security posture management

- Kubescape est le scanner KSPM de référence de la CNCF.
- Il audite votre cluster K8s contre les frameworks CIS Benchmark, NSA/CISA, MITRE ATT&CK et les contrôles RBAC.

| Concept & position | Commandes clés | vs kube-bench & Polaris |
| --- | --- | --- |
| •  KSPM (K8s Security Posture<br>Management) open source CNCF<br>•  Audite clusters K8s / EKS / AKS /<br>GKE / OpenShift<br>•  Frameworks : CIS K8s 1.8 ·<br>NSA/CISA · MITRE ATT&CK<br>•  Analyse : RBAC · Network Policies ·<br>PSS · Images<br>•  Score de risque 0-100 par<br>namespace et par cluster<br>•  Alternatives : kube-bench (CIS<br>uniquement) · Polaris · Trivy<br>•  ARMO Platform : version cloud<br>avec monitoring continu | $> kubescape scan --submit (scan +<br>dashboard cloud)<br>$> kubescape scan framework cis-eks<br>(scan CIS EKS spécifique)<br>$> kubescape scan framework nsa<br>(framework NSA/CISA)<br>$> kubescape scan control C-0013 (1<br>contrôle précis)<br>$> kubescape scan --severity critical<br>(filtrer par criticité)<br>$> kubescape scan --exceptions<br>./exceptions.json<br>$> kubescape scan image nginx:latest<br>(scan image) | •  kube-bench : CIS K8s uniquement, très<br>léger, nodes only<br>•  Kubescape : multi-framework,<br>ressources K8s + images<br>•  Polaris : best practices Fairwinds, UX<br>orientée devs<br>•  Kubescape : plus complet mais plus<br>lourd que kube-bench<br>•  Trivy : scan images + misconfigs K8s (alt.<br>léger)<br>•  Recommandation : Kubescape (complet)<br>+ kube-bench (CIS nodes)<br>•  Tous peuvent coexister dans un pipeline<br>CI/CD |


## NeuVector : Sécurité containers & K8s full lifecycle

NeuVector (open source depuis 2022, racheté par SUSE) est une plateforme CWPP complète pour Kubernetes : Réseau Zero Trust, analyse des vulnérabilités et conformité.

| Concept & position | Fonctionnalités clés |
| --- | --- |
| CWPP (Cloud Workload Protection Platform) pour Kubernetes | Sécurité réseau : micro-segmentation automatique des Pods et contrôle des communications |
| Concurrent : Falco (runtime) + Trivy (scan) + Calico | Apprentissage comportemental : identification automatique des flux et comportements légitimes |
| NeuVector = solution tout-en-un : scan + runtime + réseau | Protection à l'exécution (runtime) : détection et blocage des activités anormales ou malveillantes |
| Déployé en DaemonSet sur chaque nœud Kubernetes | Analyse des vulnérabilités : scan continu des images de conteneurs et des nœuds Kubernetes |
| Alternatives : Aqua Security, Sysdig, Prisma Cloud Compute | Conformité réglementaire : vérification automatisée des référentiels CIS Kubernetes, PCI-DSS et HIPAA |
| Forces : réseau Zero Trust natif, sans agent séparé | Pare-feu applicatif (WAF) : protection des applications et des flux HTTP/HTTPS (couche 7) |
| — | Prévention des fuites de données (DLP) : détection des données sensibles circulant dans les communications réseau |


## NeuVector vs Falco

| Critère | Falco | NeuVector |
| --- | --- | --- |
| Positionnement | Détection comportementale à l'exécution | Plateforme complète de sécurité Kubernetes |
| Détection | Détection des comportements suspects | Détection des menaces et anomalies |
| Prévention | Alertes uniquement | Détection et blocage des menaces |
| Sécurité réseau | Non | Micro-segmentation et réseau Zero Trust |
| Analyse des vulnérabilités | Non | Scan des images, conteneurs et nœuds |
| Conformité | Non | Contrôles CIS Benchmarks, PCI-DSS, HIPAA, etc. |
| Approche | Outil spécialisé runtime sécurité | Solution tout-en-un (runtime + réseau + scan) |
| Configuration | Règles Falco (YAML) | Interface graphique, API et CRD Kubernetes |
| Complexité | Léger et simple à déployer | Plus complet mais plus complexe |
| Cas d'usage privilégié | Détection d'intrusion et surveillance runtime | Protection globale des workloads Kubernetes |
| Avantages | Léger, flexible, modulaire | Couverture sécurité étendue |
| Limites | Pas de prévention native ni de sécurité réseau | Plus lourd et plus riche fonctionnellement |


## Prêt pour lundi

| # | Action | Commande | Durée / Coût | Impact |
| --- | --- | --- | --- | --- |
| 1 | Auditer les RBAC ClusterRoleBindings avec cluster-admin | `kubectl get clusterrolebindings -o json | jq '.items[] | select(.roleRef.name=="cluster-admin") | .subjects'` | 2 min / Gratuit | Chaque binding cluster-admin non justifié est un vecteur d'escalade |
| 2 | Vérifier qu'il n'y a pas de pods avec allowPrivilegeEscalation: true | `kubectl get pods --all-namespaces -o json | jq '.items[].spec.containers[].securityContext.allowPrivilegeEscalation'` | 2 min / Gratuit | Un pod privilégié peut compromettre le nœud entier (container escape) |
| 3 | Installer Falco en 5 minutes avec Helm | `helm repo add falcosecurity https://falcosecurity.github.io/charts && helm install falco falcosecurity/falco --namespace falco --create-namespace` | 10 min / Gratuit | Détection comportementale runtime (alertes si un pod exécute des commandes suspectes) |
