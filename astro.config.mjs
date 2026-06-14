import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  integrations: [
    starlight({
      title: 'Formation AWS',
      social: {
        github: 'https://github.com/formationrossignol',
        linkedin: 'https://www.linkedin.com/in/loicrossignol/',
      },
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'Français',
          lang: 'fr',
        },
      },
      sidebar: [
        {
          label: 'Cloud AWS',
          items: [
            { label: 'Introduction au Cloud', slug: '' },
            { label: 'Cours : Fondations du Cloud AWS', slug: 'cours/cloud-foundation' },
            {
              label: 'Infrastructure',
              items: [
                { label: 'TP : Créer un VPC avec Terraform', slug: 'infrastructure/vpc-terraform' },
                { label: 'TP : Infrastructure as Code avec CloudFormation', slug: 'infrastructure/cloudformation' },
                { label: 'TP : Créer des AMI avec Packer', slug: 'infrastructure/packer' },
              ],
            },
            {
              label: 'Compute',
              items: [
                { label: 'TP : Lancer une instance EC2', slug: 'compute/instance-ec2' },
                { label: 'TP : Automatiser EC2 avec User Data', slug: 'compute/ec2-user-data' },
              ],
            },
            {
              label: 'Containers',
              items: [
                { label: 'TP : Registry Docker privé avec ECR', slug: 'containers/ecr' },
              ],
            },
            {
              label: 'Messaging',
              items: [
                { label: 'TP : SQS Free Tier', slug: 'messaging/sqs' },
              ],
            },
            {
              label: 'Stockage',
              items: [
                { label: "TP : Traitement d'images avec Lambda et S3", slug: 'stockage/s3-lambda' },
                { label: 'TP : Site web statique sur S3', slug: 'stockage/s3-site-statique' },
                { label: 'TP : RDS MySQL Free Tier', slug: 'bases-de-donnees/rds-mysql' },
              ],
            },
            {
              label: 'FinOps & Conformité',
              items: [
                { label: 'TP : Estimation FinOps avec Infracost', slug: 'finops/infracost' },
              ],
            },
          ],
        },
        {
          label: 'Sécurité du cloud',
          items: [
            { label: 'Cours : Sécurité AWS', slug: 'cours/securite-aws' },
            { label: '01. Généralités sur le cloud computing', slug: 'securite-cloud/01-generalites-cloud-computing' },
            { label: '02. Plateformes de sécurité cloud', slug: 'securite-cloud/02-plateformes-securite-cloud' },
            {
              label: '03. Les menaces cloud',
              items: [
                { label: 'Cours', slug: 'securite-cloud/03-menaces-cloud' },
                { label: 'TP : Scanner une image vulnérable', slug: 'securite-cloud/tp-trivy-scan-image' },
              ],
            },
            { label: '05. Les référentiels normatifs', slug: 'securite-cloud/05-referentiels-normatifs' },
            { label: '06. Identity & Access Management', slug: 'securite-cloud/06-identity-access-management' },
            { label: '07. Sécurité des données cloud', slug: 'securite-cloud/07-securite-donnees-cloud' },
            { label: '08. Sécurité réseau cloud', slug: 'securite-cloud/08-securite-reseau-cloud' },
            { label: '09. Sécurité des conteneurs & Kubernetes', slug: 'securite-cloud/09-securite-conteneurs-kubernetes' },
            { label: '10. Sécurité DevSecOps & CI/CD', slug: 'securite-cloud/10-securite-devsecops-cicd' },
            { label: "11. Sécurité de l'Infrastructure as Code", slug: 'securite-cloud/11-securite-infrastructure-as-code' },
            { label: '12. Monitoring, Détection & Réponse aux incidents', slug: 'securite-cloud/12-monitoring-detection-incidents' },
            { label: '13. Gouvernance & Conformité cloud', slug: 'securite-cloud/13-gouvernance-conformite-cloud' },
            { label: '14. Outils de sécurité : AWS, Azure et GCP', slug: 'securite-cloud/14-outils-securite-aws-azure-gcp' },
            { label: '15. Zero Trust : Architecture avancée', slug: 'securite-cloud/15-zero-trust-architecture' },
            { label: '16. Cas réels : incidents cloud majeurs', slug: 'securite-cloud/16-cas-reels-incidents-cloud' },
            {
              label: 'Travaux Pratiques',
              items: [
                { label: 'TP : Gestion des identités IAM', slug: 'securite-cloud/iam-free-tier' },
                { label: 'TP : Analyser les chemins IAM avec PMapper', slug: 'securite-cloud/tp-pmapper-iam' },
                { label: 'TP 2 : Escalade IAM contrôlée', slug: 'securite-cloud/tp2-escalade-iam-controlee' },
                { label: 'TP : Détection de secrets dans un dépôt Git', slug: 'securite-cloud/detection-secrets-git' },
                { label: 'TP : IaC sécurisée avec Terraform, Checkov et Trivy', slug: 'securite-cloud/terraform-checkov-trivy' },
                { label: 'TP : Serverless sécurisé avec SAM, cfn-lint et Checkov', slug: 'securite-cloud/sam-cfn-lint-checkov' },
                { label: 'TP : Inventaire sécurité AWS avec Prowler', slug: 'securite-cloud/prowler' },
                { label: 'TP : Cartographie sécurité AWS avec CloudFox', slug: 'securite-cloud/cloudfox' },
                { label: 'TP : Gouvernance AWS Organizations avec IAM et SCP', slug: 'securite-cloud/tp-organizations-iam-scp' },
              ],
            },
          ],
        },
      ],
      lastUpdated: true,
      components: {
        Head: './src/components/Head.astro',
        PageTitle: './src/components/PageTitle.astro',
        Footer: './src/components/Footer.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
      customCss: ['./src/styles/custom.css'],
      head: [
        { tag: 'script', attrs: { src: '/reading-progress.js', defer: true } },
        { tag: 'script', attrs: { src: '/enhancements.js', defer: true } },
      ],
    }),
  ],
})
