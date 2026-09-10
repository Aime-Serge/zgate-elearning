# UI/UX Audit

## Application UI/UX

**FACT:** No application UI exists. Nothing to audit for responsiveness, accessibility, component consistency, or navigation.

## Existing design system (FACT — this genuinely exists and is thorough)

`zgate-brand-identity(1).html` is a complete, self-contained Brand Identity Guide (V1, 2026) — an HTML document, not application code, but it constitutes the closest thing to an existing design system and should be treated as binding visual direction once UI work begins.

**Palette** (dark-first, ink/paper base):
| Token | Hex | Use |
|---|---|---|
| Ink (background) | `#0B0F1A` | primary surface |
| Ink-2 | `#131A2B` | secondary surface |
| Paper | `#ECEEF3` | light surface / text-on-dark |
| Paper-dim | `#B9BEC9` | secondary text |
| Gate gradient | `#5B6BFA → #34E0C9` | master brand / thresholds only — reserved, not for general UI |
| Advisory Brass | `#C9A15A` | Advisory-division materials |
| Academy Sage | `#3FAE7A` | Academy-division materials |
| Tech Signal Blue | `#3F8CFA` | Tech-division materials / product UI |
| Data Violet | `#A85CF6` | Data-division materials / dashboards |

**Typography:** Space Grotesk (display: headlines, division names, wordmark), Inter (body: 16–18px, 1.5 line-height), IBM Plex Mono (labels, data tables, invoice line items, code) — loaded via Google Fonts.

**Logo system:** "Gate Mark" — a Z rebuilt as architecture (two horizontal pillar bars + a diagonal gradient "threshold beam"). Usage rules are explicit: gradient beam always runs low-left→high-right; never mirror, rotate, recolor the pillars, or reverse the gradient direction. Each division gets one accent color applied to its own lockup of the same mark — divisions are never mixed.

**Voice & tone:** Direct (lead with the number/finding), Plain (define jargon inline, once), Warm (write to a person). A tone-comparison table in the guide gives concrete before/after phrasing (e.g., "Due to unforeseen circumstances..." → "This is running two days late because of X. Here's the new date.").

**Applications shown:** business card (light + dark division variant), letterhead, email signature, social avatars (master + one per division), correct/incorrect usage examples.

## Assessment for future platform UI work

**RECOMMENDATION:** This is a genuinely usable, non-generic design system (defined tokens, explicit do/don't rules, a real voice guide) — do not replace or "improve" it when UI work eventually starts; implement against it. It currently exists only as a static marketing HTML file with inline CSS custom properties, not as a reusable design-token package, component library, or Tailwind/CSS-in-JS config — translating it into implementation-ready tokens is future work, not something to redesign.

**ASSUMPTION:** The guide is labeled "V1 — 2026" with no revision history beyond that; treat it as authoritative-until-superseded rather than final in perpetuity.

**OPEN QUESTION:** No wireframes, mockups, or UX flows exist yet for any of the planned digital-platform screens (client portal, admin, public site). The brand guide is visual-identity-only, not product UX.
