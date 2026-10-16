// The one js-yaml function the OpenAPI check uses (js-yaml ships no types,
// and @types/js-yaml isn't otherwise in the lockfile).
declare module "js-yaml" {
  export function load(input: string): unknown;
}
