---
title: "06. Sécurité des données cloud"
---

# 06. Sécurité des données cloud

## Chiffrement des données : At rest & in transit

Le chiffrement des données se distingue selon l'état de la donnée dans le système d'information.

| Dimension | At rest (au repos) | In transit (en transit) |
| --- | --- | --- |
| Définition | Données stockées sur un support (disque, base, objet) | Données circulant sur le réseau entre deux points |
| Objectif | Protéger contre l'accès physique ou logique non autorisé | Protéger contre l'interception et le man-in-the-middle |
| Standard | AES-256 | TLS 1.2 / 1.3 |
| AWS | SSE-S3, SSE-KMS, EBS Encryption, RDS Encryption | ACM, HTTPS, VPN Site-to-Site, PrivateLink |
| Azure | SSE + CMK, Azure Disk Encryption, Transparent Data Encryption | TLS, VPN Gateway, ExpressRoute |
| GCP | CMEK, Cloud KMS, Persistent Disk Encryption | TLS, Cloud VPN, Dedicated Interconnect |
| Risque si absent | Exfiltration de données, violation RGPD / PCI-DSS | Interception des credentials, exfiltration réseau |

## KMS & Hiérarchie des Clés : AWS, Azure, GCP


| AWS KMS | Azure Key Vault | GCP Cloud KMS |
| --- | --- | --- |
| •  CMK (Customer Managed Keys) : vous<br>contrôlez la politique<br>•  AWS Managed Keys : gérées par AWS<br>pour chaque service<br>•  Rotation annuelle automatique des<br>CMK (activable)<br>•  Audit complet de chaque utilisation via<br>CloudTrail<br>•  Multi-region keys pour la résilience<br>•  Cross-account access via Key Policy<br>•  CloudHSM : HSM dédié FIPS 140-2<br>Level 3 dans votre VPC | •  Trois types : Secrets · Keys · Certificates dans<br>une seule solution<br>•  Tiers Standard (logiciel) et Premium (HSM<br>backing)<br>•  Soft-delete (90j) + Purge Protection :<br>protection contre l'effacement<br>•  RBAC granulaire avec Azure AD et Managed<br>Identity<br>•  Backup & Restore cross-region des clés<br>•  Azure Dedicated HSM pour isolation complète<br>(nCipher nShield)<br>•  Rotation automatique configurable via Event<br>Grid + Azure Functions | •  Clés symétriques AES-256 et asymétriques<br>RSA/EC<br>•  Cloud HSM : protection matérielle FIPS<br>140-2 Level 3<br>•  CMEK (Customer-Managed Encryption Keys)<br>pour chaque service<br>•  Rotation automatique planifiée avec<br>conservation des anciennes versions<br>•  Cloud EKM (External Key Manager) : clés<br>hébergées hors GCP<br>•  Audit logs automatiques dans Cloud Audit<br>Logs<br>•  IAM conditions pour accès contextuel<br>(heure, réseau, etc.) |


## Bring your own key (BYOK)

BYOK (Bring Your Own Key) est une approche permettant aux organisations de générer, posséder et gérer leurs propres clés de chiffrement tout en utilisant des services cloud. Le fournisseur chiffre les données mais ne peut jamais accéder à la clé maîtresse.

| Aspect | Description |
| --- | --- |
| Principe | Vous importez votre clé maîtresse — le provider applique le chiffrement sans y accéder |
| AWS | KMS CMK + Import key material · CloudHSM pour génération offline |
| Azure | Key Vault + BYOK HSM · Azure Dedicated HSM |
| GCP | Cloud KMS + CMEK · Cloud EKM (External Key Manager, clé hors GCP) |
| Avantage | Séparation des clés et des données — le provider applique le chiffrement en aveugle |
| Risque | Perte ou corruption de la clé = perte permanente et irréversible des données |
| Conformité | Exigé pour données soumises au Cloud Act, RGPD niveau Secret, PCI-DSS, SecNumCloud |

## Classification des données : Niveaux et outils


| Niveau de classification | Description et exemples | Mesures de sécurité |
| --- | --- | --- |
| Public | Données librement accessibles, sans impact si divulguées<br>Ex: Plaquettes commerciales, site web public, communiqués de<br>presse | Aucun contrôle spécifique : vérifier<br>qu'elles ne contiennent pas de<br>méta-données sensibles |
| Interne | Données à usage interne uniquement, impact limité si<br>divulguées<br>Ex: Politiques internes, présentations internes, organigrammes | Authentification requise, Pas de partage,<br>externe sans autorisation, Logs d'accès |
| Confidentiel | Données sensibles pouvant causer un préjudice si divulguées<br>Ex: Données clients, contrats, code source, données financières | Chiffrement at rest/in transit, MFA, DLP,<br>Accès restreint, Audit trail |
| Secret / très sensible | Données critiques : divulgation = impact majeur<br>Ex: PII, données de santé, données paiement, secrets<br>industriels | BYOK, HSM, Accès JIT PAM, DLP strict,<br>DSPM, Notification CNIL si violation |


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

