/**
 * Every string of approved copy on this site lives here, sourced
 * verbatim (or near-verbatim, noted where trimmed for length) from the
 * approved business documents. Pages import from this file rather than
 * hand-writing marketing copy — this is what "use approved content, do
 * not invent" means in practice. Source doc for each field is cited in
 * a comment; nothing here is written freehand.
 */

export const company = {
  legalName: "Z-GATE LTD",
  tradingName: "Z-GATE Solution",
  motto: "Where Business Meets Technology",
  // docs/business/BUSINESS_ALIGNMENT.md — confirmed correct, NOT the
  // brand guide's "Kigali Heights" mockup address.
  registeredAddress: "Inyarurembo, Kiyovu, Nyarugenge, Kigali, Rwanda",
  // Business Project Development Report — the real registered contact,
  // not the brand guide's zgate.co mockup.
  email: "info@zgaterw.com",
  phone: "+250 792 957 513",
} as const;

// Mission/Vision doc, "Elevator Pitch (short paragraph)" — verbatim.
export const elevatorPitch =
  "Most businesses hire a tax consultant, a trainer, a developer, and a data analyst separately — and spend half their time translating between them. Z-GATE Solution puts all four under one roof. Advisory keeps the business compliant and financially sound. Academy builds the skills the team needs to run it. Tech builds the systems it runs on. Data tells you, in numbers, whether any of it is working. One gate, four rooms, no translation lost between them.";

// Mission/Vision doc, "About Z-GATE Solution (long form)" — verbatim.
export const aboutLongForm = [
  "Z-GATE Solution was built on a simple observation: the businesses that struggle most aren't the ones with bad ideas — they're the ones whose finances, people, technology, and data all live in different places, run by different vendors, none of whom talk to each other.",
  "A gate is the one point where two different worlds agree to meet. That's the idea the company is named for. On one side sits the discipline of business — tax law, compliance, financial planning, professional skill. On the other sits technology — software, systems, data, automation. Most companies make a client walk back and forth between the two. Z-GATE puts both sides of that gate under one roof, as four divisions that already speak to each other.",
  "A client doesn't hire four vendors and manage the seams themselves. They come through one gate, and the four rooms on the other side already know why they're there.",
] as const;

// Mission/Vision doc, "Mission" and "Vision" — verbatim.
export const mission =
  "To be the single point of entry where a business's financial discipline, its people's skills, its technology, and its data stop operating as separate projects and start operating as one system.";
export const vision =
  'A future where a growing business never has to choose between "get good advice," "train our people," "build the technology," and "understand our numbers" — because all four are one relationship, one standard of quality, and one team that already knows the business.';

// Mission/Vision doc, "Values" — verbatim.
export const values = [
  {
    name: "Threshold, not silo",
    body: "A client is never handed off and forgotten. Advisory, Academy, Tech, and Data share context, so a recommendation made in one room is already understood in the other three.",
  },
  {
    name: "Precision over polish",
    body: "In tax, in code, in a training curriculum, in a dashboard — a number that's wrong or a fact that's rounded off is a bigger failure than a page that isn't pretty. Get it right before making it look good.",
  },
  {
    name: "Warm engineering",
    body: "Technical work done for a person, not around them. Every deliverable — a filing, a course, a build, a report — is written and explained so the person receiving it actually understands what changed and why.",
  },
] as const;

// Mission/Vision doc, "Boilerplate" — verbatim.
export const boilerplate =
  "Z-GATE Solution is a business group built around one idea: a company's finances, people, technology, and data shouldn't be run by four separate vendors. Through its four divisions — Advisory, Academy, Tech, and Data — Z-GATE gives businesses one point of entry for tax and consulting, professional training, technology solutions, and data analytics. Where Business Meets Technology.";

export type DivisionSlug = "advisory" | "academy" | "tech" | "data";

export interface Division {
  slug: DivisionSlug;
  name: string;
  shortName: string;
  colorVar: string;
  mission: string;
  about: string;
  // "What's included" — from each division's SLA Service Schedule scope
  // list (Client SLA Template, Part 2), not invented.
  included: string[];
  // docs/marketing/MESSAGING_FRAMEWORK.md's per-page Proof/Objection
  // fields — only real, sourced commitments, never a fabricated result
  // (docs/marketing/MARKETING_STRATEGY.md's proof strategy).
  proof: string;
  objection: { question: string; answer: string };
}

// Mission/Vision doc, "Division Copy" (mission + about) + Client SLA
// Template Part 2 (scope of services per Schedule) for "included".
export const divisions: Division[] = [
  {
    slug: "advisory",
    name: "Z-GATE Advisory",
    shortName: "Advisory",
    colorVar: "var(--advisory)",
    mission:
      "To keep a business compliant, tax-efficient, and financially sound, so leadership can make decisions on solid ground instead of guesswork.",
    about:
      "Z-GATE Advisory handles the parts of the business that don't forgive a mistake — tax filings, compliance, financial structuring, business consulting. The work is judged on one standard: is the number right, and is the business protected. Advisory clients get direct answers, not hedged ones, and a filing calendar they never have to chase.",
    included: [
      "Tax representation and advisory before the Rwanda Revenue Authority (RRA)",
      "Preparation and filing of personal and business income tax returns",
      "EBM (Electronic Billing Machine) setup support and ongoing compliance monitoring",
      "Monthly bookkeeping and recording of commercial transactions",
      "Business and management advisory on request",
    ],
    proof:
      "Advisory is Z-GATE's registered main business activity — tax representation and advisory before the Rwanda Revenue Authority. Our published service commitments include filing at least 2 business days ahead of any statutory deadline and responding to an urgent compliance issue within 4 business hours.",
    objection: {
      question: "Can I afford ongoing help?",
      answer:
        "Weigh it against the cost of getting EBM or VAT wrong. A retainer is a fixed, predictable cost; a missed filing isn't.",
    },
  },
  {
    slug: "academy",
    name: "Z-GATE Academy",
    shortName: "Academy",
    colorVar: "var(--academy)",
    mission:
      "To build the specific, usable skills a team needs to do the job in front of them — not a certificate for the wall, but a capability the business can point to.",
    about:
      "Z-GATE Academy runs professional training built around real outputs: a team that ships its first project, closes its first deal differently, or reads its first financial statement correctly, before the course ends. Curricula are built with Advisory, Tech, and Data, so training reflects the actual tools and standards a client's business already uses.",
    included: [
      "Delivery of the agreed course(s) per the published curriculum and schedule",
      "Learner enrollment, attendance tracking, and progress assessment",
      "Certificate issuance on successful course completion",
    ],
    proof:
      "Our first two courses are built directly from Advisory's own anonymized client casework, not generic material — real compliance problems SME owners actually bring in.",
    objection: {
      question: "Will this certificate mean anything to an employer?",
      answer:
        "We don't have an employer-verification track record yet — what we can promise is a curriculum built from real work, not slides. See each course's outline before you enroll.",
    },
  },
  {
    slug: "tech",
    name: "Z-GATE Tech",
    shortName: "Tech",
    colorVar: "var(--tech)",
    mission:
      "To build the systems a business runs on — reliable, maintainable, and built for the business it's actually serving, not a generic template.",
    about:
      "Z-GATE Tech designs and builds the software, infrastructure, and automation that let the rest of a client's business move faster. Every system is built with a plain-language explanation of what it does and how to run it — nothing shipped as a black box.",
    included: [
      "Design, development, and maintenance of software, systems, or web applications per the agreed project brief",
      "Onsite or remote management of the Client's computer systems and data-processing facilities, where contracted",
      "Hosting and infrastructure support for systems Z-GATE builds or manages",
    ],
    proof:
      "Our published support commitments: 2-hour first response on a critical outage, 99% monthly uptime target. This very site and Advisory's own client portal are built by the same team — an internal reference before an external sale.",
    objection: {
      question: "Do you have external Tech clients yet?",
      answer:
        "Tech is proving itself internally first, on Z-GATE's own systems, before taking on external client work — the same discipline we'd apply to any client's build.",
    },
  },
  {
    slug: "data",
    name: "Z-GATE Data",
    shortName: "Data",
    colorVar: "var(--data)",
    mission:
      'To turn what a business already has — transactions, operations, training records, systems logs — into a clear, honest answer to "is this working."',
    about:
      "Z-GATE Data builds the dashboards, reports, and analysis that tell leadership what's actually happening, not what looks good in a slide. Because Data sits alongside Advisory, Academy, and Tech, its numbers are built on the business's real financial, training, and system data — not a disconnected export.",
    included: [
      "Data entry and data processing from the Client's records into an agreed format",
      "Standard reporting and dashboard delivery on the agreed cadence",
      "Ad hoc analysis on request, quoted separately if outside the retainer scope",
    ],
    proof:
      "Our published accuracy target is 99.5%, verified by sample audit before delivery. Reports are shared only through access-controlled channels — never open links or unsecured email.",
    objection: {
      question: "Will my data be mixed with anyone else's?",
      answer:
        "No. We don't use one client's data to build or benchmark another client's work without written consent.",
    },
  },
];

export function getDivision(slug: DivisionSlug): Division {
  const division = divisions.find((d) => d.slug === slug);
  if (!division) {
    throw new Error(`Unknown division: ${slug}`);
  }
  return division;
}

// Academy Course Curriculum — real, approved course details (not
// invented pricing/scheduling).
export const academyCourses = [
  {
    name: "Tax & Bookkeeping Fundamentals for Small Business Owners",
    audience: "SME owners and staff; no prior accounting background required",
    duration: "4 weeks — 8 sessions, 1.5 hrs each",
    fee: "RWF 40,000 per learner",
  },
  {
    name: "EBM & Digital Invoicing Mastery",
    audience: "SME owners and staff who issue or are required to issue EBM receipts",
    duration: "2 weeks — 4 sessions, 1.5 hrs each",
    fee: "RWF 40,000 per learner",
  },
] as const;
