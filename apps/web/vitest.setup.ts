import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Vitest doesn't expose `afterEach` as a global by default, so React
// Testing Library's auto-cleanup registration never fires - without
// this, each test's render() stacks on top of the previous one.
afterEach(() => {
  cleanup();
});
