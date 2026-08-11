# =====================================================================
# ECS module — cluster, Fargate task definition, service, ALB, logs.
# =====================================================================

# ---------- Cluster -------------------------------------------------
resource "aws_ecs_cluster" "this" {
  name = "${var.project_name}-cluster"
}

# ---------- CloudWatch log group ------------------------------------
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = 7
}

# ---------- ALB -----------------------------------------------------
resource "aws_lb" "this" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = var.subnet_ids
  security_groups    = [var.alb_sg_id]
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-tg"
  port        = var.backend_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.selected.id
  target_type = "ip"

  health_check {
    path                = "/api/v1/equipos"
    matcher             = "200"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
  }
}

data "aws_vpc" "selected" {
  id = var.vpc_id
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = var.alb_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ---------- Task definition ----------------------------------------
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = var.cpu
  memory                  = var.memory
  execution_role_arn      = aws_iam_role.ecs_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = var.ecr_repo_url

      # ECS Fargate does not expand interpolation; these are passed at
      # task run time. Secrets (DB password, JWT) should be referenced
      # from Secrets Manager via `secrets` in a production setup.
      environment = [
        { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
        { name = "DB_URL",                  value = "jdbc:mysql://${var.db_host}:3306/${var.db_name}?useSSL=false&serverTimezone=America/Bogota&allowPublicKeyRetrieval=true" },
        { name = "DB_USERNAME",             value = var.db_username },
        { name = "DB_PASSWORD",             value = var.db_password },
        { name = "JWT_SECRET",              value = var.jwt_secret },
        { name = "GOOGLE_SSO_ENABLED",      value = "false" },
        { name = "GOOGLE_CLIENT_ID",        value = var.google_client_id },
        { name = "CORS_ALLOWED_ORIGINS",    value = var.cors_allowed_origins },
      ]

      portMappings = [
        { containerPort = var.backend_port, protocol = "tcp" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}

# ---------- Service -------------------------------------------------
resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.ecs_sg_id]
    assign_public_ip = var.assign_public_ip
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = var.backend_port
  }

  depends_on = [aws_lb_listener.http]
}

# ---------- IAM -----------------------------------------------------
data "aws_region" "current" {}

data "aws_iam_policy_document" "ecs_execution_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "${var.project_name}-ecs-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_execution_assume.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name               = "${var.project_name}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_execution_assume.json
}

# ---------- Outputs ------------------------------------------------
output "alb_dns_name" {
  value = aws_lb.this.dns_name
}

output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "service_name" {
  value = aws_ecs_service.backend.name
}

# ---------- Variables ----------------------------------------------
variable "project_name" {
  type = string
}

variable "backend_port" {
  type = number
}

variable "alb_port" {
  type = number
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "alb_sg_id" {
  type = string
}

variable "ecs_sg_id" {
  type = string
}

variable "ecr_repo_url" {
  type = string
}

variable "cpu" {
  type = number
}

variable "memory" {
  type = number
}

variable "db_host" {
  type = string
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "google_client_id" {
  type    = string
  default = ""
}

variable "cors_allowed_origins" {
  type    = string
  default = "*"
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "assign_public_ip" {
  description = "Assign a public IP to each Fargate task (needed for ECR pull without NAT Gateway)."
  type        = bool
  default     = false
}
