#!/usr/bin/env bash
#
# inventario-pre-migracion.sh
#
# Recoge el estado completo de red y de servicios de un servidor ANTES de
# migrarlo del direccionamiento 192.168.x.x al institucional 10.18.30.x, y
# rastrea todas las apariciones de la red antigua en configuracion y codigo.
#
# El resultado cumple dos funciones:
#   1. Linea base: contra que comparar despues de migrar.
#   2. Guion de reversion: si algo sale mal, aqui esta el estado al que volver.
#
# SOLO LECTURA: no modifica absolutamente nada del sistema.
#
# Uso:
#   sudo ./inventario-pre-migracion.sh [-r RED_ANTIGUA] [-p RUTA_PROYECTO] [-o SALIDA]
#
#   -r  Prefijo de la red antigua a rastrear   (por defecto: 192.168.)
#   -p  Ruta del codigo de la aplicacion        (opcional, se puede repetir)
#   -o  Directorio de salida                    (por defecto: ./inventario-<fecha>)
#
# Reto 4 - Prueba Tecnica 2026-2 - Laboratorio Integrado de Sistemas, UdeA

set -uo pipefail
# Nota: NO se usa `set -e` a proposito. Muchos comandos de diagnostico devuelven
# un codigo distinto de cero de forma legitima (un servicio que no existe, un
# fichero ausente) y eso no debe abortar el inventario.

RED_ANTIGUA="192.168."
RUTAS_PROYECTO=()
DIR_SALIDA="./inventario-$(date +%Y%m%d-%H%M%S)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -r|--red)      RED_ANTIGUA="$2"; shift 2 ;;
    -p|--proyecto) RUTAS_PROYECTO+=("$2"); shift 2 ;;
    -o|--salida)   DIR_SALIDA="$2"; shift 2 ;;
    -h|--help)     sed -n '2,25p' "$0"; exit 0 ;;
    *) echo "Opcion desconocida: $1" >&2; exit 1 ;;
  esac
done

mkdir -p "$DIR_SALIDA"
INFORME="$DIR_SALIDA/inventario.md"

# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

# Escribe a la vez en el informe y en pantalla.
say() { echo -e "$*" | tee -a "$INFORME"; }

# Solo al informe (para volcados largos).
log() { echo -e "$*" >> "$INFORME"; }

# Ejecuta un comando y guarda su salida en un bloque de codigo del informe.
# Si la herramienta no esta instalada, lo deja anotado en lugar de fallar.
capturar() {
  local titulo="$1"; shift
  local comando="$*"
  local binario="${1}"

  log ""
  log "### $titulo"
  log ""
  log '```'
  log "\$ $comando"

  if ! command -v "$binario" >/dev/null 2>&1; then
    log "[no disponible: '$binario' no esta instalado en este sistema]"
  else
    eval "$comando" 2>&1 | sed 's/^/  /' >> "$INFORME" \
      || log "  [el comando termino con error; puede ser normal]"
  fi

  log '```'
}

seccion() {
  log ""
  log "---"
  log ""
  log "## $1"
  echo "  -> $1"
}

# ---------------------------------------------------------------------------
# Cabecera
# ---------------------------------------------------------------------------

cat > "$INFORME" <<CABECERA
# Inventario previo a la migracion de red

- **Fecha:** $(date '+%Y-%m-%d %H:%M:%S %Z')
- **Host:** $(hostname -f 2>/dev/null || hostname)
- **Sistema:** $(. /etc/os-release 2>/dev/null && echo "\$PRETTY_NAME" || uname -a)
- **Kernel:** $(uname -r)
- **Ejecutado por:** $(whoami)
- **Red antigua rastreada:** \`${RED_ANTIGUA}\`

> Generado por \`inventario-pre-migracion.sh\`. Solo lectura: no se modifico nada.
> Conservar este archivo: es la referencia para revertir la migracion.
CABECERA

echo ""
echo "Inventario previo a la migracion"
echo "Salida: $DIR_SALIDA"
echo ""

if [[ $EUID -ne 0 ]]; then
  echo "  AVISO: no se ejecuta como root. Algunas secciones apareceran incompletas"
  echo "         (firewall, /etc restringido, procesos de otros usuarios)."
  echo "         Se recomienda: sudo $0"
  echo ""
  log ""
  log "> **Aviso:** ejecutado sin privilegios de root; hay secciones incompletas."
fi

# ---------------------------------------------------------------------------
# 1. Capa de red
# ---------------------------------------------------------------------------

seccion "1. Configuracion de red"

capturar "Interfaces y direcciones (resumen)" "ip -br addr"
capturar "Interfaces y direcciones (detalle)" "ip addr show"
capturar "Estado y MAC de las interfaces"     "ip -br link"
capturar "Tabla de rutas"                     "ip route show"
capturar "Ruta por defecto"                   "ip route show default"
capturar "Tabla ARP (vecinos)"                "ip neigh show"
capturar "Reglas de politica de enrutamiento" "ip rule show"

seccion "2. Resolucion de nombres"

capturar "Servidores DNS efectivos" "resolvectl status"
capturar "resolv.conf"              "cat /etc/resolv.conf"
capturar "Entradas en /etc/hosts"   "cat /etc/hosts"
capturar "Nombre del host"          "hostnamectl"

seccion "3. Configuracion de red persistente"
log ""
log "> La configuracion en caliente (\`ip addr\`) se pierde al reiniciar."
log "> Estos son los ficheros que hay que modificar para que el cambio persista."

capturar "Netplan (Ubuntu)"        "ls -la /etc/netplan/ && cat /etc/netplan/*.yaml"
capturar "NetworkManager"          "nmcli -f NAME,DEVICE,TYPE,STATE connection show"
capturar "Detalle NetworkManager"  "nmcli device show"
capturar "Debian clasico"          "cat /etc/network/interfaces"
capturar "RHEL / CentOS"           "ls -la /etc/sysconfig/network-scripts/ 2>/dev/null"

# ---------------------------------------------------------------------------
# 2. Servicios
# ---------------------------------------------------------------------------

seccion "4. Puertos y servicios"
log ""
log "> **Punto critico:** buscar servicios con \`bind\` a una IP concreta de la red"
log "> antigua en la columna de direccion local. Dejaran de escuchar cuando esa IP"
log "> desaparezca."

capturar "Puertos en escucha"        "ss -tulpn"
capturar "Conexiones establecidas"   "ss -tn state established"
capturar "Servicios activos"         "systemctl list-units --type=service --state=running --no-pager"

seccion "5. Contenedores"

capturar "Contenedores"            "docker ps -a"
capturar "Redes Docker"            "docker network ls"
capturar "Subredes de cada red"    "for n in \$(docker network ls -q); do docker network inspect \$n --format '{{.Name}}: {{range .IPAM.Config}}{{.Subnet}} {{end}}'; done"
capturar "Configuracion del demonio" "cat /etc/docker/daemon.json"

seccion "6. Firewall y NAT"

capturar "UFW"                "ufw status verbose"
capturar "nftables"           "nft list ruleset"
capturar "iptables (filter)"  "iptables -S"
capturar "iptables (nat)"     "iptables -t nat -S"
capturar "firewalld"          "firewall-cmd --list-all"

# ---------------------------------------------------------------------------
# 3. Rastreo de la red antigua  <- la seccion mas importante
# ---------------------------------------------------------------------------

seccion "7. Rastreo de '${RED_ANTIGUA}' en el sistema"
log ""
log "> **Esta es la seccion decisiva del inventario.** Cada linea que aparezca aqui"
log "> es un punto que hay que actualizar, o que rompera la aplicacion tras el cambio."

RED_REGEX="${RED_ANTIGUA//./\\.}"

buscar_en() {
  local descripcion="$1"; shift
  local salida
  log ""
  log "### $descripcion"
  log ""
  log '```'
  salida=$(grep -rIn --binary-files=without-match "$RED_REGEX" "$@" 2>/dev/null | head -100)
  if [[ -n "$salida" ]]; then
    echo "$salida" | sed 's/^/  /' >> "$INFORME"
    local total
    total=$(echo "$salida" | wc -l)
    log ""
    log "  --> $total coincidencia(s). REVISAR UNA POR UNA."
  else
    log "  [sin coincidencias]"
  fi
  log '```'
}

buscar_en "Configuracion del sistema (/etc)" /etc
buscar_en "Aplicaciones desplegadas (/opt, /srv, /usr/local/etc)" /opt /srv /usr/local/etc
buscar_en "Unidades systemd" /etc/systemd /lib/systemd/system
buscar_en "Tareas programadas" /etc/cron.d /etc/crontab /var/spool/cron

for ruta in "${RUTAS_PROYECTO[@]:-}"; do
  [[ -z "$ruta" ]] && continue
  log ""
  log "### Codigo del proyecto: $ruta"
  log ""
  log '```'
  grep -rIn --binary-files=without-match "$RED_REGEX" "$ruta" \
       --exclude-dir={.git,node_modules,target,dist,build,vendor,.venv,__pycache__} \
       2>/dev/null | head -100 | sed 's/^/  /' >> "$INFORME" \
    || log "  [sin coincidencias]"
  log '```'
done

if [[ ${#RUTAS_PROYECTO[@]} -eq 0 ]]; then
  log ""
  log "> No se indico ninguna ruta de codigo. Volver a ejecutar con \`-p /ruta/al/proyecto\`"
  log "> para rastrear tambien el codigo fuente y los ficheros de despliegue."
fi

# ---------------------------------------------------------------------------
# 4. Servicios concretos
# ---------------------------------------------------------------------------

seccion "8. Configuracion de servicios relevantes"

capturar "nginx: comprobacion de sintaxis" "nginx -t"
capturar "nginx: sitios habilitados"       "ls -la /etc/nginx/sites-enabled/ 2>/dev/null && cat /etc/nginx/sites-enabled/* 2>/dev/null"
capturar "Apache: sitios habilitados"      "ls -la /etc/apache2/sites-enabled/ 2>/dev/null"
capturar "PostgreSQL: pg_hba.conf"         "grep -v '^\\s*#' /etc/postgresql/*/main/pg_hba.conf 2>/dev/null | grep -v '^\\s*\$'"
capturar "PostgreSQL: listen_addresses"    "grep -E '^\\s*listen_addresses' /etc/postgresql/*/main/postgresql.conf 2>/dev/null"
capturar "Exportaciones NFS"               "cat /etc/exports"

seccion "9. Certificados TLS"
log ""
log "> Si el certificado solo cubre el nombre antiguo, o si se accede por IP,"
log "> hay que emitir uno nuevo ANTES del corte."

for dominio in $(grep -rhoP '(?<=server_name\s)[^;]+' /etc/nginx/sites-enabled/ 2>/dev/null \
                 | tr ' ' '\n' | grep -v '^_$' | sort -u | head -5); do
  capturar "Certificado de $dominio" \
    "echo | openssl s_client -connect ${dominio}:443 -servername ${dominio} 2>/dev/null | openssl x509 -noout -subject -dates -ext subjectAltName"
done

# ---------------------------------------------------------------------------
# 5. Copia de los ficheros de configuracion
# ---------------------------------------------------------------------------

seccion "10. Copia de seguridad de la configuracion"

DIR_BACKUP="$DIR_SALIDA/configuracion"
mkdir -p "$DIR_BACKUP"

for origen in /etc/netplan /etc/network/interfaces /etc/hosts /etc/resolv.conf \
              /etc/nginx /etc/docker/daemon.json /etc/exports; do
  if [[ -e "$origen" ]]; then
    cp -a "$origen" "$DIR_BACKUP/" 2>/dev/null && echo "    copiado: $origen"
  fi
done

cp /etc/postgresql/*/main/pg_hba.conf "$DIR_BACKUP/" 2>/dev/null

# Estado de red en texto plano, para comparar despues con diff
ip addr    > "$DIR_BACKUP/estado-ip-addr.txt"  2>/dev/null
ip route   > "$DIR_BACKUP/estado-ip-route.txt" 2>/dev/null
ss -tulpn  > "$DIR_BACKUP/estado-puertos.txt"  2>/dev/null

log ""
log "Copia de la configuracion guardada en \`configuracion/\`."
log ""
log "Para comparar el estado despues de migrar:"
log ""
log '```bash'
log "ip addr | diff configuracion/estado-ip-addr.txt -"
log "ss -tulpn | diff configuracion/estado-puertos.txt -"
log '```'

# ---------------------------------------------------------------------------
# Cierre
# ---------------------------------------------------------------------------

# `grep -c` ya imprime 0 cuando no hay coincidencias, pero devuelve codigo 1.
# Un `|| echo 0` aqui anadiria una SEGUNDA linea ("0\n0") y romperia la
# comparacion numerica de mas abajo. Se toma solo la primera linea.
COINCIDENCIAS=$(grep -c 'REVISAR UNA POR UNA' "$INFORME" 2>/dev/null | head -1)
COINCIDENCIAS=${COINCIDENCIAS:-0}

log ""
log "---"
log ""
log "## Siguientes pasos"
log ""
log "1. Revisar la seccion 7: cada coincidencia es un punto a actualizar."
log "2. Contrastar la seccion 4 buscando servicios atados a la IP antigua."
log "3. Completar la tabla de inventario del informe principal (README, seccion 2.5)."
log "4. Solicitar a redes la IP, mascara, gateway, DNS y reglas de acceso."
log "5. Bajar el TTL del DNS a 300 s con 24-48 h de antelacion."

echo ""
echo "Inventario completado."
echo "  Informe:       $INFORME"
echo "  Configuracion: $DIR_BACKUP"
if [[ "$COINCIDENCIAS" -gt 0 ]]; then
  echo ""
  echo "  ATENCION: se encontraron apariciones de '${RED_ANTIGUA}' en $COINCIDENCIAS bloque(s)."
  echo "            Revisar la seccion 7 del informe antes de migrar."
fi
echo ""