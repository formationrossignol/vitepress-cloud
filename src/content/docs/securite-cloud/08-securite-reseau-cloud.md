---
title: "08. Sécurité réseau cloud"
---

# 08. Sécurité réseau cloud

## Amazon Virtual

PRIVATE CLOUD


## Virtual private cloud, c'est quoi ?

Un Nuage Privé Virtuel, ou Cloud Virtuel Privé,
ou Virtual Private Cloud (VPC) est un groupe de
ressources informatiques configurables à la
demande dans un environnement de cloud
public, qui fournit un certain niveau
d'isolement entre les différentes organisations
qui utilisent ces ressources.

![Slide 155](/securite-cloud/08-securite-reseau-cloud/p155_00_Image51.jpg)


| Amazon Virtual Private Cloud |
| --- |
| •  Amazon Virtual Private Cloud (VPC) donne un contrôle total sur un environnement<br>réseau virtuel, notamment le placement des ressources, la connectivité et la sécurité :<br>  ◦  La première étape consiste à créer votre VPC.<br>  ◦  Vous pourrez ensuite y ajouter des ressources, telles que des instances Amazon Elastic<br>Compute Cloud (EC2) et Amazon Relational Database Service (RDS).<br>  ◦  Enfin, vous pourrez définir comment vos VPC communiquent entre eux, entre les<br>comptes, les zones de disponibilité (AZ) ou les régions. |


## Fonctionnement


![Slide 157](/securite-cloud/08-securite-reseau-cloud/p157_01_Image52.jpg)


## Les groupes de sécurité &

NACLs


## Les groupes de sécurité

- Un groupe de sécurité est un pare-feu virtuel stateful appliqué au niveau d’une ressource cloud (instance,
machine virtuelle, base de données, load balancer, etc.).
- Il contrôle les flux entrants et sortants en autorisant explicitement le trafic selon des règles de sécurité.
- Fonctionne avec une approche deny all par défaut : seul le trafic explicitement autorisé est accepté.
- Règles entrantes (Inbound) : contrôle des connexions vers la ressource.
- Règles sortantes (Outbound) : contrôle des connexions initiées par la ressource.
- Filtrage réseau : adresses IP, protocoles (TCP, UDP, ICMP), ports et références à d'autres groupes de
sécurité.
- Stateful : le trafic de retour est automatiquement autorisé sans règle supplémentaire.
- Gestion des accès : contrôle fin des communications entre applications, serveurs, bases de données et
services.
- Segmentation réseau : limitation des flux au strict nécessaire selon le principe du moindre privilège.
- Cas d’usage : protection des instances EC2, bases RDS, clusters Kubernetes, load balancers, services
applicatifs et communications inter-services.



- Les groupes de
sécurité permettent :
  - L'accès aux ports.
  - Les plages
d'adresses IP
autorisées : IPv4
et IPv6.
  - Le contrôle du
réseau entrant.
  - Le contrôle du
réseau sortant.

![Slide 160](/securite-cloud/08-securite-reseau-cloud/p160_02_Image53.jpg)


| Quelques informations supplémentaires sur les groupes de |
| --- |
| sécurité<br>•  Peut être attaché à plusieurs instances.<br>•  Verrouillé sur une combinaison région/VPC.<br>•  Il est bon de maintenir un groupe de sécurité distinct pour l'accès SSH.<br>•  Si votre application n'est pas accessible (expiration du délai) :<br>  ◦  Problème de groupe de sécurité.<br>•  Si votre application donne une erreur « connexion refusée » :<br>  ◦  Application en erreur ou pas lancée.<br>•  Tout le trafic entrant est bloqué par défaut.<br>•  Tout le trafic sortant est autorisé par défaut. |


| listes de contrôle d'accès réseau (NACLs) |
| --- |
| •  Un NACL est un mécanisme de filtrage réseau stateless appliqué au niveau d’un sous-réseau<br>(Subnet).<br>•  Il contrôle les flux entrants et sortants en autorisant ou refusant explicitement le trafic selon<br>des règles réseau.<br>•  Fonctionne par ordre de priorité : la première règle correspondante est appliquée.<br>•  Règles entrantes (Inbound) : contrôle du trafic entrant vers les ressources du sous-réseau.<br>•  Règles sortantes (Outbound) : contrôle du trafic quittant le sous-réseau.<br>•  Filtrage réseau : adresses IP, protocoles (TCP, UDP, ICMP) et ports.<br>•  Stateless : les flux retour doivent être explicitement autorisés par une règle<br>correspondante.<br>•  Ordre de traitement : évaluation des règles par numéro croissant, puis application du<br>premier match.<br>•  Deny explicite : possibilité de bloquer directement des plages IP, ports ou protocoles.<br>•  Cas d’usage : segmentation réseau, blocage d’adresses IP malveillantes, contrôle des flux<br>entre sous-réseaux, couche de protection complémentaire aux Security Groups. |


## Listes de contrôle d'accès réseau (NACLs)


![Slide 163](/securite-cloud/08-securite-reseau-cloud/p163_03_Image54.jpg)


## Groupe de sécurité vs NACLs


| Critère | Groupe de sécurité | NACL |
| --- | --- | --- |
| Niveau | Ressource | Sous-réseau |
| Type | Stateful | Stateless |
| Trafic retour | Automatique | Règle requise |
| Règles d'autorisation | Oui | Oui |
| Règles de refus | Non | Oui |
| Ordre des règles | Non | Oui |
| Granularité | Fine | Large |
| Usage principal | Protection des ressources | Filtrage réseau |


| Private Endpoints : Accès Privé aux Services Managés |
| --- |
| • |


## Web application firewall

- Service de pare-feu applicatif web qui protège les applications web et API contre les requêtes
malveillantes.
- Fonctionne au niveau HTTP / HTTPS.
- Peut être associé à :
  - Amazon CloudFront
  - Application Load Balancer
  - Amazon API Gateway
  - AWS AppSync
- Permet de créer des règles pour autoriser, bloquer ou surveiller le trafic.
- Propose des règles managées contre des risques courants : injections SQL, XSS, bots, abus de
requêtes
- Peut limiter le trafic avec du rate limiting.
- S’intègre avec AWS Firewall Manager pour une gestion centralisée.


## AWS Web Application Firewall


![Slide 168](/securite-cloud/08-securite-reseau-cloud/p168_04_Image55.jpg)


## Hôte bastion

- Un hôte bastion est un serveur sécurisé servant de point d'entrée unique pour accéder aux
ressources situées dans un réseau privé.
- Il permet d'administrer des serveurs, bases de données ou équipements réseau sans exposer
directement ces ressources à Internet.
- Point d'accès centralisé : toutes les connexions d'administration transitent par le bastion.
- Accès sécurisé : authentification forte, MFA, contrôle des accès et journalisation des connexions.
- Isolation réseau : les ressources administrées restent dans des sous-réseaux privés.
- Traçabilité : enregistrement des connexions, commandes et activités d'administration.
- Réduction de la surface d'attaque : une seule ressource est exposée au lieu de multiples
serveurs.
- Protocoles supportés : SSH, RDP, WinRM, bases de données et outils d'administration.
- Cas d'usage : administration d'instances EC2, serveurs Linux et Windows, accès aux
environnements de production, gestion des infrastructures cloud privées.
- Solutions : AWS Bastion Host, Azure Bastion, Google Cloud Bastion Host, Teleport, Apache
Guacamole, JumpServer.




![Slide 171](/securite-cloud/08-securite-reseau-cloud/p171_05_Image56.jpg)


## Zero trust network access (ZTNA)

- Le ZTNA est un modèle de contrôle d'accès qui applique le principe « Ne jamais faire confiance,
toujours vérifier ».
- Il permet d'accéder aux applications et ressources sans exposer le réseau interne ni accorder un
accès global comme avec un VPN traditionnel.
- Vérification continue de l'identité : authentification forte, MFA et contrôle des appareils.
- Accès par application : l'utilisateur accède uniquement aux ressources autorisées.
- Contrôle contextuel : prise en compte de l'identité, du terminal, de la localisation et du niveau
de risque.
- Moindre privilège : accès limité au strict nécessaire.
- Micro-segmentation : isolation des applications et ressources.
- Accès sans exposition réseau : les ressources restent invisibles depuis Internet.
- Journalisation et traçabilité : suivi des accès, activités et décisions de sécurité.
- Solutions : Cloudflare Access, Zscaler Private Access, Microsoft Entra Private Access, Google
BeyondCorp Enterprise, Netskope Private Access, Palo Alto Prisma Access.




![Slide 173](/securite-cloud/08-securite-reseau-cloud/p173_06_Image57.jpg)


## Réseau privé virtuel (VPN)


![Slide 174](/securite-cloud/08-securite-reseau-cloud/p174_07_Image58.jpg)


## Zero trust network access (ZTNA) vs VPN


| VPN | ZTNA |
| --- | --- |
| J'accède au réseau | J'accède à une application |
| Une authentification au départ | Vérification continue |
| Confiance implicite après connexion | Aucune confiance implicite |
| Vision réseau | Vision identité |


## AWS Systems Manager Session Manager

- Session Manager permet d'accéder à des instances EC2 sans ouvrir de ports SSH (22) ou RDP
(3389) et sans déployer de bastion.
- Les connexions transitent par le service AWS Systems Manager via HTTPS.
- Accès sans bastion : suppression des serveurs bastion dédiés.
- Aucun port entrant : pas d'ouverture SSH ou RDP sur Internet.
- Contrôle des accès IAM : autorisations basées sur les rôles et politiques AWS.
- Journalisation : enregistrement des sessions dans CloudWatch Logs ou S3.
- Authentification forte : intégration IAM, MFA et AWS Identity Center.
- Réduction de la surface d'attaque : aucune exposition réseau directe des instances.
- Cas d'usage : administration Linux, Windows, dépannage, accès aux environnements de
production, automatisation opérationnelle.
- Services associés : Systems Manager, IAM, CloudTrail, CloudWatch Logs, AWS Identity Center.




![Slide 177](/securite-cloud/08-securite-reseau-cloud/p177_08_Image59.jpg)


## En résumé


| Concept | Résumé |
| --- | --- |
| Bastion Host | Point d'entrée d'administration sécurisé |
| VPN | Tunnel chiffré vers un réseau privé |
| ZTNA | Accès aux applications basé sur l'identité |
| Session Manager | Accès aux ressources privées sans bastion |


## API gateway


| •  Amazon API Gateway est un service AWS pour créer, publier et sécuriser des API :<br>  ◦  Sert de point d’entrée entre les clients et les services backend.<br>  ◦  Peut exposer des API REST, HTTP ou WebSocket.<br>  ◦  S’intègre avec AWS Lambda, EC2, ECS, services AWS ou endpoints HTTP.<br>  ◦  Permet de gérer l’authentification, le throttling et les quotas.<br>  ◦  Service managé, scalable et hautement disponible.<br>  ◦  Très utilisé dans les architectures serverless.<br>•  Cas d’usage :<br>  ◦  Exposer une fonction Lambda via une API.<br>  ◦  Créer une API pour une application web ou mobile.<br>  ◦  Centraliser l’accès à plusieurs services backend.<br>  ◦  Protéger et contrôler l’usage d’une API.<br>•  En résumé : API Gateway expose une API et les services backend exécutent le traitement.<br>1 |  |
| --- | --- |
|  | 1 |


## Amazon API Gateway


![Slide 181](/securite-cloud/08-securite-reseau-cloud/p181_09_Image60.jpg)


## Service mesh

- Service Mesh = couche réseau intelligente entre microservices (sécurité, observabilité, trafic
management sans modifier le code applicatif).

![Slide 183](/securite-cloud/08-securite-reseau-cloud/p183_10_Image61.jpg)


## Service mesh (istio/linkerd) : Zero trust entre microservices

●


## WAF vs API Gateway vs Service Mesh : Quand utiliser quoi ?

●


## Protection DDoS : AWS Shield, Azure DDoS Protection, Cloud

Armor
- DDoS : Distributed Denial of Service.
- Définition : Attaque visant à rendre un service indisponible en le submergeant de trafic parasite provenant de
milliers de sources simultanées.
- Objectif : saturer la bande passante, les ressources CPU ou les connexions applicatives.
- AWS Shield Standard (gratuit) : protection L3/L4 (réseau/transport) automatique sur tous les services AWS : SYN
flood, UDP reflection
- AWS Shield Advanced (3000$/mois) : protection L7 (applicatif) + SRT (Security Response Team) AWS 24/7 +
protection des surcoûts liés à l'attaque.
- Azure DDoS Protection Standard : analyse du trafic baseline + mitigation automatique + rapport post-attaque +
garantie SLA.
- GCP Cloud Armor : WAF + DDoS avec Adaptive Protection ML : apprend le trafic normal et détecte les anomalies.
Bonnes pratiques : Définir une architecture distribuée (multi-AZ, CDN) · Rate limiting WAF · Plan de réponse DDoS
documenté


## Fonctionnement protection DDoS


![Slide 187](/securite-cloud/08-securite-reseau-cloud/p187_11_Image62.jp2)


## VPC Flow Logs : Analyse et détection du trafic réseau

- VPC Flow Logs : Journal du trafic réseau cloud
- Objectif : Capture des métadonnées du trafic IP entrant et sortant de chaque interface réseau (ENI) de votre
VPC. Indispensable pour l'audit, la détection d'anomalies et les investigations forensiques.
- Format des logs : version, account, interface, srcaddr, dstaddr, srcport, dstport, protocol, packets, bytes, start,
end, action
- Détection : scans de ports (SYN sans ACK) · exfiltration (volume sortant anormal) · tentatives de connexion
refusées
- Destination : CloudWatch Logs · S3 (coût réduit) · Kinesis Data Firehose (SIEM temps réel)
- Analyse : Athena (SQL sur S3) · CloudWatch Insights · Splunk · Microsoft Sentinel · OpenSearch
Exemple de requête Athena : détecter tous les scans de port 22 refusés depuis Internet sur les 24 dernières heures


## Prêt pour lundi

| # | Action | Commande | Durée / Coût | Impact |
| --- | --- | --- | --- | --- |
| 1 | Auditer tous les Security Groups avec des règles 0.0.0.0/0 | `aws ec2 describe-security-groups --query 'SecurityGroups[?IpPermissions[?IpRanges[?CidrIp==`0.0.0.0/0`]]]'` | 2 min / Gratuit | Chaque SG avec 0.0.0.0/0 sur port sensible = porte ouverte sur internet |
| 2 | Activer VPC Flow Logs sur tous vos VPCs | `aws ec2 create-flow-logs --resource-type VPC --resource-ids vpc-xxx --traffic-type ALL --log-destination-type s3 --log-destination arn:aws:s3:::my-flowlogs` | 15 min / ~10€ | mois / Sans Flow Logs, vous êtes aveugle sur le trafic réseau de votre VPC |
| 3 | Vérifier qu'aucune RDS/ElasticSearch n'est en subnet public | `aws rds describe-db-instances --query 'DBInstances[?PubliclyAccessible==`true`].[DBInstanceIdentifier,Endpoint.Address]'` | 1 min / Gratuit | Une base de données publique = credential stuffing automatisé garanti |

## LAB : Sécurité réseau cloud

dhdfhfgh

