#!/usr/bin/env bash
# Validación post-migración (sección 4 del informe).
# Uso: ./validar-migracion.sh  (las variables se pueden sobreescribir por entorno)

IFACE="${IFACE:-ens18}"
NEW_IP="${NEW_IP:-10.18.30.50}"
NEW_PREFIX="${NEW_PREFIX:-24}"
GATEWAY="${GATEWAY:-10.18.30.254}"
PEER_HOST="${PEER_HOST:-10.18.29.37}"
APP_DOMAIN="${APP_DOMAIN:-app.lis.udea.edu.co}"
PORTS="${PORTS:-22 80 443 5432 3306 5050 7474}"
GREP_DIRS="${GREP_DIRS:-/etc/nginx /etc/netplan /etc/hosts /opt/app}"

pass=0; fail=0

check() {
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then
    printf 'OK   %s\n' "$desc"; pass=$((pass+1))
  else
    printf 'FALLO %s\n' "$desc"; fail=$((fail+1))
  fi
}

check_neg() {
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then
    printf 'FALLO %s\n' "$desc"; fail=$((fail+1))
  else
    printf 'OK   %s\n' "$desc"; pass=$((pass+1))
  fi
}

echo "== Red =="
check "IP nueva $NEW_IP/$NEW_PREFIX en $IFACE" \
  sh -c "ip -br addr show $IFACE | grep -q '$NEW_IP/$NEW_PREFIX'"
check_neg "sin direcciones 192.168.x.x en interfaces" \
  sh -c "ip addr | grep -q 'inet 192\.168\.'"
check "ruta por defecto via $GATEWAY" \
  sh -c "ip route | grep -q '^default via $GATEWAY dev $IFACE'"
check_neg "sin rutas hacia 192.168.x.x" \
  sh -c "ip route | grep -q '192\.168\.'"
check "ping al gateway $GATEWAY" ping -c 3 -W 2 "$GATEWAY"
check "ping a otra subred interna ($PEER_HOST)" ping -c 3 -W 2 "$PEER_HOST"

echo "== DNS =="
check "resolvectl reporta DNS en $IFACE" \
  sh -c "resolvectl dns $IFACE | grep -Eq '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+'"
check "resuelve $APP_DOMAIN" sh -c "dig +short +time=3 $APP_DOMAIN | grep -q ."

echo "== Servicios =="
for p in $PORTS; do
  check "puerto $p/tcp en escucha" sh -c "ss -tln | grep -q ':$p '"
done
check_neg "nada escuchando en 192.168.x.x" \
  sh -c "ss -tuln | grep -q '192\.168\.'"

if command -v docker >/dev/null 2>&1; then
  for c in postgres mysql pgadmin neo4j; do
    check "contenedor $c corriendo" \
      sh -c "docker ps --format '{{.Names}} {{.Status}}' | grep -i '$c' | grep -q 'Up'"
  done
  check "postgres acepta conexiones" docker exec postgres pg_isready -U postgres
  check_neg "redes docker sin subredes 192.168.x.x / 172.21.x.x" \
    sh -c "docker network inspect \$(docker network ls -q) --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}' | grep -Eq '192\.168\.|172\.21\.'"
fi

echo "== HTTP =="
check "nginx responde en localhost" \
  sh -c "code=\$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1/); echo \$code | grep -Eq '200|301|302'"
check "https responde en la IP nueva" \
  curl -fsSk -o /dev/null --max-time 5 "https://$NEW_IP/"
check "app responde por nombre" \
  curl -fsSk -o /dev/null --max-time 5 "https://$APP_DOMAIN/"

echo "== Limpieza =="
check_neg "sin referencias 192.168.x.x en configs" \
  sh -c "grep -rq --exclude-dir=.git --exclude-dir=node_modules '192\.168\.' $GREP_DIRS 2>/dev/null"

echo
echo "Resultado: $pass OK, $fail fallos"
[ "$fail" -eq 0 ]
