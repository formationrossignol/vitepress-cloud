---
title: "11. Sécurité de l'Infrastructure as Code"
---

# 11. Sécurité de l'Infrastructure as Code

## Sécuriser le code de l’infrastructure


| •  Le code IaC (Terraform, CloudFormation, Bicep, etc.) est du code à part entière.<br>•  Une mauvaise configuration dans ce code peut déployer des centaines de ressources vulnérables en<br>secondes et à grande échelle.<br>•  Amplificateur de risques : un seul module Terraform vulnérable peut affecter toutes les régions et tous<br>les comptes.<br>•  Drift de configuration : la réalité cloud peut diverger de l'IaC après des modifications manuelles —<br>source de vulnérabilités non tracées.<br>•  Security-as-Code : tfsec + Checkov + KICS dans la PR → correction avant apply → coût de remédiation<br>minimal.<br>•  Historique Git = historique de sécurité : chaque changement d'infra tracé, reviewé, réversible — audit<br>facilité. |
| --- |
| Aucun déploiement Terraform ne doit être autorisé sans validation préalable des contrôles de sécurité dans la<br>chaîne CI/CD. L'application de cette règle est assurée par les protections de Pull Request. |


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

| •  Le fichier tfstate contient l'état réel de l'infrastructure Terraform. Sa compromission peut exposer des<br>informations sensibles et faciliter une attaque de l'environnement cloud.<br>•  Pourquoi protéger le tfstate ?<br>  ◦  Contient l'inventaire complet des ressources déployées<br>  ◦  Peut contenir des secrets en clair selon les providers utilisés<br>  ◦  Référence les identifiants, URLs, IP publiques et informations réseau<br>  ◦  Utilisé par Terraform pour déterminer les changements à appliquer<br>  ◦  Constitue une cible privilégiée pour un attaquant |
| --- |
| terraform {<br>backend "s3" {<br>bucket = "my-terraform-state-prod"<br>key = "global/s3/terraform.tfstate"<br>region = "eu-west-1"<br>encrypt = true # SSE-KMS obligatoire<br>kms_key_id = var.kms_key_arn<br>dynamodb_table = "terraform-state-locks" # évite les conflits |


## Prêt pour lundi

| # | Action | Commande | Durée / Coût | Impact |
| --- | --- | --- | --- | --- |
| 1 | Scanner votre code Terraform existant avec tfsec | `docker run --rm -it -v $(pwd):/src aquasecurity/tfsec /src --format sarif > tfsec-results.json` | 5 min / Gratuit | Identifier les mauvaises configurations dans votre IaC existant avant le prochain apply |
| 2 | Migrer votre tfstate vers un backend S3 chiffré avec locking | `# backend.tf : bucket = 'nexapay-tfstate' · encrypt = true · dynamodb_table = 'tfstate-lock' · kms_key_id = 'arn:aws:kms:...'` | 30 min / < 5€ | mois / Un tfstate en local ou dans Git = clés, IPs, passwords en clair accessibles |
| 3 | Ajouter Checkov dans votre pipeline CI/CD | `pip install checkov && checkov -d . --framework terraform --output junitxml > checkov-results.xml` | 15 min / Gratuit | Bloquer les merge requests qui introduisent des misconfigs Terraform critiques |

## LAB : Sécurité

de l’infrastructure as code


## QCM : Sécurité

de l’infrastructure as code

