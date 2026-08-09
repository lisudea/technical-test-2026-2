# ADR 0001 — Usar ECS Fargate sobre EC2

- **Estado**: Aceptado
- **Fecha**: 2026-08-09
- **Especulación de referencia**: [Spec 01 — Arquitectura en AWS](../specs/01-arquitectura-aws.md)

## Contexto

El sistema de reservas del LIS debe desplegarse en AWS dentro de un presupuesto
ajustado (~200 USD de crédito) y para una carga muy baja (del orden de 15
usuarios concurrentes). La decisión de cómputo para el backend (Spring Boot en
Java 21) se evalúa entre tres alternativas:

- **EC2 monolítico**: una instancia gestionada a mano donde instalamos JVM,
  Nginx, etc. Máximo control, pero máxima carga operativa.
- **ECS sobre EC2 (EC2 launch type)**: contenedores gestionados por ECS pero
  corriendo sobre instancias EC2 que nosotros administramos.
- **ECS Fargate (serverless de contenedores)**: contenedores sin administrar
  instancias.
- **EKS (Kubernetes gestionado)**: orquestador completo, con su control plane
  y operativa asociada.

El backend ya está empaquetado como imagen OCI (`infra/containers/backend.containerfile`),
construida con Podman localmente y compatible con Docker. La elección de
runtime define cuánta operativa automatizada queda fuera de nuestro alcance
(parches de SO, escalado,健康 checks) y cuánta paga el presupuesto.

## Decisión

Usar **Amazon ECS con launch type Fargate** para el backend, detrás de un
Application Load Balancer, con la imagen almacenada en ECR.

Justificación clave:

1. **Sin administración de instancias**: Fargate levanta la tarea (task) con la
   imagen OCI sin que nosotros tocamos AMIs, parches de SO ni upgrades del
   kernel. Para un proyecto de esta escala, mantener EC2 a mano es coste
   operativo que no aporta valor de evaluación.
2. **Escalado trivial**: cambiar `desired_count` escala horizontalmente; con
   Application Auto Scaling por CPU/memoria queda documentado el camino de
   escalado sin rediseño. EKS para la misma funcionalidad es matar moscas a
   cañonazos (~73 USD/mes solo del control plane).
3. **Cloud-native representativo**: Fargate refleja mejor prácticas actuales de
   contenedores serverless que un único EC2 monolítico, sin el overhead
   operativo de EKS. Para un portafolio, es el punto intermedio correcto entre
   "funciona" y "demuestra criterio".
4. **Costo coherente con el presupuesto**: una tarea Fargate 0.5 vCPU / 1 GB
   corriendo 24/7 cuesta ~18 USD/mes. El conjunto del stack (ECS + ALB + RDS +
   S3/CloudFront + ECR + CloudWatch) queda en ~60 USD/mes, dejando ~3.3 meses
   de margen con el crédito. Detener la tarea y la instancia RDS cuando no se
   demuestra activamente lleva el costo a ~3-4 USD/mes de almacenamiento.

## Consecuencias

### Positivas

- Cero parcheo de SO ni upgrades de JVM a nivel de instancia: la imagen OCI se
  reconstruye en CI y Fargate levanta la nueva task.
- Escalado horizontal nativo vía `desired_count` y Auto Scaling; no requiere
  reescribir la app.
- La misma imagen construida con Podman en local corre en producción —
  elimina la fricción "en mi máquina funciona" y hace reproducible el
  despliegue.
- Integración directa con ALB (healthchecks, TLS termination), ECR, CloudWatch
  Logs y Secrets Manager sin configuración extra.

### Negativas

- **Sin NAT Gateway** (por costo): las tareas corren en subred pública con IP
  pública asignada, protegidas por un Security Group que solo admite tráfico
  entrante desde el Security Group del ALB. Es seguro a esta escala, pero no es
  el patrón "subred privada + NAT" que se esperaría en un entorno empresarial
  más grande. Queda documentado como trade-off consciente, no como descuido.
- **Cold starts** de Fargate: al escalar de 0 a 1 tarea hay latencia de arranque
  de la JVM (segundos). Para una demo de 15 usuarios es irrelevente, pero
  conviene mantener `desired_count >= 1` cuando se necesite respuesta inmediata.
- **Vendor lock-in hacia ECS**: la definición de la tarea es específica de
  AWS. Mitigado porque la imagen OCI es estándar y portable a cualquier
  runtime de contenedores; solo la orquestación cambia.
- **Un solo entorno (`prod`)**: el presupuesto no da para staging; el entorno
  local con Podman cumple el rol de `dev`. Mitigado con tests de integración
  con Testcontainers (MySQL 8 real) que ejercitan el mismo motor de BD.

## Alternativas descartadas

| Alternativa | Motivo del descarte |
|---|---|
| EC2 monolítico | Máxima carga operativa (parches, AMIs, JVM) para 15 usuarios; menos representativo de prácticas cloud-native |
| ECS sobre EC2 | Mantiene la administración de instancias que precisamente queremos evitar con Fargate |
| EKS | Control plane ~73 USD/mes; operativa de Kubernetes desproporcionada para la carga y el presupuesto |
| Lambda | Spring Boot no encaja naturalmente en el modelo de ejecución efímera de Lambda sin reimplementar |
