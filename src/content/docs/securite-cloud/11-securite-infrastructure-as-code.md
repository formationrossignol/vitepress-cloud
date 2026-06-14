---
title: "11. Sécurité de l'Infrastructure as Code"
---

# 11. Sécurité de l'Infrastructure as Code

## Sécuriser le code de l’infrastructure



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

}
}


## Prêt pour lundi

| # | Action | Commande | Durée / Coût | Impact |
| --- | --- | --- | --- | --- |
| 1 | Scanner votre code Terraform existant avec tfsec | `docker run --rm -it -v $(pwd):/src aquasecurity/tfsec /src --format sarif > tfsec-results.json` | 5 min / Gratuit | Identifier les mauvaises configurations dans votre IaC existant avant le prochain apply |
| 2 | Migrer votre tfstate vers un backend S3 chiffré avec locking | `# backend.tf : bucket = 'nexapay-tfstate' · encrypt = true · dynamodb_table = 'tfstate-lock' · kms_key_id = 'arn:aws:kms:...'` | 30 min / < 5€ | mois / Un tfstate en local ou dans Git = clés, IPs, passwords en clair accessibles |
| 3 | Ajouter Checkov dans votre pipeline CI/CD | `pip install checkov && checkov -d . --framework terraform --output junitxml > checkov-results.xml` | 15 min / Gratuit | Bloquer les merge requests qui introduisent des misconfigs Terraform critiques |
