# =====================================================================
# Reservas LIS — root input variables.
# Secrets must come from terraform.tfvars (gitignored) or AWS Secrets
# Manager / SSM; never commit real values.
# =====================================================================

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short project name used as a resource prefix."
  type        = string
  default     = "reservas-lis"
}

# ---- Networking -----------------------------------------------------
variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "backend_port" {
  description = "Port the Spring Boot container listens on."
  type        = number
  default     = 8080
}

variable "alb_port" {
  description = "Port the ALB listens on (HTTP)."
  type        = number
  default     = 80
}

# ---- RDS / MySQL 8 --------------------------------------------------
variable "db_name" {
  description = "MySQL database name."
  type        = string
  default     = "reservas_lis"
}

variable "db_username" {
  description = "MySQL master username."
  type        = string
  default     = "admin"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS (GB)."
  type        = number
  default     = 20
}

# ---- ECS / Fargate --------------------------------------------------
variable "ecs_cpu" {
  description = "Fargate task CPU (1024 = 1 vCPU)."
  type        = number
  default     = 512
}

variable "ecs_memory" {
  description = "Fargate task memory in MB."
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of backend tasks."
  type        = number
  default     = 1
}

# ---- Application secrets (supply via tfvars / Secrets Manager) ------
variable "jwt_secret" {
  description = "JWT signing secret (>= 32 bytes)."
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client id (may be empty if SSO disabled)."
  type        = string
  default     = ""
}

variable "cors_allowed_origins" {
  description = "Comma-separated allowed CORS origins."
  type        = string
  default     = "*"
}

# ---- DBeaver / external DB access ----------------------------------
variable "db_allowed_cidr_blocks" {
  description = "CIDR blocks allowed to connect directly to RDS (DBeaver)."
  type        = list(string)
  default     = []
}

variable "rds_publicly_accessible" {
  description = "Assign a public IP to RDS for external client access."
  type        = bool
  default     = false
}
