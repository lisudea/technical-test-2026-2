# Pull Request — Reservas LIS

## What changes

<!-- One-paragraph summary of what this PR adds/changes. -->

## Why

<!-- The motivation: which requirement, bug, or design decision does
     this address? Link the issue or SDD change if applicable. -->

## How tested

<!-- How did you verify this works? Be specific.
     - Unit tests: `./mvnw -Dtest=ClassName test`
     - Integration: Testcontainers scenario run
     - Manual: endpoint + curl command + response
-->

## Checklist

- [ ] Commits follow Conventional Commits (`feat(scope):`, `fix(scope):`, etc.)
- [ ] No changes pushed to `main` (feature branch off `1007239188-reto2`)
- [ ] No secrets committed (RDS password, JWT key, Google client secret)
- [ ] New/changed endpoints are covered by tests
- [ ] `reserva/` conflict validation still uses `FOR UPDATE` inside a transaction
- [ ] RFC 7807 Problem Details shape preserved for new error cases
- [ ] Flyway migrations (if any) are forward-only and additive
- [ ] `./mvnw test` passes locally
- [ ] Docs / OpenAPI updated if the API surface changed

## Notes for review

<!-- Anything reviewers should pay special attention to, or areas of
     uncertainty you'd like a second opinion on. -->
