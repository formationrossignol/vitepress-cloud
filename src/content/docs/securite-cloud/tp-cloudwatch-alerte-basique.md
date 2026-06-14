---
title: "TP : Mettre en place une alerte basique avec Amazon CloudWatch"
date: 2026-06-14
description: Publier une métrique CloudWatch personnalisée, créer une alarme sur seuil, déclencher et observer les transitions d'état OK/ALARM, et optionnellement envoyer des notifications via SNS.
---

## Prérequis

### Environnement technique

* AWS CLI installé et configuré.
* Accès à un terminal Bash ou Zsh.
* jq installé pour lire et filtrer les sorties JSON.
* Accès à un compte AWS de lab.
* Permissions suffisantes pour créer, tester et supprimer des ressources CloudWatch et SNS.

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

### Vérifier AWS CLI

```bash
aws --version
```

### Permissions AWS nécessaires

```text
sts:GetCallerIdentity
cloudwatch:PutMetricData
cloudwatch:PutMetricAlarm
cloudwatch:DescribeAlarms
cloudwatch:DeleteAlarms
sns:CreateTopic
sns:Subscribe
sns:ListSubscriptionsByTopic
sns:DeleteTopic
```

### Précaution

Ce TP crée des ressources AWS réelles dans un compte de lab.

Il crée notamment :

* une métrique CloudWatch personnalisée ;
* une alarme CloudWatch standard ;
* un topic SNS (uniquement dans la partie optionnelle).

Le TP est conçu pour rester compatible avec le Free Tier AWS.

Ne pas exécuter ce TP dans un compte de production.

## Objectifs

À la fin de ce TP, l'apprenant doit être capable de :

* Publier une métrique personnalisée dans Amazon CloudWatch.
* Créer une alarme CloudWatch basée sur un seuil.
* Déclencher une alarme en publiant une valeur anormale.
* Observer le passage d'une alarme entre les états `OK`, `ALARM` et `INSUFFICIENT_DATA`.
* Ramener une alarme à l'état `OK` en publiant une valeur normale.
* Créer un topic SNS et une subscription email pour recevoir des notifications.
* Attacher une action SNS à une alarme CloudWatch.
* Nettoyer les ressources créées pendant le TP.

## Architecture cible

```text
Poste local
  |
  | aws cloudwatch put-metric-data
  v
Amazon CloudWatch Metric
  |
  | seuil > 80
  v
Amazon CloudWatch Alarm
  |
  | optionnel
  v
Amazon SNS Email
```

## Compatibilité Free Tier

| Ressource | Quantité utilisée |
|---|---|
| Instance EC2 | 0 |
| Fonction Lambda | 0 |
| CloudWatch Logs | 0 |
| Dashboard CloudWatch | 0 |
| Métrique personnalisée | 1 |
| Alarme CloudWatch standard | 1 |
| Topic SNS | 0 par défaut, 1 uniquement en option |

## Commandes

### 1. Créer l'arborescence du TP

```bash
mkdir -p tp-cloudwatch-alerte-basique
cd tp-cloudwatch-alerte-basique

mkdir -p scripts reports
```

### 2. Vérifier l'identité AWS utilisée

```bash
aws sts get-caller-identity
```

### 3. Définir la région AWS par défaut

```bash
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-west-3}"
export AWS_PAGER=""
echo "Région AWS CLI par défaut : ${AWS_DEFAULT_REGION}"
```

### 4. Définir les variables du TP

```bash
cat > scripts/env.sh <<'EOF'
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-west-3}"
export AWS_PAGER=""

export TP_NAME="tp-cloudwatch-alerte-basique"
export NAMESPACE="FormationCloud/FreeTier"
export METRIC_NAME="ApplicationHealthScore"
export ALARM_NAME="formation-cloudwatch-alerte-basique"

export NORMAL_VALUE="10"
export ALARM_VALUE="95"
export THRESHOLD_VALUE="80"

export SNS_TOPIC_NAME="formation-cloudwatch-alerte-basique-topic"
EOF
```

```bash
source scripts/env.sh
```

### 5. Récupérer l'identifiant du compte AWS

```bash
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
echo "Compte AWS : ${AWS_ACCOUNT_ID}"
```

```bash
aws sts get-caller-identity > reports/01-caller-identity.json
```

## Création de la métrique CloudWatch

### 6. Publier une première valeur normale

```bash
aws cloudwatch put-metric-data \
  --namespace "${NAMESPACE}" \
  --metric-name "${METRIC_NAME}" \
  --value "${NORMAL_VALUE}" \
  --unit Percent
```

```bash
echo "Code de retour put-metric-data normal : $?"
```

La valeur publiée est `10 %`, inférieure au seuil d'alerte prévu.

### 7. Sauvegarder une trace locale

```bash
cat > reports/02-metric-publication.txt <<EOF
Namespace: ${NAMESPACE}
MetricName: ${METRIC_NAME}
NormalValue: ${NORMAL_VALUE}
Unit: Percent
Region: ${AWS_DEFAULT_REGION}
EOF
```

## Création de l'alarme CloudWatch

### 8. Créer l'alarme

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "${ALARM_NAME}" \
  --alarm-description "Alerte basique : déclenchement si ApplicationHealthScore dépasse 80 %" \
  --namespace "${NAMESPACE}" \
  --metric-name "${METRIC_NAME}" \
  --statistic Average \
  --period 60 \
  --evaluation-periods 1 \
  --datapoints-to-alarm 1 \
  --threshold "${THRESHOLD_VALUE}" \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --unit Percent
```

Les paramètres utilisés sont les suivants :

* `period 60` : fenêtre d'évaluation de 60 secondes.
* `evaluation-periods 1` : une seule période évaluée.
* `datapoints-to-alarm 1` : un seul point suffit pour déclencher l'alarme.
* `threshold 80` : seuil de déclenchement à 80 %.
* `comparison-operator GreaterThanThreshold` : déclenchement si la valeur dépasse le seuil.
* `treat-missing-data notBreaching` : les données absentes ne déclenchent pas l'alarme.

### 9. Vérifier la création de l'alarme

```bash
aws cloudwatch describe-alarms \
  --alarm-names "${ALARM_NAME}" \
  --query "MetricAlarms[0].{Name:AlarmName,State:StateValue,Reason:StateReason,Threshold:Threshold,Metric:MetricName}" \
  --output json | tee reports/03-alarm-created.json
```

L'état initial peut être `INSUFFICIENT_DATA`, le temps que CloudWatch dispose de suffisamment de données pour évaluer l'alarme.

## Déclenchement de l'alerte

### 10. Publier une valeur anormale

```bash
aws cloudwatch put-metric-data \
  --namespace "${NAMESPACE}" \
  --metric-name "${METRIC_NAME}" \
  --value "${ALARM_VALUE}" \
  --unit Percent
```

La valeur publiée est `95 %`, supérieure au seuil de `80 %`.

### 11. Attendre l'évaluation CloudWatch

```bash
sleep 90
```

### 12. Vérifier l'état de l'alarme

```bash
aws cloudwatch describe-alarms \
  --alarm-names "${ALARM_NAME}" \
  --query "MetricAlarms[0].{Name:AlarmName,State:StateValue,Reason:StateReason,Updated:StateUpdatedTimestamp}" \
  --output json | tee reports/04-alarm-state-after-breach.json
```

Résultat attendu :

```text
StateValue : ALARM
```

Si l'alarme n'est pas encore en état `ALARM`, attendre à nouveau :

```bash
sleep 60
aws cloudwatch describe-alarms \
  --alarm-names "${ALARM_NAME}" \
  --query "MetricAlarms[0].{Name:AlarmName,State:StateValue,Reason:StateReason}" \
  --output json
```

## Retour à la normale

### 13. Publier une valeur normale

```bash
aws cloudwatch put-metric-data \
  --namespace "${NAMESPACE}" \
  --metric-name "${METRIC_NAME}" \
  --value "${NORMAL_VALUE}" \
  --unit Percent
```

### 14. Attendre l'évaluation CloudWatch

```bash
sleep 90
```

### 15. Vérifier le retour à l'état OK

```bash
aws cloudwatch describe-alarms \
  --alarm-names "${ALARM_NAME}" \
  --query "MetricAlarms[0].{Name:AlarmName,State:StateValue,Reason:StateReason,Updated:StateUpdatedTimestamp}" \
  --output json | tee reports/05-alarm-state-after-recovery.json
```

Résultat attendu :

```text
StateValue : OK
```

## Notification SNS (optionnel)

Cette partie est optionnelle.

Elle permet d'envoyer un email lorsque l'alarme passe à l'état `ALARM`.

### 16. Créer un topic SNS

```bash
export TOPIC_ARN="$(aws sns create-topic \
  --name "${SNS_TOPIC_NAME}" \
  --query "TopicArn" \
  --output text)"

echo "TOPIC_ARN=${TOPIC_ARN}"
echo "${TOPIC_ARN}" > reports/06-sns-topic-arn.txt
```

### 17. Créer une subscription email

Remplacer l'adresse email avant d'exécuter cette commande.

```bash
export EMAIL_ADDRESS="prenom.nom@example.com"
```

```bash
aws sns subscribe \
  --topic-arn "${TOPIC_ARN}" \
  --protocol email \
  --notification-endpoint "${EMAIL_ADDRESS}" \
  > reports/07-sns-subscription.json
```

Un email de confirmation est envoyé à l'adresse indiquée.

La subscription doit être confirmée avant de recevoir les notifications.

### 18. Vérifier la subscription SNS

```bash
aws sns list-subscriptions-by-topic \
  --topic-arn "${TOPIC_ARN}" \
  --output json | tee reports/08-sns-subscriptions.json
```

### 19. Attacher le topic SNS à l'alarme CloudWatch

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "${ALARM_NAME}" \
  --alarm-description "Alerte basique : notification SNS si ApplicationHealthScore dépasse 80 %" \
  --namespace "${NAMESPACE}" \
  --metric-name "${METRIC_NAME}" \
  --statistic Average \
  --period 60 \
  --evaluation-periods 1 \
  --datapoints-to-alarm 1 \
  --threshold "${THRESHOLD_VALUE}" \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --unit Percent \
  --alarm-actions "${TOPIC_ARN}"
```

### 20. Déclencher à nouveau l'alerte avec notification

```bash
aws cloudwatch put-metric-data \
  --namespace "${NAMESPACE}" \
  --metric-name "${METRIC_NAME}" \
  --value "${ALARM_VALUE}" \
  --unit Percent
```

```bash
sleep 90
```

```bash
aws cloudwatch describe-alarms \
  --alarm-names "${ALARM_NAME}" \
  --query "MetricAlarms[0].{Name:AlarmName,State:StateValue,Actions:AlarmActions}" \
  --output json | tee reports/09-alarm-with-sns.json
```

### 21. Remettre la métrique à une valeur normale

```bash
aws cloudwatch put-metric-data \
  --namespace "${NAMESPACE}" \
  --metric-name "${METRIC_NAME}" \
  --value "${NORMAL_VALUE}" \
  --unit Percent
```

```bash
sleep 90
```

```bash
aws cloudwatch describe-alarms \
  --alarm-names "${ALARM_NAME}" \
  --query "MetricAlarms[0].{Name:AlarmName,State:StateValue,Reason:StateReason}" \
  --output json | tee reports/10-alarm-after-sns-recovery.json
```

## Rapport de synthèse

### 22. Créer un rapport de synthèse local

```bash
{
  echo "# Rapport TP : Mettre en place une alerte basique avec CloudWatch"
  echo
  echo "## Région"
  echo
  echo "${AWS_DEFAULT_REGION}"
  echo
  echo "## Ressources utilisées"
  echo
  echo "| Ressource | Nom |"
  echo "|---|---|"
  echo "| Namespace CloudWatch | ${NAMESPACE} |"
  echo "| Métrique | ${METRIC_NAME} |"
  echo "| Alarme | ${ALARM_NAME} |"
  echo "| Topic SNS optionnel | ${SNS_TOPIC_NAME} |"
  echo
  echo "## Seuil configuré"
  echo
  echo "| Paramètre | Valeur |"
  echo "|---|---|"
  echo "| Valeur normale publiée | ${NORMAL_VALUE} % |"
  echo "| Seuil d'alerte | ${THRESHOLD_VALUE} % |"
  echo "| Valeur anormale publiée | ${ALARM_VALUE} % |"
  echo
  echo "## Tests réalisés"
  echo
  echo "| Test | Résultat attendu |"
  echo "|---|---|"
  echo "| Publication d'une valeur normale | Alarme en OK ou INSUFFICIENT_DATA |"
  echo "| Publication d'une valeur anormale | Alarme en ALARM |"
  echo "| Retour à une valeur normale | Alarme en OK |"
  echo "| Notification SNS optionnelle | Email reçu si la subscription est confirmée |"
  echo
  echo "## Compatibilité Free Tier"
  echo
  echo "| Ressource | Quantité |"
  echo "|---|---|"
  echo "| Instance EC2 | 0 |"
  echo "| Fonction Lambda | 0 |"
  echo "| CloudWatch Logs | 0 |"
  echo "| Dashboard CloudWatch | 0 |"
  echo "| Métrique personnalisée | 1 |"
  echo "| Alarme CloudWatch standard | 1 |"
  echo "| Topic SNS | 0 par défaut, 1 uniquement en option |"
} > reports/rapport-tp-cloudwatch-alerte-basique.md
```

### 23. Afficher le rapport

```bash
cat reports/rapport-tp-cloudwatch-alerte-basique.md
```

### 24. Lister les fichiers générés

```bash
find . -maxdepth 3 -type f | sort
```

## Nettoyage

### 25. Supprimer l'alarme CloudWatch

```bash
aws cloudwatch delete-alarms \
  --alarm-names "${ALARM_NAME}"
```

### 26. Vérifier la suppression de l'alarme

```bash
aws cloudwatch describe-alarms \
  --alarm-names "${ALARM_NAME}" \
  --query "MetricAlarms" \
  --output json
```

Résultat attendu : tableau vide `[]`.

### 27. Supprimer le topic SNS (optionnel)

Réaliser cette étape uniquement si la partie SNS a été complétée.

```bash
export TOPIC_ARN="$(cat reports/06-sns-topic-arn.txt)"
```

```bash
aws sns delete-topic \
  --topic-arn "${TOPIC_ARN}"
```

### 28. Supprimer le dossier local

Se placer dans le dossier parent avant d'exécuter cette commande.

```bash
cd ..
rm -rf tp-cloudwatch-alerte-basique
```

## Résultat attendu

| Élément | Validation |
|---|---|
| Métrique CloudWatch | Une métrique personnalisée a été publiée |
| Alarme CloudWatch | Une alarme standard a été créée |
| Déclenchement | L'alarme est passée à l'état ALARM |
| Retour normal | L'alarme est revenue à l'état OK |
| Notification optionnelle | SNS a envoyé un email si configuré et confirmé |
| Nettoyage | L'alarme et le topic SNS optionnel ont été supprimés |

Les fichiers suivants doivent avoir été produits :

```text
reports/01-caller-identity.json
reports/02-metric-publication.txt
reports/03-alarm-created.json
reports/04-alarm-state-after-breach.json
reports/05-alarm-state-after-recovery.json
reports/rapport-tp-cloudwatch-alerte-basique.md
scripts/env.sh
```

Aucune instance EC2, aucune fonction Lambda et aucun dashboard CloudWatch ne sont créés pendant ce TP.
