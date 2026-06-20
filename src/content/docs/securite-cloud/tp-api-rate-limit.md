---
title: "TP : Protéger une API locale avec limitation de débit"
date: 2026-06-14
description: Déployer une API Python locale et Kong OSS comme API Gateway, appliquer une limitation de débit par IP puis par consommateur authentifié, et observer les réponses HTTP 429 et 401.
---

## Prérequis

### Environnement technique

* Docker installé et fonctionnel.
* Docker Compose disponible (`docker compose version`).
* curl installé.
* Accès à un terminal Bash ou Zsh.
* Accès Internet pour télécharger les images Docker.

### Installer jq

Sur Debian / Ubuntu :

```bash
sudo apt update
sudo apt install -y jq
```

Sur macOS avec Homebrew :

```bash
brew install jq
```

### Vérifier les outils

```bash
docker --version
docker compose version
curl --version
```

### Outils utilisés

```text
python:3.12-alpine
kong:3.9
```

### Précaution

Ce TP crée uniquement un environnement local.

Aucune ressource cloud n'est créée.

Les conteneurs doivent être arrêtés à la fin du TP.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Déployer une API locale dans un conteneur.
* Déployer Kong OSS comme API Gateway.
* Configurer une route Kong vers une API locale.
* Appliquer un plugin de limitation de débit par adresse IP.
* Déclencher et observer un blocage HTTP 429.
* Modifier un quota à chaud et observer l'effet.
* Configurer une authentification par clé API.
* Appliquer un quota par consommateur authentifié.
* Comparer le comportement de deux clients avec des quotas indépendants.
* Produire un rapport local des tests réalisés.

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-api-rate-limit
cd tp-api-rate-limit

mkdir -p configs reports scripts
```

### 2. Vérifier l'arborescence

```bash
find . -maxdepth 2 -type d
```

### 3. Définir les variables du TP

```bash
cat > scripts/env.sh <<'EOF'
export TP_NAME="tp-api-rate-limit"
export API_DIRECT_URL="http://localhost:9000/hello"
export API_GATEWAY_URL="http://localhost:8000/api/hello"
export KONG_ADMIN_URL="http://localhost:8001"
export CLIENT_A_KEY="client-a-secret"
export CLIENT_B_KEY="client-b-secret"
EOF
```

```bash
source scripts/env.sh
```

### 4. Créer l'API locale

```bash
cat > api.py <<'EOF'
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import time

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        response = {
            "status": "ok",
            "message": "Réponse de l'API locale",
            "path": self.path,
            "timestamp": time.time()
        }

        body = json.dumps(response, indent=2).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 8080), Handler)
    print("API locale disponible sur le port 8080")
    server.serve_forever()
EOF
```

### 5. Créer la configuration Kong initiale

```bash
cat > configs/kong.yml <<'EOF'
_format_version: "3.0"
_transform: true

services:
  - name: local-api-service
    url: http://api:8080
    routes:
      - name: local-api-route
        paths:
          - /api
        strip_path: true
    plugins:
      - name: rate-limiting
        config:
          second: 5
          minute: 20
          limit_by: ip
          policy: local
          fault_tolerant: true
          hide_client_headers: false
          error_code: 429
          error_message: "Trop de requêtes vers cette API"
EOF
```

Cette configuration déclare :

* `local-api-service` : service Kong représentant l'API locale.
* `url: http://api:8080` : adresse interne de l'API dans Docker.
* `/api` : chemin public exposé par Kong.
* `strip_path: true` : supprime `/api` avant d'appeler l'API locale.
* `rate-limiting` : plugin de limitation de débit.
* `second: 5` : limite de 5 requêtes par seconde.
* `minute: 20` : limite de 20 requêtes par minute.
* `limit_by: ip` : limitation par adresse IP.
* `error_code: 429` : réponse HTTP en cas de dépassement.

### 6. Créer le fichier Docker Compose

```bash
cat > docker-compose.yml <<'EOF'
services:
  api:
    image: python:3.12-alpine
    container_name: tp-api-locale
    working_dir: /app
    volumes:
      - ./api.py:/app/api.py:ro
    command: python /app/api.py
    ports:
      - "9000:8080"

  kong:
    image: kong:3.9
    container_name: tp-kong-gateway
    depends_on:
      - api
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/declarative/kong.yml
      KONG_PLUGINS: bundled
      KONG_PROXY_LISTEN: 0.0.0.0:8000
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
    volumes:
      - ./configs/kong.yml:/kong/declarative/kong.yml:ro
    ports:
      - "8000:8000"
      - "127.0.0.1:8001:8001"
EOF
```

L'Admin API de Kong est exposée uniquement sur `127.0.0.1:8001` pour éviter toute exposition sur le réseau local.

### 7. Démarrer l'environnement

```bash
docker compose up -d
```

```bash
docker compose ps
```

### 8. Vérifier les logs

```bash
docker compose logs api
docker compose logs kong
```

```bash
docker compose logs api > reports/01-api-logs.txt
docker compose logs kong > reports/02-kong-logs.txt
```

### 9. Vérifier l'Admin API de Kong

```bash
curl -s "$KONG_ADMIN_URL" | tee reports/03-kong-admin-api.json
```

```bash
curl -s "$KONG_ADMIN_URL/services" | tee reports/04-kong-services.json
curl -s "$KONG_ADMIN_URL/routes" | tee reports/05-kong-routes.json
curl -s "$KONG_ADMIN_URL/plugins" | tee reports/06-kong-plugins.json
```

## Vérification de l'API locale

### 10. Tester l'API directement

```bash
curl -i "$API_DIRECT_URL" | tee reports/07-api-direct-call.txt
```

Ce test montre que l'API fonctionne correctement, mais la requête contourne l'API Gateway.

Dans une architecture réelle, l'API interne ne devrait pas être exposée directement aux utilisateurs finaux.

## Exposition via API Gateway

### 11. Tester l'API via Kong

```bash
curl -i "$API_GATEWAY_URL" | tee reports/08-api-gateway-call.txt
```

### 12. Vérifier la suppression du préfixe /api

La route Kong utilise `strip_path: true`.

Kong reçoit `/api/hello` et transmet `/hello` à l'API locale.

```bash
curl -s "$API_GATEWAY_URL" | tee reports/09-strip-path-check.json
```

Le champ `path` de la réponse JSON doit valoir `/hello`.

## Limitation de débit

### 13. Déclencher le throttling

```bash
for i in $(seq 1 10); do
  echo "Requête $i"
  curl -s -o /dev/null -w "%{http_code}\n" "$API_GATEWAY_URL"
done
```

Des réponses `429` doivent apparaître lorsque la limite est dépassée.

### 14. Créer et exécuter un script de test

```bash
cat > scripts/test-rate-limit.sh <<'EOF'
#!/usr/bin/env sh

URL="${1:-http://localhost:8000/api/hello}"

echo "Test de limitation de débit"
echo "URL testée : $URL"
echo

for i in $(seq 1 15); do
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
  echo "Requête $i : HTTP $STATUS_CODE"
done
EOF
```

```bash
chmod +x scripts/test-rate-limit.sh
```

```bash
./scripts/test-rate-limit.sh "$API_GATEWAY_URL" | tee reports/10-rate-limit-test.txt
```

### 15. Vérifier la présence de réponses 429

```bash
grep -c "HTTP 429" reports/10-rate-limit-test.txt || true
```

Si aucun `429` n'apparaît, relancer le script immédiatement après la première exécution.

### 16. Observer les en-têtes HTTP de rate limiting

```bash
curl -i "$API_GATEWAY_URL" | tee reports/11-rate-limit-headers.txt
```

```bash
grep -i "ratelimit\|rate-limit\|x-ratelimit" reports/11-rate-limit-headers.txt || true
```

Exemples d'en-têtes retournés par Kong :

```text
X-RateLimit-Limit-Second
X-RateLimit-Remaining-Second
X-RateLimit-Limit-Minute
X-RateLimit-Remaining-Minute
RateLimit-Limit
RateLimit-Remaining
```

## Modification du quota

### 17. Réduire le quota

```bash
python3 - <<'PY'
from pathlib import Path

path = Path("configs/kong.yml")
content = path.read_text()
content = content.replace("second: 5", "second: 2")
content = content.replace("minute: 20", "minute: 10")
path.write_text(content)
print("Configuration mise à jour.")
PY
```

```bash
grep -E "second:|minute:" configs/kong.yml
```

### 18. Redémarrer Kong

```bash
docker compose restart kong
```

### 19. Tester le nouveau quota

```bash
./scripts/test-rate-limit.sh "$API_GATEWAY_URL" | tee reports/12-rate-limit-test-reduced-quota.txt
```

Le blocage intervient plus rapidement qu'avec le quota précédent.

## Quota par client avec clé API

### 20. Créer une configuration Kong avec consommateurs

```bash
cat > configs/kong.yml <<'EOF'
_format_version: "3.0"
_transform: true

consumers:
  - username: client-a
    keyauth_credentials:
      - key: client-a-secret

  - username: client-b
    keyauth_credentials:
      - key: client-b-secret

services:
  - name: local-api-service
    url: http://api:8080
    routes:
      - name: local-api-route
        paths:
          - /api
        strip_path: true
    plugins:
      - name: key-auth
        config:
          key_names:
            - apikey
          key_in_header: true
          key_in_query: false
          hide_credentials: true

      - name: rate-limiting
        config:
          minute: 5
          limit_by: consumer
          policy: local
          fault_tolerant: true
          hide_client_headers: false
          error_code: 429
          error_message: "Quota dépassé pour ce client"
EOF
```

Cette configuration ajoute :

* `consumers` : clients connus de Kong avec des clés API distinctes.
* `key-auth` : authentification par clé API via le header `apikey`.
* `limit_by: consumer` : quota séparé par client authentifié.
* `minute: 5` : 5 requêtes par minute par client.

### 21. Redémarrer Kong

```bash
docker compose restart kong
```

```bash
curl -s "$KONG_ADMIN_URL/plugins" | tee reports/13-kong-plugins-key-auth.json
```

### 22. Tester sans clé API

```bash
curl -i "$API_GATEWAY_URL" | tee reports/14-call-without-api-key.txt
```

Résultat attendu :

```text
HTTP/1.1 401 Unauthorized
```

### 23. Tester avec le client A

```bash
for i in $(seq 1 7); do
  echo "Client A - Requête $i"
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "apikey: $CLIENT_A_KEY" \
    "$API_GATEWAY_URL"
done | tee reports/15-client-a-rate-limit.txt
```

Le client A dépasse son quota après 5 requêtes et reçoit des `429`.

### 24. Tester avec le client B

```bash
for i in $(seq 1 3); do
  echo "Client B - Requête $i"
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "apikey: $CLIENT_B_KEY" \
    "$API_GATEWAY_URL"
done | tee reports/16-client-b-rate-limit.txt
```

Le client B dispose de son propre quota indépendant.

### 25. Comparer les résultats

```bash
cat reports/15-client-a-rate-limit.txt
cat reports/16-client-b-rate-limit.txt
```

| Test | Résultat attendu |
|---|---|
| Sans clé API | 401 Unauthorized |
| Client A avec trop de requêtes | 429 Too Many Requests |
| Client B avec peu de requêtes | 200 OK |

## Rapport de synthèse

### 26. Créer un rapport Markdown

```bash
{
  echo "# Rapport TP : Protection d'une API locale avec limitation de débit"
  echo
  echo "## Architecture"
  echo
  echo '```text'
  echo "Client -> Kong OSS -> API locale Python"
  echo '```'
  echo
  echo "## Composants déployés"
  echo
  echo "| Composant | Rôle | Port local |"
  echo "|---|---|---|"
  echo "| API Python | Service applicatif local | 9000 |"
  echo "| Kong OSS | API Gateway | 8000 |"
  echo "| Kong Admin API | Administration locale | 8001 |"
  echo
  echo "## Tests réalisés"
  echo
  echo "| Test | Résultat attendu |"
  echo "|---|---|"
  echo "| Appel direct API | HTTP 200 |"
  echo "| Appel via Kong | HTTP 200 |"
  echo "| Dépassement quota par IP | HTTP 429 |"
  echo "| Appel sans clé API | HTTP 401 |"
  echo "| Client A avec quota dépassé | HTTP 429 |"
  echo "| Client B sous le quota | HTTP 200 |"
  echo
  echo "## Points pédagogiques"
  echo
  echo "- Kong OSS joue le rôle d'API Gateway devant une API locale."
  echo "- Le plugin rate-limiting protège l'API contre un volume excessif de requêtes."
  echo "- Le plugin key-auth identifie les clients et applique un quota par consommateur."
  echo "- La limitation par IP et la limitation par consommateur produisent des comportements différents."
} > reports/rapport-tp-api-rate-limit.md
```

### 27. Afficher le rapport

```bash
cat reports/rapport-tp-api-rate-limit.md
```

### 28. Lister les fichiers générés

```bash
find . -maxdepth 3 -type f | sort
```

## Nettoyage

### 29. Arrêter les conteneurs

```bash
docker compose down
```

### 30. Vérifier que les conteneurs sont supprimés

```bash
docker ps -a | grep "tp-api-locale\|tp-kong-gateway" || true
```

### 31. Vérifier que les ports sont libérés

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000 || true
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9000 || true
```

### 32. Supprimer le dossier du TP

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-api-rate-limit
```

## Résultat attendu

| Élément | Validation |
|---|---|
| API locale | Réponse HTTP 200 sur localhost:9000 |
| API Gateway | Réponse HTTP 200 sur localhost:8000/api |
| Route Kong | Le chemin /api redirige vers l'API locale |
| strip_path | Le champ `path` retourné par l'API vaut `/hello` |
| Rate limiting par IP | Les requêtes excessives retournent HTTP 429 |
| Authentification API Key | Les appels sans clé retournent HTTP 401 |
| Rate limiting par consommateur | Les quotas sont indépendants entre client-a et client-b |
| Rapport | Un rapport est généré dans reports/ |

Aucune ressource cloud, aucune clé d'accès AWS et aucun compte externe ne sont utilisés pendant ce TP.
