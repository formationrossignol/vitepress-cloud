---
title: "TP : Scanner du code IaC avec Checkov et Trivy"
date: 2026-06-14
description: Scanner des configurations Terraform vulnérables avec Checkov et Trivy, analyser les rapports de résultats, corriger les erreurs et vérifier que les scans passent sans findings critiques.
---

## Prérequis

### Environnement technique

* OpenTofu ou Terraform installé pour valider la syntaxe du code IaC.
* Checkov installé pour scanner les mauvaises configurations Terraform.
* Trivy installé pour scanner les configurations IaC et les secrets.
* jq installé pour lire et filtrer les rapports JSON.
* Accès à un terminal Bash ou Zsh.

Ce TP est réalisable sur Linux, macOS et Windows.

Il ne déploie aucune ressource cloud.

Aucune commande `apply` ne doit être exécutée.

### Compatibilité Windows

Ce TP est conçu pour être exécuté dans un terminal Bash.

Sur Windows, l'environnement recommandé est WSL2 avec Ubuntu. Cela permet d'exécuter les mêmes commandes que sur Linux sans adaptation.

L'exécution directe en PowerShell est possible mais certaines commandes nécessitent une adaptation :

| Commande Unix | Équivalent PowerShell |
|---|---|
| `mkdir -p reports` | `New-Item -ItemType Directory -Force reports` |
| `cat > fichier <<'EOF'` | Here-string PowerShell |
| `rm -rf dossier` | `Remove-Item -Recurse -Force dossier` |
| `export VAR=value` | `$env:VAR="value"` |
| `source scripts/env.sh` | Exécuter les variables manuellement |

Pour garder un TP homogène, utiliser WSL2 ou Git Bash sur Windows.

### Terminal recommandé par système

| Système | Terminal recommandé |
|---|---|
| Linux | Bash |
| macOS | Terminal ou iTerm2 |
| Windows | WSL2 Ubuntu |
| Windows alternatif | Git Bash |

## Installation des outils

### Sur Debian / Ubuntu (ou WSL2 Ubuntu)

Mettre à jour les paquets :

```bash
sudo apt-get update
sudo apt-get install -y curl wget unzip git jq python3 python3-pip python3-venv
```

Installer OpenTofu :

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh -o install-opentofu.sh
chmod +x install-opentofu.sh
sudo ./install-opentofu.sh --install-method deb
rm -f install-opentofu.sh
```

Installer Checkov dans un environnement Python isolé :

```bash
python3 -m venv ~/.venvs/checkov
source ~/.venvs/checkov/bin/activate
pip install --upgrade pip
pip install checkov
deactivate
```

Créer un lien symbolique pour utiliser `checkov` directement :

```bash
sudo ln -sf ~/.venvs/checkov/bin/checkov /usr/local/bin/checkov
```

Installer Trivy :

```bash
sudo apt-get install -y wget apt-transport-https gnupg

wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key \
  | gpg --dearmor \
  | sudo tee /usr/share/keyrings/trivy.gpg > /dev/null

echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main" \
  | sudo tee /etc/apt/sources.list.d/trivy.list

sudo apt-get update
sudo apt-get install -y trivy
```

### Sur Fedora / RHEL / Rocky Linux / AlmaLinux

Installer les dépendances :

```bash
sudo dnf install -y curl wget unzip git jq python3 python3-pip
```

Installer OpenTofu :

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh -o install-opentofu.sh
chmod +x install-opentofu.sh
sudo ./install-opentofu.sh --install-method rpm
rm -f install-opentofu.sh
```

Installer Checkov :

```bash
python3 -m pip install --user checkov
```

Ajouter le dossier utilisateur Python au `PATH` si nécessaire :

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Installer Trivy :

```bash
cat << 'EOF' | sudo tee /etc/yum.repos.d/trivy.repo
[trivy]
name=Trivy repository
baseurl=https://aquasecurity.github.io/trivy-repo/rpm/releases/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://aquasecurity.github.io/trivy-repo/rpm/public.key
EOF

sudo dnf install -y trivy
```

### Sur macOS

Installer Homebrew si nécessaire :

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Installer les outils :

```bash
brew install opentofu
brew install checkov
brew install trivy
brew install jq
```

### Sur Windows avec PowerShell

Cette option fonctionne mais WSL2 reste recommandé.

Vérifier WSL et installer Ubuntu si nécessaire :

```powershell
wsl --version
wsl --install -d Ubuntu
```

Si WSL n'est pas disponible, installer les outils via Winget :

```powershell
winget install --exact --id OpenTofu.Tofu
winget install --exact --id Python.Python.3.12
winget install --exact --id Git.Git
winget install --exact --id AquaSecurity.Trivy
winget install --exact --id jqlang.jq
```

Installer Checkov via pip :

```powershell
python -m pip install --upgrade pip
python -m pip install checkov
```

Fermer puis rouvrir PowerShell ou Git Bash pour recharger le `PATH`.

Si `checkov` n'est pas reconnu dans le `PATH`, utiliser :

```powershell
python -m checkov --version
```

## Vérification des outils

Depuis Linux, macOS, WSL ou Git Bash :

```bash
tofu version || terraform version
checkov --version
trivy --version
jq --version
```

Résultat attendu : une version doit être affichée pour chaque outil.

Créer un fichier de diagnostic local :

```bash
mkdir -p reports

{
  echo "# Diagnostic outils TP IaC"
  echo
  echo "## OpenTofu ou Terraform"
  tofu version 2>/dev/null || terraform version 2>/dev/null || echo "Non disponible"
  echo
  echo "## Checkov"
  checkov --version 2>/dev/null || echo "Non disponible"
  echo
  echo "## Trivy"
  trivy --version 2>/dev/null || echo "Non disponible"
  echo
  echo "## jq"
  jq --version 2>/dev/null || echo "Non disponible"
} | tee reports/00-tools-diagnostic.txt
```
