variable "aws_region" {
  description = "AWS region used by GitHub Actions for STS operations."
  type        = string
  default     = "us-east-1"
}

variable "github_repository" {
  description = "GitHub repository allowed to request AWS temporary credentials."
  type        = string
  default     = "lisudea/technical-test-2026-2"
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