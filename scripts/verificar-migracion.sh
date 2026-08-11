#!/usr/bin/env bash
#
# verificar-migracion.sh
#
# Ejecuta las comprobaciones de las seis capas descritas en la seccion 5 del
# informe, en orden de menor a mayor nivel: si falla la conectividad, no tiene
# sentido probar la aplicacion. Ese orden es justamente lo que ahorra tiempo de
# diagnostico.
#
# Devuelve 0 si todas las comprobaciones criticas pasan, y 1 si alguna falla,
# de modo que puede usarse en una tarea programada o en un pipeline.
#
# SOLO LECTURA: no modifica nada del sistema.
#
# Uso:
#   ./verificar-migracion.sh --host app-lis.udea.edu.co --ip 10.18.30.20 \
#                            --gateway 10.18.30.254 --db-host 10.18.30.30
#
#   --host      Nombre DNS del servicio            (obligatorio)
#   --ip        IP nueva esperada del servidor     (obligatorio)
#   --gateway   Gateway nuevo                      (opcional)
#   --db-host   Host de la base de datos           (opcional)
#   --db-port   Puerto de la base de datos         (por defecto 5432)
#   --port      Puerto del servicio web            (por defecto 443, u 80 con --http)
#   --path      Ruta del healthcheck               (por defecto /)
#   --http      Usar http en lugar de https
#
# Reto 4 - Prueba Tecnica 2026-2 - Laboratorio Integrado de Sistemas, UdeA

set -uo pipefail

HOST=""
IP_ESPERADA=""
GATEWAY=""
DB_HOST=""
DB_PORT="5432"
PUERTO_WEB=""
RUTA_SALUD="/"
ESQUEMA="https"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)     HOST="$2"; shift 2 ;;
    --ip)       IP_ESPERADA="$2"; shift 2 ;;
    --gateway)  GATEWAY="$2"; shift 2 ;;
    --db-host)  DB_HOST="$2"; shift 2 ;;
    --db-port)  DB_PORT="$2"; shift 2 ;;
    --port)     PUERTO_WEB="$2"; shift 2 ;;
    --path)     RUTA_SALUD="$2"; shift 2 ;;
    --http)     ESQUEMA="http"; shift ;;
    -h|--help)  sed -n '2,29p' "$0"; exit 0 ;;
    *) echo "Opcion desconocida: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$HOST" || -z "$IP_ESPERADA" ]]; then
  echo "Error: --host y --ip son obligatorios." >&2
  echo "Ayuda: $0 --help" >&2
  exit 1
fi

# El puerto por defecto depende del esquema; --port permite forzarlo, que es
# lo habitual cuando el servicio corre en un puerto no estandar.
if [[ -z "$PUERTO_WEB" ]]; then
  PUERTO_WEB=$([[ "$ESQUEMA" == "https" ]] && echo 443 || echo 80)
fi

# El puerto solo se escribe en la URL cuando no es el estandar del esquema.
if [[ "$ESQUEMA" == "https" && "$PUERTO_WEB" == "443" ]] || \
   [[ "$ESQUEMA" == "http"  && "$PUERTO_WEB" == "80"  ]]; then
  URL="${ESQUEMA}://${HOST}${RUTA_SALUD}"
else
  URL="${ESQUEMA}://${HOST}:${PUERTO_WEB}${RUTA_SALUD}"
fi

# ---------------------------------------------------------------------------
# Presentacion de resultados
# ---------------------------------------------------------------------------

if [[ -t 1 ]]; then
  VERDE=$'\033[0;32m'; ROJO=$'\033[0;31m'; AMARILLO=$'\033[0;33m'
  AZUL=$'\033[0;34m';  NEGRITA=$'\033[1m';  FIN=$'\033[0m'
else
  VERDE=""; ROJO=""; AMARILLO=""; AZUL=""; NEGRITA=""; FIN=""
fi

TOTAL=0; OK=0; FALLOS=0; AVISOS=0
declare -a FALLOS_DETALLE=()

capa() {
  echo ""
  echo "${AZUL}${NEGRITA}=== $* ===${FIN}"
}

# ok <descripcion> <detalle>
ok()    { TOTAL=$((TOTAL+1)); OK=$((OK+1));       printf '  %sOK%s    %s %s\n' "$VERDE" "$FIN" "$1" "${2:-}"; }
# fallo: cuenta para el codigo de salida
fallo() { TOTAL=$((TOTAL+1)); FALLOS=$((FALLOS+1)); printf '  %sFALLO%s %s %s\n' "$ROJO" "$FIN" "$1" "${2:-}"
          FALLOS_DETALLE+=("$1 ${2:-}"); }
# aviso: digno de mirar, pero no invalida la migracion
aviso() { AVISOS=$((AVISOS+1));                    printf '  %sAVISO%s %s %s\n' "$AMARILLO" "$FIN" "$1" "${2:-}"; }
salta() {                                          printf '  %s----%s  %s %s\n' "$AMARILLO" "$FIN" "$1" "${2:-}"; }

tiene() { command -v "$1" >/dev/null 2>&1; }

echo ""
echo "${NEGRITA}Verificacion posterior a la migracion${FIN}"
echo "  Servicio : $URL"
echo "  IP nueva : $IP_ESPERADA"
echo "  Fecha    : $(date '+%Y-%m-%d %H:%M:%S')"

# ---------------------------------------------------------------------------
capa "Capa 1 - Conectividad"
# ---------------------------------------------------------------------------

if tiene ip; then
  if ip -br addr 2>/dev/null | grep -q "$IP_ESPERADA"; then
    ok "La IP nueva esta configurada en una interfaz" "($IP_ESPERADA)"
  else
    aviso "La IP nueva no aparece en este equipo" \
          "(normal si se ejecuta desde un cliente y no desde el servidor)"
  fi

  # Dos rutas por defecto provocan fallos intermitentes muy dificiles de rastrear.
  n_default=$(ip route show default 2>/dev/null | wc -l)
  if [[ "$n_default" -eq 1 ]]; then
    ok "Hay exactamente una ruta por defecto" "($(ip route show default | awk '{print $3}'))"
  elif [[ "$n_default" -eq 0 ]]; then
    fallo "No hay ruta por defecto"
  else
    fallo "Hay $n_default rutas por defecto" "(el trafico saliente sera impredecible)"
  fi
else
  salta "iproute2 no disponible" "(se omiten las comprobaciones locales de red)"
fi

if [[ -n "$GATEWAY" ]]; then
  if ping -c 2 -W 2 "$GATEWAY" >/dev/null 2>&1; then
    ok "El gateway responde" "($GATEWAY)"
  else
    fallo "El gateway no responde" "($GATEWAY)"
  fi
fi

# Ping por IP: separa un problema de conectividad de uno de DNS.
if ping -c 2 -W 2 8.8.8.8 >/dev/null 2>&1; then
  ok "Salida a internet por IP"
else
  aviso "Sin respuesta de 8.8.8.8" "(puede estar bloqueado el ICMP por politica)"
fi

# ---------------------------------------------------------------------------
capa "Capa 2 - Resolucion de nombres"
# ---------------------------------------------------------------------------

# Se prueban varias herramientas en cadena. En un sistema minimo puede no
# haber ninguna, y entonces lo honesto es decir "no se pudo comprobar" en
# lugar de afirmar que el nombre no resuelve.
RESUELTO=""
HAY_RESOLUTOR=false

if tiene dig; then
  HAY_RESOLUTOR=true
  RESUELTO=$(dig +short "$HOST" 2>/dev/null | grep -E '^[0-9]+\.' | head -1)
fi
if [[ -z "$RESUELTO" ]] && tiene getent; then
  HAY_RESOLUTOR=true
  RESUELTO=$(getent hosts "$HOST" 2>/dev/null | awk '{print $1}' | head -1)
fi
if [[ -z "$RESUELTO" ]] && tiene host; then
  HAY_RESOLUTOR=true
  RESUELTO=$(host "$HOST" 2>/dev/null | awk '/has address/ {print $NF; exit}')
fi
# Ultimo recurso: curl resuelve por su cuenta y sabe informar de la IP usada.
if [[ -z "$RESUELTO" ]] && tiene curl; then
  HAY_RESOLUTOR=true
  RESUELTO=$(curl -s -o /dev/null -w '%{remote_ip}' --max-time 5 -k "$URL" 2>/dev/null)
  [[ "$RESUELTO" == "0.0.0.0" ]] && RESUELTO=""
fi

if [[ "$HAY_RESOLUTOR" == false ]]; then
  salta "Sin herramientas de resolucion" "(instalar dnsutils para comprobar el DNS)"
elif [[ -z "$RESUELTO" ]]; then
  fallo "$HOST no resuelve"
elif [[ "$RESUELTO" == "$IP_ESPERADA" ]]; then
  ok "$HOST resuelve a la IP esperada" "($RESUELTO)"
else
  fallo "$HOST resuelve a $RESUELTO" "(se esperaba $IP_ESPERADA; puede ser cache DNS)"
fi

if tiene dig; then
  TTL=$(dig "$HOST" 2>/dev/null | awk -v h="$HOST." '$1==h && $4=="A" {print $2; exit}')
  if [[ -n "$TTL" ]]; then
    if [[ "$TTL" -le 300 ]]; then
      ok "TTL bajo, la reversion seria rapida" "(${TTL}s)"
    else
      aviso "TTL alto" "(${TTL}s: revertir el DNS tardaria en propagar)"
    fi
  fi
fi

# ---------------------------------------------------------------------------
capa "Capa 3 - Puertos"
# ---------------------------------------------------------------------------

comprobar_puerto() {
  local destino="$1" puerto="$2" etiqueta="$3"
  if tiene nc; then
    if nc -z -w 3 "$destino" "$puerto" >/dev/null 2>&1; then
      ok "$etiqueta accesible" "(${destino}:${puerto})"
    else
      fallo "$etiqueta NO accesible" "(${destino}:${puerto})"
    fi
  elif tiene timeout; then
    if timeout 3 bash -c "echo > /dev/tcp/${destino}/${puerto}" 2>/dev/null; then
      ok "$etiqueta accesible" "(${destino}:${puerto})"
    else
      fallo "$etiqueta NO accesible" "(${destino}:${puerto})"
    fi
  else
    salta "Sin nc ni timeout" "(no se puede comprobar ${destino}:${puerto})"
  fi
}

comprobar_puerto "$IP_ESPERADA" "$PUERTO_WEB" "Servicio web"

if tiene ss; then
  if ss -tulpn 2>/dev/null | grep -qE ":${PUERTO_WEB}\s"; then
    ok "El servidor escucha en el puerto $PUERTO_WEB"
    # Un servicio atado a una IP concreta deja de escuchar cuando esa IP se retira.
    if ss -tulpn 2>/dev/null | grep -qE '[[:space:]]192\.168\.[0-9]+\.[0-9]+:[0-9]+[[:space:]]'; then
      fallo "Hay un servicio atado a una IP 192.168.x" "(dejara de escuchar al retirarla)"
    fi
  fi
fi

# ---------------------------------------------------------------------------
capa "Capa 4 - Aplicacion"
# ---------------------------------------------------------------------------

if ! tiene curl; then
  salta "curl no disponible" "(se omiten las comprobaciones de aplicacion)"
else
  CODIGO=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$URL" 2>/dev/null)

  if [[ "$CODIGO" =~ ^2 ]]; then
    ok "El servicio responde" "(HTTP $CODIGO)"
  elif [[ "$CODIGO" =~ ^3 ]]; then
    aviso "Redireccion" "(HTTP $CODIGO: comprobar que el destino es el correcto)"
  elif [[ "$CODIGO" == "000" ]]; then
    fallo "Sin respuesta del servicio" "(tiempo agotado, TLS o conexion rechazada)"
  else
    fallo "El servicio responde con error" "(HTTP $CODIGO)"
  fi

  # Prueba el servidor saltandose el DNS: distingue un fallo de DNS de uno de servicio.
  CODIGO_DIRECTO=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -k \
                   --resolve "${HOST}:${PUERTO_WEB}:${IP_ESPERADA}" "$URL" 2>/dev/null)

  if [[ "$CODIGO_DIRECTO" =~ ^[23] ]]; then
    ok "Responde tambien apuntando directo a la IP nueva" "(HTTP $CODIGO_DIRECTO)"
  else
    fallo "No responde apuntando directo a la IP nueva" "(HTTP $CODIGO_DIRECTO)"
  fi

  TIEMPOS=$(curl -s -o /dev/null --max-time 10 \
            -w 'DNS %{time_namelookup}s | TLS %{time_appconnect}s | total %{time_total}s' \
            "$URL" 2>/dev/null)
  [[ -n "$TIEMPOS" ]] && echo "         tiempos: $TIEMPOS"

  # CORS: es el fallo silencioso por excelencia. El servidor responde bien y
  # aun asi el navegador bloquea las llamadas.
  CORS=$(curl -s -I -X OPTIONS --max-time 10 \
         -H "Origin: ${ESQUEMA}://${HOST}" \
         -H "Access-Control-Request-Method: GET" \
         "$URL" 2>/dev/null | grep -i 'access-control-allow-origin')

  if [[ -n "$CORS" ]]; then
    ok "CORS responde con Allow-Origin" "($(echo "$CORS" | tr -d '\r' | cut -c1-60))"
  else
    aviso "Sin cabecera Access-Control-Allow-Origin" \
          "(normal si la ruta no es una API; critico si lo es)"
  fi
fi

# Certificado TLS
if [[ "$ESQUEMA" == "https" ]] && tiene openssl; then
  CERT=$(echo | timeout 10 openssl s_client -connect "${HOST}:443" \
         -servername "$HOST" 2>/dev/null | openssl x509 -noout -checkend 604800 2>&1)

  # Se distinguen tres casos. Confundir "no se pudo leer" con "esta caducado"
  # manda a diagnosticar el certificado cuando el problema real es de red.
  if [[ "$CERT" == *"will not expire"* ]]; then
    ok "Certificado TLS valido" "(mas de 7 dias de vigencia)"
  elif [[ "$CERT" == *"will expire"* ]]; then
    fallo "Certificado caducado o caduca en menos de 7 dias"
  else
    fallo "No se pudo leer el certificado TLS" "(host inalcanzable, o el 443 no responde TLS)"
  fi

  SAN=$(echo | timeout 10 openssl s_client -connect "${HOST}:443" \
        -servername "$HOST" 2>/dev/null \
        | openssl x509 -noout -ext subjectAltName 2>/dev/null)

  if echo "$SAN" | grep -q "$HOST"; then
    ok "El certificado cubre el nombre nuevo" "($HOST)"
  elif [[ -n "$SAN" ]]; then
    fallo "El certificado NO cubre $HOST" "(los navegadores mostraran advertencia)"
  fi
fi

# ---------------------------------------------------------------------------
capa "Capa 5 - Dependencias"
# ---------------------------------------------------------------------------

if [[ -n "$DB_HOST" ]]; then
  comprobar_puerto "$DB_HOST" "$DB_PORT" "Base de datos"

  if tiene pg_isready; then
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -t 5 >/dev/null 2>&1; then
      ok "PostgreSQL acepta conexiones"
    else
      fallo "PostgreSQL no acepta conexiones" "(${DB_HOST}:${DB_PORT})"
    fi
  fi
else
  salta "Sin --db-host" "(se omite la comprobacion de base de datos)"
fi

# Los contenedores tienen su propia pila de red: que funcione el anfitrion
# no garantiza que funcione dentro.
if tiene docker && docker ps -q >/dev/null 2>&1; then
  N=$(docker ps -q 2>/dev/null | wc -l)
  if [[ "$N" -gt 0 ]]; then
    ok "Contenedores en ejecucion" "($N)"
    PRIMERO=$(docker ps -q | head -1)
    if docker exec "$PRIMERO" getent hosts "$HOST" >/dev/null 2>&1; then
      ok "El contenedor resuelve $HOST"
    else
      aviso "El contenedor no resuelve $HOST" "(revisar el DNS del contenedor)"
    fi
  fi
fi

# Errores recientes en los servicios
if tiene journalctl; then
  ERRORES=$(journalctl --since '15 min ago' -p err --no-pager -q 2>/dev/null | wc -l)
  if [[ "$ERRORES" -eq 0 ]]; then
    ok "Sin errores en el journal de los ultimos 15 min"
  else
    aviso "$ERRORES error(es) en el journal de los ultimos 15 min" \
          "(revisar: journalctl --since '15 min ago' -p err)"
  fi
fi

# ---------------------------------------------------------------------------
capa "Capa 6 - Comprobacion manual (no automatizable)"
# ---------------------------------------------------------------------------

cat <<PENDIENTE
  Estas comprobaciones requieren un navegador y una persona:

    [ ] Abrir $URL desde la red del laboratorio
    [ ] Abrir $URL a traves de la VPN
    [ ] Completar un inicio de sesion real con el proveedor externo
    [ ] Realizar una operacion de escritura de extremo a extremo
    [ ] Revisar la consola del navegador: los errores de CORS y de
        contenido mixto SOLO se ven ahi
    [ ] Probar desde un movil conectado a la red institucional
PENDIENTE

# ---------------------------------------------------------------------------
# Resumen
# ---------------------------------------------------------------------------

echo ""
echo "${NEGRITA}=== Resumen ===${FIN}"
echo "  Comprobaciones : $TOTAL"
echo "  ${VERDE}Correctas      : $OK${FIN}"
echo "  ${ROJO}Fallidas       : $FALLOS${FIN}"
echo "  ${AMARILLO}Avisos         : $AVISOS${FIN}"

if [[ "$FALLOS" -gt 0 ]]; then
  echo ""
  echo "  ${ROJO}${NEGRITA}Han fallado comprobaciones criticas:${FIN}"
  for f in "${FALLOS_DETALLE[@]}"; do echo "    - $f"; done
  echo ""
  echo "  Valorar la reversion segun los criterios de la seccion 4.3 del informe."
  echo ""
  exit 1
fi

echo ""
echo "  ${VERDE}${NEGRITA}Todas las comprobaciones automaticas pasaron.${FIN}"
echo "  Completar la lista manual de la capa 6 antes de dar por cerrada la migracion."
echo ""
exit 0