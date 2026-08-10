output "github_oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC identity provider."
  value       = aws_iam_openid_connect_provider.github.arn
}

output "backend_role_arn" {
  description = "IAM role assumed by GitHub Actions from the backend branch."
  value       = aws_iam_role.backend_github_oidc.arn
}

output "frontend_role_arn" {
  description = "IAM role assumed by GitHub Actions from the frontend branch."
  value       = aws_iam_role.frontend_github_oidc.arn
}