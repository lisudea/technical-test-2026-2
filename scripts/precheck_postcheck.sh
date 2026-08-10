#!/usr/bin/env bash
set -u

if [ "$#" -lt 4 ]; then
  echo "Uso: $0 <FQDN> <IP_NUEVA> <GATEWAY> <PUERTO> [precheck|postcheck]"
  exit 2
fi

FQDN="$1"
IP_NUEVA="$2"
GATEWAY="$3"
PUERTO="$4"
MODO="${5:-precheck}"

mkdir -p evidencias
SALIDA="evidencias/${MODO}-$(date +%Y%m%d-%H%M%S).txt"
exec > >(tee -a "$SALIDA") 2>&1

date
hostname
ip -br addr
ip route
ip route get "$IP_NUEVA" || true
getent ahosts "$FQDN" || true
dig "$FQDN" A || true
ss -lntup || true
ping -c 4 "$GATEWAY" || true
nc -vz "$IP_NUEVA" "$PUERTO" || true
curl -fsS --max-time 10 -o /dev/null \
  -w "HTTP=%{http_code} connect=%{time_connect} total=%{time_total}\n" \
  "https://${FQDN}/" || true
curl -fsS --max-time 10 --resolve "${FQDN}:${PUERTO}:${IP_NUEVA}" \
  -o /dev/null -w "PRE_DNS HTTP=%{http_code} total=%{time_total}\n" \
  "https://${FQDN}:${PUERTO}/" || true

echo "Evidencia guardada en: $SALIDA"
