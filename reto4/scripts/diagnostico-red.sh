#!/usr/bin/env bash
# =====================================================================
# diagnostico-red.sh — snapshot del estado de red de un host Linux
#
# Reto 4 — Migración de servicios entre redes del LIS
# Isaac Mesa Gómez — C.C. 1007239188
#
# Uso:
#   sudo ./diagnostico-red.sh > snapshot-$(date +%F-%H%M).txt
#
# Ejecutar ANTES y DESPUÉS del corte, y comparar con:
#   diff snapshot-antes-*.txt snapshot-despues-*.txt
# =====================================================================

set -uo pipefail

hr() { printf '\n===== %s =====\n' "$1"; }

hr "FECHA";        date -Is
hr "HOSTNAME";     hostnamectl 2>/dev/null || hostname

hr "INTERFACES";   ip -br addr; echo; ip addr
hr "RUTAS IPv4";   ip route
hr "RUTAS IPv6";   ip -6 route

hr "DNS";          cat /etc/resolv.conf; echo; resolvectl status 2>/dev/null

hr "PUERTOS EN ESCUCHA"
if [ "$(id -u)" -eq 0 ]; then
  ss -tulnp
else
  echo "AVISO: ejecutar con sudo para ver la columna de proceso"
  ss -tuln
fi

hr "FIREWALL"
ufw status verbose 2>/dev/null || echo "ufw no disponible"
echo; iptables -L -n -v 2>/dev/null
echo; iptables -t nat -L -n -v 2>/dev/null

hr "APACHE"
apache2ctl -S 2>&1 || echo "apache2ctl no disponible"
echo; apache2ctl -M 2>&1 | head -30

hr "DOCKER"
if command -v docker >/dev/null 2>&1; then
  docker ps -a
  echo; docker network ls
  for c in $(docker ps -q); do
    printf '\n--- contenedor %s ---\n' "$c"
    docker inspect "$c" --format '{{.Name}} | {{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}'
    docker inspect "$c" --format '{{range .Config.Env}}{{println .}}{{end}}'
    docker inspect "$c" --format 'ExtraHosts: {{.HostConfig.ExtraHosts}}'
  done
else
  echo "docker no disponible"
fi

hr "TAREAS PROGRAMADAS"
crontab -l 2>/dev/null || echo "sin crontab de usuario"
ls -la /etc/cron.*/ 2>/dev/null
systemctl list-timers --all --no-pager 2>/dev/null | head -20

hr "REFERENCIAS A REDES LEGADAS DEL LIS"
# 192.168.27 = VPN (obsoleto) | .30 = Telematica | .192-194 = Salas LIS
# 172.21     = Ingenieria     | 10.0.8 = VPN     | 10.18.29 = segmento actual
grep -rnE '192\.168\.(27|30|19[234])\.[0-9]+|172\.21\.|10\.0\.8\.|10\.18\.29\.[0-9]+' \
     /etc/apache2 /var/www /opt /usr/local 2>/dev/null | head -50

hr "REFERENCIAS EN HISTORIALES DE SHELL"
grep -rnE '192\.168\.[0-9]+\.[0-9]+' /home/*/.bash_history /root/.bash_history 2>/dev/null | head -30

hr "FIN"
