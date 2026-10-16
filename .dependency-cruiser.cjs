/**
 * Boundaries of the e-learning workspace (README.md "Boundaries"):
 *
 *   frontend/, worker/  -X->  backend/   they share the API's contract and
 *   worker/             -X->  frontend/  the database schema, never code
 *   backend/            -X->  frontend/, worker/
 *   packages/*, config/ -X->  any app, tests/, e2e/
 *   elearning-contracts -X->  other workspace packages (other products use it)
 *
 *   anything    -X->  ../website/   the website is another product;
 *   tests/contracts -->  ../website/packages/{website-contracts,brand-ui}/ only
 *   frontend/       -->  ../website/packages/brand-ui/ (the shared brand)
 *   anything    -X->  ../legacy/    the frozen v1 portal is never a dependency
 *
 * Run: pnpm lint:boundaries (CI runs it on every push and pull request).
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
// The website, by relative path or as an installed package (a file:
// dependency is copied into node_modules/.pnpm/@zgate+<name>...).
const WEBSITE = "^\\.\\./website/|@zgate[/+](website-|cms-contracts|brand-ui)";
const WEBSITE_CONTRACTS =
  "^\\.\\./website/packages/(website-contracts|brand-ui)/|@zgate[/+](website-contracts|brand-ui)";
const WEBSITE_BRAND = "^\\.\\./website/packages/brand-ui/|@zgate[/+]brand-ui";

module.exports = {
  forbidden: [
    {
      name: "no-other-product",
      comment:
        "The website is a separate product. Only tests/contracts may use its contract packages, and the frontend its brand package; nothing here imports its apps.",
      severity: "error",
      from: { pathNot: "^(tests/contracts|frontend)/" },
      to: { path: WEBSITE },
    },
    {
      name: "contract-tests-use-only-website-contract-packages",
      comment:
        "Contract tests check the website's published contracts (@zgate/website-contracts, @zgate/brand-ui), not its implementation.",
      severity: "error",
      from: { path: "^tests/contracts/" },
      to: { path: WEBSITE, pathNot: WEBSITE_CONTRACTS },
    },
    {
      name: "frontend-uses-only-the-website-brand",
      comment: "The e-learning frontend may share the brand package, nothing else of the website.",
      severity: "error",
      from: { path: "^frontend/" },
      to: { path: WEBSITE, pathNot: WEBSITE_BRAND },
    },
    {
      name: "nothing-imports-legacy",
      comment: "legacy/ops is frozen. Nothing may depend on it.",
      severity: "error",
      from: {},
      to: { path: "^\\.\\./legacy/" },
    },
    {
      name: "worker-must-not-import-backend",
      comment:
        "The worker and the API share the database schema, not code. Put shared code in packages/ instead.",
      severity: "error",
      from: { path: "^worker/" },
      to: { path: "^backend/" },
    },
    {
      name: "frontend-must-not-import-backend",
      comment:
        "The frontend talks to the API over HTTP (/api on the same origin), never its source.",
      severity: "error",
      from: { path: "^frontend/" },
      to: { path: "^(backend|worker)/" },
    },
    {
      name: "backend-must-not-import-frontend-or-worker",
      comment: "The API never depends on the frontend or the worker.",
      severity: "error",
      from: { path: "^backend/" },
      to: { path: "^(frontend|worker)/" },
    },
    {
      name: "packages-must-not-import-apps",
      comment:
        "Packages are used by the apps (and by other products' contract tests), so they can't depend on an app, the tests or the journeys.",
      severity: "error",
      from: { path: "^(packages|config)/" },
      to: { path: "^(frontend|backend|worker|tests|e2e)/" },
    },
    {
      name: "contracts-stay-self-contained",
      comment:
        "@zgate/elearning-contracts is used by other products: it may use only its own files and npm dependencies.",
      severity: "error",
      from: { path: "^packages/elearning-contracts/src/" },
      to: { path: "^(packages/(?!elearning-contracts/)|config/)" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: {
      path: "(^|/)(\\.next|coverage|test-results|playwright-report|storage)/|^(packages/[^/]+|config|backend|worker)/dist/",
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"],
    },
  },
};
