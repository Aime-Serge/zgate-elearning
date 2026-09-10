# Z-GATE Digital Platform — Performance, SEO & Analytics Strategy

Covers the three remaining DEFINE items without a dedicated output file — performance, SEO, and analytics are grouped here because they're genuinely linked at the implementation level (rendering strategy affects both Core Web Vitals and search ranking; analytics tooling has a real performance cost that must be weighed, not assumed free).

## Performance

### The governing constraint, restated

`docs/ux/EXPERIENCE_REQUIREMENTS.md` §1 and `docs/marketing/SEO_STRATEGY.md` both trace back to the same sourced fact: Rwanda's internet penetration is 34.2% against 88.7% mobile connectivity. Every decision below optimizes for a real user on a real, possibly slow, mobile connection — not a developer's fast office wifi.

### Rendering strategy (restates `ROUTE_MAP.md`'s per-route choices, performance-framed)

- **Public pages: static generation (SSG).** Pre-rendered at build time, served instantly with no server round-trip or database query per visit — the fastest possible option for content that changes rarely.
- **Portal pages: client-rendered, but with a fast initial shell.** The authenticated app doesn't need to be indexed or load instantly for an anonymous crawler, but it still needs to feel fast for a real user checking status on the go — code-splitting per route (automatic with Next.js's App Router) means a Client Portal user's browser never downloads the Staff Portal or Admin code they'll never use.

### Image and asset optimization

- Next.js's built-in image optimization (responsive sizing, modern formats, lazy-loading below the fold) is used for any image content — no separate image-CDN dependency is introduced at this scale.
- Fonts (Space Grotesk, Inter, IBM Plex Mono — `docs/design/DESIGN_SYSTEM.md`) are loaded with `font-display: swap` and preconnected, matching the Brand Identity Guide's own existing Google Fonts usage pattern rather than switching to self-hosted fonts speculatively — revisit only if font-loading is demonstrated to be a real bottleneck once the site is live and measurable.

### Bundle size discipline

- Every new dependency added anywhere in this frontend is a deliberate choice with a stated reason (matches this phase's own "avoid unnecessary dependencies" instruction, and `docs/architecture/ARCHITECTURE.md`'s cost-consciousness requirement) — `FRONTEND_ARCHITECTURE.md` and `STATE_MANAGEMENT.md` already justify each one (TanStack Query, React Hook Form, Zod) individually rather than pulling in a general-purpose utility library "just in case."
- No component library beyond the project's own `components/ui/` (`COMPONENT_ARCHITECTURE.md`) — a third-party component kit would add a large, only-partially-used dependency and would fight the design system rather than implement it.

### Targets

Core Web Vitals (Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout Shift) are tracked once the site is live and measurable — no specific target number is invented here without real traffic to validate against; the working target is simply "good" per Google's own published thresholds, treated as a floor, not an aspiration, for a company whose positioning depends on feeling professional and reliable (`docs/marketing/POSITIONING.md`) on the first visit.

## SEO

Operationalizes `docs/marketing/SEO_STRATEGY.md` at the implementation level:

- **Server-rendered/static public pages** (above) are the foundational SEO decision — a crawler sees fully-rendered HTML immediately, no client-side-rendering indexing risk.
- **Metadata:** every public page sets its own title, description, and Open Graph tags (Next.js's built-in metadata API) — using the approved Mission/Vision copy and division descriptions, not separately-written SEO copy that could drift from the approved messaging (`docs/marketing/MESSAGING_FRAMEWORK.md`).
- **Structured data:** `LocalBusiness` schema.org markup on the Home/Contact pages, reflecting the confirmed registered address (Inyarurembo, Kiyovu, Nyarugenge, Kigali — `docs/business/BUSINESS_ALIGNMENT.md`'s resolved finding, not the Brand Identity Guide's mockup address) — a real, low-cost local-SEO win directly serving `docs/marketing/SEO_STRATEGY.md`'s local-SEO section.
- **`sitemap.xml` and `robots.txt`** generated automatically from the route structure (Next.js supports this natively) — kept in sync with `ROUTE_MAP.md` by construction rather than maintained by hand.
- **Semantic HTML** (proper heading hierarchy, landmark regions) serves both SEO and `docs/design/ACCESSIBILITY_SPECIFICATION.md`'s semantic-structure requirement simultaneously — one implementation decision, two benefits, not two separate efforts.
- **Blocked, not decided here:** the production domain (`zgaterw.com` vs. `zgate.co`) remains open (`docs/marketing/SEO_STRATEGY.md`'s own blocking dependency) — no canonical URL, sitemap host, or Open Graph domain can be finalized until that's resolved.

## Analytics

- **Most of the KPI data Z-GATE actually needs is already captured server-side, not via client-side analytics.** Lead channel attribution (`docs/product/PRODUCT_KPIS.md`'s lead-capture-completeness metric) is a field on the `leads` record itself (`docs/database/DATA_MODEL.md`), populated at submission time — this needs no separate analytics tool to answer "how many leads came from Facebook this week," just a query against data already being collected for a real product reason.
- **What a lightweight, privacy-respecting page-view analytics tool would still add:** top-of-funnel traffic/reach visibility (page views, referrer sources) supporting `docs/marketing/MARKETING_STRATEGY.md`'s reach targets — but note the Day-90 reach target (15,000+ unique accounts) is itself Facebook/LinkedIn-platform-reported, not dependent on Z-GATE's own site analytics.
- **Recommendation, not a locked-in vendor choice:** if page-view-level analytics is wanted, choose a minimal, cookieless/privacy-respecting tool (avoiding a heavy tracking script that would both hurt performance and sit awkwardly next to `docs/business/BUSINESS_RULES.md` §4's data-minimization commitment) — this is a small, low-cost, easily-reversible choice to make at implementation time, not an architectural commitment this document needs to lock down now.
- **What is explicitly not built:** any analytics implying automated decision-making about a specific individual (which would trigger the DPIA requirement, `docs/security/DATA_PROTECTION_REQUIREMENTS.md`) — aggregate traffic/conversion analytics only.

## What this document does not do

It does not select a specific analytics vendor, does not set a numeric Core Web Vitals target without real traffic to calibrate against, and does not finalize SEO metadata until the domain question (`docs/marketing/SEO_STRATEGY.md`) is resolved.
