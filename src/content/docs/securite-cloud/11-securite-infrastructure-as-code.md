---
title: "07. Sécurité de l'Infrastructure as Code"
---

# 07. Sécurité de l'Infrastructure as Code

## Sécuriser le code de l’infrastructure

La sécurité de l’Infrastructure as Code repose sur trois piliers : analyser le code avant déploiement (shift-left), sécuriser l’état Terraform (tfstate) et imposer des politiques automatisées dans la CI/CD.

| Pilier | Objectif | Outils |
| --- | --- | --- |
| Analyse statique (SAST IaC) | Détecter les misconfigurations avant apply | tfsec, Checkov, KICS |
| Gestion des secrets | Éviter les secrets en clair dans le code IaC | git-secrets, detect-secrets, HashiCorp Vault |
| Policy as Code | Valider les plans contre des règles métier et de conformité | OPA/Conftest, Sentinel (Terraform Cloud) |
| Backend sécurisé | Protéger le tfstate (clés, IPs, mots de passe en clair) | S3 chiffré + DynamoDB lock |
| Gates CI/CD | Bloquer les merge requests qui introduisent des misconfigs | Checkov en pipeline, GitHub Actions SARIF |

## Mauvaises configurations Terraform fréquentes (ici AWS)

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


## Les outils de scan IaC


| tfsec |  | Checkov |  |
| --- | --- | --- | --- |
|  | tfsec | Checkov |  |
|  | •  Dédié Terraform : 400+ règles de sécurité<br>•  Intégration native GitHub Actions / GitLab CI<br>•  Custom checks en YAML ou JSON<br>•  SARIF (Static Analysis Results Interchange Format) output pour<br>GitHub Security<br>•  Open source : maintenu par Aqua Security<br>•  Commande : tfsec . --format sarif | •  Multi-IaC : Terraform, CloudFormation, K8s, Dockerfile, ARM, B<br>•  1000+ checks sécurité et conformité<br>•  Fix automatique : checkov --fix<br>•  Intégration Prisma Cloud (Palo Alto)<br>•  Python, open source (Bridgecrew/Palo Alto)<br>•  Commande : checkov -d . --framework terraform | icep |
|  | KICS (checkmarx) | OPA / Conftest |  |
| •  2400+ queries multi-IaC en OPA Rego<br>•  Support : Terraform, Ansible, Docker, K8s, CloudFormation<br>•  Rapports : HTML, JSON, SARIF, CycloneDX<br>•  Intégration CI/CD native via Docker image<br>•  Commande : kics scan -p ./terraform -o results/<br>•  Open source : Checkmarx KICS GitHub | •  2400+ queries multi-IaC en OPA Rego<br>•  Support : Terraform, Ansible, Docker, K8s, CloudFormation<br>•  Rapports : HTML, JSON, SARIF, CycloneDX<br>•  Intégration CI/CD native via Docker image<br>•  Commande : kics scan -p ./terraform -o results/<br>•  Open source : Checkmarx KICS GitHub | •  Policy as Code en Rego : multi-IaC et Kubernetes<br>•  Validation en CI/CD avant terraform apply<br>•  Règles réutilisables et versionables dans Git<br>•  Commande : conftest test --policy ./policy plan.json<br>•  Intégration Terraform : terraform show -json \| conftest<br>•  Bundles OCI pour distribuer les policies |  |


## Sécurisation du fichier d’état Terraform

Le fichier `terraform.tfstate` contient l’état réel de l’infrastructure : adresses IP, ARN de ressources, identifiants et parfois des secrets en clair. Un tfstate exposé constitue une fuite critique.

| Risque | Mitigation |
| --- | --- |
| Stockage local (`terraform.tfstate`) | Migrer vers un backend distant chiffré (S3, GCS, Azure Blob) |
| Secrets en clair dans le state | Activer le chiffrement du backend + KMS (SSE-KMS pour S3) |
| Accès concurrent / corruption | Activer le locking (DynamoDB pour S3 backend) |
| Accès non contrôlé au bucket | Restreindre les accès IAM : lecture seule en dehors du pipeline |
| Historique Git exposé | Ne jamais committer le tfstate — ajouter `*.tfstate*` à `.gitignore` |

```hcl
terraform {
  backend "s3" {
    bucket         = "mon-tfstate-bucket"
    key            = "prod/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:eu-west-1:123456789012:key/xxx"
    dynamodb_table = "tfstate-lock"
  }
}
```


## Prêt pour lundi

| # | Action | Commande | Durée / Coût | Impact |
| --- | --- | --- | --- | --- |
| 1 | Scanner votre code Terraform existant avec tfsec | `docker run --rm -it -v $(pwd):/src aquasecurity/tfsec /src --format sarif > tfsec-results.json` | 5 min / Gratuit | Identifier les mauvaises configurations dans votre IaC existant avant le prochain apply |
| 2 | Migrer votre tfstate vers un backend S3 chiffré avec locking | `# backend.tf : bucket = 'nexapay-tfstate' · encrypt = true · dynamodb_table = 'tfstate-lock' · kms_key_id = 'arn:aws:kms:...'` | 30 min / < 5€ | mois / Un tfstate en local ou dans Git = clés, IPs, passwords en clair accessibles |
| 3 | Ajouter Checkov dans votre pipeline CI/CD | `pip install checkov && checkov -d . --framework terraform --output junitxml > checkov-results.xml` | 15 min / Gratuit | Bloquer les merge requests qui introduisent des misconfigs Terraform critiques |
