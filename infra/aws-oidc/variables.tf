variable "aws_region" {
  description = "AWS region used by GitHub Actions for STS operations."
  type        = string
  default     = "us-east-1"
}

variable "github_subject_prefix" {
  description = "Current GitHub OIDC subject prefix for the LISource repository."
  type        = string
  default     = "repo:lisudea@25753205/technical-test-2026-2@1322968204"
}

variable "backend_branch" {
  description = "Backend branch allowed to assume the backend IAM role."
  type        = string
  default     = "1021805193-reto2"
}

variable "frontend_branch" {
  description = "Frontend branch allowed to assume the frontend IAM role."
  type        = string
  default     = "1021805193-reto3"
}

variable "name_prefix" {
  description = "Prefix used for LISource AWS IAM resources."
  type        = string
  default     = "lisource"
}