# =====================================================================
# RDS module — MySQL 8.0, single-AZ (db.t3.micro), subnet group, SG,
# random master password. Password is returned via a sensitive output
# and passed to the ECS task definition. In production, store it in
# Secrets Manager and reference from the ECS task `secrets` block.
# =====================================================================

resource "random_password" "master" {
  length           = 24
  special          = true
  override_special = "!#$%&*()-_=+[]{}:?"
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "this" {
  identifier             = "${var.project_name}-mysql"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  storage_type           = "gp2"

  db_name                = var.db_name
  username               = var.db_username
  password               = random_password.master.result

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [var.db_sg_id]

  multi_az               = false
  publicly_accessible    = var.publicly_accessible
  skip_final_snapshot    = true
  backup_retention_period = 1

  tags = {
    Name = "${var.project_name}-mysql"
  }
}

# Allow DBeaver / external access from specific CIDR blocks
# (e.g., developer's IP for local DB client access).
resource "aws_vpc_security_group_ingress_rule" "cidr" {
  for_each          = { for idx, cidr in var.allowed_cidr_blocks : idx => cidr }
  security_group_id = var.db_sg_id
  cidr_ipv4         = each.value
  from_port         = 3306
  to_port           = 3306
  ip_protocol       = "tcp"
  description       = "DBeaver / external DB client access (CIDR ${each.value})"
}

# ---------- Outputs ------------------------------------------------
output "db_endpoint" {
  description = "RDS hostname (host:port) — pass host part to the backend."
  value       = aws_db_instance.this.endpoint
}

output "db_address" {
  value = aws_db_instance.this.address
}

output "db_password" {
  description = "Master password. Sensitive — move to Secrets Manager in prod."
  sensitive   = true
  value       = random_password.master.result
}

# ---------- Variables ----------------------------------------------
variable "project_name" {
  type = string
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type = string
}

variable "db_instance_class" {
  type = string
}

variable "db_allocated_storage" {
  type = number
}

variable "subnet_ids" {
  type = list(string)
}

variable "allowed_cidr_blocks" {
  type    = list(string)
  default = []
}

variable "db_sg_id" {
  type = string
}

variable "publicly_accessible" {
  description = "Assign a public IP to RDS for external DB client access."
  type        = bool
  default     = false
}
