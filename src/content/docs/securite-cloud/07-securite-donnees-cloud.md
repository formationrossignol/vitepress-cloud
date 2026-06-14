---
title: "07. Sécurité des données cloud"
---

# 07. Sécurité des données cloud

## Chiffrement des données : At rest & in transit


| Objectif : Processus de transformation des données en un format illisible sans la clé de déchiffrement<br>appropriée. Protège la confidentialité même en cas d'accès non autorisé aux supports de stockage.<br>•  At Rest (données stockées) : S3 SSE-KMS, SSE-S3, SSE-C · EBS chiffré · RDS TDE · Snapshots<br>chiffrés.<br>•  In Transit (données en mouvement) : TLS 1.2 minimum (TLS 1.3 recommandé) · mTLS pour<br>service-to-service · VPN ou Direct Connect.<br>•  Algorithmes : AES-256 (symétrique, standard) · RSA-2048/4096 (asymétrique, échange de clés) ·<br>ECDSA (signatures).<br>•  Séparation clé/données : stocker les clés de chiffrement séparément des données chiffrées (KMS,<br>HSM dédié).<br>•  Politique : activer le chiffrement par défaut sur tous les services cloud (pas d'exception pour les<br>environnements dev). |  |
| --- | --- |
|  | 1 |


## KMS & Hiérarchie des Clés : AWS, Azure, GCP


| AWS KMS | Azure Key Vault | GCP Cloud KMS |
| --- | --- | --- |
| •  CMK (Customer Managed Keys) : vous<br>contrôlez la politique<br>•  AWS Managed Keys : gérées par AWS<br>pour chaque service<br>•  Rotation annuelle automatique des<br>CMK (activable)<br>•  Audit complet de chaque utilisation via<br>CloudTrail<br>•  Multi-region keys pour la résilience<br>•  Cross-account access via Key Policy<br>•  CloudHSM : HSM dédié FIPS 140-2<br>Level 3 dans votre VPC | •  Trois types : Secrets · Keys · Certificates dans<br>une seule solution<br>•  Tiers Standard (logiciel) et Premium (HSM<br>backing)<br>•  Soft-delete (90j) + Purge Protection :<br>protection contre l'effacement<br>•  RBAC granulaire avec Azure AD et Managed<br>Identity<br>•  Backup & Restore cross-region des clés<br>•  Azure Dedicated HSM pour isolation complète<br>(nCipher nShield)<br>•  Rotation automatique configurable via Event<br>Grid + Azure Functions | •  Clés symétriques AES-256 et asymétriques<br>RSA/EC<br>•  Cloud HSM : protection matérielle FIPS<br>140-2 Level 3<br>•  CMEK (Customer-Managed Encryption Keys)<br>pour chaque service<br>•  Rotation automatique planifiée avec<br>conservation des anciennes versions<br>•  Cloud EKM (External Key Manager) : clés<br>hébergées hors GCP<br>•  Audit logs automatiques dans Cloud Audit<br>Logs<br>•  IAM conditions pour accès contextuel<br>(heure, réseau, etc.) |


## Bring your own key (BYOK)


| Objectif : Modèle où le client génère sa propre clé de chiffrement maîtresse en dehors du cloud<br>provider, puis l'importe dans le service KMS du provider. Le client conserve une copie externe et peut<br>révoquer l'accès à tout moment.<br>•  Avantage principal : séparation cryptographique entre les données et le provider cloud = le<br>provider n'a jamais accès à votre clé en clair<br>•  Processus AWS : Générer en HSM externe → Importer via CLI avec wrapping key → AWS KMS<br>stocke le ciphertext de votre key<br>•  Processus Azure : Générer en Azure Key Vault Premium (HSM) ou HSM externe → Import via Key<br>Transfer Blob<br>•  Cas d'usage obligatoire : SecNumCloud · HDS (Hébergement Données de Santé) · données de<br>souveraineté · finance réglementée<br>•  Risque BYOK : perte de votre clé externe = perte DÉFINITIVE de l'accès à vos données — backup<br>sécurisé obligatoire |  |
| --- | --- |
|  | 1 |


## Classification des données : Niveaux et outils


| Niveau de classification | Description et exemples | Mesures de sécurité |  |
| --- | --- | --- | --- |
| Public | Données librement accessibles, sans impact si divulguées<br>Ex: Plaquettes commerciales, site web public, communiqués de<br>presse | Aucun contrôle spécifique : vérifier<br>qu'elles ne contiennent pas de<br>méta-données sensibles |  |
| Interne | Données à usage interne uniquement, impact limité si<br>divulguées<br>Ex: Politiques internes, présentations internes, organigrammes | Authentification requise, Pas de partage,<br>externe sans autorisation, Logs d'accès |  |
| Confidentiel | Données sensibles pouvant causer un préjudice si divulguées<br>Ex: Données clients, contrats, code source, données financières | Chiffrement at rest/in transit, MFA, DLP,<br>Accès restreint, Audit trail |  |
| Secret / très sensible | Données critiques : divulgation = impact majeur<br>Ex: PII, données de santé, données paiement, secrets<br>industriels | BYOK, HSM, Accès JIT PAM, DLP strict,<br>DSPM, Notification CNIL si violation |  |
|  |  |  | 1 |


## Amazon Macie

- Amazon Macie est un service de
sécurité et de confidentialité des
données entièrement géré qui utilise
du machine learning et la
correspondance de modèles pour
découvrir et protéger vos données
sensibles dans AWS.
- Macie aide à identifier et à vous alerte
sur les données sensibles, telles que le
informations personnelles identifiables
(PII: prénom, nom de famille, adresse
de facturation, adresse du domicile,
IBAN, emails, clés APi, mots de passe,
etc.)

![Slide 149](/securite-cloud/07-securite-donnees-cloud/p149_00_Image50.jpg)


## Cloud act & souveraineté des données

CLOUD ACT (2018) : Clarifying Lawful Overseas Use of Data Act
Loi américaine autorisant le gouvernement US à exiger des entreprises américaines (AWS, Azure, Google...) l'accès à des données
stockées n'importe où dans le monde, y compris en Europe.

| Ce que dit la loi | Impact concret | Comment se protéger ? |
| --- | --- | --- |
| •  Les fournisseurs cloud US peuvent être<br>contraints de livrer des données sans<br>notification préalable<br>•  S'applique même si le datacenter est en<br>France/Allemagne<br>•  Dépasse le RGPD dans certains cas<br>(conflit de lois)<br>•  Concerne AWS, Microsoft, Google,<br>Oracle, etc. | •  Données sensibles d'entreprises françaises<br>potentiellement accessibles par le DoJ US<br>•  Conflit avec RGPD : violation possible si<br>livraison sans consentement<br>•  Données de santé, défense, finances : risque<br>maximal<br>•  Accords EUCS & Cloud de Confiance en<br>réponse | •  SecNumCloud (ANSSI) : qualification qui<br>inclut une protection juridique<br>•  Chiffrement BYOK : clés hors portée du<br>fournisseur US<br>•  Fournisseurs européens souverains<br>(OVHcloud, Outscale...)<br>•  Clauses contractuelles spécifiques Cloud Act<br>dans les contrats |


## WAF, API gateway, service mesh : Lequel choisir ?

Ces 3 outils se complètent mais ne se remplacent pas. Choisir le mauvais = protection incomplète ou coût inutile.


## LAB : IAM

dhdfhfgh

