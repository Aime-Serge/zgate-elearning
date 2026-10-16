# Observability

Shared runtime concerns for both products. Nothing here runs yet.

- `uptime-checks.example.yml`: the endpoints an external uptime monitor should
  poll once a monitoring service is chosen (`docs/platform-v2/06-DEVOPS-RELIABILITY.md`).
  Every app exposes `GET /api/health` (liveness, no dependencies) and
  `GET /api/ready` (readiness: database or CMS reachable, 503 otherwise). Poll
  `ready` from outside; container healthchecks use `health`.

Planned, not built: central log collection and metrics. Until then, logs are
`docker compose logs <service>` on each host.
