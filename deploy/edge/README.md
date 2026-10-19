# Edge proxy (Caddy)

`Caddyfile` routes `learn.`: the frontend, with the API mounted under `/api/*` on the same origin, and obtains its TLS certificate. `edge.env.example` lists its settings.

**The e-learning platform owns its edge** (ADR-010). It runs in this product's production stack (`deploy/compose.prod.yml`), so the platform deploys without the website. The website runs its own edge for `www.`, `cms.` and the bare domain (website repository, `deploy/edge/`).

The two edges each bind ports 80 and 443, so they run on **separate hosts or IP addresses**. The e-learning host is where learner and payment data live, so it is the one ADR-004's in-country residency decision applies to first. If both products ever have to share one machine, put a single Caddy in front of both instead, and record that as a new ADR.

Before go-live, the API must trust exactly one proxy hop (finding N-1). See the comments in `Caddyfile`.
