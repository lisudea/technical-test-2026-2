resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]
}

data "aws_iam_policy_document" "backend_assume_role" {
  statement {
    effect = "Allow"

    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]

    principals {
      type = "Federated"

      identifiers = [
        aws_iam_openid_connect_provider.github.arn
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"

      values = [
        "sts.amazonaws.com"
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"

      values = [
        "${var.github_subject_prefix}:ref:refs/heads/${var.backend_branch}"
      ]
    }
  }
}

data "aws_iam_policy_document" "frontend_assume_role" {
  statement {
    effect = "Allow"

    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]

    principals {
      type = "Federated"

      identifiers = [
        aws_iam_openid_connect_provider.github.arn
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"

      values = [
        "sts.amazonaws.com"
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"

      values = [
        "${var.github_subject_prefix}:ref:refs/heads/${var.frontend_branch}"
      ]
    }
  }
}

resource "aws_iam_role" "backend_github_oidc" {
  name                 = "${var.name_prefix}-github-oidc-reto2"
  description          = "Temporary GitHub OIDC identity for LISource backend validation."
  assume_role_policy   = data.aws_iam_policy_document.backend_assume_role.json
  max_session_duration = 3600

  tags = {
    Project   = "LISource"
    Component = "Backend"
    Branch    = var.backend_branch
    ManagedBy = "Terraform"
  }
}

resource "aws_iam_role" "frontend_github_oidc" {
  name                 = "${var.name_prefix}-github-oidc-reto3"
  description          = "Temporary GitHub OIDC identity for LISource frontend validation."
  assume_role_policy   = data.aws_iam_policy_document.frontend_assume_role.json
  max_session_duration = 3600

  tags = {
    Project   = "LISource"
    Component = "Frontend"
    Branch    = var.frontend_branch
    ManagedBy = "Terraform"
  }
}