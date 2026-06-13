---
title: "11. Sécurité de l'Infrastructure as Code"
---

# 11. Sécurité de l'Infrastructure as Code

## 11. sécurité de

l’Infrastructure as Code

## Sécuriser le Code de l’Infrastructure

- Le code IaC (Terraform, CloudFormation, Bicep, etc.) est du code à part entière.
- Une mauvaise configuration dans ce code peut déployer des centaines de ressources vulnérables en
secondes et à grande échelle.
- Amplificateur de risques : un seul module Terraform vulnérable peut affecter toutes les régions et tous
les comptes.
- Drift de configuration : la réalité cloud peut diverger de l'IaC après des modifications manuelles —
source de vulnérabilités non tracées.
- Security-as-Code : tfsec + Checkov + KICS dans la PR → correction avant apply → coût de remédiation
minimal.
- Historique Git = historique de sécurité : chaque changement d'infra tracé, reviewé, réversible — audit
facilité.
Aucun déploiement Terraform ne doit être autorisé sans validation préalable des contrôles de sécurité dans la
chaîne CI/CD. L'application de cette règle est assurée par les protections de Pull Request.

## Mauvaises Configurations Terraform Fréquentes (ici aws)

- S3 sans chiffrement (encryption = false)
- Bucket S3 accessible publiquement (block_public_acls = false)
- Ports SSH (22) ou RDP (3389) ouverts à Internet (0.0.0.0/0)
- Base de données RDS exposée publiquement (publicly_accessible = true)
- Journalisation CloudTrail absente ou désactivée (enable_logging = false)
- HTTPS non imposé sur les services web
- Version TLS obsolète
- Secrets stockés en clair dans le code Terraform
- Comptes IAM avec privilèges excessifs (AdministratorAccess)
- Absence de tags de gouvernance
- Volumes ou bases de données non chiffrés
- Utilisation d'images ou d'AMI non maîtrisées
- Désactivation des protections réseau natives du cloud
- Déploiement sans contrôle de sécurité automatisé dans la CI/CD

## LES Outils de Scan IaC

tfsec Checkov
- Dédié Terraform : 400+ règles de sécurité
- Intégration native GitHub Actions / GitLab CI
- Custom checks en YAML ou JSON
- SARIF (Static Analysis Results Interchange Format) output pour
GitHub Security
- Open source : maintenu par Aqua Security
- Commande : tfsec . --format sarif
- Multi-IaC : Terraform, CloudFormation, K8s, Dockerfile, ARM, Bicep
- 1000+ checks sécurité et conformité
- Fix automatique : checkov --fix
- Intégration Prisma Cloud (Palo Alto)
- Python, open source (Bridgecrew/Palo Alto)
- Commande : checkov -d . --framework terraform
KICS (checkmarx) OPA / Conftest
- 2400+ queries multi-IaC en OPA Rego
- Support : Terraform, Ansible, Docker, K8s, CloudFormation
- Rapports : HTML, JSON, SARIF, CycloneDX
- Intégration CI/CD native via Docker image
- Commande : kics scan -p ./terraform -o results/
- Open source : Checkmarx KICS GitHub
- Policy as Code en Rego : multi-IaC et Kubernetes
- Validation en CI/CD avant terraform apply
- Règles réutilisables et versionables dans Git
- Commande : conftest test --policy ./policy plan.json
- Intégration Terraform : terraform show -json | conftest
- Bundles OCI pour distribuer les policies

## Sécurisation du fichier d’état Terraform

- Le fichier tfstate contient l'état réel de l'infrastructure Terraform. Sa compromission peut exposer des
informations sensibles et faciliter une attaque de l'environnement cloud.
- Pourquoi protéger le tfstate ?
  - Contient l'inventaire complet des ressources déployées
  - Peut contenir des secrets en clair selon les providers utilisés
  - Référence les identifiants, URLs, IP publiques et informations réseau
  - Utilisé par Terraform pour déterminer les changements à appliquer
  - Constitue une cible privilégiée pour un attaquant
terraform {
  backend "s3" {
    bucket         = "my-terraform-state-prod"
    key            = "global/s3/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true           # SSE-KMS obligatoire
    kms_key_id     = var.kms_key_arn
    dynamodb_table = "terraform-state-locks"  # évite les conflits
  }
}

## Prêt pour lundi

Scanner votre code Terraform existant avec tfsec
docker run --rm -it -v $(pwd):/src aquasecurity/tfsec /src --format sarif > tfsec-results.json
< 5 min / Gratuit / Identifier les mauvaises configurations dans votre IaC existant avant le prochain apply1
Migrer votre tfstate vers un backend S3 chiffré avec locking
# backend.tf : bucket = 'nexapay-tfstate' · encrypt = true · dynamodb_table = 'tfstate-lock' ·
kms_key_id = 'arn:aws:kms:...'
< 30 min · < 5€/mois / Un tfstate en local ou dans Git = clés, IPs, passwords en clair accessibles
Ajouter Checkov dans votre pipeline CI/CD
pip install checkov && checkov -d . --framework terraform --output junitxml > checkov-results.xml
< 15 min / Gratuit / Bloquer les merge requests qui introduisent des misconfigs Terraform critiques

## LAB : Sécurité

de l’infrastructure as code

## QCM : Sécurité

de l’infrastructure as code
