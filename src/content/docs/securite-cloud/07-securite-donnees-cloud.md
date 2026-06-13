---
title: "07. Sécurité des données cloud"
---

# 07. Sécurité des données cloud

## 07. Sécurité des

données cloud

![Slide 144](/securite-cloud/07-securite-donnees-cloud/p144_00_Image13.jpg)

## Chiffrement des Données : At Rest & In Transit

Objectif : Processus de transformation des données en un format illisible sans la clé de déchiffrement
appropriée. Protège la confidentialité même en cas d'accès non autorisé aux supports de stockage.
- At Rest (données stockées) : S3 SSE-KMS, SSE-S3, SSE-C · EBS chiffré · RDS TDE · Snapshots
chiffrés.
- In Transit (données en mouvement) : TLS 1.2 minimum (TLS 1.3 recommandé) · mTLS pour
service-to-service · VPN ou Direct Connect.
- Algorithmes : AES-256 (symétrique, standard) · RSA-2048/4096 (asymétrique, échange de clés) ·
ECDSA (signatures).
- Séparation clé/données : stocker les clés de chiffrement séparément des données chiffrées (KMS,
HSM dédié).
- Politique : activer le chiffrement par défaut sur tous les services cloud (pas d'exception pour les
environnements dev).

## KMS & Hiérarchie des Clés : AWS, Azure, GCP

AWS KMS Azure Key Vault GCP Cloud KMS
- CMK (Customer Managed Keys) : vous
contrôlez la politique
- AWS Managed Keys :  gérées par AWS
pour chaque service
- Rotation annuelle automatique des
CMK (activable)
- Audit complet de chaque utilisation via
CloudTrail
- Multi-region keys pour la résilience
- Cross-account access via Key Policy
- CloudHSM : HSM dédié FIPS 140-2
Level 3 dans votre VPC
- Trois types : Secrets · Keys · Certificates dans
une seule solution
- Tiers Standard (logiciel) et Premium (HSM
backing)
- Soft-delete (90j) + Purge Protection :
protection contre l'effacement
- RBAC granulaire avec Azure AD et Managed
Identity
- Backup & Restore cross-region des clés
- Azure Dedicated HSM pour isolation complète
(nCipher nShield)
- Rotation automatique configurable via Event
Grid + Azure Functions
- Clés symétriques AES-256 et asymétriques
RSA/EC
- Cloud HSM : protection matérielle FIPS
140-2 Level 3
- CMEK (Customer-Managed Encryption Keys)
pour chaque service
- Rotation automatique planifiée avec
conservation des anciennes versions
- Cloud EKM (External Key Manager) : clés
hébergées hors GCP
- Audit logs automatiques dans Cloud Audit
Logs
- IAM conditions pour accès contextuel
(heure, réseau, etc.)

## Bring Your Own Key (BYOK)

Objectif : Modèle où le client génère sa propre clé de chiffrement maîtresse en dehors du cloud
provider, puis l'importe dans le service KMS du provider. Le client conserve une copie externe et peut
révoquer l'accès à tout moment.
- Avantage principal : séparation cryptographique entre les données et le provider cloud = le
provider n'a jamais accès à votre clé en clair
- Processus AWS : Générer en HSM externe → Importer via CLI avec wrapping key → AWS KMS
stocke le ciphertext de votre key
- Processus Azure : Générer en Azure Key Vault Premium (HSM) ou HSM externe → Import via Key
Transfer Blob
- Cas d'usage obligatoire : SecNumCloud · HDS (Hébergement Données de Santé) · données de
souveraineté · finance réglementée
- Risque BYOK : perte de votre clé externe = perte DÉFINITIVE de l'accès à vos données — backup
sécurisé obligatoire

## Classification des Données : Niveaux et Outils

Niveau de classification Description et exemples Mesures de sécurité
Public
Données librement accessibles, sans impact si divulguées
Ex: Plaquettes commerciales, site web public, communiqués de
presse
Aucun contrôle spécifique : vérifier
qu'elles ne contiennent pas de
méta-données sensibles
Interne Données à usage interne uniquement, impact limité si
divulguées
Ex: Politiques internes, présentations internes, organigrammes
Authentification requise, Pas de partage,
externe sans autorisation, Logs d'accès
Confidentiel Données sensibles pouvant causer un préjudice si divulguées
Ex: Données clients, contrats, code source, données financières
Chiffrement at rest/in transit, MFA, DLP ,
Accès restreint, Audit trail
Secret / très sensible Données critiques : divulgation = impact majeur
Ex: PII, données de santé, données paiement, secrets
industriels
BYOK, HSM, Accès JIT PAM, DLP strict,
DSPM, Notification CNIL si violation

## Amazon MACIE

- Amazon Macie est un service de
sécurité et de confidentialité des
données entièrement géré qui utilise
du machine learning et la
correspondance de modèles pour
découvrir et protéger vos données
sensibles dans AWS.
- Macie aide à identifier et à vous alerter
sur les données sensibles, telles que les
informations personnelles identifiables
(PII: prénom, nom de famille, adresse
de facturation, adresse du domicile,
IBAN, emails, clés APi, mots de passe,
etc.)

![Slide 149](/securite-cloud/07-securite-donnees-cloud/p149_01_Image50.jpg)

## Cloud Act & Souveraineté des Données

CLOUD ACT (2018) : Clarifying Lawful Overseas Use of Data Act
Loi américaine autorisant le gouvernement US à exiger des entreprises américaines (AWS, Azure, Google...) l'accès à des données
stockées n'importe où dans le monde, y compris en Europe.
Ce que dit la loi Impact concret Comment se protéger ?
- Les fournisseurs cloud US peuvent être
contraints de livrer des données sans
notification préalable
- S'applique même si le datacenter est en
France/Allemagne
- Dépasse le RGPD dans certains cas
(conflit de lois)
- Concerne AWS, Microsoft, Google,
Oracle, etc.
- Données sensibles d'entreprises françaises
potentiellement accessibles par le DoJ US
- Conflit avec RGPD : violation possible si
livraison sans consentement
- Données de santé, défense, finances : risque
maximal
- Accords EUCS & Cloud de Confiance en
réponse
- SecNumCloud (ANSSI) : qualification qui
inclut une protection juridique
- Chiffrement BYOK : clés hors portée du
fournisseur US
- Fournisseurs européens souverains
(OVHcloud, Outscale...)
- Clauses contractuelles spécifiques Cloud Act
dans les contrats

## WAF, API Gateway , Service Mesh : Lequel choisir ?

Ces 3 outils se complètent mais ne se remplacent pas. Choisir le mauvais = protection incomplète ou coût inutile.
vvv vvvv

## LAB : IAM

dhdfhfgh

![Slide 152](/securite-cloud/07-securite-donnees-cloud/p152_02_Image29.jpg)
