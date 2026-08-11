# =====================================================================
# Reservas LIS — Terraform root module.
# Deploys: VPC + subnets, ECS Fargate service + ALB, RDS MySQL 8, ECR.
# Apply with: terraform init && terraform apply
# State is local for this reto; in production use an S3 + DynamoDB backend.
# =====================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Example remote backend (uncomment and fill the bucket/table when wiring CI):
  # backend "s3" {
  #   bucket         = "reservas-lis-tfstate"
  #   key            = "reto2/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "reservas-lis-tflocks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "reservas-lis"
      Challenge = "reto2"
      ManagedBy = "terraform"
    }
  }
}

# ---------- Modules --------------------------------------------------
module "network" {
  source = "./modules/network"

  vpc_cidr        = var.vpc_cidr
  project_name    = var.project_name
  backend_port    = var.backend_port
  alb_port        = var.alb_port
  db_port         = 3306
}

module "ecr" {
  source      = "./modules/ecr"
  repo_name   = "${var.project_name}-backend"
}

module "rds" {
  source = "./modules/rds"

  project_name       = var.project_name
  db_name            = var.db_name
  db_username        = var.db_username
  db_instance_class  = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage

  subnet_ids         = module.network.public_subnet_ids   # public subnets for DBeaver access
  allowed_cidr_blocks = concat(
    [module.network.vpc_cidr],
    var.db_allowed_cidr_blocks
  )
  db_sg_id           = module.network.rds_security_group_id
  publicly_accessible = var.rds_publicly_accessible
}

module "ecs" {
  source = "./modules/ecs"

  project_name        = var.project_name
  backend_port        = var.backend_port
  alb_port            = var.alb_port

  vpc_id              = module.network.vpc_id
  subnet_ids          = module.network.public_subnet_ids   # public subnets for ECR access (no NAT Gateway)
  alb_sg_id           = module.network.alb_security_group_id
  ecs_sg_id           = module.network.ecs_security_group_id

  ecr_repo_url       = module.ecr.repository_url
  cpu                = var.ecs_cpu
  memory             = var.ecs_memory

  db_host            = module.rds.db_address
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = module.rds.db_password
  jwt_secret         = var.jwt_secret
  google_client_id   = var.google_client_id
  cors_allowed_origins = var.cors_allowed_origins

  desired_count      = var.ecs_desired_count
  assign_public_ip   = true
}

# ---------- Frontend (S3 + CloudFront) --------------------------------
module "frontend" {
  source = "./modules/frontend"

  project_name = var.project_name
}

# ---------- Root outputs --------------------------------------------
output "alb_dns_name" {
  description = "ALB DNS name — point your frontend or curl here."
  value       = module.ecs.alb_dns_name
}

output "db_endpoint" {
  description = "RDS hostname (host:port)."
  value       = module.rds.db_endpoint
}

output "db_address" {
  description = "RDS hostname (address only)."
  value       = module.rds.db_address
}

output "db_password" {
  description = "RDS master password. Sensitive."
  sensitive   = true
  value       = module.rds.db_password
}

output "ecr_repo_url" {
  description = "ECR repository URL for the backend image."
  value       = module.ecr.repository_url
}

output "frontend_bucket" {
  description = "S3 bucket name for frontend static files."
  value       = module.frontend.bucket_name
}

output "frontend_url" {
  description = "CloudFront domain for the frontend."
  value       = module.frontend.cloudfront_domain
}
